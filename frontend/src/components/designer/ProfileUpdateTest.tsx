import React, { useState } from 'react';
import { tailorService } from '../../services/tailorService';

const ProfileUpdateTest: React.FC = () => {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: 'Test Tailor',
    bio: 'This is a test bio',
    experience: 5
  });

  const testProfileUpdate = async () => {
    setLoading(true);
    try {
      console.log('Sending profile update with data:', formData);
      
      // Test updating just the name
      const result = await tailorService.updateTailorProfile({
        name: formData.name,
        bio: formData.bio,
        experience: formData.experience
      });
      
      console.log('Profile update result:', result);
      setTestResult({
        success: true,
        data: result,
        message: 'Profile updated successfully'
      });
    } catch (error: any) {
      console.error('Profile update error:', error);
      setTestResult({
        success: false,
        error: error.message || 'Unknown error',
        data: error
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentProfile = async () => {
    setLoading(true);
    try {
      const result = await tailorService.getTailorProfile();
      console.log('Current profile:', result);
      setTestResult({
        success: true,
        data: result,
        message: 'Current profile fetched'
      });
    } catch (error: any) {
      console.error('Fetch profile error:', error);
      setTestResult({
        success: false,
        error: error.message || 'Unknown error',
        data: error
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Profile Update Test</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Test Data</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Experience</label>
            <input
              type="number"
              value={formData.experience}
              onChange={(e) => setFormData({...formData, experience: parseInt(e.target.value) || 0})}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
        </div>
      </div>

      <div className="flex space-x-4 mb-6">
        <button
          onClick={testProfileUpdate}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Test Profile Update'}
        </button>
        <button
          onClick={fetchCurrentProfile}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Fetching...' : 'Fetch Current Profile'}
        </button>
      </div>

      {testResult && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h2 className="text-lg font-medium mb-2">Test Result</h2>
          <div className="space-y-2">
            <p className={`font-medium ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
              Status: {testResult.success ? 'SUCCESS' : 'FAILED'}
            </p>
            {testResult.message && (
              <p>Message: {testResult.message}</p>
            )}
            {testResult.error && (
              <p className="text-red-500">Error: {testResult.error}</p>
            )}
            {testResult.data && (
              <div className="mt-2">
                <p className="font-medium">Response Data:</p>
                <pre className="bg-black text-green-400 p-4 rounded-md text-sm overflow-auto max-h-60">
                  {JSON.stringify(testResult.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileUpdateTest;