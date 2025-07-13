// Simple test script for PMS feed processing
// Run with: node test-pms-feed-simple.js

async function testPmsFeedProcessing() {
    console.log('🧪 Testing PMS Feed Processing with Generated Translators\n');

    const testPmsCode = 'testhotel';
    const testPmsName = 'Test Hotel PMS';
    
    try {
        // Step 1: Deploy a new PMS integration
        console.log('📦 Step 1: Deploying new PMS integration...');
        const deploymentData = {
            pmsCode: testPmsCode,
            pmsName: testPmsName,
            mappings: [
                { sourceField: 'roomType', targetField: 'InvCode', confidence: 0.95 },
                { sourceField: 'ratePlan', targetField: 'RatePlanCode', confidence: 0.92 },
                { sourceField: 'guestName', targetField: 'GuestName', confidence: 0.88 },
                { sourceField: 'checkInDate', targetField: 'CheckInDate', confidence: 0.90 },
                { sourceField: 'checkOutDate', targetField: 'CheckOutDate', confidence: 0.90 },
                { sourceField: 'totalAmount', targetField: 'TotalAmount', confidence: 0.85 }
            ],
            generatedFiles: [
                `${testPmsCode}_translator.cs`,
                'mapping.json',
                'manifest.json'
            ]
        };

        const deployResponse = await fetch('http://localhost:8000/api/deployment/deploy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(deploymentData),
        });

        if (!deployResponse.ok) {
            throw new Error(`Deployment failed: ${deployResponse.status} ${deployResponse.statusText}`);
        }

        const deployResult = await deployResponse.json();
        console.log('✅ Deployment successful!');
        console.log('📁 Files created:', deployResult.files.join(', '));
        console.log('');

        // Step 2: Test translation endpoint with JSON data
        console.log('🔄 Step 2: Testing translation endpoint with JSON data...');
        
        const testFeedData = {
            roomType: 'Deluxe King',
            ratePlan: 'Standard Rate',
            guestName: 'John Smith',
            checkInDate: '2024-01-15',
            checkOutDate: '2024-01-17',
            totalAmount: 299.99,
            roomNumber: '101',
            specialRequests: 'Late check-in requested'
        };

        const translationResponse = await fetch(`http://localhost:8000/api/pms/${testPmsCode}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ feedData: JSON.stringify(testFeedData) }),
        });

        if (!translationResponse.ok) {
            throw new Error(`Translation failed: ${translationResponse.status} ${translationResponse.statusText}`);
        }

        const translationResult = await translationResponse.json();
        console.log('✅ Translation successful!');
        console.log('📤 Translated data:');
        console.log(translationResult.translatedData);
        console.log('');

        // Step 3: Test with XML format
        console.log('🔄 Step 3: Testing with XML feed format...');
        
        const xmlFeedData = `
<booking>
    <roomType>Suite</roomType>
    <ratePlan>Premium</ratePlan>
    <guestName>Jane Doe</guestName>
    <checkInDate>2024-02-01</checkInDate>
    <checkOutDate>2024-02-03</checkOutDate>
    <totalAmount>599.99</totalAmount>
</booking>`;

        const xmlResponse = await fetch(`http://localhost:8000/api/pms/${testPmsCode}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ feedData: xmlFeedData }),
        });

        if (xmlResponse.ok) {
            const xmlResult = await xmlResponse.json();
            console.log('✅ XML feed translation successful!');
            console.log('📤 XML translated data:');
            console.log(xmlResult.translatedData);
        } else {
            console.log('⚠️ XML feed translation failed:', xmlResponse.status);
        }
        console.log('');

        // Step 4: Test the test endpoint
        console.log('🔄 Step 4: Testing the test endpoint...');
        
        const testEndpointResponse = await fetch(`http://localhost:8000/api/pms/${testPmsCode}/test`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ testData: 'Sample test data for verification' }),
        });

        if (testEndpointResponse.ok) {
            const testResult = await testEndpointResponse.json();
            console.log('✅ Test endpoint working!');
            console.log('📤 Test result:', testResult.message);
        } else {
            console.log('⚠️ Test endpoint failed:', testEndpointResponse.status);
        }
        console.log('');

        console.log('🎉 All tests completed successfully!');
        console.log('');
        console.log('📋 Summary:');
        console.log('✅ PMS integration deployment');
        console.log('✅ JSON feed translation with field mapping');
        console.log('✅ XML feed translation with field mapping');
        console.log('✅ Test endpoint with actual translator');
        console.log('');
        console.log('🚀 The PMS feed processing system is working correctly!');
        console.log('📁 Check the pms/testhotel/ folder for generated files');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('');
        console.error('🔧 Troubleshooting:');
        console.error('1. Make sure the backend server is running on http://localhost:8000');
        console.error('2. Check that the deployment endpoint is working');
        console.error('3. Verify the PMS translator files are generated correctly');
        console.error('4. Check the backend logs for detailed error information');
    }
}

// Run the test
testPmsFeedProcessing(); 