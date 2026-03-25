
import { useState, useEffect } from 'react';
import { Camera, Upload, MapPin, Phone, Mail, Globe, Facebook, Instagram, Twitter, CheckCircle, Edit, Save, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  avatar: string;
  coverImage: string;
  businessName: string;
  website?: string;
  social: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  specialties: string[];
  verificationStatus: 'verified' | 'pending' | 'not_submitted';
  completionPercentage: number;
  memberSince: string;
}

// Mock data for demonstration
const mockProfileData: ProfileData = {
  name: 'Thoko Banda',
  email: 'thoko@example.com',
  phone: '+265 991234567',
  location: 'Lilongwe, Malawi',
  bio: 'Award-winning fashion designer specializing in traditional Malawian designs with a modern twist. Over 10 years of experience creating custom wedding attire and contemporary everyday fashion.',
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80',
  coverImage: 'https://images.unsplash.com/photo-1509319117193-57bab727e09d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400&q=80',
  businessName: 'Thoko Couture',
  website: 'https://thokocouture.com',
  social: {
    facebook: 'thokocouture',
    instagram: 'thoko_couture',
    twitter: 'thokocouture'
  },
  specialties: ['Traditional Wear', 'Wedding Attire', 'Contemporary Fashion', 'Chitenge Designs'],
  verificationStatus: 'verified',
  completionPercentage: 92,
  memberSince: '2020-03-15T10:00:00Z'
};

const DesignerProfile = () => {
  const { user } = useAuth();
  const { addToast } = useNotification();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<ProfileData>>({});
  const [newSpecialty, setNewSpecialty] = useState('');
  
  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setProfileData(mockProfileData);
      setFormData(mockProfileData);
      setLoading(false);
    }, 800);
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData(profileData!);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      social: {
        ...prev.social,
        [name]: value
      }
    }));
  };

  const handleAddSpecialty = () => {
    if (!newSpecialty.trim()) return;
    
    if (formData.specialties?.includes(newSpecialty.trim())) {
      addToast('error', t('profile.specialtyAlreadyExists'));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      specialties: [...(prev.specialties || []), newSpecialty.trim()]
    }));
    setNewSpecialty('');
  };

  const handleRemoveSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties?.filter(s => s !== specialty) || []
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name?.trim()) {
      addToast('error', t('profile.nameRequired'));
      return;
    }
    
    if (!formData.businessName?.trim()) {
      addToast('error', t('profile.businessNameRequired'));
      return;
    }
    
    // In a real app, we'd make an API call here
    
    // Update local state
    setProfileData(formData as ProfileData);
    setIsEditing(false);
    addToast('success', t('profile.profileUpdated'));
  };

  const getVerificationBadge = (status: ProfileData['verificationStatus']) => {
    switch (status) {
      case 'verified':
        return (
          <div className="flex items-center text-green-600">
            <CheckCircle className="mr-1 h-4 w-4" />
            <span className="text-xs font-medium">{t('profile.verified')}</span>
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center text-yellow-600">
            <span className="mr-1 h-2 w-2 bg-yellow-400 rounded-full"></span>
            <span className="text-xs font-medium">{t('profile.verificationPending')}</span>
          </div>
        );
      case 'not_submitted':
        return (
          <div className="flex items-center text-gray-500">
            <span className="text-xs font-medium">{t('profile.notVerified')}</span>
          </div>
        );
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!profileData) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">{t('profile.errorLoadingProfile')}</h3>
        <p className="mt-1 text-sm text-gray-500">{t('profile.tryAgainLater')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cover Photo & Profile Section */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Cover Photo */}
        <div className="relative h-40 md:h-60 bg-gray-200">
          <img
            src={profileData.coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          {isEditing && (
            <button
              type="button"
              className="absolute bottom-2 right-2 p-2 bg-white bg-opacity-75 rounded-full shadow-sm hover:bg-opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Camera className="h-5 w-5 text-gray-700" />
            </button>
          )}
        </div>
        
        {/* Profile Info */}
        <div className="relative px-4 py-5 sm:px-6">
          {/* Profile Picture */}
          <div className="absolute -top-16 left-4">
            <div className="relative inline-block">
              <img
                src={profileData.avatar}
                alt={profileData.name}
                className="h-32 w-32 rounded-full border-4 border-white object-cover"
              />
              {isEditing && (
                <button
                  type="button"
                  className="absolute bottom-1 right-1 p-1.5 bg-white rounded-full shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <Camera className="h-4 w-4 text-gray-700" />
                </button>
              )}
            </div>
          </div>
          
          {/* Edit/Save Buttons */}
          <div className="ml-32 sm:ml-0 sm:absolute sm:top-4 sm:right-4 flex space-x-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <X className="mr-1.5 h-4 w-4" />
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <Save className="mr-1.5 h-4 w-4" />
                  {t('common.save')}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleEdit}
                className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Edit className="mr-1.5 h-4 w-4" />
                {t('common.edit')}
              </button>
            )}
          </div>
          
          <div className="mt-20 sm:mt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
              <div>
                {isEditing ? (
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName || ''}
                    onChange={handleChange}
                    className="block w-full text-2xl font-bold text-gray-900 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    placeholder={t('profile.businessName')}
                  />
                ) : (
                  <h2 className="text-2xl font-bold text-gray-900">
                    {profileData.businessName}
                  </h2>
                )}
                
                <div className="mt-1 flex items-center">
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name || ''}
                      onChange={handleChange}
                      className="block w-full text-sm text-gray-700 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                      placeholder={t('profile.yourName')}
                    />
                  ) : (
                    <p className="text-sm text-gray-700">{profileData.name}</p>
                  )}
                  <div className="ml-2">
                    {getVerificationBadge(profileData.verificationStatus)}
                  </div>
                </div>
              </div>
              
              <div className="mt-2 sm:mt-0">
                <div className="flex space-x-2">
                  {profileData.social.facebook && (
                    <a
                      href={`https://facebook.com/${profileData.social.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-blue-600"
                    >
                      <Facebook className="h-5 w-5" />
                    </a>
                  )}
                  {profileData.social.instagram && (
                    <a
                      href={`https://instagram.com/${profileData.social.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-pink-600"
                    >
                      <Instagram className="h-5 w-5" />
                    </a>
                  )}
                  {profileData.social.twitter && (
                    <a
                      href={`https://twitter.com/${profileData.social.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-blue-400"
                    >
                      <Twitter className="h-5 w-5" />
                    </a>
                  )}
                  {profileData.website && (
                    <a
                      href={profileData.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-gray-700"
                    >
                      <Globe className="h-5 w-5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-sm text-gray-500">
              {isEditing ? (
                <textarea
                  name="bio"
                  value={formData.bio || ''}
                  onChange={handleChange}
                  rows={3}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  placeholder={t('profile.bioPlaceholder')}
                ></textarea>
              ) : (
                <p>{profileData.bio}</p>
              )}
            </div>
            
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="flex items-center text-sm text-gray-500">
                <MapPin className="mr-1.5 h-4 w-4 text-gray-400" />
                {isEditing ? (
                  <input
                    type="text"
                    name="location"
                    value={formData.location || ''}
                    onChange={handleChange}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    placeholder={t('profile.location')}
                  />
                ) : (
                  <span>{profileData.location}</span>
                )}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Phone className="mr-1.5 h-4 w-4 text-gray-400" />
                {isEditing ? (
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleChange}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    placeholder={t('profile.phone')}
                  />
                ) : (
                  <span>{profileData.phone}</span>
                )}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Mail className="mr-1.5 h-4 w-4 text-gray-400" />
                <span>{profileData.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Social Links */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {t('profile.socialLinks')}
          </h3>
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                  {t('profile.website')}
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    https://
                  </span>
                  <input
                    type="text"
                    name="website"
                    id="website"
                    value={(formData.website || '').replace('https://', '')}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: `https://${e.target.value}` }))}
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="example.com"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="facebook" className="block text-sm font-medium text-gray-700">
                  Facebook
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    facebook.com/
                  </span>
                  <input
                    type="text"
                    name="facebook"
                    id="facebook"
                    value={formData.social?.facebook || ''}
                    onChange={handleSocialChange}
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="username"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="instagram" className="block text-sm font-medium text-gray-700">
                  Instagram
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    instagram.com/
                  </span>
                  <input
                    type="text"
                    name="instagram"
                    id="instagram"
                    value={formData.social?.instagram || ''}
                    onChange={handleSocialChange}
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="username"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="twitter" className="block text-sm font-medium text-gray-700">
                  Twitter
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    twitter.com/
                  </span>
                  <input
                    type="text"
                    name="twitter"
                    id="twitter"
                    value={formData.social?.twitter || ''}
                    onChange={handleSocialChange}
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="username"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {profileData.website && (
                <div className="flex items-center">
                  <Globe className="mr-2 h-5 w-5 text-gray-400" />
                  <a
                    href={profileData.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-600 hover:text-primary-500"
                  >
                    {profileData.website.replace('https://', '')}
                  </a>
                </div>
              )}
              
              {profileData.social.facebook && (
                <div className="flex items-center">
                  <Facebook className="mr-2 h-5 w-5 text-gray-400" />
                  <a
                    href={`https://facebook.com/${profileData.social.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-600 hover:text-primary-500"
                  >
                    {profileData.social.facebook}
                  </a>
                </div>
              )}
              
              {profileData.social.instagram && (
                <div className="flex items-center">
                  <Instagram className="mr-2 h-5 w-5 text-gray-400" />
                  <a
                    href={`https://instagram.com/${profileData.social.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-600 hover:text-primary-500"
                  >
                    {profileData.social.instagram}
                  </a>
                </div>
              )}
              
              {profileData.social.twitter && (
                <div className="flex items-center">
                  <Twitter className="mr-2 h-5 w-5 text-gray-400" />
                  <a
                    href={`https://twitter.com/${profileData.social.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary-600 hover:text-primary-500"
                  >
                    {profileData.social.twitter}
                  </a>
                </div>
              )}
              
              {!profileData.website && !profileData.social.facebook && !profileData.social.instagram && !profileData.social.twitter && (
                <p className="text-sm text-gray-500">{t('profile.noSocialLinks')}</p>
              )}
            </div>
          )}
        </div>
        
        {/* Specialties */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {t('profile.specialties')}
          </h3>
          {isEditing ? (
            <div>
              <div className="mb-3 flex items-start">
                <div className="flex-grow mr-2">
                  <input
                    type="text"
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value)}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder={t('profile.addSpecialty')}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddSpecialty}
                  className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {t('common.add')}
                </button>
              </div>
              
              <div className="mt-3 flex flex-wrap gap-2">
                {formData.specialties?.map((specialty) => (
                  <div
                    key={specialty}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                  >
                    {specialty}
                    <button
                      type="button"
                      onClick={() => handleRemoveSpecialty(specialty)}
                      className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-primary-200 text-primary-800 hover:bg-primary-300 focus:outline-none focus:bg-primary-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {profileData.specialties.map((specialty) => (
                <span
                  key={specialty}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                >
                  {specialty}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {/* Account Info */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {t('profile.accountInfo')}
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-500">{t('profile.profileCompletion')}</p>
              <div className="mt-1">
                <div className="relative pt-1">
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                    <div
                      style={{ width: `${profileData.completionPercentage}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-500"
                    ></div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">{profileData.completionPercentage}%</span>
                    {profileData.completionPercentage < 100 && (
                      <span className="text-xs text-primary-600">{t('profile.completeProfile')}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">{t('profile.memberSince')}</p>
              <p className="text-sm text-gray-900">
                {new Date(profileData.memberSince).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-500">{t('profile.verificationStatus')}</p>
              <div className="mt-1">
                {profileData.verificationStatus === 'verified' ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="mr-1.5 h-5 w-5" />
                    <span className="text-sm">{t('profile.accountVerified')}</span>
                  </div>
                ) : profileData.verificationStatus === 'pending' ? (
                  <div className="flex items-center text-yellow-600">
                    <span className="mr-1.5 h-2.5 w-2.5 bg-yellow-400 rounded-full"></span>
                    <span className="text-sm">{t('profile.verificationInProgress')}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    {t('profile.verifyAccount')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignerProfile;
 