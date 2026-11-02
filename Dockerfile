FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build:next

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
RUN addgroup -S hal && adduser -S hal -G hal
COPY --from=build --chown=hal:hal /app/.next/standalone ./
COPY --from=build --chown=hal:hal /app/.next/static ./.next/static
COPY --from=build --chown=hal:hal /app/public ./public
USER hal
EXPOSE 3000
CMD ["node", "server.js"]
