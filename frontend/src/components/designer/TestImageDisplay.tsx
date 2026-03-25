import React, { useState, useEffect } from 'react';
import { tailorService } from '../../services/tailorService';
import { getImageUrl } from '../../utils/imageUtils';

const TestImageDisplay: React.FC = () => {
  const [tailors, setTailors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchTailors();
  }, []);

  const fetchTailors = async () => {
    try {
      setLoading(true);
      const data = await tailorService.getDesignerTailors();
      console.log('📋 Raw tailors data from API:', data);
      
      // Log detailed information about each tailor's profile image
      data.forEach((tailor, index) => {
        console.log(`\n--- Tailor ${index + 1}: ${tailor.name} ---`);
        console.log('Profile Image Path:', tailor.profileImage);
        console.log('Profile Image Type:', typeof tailor.profileImage);
        console.log('Is Valid Path:', tailor.profileImage && tailor.profileImage !== 'null' && tailor.profileImage !== 'undefined');
        
        if (tailor.profileImage) {
          const constructedUrl = getImageUrl(tailor.profileImage);
          console.log('Constructed URL:', constructedUrl);
        }
      });
      
      setTailors(data);
    } catch (error) {
      console.error('Error fetching tailors:', error);
    } finally {
      setLoading(false);
    }
  };

  const testImageAccess = async (tailor: any) => {
    if (!tailor.profileImage) return;
    
    const constructedUrl = getImageUrl(tailor.profileImage);
    console.log(`Testing image access for ${tailor.name}:`, constructedUrl);
    
    try {
      const response = await fetch(constructedUrl, { method: 'HEAD' });
      const result = response.ok ? 'SUCCESS' : `FAILED (${response.status})`;
      console.log(`URL Test for ${tailor.name}:`, result);
      setTestResults(prev => ({ ...prev, [tailor.id]: result }));
    } catch (error: any) {
      const result = `ERROR - ${error.message}`;
      console.log(`URL Test for ${tailor.name}:`, result);
      setTestResults(prev => ({ ...prev, [tailor.id]: result }));
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Tailor Image Test</h2>
      <button 
        onClick={fetchTailors}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Refresh Data
      </button>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tailors.map((tailor) => (
          <div key={tailor.id} className="border rounded-lg p-4">
            <h3 className="font-semibold">{tailor.name}</h3>
            <p className="text-sm text-gray-600">{tailor.email}</p>
            
            {tailor.profileImage ? (
              <div className="mt-2">
                <p className="text-xs text-gray-500 break-all">Path: {tailor.profileImage}</p>
                <p className="text-xs text-gray-500 break-all">URL: {getImageUrl(tailor.profileImage)}</p>
                <button 
                  onClick={() => testImageAccess(tailor)}
                  className="mt-2 px-2 py-1 bg-gray-200 text-xs rounded hover:bg-gray-300"
                >
                  Test Access
                </button>
                {testResults[tailor.id] && (
                  <p className="text-xs mt-1 
                    {testResults[tailor.id].includes('SUCCESS') ? 'text-green-600' : 'text-red-600'}">
                    {testResults[tailor.id]}
                  </p>
                )}
                <img
                  src={getImageUrl(tailor.profileImage)}
                  alt={tailor.name}
                  className="mt-2 w-24 h-24 rounded-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    console.log('Image failed to load:', target.src);
                    // Try direct backend URL as fallback
                    const directUrl = `http://localhost:8000${tailor.profileImage}`;
                    target.src = directUrl;
                    target.onerror = () => {
                      // Final fallback to UI avatar
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(tailor.name)}&background=6366f1&color=fff`;
                    };
                  }}
                />
              </div>
            ) : (
              <div className="mt-2 text-gray-500">No profile image</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestImageDisplay;