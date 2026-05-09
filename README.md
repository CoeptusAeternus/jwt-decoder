# JWT Decoder

JWT Decoder is a browser-based utility for inspecting JSON Web Tokens (JWTs).
It decodes token segments client-side so you can quickly review header and payload claims without sending tokens to a backend service.

## Live App

Use the app online:

- https://coeptusaeternus.github.io/jwt-decoder/

## Dev Container

This repository includes a Docker Compose development setup that runs the app inside a container instead of using a local Node.js installation.

Start the dev container with:

```bash
docker compose up --build
```

Then open http://localhost:9000.

The compose file mounts the source and config files into the container, while dependencies stay installed inside the image. That means there is no `node_modules` volume to manage.

If you change dependencies in `package.json`, rebuild the container so the image installs the updated packages again:

```bash
docker compose up --build
```

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

## Testing

Tests in this project are powered by Vitest.

### When Tests Run Automatically

The full test suite runs automatically in GitHub Actions CI:

- On every pull request

CI workflow file:

- `.github/workflows/ci.yml`

The CI job installs dependencies and runs:

```bash
yarn test
```

### Run Tests Manually

After installing dependencies, run the test suite locally with:

```bash
yarn test
```

If you use npm instead of Yarn, run:

```bash
npm run test
```

This executes all unit tests once in non-watch mode (`vitest run`).

### Run Tests using Docker

The Dockerfile contains a dedicated `test` stage that runs the Vitest suite during image build.

Build the test stage to run tests in an isolated container environment:

```bash
docker build --target test .
```

If tests fail, the build exits with a non-zero status.
If tests pass, the test stage finishes successfully.

Optionally tag the image while running tests:

```bash
docker build --target test -t jwt-decoder:test .
```

This is useful when you want containerized test execution without requiring Node.js tooling on your host machine.
