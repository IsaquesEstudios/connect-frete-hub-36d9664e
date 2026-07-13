# Multi-stage build for TanStack Start (Node server preset)
# Deployed on any Node host: VPS, Coolify, Docker, Fly, Railway, etc.

FROM oven/bun:1.2 AS deps
WORKDIR /app
COPY package.json bun.lock* bunfig.toml* ./
RUN bun install --frozen-lockfile || bun install

FROM oven/bun:1.2 AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Nitro builds a standalone Node server into .output/
RUN bun run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Only the Nitro output is needed at runtime — it bundles its own deps.
COPY --from=build /app/.output ./.output

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
