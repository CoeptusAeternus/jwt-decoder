FROM node:22-alpine AS base

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps

COPY package.json pnpm-workspace.yaml ./
RUN pnpm install --no-frozen-lockfile --ignore-scripts
COPY . .
RUN pnpm run postinstall

FROM deps AS test

ENV CI=true

RUN pnpm test

FROM deps AS development


EXPOSE 9000

CMD ["pnpm", "dev", "--", "--host", "0.0.0.0", "--port", "9000", "--no-open"]

FROM test AS build

RUN pnpm build

FROM nginx:1.27-alpine AS production

COPY --from=build /app/dist/spa /usr/share/nginx/html

EXPOSE 80
