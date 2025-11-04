#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/deploy.sh <dockerhub-username> <version-tag>
# Example: ./scripts/deploy.sh myuser v1

if [ $# -lt 2 ]; then
  echo "Usage: $0 <dockerhub-username> <version>" >&2
  exit 1
fi

USER="$1"
TAG="$2"

BACKEND_IMAGE="$USER/chat-backend:$TAG"
FRONTEND_IMAGE="$USER/chat-frontend:$TAG"

echo "Building backend: $BACKEND_IMAGE"
docker build -t "$BACKEND_IMAGE" ./backend

echo "Building frontend: $FRONTEND_IMAGE"
docker build -t "$FRONTEND_IMAGE" ./frontend

echo "Tagging latest"
docker tag "$BACKEND_IMAGE" "$USER/chat-backend:latest"
docker tag "$FRONTEND_IMAGE" "$USER/chat-frontend:latest"

echo "Pushing images"
docker push "$BACKEND_IMAGE"
docker push "$FRONTEND_IMAGE"
docker push "$USER/chat-backend:latest"
docker push "$USER/chat-frontend:latest"

echo "Done. Update deploy/docker-compose.ec2.yml to use your username if not already."


