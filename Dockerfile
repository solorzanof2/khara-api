FROM node:24.15.0-bookworm-slim AS build

WORKDIR /app

# Native optional dependencies must be built for Linux, never copied from the host.
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@10.24.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod=false

COPY tsconfig.json tsconfig.build.json ./
COPY src/ ./src/
RUN pnpm run build && pnpm prune --prod

FROM node:24.15.0-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production \
    APP_STAGE=production \
    APP_PORT=3000

COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/node_modules/ ./node_modules/
COPY --from=build --chown=node:node /app/dist/ ./dist/
# Runtime migration discovery uses /app/migrations. Do not copy user/credential seeds.
COPY --chown=node:node migrations/01-initial-schema.sql migrations/02-indexation.sql migrations/03-add-roles.sql migrations/06-create-invitations-table.sql ./migrations/

USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
