# PowerShell test script for PMS feed processing
# Run with: .\test-pms-feed.ps1

Write-Host "🧪 Testing PMS Feed Processing with Generated Translators`n" -ForegroundColor Cyan

$testPmsCode = "testhotel"
$testPmsName = "Test Hotel PMS"

try {
    # Step 1: Deploy a new PMS integration
    Write-Host "📦 Step 1: Deploying new PMS integration..." -ForegroundColor Yellow
    
    $deploymentData = @{
        pmsCode = $testPmsCode
        pmsName = $testPmsName
        mappings = @(
            @{ sourceField = "roomType"; targetField = "InvCode"; confidence = 0.95 },
            @{ sourceField = "ratePlan"; targetField = "RatePlanCode"; confidence = 0.92 },
            @{ sourceField = "guestName"; targetField = "GuestName"; confidence = 0.88 },
            @{ sourceField = "checkInDate"; targetField = "CheckInDate"; confidence = 0.90 },
            @{ sourceField = "checkOutDate"; targetField = "CheckOutDate"; confidence = 0.90 },
            @{ sourceField = "totalAmount"; targetField = "TotalAmount"; confidence = 0.85 }
        )
        generatedFiles = @(
            "$testPmsCode`_translator.cs",
            "mapping.json",
            "manifest.json"
        )
    }

    $deployBody = $deploymentData | ConvertTo-Json -Depth 3
    
    $deployResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/deployment/deploy" -Method POST -Body $deployBody -ContentType "application/json"
    
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host "📁 Files created: $($deployResponse.files -join ', ')" -ForegroundColor Green
    Write-Host ""

    # Step 2: Test translation endpoint with JSON data
    Write-Host "🔄 Step 2: Testing translation endpoint with JSON data..." -ForegroundColor Yellow
    
    $testFeedData = @{
        roomType = "Deluxe King"
        ratePlan = "Standard Rate"
        guestName = "John Smith"
        checkInDate = "2024-01-15"
        checkOutDate = "2024-01-17"
        totalAmount = 299.99
        roomNumber = "101"
        specialRequests = "Late check-in requested"
    }

    $translationBody = @{
        feedData = ($testFeedData | ConvertTo-Json)
    } | ConvertTo-Json

    $translationResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/pms/$testPmsCode" -Method POST -Body $translationBody -ContentType "application/json"
    
    Write-Host "✅ Translation successful!" -ForegroundColor Green
    Write-Host "📤 Translated data:" -ForegroundColor Green
    Write-Host $translationResponse.translatedData -ForegroundColor White
    Write-Host ""

    # Step 3: Test with XML format
    Write-Host "🔄 Step 3: Testing with XML feed format..." -ForegroundColor Yellow
    
    $xmlFeedData = @"
<booking>
    <roomType>Suite</roomType>
    <ratePlan>Premium</ratePlan>
    <guestName>Jane Doe</guestName>
    <checkInDate>2024-02-01</checkInDate>
    <checkOutDate>2024-02-03</checkOutDate>
    <totalAmount>599.99</totalAmount>
</booking>
"@

    $xmlBody = @{
        feedData = $xmlFeedData
    } | ConvertTo-Json

    $xmlResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/pms/$testPmsCode" -Method POST -Body $xmlBody -ContentType "application/json"
    
    Write-Host "✅ XML feed translation successful!" -ForegroundColor Green
    Write-Host "📤 XML translated data:" -ForegroundColor Green
    Write-Host $xmlResponse.translatedData -ForegroundColor White
    Write-Host ""

    # Step 4: Test the test endpoint
    Write-Host "🔄 Step 4: Testing the test endpoint..." -ForegroundColor Yellow
    
    $testBody = @{
        testData = "Sample test data for verification"
    } | ConvertTo-Json

    $testResponse = Invoke-RestMethod -Uri "http://localhost:8000/api/pms/$testPmsCode/test" -Method POST -Body $testBody -ContentType "application/json"
    
    Write-Host "✅ Test endpoint working!" -ForegroundColor Green
    Write-Host "📤 Test result: $($testResponse.message)" -ForegroundColor Green
    Write-Host ""

    Write-Host "🎉 All tests completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Summary:" -ForegroundColor Cyan
    Write-Host "✅ PMS integration deployment" -ForegroundColor Green
    Write-Host "✅ JSON feed translation with field mapping" -ForegroundColor Green
    Write-Host "✅ XML feed translation with field mapping" -ForegroundColor Green
    Write-Host "✅ Test endpoint with actual translator" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 The PMS feed processing system is working correctly!" -ForegroundColor Green
    Write-Host "📁 Check the pms/$testPmsCode/ folder for generated files" -ForegroundColor Cyan

} catch {
    Write-Host "❌ Test failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Make sure the backend server is running on http://localhost:8000" -ForegroundColor White
    Write-Host "2. Check that the deployment endpoint is working" -ForegroundColor White
    Write-Host "3. Verify the PMS translator files are generated correctly" -ForegroundColor White
    Write-Host "4. Check the backend logs for detailed error information" -ForegroundColor White
} 