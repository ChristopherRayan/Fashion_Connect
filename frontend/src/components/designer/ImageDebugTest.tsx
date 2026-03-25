import React, { useState, useEffect } from 'react';
import { getImageUrl } from '../../utils/imageUtils';

const ImageDebugTest: React.FC = () => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Sample image paths from the uploads directory
  const sampleImagePaths = [
    '/uploads/profiles/profile-1752691390539-297350461.jpg',
    '/uploads/profiles/profile-1753466582591-149196684.jpeg',
    '/uploads/profiles/profile-1753466582636-522825463.jpeg'
  ];

  const testImageAccess = async () => {
    setLoading(true);
    const results = [];
    
    for (const imagePath of sampleImagePaths) {
      try {
        const constructedUrl = getImageUrl(imagePath);
        console.log(`Testing: ${imagePath} -> ${constructedUrl}`);
        
        // Test if we can fetch the image
        const response = await fetch(constructedUrl, { method: 'HEAD' });
        results.push({
          path: imagePath,
          url: constructedUrl,
          status: response.ok ? 'SUCCESS' : `FAILED (${response.status})`,
          error: null
        });
      } catch (error: any) {
        results.push({
          path: imagePath,
          url: getImageUrl(imagePath),
          status: 'ERROR',
          error: error.message
        });
      }
    }
    
    setTestResults(results);
    setLoading(false);
  };

  useEffect(() => {
    testImageAccess();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Image Access Debug Test</h1>
      
      <button 
        onClick={testImageAccess}
        disabled={loading}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Image Access'}
      </button>
      
      <div className="space-y-4">
        {testResults.map((result, index) => (
          <div key={index} className="border rounded-lg p-4">
            <h3 className="font-medium">Path: {result.path}</h3>
            <p className="text-sm text-gray-600 break-all">URL: {result.url}</p>
            <p className={`mt-2 font-medium ${
              result.status === 'SUCCESS' ? 'text-green-600' : 'text-red-600'
            }`}>
              Status: {result.status}
            </p>
            {result.error && (
              <p className="text-red-500 text-sm mt-1">Error: {result.error}</p>
            )}
            
            {result.status === 'SUCCESS' && (
              <div className="mt-3">
                <p className="text-sm text-gray-600">Image preview:</p>
                <img 
                  src={result.url} 
                  alt="Test" 
                  className="mt-2 w-32 h-32 object-cover rounded"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    console.log('Image failed to load:', target.src);
                    target.src = 'https://ui-avatars.com/api/?name=Test&background=6366f1&color=fff';
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageDebugTest;