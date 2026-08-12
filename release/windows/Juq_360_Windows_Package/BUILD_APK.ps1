$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "[Juq 360] Preparing Android preview APK build..." -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js 22 LTS is required. Install Node.js, then run this script again."
}

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
  throw "pnpm is missing. Run: npm install -g pnpm"
}

pnpm install --frozen-lockfile
npx eas-cli@latest build --platform android --profile preview

Write-Host "APK build request completed. Open the EAS link printed above to download the APK." -ForegroundColor Green
