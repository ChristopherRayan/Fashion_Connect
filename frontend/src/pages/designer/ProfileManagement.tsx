import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Edit3, 
  Save, 
  X, 
  Camera, 
  Shield, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Plus,
  Trash2,
  ExternalLink,
  Calendar,
  Award,
  Star,
  Globe,
  Upload,
  Building,
  Briefcase,
  Link as LinkIcon,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { userService } from '../../services/userService';
import { getImageUrl, isValidImagePath, DEFAULT_PROFILE_IMAGE } from '../../utils/imageUtils';
import LoadingSpinner from '../../components/common/LoadingSpinner';

interface DesignerProfileData {
  // Personal Information
  name: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  profileImage?: string;
  
  // Business Information
  businessName: string;
  specialty: string;
  experience?: string;
  portfolioLink?: string;
  
  // Social Media & Website
  website?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  
  // Portfolio Images
  portfolioImages: string[];
  
  // Verification Status
  verificationStatus: 'verified' | 'pending' | 'not_submitted';
  documents?: {
    nationalId?: string;
    businessRegistration?: string;
    taxCertificate?: string;
    portfolio?: string;
  };
  
  // Stats
  rating?: number;
  reviewCount?: number;
  totalProducts?: number;
  totalOrders?: number;
  joinedAt?: string;
}

const ProfileManagement: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { addToast } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<DesignerProfileData | null>(null);
  const [formData, setFormData] = useState<Partial<DesignerProfileData>>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  
  const profileImageRef = useRef<HTMLInputElement>(null);
  const portfolioImageRef = useRef<HTMLInputElement>(null);

  const specialties = [
    'Traditional Wear',
    'Formal Wear',
    'Casual Wear',
    'Wedding Dresses',
    'Evening Wear',
    'Streetwear',
    'Accessories',
    'Footwear',
    'Children\'s Wear',
    'Plus Size',
    'Sustainable Fashion',
    'Haute Couture',
    'Chitenge Designs',
    'Contemporary Fashion'
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const profile = await userService.getProfile();
      
      const designerProfile: DesignerProfileData = {
        name: profile.name,
        email: profile.email,
        phone: profile.phone || '',
        location: profile.location || '',
        bio: profile.bio || '',
        profileImage: profile.profileImage,
        businessName: profile.businessName || '',
        specialty: profile.specialty || '',
        experience: profile.experience,
        portfolioLink: profile.businessWebsite,
        website: profile.businessWebsite,
        socialMedia: {
          facebook: '',
          instagram: '',
          twitter: ''
        },
        portfolioImages: profile.portfolioImages || [],
        verificationStatus: profile.status === 'ACTIVE' ? 'verified' : 'pending',
        documents: profile.documents,
        rating: profile.rating || 0,
        reviewCount: profile.reviewCount || 0,
        totalProducts: profile.totalProducts || 0,
        totalOrders: profile.totalOrders || 0,
        joinedAt: profile.createdAt
      };

      setProfileData(designerProfile);
      setFormData(designerProfile);
    } catch (error) {
      console.error('Error fetching profile:', error);
      addToast('error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof DesignerProfileData],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await userService.uploadProfileImage(formData);
      
      setFormData(prev => ({
        ...prev,
        profileImage: response.profileImage
      }));

      addToast('success', 'Profile image updated successfully');
    } catch (error) {
      console.error('Error uploading profile image:', error);
      addToast('error', 'Failed to upload profile image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePortfolioImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingPortfolio(true);
      const formData = new FormData();
      
      Array.from(files).forEach((file, index) => {
        formData.append(`portfolioImages`, file);
      });

      const response = await userService.uploadPortfolioImages(formData);
      
      setFormData(prev => ({
        ...prev,
        portfolioImages: [...(prev.portfolioImages || []), ...response.portfolioImages]
      }));

      addToast('success', 'Portfolio images uploaded successfully');
    } catch (error) {
      console.error('Error uploading portfolio images:', error);
      addToast('error', 'Failed to upload portfolio images');
    } finally {
      setUploadingPortfolio(false);
    }
  };

  const removePortfolioImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      portfolioImages: prev.portfolioImages?.filter((_, i) => i !== index) || []
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const updateData = {
        name: formData.name,
        phone: formData.phone,
        location: formData.location,
        bio: formData.bio,
        businessName: formData.businessName,
        specialty: formData.specialty,
        experience: formData.experience,
        businessWebsite: formData.website,
        portfolioImages: formData.portfolioImages
      };

      await userService.updateProfile(updateData);
      
      setProfileData(formData as DesignerProfileData);
      setIsEditing(false);
      addToast('success', 'Profile updated successfully');
      
      // Update user context if needed
      if (updateUser) {
        updateUser({
          ...user,
          name: formData.name || user?.name,
          profileImage: formData.profileImage || user?.profileImage
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      addToast('error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(profileData || {});
    setIsEditing(false);
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-xs font-medium">Verified</span>
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center gap-1 text-yellow-600">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-medium">Pending</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-xs font-medium">Not Verified</span>
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
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Profile not found</h3>
        <p className="text-gray-600">Unable to load your profile data.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profile Management</h1>
            <p className="text-gray-600 mt-1">Manage your designer profile and business information</p>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  <X className="h-4 w-4 mr-2 inline" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-yellow-400 text-black rounded-md hover:bg-yellow-500 disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2 inline" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-yellow-400 text-black rounded-md hover:bg-yellow-500"
              >
                <Edit3 className="h-4 w-4 mr-2 inline" />
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile Image & Basic Info */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
        
        <div className="flex items-start gap-6">
          {/* Profile Image */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200">
              <img
                src={isValidImagePath(formData.profileImage) ? getImageUrl(formData.profileImage) : DEFAULT_PROFILE_IMAGE}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.warn('🖼️ Failed to load profile image:', formData.profileImage);
                  const target = e.target as HTMLImageElement;
                  if (target.src !== DEFAULT_PROFILE_IMAGE) {
                    target.src = DEFAULT_PROFILE_IMAGE;
                  }
                }}
              />
            </div>
            {isEditing && (
              <button
                onClick={() => profileImageRef.current?.click()}
                disabled={uploadingImage}
                className="absolute bottom-0 right-0 p-2 bg-yellow-400 rounded-full shadow-lg hover:bg-yellow-500 disabled:opacity-50"
              >
                {uploadingImage ? (
                  <div className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full" />
                ) : (
                  <Camera className="h-4 w-4 text-black" />
                )}
              </button>
            )}
            <input
              ref={profileImageRef}
              type="file"
              accept="image/*"
              onChange={handleProfileImageUpload}
              className="hidden"
            />
          </div>

          {/* Basic Information */}
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{profileData.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900">{profileData.email}</p>
                <p className="text-xs text-gray-500">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{profileData.phone || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="location"
                    value={formData.location || ''}
                    onChange={handleInputChange}
                    placeholder="City, Country"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{profileData.location || 'Not provided'}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={formData.bio || ''}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Tell us about yourself and your design philosophy..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              ) : (
                <p className="text-gray-900">{profileData.bio || 'No bio provided'}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Verification Status */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Verification Status</h2>
            <p className="text-gray-600 mt-1">Your account verification status</p>
          </div>
          {getVerificationBadge(profileData.verificationStatus)}
        </div>
        
        {profileData.verificationStatus === 'pending' && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-yellow-600 mr-2" />
              <p className="text-yellow-800">Your verification is being reviewed by our team.</p>
            </div>
          </div>
        )}
        
        {profileData.verificationStatus === 'not_submitted' && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-red-800">Please submit your verification documents to start selling.</p>
            </div>
          </div>
        )}
      </div>

      {/* Business Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
            {isEditing ? (
              <input
                type="text"
                name="businessName"
                value={formData.businessName || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            ) : (
              <p className="text-gray-900">{profileData.businessName || 'Not provided'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
            {isEditing ? (
              <select
                name="specialty"
                value={formData.specialty || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              >
                <option value="">Select a specialty</option>
                {specialties.map((specialty) => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-gray-900">{profileData.specialty || 'Not provided'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
            {isEditing ? (
              <input
                type="text"
                name="experience"
                value={formData.experience || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="e.g., 5 years"
              />
            ) : (
              <p className="text-gray-900">{profileData.experience || 'Not provided'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website/Portfolio Link</label>
            {isEditing ? (
              <input
                type="url"
                name="website"
                value={formData.website || ''}
                onChange={handleInputChange}
                placeholder="https://your-website.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-gray-900">{profileData.website || 'Not provided'}</p>
                {profileData.website && (
                  <a
                    href={profileData.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-yellow-600 hover:text-yellow-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Portfolio Images */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Portfolio Images</h2>
            <p className="text-gray-600 mt-1">Showcase your best work</p>
          </div>
          {isEditing && (
            <button
              onClick={() => portfolioImageRef.current?.click()}
              disabled={uploadingPortfolio}
              className="px-4 py-2 bg-yellow-400 text-black rounded-md hover:bg-yellow-500 disabled:opacity-50"
            >
              {uploadingPortfolio ? (
                <div className="flex items-center">
                  <div className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full mr-2" />
                  Uploading...
                </div>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2 inline" />
                  Add Images
                </>
              )}
            </button>
          )}
          <input
            ref={portfolioImageRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePortfolioImageUpload}
            className="hidden"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {formData.portfolioImages?.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-200">
                <img
                  src={getImageUrl(image)}
                  alt={`Portfolio ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              {isEditing && (
                <button
                  onClick={() => removePortfolioImage(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}

          {(!formData.portfolioImages || formData.portfolioImages.length === 0) && (
            <div className="col-span-full text-center py-12">
              <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No portfolio images</h3>
              <p className="text-gray-600">Add some images to showcase your work</p>
            </div>
          )}
        </div>
      </div>

      {/* Social Media Links */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Social Media & Links</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
            {isEditing ? (
              <input
                type="text"
                name="socialMedia.facebook"
                value={formData.socialMedia?.facebook || ''}
                onChange={handleInputChange}
                placeholder="facebook.com/yourpage"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-gray-900">{profileData.socialMedia?.facebook || 'Not provided'}</p>
                {profileData.socialMedia?.facebook && (
                  <a
                    href={`https://facebook.com/${profileData.socialMedia.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
            {isEditing ? (
              <input
                type="text"
                name="socialMedia.instagram"
                value={formData.socialMedia?.instagram || ''}
                onChange={handleInputChange}
                placeholder="@yourusername"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-gray-900">{profileData.socialMedia?.instagram || 'Not provided'}</p>
                {profileData.socialMedia?.instagram && (
                  <a
                    href={`https://instagram.com/${profileData.socialMedia.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-600 hover:text-pink-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Twitter</label>
            {isEditing ? (
              <input
                type="text"
                name="socialMedia.twitter"
                value={formData.socialMedia?.twitter || ''}
                onChange={handleInputChange}
                placeholder="@yourusername"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-gray-900">{profileData.socialMedia?.twitter || 'Not provided'}</p>
                {profileData.socialMedia?.twitter && (
                  <a
                    href={`https://twitter.com/${profileData.socialMedia.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-500"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Statistics */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Statistics</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Star className="h-6 w-6 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {profileData.rating ? profileData.rating.toFixed(1) : '0.0'}
            </p>
            <p className="text-sm text-gray-600">Average Rating</p>
            <p className="text-xs text-gray-500">
              ({profileData.reviewCount || 0} reviews)
            </p>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Briefcase className="h-6 w-6 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {profileData.totalProducts || 0}
            </p>
            <p className="text-sm text-gray-600">Total Products</p>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Award className="h-6 w-6 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {profileData.totalOrders || 0}
            </p>
            <p className="text-sm text-gray-600">Total Orders</p>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Calendar className="h-6 w-6 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {profileData.joinedAt ? new Date(profileData.joinedAt).getFullYear() : 'N/A'}
            </p>
            <p className="text-sm text-gray-600">Member Since</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileManagement;
