# Test Lambda API Script
param(
    [string]$ApiUrl = "https://z0sl2tuylh.execute-api.us-east-1.amazonaws.com"
)

Write-Host "Testing Lambda API at: $ApiUrl" -ForegroundColor Green

# Test 1: Health Check
Write-Host "`n1. Testing Health Check..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$ApiUrl/health" -Method GET
    Write-Host "✅ Health Check: $($healthResponse.status)" -ForegroundColor Green
    Write-Host "   Environment: $($healthResponse.environment)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Authentication
Write-Host "`n2. Testing Authentication..." -ForegroundColor Yellow
try {
    $authBody = @{
        username = "admin"
        password = "admin123"
    } | ConvertTo-Json

    $authResponse = Invoke-RestMethod -Uri "$ApiUrl/api/auth/login" -Method POST -Body $authBody -ContentType "application/json"
    Write-Host "✅ Authentication: $($authResponse.message)" -ForegroundColor Green
    Write-Host "   Token: $($authResponse.token.Substring(0, 20))..." -ForegroundColor Cyan
} catch {
    Write-Host "❌ Authentication Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: PMS Feed Processing
Write-Host "`n3. Testing PMS Feed Processing..." -ForegroundColor Yellow
try {
    $pmsBody = @{
        feedData = "test data"
    } | ConvertTo-Json

    $pmsResponse = Invoke-RestMethod -Uri "$ApiUrl/api/pms/testhotel" -Method POST -Body $pmsBody -ContentType "application/json"
    Write-Host "✅ PMS Processing: Success" -ForegroundColor Green
    Write-Host "   Response: $($pmsResponse.translatedData)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ PMS Processing Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 API Testing Complete!" -ForegroundColor Green 