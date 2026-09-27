FROM node:24-bookworm-slim AS base

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# Development: source code is bind-mounted; node_modules stays inside the container.
FROM base AS dev

COPY package.json package-lock.json ./
RUN npm ci

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]

# Build: the build never calls Laravel, so no API URL is needed here.
FROM base AS build

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production (Railway): only the standalone server and its static files.
FROM base AS prod

ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000

# The ISR cache is written under .next at runtime, so the files belong to the runtime user.
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static

USER node

EXPOSE 3000

CMD ["node", "server.js"]
