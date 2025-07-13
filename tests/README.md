# Tests Directory

This directory contains all test scripts for the PMS Integration Platform.

## Test Files

### 🧪 **test-pms-feed-simple.js**
- **Purpose**: Node.js test script for PMS feed processing
- **Tests**: Deployment, JSON translation, XML translation, test endpoint
- **Run**: `node test-pms-feed-simple.js`
- **Requirements**: Node.js with built-in fetch support

### 🧪 **test-pms-feed.ps1**
- **Purpose**: PowerShell test script for PMS feed processing (Windows)
- **Tests**: Same as Node.js version but with PowerShell syntax
- **Run**: `.\test-pms-feed.ps1`
- **Requirements**: PowerShell 5.1+

### 🧪 **test-pms-feed-curl.sh**
- **Purpose**: Bash/Curl test script for PMS feed processing (Linux/macOS)
- **Tests**: Same functionality using curl commands
- **Run**: `chmod +x test-pms-feed-curl.sh && ./test-pms-feed-curl.sh`
- **Requirements**: Bash, curl, jq (optional for JSON parsing)

### 🧪 **test-deployment.js**
- **Purpose**: Simple deployment test script
- **Tests**: Basic deployment functionality
- **Run**: `node test-deployment.js`
- **Requirements**: Node.js

### 🚀 **run-tests.ps1**
- **Purpose**: Interactive test runner for all tests
- **Features**: 
  - Backend status check
  - Menu-driven test selection
  - Automatic dependency detection
  - Run all tests option
- **Run**: `.\run-tests.ps1`
- **Requirements**: PowerShell 5.1+

## Quick Start

### Option 1: Interactive Test Runner (Recommended)
```powershell
.\tests\run-tests.ps1
```

### Option 2: Individual Tests
```powershell
# PowerShell test
.\tests\test-pms-feed.ps1

# Node.js test
node tests\test-pms-feed-simple.js

# Deployment test
node tests\test-deployment.js
```

### Option 3: Linux/macOS
```bash
# Make executable and run
chmod +x tests/test-pms-feed-curl.sh
./tests/test-pms-feed-curl.sh
```

## What Each Test Covers

### ✅ **Deployment Testing**
- Creates new PMS integration with code `testhotel`
- Generates translator files in `pms/testhotel/` folder
- Creates mapping configuration and manifest files

### ✅ **JSON Feed Translation**
- Sends JSON PMS feed data to translation endpoint
- Tests field mapping from source to target fields
- Verifies translation applies correct mappings

### ✅ **XML Feed Translation**
- Sends XML PMS feed data to translation endpoint
- Tests XML tag transformation based on mappings
- Verifies XML structure is preserved during translation

### ✅ **Test Endpoint Verification**
- Tests the `/api/pms/{pmscode}/test` endpoint
- Verifies endpoint uses actual generated translator
- Confirms proper error handling and response format

### ✅ **Error Handling**
- Tests with invalid PMS codes
- Tests with malformed data
- Tests with missing integrations

## Prerequisites

1. **Backend Server**: Must be running on `http://localhost:8000`
   ```bash
   cd api
   dotnet run
   ```

2. **Dependencies**: 
   - Node.js (for .js tests)
   - PowerShell (for .ps1 tests)
   - Bash + curl (for .sh tests)

## Expected Results

### Successful Test Run
```
🧪 Testing PMS Feed Processing with Generated Translators

📦 Step 1: Deploying new PMS integration...
✅ Deployment successful!
📁 Files created: testhotel_translator.cs, mapping.json, manifest.json

🔄 Step 2: Testing translation endpoint with JSON data...
✅ Translation successful!
📤 Translated data:
{
  "InvCode": "Deluxe King",
  "RatePlanCode": "Standard Rate",
  "GuestName": "John Smith",
  ...
}

🎉 All tests completed successfully!
```

## Troubleshooting

### Common Issues

1. **Backend Not Running**
   ```
   ❌ Test failed: connect ECONNREFUSED 127.0.0.1:8000
   ```
   **Solution**: Start backend with `cd api && dotnet run`

2. **PowerShell Execution Policy**
   ```
   ❌ Cannot run script due to execution policy
   ```
   **Solution**: Run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

3. **Node.js Not Found**
   ```
   ❌ Node.js is not installed or not in PATH
   ```
   **Solution**: Install Node.js from https://nodejs.org/

4. **Curl Not Found**
   ```
   ❌ Curl is not installed or not in PATH
   ```
   **Solution**: Install curl (usually pre-installed on Linux/macOS)

## File Structure

```
tests/
├── README.md                    # This file
├── run-tests.ps1               # Interactive test runner
├── test-pms-feed-simple.js     # Node.js PMS feed test
├── test-pms-feed.ps1           # PowerShell PMS feed test
├── test-pms-feed-curl.sh       # Bash/Curl PMS feed test
└── test-deployment.js          # Simple deployment test
```

## Contributing

When adding new tests:
1. Follow the naming convention: `test-{feature}.{extension}`
2. Include comprehensive error handling
3. Add documentation to this README
4. Update the test runner if needed
5. Test on multiple platforms if possible 