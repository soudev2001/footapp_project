#!/bin/bash
# Wrapper for docker compose on preprod — always uses .env.preprod.
# Usage: ./preprod.sh up -d [--build]  |  ./preprod.sh down  |  ./preprod.sh logs -f
set -e
cd "$(dirname "$0")"
exec docker compose -f docker-compose.preprod.yml --env-file .env.preprod "$@"
