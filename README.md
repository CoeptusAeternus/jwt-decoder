# JWT Decoder

JWT Decoder is a browser-based utility for inspecting JSON Web Tokens (JWTs).
It decodes token segments client-side so you can quickly review header and payload claims without sending tokens to a backend service.

## Live App

Use the app online:

- https://coeptusaeternus.github.io/jwt-decoder/

## Container Image (GHCR)

Pull published images from GitHub Container Registry:

```bash
docker pull ghcr.io/coeptusaeternus/jwt-decoder:latest
docker run --rm -p 8080:80 ghcr.io/coeptusaeternus/jwt-decoder:latest
```

Then open http://localhost:8080.

## Release Artifacts (Built HTML/JS)

Prebuilt static files (ZIP artifacts) are attached to each GitHub release.
Download them from:

- https://github.com/CoeptusAeternus/jwt-decoder/releases

Each release includes a `jwt-decoder-<tag>.zip` package containing the built HTML/JS files for local hosting or deployment to any static web server.

## Run Dev Server Locally from Source

```bash
git clone https://github.com/CoeptusAeternus/jwt-decoder.git
cd jwt-decoder
yarn install
yarn dev
```

The development server runs at http://localhost:9000.
