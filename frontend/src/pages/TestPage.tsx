import React from 'react';
import ApiTest from '../components/test/ApiTest';

const TestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            FashionConnect Integration Test
          </h1>
          <p className="text-lg text-gray-600">
            Test the connection between frontend and backend APIs
          </p>
        </div>
        
        <ApiTest />
        
        <div className="mt-8 text-center">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Integration Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800">Backend Server</h4>
                <p className="text-sm text-green-600">Running on http://localhost:8000</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800">Frontend App</h4>
                <p className="text-sm text-blue-600">Running on http://localhost:5173</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPage;
