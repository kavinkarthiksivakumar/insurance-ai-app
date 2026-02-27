# ============================================================
#  START AI SERVICE — Python FastAPI (Port 5000)
#  Run this from: insurance-claims-app-master\insurance-claims-app-master\
# ============================================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  Starting Python AI Service (5000)" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

$aiDir = "$PSScriptRoot\ai-service"

if (-not (Test-Path $aiDir)) {
    Write-Host "ERROR: Cannot find ai-service folder at: $aiDir" -ForegroundColor Red
    exit 1
}

Set-Location $aiDir
Write-Host "[INFO] Working directory: $(Get-Location)" -ForegroundColor Green
Write-Host "[INFO] Running: python app.py" -ForegroundColor Green
Write-Host ""
Write-Host "Health check: http://localhost:5000/health" -ForegroundColor Cyan
Write-Host "API Docs:     http://localhost:5000/docs" -ForegroundColor Cyan
Write-Host ""

python app.py
