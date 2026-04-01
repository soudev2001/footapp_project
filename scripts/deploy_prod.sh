#!/bin/bash
# deploy_prod.sh

echo "Connecting to Server to Deploy Prod..."
ssh root@82.112.255.193 << 'EOF'
  set -e
  cd /root/footapp_project || { echo "Failed to enter /root/footapp_project"; exit 1; }

  echo "=== Pulling latest code (main branch) ==="
  git stash
  git fetch origin
  git checkout main
  git pull origin main

  echo "=== Ensuring Docker network exists ==="
  docker network inspect root_default >/dev/null 2>&1 || docker network create root_default

  echo "=== Ensuring acme.json exists ==="
  mkdir -p traefik_data
  [ -f traefik_data/acme.json ] || { touch traefik_data/acme.json && chmod 600 traefik_data/acme.json; }

  echo "=== Starting Traefik (if not running) ==="
  docker compose -f docker-compose.traefik.yml up -d

  echo "=== Rebuilding & starting Prod containers ==="
  docker compose -f docker-compose.prod.yml down
  docker compose -f docker-compose.prod.yml up -d --build

  echo "=== Waiting for health checks ==="
  sleep 10
  docker ps --format "table {{.Names}}\t{{.Status}}" | grep footapp

  echo "=== Prod deployment completed! ==="
EOF
