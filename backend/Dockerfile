# NullKey Backend
# WebSocket relay server – multi-stage Docker build

# ── Stage 1: Build ──
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund --loglevel=error

COPY tsconfig.json ./
COPY src/ src/
RUN npm run build

# ── Stage 2: Production ──
FROM node:20-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -S nullkey && adduser -S nullkey -G nullkey

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund --loglevel=error --omit=dev

COPY --from=builder /app/dist/ dist/

USER nullkey

EXPOSE 8080

ENV NODE_ENV=production

CMD ["node", "dist/server.js"]
