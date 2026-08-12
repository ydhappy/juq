@echo off
setlocal EnableExtensions

cd /d "%~dp0"

echo.
echo [Juq 360] Preparing Android preview APK build...

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

echo.
echo Starting EAS preview APK build. Sign in when prompted.
call npx eas-cli@latest build --platform android --profile preview

if errorlevel 1 (
  echo APK build request did not complete. Check Expo sign-in and EXPO_TOKEN settings.
  pause
  exit /b 1
)

echo.
echo APK build request completed. Open the EAS link printed above to download the APK.
pause
