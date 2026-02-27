# ============================================================
#  START FRONTEND — React (Port 3000)
#  Run this from: insurance-claims-app-master\insurance-claims-app-master\
# ============================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Starting React Frontend (3000)" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

$frontendDir = "$PSScriptRoot"

Set-Location $frontendDir
Write-Host "[INFO] Working directory: $(Get-Location)" -ForegroundColor Green

# Check if package.json has react-scripts (CRA) or vite
$pkg = Get-Content "package.json" | ConvertFrom-Json

if ($pkg.scripts.start) {
    Write-Host "[INFO] Running: npm start" -ForegroundColor Green
    npm start
}
elseif ($pkg.scripts.dev) {
    Write-Host "[INFO] Running: npm run dev" -ForegroundColor Green
    npm run dev
}
else {
    Write-Host "[ERROR] No start script found in package.json" -ForegroundColor Red
    Write-Host "Available scripts:" -ForegroundColor Yellow
    npm run
}
