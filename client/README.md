# weCare client

The React/Vite frontend for weCare: a privacy-conscious care companion for people
living with dementia and their caregivers.

The API lives in the sibling [`server`](../server) folder and is deployed
separately. This folder is self-contained: it has its own `package.json`,
`.gitignore`, `Dockerfile` and `.env.example`.

## Scripts

- `npm run dev` — start the Vite development server.
- `npm run build` — create the production bundle in `dist`.
- `npm run lint` — run ESLint.
- `npm run preview` — preview the production bundle locally.

## Configuration

Copy `.env.example` to `.env`:

- `VITE_API_URL` — base URL of the API. Leave it **empty** when nginx serves the
  app and proxies `/api` to the API (the default in the Docker image). Set it to
  the API's public origin when the two are deployed to different sites, and add
  that origin to the API's `CORS_ORIGIN`.
- `VITE_API_PROXY_TARGET` — the API the Vite dev server proxies `/api` to
  (default `http://localhost:3000`).

## Docker

```bash
cp .env.example .env
docker build -t wecare/web .
docker run --rm -p 8080:8080 wecare/web
```

The image builds the bundle and serves it with nginx:
`nginx.conf` falls back to `index.html` for client-side routes and proxies `/api`
to the host named in that file. When the API lives on another site, set
`--build-arg VITE_API_URL=https://api.example.com` and point the proxy there.

## Deploy

Any static host works — upload the contents of `dist` after running
`npm run build` with the correct `VITE_API_URL`. Client-side routes need a
catch-all rewrite to `index.html`, which the bundled nginx config already does.
