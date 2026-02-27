# ============================================================
#  START BACKEND — Spring Boot (Port 8081)
#  Run this from: insurance-claims-app-master\insurance-claims-app-master\
# ============================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Spring Boot Backend (8081)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$backendDir = "$PSScriptRoot\springapp"

if (-not (Test-Path $backendDir)) {
    Write-Host "ERROR: Cannot find springapp folder at: $backendDir" -ForegroundColor Red
    exit 1
}

Set-Location $backendDir
Write-Host "[INFO] Working directory: $(Get-Location)" -ForegroundColor Green
Write-Host "[INFO] Running: mvn spring-boot:run" -ForegroundColor Green
Write-Host ""
Write-Host "Login credentials after startup:" -ForegroundColor Yellow
Write-Host "  Admin   -> admin@example.com  / admin123" -ForegroundColor Yellow
Write-Host "  Agent   -> agent@example.com  / agent123" -ForegroundColor Yellow
Write-Host "  Customer-> john@example.com   / customer123" -ForegroundColor Yellow
Write-Host ""

mvn spring-boot:run
