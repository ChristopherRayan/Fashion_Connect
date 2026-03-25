import React, { useState } from 'react';
import { productService } from '../../services/productService';
import { authService } from '../../services/authService';
import { designerService } from '../../services/designerService';

const ApiTest: React.FC = () => {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testHealthCheck = async () => {
    try {
      addResult('🔍 Testing health check...');
      addResult(`📡 Making request to: http://localhost:3000/api/v1/health`);

      const response = await fetch('http://localhost:3000/api/v1/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      addResult(`📊 Response status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        addResult(`✅ Health check passed: ${data.message}`);
        addResult(`📋 Full response: ${JSON.stringify(data)}`);
      } else {
        const errorText = await response.text();
        addResult(`❌ Health check failed: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      addResult(`❌ Health check error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Health check error:', error);
    }
  };

  const testProducts = async () => {
    try {
      addResult('🔍 Testing products API...');
      setLoading(true);
      const products = await productService.getProducts({ limit: 5 });
      addResult(`✅ Products API works: Found ${products.docs.length} products`);
      if (products.docs.length > 0) {
        addResult(`📦 First product: ${products.docs[0].name}`);
      }
    } catch (error) {
      addResult(`❌ Products API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testDesigners = async () => {
    try {
      addResult('🔍 Testing designers API...');
      setLoading(true);
      const designers = await designerService.getDesigners({ limit: 5 });
      addResult(`✅ Designers API works: Found ${designers.docs.length} designers`);
      if (designers.docs.length > 0) {
        addResult(`👨‍🎨 First designer: ${designers.docs[0].name}`);
      }
    } catch (error) {
      addResult(`❌ Designers API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testAuth = async () => {
    try {
      addResult('🔍 Testing auth API...');
      setLoading(true);
      
      // Test registration
      const testEmail = `test${Date.now()}@example.com`;
      const authResponse = await authService.register({
        name: 'Test User',
        email: testEmail,
        password: 'testpassword',
        role: 'CLIENT'
      });
      
      addResult(`✅ Auth registration works: User ${authResponse.user.name} created`);
      addResult(`🔑 Access token received: ${authResponse.accessToken.substring(0, 20)}...`);
    } catch (error) {
      addResult(`❌ Auth API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const runAllTests = async () => {
    setResults([]);
    addResult('🚀 Starting integration tests...');
    
    await testHealthCheck();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testProducts();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testDesigners();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testAuth();
    
    addResult('✨ All tests completed!');
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">API Integration Test</h2>
      
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={testHealthCheck}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Test Health Check
        </button>
        
        <button
          onClick={testProducts}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          Test Products API
        </button>
        
        <button
          onClick={testDesigners}
          disabled={loading}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        >
          Test Designers API
        </button>
        
        <button
          onClick={testAuth}
          disabled={loading}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
        >
          Test Auth API
        </button>
        
        <button
          onClick={runAllTests}
          disabled={loading}
          className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50"
        >
          Run All Tests
        </button>
        
        <button
          onClick={clearResults}
          disabled={loading}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
        >
          Clear Results
        </button>
      </div>

      {loading && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded">
          <p className="text-yellow-800">🔄 Running test...</p>
        </div>
      )}

      <div className="bg-gray-100 rounded-lg p-4 h-96 overflow-y-auto">
        <h3 className="font-semibold mb-3 text-gray-700">Test Results:</h3>
        {results.length === 0 ? (
          <p className="text-gray-500 italic">No tests run yet. Click a button above to start testing.</p>
        ) : (
          <div className="space-y-1">
            {results.map((result, index) => (
              <div
                key={index}
                className={`text-sm font-mono p-2 rounded ${
                  result.includes('✅') ? 'bg-green-100 text-green-800' :
                  result.includes('❌') ? 'bg-red-100 text-red-800' :
                  result.includes('🔍') ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-50 text-gray-700'
                }`}
              >
                {result}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiTest;
