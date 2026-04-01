# 🚀 FootLogic V2 - Deployment Guide (Hostinger KVM2)

This guide explains how to deploy your application to a Hostinger Ubuntu VPS using Docker and Nginx.

## 1. Prerequisites
- A Hostinger VPS with **Ubuntu 24.04 LTS** (Detected: `82.112.255.193`).
- SSH access to your VPS.
- A domain name (or use the IP for testing).
- GitHub Repository Secrets configured (`SSH_PRIVATE_KEY`, `SERVER_HOST`, `SERVER_USER`).

## 2. Multi-Environment Branching
| Environment | Branch | Port | DB Name |
| :--- | :--- | :--- | :--- |
| **Production** | `main` | 5000 | `FootClubApp_Prod` |
| **Pre-Prod** | `pre-prod` | 5001 | `FootClubApp_PreProd` |
| **Test** | `test` | _Local_ | `FootClubApp_Test` |

## 3. Server Setup

### Step 1: Push your code to GitHub
Ensure all your project files (including `Dockerfile`, `docker-compose.yml`, etc.) are pushed to your GitHub repository.

### Step 2: Initialize Project Folder on VPS
Sur votre terminal SSH (`root@82.112.255.193`), exécutez :
```bash
mkdir -p ~/footapp_project && cd ~/footapp_project
git clone https://github.com/soudev2001/footapp_project.git .
```

### Step 3: Configure Environment Variables
You need two separate `.env` files for each container project if you run them separately, or just ensure GitHub Actions can build them.
```bash
# For Prod
cp .env.prod.example .env.prod
nano .env.prod

# For Pre-Prod
cp .env.preprod.example .env.preprod
nano .env.preprod
```

### Step 4: Initial Deployment
Run the containers manually for the first time or use the script.
```bash
docker-compose -f docker-compose.prod.yml up -d --build
docker-compose -f docker-compose.preprod.yml up -d --build
```

## 3. Nginx Reverse Proxy Setup
To make the app accessible via port 80 (HTTP) or 443 (HTTPS):

1. Copy the Nginx config:
   ```bash
   sudo cp nginx/footapp.conf /etc/nginx/sites-available/footapp
   ```
2. Link it to sites-enabled:
   ```bash
   sudo ln -s /etc/nginx/sites-available/footapp /etc/nginx/sites-enabled/
   ```
3. Test and restart Nginx:
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## 4. SSL (HTTPS) with Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## 5. Local MongoDB Container
The application is configured to use a containerized MongoDB.
- **Data persistence**: Data is stored in the `mongodb_data` Docker volume.
- **Backups**: You can backup data by running:
  ```bash
  docker exec footapp_mongodb mongodump --out /data/db/backup
  ```

## 🛠️ Useful Commands
- **View Logs**: `docker-compose logs -f web`
- **Restart App**: `docker-compose restart web`
- **Stop Everything**: `docker-compose down`
- **Check Status**: `docker ps`
