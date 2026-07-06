# NullKey Frontend
# Next.js static export served by nginx – multi-stage Docker build

# ── Stage 1: Build ──
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund --loglevel=error

COPY tsconfig.json tailwind.config.ts postcss.config.js next.config.js ./
COPY app/ app/
COPY components/ components/
COPY hooks/ hooks/
COPY services/ services/
COPY types/ types/
COPY utils/ utils/
COPY src/ src/
COPY public/ public/

# WebSocket URL is auto-detected from window.location at runtime (no build arg needed)
RUN npm run build

# ── Stage 2: Serve ──
FROM nginx:stable-alpine

COPY --from=builder /app/out/ /usr/share/nginx/html

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/nullkey.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
