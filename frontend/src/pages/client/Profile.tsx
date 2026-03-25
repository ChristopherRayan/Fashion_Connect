import React, { useState, useEffect } from 'react';
import { Lock, MapPin, Phone, Mail, Save, Edit } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useLanguage } from '../../contexts/LanguageContext';
import { isValidPhoneNumber } from '../../utils/helpers';
import ProfilePictureUpload from '../../components/common/ProfilePictureUpload';
import { userService } from '../../services/userService';

interface MeasurementData {
  bust: string;
  waist: string;
  hips: string;
  shoulder: string;
  inseam: string;
  height: string;
  weight: string;
}

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  bio: string;
  measurements: MeasurementData;
  preferences: {
    newsletter: boolean;
    promotions: boolean;
    orderUpdates: boolean;
  };
}

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { addToast } = useNotification();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    bio: '',
    measurements: {
      bust: '',
      waist: '',
      hips: '',
      shoulder: '',
      inseam: '',
      height: '',
      weight: ''
    },
    preferences: {
      newsletter: false,
      promotions: false,
      orderUpdates: true
    }
  });
  
  // Load user data
  useEffect(() => {
    if (user) {
      // Simulate API fetch with setTimeout
      setTimeout(() => {
        setProfileData({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          address: user.address?.street || '',
          city: user.address?.city || '',
          country: user.address?.country || 'Malawi',
          bio: user.bio || '',
          measurements: {
            bust: user.measurements?.bust || '',
            waist: user.measurements?.waist || '',
            hips: user.measurements?.hips || '',
            shoulder: user.measurements?.shoulder || '',
            inseam: user.measurements?.inseam || '',
            height: user.measurements?.height || '',
            weight: user.measurements?.weight || ''
          },
          preferences: {
            newsletter: user.preferences?.newsletter || false,
            promotions: user.preferences?.promotions || false,
            orderUpdates: user.preferences?.orderUpdates || true
          }
        });
        setLoading(false);
      }, 800);
    }
  }, [user]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setProfileData(prev => ({
        ...prev,
        [section]: {
          ...prev[section as keyof ProfileData],
          [field]: value
        }
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    const [section, field] = name.split('.');
    
    setProfileData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof ProfileData],
        [field]: checked
      }
    }));
  };

  // Handle profile picture change
  const handleProfilePictureChange = async (file: File | null) => {
    if (!file) {
      setProfilePictureFile(null);
      return;
    }

    setProfilePictureFile(file);
    setUploadingPicture(true);

    try {
      const result = await userService.uploadProfilePicture(file);

      // Update user context with new profile image
      await updateUser({
        profileImage: result.profileImage
      });

      addToast('success', 'Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      addToast('error', 'Failed to upload profile picture');
      setProfilePictureFile(null);
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleSaveProfile = async () => {
    // Validate phone number
    if (profileData.phone && !isValidPhoneNumber(profileData.phone)) {
      addToast('error', t('validation.invalidPhone'));
      return;
    }

    try {
      setSaving(true);

      // Update profile using userService
      await userService.updateProfile({
        name: profileData.name,
        phone: profileData.phone,
        bio: profileData.bio,
        address: {
          street: profileData.address,
          city: profileData.city,
          country: profileData.country
        },
        measurements: {
          bust: profileData.measurements.bust,
          waist: profileData.measurements.waist,
          hips: profileData.measurements.hips,
          shoulder: profileData.measurements.shoulder,
          inseam: profileData.measurements.inseam,
          height: profileData.measurements.height,
          weight: profileData.measurements.weight
        },
        preferences: {
          newsletter: profileData.preferences.newsletter,
          promotions: profileData.preferences.promotions,
          orderUpdates: profileData.preferences.orderUpdates
        }
      });

      // Also update the auth context
      await updateUser({
        name: profileData.name,
        phone: profileData.phone,
        bio: profileData.bio
      });

      addToast('success', t('profile.updateSuccess'));
      setEditMode(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      addToast('error', t('errors.updateFailed'));
    } finally {
      setSaving(false);
    }
  };
  
  const handleChangePassword = () => {
    // This would typically open a modal or navigate to password change page
    addToast('info', t('profile.passwordChangeInfo'));
  };
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            {t('profile.title')}
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          {!editMode ? (
            <button
              type="button"
              onClick={() => setEditMode(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Edit className="h-4 w-4 mr-2" />
              {t('common.edit')}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 mr-3"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {saving ? (
                  <LoadingSpinner size="small" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {t('common.save')}
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {t('profile.personalInfo')}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {t('profile.personalInfoDesc')}
            </p>
          </div>
          <ProfilePictureUpload
            currentImage={user?.profileImage}
            onImageChange={handleProfilePictureChange}
            size="md"
            editable={editMode}
          />
        </div>
        
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                {t('profile.fullName')}
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {editMode ? (
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleInputChange}
                    className="max-w-lg block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
                  />
                ) : (
                  profileData.name
                )}
              </dd>
            </div>
            
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                {t('profile.email')}
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex items-center">
                <Mail className="h-4 w-4 text-gray-400 mr-2" />
                {profileData.email}
                {/* Email cannot be edited directly for security reasons */}
              </dd>
            </div>
            
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                {t('profile.phone')}
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {editMode ? (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-400 mr-2" />
                    <input
                      type="tel"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleInputChange}
                      placeholder="+265..."
                      className="max-w-lg block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-400 mr-2" />
                    {profileData.phone || t('profile.notProvided')}
                  </div>
                )}
              </dd>
            </div>
            
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                {t('profile.address')}
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {editMode ? (
                  <div className="space-y-3">
                    <div>
                      <label htmlFor="address" className="block text-xs font-medium text-gray-500 mb-1">
                        {t('profile.streetAddress')}
                      </label>
                      <input
                        type="text"
                        name="address"
                        id="address"
                        value={profileData.address}
                        onChange={handleInputChange}
                        className="max-w-lg block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label htmlFor="city" className="block text-xs font-medium text-gray-500 mb-1">
                        {t('profile.city')}
                      </label>
                      <input
                        type="text"
                        name="city"
                        id="city"
                        value={profileData.city}
                        onChange={handleInputChange}
                        className="max-w-lg block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label htmlFor="country" className="block text-xs font-medium text-gray-500 mb-1">
                        {t('profile.country')}
                      </label>
                      <select
                        id="country"
                        name="country"
                        value={profileData.country}
                        onChange={(e) => setProfileData(prev => ({ ...prev, country: e.target.value }))}
                        className="max-w-lg block focus:ring-primary-500 focus:border-primary-500 w-full shadow-sm sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
                      >
                        <option value="Malawi">Malawi</option>
                        <option value="Zambia">Zambia</option>
                        <option value="Mozambique">Mozambique</option>
                        <option value="Zimbabwe">Zimbabwe</option>
                        <option value="Tanzania">Tanzania</option>
                        <option value="South Africa">South Africa</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      {profileData.address ? (
                        <>
                          <p>{profileData.address}</p>
                          <p>{profileData.city}, {profileData.country}</p>
                        </>
                      ) : (
                        t('profile.notProvided')
                      )}
                    </div>
                  </div>
                )}
              </dd>
            </div>
            
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                {t('profile.about')}
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {editMode ? (
                  <textarea
                    name="bio"
                    rows={3}
                    value={profileData.bio}
                    onChange={handleInputChange}
                    className="max-w-lg shadow-sm block w-full focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 rounded-md"
                    placeholder={t('profile.bioPlaceholder')}
                  />
                ) : (
                  profileData.bio || t('profile.noBio')
                )}
              </dd>
            </div>
            
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                {t('profile.security')}
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <button
                  type="button"
                  onClick={handleChangePassword}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  {t('profile.changePassword')}
                </button>
              </dd>
            </div>
          </dl>
        </div>
      </div>
      
      {/* Measurements Section */}
      <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {t('profile.measurements')}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            {t('profile.measurementsDesc')}
          </p>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          {editMode ? (
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label htmlFor="bust" className="block text-sm font-medium text-gray-700">
                  {t('profile.bust')} (cm)
                </label>
                <input
                  type="text"
                  name="measurements.bust"
                  id="bust"
                  value={profileData.measurements.bust}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="waist" className="block text-sm font-medium text-gray-700">
                  {t('profile.waist')} (cm)
                </label>
                <input
                  type="text"
                  name="measurements.waist"
                  id="waist"
                  value={profileData.measurements.waist}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="hips" className="block text-sm font-medium text-gray-700">
                  {t('profile.hips')} (cm)
                </label>
                <input
                  type="text"
                  name="measurements.hips"
                  id="hips"
                  value={profileData.measurements.hips}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="shoulder" className="block text-sm font-medium text-gray-700">
                  {t('profile.shoulder')} (cm)
                </label>
                <input
                  type="text"
                  name="measurements.shoulder"
                  id="shoulder"
                  value={profileData.measurements.shoulder}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="inseam" className="block text-sm font-medium text-gray-700">
                  {t('profile.inseam')} (cm)
                </label>
                <input
                  type="text"
                  name="measurements.inseam"
                  id="inseam"
                  value={profileData.measurements.inseam}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="height" className="block text-sm font-medium text-gray-700">
                  {t('profile.height')} (cm)
                </label>
                <input
                  type="text"
                  name="measurements.height"
                  id="height"
                  value={profileData.measurements.height}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
                  {t('profile.weight')} (kg)
                </label>
                <input
                  type="text"
                  name="measurements.weight"
                  id="weight"
                  value={profileData.measurements.weight}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="border-b border-gray-200 pb-2">
                <dt className="text-xs font-medium text-gray-500">
                  {t('profile.bust')}
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {profileData.measurements.bust ? `${profileData.measurements.bust} cm` : t('profile.notProvided')}
                </dd>
              </div>
              
              <div className="border-b border-gray-200 pb-2">
                <dt className="text-xs font-medium text-gray-500">
                  {t('profile.waist')}
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {profileData.measurements.waist ? `${profileData.measurements.waist} cm` : t('profile.notProvided')}
                </dd>
              </div>
              
              <div className="border-b border-gray-200 pb-2">
                <dt className="text-xs font-medium text-gray-500">
                  {t('profile.hips')}
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {profileData.measurements.hips ? `${profileData.measurements.hips} cm` : t('profile.notProvided')}
                </dd>
              </div>
              
              <div className="border-b border-gray-200 pb-2">
                <dt className="text-xs font-medium text-gray-500">
                  {t('profile.shoulder')}
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {profileData.measurements.shoulder ? `${profileData.measurements.shoulder} cm` : t('profile.notProvided')}
                </dd>
              </div>
              
              <div className="border-b border-gray-200 pb-2">
                <dt className="text-xs font-medium text-gray-500">
                  {t('profile.inseam')}
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {profileData.measurements.inseam ? `${profileData.measurements.inseam} cm` : t('profile.notProvided')}
                </dd>
              </div>
              
              <div className="border-b border-gray-200 pb-2">
                <dt className="text-xs font-medium text-gray-500">
                  {t('profile.height')}
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {profileData.measurements.height ? `${profileData.measurements.height} cm` : t('profile.notProvided')}
                </dd>
              </div>
              
              <div className="border-b border-gray-200 pb-2">
                <dt className="text-xs font-medium text-gray-500">
                  {t('profile.weight')}
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {profileData.measurements.weight ? `${profileData.measurements.weight} kg` : t('profile.notProvided')}
                </dd>
              </div>
            </div>
          )}
          
          {!editMode && (
            <div className="mt-4">
              <p className="text-sm text-gray-500">
                {t('profile.measurementsNote')}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Preferences Section */}
      <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {t('profile.preferences')}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            {t('profile.preferencesDesc')}
          </p>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <div className="space-y-4">
            <div className="relative flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="newsletter"
                  name="preferences.newsletter"
                  type="checkbox"
                  checked={profileData.preferences.newsletter}
                  onChange={handleCheckboxChange}
                  disabled={!editMode}
                  className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="newsletter" className="font-medium text-gray-700">
                  {t('profile.newsletter')}
                </label>
                <p className="text-gray-500">{t('profile.newsletterDesc')}</p>
              </div>
            </div>
            
            <div className="relative flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="promotions"
                  name="preferences.promotions"
                  type="checkbox"
                  checked={profileData.preferences.promotions}
                  onChange={handleCheckboxChange}
                  disabled={!editMode}
                  className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="promotions" className="font-medium text-gray-700">
                  {t('profile.promotions')}
                </label>
                <p className="text-gray-500">{t('profile.promotionsDesc')}</p>
              </div>
            </div>
            
            <div className="relative flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="orderUpdates"
                  name="preferences.orderUpdates"
                  type="checkbox"
                  checked={profileData.preferences.orderUpdates}
                  onChange={handleCheckboxChange}
                  disabled={!editMode}
                  className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="orderUpdates" className="font-medium text-gray-700">
                  {t('profile.orderUpdates')}
                </label>
                <p className="text-gray-500">{t('profile.orderUpdatesDesc')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {editMode && (
        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={() => setEditMode(false)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 mr-3"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {saving ? (
              <LoadingSpinner size="small" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {t('common.save')}
          </button>
        </div>
      )}
    </div>
  );
};

export default Profile;
 