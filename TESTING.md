# PMS Feed Processing Testing Guide

This guide covers how to test the complete PMS feed processing system, including deployment, translation, and error handling.

## Prerequisites

1. **Backend Server Running**: Ensure the .NET backend is running on `http://localhost:8000`
2. **Generated Files**: The system should have deployed at least one PMS integration

## Test Scripts Available

### 1. Node.js Test Script
```bash
node tests/test-pms-feed-simple.js
```

### 2. PowerShell Test Script (Windows)
```powershell
.\tests\test-pms-feed.ps1
```

### 3. Curl Test Script (Linux/macOS)
```bash
chmod +x tests/test-pms-feed-curl.sh
./tests/test-pms-feed-curl.sh
```

## What the Tests Cover

### ✅ **Step 1: PMS Integration Deployment**
- Creates a new PMS integration with code `testhotel`
- Generates translator files in `pms/testhotel/` folder
- Creates mapping configuration and manifest files

### ✅ **Step 2: JSON Feed Translation**
- Sends JSON PMS feed data to the translation endpoint
- Tests field mapping from source to target fields
- Verifies the translation applies the correct mappings

### ✅ **Step 3: XML Feed Translation**
- Sends XML PMS feed data to the translation endpoint
- Tests XML tag transformation based on mappings
- Verifies XML structure is preserved during translation

### ✅ **Step 4: Test Endpoint Verification**
- Tests the `/api/pms/{pmscode}/test` endpoint
- Verifies the endpoint uses the actual generated translator
- Confirms proper error handling and response format

## Expected Test Results

### Successful Deployment
```
✅ Deployment successful!
📁 Files created: testhotel_translator.cs, mapping.json, manifest.json
```

### Successful JSON Translation
```json
{
  "InvCode": "Deluxe King",
  "RatePlanCode": "Standard Rate",
  "GuestName": "John Smith",
  "CheckInDate": "2024-01-15",
  "CheckOutDate": "2024-01-17",
  "TotalAmount": 299.99,
  "roomNumber": "101",
  "specialRequests": "Late check-in requested"
}
```

### Successful XML Translation
```xml
<booking>
    <InvCode>Suite</InvCode>
    <RatePlanCode>Premium</RatePlanCode>
    <GuestName>Jane Doe</GuestName>
    <CheckInDate>2024-02-01</CheckInDate>
    <CheckOutDate>2024-02-03</CheckOutDate>
    <TotalAmount>599.99</TotalAmount>
</booking>
```

## Manual Testing

### Test Deployment via UI
1. Open the onboarding wizard at `http://localhost:5173`
2. Complete steps 1-4 to deploy a PMS integration
3. Use the "Test Deployment" button in step 5

### Test Translation via API
```bash
# Test JSON translation
curl -X POST http://localhost:8000/api/pms/testhotel \
  -H "Content-Type: application/json" \
  -d '{"feedData": "{\"roomType\":\"Deluxe\",\"guestName\":\"John\"}"}'

# Test XML translation
curl -X POST http://localhost:8000/api/pms/testhotel \
  -H "Content-Type: application/json" \
  -d '{"feedData": "<booking><roomType>Suite</roomType></booking>"}'

# Test endpoint
curl -X POST http://localhost:8000/api/pms/testhotel/test \
  -H "Content-Type: application/json" \
  -d '{"testData": "Sample test data"}'
```

## Troubleshooting

### Common Issues

1. **Backend Not Running**
   ```
   ❌ Test failed: connect ECONNREFUSED 127.0.0.1:8000
   ```
   **Solution**: Start the backend with `cd api && dotnet run`

2. **Deployment Failed**
   ```
   ❌ Deployment failed: 500 Internal Server Error
   ```
   **Solution**: Check backend logs for detailed error information

3. **Translation Not Working**
   ```
   ❌ Translation failed: 404 Not Found
   ```
   **Solution**: Ensure the PMS integration was deployed successfully

4. **Field Mapping Issues**
   ```
   📤 Translated data shows original field names
   ```
   **Solution**: Check that the mapping.json file contains correct field mappings

### Debug Steps

1. **Check Backend Logs**
   ```bash
   # In the backend terminal, look for:
   [INFO] Received PMS feed request for PMS code: testhotel
   [INFO] Successfully processed PMS feed for testhotel
   ```

2. **Verify Generated Files**
   ```bash
   ls -la pms/testhotel/
   # Should show: testhotel_translator.cs, mapping.json, manifest.json
   ```

3. **Check File Contents**
   ```bash
   cat pms/testhotel/mapping.json
   # Should show field mappings
   ```

4. **Test Individual Endpoints**
   ```bash
   # Test deployment
   curl -X POST http://localhost:8000/api/deployment/deploy \
     -H "Content-Type: application/json" \
     -d '{"pmsCode":"test","pmsName":"Test"}'
   ```

## Performance Testing

### Load Testing
```bash
# Test with multiple concurrent requests
for i in {1..10}; do
  curl -X POST http://localhost:8000/api/pms/testhotel \
    -H "Content-Type: application/json" \
    -d '{"feedData":"{\"test\":\"data\"}"}' &
done
wait
```

### Memory Usage
Monitor the backend process memory usage during testing:
```bash
# On Windows
tasklist /FI "IMAGENAME eq dotnet.exe"

# On Linux/macOS
ps aux | grep dotnet
```

## Integration Testing

### End-to-End Flow
1. **Deploy Integration**: Use the UI wizard to deploy a new PMS
2. **Generate Files**: Verify files are created in the correct location
3. **Test Translation**: Send PMS feeds and verify translation
4. **Monitor Logs**: Check backend logs for any errors
5. **Verify Results**: Confirm translated data matches expected format

### Error Scenarios
- Test with invalid PMS codes
- Test with malformed JSON/XML
- Test with empty feed data
- Test with non-existent PMS integrations

## Success Criteria

✅ **All test scripts complete without errors**
✅ **Generated files are created in the correct location**
✅ **Field mappings are applied correctly**
✅ **Both JSON and XML formats are supported**
✅ **Error handling works as expected**
✅ **Backend logs show proper processing**
✅ **Response times are acceptable (< 1 second)**

## Next Steps

After successful testing:
1. **Production Deployment**: Deploy to production environment
2. **Monitoring**: Set up logging and monitoring
3. **Documentation**: Update user documentation
4. **Training**: Train users on the new system 