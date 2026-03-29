import { describe, expect, it } from "vitest";
import { decodeAndValidateJwt } from "./jwt";

function toBase64Url(input: string): string {
  return Buffer.from(input, "utf-8").toString("base64url");
}

function encodeSegment(value: Record<string, unknown>): string {
  return toBase64Url(JSON.stringify(value));
}

function createNoneToken(
  header: Record<string, unknown>,
  payload: Record<string, unknown>,
  signature = "",
): string {
  return `${encodeSegment(header)}.${encodeSegment(payload)}.${signature}`;
}

async function createHmacToken(
  algorithm: "HS256" | "HS384" | "HS512",
  payload: Record<string, unknown>,
  secret: string,
): Promise<string> {
  const header = { alg: algorithm, typ: "JWT" };
  const headerSegment = encodeSegment(header);
  const payloadSegment = encodeSegment(payload);
  const signingInput = `${headerSegment}.${payloadSegment}`;

  const hashMap: Record<"HS256" | "HS384" | "HS512", string> = {
    HS256: "SHA-256",
    HS384: "SHA-384",
    HS512: "SHA-512",
  };

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: hashMap[algorithm] },
    false,
    ["sign"],
  );
  const raw = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signingInput),
  );
  const signature = Buffer.from(new Uint8Array(raw)).toString("base64url");

  return `${signingInput}.${signature}`;
}

function toPemPublicKey(spkiBytes: Uint8Array): string {
  const body = Buffer.from(spkiBytes).toString("base64");
  const lines = body.match(/.{1,64}/g) ?? [];
  return [
    "-----BEGIN PUBLIC KEY-----",
    ...lines,
    "-----END PUBLIC KEY-----",
  ].join("\n");
}

async function createRsaToken(
  algorithm: "RS256" | "RS384" | "RS512",
  payload: Record<string, unknown>,
): Promise<{ token: string; publicKeyPem: string }> {
  const header = { alg: algorithm, typ: "JWT" };
  const headerSegment = encodeSegment(header);
  const payloadSegment = encodeSegment(payload);
  const signingInput = `${headerSegment}.${payloadSegment}`;

  const hashMap: Record<"RS256" | "RS384" | "RS512", string> = {
    RS256: "SHA-256",
    RS384: "SHA-384",
    RS512: "SHA-512",
  };

  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: hashMap[algorithm],
    },
    true,
    ["sign", "verify"],
  );

  const signatureRaw = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    keyPair.privateKey,
    new TextEncoder().encode(signingInput),
  );
  const signature = Buffer.from(new Uint8Array(signatureRaw)).toString(
    "base64url",
  );

  const publicKeyRaw = await crypto.subtle.exportKey("spki", keyPair.publicKey);
  const publicKeyPem = toPemPublicKey(new Uint8Array(publicKeyRaw));

  return {
    token: `${signingInput}.${signature}`,
    publicKeyPem,
  };
}

describe("decodeAndValidateJwt", () => {
  it("returns idle state for empty input", async () => {
    const result = await decodeAndValidateJwt({
      token: "   ",
      sharedSecret: "",
      publicKey: "",
    });

    expect(result.validationState).toBe("idle");
    expect(result.headerRows).toEqual([]);
    expect(result.payloadRows).toEqual([]);
    expect(result.signatureRows).toEqual([]);
  });

  it("decodes alg=none tokens and marks them valid when signature is empty", async () => {
    const token = createNoneToken(
      { alg: "none", typ: "JWT" },
      { sub: "alice", role: "admin" },
    );

    const result = await decodeAndValidateJwt({
      token,
      sharedSecret: "",
      publicKey: "",
    });

    expect(result.validationState).toBe("valid");
    expect(result.validationMessages).toContain(
      "alg=none token accepted without signature verification.",
    );
    expect(result.headerRows).toContainEqual({ field: "alg", value: "none" });
    expect(result.payloadRows).toContainEqual({ field: "sub", value: "alice" });
  });

  it("rejects tokens that do not have three segments", async () => {
    const result = await decodeAndValidateJwt({
      token: "abc.def",
      sharedSecret: "",
      publicKey: "",
    });

    expect(result.validationState).toBe("invalid");
    expect(result.validationMessages).toEqual([
      "Token must have exactly three segments separated by dots.",
    ]);
    expect(result.signatureRows).toContainEqual({
      field: "segment-count",
      value: 2,
    });
  });

  it("returns invalid when payload is not base64url json", async () => {
    const token = `${encodeSegment({ alg: "none" })}.not-json.`;
    const result = await decodeAndValidateJwt({
      token,
      sharedSecret: "",
      publicKey: "",
    });

    expect(result.validationState).toBe("invalid");
    expect(result.validationMessages).toEqual([
      "Payload segment is not valid Base64URL JSON.",
    ]);
  });

  it("marks HS256 validation as ignored when secret is missing", async () => {
    const token = await createHmacToken(
      "HS256",
      { sub: "alice" },
      "top-secret",
    );

    const result = await decodeAndValidateJwt({
      token,
      sharedSecret: "",
      publicKey: "",
    });

    expect(result.validationState).toBe("ignored");
    expect(result.validationMessages).toContain(
      "Signature verification ignored for HS256 because no shared secret was provided.",
    );
  });

  it("validates HS256 signature with the correct secret and rejects wrong secret", async () => {
    const token = await createHmacToken(
      "HS256",
      { sub: "alice" },
      "top-secret",
    );

    const validResult = await decodeAndValidateJwt({
      token,
      sharedSecret: "top-secret",
      publicKey: "",
    });
    expect(validResult.validationState).toBe("valid");

    const invalidResult = await decodeAndValidateJwt({
      token,
      sharedSecret: "wrong-secret",
      publicKey: "",
    });
    expect(invalidResult.validationState).toBe("invalid");
    expect(invalidResult.validationMessages).toContain(
      "Signature verification failed for provided shared secret.",
    );
  });

  it("fails temporal checks for exp, nbf, and iat as expected", async () => {
    const now = 1_800_000_000;
    const token = createNoneToken(
      { alg: "none" },
      {
        exp: now - 1,
        nbf: now + 1,
        iat: now + 120,
      },
    );

    const result = await decodeAndValidateJwt({
      token,
      sharedSecret: "",
      publicKey: "",
      nowEpochSeconds: now,
    });

    expect(result.validationState).toBe("invalid");
    expect(result.validationMessages).toContain(
      "Token has expired (exp claim is in the past).",
    );
    expect(result.validationMessages).toContain(
      "Token is not active yet (nbf claim is in the future).",
    );
    expect(result.validationMessages).toContain(
      "Token appears to be issued in the future (iat claim check).",
    );
  });

  it.each(["RS256", "RS384", "RS512"] as const)(
    "validates %s signatures with the matching public key",
    async (algorithm) => {
      const { token, publicKeyPem } = await createRsaToken(algorithm, {
        sub: "alice",
      });

      const validResult = await decodeAndValidateJwt({
        token,
        sharedSecret: "",
        publicKey: publicKeyPem,
      });
      expect(validResult.validationState).toBe("valid");

      const invalidResult = await decodeAndValidateJwt({
        token,
        sharedSecret: "",
        publicKey:
          "-----BEGIN PUBLIC KEY-----\ninvalid\n-----END PUBLIC KEY-----",
      });
      expect(invalidResult.validationState).toBe("invalid");
      expect(invalidResult.validationMessages).toContain(
        "Public key could not be parsed or imported for RSA signature verification.",
      );
    },
  );

  it("marks RS256 validation as ignored when public key is missing", async () => {
    const { token } = await createRsaToken("RS256", { sub: "alice" });

    const result = await decodeAndValidateJwt({
      token,
      sharedSecret: "",
      publicKey: "",
    });

    expect(result.validationState).toBe("ignored");
    expect(result.validationMessages).toContain(
      "Signature verification ignored for RS256 because no public key was provided.",
    );
  });
});
