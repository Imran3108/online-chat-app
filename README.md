# Online Chat App – Deployment Guide (AWS EC2 + Docker Compose)

This guide walks you through deploying the Socket.IO chat app (Node/Express backend, React frontend, MongoDB Atlas) on an Ubuntu AWS EC2 instance using Docker Compose. No container registry is required; images are built directly on EC2.

## Prerequisites
- An Ubuntu EC2 instance (e.g., t3.small or similar) with security group rules:
  - Inbound TCP 80 (HTTP) from 0.0.0.0/0
  - Inbound TCP 4000 (backend) from 0.0.0.0/0 (or restrict as needed)
  - Inbound TCP 22 (SSH) from your IP
- Public IP: 35.172.48.105
- A MongoDB Atlas cluster and connection string
- SSH access to the instance

## 1) Install Docker and Compose on EC2
SSH into your EC2 instance and run:
```bash
curl -fsSL https://raw.githubusercontent.com/your/repo/main/scripts/ec2_provision.sh | sudo bash
```
If you cloned this repo already, you can run:
```bash
sudo bash scripts/ec2_provision.sh
```
Then log out and back in so your user can run `docker` without sudo.

## 2) Clone the repository on EC2
```bash
git clone <your-repo-url> online-chat-app
cd online-chat-app/deploy
```

## 3) Set environment variables
Create a `.env` file from the example and edit it:
```bash
cp env.example .env
```
Open `.env` and set values:
- `MONGODB_URI` = your Atlas connection string
- `JWT_SECRET` = a strong random string
- `CORS_ORIGIN` = comma-separated origins; already includes `http://35.172.48.105`
- `FRONTEND_API_URL` = `http://35.172.48.105:4000`
- `FRONTEND_SOCKET_URL` = `http://35.172.48.105:4000`

Example `.env` (adjust Mongo credentials):
```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<db>?retryWrites=true&w=majority
JWT_SECRET=replace-with-strong-secret
CORS_ORIGIN=http://35.172.48.105,http://your-domain,https://your-domain
FRONTEND_API_URL=http://35.172.48.105:4000
FRONTEND_SOCKET_URL=http://35.172.48.105:4000
```

## 4) Build and start containers (single command)
From the repo root, run the helper script:
```bash
bash scripts/run_on_ec2.sh
```
This script will:
- Build backend (Node/Express + Socket.IO)
- Build frontend (React, served by Nginx)
- Start containers and expose:
  - Frontend on port 80 → http://35.172.48.105
  - Backend on port 4000 → http://35.172.48.105:4000

## 5) Verify deployment
- Open `http://35.172.48.105` in a browser
- Register a user, login, and send messages in the `global` room
- Check backend health endpoint:
```bash
curl http://35.172.48.105:4000/health
```

## 6) Updating and managing the app
Pull new code, then rebuild and restart via script:
```bash
cd ~/online-chat-app && git pull
bash scripts/run_on_ec2.sh
```
Other script commands:
```bash
# Stop containers
bash scripts/run_on_ec2.sh stop

# Restart containers
bash scripts/run_on_ec2.sh restart

# Tail logs (all or a specific service)
bash scripts/run_on_ec2.sh logs
bash scripts/run_on_ec2.sh logs backend
bash scripts/run_on_ec2.sh logs frontend
```

## Project structure (for reference)
- `backend/` – Express API + Socket.IO server
  - `src/index.js` – server entry
  - `src/routes/*` – auth and messages endpoints
  - `src/middleware/auth.js` – JWT auth (HTTP + Socket)
  - `src/models/*` – Mongoose models
  - `Dockerfile` – production image build
  - `env.example` – backend env template
- `frontend/` – React app (Vite) + socket.io-client
  - `src/pages/*` – `Login`, `Chat`
  - `src/api/client.jsx` – Axios + endpoints
  - `nginx/default.conf` – Nginx SPA config
  - `Dockerfile` – builds with `VITE_API_URL`/`VITE_SOCKET_URL`
  - `env.example` – frontend env template
- `deploy/`
  - `docker-compose.ec2.yml` – compose build + run on EC2
  - `env.example` – deploy env template (copy to `.env`)
- `scripts/`
  - `ec2_provision.sh` – install Docker & Compose on Ubuntu EC2
  - `deploy.sh` – optional local build/push script (not needed for on-EC2 builds)

## Environment variables summary
Backend (runtime):
- `MONGODB_URI` – Atlas connection string
- `JWT_SECRET` – strong random string
- `CORS_ORIGIN` – allowed origins (comma-separated)
- `PORT` – defaults to 4000

Frontend (build-time → baked into app):
- `VITE_API_URL` – API base URL (passed via compose as `FRONTEND_API_URL`)
- `VITE_SOCKET_URL` – Socket.IO URL (passed via compose as `FRONTEND_SOCKET_URL`)

## Security and production hardening
- Use your own domain with HTTPS (e.g., Nginx reverse proxy or ALB with TLS)
- Restrict security group rules to trusted CIDRs where possible
- Store secrets in SSM Parameter Store or Secrets Manager instead of shell history
- Set strong `JWT_SECRET`, rotate periodically

## Troubleshooting
- 502/blank page on frontend: Check `frontend` container logs and Nginx config
- CORS errors: Verify `CORS_ORIGIN` includes your site origin exactly (scheme + host + port)
- Socket connection fails: Confirm `VITE_SOCKET_URL` baked into frontend matches backend URL and port
- Mongo connection errors: Validate `MONGODB_URI` and EC2 outbound internet access

---
Deployment complete! Visit: http://35.172.48.105
