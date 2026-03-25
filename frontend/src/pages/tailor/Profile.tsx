import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit,
  Save,
  X,
  Scissors,
  Award,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { tailorService } from '../../services/tailorService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ProfilePictureUpload from '../../components/common/ProfilePictureUpload';
import FloatingMessageButton from '../../components/messaging/FloatingMessageButton';

interface TailorProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  bio?: string;
  specialties?: string[];
  experience?: number;
  joinedDate: string;
  profileImage?: string;
  stats?: {
    totalOrders: number;
    completedOrders: number;
    averageRating: number;
    completionRate: number;
  };
}

const TailorProfile: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useNotification();
  const [profile, setProfile] = useState<TailorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    bio: '',
    specialties: [] as string[],
    experience: 0,
    imageFile: null as File | null,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await tailorService.getTailorProfile();
      console.log('📋 Fetched profile data:', data);
      
      // Normalize the data to ensure consistent field names
      const profileImageFromApi = data.profileImage || data.avatar || data.profilePic || data.profile_picture || (data.user && (data.user.profileImage || data.user.avatar));
      const addressString = ((): string => {
        const a: any = data?.address;
        if (!a) return '';
        if (typeof a === 'string') return a;
        if (typeof a === 'object') {
          const parts = [a.street, a.city, a.country, a.zipCode].filter(Boolean);
          return parts.join(', ');
        }
        return '';
      })();
      const normalizedData = {
        ...data,
        id: data.id || data._id,
        joinedDate: data.joinedDate || data.createdAt,
        profileImage: profileImageFromApi || null,
        bio: data.bio || '',
        phone: data.phone || '',
        address: addressString,
        specialties: Array.isArray(data.specialties) ? data.specialties : [],
        experience: Number(data.experience) || 0
      };
      
      console.log('📄 Normalized profile data:', normalizedData);
      setProfile(normalizedData);
      
      setFormData({
        name: normalizedData.name || '',
        phone: normalizedData.phone || '',
        address: normalizedData.address || '',
        bio: normalizedData.bio || '',
        specialties: normalizedData.specialties || [],
        experience: normalizedData.experience || 0,
        imageFile: null,
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      addToast('error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      console.log('💾 Saving profile with form data:', formData);
      
      // Build payload only with changed fields to avoid overwriting with empties
      const payload: any = {};
      if (profile?.name !== formData.name) payload.name = formData.name;
      if (profile?.phone !== formData.phone) payload.phone = formData.phone;
      if ((profile?.address || '') !== (formData.address || '')) payload.address = formData.address;
      if ((profile?.bio || '') !== (formData.bio || '')) payload.bio = formData.bio;
      const specialtiesChanged = JSON.stringify(profile?.specialties || []) !== JSON.stringify(formData.specialties || []);
      if (specialtiesChanged) payload.specialties = formData.specialties;
      if ((Number(profile?.experience) || 0) !== (Number(formData.experience) || 0)) payload.experience = formData.experience;

      // Only include imageFile when provided
      if (formData.imageFile) {
        payload.imageFile = formData.imageFile;
      }

      console.log('📤 Sending payload:', payload);
      const updatedProfile = await tailorService.updateTailorProfile(payload);
      console.log('🔄 Received updated profile:', updatedProfile);
      
      // Normalize the updated profile data
      const updatedProfileImage = (updatedProfile as any)?.profileImage || (updatedProfile as any)?.avatar || (updatedProfile as any)?.profilePic || (updatedProfile as any)?.profile_picture || profile?.profileImage;
      const updatedAddressString = ((): string => {
        const a: any = (updatedProfile as any)?.address ?? payload.address;
        if (!a) return '';
        if (typeof a === 'string') return a;
        if (typeof a === 'object') {
          const parts = [a.street, a.city, a.country, a.zipCode].filter(Boolean);
          return parts.join(', ');
        }
        return '';
      })();
      const normalizedUpdatedProfile = {
        ...profile, // Keep existing profile data
        ...updatedProfile, // Override with updated data
        id: updatedProfile.id || updatedProfile._id || profile?.id,
        joinedDate: updatedProfile.joinedDate || updatedProfile.createdAt || profile?.joinedDate,
        profileImage: updatedProfileImage,
        bio: updatedProfile.bio !== undefined ? updatedProfile.bio : payload.bio,
        phone: updatedProfile.phone !== undefined ? updatedProfile.phone : payload.phone,
        address: updatedAddressString,
        name: updatedProfile.name || payload.name || profile?.name,
        specialties: Array.isArray(updatedProfile.specialties) ? updatedProfile.specialties : 
                    Array.isArray(payload.specialties) ? payload.specialties : [],
        experience: Number(updatedProfile.experience) || Number(payload.experience) || 0
      };
      
      console.log('🎆 Final normalized profile:', normalizedUpdatedProfile);
      setProfile(normalizedUpdatedProfile);
      
      // Update form data to match the saved values
      setFormData({
        name: normalizedUpdatedProfile.name || '',
        phone: normalizedUpdatedProfile.phone || '',
        address: normalizedUpdatedProfile.address || '',
        bio: normalizedUpdatedProfile.bio || '',
        specialties: normalizedUpdatedProfile.specialties || [],
        experience: normalizedUpdatedProfile.experience || 0,
        imageFile: null, // Clear the image file after successful upload
      });
      
      // Refresh from server to ensure persistence
      await fetchProfile();
      setEditing(false);
      addToast('success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      addToast('error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      console.log('🚫 Canceling edit - resetting to profile data:', profile);
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        bio: profile.bio || '',
        specialties: Array.isArray(profile.specialties) ? profile.specialties : [],
        experience: Number(profile.experience) || 0,
        imageFile: null
      });
    }
    setEditing(false);
  };

  const handleSpecialtyChange = (specialty: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, specialty]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        specialties: prev.specialties.filter(s => s !== specialty)
      }));
    }
  };

  const availableSpecialties = [
    'Traditional Wear',
    'Modern Clothing',
    'Formal Wear',
    'Casual Wear',
    'Wedding Attire',
    'Children\'s Clothing',
    'Alterations',
    'Custom Designs'
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <User className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Profile not found</h3>
        <p className="mt-1 text-sm text-gray-500">Unable to load your profile information.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-50 min-h-screen">
      <FloatingMessageButton />
      {/* Header */}
      <div className="bg-white shadow rounded-lg border-l-4 border-indigo-500">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
              <Scissors className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
              <p className="text-sm text-gray-500">Manage your personal information and preferences</p>
            </div>
          </div>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={handleCancel}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Personal Information</h2>
              {/* Avatar upload */}
              <div className="flex items-center space-x-3">
                <ProfilePictureUpload
                  currentImage={profile.profileImage}
                  editable={editing}
                  size="lg"
                  onImageChange={(file) => setFormData(prev => ({ ...prev, imageFile: file }))}
                />
              </div>
            </div>
            <div className="px-6 py-4 space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">{profile.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900 flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  {profile.email}
                </p>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                {editing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900 flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    {profile.phone || 'Not provided'}
                  </p>
                )}
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                {editing ? (
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900 flex items-start">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
                    {profile.address || 'Not provided'}
                  </p>
                )}
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Bio</label>
                {editing ? (
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    rows={4}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Tell us about yourself and your tailoring experience..."
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900">
                    {profile.bio || 'No bio provided'}
                  </p>
                )}
              </div>

              {/* Experience */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Years of Experience</label>
                {editing ? (
                  <input
                    type="number"
                    min="0"
                    value={formData.experience}
                    onChange={(e) => setFormData(prev => ({ ...prev, experience: parseInt(e.target.value) || 0 }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900 flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-gray-400" />
                    {profile.experience || 0} years
                  </p>
                )}
              </div>

              {/* Specialties */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Specialties</label>
                {editing ? (
                  <div className="mt-2 space-y-2">
                    {availableSpecialties.map((specialty) => (
                      <label key={specialty} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.specialties.includes(specialty)}
                          onChange={(e) => handleSpecialtyChange(specialty, e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">{specialty}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="mt-1">
                    {profile.specialties && profile.specialties.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {profile.specialties.map((specialty) => (
                          <span
                            key={specialty}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No specialties listed</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats and Info */}
        <div className="space-y-6">
          {/* Stats */}
          {profile.stats && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Performance Stats</h2>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Orders</span>
                  <span className="text-sm font-medium text-gray-900">{profile.stats.totalOrders}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Completed</span>
                  <span className="text-sm font-medium text-gray-900">{profile.stats.completedOrders}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Completion Rate</span>
                  <span className="text-sm font-medium text-gray-900">{profile.stats.completionRate}%</span>
                </div>
                {profile.stats.averageRating > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Average Rating</span>
                    <span className="text-sm font-medium text-gray-900 flex items-center">
                      <Award className="h-4 w-4 mr-1 text-yellow-400" />
                      {profile.stats.averageRating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Account Info */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Account Information</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Member Since</span>
                <span className="text-sm font-medium text-gray-900 flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                  {new Date(profile.joinedDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Account Status</span>
                <span className="text-sm font-medium text-green-600 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TailorProfile;