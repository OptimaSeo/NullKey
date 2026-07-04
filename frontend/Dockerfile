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
COPY src/ src/

# WebSocket URL is auto-detected from window.location at runtime (no build arg needed)
RUN npm run build

# ── Stage 2: Serve ──
FROM nginx:stable-alpine

COPY --from=builder /app/out/ /usr/share/nginx/html

RUN rm /etc/nginx/conf.d/default.conf
COPY <<'NGINX' /etc/nginx/conf.d/nullkey.conf
server {
    listen       80;
    server_name  localhost;
    root         /usr/share/nginx/html;
    index        index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript image/svg+xml;
    gzip_min_length 256;

    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location /_next/static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /ws {
        proxy_pass http://backend:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400s;
    }

    location / {
        try_files $uri $uri/ /index.html;
        expires -1;
    }

    location ~ /\. {
        deny all;
    }
}
NGINX

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
