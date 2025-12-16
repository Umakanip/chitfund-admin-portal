Write-Host "Starting PHP Backend Server..." -ForegroundColor Green
Write-Host ""
Write-Host "Backend will be available at: http://localhost:8000" -ForegroundColor Cyan
Write-Host "API endpoints: http://localhost:8000/api/..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""
php -S localhost:8000 -t .

