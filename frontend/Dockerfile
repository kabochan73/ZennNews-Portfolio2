FROM node:24-bookworm-slim AS base

WORKDIR /app

# Development: source code is bind-mounted; node_modules stays inside the container.
FROM base AS dev

COPY package.json package-lock.json ./
RUN npm ci

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]
