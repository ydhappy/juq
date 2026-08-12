$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "[Juq 360] Preparing local project verification..." -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js 22 LTS is required. Install Node.js, then run this script again."
}

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
  throw "pnpm is missing. Run: npm install -g pnpm"
}

pnpm install --frozen-lockfile
pnpm check

Write-Host "Local dependency installation and TypeScript verification completed." -ForegroundColor Green
Write-Host "This script performs local checks only and does not create an APK." -ForegroundColor Yellow
