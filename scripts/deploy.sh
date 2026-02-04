#!/bin/bash

# FootLogic V2 - Deployment Script for Ubuntu
# Run this on your VPS

echo "🚀 Starting FootLogic V2 Deployment..."

# 1. Update system
sudo apt-get update && sudo apt-get upgrade -y

# 2. Install Docker if not present
if ! [ -x "$(command -v docker)" ]; then
  echo "Installing Docker..."
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  sudo usermod -aG docker $USER
fi

# 3. Install Docker Compose if not present
if ! [ -x "$(command -v docker-compose)" ]; then
  echo "Installing Docker Compose..."
  sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
fi

# 4. Create directory if not exists
# Assumes we are in the project root on the server

# 5. Check if .env exists
if [ ! -f .env ]; then
  echo "⚠️ .env file missing! Creating from example..."
  cp .env.example .env
  echo "❌ PLEASE EDIT .env WITH REAL SECRETS BEFORE PROCEEDING!"
  exit 1
fi

# 6. Build and Start containers
echo "📦 Building and starting containers..."
docker-compose down
docker-compose up -d --build

# 7. Install Nginx if not present
if ! [ -x "$(command -v nginx)" ]; then
  echo "Installing Nginx..."
  sudo apt-get install -y nginx
fi

echo "✅ Deployment finished successfully!"
echo "📡 App is running on port 5000."
echo "🔐 Reminder: Setup Nginx reverse proxy and Certbot for HTTPS."
