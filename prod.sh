#!/bin/bash
# Wrapper for docker compose on prod — always uses .env.prod.
# Usage: ./prod.sh up -d [--build]  |  ./prod.sh down  |  ./prod.sh logs -f
set -e
cd "$(dirname "$0")"
exec docker compose -f docker-compose.prod.yml --env-file .env.prod "$@"
