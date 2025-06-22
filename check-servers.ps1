Write-Host "Checking server status..." -ForegroundColor Yellow

# Check Backend (port 5000)
try {
    $backend = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✓ Backend server is running on port 5000" -ForegroundColor Green
} catch {
    Write-Host "✗ Backend server is not responding on port 5000" -ForegroundColor Red
}

# Check Frontend (port 3000)  
try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✓ Frontend server is running on port 3000" -ForegroundColor Green
} catch {
    Write-Host "✗ Frontend server is not responding on port 3000" -ForegroundColor Red
}

Write-Host ""
Write-Host "If any server is not running, start them manually:" -ForegroundColor Yellow
Write-Host "Backend: cd Backend, then npm start" -ForegroundColor Cyan
Write-Host "Frontend: cd Frontend, then npm start" -ForegroundColor Cyan 