@echo off
powershell -ExecutionPolicy Bypass -File "%~dp0set-secrets.ps1" %*
