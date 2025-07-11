#!/usr/bin/env pwsh

Write-Host "🔧 Ade Royal - Question Creation Fix Tool" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host ""

# Check if we're in the Backend directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Please run this script from the Backend directory" -ForegroundColor Red
    Write-Host "   Current directory: $(Get-Location)" -ForegroundColor Yellow
    Write-Host "   Expected files: package.json, models/, routes/" -ForegroundColor Yellow
    exit 1
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Node.js is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if MongoDB connection is configured
if (-not (Test-Path "config.env")) {
    Write-Host "❌ Error: config.env file not found" -ForegroundColor Red
    Write-Host "   Please ensure you have a config.env file with MONGODB_URI" -ForegroundColor Yellow
    exit 1
}

Write-Host "🚀 Starting fix process..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Fix teacher assignments
Write-Host "Step 1: Fixing teacher assignments..." -ForegroundColor Blue
try {
    node fix-teacher-assignments.js
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Teacher assignments fixed successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Error fixing teacher assignments" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error running fix-teacher-assignments.js: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Test question creation
Write-Host "Step 2: Testing question creation..." -ForegroundColor Blue
try {
    node test-question-creation.js
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Question creation test completed!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Question creation test had issues (check output above)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error running test-question-creation.js: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Fix process completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Start your backend server: npm start" -ForegroundColor White
Write-Host "   2. Test question creation in the frontend" -ForegroundColor White
Write-Host "   3. If issues persist, check the backend logs for detailed error messages" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tip: If you're still getting 'server error creating question', check:" -ForegroundColor Yellow
Write-Host "   - MongoDB connection is working" -ForegroundColor White
Write-Host "   - Teachers are assigned to subjects in the admin panel" -ForegroundColor White
Write-Host "   - Subjects are assigned to classes" -ForegroundColor White
Write-Host "" 