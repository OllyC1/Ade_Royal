#!/usr/bin/env pwsh

Write-Host "🔄 Ade-Royal CBT System - Email Domain Update" -ForegroundColor Blue
Write-Host "================================================" -ForegroundColor Blue
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js detected: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Change to Backend directory
Set-Location Backend

Write-Host "📂 Current directory: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""

# Check if the update script exists
if (!(Test-Path "scripts/updateEmailDomains.js")) {
    Write-Host "❌ Update script not found at scripts/updateEmailDomains.js" -ForegroundColor Red
    exit 1
}

# Check if .env file exists
if (!(Test-Path ".env")) {
    Write-Host "⚠️  .env file not found. Make sure your environment variables are set." -ForegroundColor Yellow
    Write-Host "   The script will try to use default MongoDB connection." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "🚀 Running email domain update script..." -ForegroundColor Green
Write-Host "   This will update all existing user emails from:" -ForegroundColor Cyan
Write-Host "   ❌ @aderoyal.edu.ng" -ForegroundColor Red
Write-Host "   ✅ @aderoyalschools.org.ng" -ForegroundColor Green
Write-Host ""

# Ask for confirmation
$confirmation = Read-Host "Do you want to proceed? (y/N)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "❌ Operation cancelled by user." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🔄 Starting update process..." -ForegroundColor Blue

try {
    # Run the update script
    node scripts/updateEmailDomains.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "🎉 Email domain update completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📝 Next steps:" -ForegroundColor Blue
        Write-Host "   1. Clear your browser cache" -ForegroundColor White
        Write-Host "   2. Refresh the frontend application" -ForegroundColor White
        Write-Host "   3. Test creating a new user to verify the new domain" -ForegroundColor White
        Write-Host ""
        Write-Host "✅ All new users will now use @aderoyalschools.org.ng" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Update script failed with exit code: $LASTEXITCODE" -ForegroundColor Red
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error running update script: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Script completed. Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") 