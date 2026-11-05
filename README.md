# weCare

weCare is a dementia-support companion for patients and caregivers. It brings daily planning, shared care notes, reminders, step-by-step routines, a private memory album, patient-controlled location sharing, local weather, and a simple memory game together in one place.

## What works

- Patient and caregiver accounts with role-checked routes and server-side authorization.
- A caregiver invitation code that lets a patient explicitly connect their account.
- Private reminders, routines, and memory photos shared only between connected accounts.
- A shared care-notes space for practical handoff updates, preferences, and conversation ideas.
- A patient daily plan that brings reminders and routine steps together. Completion progress is saved to the patient's account, so a connected caregiver's dashboard shows how the day is going.
- Patient-controlled location sharing. A patient must request each share; caregivers can see the shared location for up to 30 minutes. This is not background tracking or an emergency monitoring service.
- Weather lookup through Open-Meteo; no weather API key is required.
- Image uploads restricted to common image types and a 5 MB maximum.
- Landing-page and dashboard photography is loaded from Unsplash; an internet connection is required to display those photos.

## Run locally

Requirements: Node.js 20.19+ (or 22.12+) and MongoDB.

1. Copy `server/.env.example` to `server/.env`, set `MONGODB_URI`, and replace `JWT_SECRET` with a random value of at least 32 characters.
2. In one terminal, run:

   ```sh
   cd server
   npm install
   npm run dev
   ```

3. In a second terminal, run:

   ```sh
   cd client
   npm install
   npm run dev
   ```

4. Open the Vite URL (usually `http://localhost:5173`). The Vite development server proxies `/api` requests to `http://localhost:3000`; set `VITE_API_PROXY_TARGET` in `client/.env` if your API runs elsewhere.

### Try it without MongoDB

Run `npm run demo` in `server` to start the API with an in-memory store. Every account, reminder, routine, note, and photo is cleared when the process stops, so use it only for local demos and reviews.

## Deploy with Docker Compose

The repository ships two images and a Compose stack that runs MongoDB, the API, and the nginx-served client on one origin:

```sh
cp .env.example .env
# put a long random value in JWT_SECRET, then:
docker compose up --build -d
```

Open <http://localhost:8080>. nginx proxies `/api` to the API container, so there is no CORS setup and the session cookie stays first-party. Data lives in the `mongo-data` and `uploads` volumes; `docker compose down -v` deletes both.

| Image | Dockerfile | Serves |
| --- | --- | --- |
| `wecare/api` | `server/Dockerfile` | Express API on port 3000 |
| `wecare/web` | `client/Dockerfile` | Built React app + `/api` proxy on port 8080 |

Compose sets `COOKIE_SECURE=false` because it serves plain HTTP locally. On any HTTPS deployment leave it unset so the session cookie is `Secure`.

Build and push the images for a registry with:

```sh
REGISTRY=registry.example.com/wecare
docker build -t "$REGISTRY/api:latest" server
docker build --build-arg VITE_API_URL= -t "$REGISTRY/web:latest" client
docker push "$REGISTRY/api:latest" && docker push "$REGISTRY/web:latest"
```

## Deploy to Kubernetes

`deploy/k8s` is a kustomization that creates a namespace (`wecare`), MongoDB with a persistent volume, the API with its uploads volume, the web deployment, and a TLS ingress. The API and web pods only become ready when they can actually serve traffic: `/api/ready` returns 503 until the database connection is established.

1. Push the two images (commands above) and point the kustomization at them if your registry differs:

   ```sh
   # deploy/k8s/kustomization.yaml
   images:
     - name: wecare/api
       newName: registry.example.com/wecare/api
       newTag: "1.0.0"
     - name: wecare/web
       newName: registry.example.com/wecare/web
       newTag: "1.0.0"
   ```

2. Set your domain in `deploy/k8s/configmap.yaml` (`CORS_ORIGIN`) and `deploy/k8s/ingress.yaml` (host and TLS secret).

3. Create the secret without writing values to disk:

   ```sh
   kubectl create namespace wecare --dry-run=client -o yaml | kubectl apply -f -
   kubectl -n wecare create secret generic wecare-secrets \
     --from-literal=JWT_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" \
     --from-literal=MONGODB_URI="mongodb://mongo:27017/wecare"
   ```

4. Apply and wait:

   ```sh
   kubectl apply -k deploy/k8s
   kubectl -n wecare rollout status deploy/wecare-api
   kubectl -n wecare rollout status deploy/wecare-web
   ```

5. Point DNS at the ingress controller's address. For automated certificates, add `cert-manager.io/cluster-issuer: letsencrypt-prod` to the ingress annotations and set a real host.

What was created:

- `mongo` — single-replica StatefulSet plus a 10Gi claim. It is a self-contained database, not a highly available one: for production use a managed MongoDB, put its connection string in `MONGODB_URI`, and remove `mongo.yaml` from `kustomization.yaml`.
- `wecare-api` — one replica with a 5Gi uploads claim and `Recreate` strategy, because the photo volume is `ReadWriteOnce`. To run more replicas, move uploads to object storage first.
- `wecare-web` — two nginx replicas; the app is stateless.
- `wecare` ingress — TLS termination and a 6 MB body limit for photo uploads.
- Both deployments run as non-root with a read-only root filesystem, dropped capabilities, resource requests/limits, and startup/readiness/liveness probes.

The API must be reachable over HTTPS in production so the `Secure` session cookie is accepted; the ingress handles TLS. If you deliberately deploy without TLS, set `COOKIE_SECURE=false` in the API ConfigMap.

### Deploying to a platform instead

The images are ordinary Node and nginx containers. On a platform without Kubernetes, build `server` and `client` as separate services, set `VITE_API_URL` to the API's HTTPS URL ending in `/api` for the client build, and keep `CORS_ORIGIN` exact (comma-separated, no trailing slash). Set `COOKIE_SAME_SITE=none` when the client and API are on different sites. The API health endpoint is `GET /api/health`; use `GET /api/ready` for readiness checks. Attach persistent storage for `server/uploads` and configure the MongoDB allowlist with least-privilege credentials.

## Important safety and privacy notes

This app is not a medical device and does not provide diagnosis, treatment, continuous location tracking, or emergency response. Location is shared only after the patient presses the share button and grants browser permission. Do not rely on it for urgent safety needs. Caregivers should protect invitation codes, share care notes respectfully, and only connect with the patient's knowledge and consent. Daily-plan completion is saved to the patient's account and shown to their connected caregiver; it is never shown to anyone outside that care circle.

## Design references

The patient and caregiver experiences are informed by practical guidance on cognitive accessibility, flexible daily routines, communication, care-team coordination, and technology safety:

- [W3C Cognitive Accessibility Guidance](https://www.w3.org/WAI/WCAG2/supplemental/)
- [Alzheimer's Association: Daily Care Plan](https://www.alz.org/help-support/caregiving/daily-care/daily-care-plan)
- [Alzheimer's Association: Communication and Alzheimer's](https://www.alz.org/help-support/caregiving/daily-care/communications)
- [Alzheimer's Association: Creating Your Care Team](https://www.alz.org/help-support/caregiving/care-options/care-team-calendar)
- [Alzheimer's Association: Technology Safety for Older Adults](https://www.alz.org/help-support/caregiving/safety/technology-safety-older-adults)

## Project scripts

- Client: `npm run dev`, `npm run build`, `npm run lint`, `npm run preview`
- Server: `npm run dev`, `npm start`, `npm run demo`, `npm test`
- Containers: `docker compose up --build` (see [Deploy with Docker Compose](#deploy-with-docker-compose))
- Kubernetes: `kubectl apply -k deploy/k8s` (see [Deploy to Kubernetes](#deploy-to-kubernetes))
