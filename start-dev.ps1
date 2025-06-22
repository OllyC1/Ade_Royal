# Development startup script for Ade-Royal CBT System
Write-Host "Starting Ade-Royal CBT Development Environment..." -ForegroundColor Green

# Function to check if a port is in use
function Test-Port {
    param([int]$Port)
    $connection = New-Object System.Net.Sockets.TcpClient
    try {
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    }
    catch {
        return $false
    }
}

# Check if backend port is available
if (Test-Port -Port 5000) {
    Write-Host "Port 5000 is already in use. Backend server may already be running." -ForegroundColor Yellow
} else {
    Write-Host "Starting Backend Server..." -ForegroundColor Cyan
    # Start backend in background
    Start-Process -FilePath "powershell" -ArgumentList "-Command", "cd Backend; npm start" -WindowStyle Minimized
    Start-Sleep 3
}

# Check if frontend port is available
if (Test-Port -Port 3000) {
    Write-Host "Port 3000 is already in use. Frontend server may already be running." -ForegroundColor Yellow
} else {
    Write-Host "Starting Frontend Server..." -ForegroundColor Cyan
    # Start frontend in background
    Start-Process -FilePath "powershell" -ArgumentList "-Command", "cd Frontend; npm start" -WindowStyle Minimized
    Start-Sleep 3
}

Write-Host "Development servers started!" -ForegroundColor Green
Write-Host "Backend: http://localhost:5000" -ForegroundColor White
Write-Host "Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "Press Ctrl+C to stop this script (servers will continue running)" -ForegroundColor Yellow

# Keep the script running
try {
    while ($true) {
        Start-Sleep 1
    }
}
catch {
    Write-Host "Script stopped." -ForegroundColor Red
} 