import React, { useState, useEffect } from 'react';
import { X, Package, User, Calendar, MapPin, Palette, Ruler, AlertCircle, ShoppingCart, Check, XCircle, Camera, Upload, HelpCircle, Info } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useCart } from '../../contexts/CartContext';
import { validateMeasurement, getMeasurementInfo } from '../../utils/measurementValidation';
import { ProductImage } from '../../services/productService';
import { uploadService } from '../../services/uploadService';

interface Product {
  _id: string;
  name: string;
  images: string[] | ProductImage[]; // Support both old format and new format with color metadata
  designer: {
    _id: string;
    name: string;
    businessAddress?: string;
  };
  category: string;
  price: number;
  description?: string;
  tags?: string[];
  colors?: string[];
  sizes?: string[];
  materials?: string[];
  inStock?: boolean;
  rating?: number;
  reviewCount?: number;
  discountPrice?: number;
  customizable?: boolean;
  stockQuantity?: number;
  featured?: boolean;
  createdAt?: string;
  updatedAt?: string;
  deliveryTimeOptions?: {
    standard: {
      enabled: boolean;
      days: number;
      description: string;
      price: number;
    };
    express: {
      enabled: boolean;
      days: number;
      description: string;
      price: number;
    };
    premium: {
      enabled: boolean;
      days: number;
      description: string;
      price: number;
    };
  };
}

interface ProductCustomOrderProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  selectedImageFromDetail?: string; // Image selected from product detail page
}

interface MeasurementFields {
  [key: string]: string;
}

const ProductCustomOrder: React.FC<ProductCustomOrderProps> = ({ isOpen, onClose, product, selectedImageFromDetail }) => {
  const { user } = useAuth();
  const { addToast } = useNotification();
  const { addCustomOrderToCart } = useCart();

  const [formData, setFormData] = useState({
    color: '',
    customColorName: '',
    customColorImage: '',
    deliveryType: 'standard', // 'standard', 'express', 'premium'
    collectionMethod: 'delivery', // 'delivery' or 'pickup'
    deliveryLocation: '',
    additionalNotes: '',
    measurements: {} as MeasurementFields
  });

  const [displayedImage, setDisplayedImage] = useState<string>('');
  const [showCustomColorUpload, setShowCustomColorUpload] = useState(false);
  const [uploadingCustomColor, setUploadingCustomColor] = useState(false);

  const [loading, setLoading] = useState(false);
  const [measurementErrors, setMeasurementErrors] = useState<Record<string, string>>({});
  const [measurementWarnings, setMeasurementWarnings] = useState<Record<string, string>>({});
  const [productDeliveryOptions, setProductDeliveryOptions] = useState<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingOrderData, setPendingOrderData] = useState<any>(null);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  // Helper functions to handle both old and new image formats
  const getImageUrl = (image: string | ProductImage): string => {
    if (typeof image === 'string') {
      return image;
    }
    return image.url;
  };

  const getImageColorName = (image: string | ProductImage): string | null => {
    if (typeof image === 'string') {
      return null;
    }
    return image.colorName || image.colorLabel || null;
  };

  const getAvailableColors = (): string[] => {
    const processedImages = Array.isArray(product.images) ? product.images : [];
    const imageColors: string[] = [];
    
    // Only get colors that were specifically assigned to images by the designer
    processedImages.forEach(img => {
      const colorName = getImageColorName(img);
      if (colorName && colorName.trim() && !imageColors.includes(colorName.trim())) {
        imageColors.push(colorName.trim());
      }
    });

    // Return only colors from images with color metadata - no fallback
    return imageColors;
  };

  const findImageByColor = (colorName: string): string => {
    const processedImages = Array.isArray(product.images) ? product.images : [];
    
    for (const img of processedImages) {
      const imgColorName = getImageColorName(img);
      if (imgColorName === colorName) {
        return getImageUrl(img);
      }
    }
    
    // If no specific color image found, return the first image or selected image from detail
    return selectedImageFromDetail || getImageUrl(processedImages[0]) || '';
  };

  const handleColorChange = (color: string) => {
    if (color === 'custom') {
      setShowCustomColorUpload(true);
      // Only clear custom color fields if switching from a different option
      // Don't clear if already in custom mode to preserve uploaded image
      if (!showCustomColorUpload) {
        setFormData(prevData => ({ ...prevData, color: '', customColorName: '', customColorImage: '' }));
        setDisplayedImage(selectedImageFromDetail || getImageUrl(Array.isArray(product.images) ? product.images[0] : '') || '');
      }
    } else {
      setShowCustomColorUpload(false);
      setFormData(prevData => ({ ...prevData, color, customColorName: '', customColorImage: '' }));
      
      // Update displayed image to match selected color (only if the color was assigned to an image)
      if (color && availableColors.includes(color)) {
        const colorImage = findImageByColor(color);
        if (colorImage) {
          setDisplayedImage(colorImage);
        }
      } else {
        // For typed colors (not from designer's images), keep the original selected image
        setDisplayedImage(selectedImageFromDetail || getImageUrl(Array.isArray(product.images) ? product.images[0] : '') || '');
      }
    }
  };

  const handleCustomColorImageUpload = async (file: File) => {
    if (!file) return;

    const validation = uploadService.validateImageFile(file);
    if (!validation.valid) {
      addToast('error', validation.error || 'Invalid image file');
      return;
    }

    setUploadingCustomColor(true);
    try {
      const uploadResult = await uploadService.uploadImage(file);
      const imageUrl = `http://localhost:8000${uploadResult.url}`;
      
      console.log('🎨 Custom color image uploaded:', imageUrl);
      
      // Use functional update to ensure state is properly updated
      setFormData(prevData => ({
        ...prevData,
        customColorImage: imageUrl
      }));
      setDisplayedImage(imageUrl);
      addToast('success', 'Custom color reference image uploaded successfully');
    } catch (error) {
      console.error('Failed to upload custom color image:', error);
      addToast('error', 'Failed to upload image. Please try again.');
    } finally {
      setUploadingCustomColor(false);
    }
  };

  // Get measurement fields based on product category
  const getMeasurementFields = (category: string): { field: string; label: string; placeholder: string }[] => {
    const categoryLower = category.toLowerCase();

    const measurementMap: { [key: string]: { field: string; label: string; placeholder: string }[] } = {
      dress: [
        { field: 'bust', label: 'Bust', placeholder: 'e.g., 36 inches' },
        { field: 'waist', label: 'Waist', placeholder: 'e.g., 28 inches' },
        { field: 'hip', label: 'Hip', placeholder: 'e.g., 38 inches' },
        { field: 'shoulder', label: 'Shoulder Width', placeholder: 'e.g., 15 inches' },
        { field: 'dress_length', label: 'Dress Length', placeholder: 'e.g., 42 inches' },
        { field: 'sleeve', label: 'Sleeve Length', placeholder: 'e.g., 24 inches' }
      ],
      suit: [
        { field: 'chest', label: 'Chest', placeholder: 'e.g., 40 inches' },
        { field: 'waist', label: 'Waist', placeholder: 'e.g., 32 inches' },
        { field: 'hip', label: 'Hip', placeholder: 'e.g., 38 inches' },
        { field: 'shoulder', label: 'Shoulder Width', placeholder: 'e.g., 18 inches' },
        { field: 'sleeve', label: 'Sleeve Length', placeholder: 'e.g., 25 inches' },
        { field: 'jacket_length', label: 'Jacket Length', placeholder: 'e.g., 28 inches' },
        { field: 'trouser_waist', label: 'Trouser Waist', placeholder: 'e.g., 32 inches' },
        { field: 'trouser_length', label: 'Trouser Length', placeholder: 'e.g., 42 inches' },
        { field: 'inseam', label: 'Inseam', placeholder: 'e.g., 32 inches' }
      ],
      shirt: [
        { field: 'chest', label: 'Chest', placeholder: 'e.g., 38 inches' },
        { field: 'waist', label: 'Waist', placeholder: 'e.g., 32 inches' },
        { field: 'shoulder', label: 'Shoulder Width', placeholder: 'e.g., 16 inches' },
        { field: 'sleeve', label: 'Sleeve Length', placeholder: 'e.g., 24 inches' },
        { field: 'shirt_length', label: 'Shirt Length', placeholder: 'e.g., 28 inches' },
        { field: 'neck', label: 'Neck', placeholder: 'e.g., 15.5 inches' }
      ],
      trouser: [
        { field: 'waist', label: 'Waist', placeholder: 'e.g., 32 inches' },
        { field: 'hip', label: 'Hip', placeholder: 'e.g., 38 inches' },
        { field: 'thigh', label: 'Thigh', placeholder: 'e.g., 22 inches' },
        { field: 'trouser_length', label: 'Length', placeholder: 'e.g., 42 inches' },
        { field: 'inseam', label: 'Inseam', placeholder: 'e.g., 32 inches' }
      ]
    };

    // Determine category type
    if (categoryLower.includes('dress')) return measurementMap.dress;
    if (categoryLower.includes('suit') || categoryLower.includes('blazer')) return measurementMap.suit;
    if (categoryLower.includes('shirt') || categoryLower.includes('blouse') || categoryLower.includes('top')) return measurementMap.shirt;
    if (categoryLower.includes('trouser') || categoryLower.includes('pants') || categoryLower.includes('bottom')) return measurementMap.trouser;

    // Default measurements
    return [
      { field: 'chest', label: 'Chest/Bust', placeholder: 'e.g., 36 inches' },
      { field: 'waist', label: 'Waist', placeholder: 'e.g., 28 inches' },
      { field: 'hip', label: 'Hip', placeholder: 'e.g., 36 inches' },
      { field: 'length', label: 'Length', placeholder: 'e.g., 24 inches' }
    ];
  };

  const measurementFields = getMeasurementFields(product.category);
  const availableColors = getAvailableColors();

  // Form reset function
  const resetForm = () => {
    setFormData({
      color: '',
      customColorName: '',
      customColorImage: '',
      deliveryType: 'standard',
      collectionMethod: 'delivery',
      deliveryLocation: '',
      additionalNotes: '',
      measurements: {} as MeasurementFields
    });
    setShowCustomColorUpload(false);
    setMeasurementErrors({});
    setMeasurementWarnings({});
    // Reset displayed image to product's first image
    const initialImage = selectedImageFromDetail || getImageUrl(Array.isArray(product.images) ? product.images[0] : '') || '';
    setDisplayedImage(initialImage);
  };

  // Initialize displayed image
  useEffect(() => {
    if (isOpen) {
      // Only set initial image if there's no custom color image already set
      if (!formData.customColorImage) {
        const initialImage = selectedImageFromDetail || getImageUrl(Array.isArray(product.images) ? product.images[0] : '') || '';
        setDisplayedImage(initialImage);
      }
    }
  }, [isOpen, selectedImageFromDetail, product.images, formData.customColorImage]);

  // Initialize product delivery options
  useEffect(() => {
    console.log('Product data:', product); // Debug log
    console.log('Product delivery time options:', product.deliveryTimeOptions); // Debug log

    // Fetch actual delivery time options from the product
    const productDeliveryOpts = product.deliveryTimeOptions;

    if (productDeliveryOpts) {
      setProductDeliveryOptions({
        ...productDeliveryOpts,
        shopAddress: product.designer?.businessAddress || 'Designer shop address will be provided'
      });

      // Set default delivery type to the first enabled option
      const enabledOptions = Object.entries(productDeliveryOpts)
        .filter(([key, option]) => key !== 'shopAddress' && option?.enabled);
      if (enabledOptions.length > 0) {
        setFormData(prev => ({ ...prev, deliveryType: enabledOptions[0][0] }));
      }
    } else {
      // Fallback to default options if product doesn't have delivery options configured
      setProductDeliveryOptions({
        standard: { enabled: true, days: 14, description: 'Standard delivery', price: 0 },
        express: { enabled: false, days: 7, description: 'Express delivery', price: 0 },
        premium: { enabled: false, days: 3, description: 'Premium delivery', price: 0 },
        shopAddress: 'Designer shop address will be provided'
      });
    }
  }, [product]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMeasurementChange = (field: string, value: string) => {
    // Update form data
    setFormData(prev => ({
      ...prev,
      measurements: {
        ...prev.measurements,
        [field]: value
      }
    }));

    // Validate the measurement
    const validation = validateMeasurement(field, value);

    // Update errors
    setMeasurementErrors(prev => {
      const newErrors = { ...prev };
      if (validation.isValid) {
        delete newErrors[field];
      } else if (validation.error) {
        newErrors[field] = validation.error;
      }
      return newErrors;
    });

    // Update warnings
    setMeasurementWarnings(prev => {
      const newWarnings = { ...prev };
      if (validation.warning) {
        newWarnings[field] = validation.warning;
      } else {
        delete newWarnings[field];
      }
      return newWarnings;
    });
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      addToast('error', 'Please log in to place a custom order');
      return;
    }

    // Validate required fields
    if (showCustomColorUpload) {
      if (!formData.customColorName.trim()) {
        addToast('error', 'Please specify your custom color name');
        return;
      }
      if (!formData.customColorImage) {
        addToast('error', 'Please upload a reference image for your custom color');
        return;
      }
    } else if (!formData.color.trim()) {
      addToast('error', 'Please specify your preferred color');
      return;
    }

    if (!formData.deliveryType) {
      addToast('error', 'Please select a delivery type');
      return;
    }

    // Check if the selected delivery type is available
    if (!productDeliveryOptions?.[formData.deliveryType]?.enabled) {
      addToast('error', 'Selected delivery type is not available for this product');
      return;
    }

    if (formData.collectionMethod === 'delivery' && !formData.deliveryLocation.trim()) {
      addToast('error', 'Please specify your delivery location');
      return;
    }

    // Check for measurement validation errors
    if (Object.keys(measurementErrors).length > 0) {
      addToast('error', 'Please fix the measurement errors before submitting');
      return;
    }

    // Check if at least some measurements are provided
    const providedMeasurements = Object.values(formData.measurements).filter(m => m && m.trim());
    if (providedMeasurements.length === 0) {
      addToast('error', 'Please provide at least some measurements');
      return;
    }

    // Prepare custom order data for confirmation
    const selectedDeliveryOption = productDeliveryOptions?.[formData.deliveryType];
    const deliveryDays = selectedDeliveryOption?.days || 14;
    const deliveryDescription = selectedDeliveryOption?.description || 'Standard delivery';
    const deliveryTimePrice = selectedDeliveryOption?.price || 0;

    // Calculate expected delivery date based on delivery type
    const expectedDeliveryDate = new Date();
    expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + deliveryDays);

    const finalColor = showCustomColorUpload ? formData.customColorName : formData.color;
    const customColorNotes = showCustomColorUpload && formData.customColorImage 
      ? `\n\nCustom Color: ${formData.customColorName}\nReference Image: ${formData.customColorImage}` 
      : '';

    const customOrderData = {
      measurements: formData.measurements,
      expectedDeliveryDate: expectedDeliveryDate.toISOString().split('T')[0],
      deliveryType: formData.deliveryType,
      deliveryTimePrice: deliveryTimePrice,
      collectionMethod: formData.collectionMethod,
      deliveryLocation: formData.collectionMethod === 'delivery' ? formData.deliveryLocation : '',
      designerShopAddress: formData.collectionMethod === 'pickup' ? (productDeliveryOptions?.shopAddress || '') : '',
      additionalNotes: `${formData.additionalNotes}\n\nColor: ${finalColor}${customColorNotes}\n\nDelivery: ${deliveryDescription} (${deliveryDays} days) - MWK ${deliveryTimePrice.toLocaleString()}\nCollection: ${formData.collectionMethod === 'delivery' ? 'Delivery to location' : 'Pickup at designer shop'}`,
      productType: product.category || 'Fashion Item',
      estimatedPrice: product.price,
      customColor: showCustomColorUpload ? {
        name: formData.customColorName,
        referenceImage: formData.customColorImage
      } : null
    };

    // Store the data and show confirmation
    setPendingOrderData(customOrderData);
    setShowConfirmation(true);
  };

  // Handle confirmed submission
  const handleConfirmSubmit = async () => {
    if (!pendingOrderData) return;

    try {
      setLoading(true);
      setShowConfirmation(false);

      // Add custom order to cart
      const orderColor = showCustomColorUpload ? formData.customColorName : formData.color;
      console.log('🛒 Adding custom order to cart:', {
        product: product.name,
        color: orderColor,
        customOrderData: pendingOrderData,
        isCustomOrder: true
      });
      addCustomOrderToCart(product as any, pendingOrderData, orderColor);

      addToast('success', 'Custom order added to cart! Complete payment to send request to designer.');
      
      // Reset form but don't close modal
      resetForm();
      setPendingOrderData(null);


    } catch (error) {
      console.error('Error creating custom order:', error);
      addToast('error', 'Failed to send custom order request');
    } finally {
      setLoading(false);
    }
  };

  // Handle confirmation cancellation
  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
    setPendingOrderData(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-3">
      <div className="bg-white shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden rounded-lg modal-shadow">
        {/* Header - Shorter and slicker */}
        <div className="bg-black text-white px-4 py-2 border-b border-yellow-400">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Package className="h-4 w-4 mr-2 text-yellow-400" />
              <h2 className="text-sm font-bold text-white">Custom Order Request</h2>
            </div>
            <button
              type="button"
              title="Close modal"
              onClick={onClose}
              className="text-gray-300 hover:text-yellow-400 transition-colors p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row modal-content-height">
          {/* Product Reference - Made wider to show full details */}
          <div className="lg:w-1/3 bg-gray-50 p-4 overflow-y-auto border-r border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
              <Package className="h-4 w-4 mr-2 text-yellow-600" />
              Product Reference
            </h3>

            {/* Product Image - 1:1 aspect ratio (square) - Updates based on color selection */}
            <div className="mb-4">
              <img
                src={displayedImage || getImageUrl(Array.isArray(product.images) ? product.images[0] : '') || '/placeholder-image.jpg'}
                alt={`${product.name}${formData.color ? ` - ${formData.color}` : ''}`}
                className="w-full aspect-square object-cover rounded-lg shadow-md border border-gray-200"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-image.jpg';
                }}
              />
              {formData.color && (
                <div className="mt-2 px-2 py-1 bg-yellow-100 border border-yellow-300 rounded-md">
                  <p className="text-xs text-yellow-800 font-medium text-center">
                    🎨 Showing: {formData.color}
                  </p>
                </div>
              )}
            </div>

            {/* Product Info - More detailed */}
            <div className="space-y-3">
              <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                <h4 className="font-semibold text-gray-900 text-sm mb-1">{product.name}</h4>
                <p className="text-xs text-gray-600 mb-2 capitalize">{product.category} • Unisex • Top</p>

                <div className="flex items-center mb-2">
                  <User className="h-3 w-3 text-gray-400 mr-1" />
                  <span className="text-xs text-gray-600">by {product.designer.name}</span>
                </div>

                <div className="border-t border-gray-100 pt-2">
                  <p className="text-xs text-gray-500 mb-1">Base Price Estimate</p>
                  <p className="text-sm font-bold text-yellow-600">MWK {product.price.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 italic">*Final price may vary based on customization</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Form */}
          <div className="lg:w-2/3 flex flex-col">
            <div className="flex-1 p-4 overflow-y-auto">
              {/* Important Disclaimer */}
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Important: Measurement Accuracy Required
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p className="mb-2">
                        <strong>Please ensure all measurements and details are accurate.</strong> Custom orders are made specifically to your measurements and cannot be returned or exchanged.
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Double-check all measurements before submitting</li>
                        <li>Provide measurements in the same unit (inches or centimeters)</li>
                        <li>Include any special requirements in the additional notes</li>
                        <li>Custom orders typically take longer than ready-made items</li>
                      </ul>
                      <p className="mt-2 font-medium">
                        By proceeding, you acknowledge that custom orders are final and non-refundable.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
              {/* Color Selection - Dropdown with available colors */}
              <div>
                <label className="flex items-center text-xs font-medium text-gray-700 mb-1">
                  <Palette className="h-3 w-3 mr-1" />
                  Preferred Color * 
                  {availableColors.length > 0 && (
                    <span className="ml-1 text-gray-500 text-xs">({availableColors.length} designer colors available)</span>
                  )}
                </label>
                
                {availableColors.length > 0 ? (
                  // Designer has assigned colors to images
                  <>
                    <select
                      value={showCustomColorUpload ? 'custom' : formData.color}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500"
                      required
                    >
                      <option value="">Select from designer's colors...</option>
                      {availableColors.map((color, index) => (
                        <option key={index} value={color}>
                          🎨 {color}
                        </option>
                      ))}
                      <option value="custom">➕ Request Custom Color (Upload Reference Image)</option>
                    </select>
                    <p className="text-xs text-green-600 mt-1 font-medium">
                      ✓ Colors available from designer's product images
                    </p>
                  </>
                ) : (
                  // Designer hasn't assigned colors to images yet
                  <>
                    <select
                      value={showCustomColorUpload ? 'custom' : (formData.color ? 'text' : '')}
                      onChange={(e) => {
                        if (e.target.value === 'custom') {
                          handleColorChange('custom');
                        } else {
                          setShowCustomColorUpload(false);
                          setFormData(prevData => ({ ...prevData, color: '', customColorName: '', customColorImage: '' }));
                        }
                      }}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 mb-2"
                    >
                      <option value="">Choose color option...</option>
                      <option value="text">💬 Type Color Name</option>
                      <option value="custom">🎨 Upload Color Reference Image</option>
                    </select>
                    {!showCustomColorUpload && (
                      <input
                        type="text"
                        value={formData.color}
                        onChange={(e) => setFormData(prevData => ({ ...prevData, color: e.target.value }))}
                        placeholder="e.g., Royal Blue, Emerald Green, Custom Pattern"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500"
                        required
                      />
                    )}
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
                      <p className="text-xs text-yellow-700">
                        <strong>ℹ️ Note:</strong> This designer hasn't assigned specific colors to their product images yet. 
                        You can describe your preferred color or upload a reference image.
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Custom Color Upload Section */}
              {showCustomColorUpload && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Camera className="h-4 w-4 text-blue-600" />
                    <h4 className="text-sm font-semibold text-blue-800">Custom Color Details</h4>
                  </div>
                  
                  {/* Custom Color Name Input */}
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">
                      Color Name *
                    </label>
                    <input
                      type="text"
                      value={formData.customColorName}
                      onChange={(e) => setFormData(prevData => ({ ...prevData, customColorName: e.target.value }))}
                      placeholder="e.g., Sunset Orange, Forest Green, Burgundy Wine"
                      className="w-full px-2 py-1.5 text-sm border border-blue-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      required={showCustomColorUpload}
                    />
                  </div>

                  {/* Custom Color Image Upload */}
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-2">
                      Reference Image * 
                      <span className="text-gray-500 font-normal">(Upload an image showing the desired color)</span>
                    </label>
                    
                    {formData.customColorImage ? (
                      <div className="relative group">
                        <img
                          src={formData.customColorImage}
                          alt="Custom color reference"
                          className="w-full max-w-xs h-32 object-cover rounded-lg border border-blue-300"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prevData => ({ ...prevData, customColorImage: '' }));
                            setDisplayedImage('');
                          }}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <div className="mt-2 text-xs text-green-600 font-medium">
                          ✓ Custom color reference uploaded
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 text-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleCustomColorImageUpload(file);
                            }
                          }}
                          className="hidden"
                          id="custom-color-upload"
                          disabled={uploadingCustomColor}
                        />
                        <label
                          htmlFor="custom-color-upload"
                          className={`cursor-pointer flex flex-col items-center space-y-2 ${
                            uploadingCustomColor ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {uploadingCustomColor ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          ) : (
                            <Upload className="h-8 w-8 text-blue-400" />
                          )}
                          <span className="text-sm text-blue-600 font-medium">
                            {uploadingCustomColor ? 'Uploading...' : 'Click to upload reference image'}
                          </span>
                          <span className="text-xs text-gray-500">
                            PNG, JPG up to 10MB
                          </span>
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <p className="text-xs text-yellow-700">
                      <strong>💡 Tip:</strong> Upload a clear image showing the exact color you want. 
                      This could be fabric, paint sample, or any object with your desired color. 
                      The designer will use this as reference to match your custom color as closely as possible.
                    </p>
                  </div>
                </div>
              )}

              {/* Measurements */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center text-xs font-medium text-gray-700">
                    <Ruler className="h-3 w-3 mr-1" />
                    Measurements (in inches)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowSizeGuide(true)}
                    className="flex items-center text-xs text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <HelpCircle className="h-3 w-3 mr-1" />
                    Size Guide
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {measurementFields.map((field) => {
                    const hasError = measurementErrors[field.field];
                    const hasWarning = measurementWarnings[field.field];

                    return (
                      <div key={field.field}>
                        <label className="block text-xs text-gray-600 mb-1">
                          {field.label}
                        </label>
                        <input
                          type="text"
                          value={formData.measurements[field.field] || ''}
                          onChange={(e) => handleMeasurementChange(field.field, e.target.value)}
                          placeholder="e.g., 36.5"
                          className={`w-full px-2 py-1.5 border rounded focus:ring-1 text-xs ${
                            hasError
                              ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                              : hasWarning
                              ? 'border-yellow-500 focus:ring-yellow-500 focus:border-yellow-500'
                              : 'border-gray-300 focus:ring-yellow-500 focus:border-yellow-500'
                          }`}
                        />
                        {hasError && (
                          <p className="text-xs text-red-600 mt-1 flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {hasError}
                          </p>
                        )}
                        {!hasError && hasWarning && (
                          <p className="text-xs text-yellow-600 mt-1 flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {hasWarning}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {getMeasurementInfo(field.field)}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Tip: Provide at least 3-4 key measurements for better fitting
                </p>
              </div>



              {/* Delivery Type */}
              <div>
                <label className="flex items-center text-xs font-medium text-gray-700 mb-1">
                  <Package className="h-3 w-3 mr-1" />
                  Delivery Type * <span className="text-gray-500 ml-1">(configured by designer)</span>
                </label>
                {productDeliveryOptions ? (
                  <>
                    <select
                      title="Select delivery type"
                      value={formData.deliveryType}
                      onChange={(e) => handleInputChange('deliveryType', e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500"
                      required
                    >
                      {productDeliveryOptions.standard?.enabled && (
                        <option value="standard">
                          Standard ({productDeliveryOptions.standard.days} days) - MWK {productDeliveryOptions.standard.price?.toLocaleString() || '0'}
                        </option>
                      )}
                      {productDeliveryOptions.express?.enabled && (
                        <option value="express">
                          Express ({productDeliveryOptions.express.days} days) - MWK {productDeliveryOptions.express.price?.toLocaleString() || '0'}
                        </option>
                      )}
                      {productDeliveryOptions.premium?.enabled && (
                        <option value="premium">
                          Premium ({productDeliveryOptions.premium.days} days) - MWK {productDeliveryOptions.premium.price?.toLocaleString() || '0'}
                        </option>
                      )}
                    </select>

                    {/* Show delivery timeline and price info for selected option */}
                    {formData.deliveryType && productDeliveryOptions[formData.deliveryType]?.enabled && (
                      <div className="mt-1 text-xs text-gray-600">
                        <span className="inline-flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Estimated completion: {productDeliveryOptions[formData.deliveryType].days} days from order confirmation
                        </span>
                        <div className="mt-1 text-xs font-medium text-gray-800">
                          Delivery cost: MWK {productDeliveryOptions[formData.deliveryType].price?.toLocaleString() || '0'}
                        </div>
                        <div className="mt-1 text-xs text-gray-500 italic">
                          ℹ️ Delivery options and pricing set by {product.designer.name}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                    Loading delivery options...
                  </div>
                )}
              </div>

              {/* Collection Method */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Collection Method *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center p-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 text-xs">
                    <input
                      type="radio"
                      name="collectionMethod"
                      value="delivery"
                      checked={formData.collectionMethod === 'delivery'}
                      onChange={(e) => handleInputChange('collectionMethod', e.target.value)}
                      className="mr-2"
                    />
                    <div>
                      <div className="font-medium">Delivery</div>
                      <div className="text-gray-500">To your location</div>
                    </div>
                  </label>
                  <label className="flex items-center p-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 text-xs">
                    <input
                      type="radio"
                      name="collectionMethod"
                      value="pickup"
                      checked={formData.collectionMethod === 'pickup'}
                      onChange={(e) => handleInputChange('collectionMethod', e.target.value)}
                      className="mr-2"
                    />
                    <div>
                      <div className="font-medium">Pickup</div>
                      <div className="text-gray-500">At designer shop</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Location Details */}
              <div>
                <label className="flex items-center text-xs font-medium text-gray-700 mb-1">
                  <MapPin className="h-3 w-3 mr-1" />
                  {formData.collectionMethod === 'delivery' ? 'Delivery Location *' : 'Designer Shop Address'}
                </label>
                {formData.collectionMethod === 'delivery' ? (
                  <input
                    type="text"
                    value={formData.deliveryLocation}
                    onChange={(e) => handleInputChange('deliveryLocation', e.target.value)}
                    placeholder="e.g., Lilongwe, Area 10"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500"
                    required
                  />
                ) : (
                  <div className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md bg-gray-50 text-gray-600">
                    {productDeliveryOptions?.shopAddress || 'Designer shop address will be provided'}
                  </div>
                )}
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Additional Notes
                </label>
                <textarea
                  value={formData.additionalNotes}
                  onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                  placeholder="Any special requests, style preferences, or additional details..."
                  rows={3}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>



              {/* Submit Button */}
              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-black text-yellow-400 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  style={{
                    boxShadow: '0 0 10px rgba(234, 179, 8, 0.3)'
                  }}
                >
                  {loading ? 'Adding to Cart...' : 'Add Custom Order to Cart'}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && pendingOrderData && (
        <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-10">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
                Confirm Custom Order Details
              </h3>
            </div>

            <div className="space-y-4 text-sm">
              {/* Product Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Product Information</h4>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-gray-600">Product:</span>
                  <span className="font-medium">{product.name}</span>
                  <span className="text-gray-600">Category:</span>
                  <span>{product.category}</span>
                  <span className="text-gray-600">Base Price:</span>
                  <span className="font-medium">MWK {product.price?.toLocaleString()}</span>
                </div>
              </div>

              {/* Order Details */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Order Details</h4>
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-gray-600">Color:</span>
                  <div className="font-medium text-yellow-700">
                    {showCustomColorUpload ? (
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span>🎨 {formData.customColorName}</span>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Custom</span>
                        </div>
                        {formData.customColorImage && (
                          <div className="mt-2">
                            <img
                              src={formData.customColorImage}
                              alt="Custom color reference"
                              className="w-16 h-16 object-cover rounded border border-gray-300"
                            />
                            <p className="text-xs text-gray-600 mt-1">Reference image</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      formData.color
                    )}
                  </div>
                  <span className="text-gray-600">Delivery Type:</span>
                  <span className="capitalize">
                    {formData.deliveryType} (+MWK {pendingOrderData.deliveryTimePrice?.toLocaleString()})
                  </span>
                  <span className="text-gray-600">Collection Method:</span>
                  <span className="capitalize">{formData.collectionMethod}</span>
                  {formData.collectionMethod === 'delivery' && (
                    <>
                      <span className="text-gray-600">Delivery Location:</span>
                      <span>{formData.deliveryLocation}</span>
                    </>
                  )}
                  <span className="text-gray-600">Expected Date:</span>
                  <span>{new Date(pendingOrderData.expectedDeliveryDate).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Measurements */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Measurements (inches)</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(formData.measurements).filter(([_, value]) => value && value.trim()).map(([key, value]) => (
                    <React.Fragment key={key}>
                      <span className="text-gray-600 capitalize">{key.replace('_', ' ')}:</span>
                      <span className="font-medium">{value}"</span>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Additional Notes */}
              {formData.additionalNotes.trim() && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Additional Notes</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{formData.additionalNotes}</p>
                </div>
              )}

              {/* Total Cost */}
              <div className="bg-green-50 border-2 border-green-200 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Total Estimated Cost</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Base Price:</span>
                    <span>MWK {product.price?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee:</span>
                    <span>MWK {pendingOrderData.deliveryTimePrice?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span className="text-green-700">
                      MWK {((product.price || 0) + (pendingOrderData.deliveryTimePrice || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <div className="flex">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-red-800">Important Notice</h5>
                    <p className="text-red-700 text-sm mt-1">
                      Custom orders are made specifically to your measurements and cannot be returned or exchanged. 
                      Please verify all details are correct before confirming.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Confirmation Buttons */}
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
              <button
                type="button"
                onClick={handleCancelConfirmation}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                <XCircle className="w-4 h-4 mr-2 inline" />
                Cancel & Edit
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <Check className="w-4 h-4 mr-2 inline" />
                {loading ? 'Adding to Cart...' : 'Confirm & Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Measurement Guide</h2>
                <button
                  onClick={() => setShowSizeGuide(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-6">
                {/* General Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-2">How to Take Accurate Measurements</h3>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Use a flexible measuring tape</li>
                        <li>• Wear well-fitting undergarments</li>
                        <li>• Stand straight with arms at your sides</li>
                        <li>• Have someone help you for better accuracy</li>
                        <li>• Measure over light clothing or directly on skin</li>
                        <li>• Keep the tape snug but not tight</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Measurement Diagrams and Instructions */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Upper Body Measurements */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 text-lg border-b pb-2">Upper Body</h3>
                    
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-800 mb-2">Chest/Bust</h4>
                        <p className="text-sm text-gray-600 mb-2">
                          Measure around the fullest part of your chest/bust, keeping the tape parallel to the floor.
                        </p>
                        <div className="bg-gray-100 p-3 rounded text-xs">
                          <strong>Tip:</strong> For women, wear a well-fitting bra. For men, measure at nipple level.
                        </div>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-800 mb-2">Waist</h4>
                        <p className="text-sm text-gray-600 mb-2">
                          Measure around your natural waistline, which is the narrowest part of your torso.
                        </p>
                        <div className="bg-gray-100 p-3 rounded text-xs">
                          <strong>Tip:</strong> Bend to one side to find your natural waist crease.
                        </div>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-800 mb-2">Shoulder Width</h4>
                        <p className="text-sm text-gray-600 mb-2">
                          Measure from the edge of one shoulder to the edge of the other shoulder across your back.
                        </p>
                        <div className="bg-gray-100 p-3 rounded text-xs">
                          <strong>Tip:</strong> Have someone help you with this measurement for accuracy.
                        </div>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-800 mb-2">Arm Length</h4>
                        <p className="text-sm text-gray-600 mb-2">
                          Measure from your shoulder point down to your wrist bone with your arm slightly bent.
                        </p>
                        <div className="bg-gray-100 p-3 rounded text-xs">
                          <strong>Tip:</strong> Keep your arm in a natural position, not fully extended.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lower Body Measurements */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 text-lg border-b pb-2">Lower Body</h3>
                    
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-800 mb-2">Hip</h4>
                        <p className="text-sm text-gray-600 mb-2">
                          Measure around the fullest part of your hips, usually about 7-9 inches below your waist.
                        </p>
                        <div className="bg-gray-100 p-3 rounded text-xs">
                          <strong>Tip:</strong> Stand with feet together for the most accurate measurement.
                        </div>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-800 mb-2">Inseam</h4>
                        <p className="text-sm text-gray-600 mb-2">
                          Measure from your crotch down to where you want the pants to end (ankle or desired length).
                        </p>
                        <div className="bg-gray-100 p-3 rounded text-xs">
                          <strong>Tip:</strong> Use a pair of well-fitting pants as reference for length.
                        </div>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-800 mb-2">Thigh</h4>
                        <p className="text-sm text-gray-600 mb-2">
                          Measure around the fullest part of your thigh, usually about 2-3 inches below your crotch.
                        </p>
                        <div className="bg-gray-100 p-3 rounded text-xs">
                          <strong>Tip:</strong> Stand with weight evenly distributed on both feet.
                        </div>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-800 mb-2">Neck</h4>
                        <p className="text-sm text-gray-600 mb-2">
                          Measure around the base of your neck where a shirt collar would sit.
                        </p>
                        <div className="bg-gray-100 p-3 rounded text-xs">
                          <strong>Tip:</strong> Add 1/2 inch for comfort if measuring for shirts.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Tips */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-900 mb-2">Important Notes</h3>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• All measurements should be in inches</li>
                    <li>• Double-check your measurements before submitting</li>
                    <li>• If you're between sizes, mention your preference in additional notes</li>
                    <li>• Custom orders cannot be returned, so accuracy is crucial</li>
                    <li>• Contact the designer if you need help with specific measurements</li>
                  </ul>
                </div>

                {/* Size Chart Reference */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Standard Size Reference</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Size</th>
                          <th className="text-left py-2">Chest/Bust</th>
                          <th className="text-left py-2">Waist</th>
                          <th className="text-left py-2">Hip</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-600">
                        <tr className="border-b">
                          <td className="py-2 font-medium">XS</td>
                          <td className="py-2">30-32"</td>
                          <td className="py-2">24-26"</td>
                          <td className="py-2">34-36"</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 font-medium">S</td>
                          <td className="py-2">32-34"</td>
                          <td className="py-2">26-28"</td>
                          <td className="py-2">36-38"</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 font-medium">M</td>
                          <td className="py-2">34-36"</td>
                          <td className="py-2">28-30"</td>
                          <td className="py-2">38-40"</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 font-medium">L</td>
                          <td className="py-2">36-38"</td>
                          <td className="py-2">30-32"</td>
                          <td className="py-2">40-42"</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 font-medium">XL</td>
                          <td className="py-2">38-40"</td>
                          <td className="py-2">32-34"</td>
                          <td className="py-2">42-44"</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-medium">XXL</td>
                          <td className="py-2">40-42"</td>
                          <td className="py-2">34-36"</td>
                          <td className="py-2">44-46"</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    *This is a general reference. Custom measurements will be used for your order.
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-end mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowSizeGuide(false)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Got it, thanks!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCustomOrder;