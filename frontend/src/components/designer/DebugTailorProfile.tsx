import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { tailorService } from '../../services/tailorService';
import { getImageUrl, isValidImagePath } from '../../utils/imageUtils';

const DebugTailorProfile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageTestResults, setImageTestResults] = useState<any>(null);
  const [testImageUrl, setTestImageUrl] = useState<string>('');
  const [tailors, setTailors] = useState<any[]>([]);

  useEffect(() => {
    fetchProfile();
    fetchTailors();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Debug: Fetching tailor profile...');
      const data = await tailorService.getTailorProfile();
      console.log('🔍 Debug: Raw profile data:', data);
      setProfile(data);
      
      // Test image URL construction
      if (data.profileImage) {
        testImageAccess(data.profileImage);
      }
    } catch (err) {
      console.error('🔍 Debug: Error fetching profile:', err);
      setError(`Failed to fetch profile: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchTailors = async () => {
    try {
      console.log('🔍 Debug: Fetching designer tailors...');
      const data = await tailorService.getDesignerTailors();
      console.log('🔍 Debug: Tailors data:', data);
      setTailors(data);
    } catch (err) {
      console.error('🔍 Debug: Error fetching tailors:', err);
    }
  };

  const testImageAccess = async (imagePath: string) => {
    console.log('🔍 Debug: Testing image access for path:', imagePath);
    
    // Test 1: Direct URL access
    const directUrl = `http://localhost:8000${imagePath}`;
    console.log('🔍 Debug: Testing direct URL:', directUrl);
    
    try {
      const response = await fetch(directUrl, { method: 'HEAD' });
      console.log('🔍 Debug: Direct URL response:', response.status, response.statusText);
      
      // Test 2: Using getImageUrl utility
      const utilUrl = getImageUrl(imagePath);
      console.log('🔍 Debug: getImageUrl result:', utilUrl);
      
      const utilResponse = await fetch(utilUrl, { method: 'HEAD' });
      console.log('🔍 Debug: getImageUrl response:', utilResponse.status, utilResponse.statusText);
      
      setImageTestResults({
        directUrl,
        directAccessible: response.ok,
        utilUrl,
        utilAccessible: utilResponse.ok,
        imagePath
      });
      
      setTestImageUrl(utilUrl);
    } catch (err) {
      console.error('🔍 Debug: Error testing image access:', err);
      setImageTestResults({
        error: err instanceof Error ? err.message : 'Unknown error',
        imagePath
      });
    }
  };

  const testProfileUpdate = async () => {
    try {
      console.log('🔍 Debug: Testing profile update...');
      const originalName = profile.name;
      const testName = `Test ${new Date().getTime()}`;
      
      // Update profile with test name
      const updatedProfile = await tailorService.updateTailorProfile({
        name: testName
      });
      
      console.log('🔍 Debug: Update response:', updatedProfile);
      
      // Fetch again to see if changes persisted
      setTimeout(async () => {
        const refetchedProfile = await tailorService.getTailorProfile();
        console.log('🔍 Debug: Refetched profile:', refetchedProfile);
        
        if (refetchedProfile.name === testName) {
          console.log('✅ Debug: Profile update persisted successfully');
        } else {
          console.log('❌ Debug: Profile update did not persist');
        }
        
        // Restore original name
        await tailorService.updateTailorProfile({
          name: originalName
        });
        fetchProfile(); // Refresh display
      }, 1000);
    } catch (err) {
      console.error('🔍 Debug: Error testing profile update:', err);
      setError(`Failed to test profile update: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const testImageLoading = async () => {
    // Try to load a known image file
    const testImagePath = '/uploads/profiles/profile-1757057706262-62692135.jpg';
    const testUrl = `http://localhost:8000${testImagePath}`;
    console.log('🔍 Debug: Testing known image URL:', testUrl);
    
    try {
      const response = await fetch(testUrl, { method: 'HEAD' });
      console.log('🔍 Debug: Known image URL response:', response.status, response.statusText);
      
      if (response.ok) {
        console.log('✅ Debug: Static file serving is working correctly');
        setTestImageUrl(testUrl);
      } else {
        console.log('❌ Debug: Static file serving is not working');
      }
    } catch (err) {
      console.error('🔍 Debug: Error testing known image:', err);
    }
  };

  const testImageWithFallback = (imagePath: string) => {
    const imageUrl = getImageUrl(imagePath);
    console.log('🔍 Debug: Testing image with fallback:', { imagePath, imageUrl });
    
    return (
      <img
        src={imageUrl}
        alt="Test"
        className="w-16 h-16 object-cover rounded border"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          console.log('🖼️ Image load error, trying direct URL:', imagePath);
          
          // Try direct backend URL as fallback
          const directUrl = `http://localhost:8000${imagePath}`;
          target.src = directUrl;
          target.onerror = () => {
            console.log('🖼️ Direct URL also failed, using UI avatar');
            // Final fallback to UI avatar
            target.src = `https://ui-avatars.com/api/?name=Test&background=6366f1&color=fff`;
          };
        }}
      />
    );
  };

  if (loading) {
    return <div className="p-4">Loading profile data...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  if (!profile) {
    return <div className="p-4">No profile data found</div>;
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Tailor Profile Debug</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Profile Data</h3>
        <pre className="bg-white p-4 rounded border text-sm overflow-auto">
          {JSON.stringify(profile, null, 2)}
        </pre>
      </div>
      
      {profile.profileImage && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Image Information</h3>
          <div className="bg-white p-4 rounded border">
            <p><strong>Stored Path:</strong> {profile.profileImage}</p>
            <p><strong>Valid Path:</strong> {isValidImagePath(profile.profileImage) ? 'Yes' : 'No'}</p>
            <p><strong>getImageUrl Result:</strong> {getImageUrl(profile.profileImage)}</p>
            
            {imageTestResults && (
              <div className="mt-2">
                <p><strong>Direct URL:</strong> {imageTestResults.directUrl}</p>
                <p><strong>Direct Accessible:</strong> {imageTestResults.directAccessible ? 'Yes' : 'No'}</p>
                <p><strong>Util URL:</strong> {imageTestResults.utilUrl}</p>
                <p><strong>Util Accessible:</strong> {imageTestResults.utilAccessible ? 'Yes' : 'No'}</p>
              </div>
            )}
            
            <div className="mt-4">
              <h4 className="font-medium mb-2">Image Preview:</h4>
              <img 
                src={getImageUrl(profile.profileImage)} 
                alt="Profile" 
                className="w-32 h-32 object-cover rounded-full border"
                onError={(e) => {
                  console.log('🔍 Debug: Image failed to load');
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <p className="mt-2 text-sm text-gray-500">If image doesn't appear, check browser console for errors</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Tailors List</h3>
        <div className="bg-white p-4 rounded border">
          <p>Total tailors: {tailors.length}</p>
          {tailors.map((tailor, index) => (
            <div key={tailor.id || index} className="mt-4 p-2 border rounded">
              <p><strong>Name:</strong> {tailor.name}</p>
              <p><strong>Email:</strong> {tailor.email}</p>
              <p><strong>Profile Image:</strong> {tailor.profileImage || 'None'}</p>
              {tailor.profileImage && (
                <div className="mt-2">
                  <p>Image Preview:</p>
                  {testImageWithFallback(tailor.profileImage)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Test Image Loading</h3>
        <button 
          onClick={testImageLoading}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 mb-4"
        >
          Test Known Image
        </button>
        
        {testImageUrl && (
          <div>
            <p className="mb-2">Test Image:</p>
            <img 
              src={testImageUrl} 
              alt="Test" 
              className="w-32 h-32 object-cover rounded border"
              onError={(e) => {
                console.log('🔍 Debug: Test image failed to load');
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
      </div>
      
      <div className="flex space-x-4">
        <button 
          onClick={fetchProfile}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh Profile
        </button>
        <button 
          onClick={testProfileUpdate}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Test Profile Update
        </button>
        <button 
          onClick={fetchTailors}
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Refresh Tailors
        </button>
      </div>
      
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Debug Instructions</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Check browser console for detailed logs (Press F12)</li>
          <li>Look for any network errors when loading images</li>
          <li>Verify if image paths are correct in the profile data</li>
          <li>Check if the backend server is running on port 8000</li>
          <li>Verify MongoDB is connected and contains the correct data</li>
        </ol>
      </div>
    </div>
  );
};

export default DebugTailorProfile;