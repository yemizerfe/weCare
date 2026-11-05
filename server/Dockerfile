# weCare API — production image
FROM node:22-alpine AS deps

WORKDIR /app

# Install only production dependencies so the image stays small and never
# ships the in-memory demo store's dev dependencies.
COPY package.json package-lock.json ./
# bcrypt is a native module. Verifying the binding here makes a broken build
# fail at image-build time instead of at the first sign-in attempt.
RUN npm ci --omit=dev --no-audit --no-fund \
    && node -e "require('bcrypt').hashSync('build-check', 4)"

FROM node:22-alpine AS runtime

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app

# Run as the unprivileged user that ships with the official Node image.
RUN mkdir -p /app/uploads && chown -R node:node /app

COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node server.js ./
COPY --chown=node:node Models ./Models
# Tiny in-memory store, used only when the image is started with
# NODE_ENV=development and USE_IN_MEMORY_DB=true for a throwaway demo.
COPY --chown=node:node dev ./dev

USER node

EXPOSE 3000

# Liveness: the process is up. Readiness (database connected) is served by
# GET /api/ready and used by the orchestrator.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
