import React, { useState, useEffect } from 'react';
import { getImageUrl } from '../../utils/imageUtils';

const ImageAccessTest: React.FC = () => {
  const [imageTestResults, setImageTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);

  // Test image paths
  const testImagePaths = [
    '/uploads/profiles/profile-1752691390539-297350461.jpg',
    '/uploads/profiles/profile-1753466582591-149196684.jpeg',
    '/uploads/profiles/profile-1753466582636-522825463.jpeg'
  ];

  const fetchTailorProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/v1/tailors/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('Profile data:', data);
      setProfileData(data);
      
      // Test the profile image from the actual profile
      if (data.data?.profileImage) {
        testImageAccess(data.data.profileImage, 'Profile Image');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const testImageAccess = async (imagePath: string, label: string = 'Test Image') => {
    setLoading(true);
    try {
      const constructedUrl = getImageUrl(imagePath);
      console.log(`Testing ${label}:`, { path: imagePath, url: constructedUrl });
      
      // Test if we can fetch the image
      const response = await fetch(constructedUrl, { method: 'HEAD' });
      
      const result = {
        label,
        path: imagePath,
        url: constructedUrl,
        status: response.ok ? 'SUCCESS' : `FAILED (${response.status})`,
        canAccess: response.ok,
        error: null
      };
      
      setImageTestResults(prev => [...prev, result]);
    } catch (error: any) {
      const result = {
        label,
        path: imagePath,
        url: getImageUrl(imagePath),
        status: 'ERROR',
        canAccess: false,
        error: error.message
      };
      
      setImageTestResults(prev => [...prev, result]);
    } finally {
      setLoading(false);
    }
  };

  const testAllImages = async () => {
    setImageTestResults([]);
    for (const imagePath of testImagePaths) {
      await testImageAccess(imagePath, `Sample Image ${testImagePaths.indexOf(imagePath) + 1}`);
    }
  };

  useEffect(() => {
    // Auto-fetch profile on component mount
    fetchTailorProfile();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Image Access Test</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Profile Data</h2>
        <button
          onClick={fetchTailorProfile}
          disabled={loading}
          className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Fetching...' : 'Refresh Profile'}
        </button>
        
        {profileData ? (
          <div className="space-y-2">
            <p><strong>Status:</strong> {profileData.statusCode} {profileData.success ? 'SUCCESS' : 'ERROR'}</p>
            {profileData.data && (
              <div>
                <p><strong>Name:</strong> {profileData.data.name}</p>
                <p><strong>Email:</strong> {profileData.data.email}</p>
                {profileData.data.profileImage && (
                  <p><strong>Profile Image Path:</strong> {profileData.data.profileImage}</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <p>No profile data available</p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Image Tests</h2>
        <div className="flex space-x-4 mb-4">
          <button
            onClick={testAllImages}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Sample Images'}
          </button>
        </div>
        
        <div className="space-y-4">
          {imageTestResults.map((result, index) => (
            <div key={index} className="border rounded-lg p-4">
              <h3 className="font-medium">{result.label}</h3>
              <p className="text-sm text-gray-600 break-all">Path: {result.path}</p>
              <p className="text-sm text-gray-600 break-all">URL: {result.url}</p>
              <p className={`mt-2 font-medium ${
                result.canAccess ? 'text-green-600' : 'text-red-600'
              }`}>
                Status: {result.status}
              </p>
              {result.error && (
                <p className="text-red-500 text-sm mt-1">Error: {result.error}</p>
              )}
              
              {result.canAccess && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600">Image preview:</p>
                  <img 
                    src={result.url} 
                    alt={result.label} 
                    className="mt-2 w-32 h-32 object-cover rounded border"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      console.log('Image failed to load:', target.src);
                      target.src = 'https://ui-avatars.com/api/?name=Error&background=ef4444&color=fff';
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImageAccessTest;