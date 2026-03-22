export type ValidationState = "idle" | "valid" | "invalid" | "ignored";
export type TableRow = { field: string; value: unknown };

export type DecodeResult = {
  headerRows: TableRow[];
  payloadRows: TableRow[];
  signatureRows: TableRow[];
  validationState: ValidationState;
  validationMessages: string[];
};

type HmacAlgorithm = "HS256" | "HS384" | "HS512";

type DecodeInput = {
  token: string;
  sharedSecret: string;
  nowEpochSeconds?: number;
};

function buildRows(source: unknown): TableRow[] {
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return [{ field: "value", value: source ?? "N/A" }];
  }

  const entries = Object.entries(source as Record<string, unknown>);
  if (!entries.length) {
    return [{ field: "(empty)", value: "" }];
  }

  return entries.map(([field, value]) => ({ field, value }));
}

function decodeBase64(input: string): string {
  if (typeof globalThis.atob === "function") {
    return globalThis.atob(input);
  }

  return Buffer.from(input, "base64").toString("binary");
}

function encodeBase64(input: string): string {
  if (typeof globalThis.btoa === "function") {
    return globalThis.btoa(input);
  }

  return Buffer.from(input, "binary").toString("base64");
}

function decodeBase64UrlSegment(segment: string): string {
  let normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
  const remainder = normalized.length % 4;
  if (remainder > 0) {
    normalized = normalized.padEnd(normalized.length + (4 - remainder), "=");
  }

  return decodeBase64(normalized);
}

function parseJsonSegment(
  segment: string,
  section: string,
): Record<string, unknown> {
  try {
    return JSON.parse(decodeBase64UrlSegment(segment)) as Record<
      string,
      unknown
    >;
  } catch {
    throw new Error(`${section} segment is not valid Base64URL JSON.`);
  }
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return encodeBase64(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function secureCompare(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }

  let mismatch = 0;
  for (let i = 0; i < left.length; i += 1) {
    mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }

  return mismatch === 0;
}

async function verifyHmacSignature(
  algorithm: HmacAlgorithm,
  signingInput: string,
  providedSignature: string,
  secret: string,
): Promise<boolean> {
  const algoMap: Record<HmacAlgorithm, string> = {
    HS256: "SHA-256",
    HS384: "SHA-384",
    HS512: "SHA-512",
  };

  if (!globalThis.crypto?.subtle) {
    throw new Error("Web Crypto API is not available in this runtime.");
  }

  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: algoMap[algorithm] },
    false,
    ["sign"],
  );

  const signature = await globalThis.crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signingInput),
  );
  const expected = bytesToBase64Url(new Uint8Array(signature));

  return secureCompare(expected, providedSignature);
}

export async function decodeAndValidateJwt(
  input: DecodeInput,
): Promise<DecodeResult> {
  const token = input.token.replace(/\s/g, "");

  if (!token) {
    return {
      headerRows: [],
      payloadRows: [],
      signatureRows: [],
      validationState: "idle",
      validationMessages: ["Validation runs automatically while you type."],
    };
  }

  const segments = token.split(".");
  if (segments.length !== 3) {
    return {
      headerRows: [
        {
          field: "error",
          value: "Header cannot be parsed until token has three segments.",
        },
      ],
      payloadRows: [
        {
          field: "error",
          value: "Claims cannot be parsed until token has three segments.",
        },
      ],
      signatureRows: [{ field: "segment-count", value: segments.length }],
      validationState: "invalid",
      validationMessages: [
        "Token must have exactly three segments separated by dots.",
      ],
    };
  }

  const headerSegment = segments[0] ?? "";
  const payloadSegment = segments[1] ?? "";
  const signatureSegment = segments[2] ?? "";
  const messages: string[] = [];
  let isValid = true;
  let validationIgnored = false;

  try {
    const header = parseJsonSegment(headerSegment, "Header");
    const payload = parseJsonSegment(payloadSegment, "Payload");

    const headerRows = buildRows(header);
    const payloadRows = buildRows(payload);

    const algorithm = typeof header.alg === "string" ? header.alg : "";
    const now = input.nowEpochSeconds ?? Math.floor(Date.now() / 1000);

    if (typeof payload.exp === "number" && now >= payload.exp) {
      isValid = false;
      messages.push("Token has expired (exp claim is in the past).");
    }

    if (typeof payload.nbf === "number" && now < payload.nbf) {
      isValid = false;
      messages.push("Token is not active yet (nbf claim is in the future).");
    }

    if (typeof payload.iat === "number" && payload.iat > now + 60) {
      isValid = false;
      messages.push(
        "Token appears to be issued in the future (iat claim check).",
      );
    }

    const signatureRows: TableRow[] = [
      { field: "algorithm", value: algorithm || "(missing)" },
      { field: "segment-present", value: signatureSegment ? "yes" : "no" },
      { field: "signature-length", value: signatureSegment.length },
    ];

    if (algorithm === "none") {
      if (signatureSegment) {
        isValid = false;
        messages.push(
          "alg=none tokens should not contain a signature segment.",
        );
      } else {
        messages.push(
          "alg=none token accepted without signature verification.",
        );
      }
      signatureRows.push({ field: "verified", value: "not required" });
    } else if (
      algorithm === "HS256" ||
      algorithm === "HS384" ||
      algorithm === "HS512"
    ) {
      if (!input.sharedSecret) {
        validationIgnored = true;
        messages.push(
          `Signature verification ignored for ${algorithm} because no shared secret was provided.`,
        );
        signatureRows.push({
          field: "verified",
          value: "no (missing shared secret)",
        });
      } else {
        const signingInput = `${headerSegment}.${payloadSegment}`;
        const verified = await verifyHmacSignature(
          algorithm,
          signingInput,
          signatureSegment,
          input.sharedSecret,
        );

        signatureRows.push({
          field: "verified",
          value: verified ? "yes" : "no",
        });
        if (!verified) {
          isValid = false;
          messages.push(
            "Signature verification failed for provided shared secret.",
          );
        }
      }
    } else {
      isValid = false;
      messages.push(
        `Unsupported algorithm '${algorithm || "(missing)"}'. Only HS256, HS384, HS512, and none are checked client-side here.`,
      );
      signatureRows.push({
        field: "verified",
        value: "no (unsupported algorithm)",
      });
    }

    if (!messages.length) {
      messages.push("Token structure and signature checks passed.");
    }

    return {
      headerRows,
      payloadRows,
      signatureRows,
      validationState: !isValid
        ? "invalid"
        : validationIgnored
          ? "ignored"
          : "valid",
      validationMessages: messages,
    };
  } catch (error) {
    return {
      headerRows: [
        { field: "error", value: "Unable to parse header segment." },
      ],
      payloadRows: [
        { field: "error", value: "Unable to parse payload segment." },
      ],
      signatureRows: [{ field: "verified", value: "no" }],
      validationState: "invalid",
      validationMessages: [
        error instanceof Error ? error.message : "Token decode failed.",
      ],
    };
  }
}
