import React, { useState, useEffect } from 'react';
import { tailorService } from '../../services/tailorService';
import { getImageUrl, DEFAULT_PROFILE_IMAGE } from '../../utils/imageUtils';

const ImageTestPage: React.FC = () => {
  const [tailors, setTailors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<Record<string, { status: string; url: string }>>({});

  useEffect(() => {
    fetchTailors();
  }, []);

  const fetchTailors = async () => {
    try {
      setLoading(true);
      const data = await tailorService.getDesignerTailors();
      console.log('📋 Raw tailors data from API:', data);
      setTailors(data);
    } catch (error) {
      console.error('Error fetching tailors:', error);
    } finally {
      setLoading(false);
    }
  };

  const testImageAccess = async (tailor: any) => {
    if (!tailor.profileImage) {
      setTestResults(prev => ({
        ...prev,
        [tailor.id]: { status: 'NO_IMAGE', url: '' }
      }));
      return;
    }

    const constructedUrl = getImageUrl(tailor.profileImage);
    console.log(`Testing image access for ${tailor.name}:`, constructedUrl);

    try {
      // Test if we can fetch the image
      const response = await fetch(constructedUrl, { method: 'HEAD' });
      const status = response.ok ? 'SUCCESS' : `FAILED (${response.status})`;
      
      setTestResults(prev => ({
        ...prev,
        [tailor.id]: { status, url: constructedUrl }
      }));
      
      console.log(`URL Test for ${tailor.name}:`, status);
    } catch (error: any) {
      const status = `ERROR - ${error.message}`;
      
      setTestResults(prev => ({
        ...prev,
        [tailor.id]: { status, url: constructedUrl }
      }));
      
      console.log(`URL Test for ${tailor.name}:`, status);
    }
  };

  const preloadImage = (src: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  };

  const testImagePreload = async (tailor: any) => {
    if (!tailor.profileImage) return;

    const constructedUrl = getImageUrl(tailor.profileImage);
    const canLoad = await preloadImage(constructedUrl);
    
    setTestResults(prev => ({
      ...prev,
      [tailor.id]: { 
        status: canLoad ? 'PRELOAD_SUCCESS' : 'PRELOAD_FAILED', 
        url: constructedUrl 
      }
    }));
  };

  if (loading) {
    return <div className="p-8 text-center">Loading tailors...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Tailor Image Display Test</h1>
      
      <div className="mb-6">
        <button 
          onClick={fetchTailors}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
        >
          Refresh Data
        </button>
        <p className="text-sm text-gray-600 mt-2">
          This page helps diagnose issues with tailor profile image display.
        </p>
      </div>

      {tailors.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No tailors found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tailors.map((tailor) => (
            <div key={tailor.id} className="border rounded-lg p-4 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 mr-4">
                  {tailor.profileImage ? (
                    <img
                      src={getImageUrl(tailor.profileImage)}
                      alt={tailor.name}
                      className="w-16 h-16 rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        console.log('🖼️ Image failed to load for:', tailor.name, target.src);
                        // Try direct backend URL as fallback
                        const directUrl = `http://localhost:8000${tailor.profileImage}`;
                        target.src = directUrl;
                        target.onerror = () => {
                          // Final fallback to UI avatar
                          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(tailor.name)}&background=6366f1&color=fff`;
                        };
                      }}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 text-xs">No Image</span>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">{tailor.name}</h3>
                  <p className="text-sm text-gray-600">{tailor.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium">Profile Image Path:</p>
                <p className="text-xs bg-gray-100 p-2 rounded break-all">
                  {tailor.profileImage || 'None'}
                </p>

                {tailor.profileImage && (
                  <>
                    <p className="text-xs font-medium">Constructed URL:</p>
                    <p className="text-xs bg-gray-100 p-2 rounded break-all">
                      {getImageUrl(tailor.profileImage)}
                    </p>
                  </>
                )}

                {testResults[tailor.id] && (
                  <div className="mt-2 p-2 rounded text-xs">
                    <p className={`font-medium ${
                      testResults[tailor.id].status.includes('SUCCESS') ? 'text-green-600' : 'text-red-600'
                    }`}>
                      Status: {testResults[tailor.id].status}
                    </p>
                    {testResults[tailor.id].url && (
                      <p className="text-gray-600 mt-1 break-all">
                        URL: {testResults[tailor.id].url}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex space-x-2 mt-3">
                  {tailor.profileImage && (
                    <>
                      <button
                        onClick={() => testImageAccess(tailor)}
                        className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                      >
                        Test Access
                      </button>
                      <button
                        onClick={() => testImagePreload(tailor)}
                        className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                      >
                        Test Preload
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-medium text-yellow-800 mb-2">Debugging Information</h3>
        <p className="text-sm text-yellow-700">
          If images are not displaying, check the browser console for error messages. 
          Common issues include CORS restrictions, incorrect file paths, or server configuration problems.
        </p>
      </div>
    </div>
  );
};

export default ImageTestPage;