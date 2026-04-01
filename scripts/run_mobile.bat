@echo off
REM ============================================
REM  FootApp Mobile - Lancement + Capture Erreurs
REM ============================================
powershell -ExecutionPolicy Bypass -File "%~dp0run_mobile.ps1" %*
