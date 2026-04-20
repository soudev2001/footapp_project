# Configuration
$VM_IP      = "82.112.255.193"
$VM_USER    = "root"
$DUMP_LOCAL  = ".\dump"
$DUMP_REMOTE = "/root/dump"

Write-Host "--- Lancement de l'automatisation pour $VM_IP ---"

# 1. Transfert du dump vers la VM
Write-Host "--- Copie du dump en cours (via SCP) ---"
scp -r -o StrictHostKeyChecking=no "$DUMP_LOCAL" "$($VM_USER)@$($VM_IP):$($DUMP_REMOTE)"

# 2. Preparation du script Linux
$linuxScript = @'
#!/bin/bash
set -e

echo "Detection du conteneur MongoDB..."
CONTAINER=$(docker ps --filter "status=running" --format "{{.Names}}" | grep -i "mongo" | head -n 1)

if [ -z "$CONTAINER" ]; then
    echo "Erreur : Aucun conteneur MongoDB actif trouve !"
    exit 1
fi

echo "Conteneur identifie : $CONTAINER"

echo "Copie des fichiers vers le conteneur..."
docker cp /root/dump $CONTAINER:/dump

echo "Restauration de la base de donnees FootClubApp (avec authentification)..."
# Password found on remote VM environment variables
docker exec $CONTAINER mongorestore --drop --username admin --password choose-a-strong-password --authenticationDatabase admin --db FootClubApp /dump/FootClubApp

echo "Nettoyage des fichiers temporaires..."
rm -rf /root/dump
echo "Importation terminee avec succes sur la VM !"
'@

# 3. Deploiement et execution
$remoteScriptFile = "import_mongo_auto.sh"
[System.IO.File]::WriteAllLines("$(Get-Location)\$remoteScriptFile", $linuxScript)

Write-Host "--- Envoi du script d'execution ---"
scp -o StrictHostKeyChecking=no $remoteScriptFile "$($VM_USER)@$($VM_IP):/root/$($remoteScriptFile)"

Write-Host "--- Execution des commandes sur la VM ---"
ssh -o StrictHostKeyChecking=no "$($VM_USER)@$($VM_IP)" "bash /root/$remoteScriptFile && rm /root/$remoteScriptFile"

# 4. Nettoyage local
Remove-Item $remoteScriptFile
Write-Host "--- Operation terminee ---"
