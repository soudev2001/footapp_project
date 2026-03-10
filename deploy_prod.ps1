# deploy_prod.ps1
# PowerShell version of the deployment script for Windows

Write-Host "Connecting to Server to Deploy Prod..." -ForegroundColor Cyan

$server = "root@82.112.255.193"
$command = @"
  echo 'Pulling latest code for prod (from main branch)...'
  cd /root/footapp_project || { echo 'Failed to enter /root/footapp_project'; exit 1; }
  
  # Stash any local changes on the server to avoid merge conflicts during pull
  git stash
  
  # Ensure we are on main and pulling the latest 
  git fetch origin
  git checkout main
  git pull origin main
  
  echo 'Restarting Docker containers for prod...'
  docker-compose -f docker-compose.prod.yml down
  docker-compose -f docker-compose.prod.yml up -d --build
  
  echo 'Prod deployment completed!'
"@

ssh $server $command
