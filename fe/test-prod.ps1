# PowerShell script to test production build locally
Write-Host "🧹 Cleaning previous build..." -ForegroundColor Cyan
if (Test-Path .next) {
    Remove-Item -Recurse -Force .next
}
if (Test-Path node_modules\.cache) {
    Remove-Item -Recurse -Force node_modules\.cache
}

Write-Host "📦 Building production..." -ForegroundColor Yellow
npm run build:prod

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build complete! Starting production server..." -ForegroundColor Green
Write-Host "🌐 Server will run on http://localhost:3000" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

npm run start:prod

