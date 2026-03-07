#!/bin/bash
# deploy_preprod.sh

echo "Connecting to Server to Deploy Pre-Prod..."
ssh root@82.112.255.193 << 'EOF'
  echo "Pulling latest code for preprod (from main branch)..."
  cd /root/footapp_project || { echo "Failed to enter /root/footapp_project"; exit 1; }
  
  # Stash any local changes on the server to avoid merge conflicts during pull
  git stash
  
  # Ensure we are on main and pulling the latest
  git fetch origin
  git checkout main
  git pull origin main
  
  echo "Restarting Docker containers for preprod..."
  docker-compose -f docker-compose.preprod.yml down
  docker-compose -f docker-compose.preprod.yml up -d --build
  
  echo "Pre-prod deployment completed!"
EOF
