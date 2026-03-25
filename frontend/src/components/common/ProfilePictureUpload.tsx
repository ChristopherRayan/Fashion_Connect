import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, User } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { getImageUrl, isValidImagePath } from '../../utils/imageUtils';

interface ProfilePictureUploadProps {
  currentImage?: string;
  onImageChange: (file: File | null) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  editable?: boolean;
}

const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  currentImage,
  onImageChange,
  size = 'md',
  className = '',
  editable = true
}) => {
  console.log('🖼️ ProfilePictureUpload props:', { currentImage, size, className, editable });

  const { addToast } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Clear preview image when currentImage changes (e.g., after successful save)
  useEffect(() => {
    console.log('🖼️ currentImage changed, clearing previewImage');
    setPreviewImage(null);
  }, [currentImage]);

  const sizeClasses = {
    sm: 'h-16 w-16',
    md: 'h-24 w-24',
    lg: 'h-32 w-32'
  };

  const iconSizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      addToast('error', 'Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      addToast('error', 'Image size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Call parent callback
    onImageChange(file);
  };

  const handleRemoveImage = () => {
    setPreviewImage(null);
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const displayImage = previewImage || (isValidImagePath(currentImage) ? getImageUrl(currentImage) : null);
  const hasValidImage = !!displayImage;

  console.log('🖼️ ProfilePictureUpload - currentImage:', currentImage);
  console.log('🖼️ ProfilePictureUpload - previewImage:', previewImage);
  console.log('🖼️ ProfilePictureUpload - displayImage:', displayImage);
  console.log('🖼️ ProfilePictureUpload - hasValidImage:', hasValidImage);
  console.log('🖼️ ProfilePictureUpload - isValidImagePath:', isValidImagePath(currentImage));
  console.log('🖼️ ProfilePictureUpload - typeof currentImage:', typeof currentImage);

  // Additional debugging for undefined values
  if (currentImage === undefined) {
    console.log('🖼️ ProfilePictureUpload - currentImage is explicitly undefined');
  } else if (currentImage === null) {
    console.log('🖼️ ProfilePictureUpload - currentImage is null');
  } else if (currentImage === 'undefined') {
    console.log('🖼️ ProfilePictureUpload - currentImage is string "undefined"');
  }

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Profile Picture Container */}
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100 relative group`}>
        {hasValidImage ? (
          <img
            src={displayImage}
            alt="Profile"
            className="h-full w-full object-cover"
            onError={(e) => {
              console.warn('🖼️ Failed to load profile image:', displayImage);
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              // Show fallback instead
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) {
                fallback.classList.remove('hidden');
              }

              // Also try to preload the image to see if it's a network issue
              fetch(displayImage)
                .then(response => {
                  if (!response.ok) {
                    console.warn('🖼️ Image fetch failed with status:', response.status, response.statusText);
                  }
                })
                .catch(error => {
                  console.warn('🖼️ Image fetch failed with error:', error);
                });
            }}
            onLoad={(e) => {
              console.log('🖼️ Profile image loaded successfully:', displayImage);
              const target = e.target as HTMLImageElement;
              // Make sure the image is visible
              target.style.display = 'block';
              // Hide fallback
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) {
                fallback.classList.add('hidden');
              }
            }}
          />
        ) : null}

        {/* Fallback display when no image or image fails to load */}
        <div className={`${hasValidImage ? 'hidden' : ''} absolute inset-0 h-full w-full flex items-center justify-center bg-blue-100 rounded-full`}>
          <User className={`${iconSizes[size]} text-blue-600`} />
        </div>

        {/* Overlay for edit mode */}
        {editable && (
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                type="button"
                onClick={handleCameraClick}
                className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all duration-200"
                title="Change profile picture"
              >
                <Camera className="h-4 w-4 text-gray-700" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Camera Button (always visible in edit mode) */}
      {editable && (
        <button
          type="button"
          onClick={handleCameraClick}
          className="absolute bottom-0 right-0 p-1.5 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors duration-200 border-2 border-white"
          title="Change profile picture"
        >
          <Camera className="h-3 w-3" />
        </button>
      )}

      {/* Remove Button (only when there's an image) */}
      {editable && hasValidImage && (
        <button
          type="button"
          onClick={handleRemoveImage}
          className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors duration-200 border-2 border-white"
          title="Remove profile picture"
        >
          <X className="h-3 w-3" />
        </button>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Instructions */}
      {editable && !hasValidImage && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 text-center whitespace-nowrap">
          Click to upload
        </div>
      )}
    </div>
  );
};

export default ProfilePictureUpload;