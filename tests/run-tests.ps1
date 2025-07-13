# Test Runner Script for PMS Integration Platform
# Run with: .\tests\run-tests.ps1

Write-Host "🧪 PMS Integration Platform - Test Runner" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Check if backend is running
Write-Host "🔍 Checking backend status..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method GET -TimeoutSec 5
    Write-Host "✅ Backend is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend is not running. Please start it with: cd api; dotnet run" -ForegroundColor Red
    Write-Host "   Then run this script again." -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Available test options
Write-Host "📋 Available Tests:" -ForegroundColor Cyan
Write-Host "1. PMS Feed Processing Test (PowerShell)" -ForegroundColor White
Write-Host "2. PMS Feed Processing Test (Node.js)" -ForegroundColor White
Write-Host "3. PMS Feed Processing Test (Curl)" -ForegroundColor White
Write-Host "4. Deployment Test" -ForegroundColor White
Write-Host "5. Run All Tests" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-5)"

switch ($choice) {
    "1" {
        Write-Host "🚀 Running PMS Feed Processing Test (PowerShell)..." -ForegroundColor Green
        & "$PSScriptRoot\test-pms-feed.ps1"
    }
    "2" {
        Write-Host "🚀 Running PMS Feed Processing Test (Node.js)..." -ForegroundColor Green
        if (Get-Command node -ErrorAction SilentlyContinue) {
            node "$PSScriptRoot\test-pms-feed-simple.js"
        } else {
            Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
        }
    }
    "3" {
        Write-Host "🚀 Running PMS Feed Processing Test (Curl)..." -ForegroundColor Green
        if (Get-Command curl -ErrorAction SilentlyContinue) {
            & "$PSScriptRoot\test-pms-feed-curl.sh"
        } else {
            Write-Host "❌ Curl is not installed or not in PATH" -ForegroundColor Red
        }
    }
    "4" {
        Write-Host "🚀 Running Deployment Test..." -ForegroundColor Green
        if (Get-Command node -ErrorAction SilentlyContinue) {
            node "$PSScriptRoot\test-deployment.js"
        } else {
            Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
        }
    }
    "5" {
        Write-Host "🚀 Running All Tests..." -ForegroundColor Green
        Write-Host ""
        
        # Test 1: PowerShell
        Write-Host "📦 Test 1: PMS Feed Processing (PowerShell)" -ForegroundColor Yellow
        & "$PSScriptRoot\test-pms-feed.ps1"
        Write-Host ""
        
        # Test 2: Node.js
        if (Get-Command node -ErrorAction SilentlyContinue) {
            Write-Host "📦 Test 2: PMS Feed Processing (Node.js)" -ForegroundColor Yellow
            node "$PSScriptRoot\test-pms-feed-simple.js"
            Write-Host ""
            
            Write-Host "📦 Test 3: Deployment Test" -ForegroundColor Yellow
            node "$PSScriptRoot\test-deployment.js"
            Write-Host ""
        } else {
            Write-Host "⚠️ Skipping Node.js tests (Node.js not available)" -ForegroundColor Yellow
        }
        
        # Test 3: Curl
        if (Get-Command curl -ErrorAction SilentlyContinue) {
            Write-Host "📦 Test 4: PMS Feed Processing (Curl)" -ForegroundColor Yellow
            & "$PSScriptRoot\test-pms-feed-curl.sh"
        } else {
            Write-Host "⚠️ Skipping Curl test (Curl not available)" -ForegroundColor Yellow
        }
        
        Write-Host ""
        Write-Host "🎉 All tests completed!" -ForegroundColor Green
    }
    default {
        Write-Host "❌ Invalid choice. Please enter a number between 1-5." -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📚 For more information, see TESTING.md" -ForegroundColor Cyan 