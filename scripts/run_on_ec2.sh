#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   bash scripts/run_on_ec2.sh            # build and up -d (default)
#   bash scripts/run_on_ec2.sh start      # build and up -d
#   bash scripts/run_on_ec2.sh stop       # down
#   bash scripts/run_on_ec2.sh restart    # restart
#   bash scripts/run_on_ec2.sh logs [svc] # logs -f (optional svc: backend|frontend)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="${SCRIPT_DIR}/.."
DEPLOY_DIR="${REPO_DIR}/deploy"
COMPOSE_FILE="${DEPLOY_DIR}/docker-compose.ec2.yml"
ENV_FILE="${DEPLOY_DIR}/.env"

cmd=${1:-start}

if [ ! -f "${COMPOSE_FILE}" ]; then
  echo "Compose file not found: ${COMPOSE_FILE}" >&2
  exit 1
fi

if [ ! -f "${ENV_FILE}" ]; then
  echo "Env file not found: ${ENV_FILE}" >&2
  echo "Create it from example: cp ${DEPLOY_DIR}/env.example ${ENV_FILE}" >&2
  exit 1
fi

cd "${DEPLOY_DIR}"

case "${cmd}" in
  start|up|build)
    echo "Building images..."
    docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" build
    echo "Starting services..."
    docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" up -d
    ;;
  stop|down)
    echo "Stopping services..."
    docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" down
    ;;
  restart)
    echo "Restarting services..."
    docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" restart
    ;;
  logs)
    svc=${2:-}
    if [ -n "${svc}" ]; then
      docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" logs -f "${svc}"
    else
      docker compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" logs -f
    fi
    ;;
  *)
    echo "Unknown command: ${cmd}" >&2
    echo "Valid: start|up|build|stop|down|restart|logs [service]" >&2
    exit 2
    ;;
esac

echo "Done."


