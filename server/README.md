# weCare

A privacy-conscious care companion that helps people living with dementia and their caregivers manage daily routines, reminders, care notes, memories, and temporary location sharing.

## Features

- **Patient & caregiver accounts** with role-based access control
- **Daily plans and reminders** for routines and activities
- **Shared care notes** between connected caregivers and patients
- **Private memory album** for photos and memories
- **Temporary location sharing** initiated and controlled by the patient
- **Weather information** through Open-Meteo
- **Memory game** for simple daily engagement
- Secure image uploads with file-type and size validation

## Tech Stack

**Frontend**
- React
- Vite
- Tailwind CSS

**Backend**
- Node.js
- Express
- REST API

**Database**
- MongoDB

**Infrastructure**
- Docker & Docker Compose
- Nginx
- Kubernetes

**Testing & APIs**
- Jest
- Open-Meteo
- Unsplash

## Architecture

```text
React / Vite
     │
     ▼
Express REST API
     │
     ▼
MongoDB

External Services
 ├── Open-Meteo
 └── Unsplash
```

## Security & Privacy

weCare is designed around privacy and explicit user consent.

- Server-side authorization and role validation
- Secure session-based authentication
- Private patient and caregiver data
- Patient-controlled location sharing
- No continuous background location tracking
- Restricted image uploads
- Secrets managed through environment variables
- Production containers run with restricted privileges

> `.env` files and application secrets must never be committed to the repository.

## Run Locally

### Requirements

- Node.js 20+
- MongoDB

### Backend

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

### Frontend

```bash
cd client
npm install
npm run dev
```

The application will be available through the frontend development server.

## Deployments

The two folders are self-contained and deploy independently: `client/` builds a
static bundle served by nginx, `server/` runs the Express API. Each has its own
`Dockerfile`, `.gitignore`, `.env.example` and `LICENSE`.

### Docker

```bash
cd server
cp .env.example .env      # set JWT_SECRET
docker compose up --build
```

`server/docker-compose.yml` runs the application together with its required
services and builds the web image from `../client`.

### Kubernetes

```bash
kubectl apply -k server/deploy/k8s
```

See `server/deploy/k8s/kustomization.yaml` for the prerequisites.

## Production

The production deployment uses containerized services and separates the frontend, API, database, and infrastructure configuration.

Production secrets should be provided through environment variables or the deployment platform's secret-management system.

## Project Structure

```text
weCare/
├── client/                    # React frontend (own Dockerfile, .gitignore)
│   ├── nginx.conf             # SPA fallback + /api proxy
│   └── .env.example
└── server/                    # Express API + MongoDB deployment
    ├── docker-compose.yml     # local full stack
    ├── deploy/k8s/            # cluster manifests
    └── .env.example
```

Nothing lives outside the two folders.

## Privacy Notice

weCare is a software project and is **not a medical device**. It does not provide medical diagnosis, treatment, emergency response, or continuous safety monitoring.

Location sharing is temporary and requires an explicit action from the patient.

## Status

**Production-ready portfolio project**

Built to demonstrate practical experience in:

- Backend API development
- Authentication & authorization
- Database design
- Privacy-aware application development
- Containerization
- Production deployment
- Automated testing

## License

This project is licensed under the MIT License.
