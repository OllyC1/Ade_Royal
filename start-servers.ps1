# Exam Management System - Server Startup Script
Write-Host "Starting Exam Management System..." -ForegroundColor Green

# Check if both Backend and Frontend directories exist
if (-not (Test-Path "Backend")) {
    Write-Host "Backend directory not found!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "Frontend")) {
    Write-Host "Frontend directory not found!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== OPTION 1: Automatic Startup ===" -ForegroundColor Cyan

try {
    # Start both frontend and backend servers
    Write-Host "Starting Ade-Royal CBT System servers..." -ForegroundColor Green

    # Start backend server in background
    Write-Host "Starting backend server..." -ForegroundColor Yellow
    Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd Backend; npm start"

    # Wait a moment for backend to start
    Start-Sleep -Seconds 3

    # Start frontend server in background  
    Write-Host "Starting frontend server..." -ForegroundColor Yellow
    Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd Frontend; npm start"

    Write-Host "Both servers are starting up..." -ForegroundColor Green
    Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
    Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
}
catch {
    Write-Host "Automatic startup failed. Please use manual method below." -ForegroundColor Red
}

Write-Host ""
Write-Host "=== OPTION 2: Manual Startup Instructions ===" -ForegroundColor Cyan
Write-Host "If automatic startup doesn't work, follow these steps:" -ForegroundColor White
Write-Host ""
Write-Host "1. Open TWO separate PowerShell windows" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. In the FIRST window, run:" -ForegroundColor Yellow
Write-Host "   cd Backend" -ForegroundColor White
Write-Host "   npm start" -ForegroundColor White
Write-Host ""
Write-Host "3. In the SECOND window, run:" -ForegroundColor Yellow
Write-Host "   cd Frontend" -ForegroundColor White
Write-Host "   npm start" -ForegroundColor White
Write-Host ""
Write-Host "4. Access the application:" -ForegroundColor Yellow
Write-Host "   Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
Read-Host 