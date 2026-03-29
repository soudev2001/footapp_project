# ============================================
#  FootApp - Demarrage Emulateur Android
#  Usage: .\start_emulator.ps1 [-Kill] [-NoWait] [-AvdName "MonAVD"]
# ============================================
param(
    [string]$AvdName = "",
    [switch]$Kill,
    [switch]$NoWait
)

$ErrorActionPreference = "Continue"

$AndroidSdk  = $env:ANDROID_HOME
if (-not $AndroidSdk) { $AndroidSdk = $env:ANDROID_SDK_ROOT }
if (-not $AndroidSdk) { $AndroidSdk = "$env:LOCALAPPDATA\Android\Sdk" }

$AdbExe      = Join-Path $AndroidSdk "platform-tools\adb.exe"
$EmulatorExe = Join-Path $AndroidSdk "emulator\emulator.exe"

function Write-Ok([string]$m)   { Write-Host "  [OK] $m" -ForegroundColor Green }
function Write-Inf([string]$m)  { Write-Host "  [..] $m" -ForegroundColor Cyan }
function Write-Warn([string]$m) { Write-Host "  [!!] $m" -ForegroundColor Yellow }
function Write-Err([string]$m)  { Write-Host "  [XX] $m" -ForegroundColor Red }

if (-not (Test-Path $AdbExe)) {
    Write-Err "adb introuvable: $AdbExe"
    exit 1
}
if (-not (Test-Path $EmulatorExe)) {
    Write-Err "emulator.exe introuvable: $EmulatorExe"
    exit 1
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  FootApp - Emulateur Android" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green

if ($Kill) {
    Write-Inf "Arret emulateur existant..."
    & $AdbExe emu kill 2>&1 | Out-Null
    Start-Sleep -Seconds 4
}

$running = @(& $AdbExe devices 2>&1 | Select-String "emulator" | Where-Object { $_ -match "emulator" })

if ($running.Count -gt 0 -and -not $Kill) {
    Write-Ok "Emulateur deja actif: $($running[0])"
    exit 0
}

Write-Inf "AVDs disponibles:"
$avdList = & $EmulatorExe -list-avds 2>&1 | Where-Object { $_ -match '\w' }
$avdList | ForEach-Object { Write-Host "     - $_" }

if (-not $AvdName) {
    $preferred = $avdList | Where-Object { $_ -match "Pixel" -and $_ -notmatch "Copy" } | Select-Object -First 1
    if (-not $preferred) { $preferred = $avdList | Select-Object -First 1 }
    $AvdName = $preferred.ToString().Trim()
}

if (-not $AvdName) {
    Write-Err "Aucun AVD. Creez-en un via Android Studio > Virtual Device Manager"
    exit 1
}

Write-Inf "Demarrage: $AvdName"

# swiftshader_indirect : seul mode stable sur cet env Windows (host crash)
# -no-snapshot-load    : evite System UI crash lie snapshot corrompu
# -no-sim              : evite crash SystemUI "subscriptionId not in valid list"
$proc = Start-Process -FilePath $EmulatorExe `
    -ArgumentList @(
        "-avd",              $AvdName,
        "-gpu",              "swiftshader_indirect",
        "-no-boot-anim",
        "-no-snapshot-load",
        "-no-snapshot-save",
        "-no-sim",
        "-memory",           "2048",
        "-cores",            "2"
    ) `
    -PassThru -WindowStyle Normal

Write-Inf "PID: $($proc.Id)"

Write-Inf "Attente connexion adb (max 60s)..."
$elapsed = 0; $found = $false
do {
    Start-Sleep -Seconds 3; $elapsed += 3
    $found = @(& $AdbExe devices 2>&1 | Select-String "emulator").Count -gt 0
    Write-Host "." -NoNewline
} while (-not $found -and $elapsed -lt 60)
Write-Host ""

if (-not $found) {
    Write-Err "Non detecte par adb apres 60s"
    exit 1
}
Write-Ok "Emulateur detecte (${elapsed}s)"

if (-not $NoWait) {
    Write-Inf "Attente boot Android (max 120s)..."
    & $AdbExe wait-for-device 2>&1 | Out-Null

    $waited = 0; $boot = ""
    do {
        Start-Sleep -Seconds 3; $waited += 3
        $boot = & $AdbExe shell getprop sys.boot_completed 2>&1
        Write-Host "." -NoNewline
    } while ($boot -notmatch "1" -and $waited -lt 120)
    Write-Host ""

    if ($boot -match "1") {
        Write-Ok "Boot complet en ${waited}s"
        Start-Sleep -Seconds 3

        # Deverrouiller
        & $AdbExe shell input keyevent 82 2>&1 | Out-Null
        & $AdbExe shell input keyevent 4  2>&1 | Out-Null
        Start-Sleep -Seconds 2

        # Fix "System UI isn't responding" : force-stop le relance proprement
        Write-Inf "Fix System UI..."
        & $AdbExe shell am force-stop com.android.systemui 2>&1 | Out-Null
        Start-Sleep -Seconds 4
        # Redeverrouiller apres restart System UI
        & $AdbExe shell input keyevent 82 2>&1 | Out-Null
        Start-Sleep -Seconds 1
        Write-Ok "System UI OK"

    } else {
        Write-Warn "Timeout ${waited}s"
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Emulateur pret !" -ForegroundColor Green
Write-Host "  AVD    : $AvdName" -ForegroundColor White
$devLine = (& $AdbExe devices 2>&1 | Select-String "emulator" | Select-Object -First 1)
Write-Host "  Device : $devLine" -ForegroundColor White
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
