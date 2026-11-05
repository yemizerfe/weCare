# syntax=docker/dockerfile:1

# weCare web client — build the Vite bundle, then serve it with nginx.
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# Empty means "same origin": nginx proxies /api to the API service, so the
# browser never makes a cross-site request and session cookies stay first-party.
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:1.27-alpine AS runtime

COPY nginx-main.conf /etc/nginx/nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1

# Skip the stock nginx entrypoint scripts: they try to rewrite the config at
# startup, which fails when the container root filesystem is read-only (the
# Kubernetes deployment runs it that way). Nothing here needs envsubst.
ENTRYPOINT []
CMD ["nginx", "-g", "daemon off;"]
