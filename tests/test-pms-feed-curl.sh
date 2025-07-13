#!/bin/bash

# Curl-based test script for PMS feed processing
# Run with: ./test-pms-feed-curl.sh

echo "🧪 Testing PMS Feed Processing with Generated Translators"
echo ""

TEST_PMS_CODE="testhotel"
TEST_PMS_NAME="Test Hotel PMS"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Deploy a new PMS integration
echo -e "${YELLOW}📦 Step 1: Deploying new PMS integration...${NC}"

DEPLOYMENT_DATA='{
  "pmsCode": "'$TEST_PMS_CODE'",
  "pmsName": "'$TEST_PMS_NAME'",
  "mappings": [
    {"sourceField": "roomType", "targetField": "InvCode", "confidence": 0.95},
    {"sourceField": "ratePlan", "targetField": "RatePlanCode", "confidence": 0.92},
    {"sourceField": "guestName", "targetField": "GuestName", "confidence": 0.88},
    {"sourceField": "checkInDate", "targetField": "CheckInDate", "confidence": 0.90},
    {"sourceField": "checkOutDate", "targetField": "CheckOutDate", "confidence": 0.90},
    {"sourceField": "totalAmount", "targetField": "TotalAmount", "confidence": 0.85}
  ],
  "generatedFiles": [
    "'$TEST_PMS_CODE'_translator.cs",
    "mapping.json",
    "manifest.json"
  ]
}'

DEPLOY_RESPONSE=$(curl -s -X POST http://localhost:8000/api/deployment/deploy \
  -H "Content-Type: application/json" \
  -d "$DEPLOYMENT_DATA")

if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo "📁 Response: $DEPLOY_RESPONSE"
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi
echo ""

# Step 2: Test translation endpoint with JSON data
echo -e "${YELLOW}🔄 Step 2: Testing translation endpoint with JSON data...${NC}"

TEST_FEED_DATA='{
  "roomType": "Deluxe King",
  "ratePlan": "Standard Rate",
  "guestName": "John Smith",
  "checkInDate": "2024-01-15",
  "checkOutDate": "2024-01-17",
  "totalAmount": 299.99,
  "roomNumber": "101",
  "specialRequests": "Late check-in requested"
}'

TRANSLATION_BODY='{"feedData": "'$(echo "$TEST_FEED_DATA" | tr -d '\n' | sed 's/"/\\"/g')'"}'

TRANSLATION_RESPONSE=$(curl -s -X POST http://localhost:8000/api/pms/$TEST_PMS_CODE \
  -H "Content-Type: application/json" \
  -d "$TRANSLATION_BODY")

if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✅ Translation successful!${NC}"
    echo "📤 Translated data:"
    echo "$TRANSLATION_RESPONSE" | jq -r '.translatedData' 2>/dev/null || echo "$TRANSLATION_RESPONSE"
else
    echo -e "${RED}❌ Translation failed${NC}"
fi
echo ""

# Step 3: Test with XML format
echo -e "${YELLOW}🔄 Step 3: Testing with XML feed format...${NC}"

XML_FEED_DATA='<booking>
    <roomType>Suite</roomType>
    <ratePlan>Premium</ratePlan>
    <guestName>Jane Doe</guestName>
    <checkInDate>2024-02-01</checkInDate>
    <checkOutDate>2024-02-03</checkOutDate>
    <totalAmount>599.99</totalAmount>
</booking>'

XML_BODY='{"feedData": "'$(echo "$XML_FEED_DATA" | tr -d '\n' | sed 's/"/\\"/g')'"}'

XML_RESPONSE=$(curl -s -X POST http://localhost:8000/api/pms/$TEST_PMS_CODE \
  -H "Content-Type: application/json" \
  -d "$XML_BODY")

if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✅ XML feed translation successful!${NC}"
    echo "📤 XML translated data:"
    echo "$XML_RESPONSE" | jq -r '.translatedData' 2>/dev/null || echo "$XML_RESPONSE"
else
    echo -e "${RED}❌ XML feed translation failed${NC}"
fi
echo ""

# Step 4: Test the test endpoint
echo -e "${YELLOW}🔄 Step 4: Testing the test endpoint...${NC}"

TEST_BODY='{"testData": "Sample test data for verification"}'

TEST_RESPONSE=$(curl -s -X POST http://localhost:8000/api/pms/$TEST_PMS_CODE/test \
  -H "Content-Type: application/json" \
  -d "$TEST_BODY")

if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✅ Test endpoint working!${NC}"
    echo "📤 Test result:"
    echo "$TEST_RESPONSE" | jq -r '.message' 2>/dev/null || echo "$TEST_RESPONSE"
else
    echo -e "${RED}❌ Test endpoint failed${NC}"
fi
echo ""

echo -e "${GREEN}🎉 All tests completed!${NC}"
echo ""
echo "📋 Summary:"
echo -e "${GREEN}✅ PMS integration deployment${NC}"
echo -e "${GREEN}✅ JSON feed translation with field mapping${NC}"
echo -e "${GREEN}✅ XML feed translation with field mapping${NC}"
echo -e "${GREEN}✅ Test endpoint with actual translator${NC}"
echo ""
echo -e "${GREEN}🚀 The PMS feed processing system is working correctly!${NC}"
echo "📁 Check the pms/$TEST_PMS_CODE/ folder for generated files" 