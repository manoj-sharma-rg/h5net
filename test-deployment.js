// Test script to verify deployment endpoint
const testDeployment = async () => {
  console.log('Testing deployment endpoint...');
  
  const testData = {
    pmsCode: 'testhotel',
    pmsName: 'Test Hotel PMS',
    mappings: [
      {
        sourceField: 'roomType',
        targetField: 'InvCode',
        confidence: 0.95
      },
      {
        sourceField: 'ratePlan',
        targetField: 'RatePlanCode',
        confidence: 0.92
      }
    ],
    generatedFiles: [
      'testhotel_translator.cs',
      'mapping.json',
      'manifest.json'
    ]
  };
  
  try {
    console.log('Sending deployment request...');
    console.log('Payload:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:8000/api/deployment/deploy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Deployment successful!');
      console.log('Result:', JSON.stringify(result, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ Deployment failed!');
      console.log('Error:', errorText);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
    console.log('Make sure the backend server is running on http://localhost:8000');
    console.log('Files will be created in ../pms/testhotel/ folder');
  }
};

// Run the test
testDeployment(); 