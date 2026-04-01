# ============================================
#  FootApp Mobile - Lancement + Capture Erreurs
# ============================================
$ErrorActionPreference = "Continue"

$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir    = Split-Path $ScriptDir -Parent
$MobileDir  = Join-Path $RootDir "mobile"
$Timestamp  = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$LogStamp   = Get-Date -Format "yyyyMMdd_HHmmss"
$LogFile    = Join-Path $RootDir "mobile_errors_$LogStamp.log"
$LogLatest  = Join-Path $RootDir "mobile_errors.log"

# Helpers
function Write-Step([string]$Msg) { Write-Host "`n$Msg" -ForegroundColor Cyan }
function Write-Ok([string]$Msg)   { Write-Host "   > $Msg" -ForegroundColor Green }
function Write-Warn([string]$Msg) { Write-Host "   > $Msg" -ForegroundColor Yellow }
function Log([string]$Msg)        { $Msg | Add-Content -Path $LogFile -Encoding UTF8 }

# ---------- Init ----------
Write-Host "============================================" -ForegroundColor Green
Write-Host " FootApp Mobile - Demarrage" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green

"[$Timestamp] ============================================" | Set-Content -Path $LogFile -Encoding UTF8
"[$Timestamp] FootApp Mobile - Demarrage" | Add-Content -Path $LogFile
"[$Timestamp] ============================================" | Add-Content -Path $LogFile

if (-not (Test-Path $MobileDir)) {
    Write-Host "ERREUR: Dossier mobile introuvable: $MobileDir" -ForegroundColor Red
    "[ERREUR] Dossier mobile introuvable" | Add-Content $LogFile
    exit 1
}

Set-Location $MobileDir

# ---------- node_modules ----------
if (-not (Test-Path "node_modules")) {
    Write-Host "`nInstallation des dependances..." -ForegroundColor Yellow
    Log ""
    Log "=== NPM INSTALL ==="
    $npmOut = & npm install --legacy-peer-deps 2>&1
    $npmOut | Add-Content $LogFile
    $npmOut | ForEach-Object { Write-Host "  $_" }
}

# ---------- [1/3] TypeScript ----------
Write-Step "[1/3] Verification TypeScript..."
Log ""
Log "============================================"
Log "[$Timestamp] TYPESCRIPT CHECK"
Log "============================================"

$tsRaw    = & npx tsc --noEmit 2>&1
# Filtrer : garder UNIQUEMENT les lignes contenant "error TS" (ignore npm notice/warn/ERESOLVE)
$tsErrors = $tsRaw | Where-Object { $_ -match 'error TS\d+' }
if ($tsErrors) {
    $tsErrors | Add-Content $LogFile -Encoding UTF8
    Write-Warn "Erreurs TypeScript detectees :"
    $tsErrors | ForEach-Object { Write-Host "     $_" -ForegroundColor Red }
} else {
    Write-Ok "Aucune erreur TypeScript"
    Log "[OK] Aucune erreur TypeScript"
}

# ---------- [2/3] Emulateur Android ----------
Write-Step "[2/3] Emulateur Android..."
Log ""
Log "============================================"
Log "[$Timestamp] ANDROID EMULATOR"
Log "============================================"

# Deleger au script dedie start_emulator.ps1
$EmuScript = Join-Path $ScriptDir "start_emulator.ps1"
if (Test-Path $EmuScript) {
    $emuOut = & powershell -ExecutionPolicy Bypass -File $EmuScript 2>&1
    $emuOut | Add-Content $LogFile -Encoding UTF8
    $emuOut | ForEach-Object { Write-Host "  $_" }
    if ($LASTEXITCODE -ne 0) {
        Write-Warn "L'emulateur n'a pas pu demarrer - verifiez start_emulator.ps1"
        Log "[WARN] Emulateur exit code: $LASTEXITCODE"
    }
} else {
    Write-Warn "start_emulator.ps1 introuvable, tentative directe..."
    Log "[WARN] start_emulator.ps1 manquant"
}

# ---------- [3/4] Expo Doctor (avec timeout 30s) ----------
Write-Step "[3/4] Verification Expo Doctor..."
Log ""
Log "============================================"
Log "[$Timestamp] EXPO DOCTOR"
Log "============================================"

$docJob = Start-Job -ScriptBlock {
    Set-Location $using:MobileDir
    & npx expo-doctor 2>&1
}
$docDone = Wait-Job $docJob -Timeout 30
if ($docDone) {
    $docResult = Receive-Job $docJob
    $docResult | Add-Content $LogFile -Encoding UTF8
    $passed = ($docResult | Where-Object { $_ -match 'checks passed' } | Select-Object -First 1)
    if ($passed) { Write-Ok $passed.ToString().Trim() }
    else { $docResult | ForEach-Object { Write-Host "  $_" } }
} else {
    Stop-Job $docJob
    Write-Warn "Expo Doctor timeout (30s) - ignore, lancement Expo quand meme"
    Log "[WARN] expo-doctor timeout"
}
Remove-Job $docJob -Force -ErrorAction SilentlyContinue

# ---------- [4/4] Expo Start ----------
Write-Step "[4/4] Lancement Expo..."

# Liberer le port 8081 si occupe par un ancien process
$port = 8081
$portProc = netstat -ano 2>$null | Select-String ":$port " | Select-Object -First 1
if ($portProc) {
    $pid8081 = ($portProc -split '\s+' | Select-Object -Last 1).Trim()
    if ($pid8081 -match '^\d+$' -and $pid8081 -ne "0") {
        Write-Host "   > Port $port occupe (PID $pid8081) - fermeture..." -ForegroundColor Yellow
        Stop-Process -Id $pid8081 -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        Write-Host "   > Port $port libere" -ForegroundColor Green
        Log "[INFO] PID $pid8081 tue pour liberer port $port"
    }
} else {
    Write-Host "   > Port $port disponible" -ForegroundColor Green
}

Write-Host "   Logs dans : $LogFile"
Write-Host "   Ctrl+C pour arreter`n"

Log ""
Log "============================================"
Log "[$Timestamp] EXPO START"
Log "============================================"

# Expo affiche en temps reel, on capture aussi dans le log
try {
    & npx expo start --android --port 8081 2>&1 | ForEach-Object {
        Write-Host $_
        $_ | Add-Content -Path $LogFile -Encoding UTF8
    }
} finally {
    # Creer un lien symbolique "mobile_errors.log" vers le dernier log
    if (Test-Path $LogLatest) { Remove-Item $LogLatest -Force -ErrorAction SilentlyContinue }
    Copy-Item $LogFile $LogLatest -ErrorAction SilentlyContinue
    Write-Host "`nLog complet : $LogFile" -ForegroundColor Cyan
}
