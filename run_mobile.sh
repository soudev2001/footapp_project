#!/bin/bash
# ============================================
#  FootApp Mobile - Lancement + Capture Erreurs
# ============================================
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MOBILE_DIR="$SCRIPT_DIR/mobile"
LOG_FILE="$SCRIPT_DIR/mobile_errors.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "============================================"
echo " FootApp Mobile - Démarrage"
echo "============================================"
echo ""
echo "[$TIMESTAMP] Démarrage..." >> "$LOG_FILE"

# Vérifier que le dossier mobile existe
if [ ! -d "$MOBILE_DIR" ]; then
    echo "ERREUR: Dossier mobile introuvable: $MOBILE_DIR"
    echo "[ERREUR] Dossier mobile introuvable" >> "$LOG_FILE"
    exit 1
fi

cd "$MOBILE_DIR"

# Vérifier node_modules
if [ ! -d "node_modules" ]; then
    echo "Installation des dépendances..."
    echo "[INFO] npm install en cours..." >> "$LOG_FILE"
    npm install --legacy-peer-deps 2>>"$LOG_FILE"
fi

# 1. Type-check TypeScript
echo ""
echo "[1/3] Vérification TypeScript..."
echo "" >> "$LOG_FILE"
echo "============================================" >> "$LOG_FILE"
echo "[$TIMESTAMP] TYPESCRIPT CHECK" >> "$LOG_FILE"
echo "============================================" >> "$LOG_FILE"
if npx tsc --noEmit >> "$LOG_FILE" 2>&1; then
    echo "   > Aucune erreur TypeScript"
    echo "[OK] Aucune erreur TypeScript" >> "$LOG_FILE"
else
    echo "   > Des erreurs TypeScript ont été trouvées. Voir $LOG_FILE"
fi

# 2. Expo Doctor
echo ""
echo "[2/3] Vérification Expo Doctor..."
echo "" >> "$LOG_FILE"
echo "============================================" >> "$LOG_FILE"
echo "[$TIMESTAMP] EXPO DOCTOR" >> "$LOG_FILE"
echo "============================================" >> "$LOG_FILE"
npx expo-doctor >> "$LOG_FILE" 2>&1 || true

# 3. Lancer Expo
echo ""
echo "[3/3] Lancement Expo..."
echo "   Logs écrits dans: $LOG_FILE"
echo "   Ctrl+C pour arrêter"
echo ""
echo "" >> "$LOG_FILE"
echo "============================================" >> "$LOG_FILE"
echo "[$TIMESTAMP] EXPO START" >> "$LOG_FILE"
echo "============================================" >> "$LOG_FILE"
npx expo start --android 2>&1 | tee -a "$LOG_FILE"
