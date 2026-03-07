#!/bin/bash
# deploy_prod.sh
echo "Connecting to Server to Deploy Prod..."
ssh root@82.112.255.193 << 'EOF'
  echo "Pulling latest code for main branch..."
  cd /root/footapp_project || exit 1
  git checkout main
  git pull origin main
  echo "Restarting Docker containers for prod..."
  docker-compose -f docker-compose.prod.yml down
  docker-compose -f docker-compose.prod.yml up -d --build
  echo "Prod deployment completed!"
EOF
