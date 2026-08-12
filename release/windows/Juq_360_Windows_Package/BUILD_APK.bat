@echo off
setlocal EnableExtensions

cd /d "%~dp0"

echo.
echo [Juq 360] Preparing local project verification...

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 22 LTS is required. Install Node.js, then run this file again.
  pause
  exit /b 1
)

where pnpm >nul 2>nul
if errorlevel 1 (
  echo pnpm is missing. Run: npm install -g pnpm
  pause
  exit /b 1
)

call pnpm install --frozen-lockfile
if errorlevel 1 (
  echo Dependency installation failed.
  pause
  exit /b 1
)

call pnpm check
if errorlevel 1 (
  echo TypeScript verification failed.
  pause
  exit /b 1
)

echo.
echo Local dependency installation and TypeScript verification completed.
echo This script performs local checks only and does not create an APK.
pause
