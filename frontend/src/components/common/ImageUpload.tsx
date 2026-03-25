import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader, Palette } from 'lucide-react';
import { uploadService } from '../../services/uploadService';
import { ProductImage } from '../../services/productService';

interface ImageUploadProps {
  images: string[] | ProductImage[];
  onChange: (images: string[] | ProductImage[]) => void;
  maxImages?: number;
  required?: boolean;
  supportColorMetadata?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  onChange,
  maxImages = 20,
  required = false,
  supportColorMetadata = false
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [colorInput, setColorInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper functions to work with both formats
  const getImageUrl = (image: string | ProductImage): string => {
    return typeof image === 'string' ? image : image.url;
  };

  const getImageColor = (image: string | ProductImage): string => {
    return typeof image === 'string' ? '' : (image.colorName || image.colorLabel || '');
  };

  const updateImageColor = (index: number, colorName: string) => {
    const newImages = [...images];
    if (typeof newImages[index] === 'string') {
      // Convert string to ProductImage object
      newImages[index] = {
        url: newImages[index] as string,
        colorName: colorName.trim(),
        colorLabel: colorName.trim()
      } as ProductImage;
    } else {
      // Update existing ProductImage object
      (newImages[index] as ProductImage).colorName = colorName.trim();
      (newImages[index] as ProductImage).colorLabel = colorName.trim();
    }
    onChange(newImages);
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    // Check if adding these files would exceed the limit
    if (images.length + fileArray.length > maxImages) {
      alert(`You can only upload up to ${maxImages} images`);
      return;
    }

    // Validate each file
    for (const file of fileArray) {
      const validation = uploadService.validateImageFile(file);
      if (!validation.valid) {
        alert(validation.error);
        return;
      }
    }

    setUploading(true);
    try {
      const uploadResults = await uploadService.uploadMultipleImages(fileArray);
      const newImages = uploadResults.map(result => {
        const imageUrl = `http://localhost:8000${result.url}`;
        
        if (supportColorMetadata) {
          return {
            url: imageUrl,
            colorName: '',
            colorLabel: '',
            description: ''
          } as ProductImage;
        }
        
        return imageUrl;
      });
      
      onChange([...images, ...newImages]);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload images. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Product Images {required && '*'}
      </label>
      
      {/* Image Preview Grid */}
      {images.filter(img => {
        const url = getImageUrl(img);
        return url && url.trim();
      }).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
          {images.filter(img => {
            const url = getImageUrl(img);
            return url && url.trim();
          }).map((image, index) => {
            const imageUrl = getImageUrl(image);
            const colorName = getImageColor(image);
            const actualIndex = images.indexOf(image);
            
            return (
              <div key={index} className="relative group bg-white rounded-lg border border-gray-300">
                <img
                  src={imageUrl}
                  alt={`Product ${index + 1}`}
                  className="w-full h-32 object-cover rounded-t-lg"
                />
                
                {/* Color metadata section */}
                {supportColorMetadata && (
                  <div className="p-2 border-t">
                    {editingIndex === actualIndex ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={colorInput}
                          onChange={(e) => setColorInput(e.target.value)}
                          placeholder="Enter color name (e.g., Royal Blue)"
                          className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateImageColor(actualIndex, colorInput);
                              setEditingIndex(null);
                              setColorInput('');
                            } else if (e.key === 'Escape') {
                              setEditingIndex(null);
                              setColorInput('');
                            }
                          }}
                          autoFocus
                        />
                        <div className="flex space-x-1">
                          <button
                            type="button"
                            onClick={() => {
                              updateImageColor(actualIndex, colorInput);
                              setEditingIndex(null);
                              setColorInput('');
                            }}
                            className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingIndex(null);
                              setColorInput('');
                            }}
                            className="text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingIndex(actualIndex);
                          setColorInput(colorName);
                        }}
                        className="w-full text-left flex items-center space-x-1 text-xs p-1 rounded hover:bg-gray-100"
                      >
                        <Palette className="h-3 w-3 text-gray-500" />
                        <span className="truncate">
                          {colorName || 'Add color name...'}
                        </span>
                      </button>
                    )}
                  </div>
                )}
                
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeImage(actualIndex)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
                
                {/* Color indicator */}
                {supportColorMetadata && colorName && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-black bg-opacity-70 text-white text-xs rounded">
                    {colorName}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Area */}
      {images.length < maxImages && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={openFileDialog}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
          
          {uploading ? (
            <div className="flex flex-col items-center">
              <Loader className="h-12 w-12 text-primary-500 animate-spin" />
              <p className="mt-2 text-sm text-gray-600">Uploading images...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                <span className="font-medium text-primary-600">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, GIF up to 10MB ({maxImages - images.length} remaining)
              </p>
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>
          {required && images.length === 0 && 'At least one image is required. '}
          You can upload up to {maxImages} images. Recommended size: 800x800px or larger.
        </p>
        {supportColorMetadata && (
          <p className="text-blue-600 font-medium">
            💡 Click on "Add color name..." below each image to specify the color variant. 
            This helps customers choose the right color for their custom orders.
          </p>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
