// Simple test script to verify frontend-backend integration
async function testIntegration() {
  console.log('🧪 Testing Frontend-Backend Integration...\n');

  const apiUrl = 'http://localhost:8000';

  try {
    // Test 1: Backend health check
    console.log('1️⃣ Testing backend health...');
    const healthResponse = await fetch(`${apiUrl}/`);
    const healthData = await healthResponse.json();
    console.log(`   ✅ Backend is running: ${healthData.message}\n`);

    // Test 2: Test Gemini provider evaluation
    console.log('2️⃣ Testing Gemini provider evaluation...');
    const evaluateResponse = await fetch(`${apiUrl}/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-LLM-Provider': 'gemini',
      },
      body: JSON.stringify({
        text: 'Hello world',
        task_description: 'Count the words in this text',
        example_output: '2 words',
      }),
    });

    if (evaluateResponse.ok) {
      const evaluateData = await evaluateResponse.json();
      console.log(`   ✅ Gemini evaluation successful:`);
      console.log(`      Tool: ${evaluateData.tool}`);
      console.log(`      Reasoning: ${evaluateData.reasoning}\n`);
    } else {
      console.log(`   ❌ Gemini evaluation failed: ${evaluateResponse.status}`);
    }

    // Test 3: Test Gemini provider conversion
    console.log('3️⃣ Testing Gemini provider conversion...');
    const convertResponse = await fetch(`${apiUrl}/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-LLM-Provider': 'gemini',
      },
      body: JSON.stringify({
        text: 'Hello world',
        task_description: 'Count the words in this text',
        example_output: '2 words',
      }),
    });

    if (convertResponse.ok) {
      const convertData = await convertResponse.json();
      console.log(`   ✅ Gemini conversion successful:`);
      console.log(`      Original: "${convertData.original_text}"`);
      console.log(`      Converted: "${convertData.converted_text}"`);
      console.log(`      Tool used: ${convertData.tool_used}\n`);
    } else {
      console.log(`   ❌ Gemini conversion failed: ${convertResponse.status}`);
    }

    // Test 4: Test Mock provider
    console.log('4️⃣ Testing Mock provider...');
    const mockResponse = await fetch(`${apiUrl}/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-LLM-Provider': 'mock',
      },
      body: JSON.stringify({
        text: 'Test text',
        task_description: 'Count words',
        example_output: '2 words',
      }),
    });

    if (mockResponse.ok) {
      const mockData = await mockResponse.json();
      console.log(`   ✅ Mock provider working: ${mockData.tool}\n`);
    } else {
      console.log(`   ❌ Mock provider failed: ${mockResponse.status}`);
    }

    console.log('🎉 Integration test completed successfully!');
    console.log('\n📱 Frontend is running at: http://localhost:3000');
    console.log('🔧 Backend is running at: http://localhost:8000');
    console.log('\n💡 You can now test the full application in your browser!');
  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    console.log('\n🔍 Troubleshooting tips:');
    console.log('   - Make sure both frontend and backend servers are running');
    console.log('   - Check that ports 3000 and 8000 are available');
    console.log('   - Verify the backend has the Gemini API key configured');
  }
}

// Run the test
testIntegration();
