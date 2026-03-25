import React, { useState, useEffect } from 'react';
import { X, Upload, Ruler, AlertCircle, Search, Star, Package, User, ChevronDown, HelpCircle } from 'lucide-react';

import { useNotification } from '../../contexts/NotificationContext';
import { useCart } from '../../contexts/CartContext';
import { designerService, Designer } from '../../services/designerService';
import { validateMeasurement, getMeasurementInfo } from '../../utils/measurementValidation';
import { Product } from '../../services/productService';
import MeasurementGuide from './MeasurementGuide';

interface CustomOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  productReference?: {
    id: string;
    name: string;
    image: string;
    designer: any;
    price: number;
    product?: Product; // Full product data for measurement config
  };
}

interface Measurements {
  chest?: number;
  bust?: number;
  waist?: number;
  hip?: number;
  shoulder?: number;
  sleeve?: number;
  jacketLength?: number;
  trouserWaist?: number;
  trouserLength?: number;
  inseam?: number;
  dressLength?: number;
  trainLength?: number;
  shirtLength?: number;
  thigh?: number;
}

const CustomOrderModal: React.FC<CustomOrderModalProps> = ({
  isOpen,
  onClose,
  productReference
}) => {
  const { addToast } = useNotification();
  const { addCustomOrderToCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    designType: '',
    color: '',
    description: '',
    specialRequirements: '',
    selectedDesigner: '',
    quality: 'standard',
    budget: '',
    budgetType: 'input', // 'input' or 'negotiate'
    timeline: '2weeks',
    deliveryType: 'standard', // 'standard', 'express', 'premium'
    collectionMethod: 'delivery', // 'delivery' or 'pickup'
    location: '',
    measurements: {} as Measurements
  });
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviewUrls, setFilePreviewUrls] = useState<string[]>([]);
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [loadingDesigners, setLoadingDesigners] = useState(false);
  const [measurementErrors, setMeasurementErrors] = useState<Record<string, string>>({});
  const [measurementWarnings, setMeasurementWarnings] = useState<Record<string, string>>({});
  const [designerSearchQuery, setDesignerSearchQuery] = useState('');
  const [selectedDesignerDeliveryOptions, setSelectedDesignerDeliveryOptions] = useState<any>(null);
  const [filteredDesigners, setFilteredDesigners] = useState<Designer[]>([]);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [isDesignerDropdownOpen, setIsDesignerDropdownOpen] = useState(false);
  const [showMeasurementGuide, setShowMeasurementGuide] = useState(false);

  const productCategories = [
    {
      id: 'mens_wear',
      name: 'Men\'s Wear',
      icon: '👔',
      products: [
        { id: 'mens_suit', name: 'Men\'s Suit', measurements: ['chest', 'waist', 'hip', 'shoulder', 'sleeve', 'jacketLength', 'trouserWaist', 'trouserLength', 'inseam'] },
        { id: 'mens_shirt', name: 'Men\'s Shirt', measurements: ['chest', 'waist', 'shoulder', 'sleeve', 'shirtLength'] },
        { id: 'mens_trouser', name: 'Men\'s Trouser', measurements: ['waist', 'hip', 'trouserLength', 'inseam', 'thigh'] },
        { id: 'mens_jacket', name: 'Men\'s Jacket', measurements: ['chest', 'waist', 'shoulder', 'sleeve', 'jacketLength'] },
        { id: 'mens_blazer', name: 'Men\'s Blazer', measurements: ['chest', 'waist', 'shoulder', 'sleeve', 'jacketLength'] },
        { id: 'mens_vest', name: 'Men\'s Vest', measurements: ['chest', 'waist', 'shoulder', 'jacketLength'] },
        { id: 'mens_shorts', name: 'Men\'s Shorts', measurements: ['waist', 'hip', 'trouserLength', 'thigh'] },
        { id: 'mens_polo', name: 'Men\'s Polo Shirt', measurements: ['chest', 'waist', 'shoulder', 'sleeve', 'shirtLength'] },
        { id: 'mens_tuxedo', name: 'Men\'s Tuxedo', measurements: ['chest', 'waist', 'hip', 'shoulder', 'sleeve', 'jacketLength', 'trouserWaist', 'trouserLength', 'inseam'] },
        { id: 'mens_casual_shirt', name: 'Men\'s Casual Shirt', measurements: ['chest', 'waist', 'shoulder', 'sleeve', 'shirtLength'] },
        { id: 'mens_traditional', name: 'Men\'s Traditional Wear', measurements: ['chest', 'waist', 'hip', 'shoulder', 'sleeve', 'dressLength'] }
      ]
    },
    {
      id: 'womens_wear',
      name: 'Women\'s Wear',
      icon: '👗',
      products: [
        { id: 'womens_dress', name: 'Women\'s Dress', measurements: ['bust', 'waist', 'hip', 'shoulder', 'sleeve', 'dressLength'] },
        { id: 'wedding_dress', name: 'Wedding Dress', measurements: ['bust', 'waist', 'hip', 'shoulder', 'dressLength', 'trainLength'] },
        { id: 'evening_gown', name: 'Evening Gown', measurements: ['bust', 'waist', 'hip', 'shoulder', 'dressLength'] },
        { id: 'womens_suit', name: 'Women\'s Suit', measurements: ['bust', 'waist', 'hip', 'shoulder', 'sleeve', 'jacketLength', 'skirtLength'] },
        { id: 'womens_blouse', name: 'Women\'s Blouse', measurements: ['bust', 'waist', 'shoulder', 'sleeve', 'shirtLength'] },
        { id: 'womens_skirt', name: 'Women\'s Skirt', measurements: ['waist', 'hip', 'skirtLength'] },
        { id: 'womens_blazer', name: 'Women\'s Blazer', measurements: ['bust', 'waist', 'shoulder', 'sleeve', 'jacketLength'] },
        { id: 'womens_pants', name: 'Women\'s Pants', measurements: ['waist', 'hip', 'trouserLength', 'inseam', 'thigh'] },
        { id: 'womens_jumpsuit', name: 'Women\'s Jumpsuit', measurements: ['bust', 'waist', 'hip', 'shoulder', 'sleeve', 'dressLength'] },
        { id: 'womens_top', name: 'Women\'s Top', measurements: ['bust', 'waist', 'shoulder', 'sleeve', 'shirtLength'] },
        { id: 'womens_cardigan', name: 'Women\'s Cardigan', measurements: ['bust', 'waist', 'shoulder', 'sleeve', 'jacketLength'] },
        { id: 'womens_shorts', name: 'Women\'s Shorts', measurements: ['waist', 'hip', 'trouserLength', 'thigh'] },
        { id: 'womens_traditional', name: 'Women\'s Traditional Wear', measurements: ['bust', 'waist', 'hip', 'shoulder', 'sleeve', 'dressLength'] }
      ]
    },
    {
      id: 'kids_wear',
      name: 'Kids Wear',
      icon: '👶',
      products: [
        { id: 'kids_dress', name: 'Kids Dress', measurements: ['chest', 'waist', 'hip', 'shoulder', 'dressLength'] },
        { id: 'kids_suit', name: 'Kids Suit', measurements: ['chest', 'waist', 'hip', 'shoulder', 'sleeve', 'jacketLength', 'trouserLength'] },
        { id: 'kids_shirt', name: 'Kids Shirt', measurements: ['chest', 'waist', 'shoulder', 'sleeve', 'shirtLength'] },
        { id: 'kids_trouser', name: 'Kids Trouser', measurements: ['waist', 'hip', 'trouserLength', 'inseam'] },
        { id: 'kids_skirt', name: 'Kids Skirt', measurements: ['waist', 'hip', 'skirtLength'] },
        { id: 'kids_blouse', name: 'Kids Blouse', measurements: ['chest', 'waist', 'shoulder', 'sleeve', 'shirtLength'] },
        { id: 'kids_shorts', name: 'Kids Shorts', measurements: ['waist', 'hip', 'trouserLength'] },
        { id: 'kids_jumpsuit', name: 'Kids Jumpsuit', measurements: ['chest', 'waist', 'hip', 'shoulder', 'sleeve', 'dressLength'] },
        { id: 'kids_traditional', name: 'Kids Traditional Wear', measurements: ['chest', 'waist', 'hip', 'shoulder', 'dressLength'] },
        { id: 'kids_formal', name: 'Kids Formal Wear', measurements: ['chest', 'waist', 'hip', 'shoulder', 'sleeve', 'dressLength'] },
        { id: 'kids_school_uniform', name: 'Kids School Uniform', measurements: ['chest', 'waist', 'hip', 'shoulder', 'sleeve', 'shirtLength', 'trouserLength'] },
        { id: 'kids_party_dress', name: 'Kids Party Dress', measurements: ['chest', 'waist', 'hip', 'shoulder', 'dressLength'] },
        { id: 'kids_casual_wear', name: 'Kids Casual Wear', measurements: ['chest', 'waist', 'hip', 'shoulder', 'sleeve'] },
        { id: 'kids_sportswear', name: 'Kids Sportswear', measurements: ['chest', 'waist', 'hip', 'shoulder', 'sleeve', 'trouserLength'] }
      ]
    },
    {
      id: 'traditional_wear',
      name: 'Traditional Wear',
      icon: '🎭',
      products: [
        { id: 'chitenje_suit', name: 'Chitenje Suit', measurements: ['chest', 'waist', 'hip', 'shoulder', 'sleeve', 'jacketLength', 'trouserWaist', 'trouserLength', 'inseam'] },
        { id: 'chitenje_dress', name: 'Chitenje Dress', measurements: ['bust', 'waist', 'hip', 'shoulder', 'sleeve', 'dressLength'] },
        { id: 'traditional_mens', name: 'Traditional Men\'s Wear', measurements: ['chest', 'waist', 'hip', 'shoulder', 'sleeve', 'dressLength'] },
        { id: 'traditional_womens', name: 'Traditional Women\'s Wear', measurements: ['bust', 'waist', 'hip', 'shoulder', 'sleeve', 'dressLength'] },
        { id: 'cultural_outfit', name: 'Cultural Outfit', measurements: ['chest', 'bust', 'waist', 'hip', 'shoulder', 'sleeve', 'dressLength'] }
      ]
    },
    {
      id: 'special_occasion',
      name: 'Special Occasion',
      icon: '✨',
      products: [
        { id: 'wedding_suit', name: 'Wedding Suit', measurements: ['chest', 'waist', 'hip', 'shoulder', 'sleeve', 'jacketLength', 'trouserWaist', 'trouserLength', 'inseam'] },
        { id: 'bridal_gown', name: 'Bridal Gown', measurements: ['bust', 'waist', 'hip', 'shoulder', 'dressLength', 'trainLength'] },
        { id: 'prom_dress', name: 'Prom Dress', measurements: ['bust', 'waist', 'hip', 'shoulder', 'dressLength'] },
        { id: 'cocktail_dress', name: 'Cocktail Dress', measurements: ['bust', 'waist', 'hip', 'shoulder', 'dressLength'] },
        { id: 'formal_wear', name: 'Formal Wear', measurements: ['chest', 'bust', 'waist', 'hip', 'shoulder', 'sleeve', 'jacketLength'] },
        { id: 'graduation_outfit', name: 'Graduation Outfit', measurements: ['chest', 'bust', 'waist', 'hip', 'shoulder', 'sleeve', 'dressLength'] },
        { id: 'bridesmaid_dress', name: 'Bridesmaid Dress', measurements: ['bust', 'waist', 'hip', 'shoulder', 'dressLength'] },
        { id: 'mother_of_bride', name: 'Mother of Bride Dress', measurements: ['bust', 'waist', 'hip', 'shoulder', 'sleeve', 'dressLength'] },
        { id: 'black_tie_suit', name: 'Black Tie Suit', measurements: ['chest', 'waist', 'hip', 'shoulder', 'sleeve', 'jacketLength', 'trouserWaist', 'trouserLength', 'inseam'] },
        { id: 'gala_dress', name: 'Gala Dress', measurements: ['bust', 'waist', 'hip', 'shoulder', 'dressLength'] },
        { id: 'anniversary_outfit', name: 'Anniversary Outfit', measurements: ['chest', 'bust', 'waist', 'hip', 'shoulder', 'sleeve', 'dressLength'] },
        { id: 'red_carpet_dress', name: 'Red Carpet Dress', measurements: ['bust', 'waist', 'hip', 'shoulder', 'dressLength', 'trainLength'] }
      ]
    }
  ];

  const timelineOptions = [
    { value: '2weeks', label: '2 Weeks' },
    { value: '1month', label: '1 Month' },
    { value: '6weeks', label: '6 Weeks' },
    { value: '2months', label: '2 Months' },
    { value: '3months', label: '3 Months' }
  ];

  const qualityOptions = [
    {
      value: 'standard',
      label: 'Standard Quality',
      description: 'Good quality materials and craftsmanship'
    },
    {
      value: 'premium',
      label: 'Premium Quality',
      description: 'High-end materials and superior craftsmanship'
    }
  ];

  // Get measurement fields based on selected product or product reference
  const getMeasurementFields = (productId: string): { field: string; label: string; placeholder: string; required: boolean; helpText?: string }[] => {
    // First check if we have a product reference with measurement config
    if (productReference?.product?.measurementConfig?.enabled) {
      const config = productReference.product.measurementConfig;
      const allMeasurements: { field: string; label: string; placeholder: string; required: boolean; helpText?: string }[] = [];
      
      config.requiredMeasurements.forEach(category => {
        category.measurements.forEach(measurement => {
          allMeasurements.push({
            field: measurement.field,
            label: measurement.label,
            placeholder: measurement.placeholder || `Enter ${measurement.label.toLowerCase()}`,
            required: measurement.required,
            helpText: measurement.helpText
          });
        });
      });
      
      return allMeasurements;
    }

    // Fallback to legacy system
    let selectedProduct = null;

    // Find the selected product across all categories
    for (const category of productCategories) {
      const product = category.products.find(p => p.id === productId);
      if (product) {
        selectedProduct = product;
        break;
      }
    }

    if (!selectedProduct) return [];

    const fieldLabels: Record<string, { label: string; placeholder: string }> = {
      chest: { label: 'Chest', placeholder: 'e.g., 38 inches' },
      bust: { label: 'Bust', placeholder: 'e.g., 36 inches' },
      waist: { label: 'Waist', placeholder: 'e.g., 32 inches' },
      hip: { label: 'Hip', placeholder: 'e.g., 40 inches' },
      shoulder: { label: 'Shoulder Width', placeholder: 'e.g., 16 inches' },
      sleeve: { label: 'Sleeve Length', placeholder: 'e.g., 24 inches' },
      jacketLength: { label: 'Jacket Length', placeholder: 'e.g., 28 inches' },
      trouserWaist: { label: 'Trouser Waist', placeholder: 'e.g., 32 inches' },
      trouserLength: { label: 'Trouser Length', placeholder: 'e.g., 42 inches' },
      inseam: { label: 'Inseam', placeholder: 'e.g., 32 inches' },
      dressLength: { label: 'Dress/Gown Length', placeholder: 'e.g., 45 inches' },
      trainLength: { label: 'Train Length', placeholder: 'e.g., 12 inches' },
      shirtLength: { label: 'Shirt Length', placeholder: 'e.g., 28 inches' },
      thigh: { label: 'Thigh', placeholder: 'e.g., 24 inches' },
      skirtLength: { label: 'Skirt Length', placeholder: 'e.g., 26 inches' }
    };

    return selectedProduct.measurements.map(field => ({
      field,
      label: fieldLabels[field]?.label || field,
      placeholder: fieldLabels[field]?.placeholder || `Enter ${field}`,
      required: true,
      helpText: undefined
    }));
  };

  // Handle measurement changes with validation
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

  // Load designers on component mount
  useEffect(() => {
    if (isOpen) {
      loadDesigners();
      // Pre-fill with product reference if available
      if (productReference) {
        setFormData(prev => ({
          ...prev,
          selectedDesigner: productReference.designer?.id || '',
          description: `Custom order based on: ${productReference.name}`
        }));
      }
    }
  }, [isOpen, productReference]);

  const loadDesigners = async () => {
    setLoadingDesigners(true);
    try {
      const response = await designerService.getDesigners({
        page: 1,
        limit: 100, // Increased limit to get more designers for ranking
        sortBy: 'name',
        sortType: 'asc'
      });

      // Rank designers by ratings first, then reviews and orders
      const rankedDesigners = (response.docs || []).sort((a, b) => {
        // Primary sort: Average rating (higher is better) - backend returns 'rating'
        const aRating = ((a as any).rating || 0);
        const bRating = ((b as any).rating || 0);

        if (aRating !== bRating) {
          return bRating - aRating; // Higher rating first
        }

        // Secondary sort: Activity score (reviews count more than orders) - backend returns 'reviewCount'
        const aScore = ((a as any).reviewCount || 0) * 3 + ((a as any).totalOrders || 0);
        const bScore = ((b as any).reviewCount || 0) * 3 + ((b as any).totalOrders || 0);
        return bScore - aScore; // Higher activity first
      });

      setDesigners(rankedDesigners);
      setFilteredDesigners(rankedDesigners);
    } catch (error) {
      console.error('Error loading designers:', error);
      addToast('error', 'Failed to load designers');
    } finally {
      setLoadingDesigners(false);
    }
  };

  // Filter designers based on search query
  useEffect(() => {
    if (!designerSearchQuery.trim()) {
      setFilteredDesigners(designers);
    } else {
      const filtered = designers.filter(designer =>
        designer.name.toLowerCase().includes(designerSearchQuery.toLowerCase()) ||
        (designer.businessName && designer.businessName.toLowerCase().includes(designerSearchQuery.toLowerCase())) ||
        (designer.specialty && designer.specialty.toLowerCase().includes(designerSearchQuery.toLowerCase()))
      );
      setFilteredDesigners(filtered);
    }
  }, [designerSearchQuery, designers]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isDesignerDropdownOpen && !target.closest('.designer-dropdown')) {
        setIsDesignerDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDesignerDropdownOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length + files.length > 5) {
      addToast('error', 'Maximum 5 images allowed');
      return;
    }

    setFiles(prev => [...prev, ...selectedFiles]);
    
    // Create preview URLs
    selectedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreviewUrls(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Check for measurement validation errors
    if (Object.keys(measurementErrors).length > 0) {
      addToast('error', 'Please fix the measurement errors before submitting');
      return;
    }

    if (!selectedProduct || !formData.selectedDesigner || !formData.description) {
      addToast('error', 'Please fill in all required fields (product type, designer, and description)');
      return;
    }

    setIsSubmitting(true);
    try {
      // Get product type name
      const productTypeName = (() => {
        for (const category of productCategories) {
          const product = category.products.find(p => p.id === selectedProduct);
          if (product) return product.name;
        }
        return selectedProduct || 'Custom Fashion Item';
      })();

      // Get selected designer info
      const selectedDesignerInfo = designers.find(d => d._id === formData.selectedDesigner);
      if (!selectedDesignerInfo) {
        addToast('error', 'Selected designer not found');
        return;
      }

      // Create a mock product for the custom order
      const mockProduct = {
        _id: `custom-${Date.now()}`,
        name: productTypeName,
        images: filePreviewUrls.length > 0 ? filePreviewUrls : ['/api/placeholder/300/300'],
        designer: {
          _id: selectedDesignerInfo._id,
          name: selectedDesignerInfo.name
        },
        category: 'Custom Order',
        price: formData.budgetType === 'negotiate' ? 0 : (parseFloat(formData.budget) || 0),
        description: formData.description,
        customizable: true,
        inStock: true
      };

      // Prepare custom order data
      const selectedDeliveryOption = selectedDesignerDeliveryOptions?.[formData.deliveryType];
      const deliveryDays = selectedDeliveryOption?.days || 14;
      const deliveryDescription = selectedDeliveryOption?.description || 'Standard delivery';
      const deliveryTimePrice = selectedDeliveryOption?.price || 0;

      const customOrderData = {
        measurements: Object.entries(formData.measurements)
          .filter(([_, value]) => value)
          .reduce((acc, [key, value]) => ({ ...acc, [key]: String(value) }), {} as Record<string, string>),
        expectedDeliveryDate: '', // Will be calculated based on delivery type
        deliveryType: formData.deliveryType,
        deliveryTimePrice: deliveryTimePrice, // Include delivery time price
        collectionMethod: formData.collectionMethod,
        deliveryLocation: formData.collectionMethod === 'delivery' ? formData.location : '',
        designerShopAddress: formData.collectionMethod === 'pickup' ? (selectedDesignerDeliveryOptions?.shopAddress || '') : '',
        additionalNotes: `${formData.description}\n\nSpecial Requirements: ${formData.specialRequirements || 'None'}\nQuality: ${qualityOptions.find(q => q.value === formData.quality)?.label || 'Standard Quality'}\nDelivery: ${deliveryDescription} (${deliveryDays} days) - MWK ${deliveryTimePrice.toLocaleString()}\nCollection: ${formData.collectionMethod === 'delivery' ? 'Delivery to location' : 'Pickup at designer shop'}`,
        productType: productTypeName,
        estimatedPrice: formData.budgetType === 'negotiate' ? 0 : (parseFloat(formData.budget) || 0) // Base price - delivery time price is separate
      };

      // Add custom order to cart
      addCustomOrderToCart(mockProduct as any, customOrderData, formData.color);

      addToast('success', 'Custom order added to cart! Complete payment to send request to designer.');
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error submitting custom order:', error);
      addToast('error', 'Failed to submit custom order request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      designType: '',
      color: '',
      description: '',
      specialRequirements: '',
      selectedDesigner: '',
      quality: 'standard',
      budget: '',
      budgetType: 'input',
      timeline: '2weeks',
      deliveryType: 'standard',
      collectionMethod: 'delivery',
      location: '',
      measurements: {}
    });
    setFiles([]);
    setFilePreviewUrls([]);
    setSelectedCategory('');
    setSelectedProduct('');
    setHoveredCategory(null);
    setMeasurementErrors({});
    setMeasurementWarnings({});
    setDesignerSearchQuery('');
    setIsDesignerDropdownOpen(false);
    setSelectedDesignerDeliveryOptions(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-4 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-black px-6 py-2.5 border-b-2 border-yellow-400">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-yellow-400">
                Create Custom Order
              </h3>
              <button
                type="button"
                title="Close modal"
                onClick={onClose}
                className="text-yellow-400 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-6 max-h-[75vh] overflow-y-auto">
            {/* Product Reference */}
            {productReference && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Based on Product:</h4>
                <div className="flex items-center space-x-3">
                  <img 
                    src={productReference.image} 
                    alt={productReference.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{productReference.name}</p>
                    <p className="text-sm text-gray-500">MWK {productReference.price.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Product Category Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Product Category *
              </label>
              <div className="grid grid-cols-5 gap-2">
                {productCategories.map((category) => (
                  <div
                    key={category.id}
                    className="relative"
                    onMouseEnter={() => setHoveredCategory(category.id)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory(category.id);
                        setSelectedProduct('');
                        setFormData(prev => ({ ...prev, designType: '' }));
                      }}
                      className={`w-full p-3 border-2 rounded-lg text-xs font-medium transition-all duration-200 flex flex-col items-center space-y-1 ${
                        selectedCategory === category.id
                          ? 'border-yellow-400 bg-black text-yellow-400 shadow-lg transform scale-105'
                          : 'border-gray-300 hover:border-yellow-400 hover:bg-gray-50 hover:shadow-md'
                      }`}
                    >
                      <div className="text-lg">{category.icon}</div>
                      <span className="text-center leading-tight text-xs">{category.name}</span>
                      <ChevronDown className="h-3 w-3 opacity-60" />
                    </button>

                    {/* Dropdown Menu */}
                    {hoveredCategory === category.id && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                        {category.products.map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(category.id);
                              setSelectedProduct(product.id);
                              setFormData(prev => ({ ...prev, designType: product.id }));
                            }}
                            className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                              selectedProduct === product.id
                                ? 'bg-yellow-50 text-yellow-800 font-medium'
                                : 'text-gray-700'
                            }`}
                          >
                            {product.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Selected Product Display */}
              {selectedProduct && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">
                      Selected: {(() => {
                        for (const category of productCategories) {
                          const product = category.products.find(p => p.id === selectedProduct);
                          if (product) return product.name;
                        }
                        return selectedProduct;
                      })()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Measurements */}
            {selectedProduct && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <Ruler className="h-4 w-4 mr-2" />
                    Measurements (in inches)
                  </label>
                  {/* Measurement Guide Button */}
                  <button
                    type="button"
                    onClick={() => setShowMeasurementGuide(true)}
                    className="flex items-center px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                  >
                    <HelpCircle className="h-3 w-3 mr-1" />
                    Measurement Guide
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getMeasurementFields(selectedProduct).map(({ field, label, placeholder, required, helpText }) => {
                    const hasError = measurementErrors[field];
                    const hasWarning = measurementWarnings[field];

                    return (
                      <div key={field}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          {label}
                          {required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <input
                          type="text"
                          value={formData.measurements[field as keyof Measurements] || ''}
                          onChange={(e) => handleMeasurementChange(field, e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-sm ${
                            hasError
                              ? 'border-red-500 focus:ring-red-500'
                              : hasWarning
                              ? 'border-yellow-500 focus:ring-yellow-500'
                              : 'border-gray-300 focus:ring-yellow-400'
                          }`}
                          placeholder={placeholder}
                          required={required}
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
                          {helpText || getMeasurementInfo(field)}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  💡 Tip: Provide at least 3-4 key measurements for better fitting
                </p>
              </div>
            )}

            {/* Step 3: Color */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Color
              </label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="e.g., Navy Blue, Custom Pattern"
              />
            </div>

            {/* Step 3: Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description & Requirements *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                placeholder="Describe your custom order requirements..."
              />
            </div>

            {/* Step 4: Designer Selection */}
            <div className="mb-6">
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 mr-2" />
                Preferred Designer *
              </label>
              {loadingDesigners ? (
                <div className="text-center py-4">Loading designers...</div>
              ) : (
                <div className="relative designer-dropdown">
                  {/* Dropdown Button */}
                  <button
                    type="button"
                    onClick={() => setIsDesignerDropdownOpen(!isDesignerDropdownOpen)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 text-left bg-white flex items-center justify-between"
                  >
                    <span className="text-sm">
                      {formData.selectedDesigner ? (
                        (() => {
                          const selectedDesigner = designers.find(d => d._id === formData.selectedDesigner);
                          return selectedDesigner ? (
                            <div className="flex items-center space-x-2">
                              <span>{selectedDesigner.name}</span>
                              {(selectedDesigner as any).rating > 0 && (
                                <div className="flex items-center text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                  <Star className="h-3 w-3 mr-1 fill-current" />
                                  {((selectedDesigner as any).rating).toFixed(1)}
                                </div>
                              )}
                            </div>
                          ) : 'Select a designer';
                        })()
                      ) : (
                        'Select a designer'
                      )}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isDesignerDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isDesignerDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-64 overflow-hidden">
                      {/* Search Input */}
                      <div className="p-3 border-b border-gray-200">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search designers..."
                            value={designerSearchQuery}
                            onChange={(e) => setDesignerSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                          />
                        </div>
                      </div>

                      {/* Header Row */}
                      <div className="grid grid-cols-2 gap-4 px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-600">
                        <div>Designer Name</div>
                        <div className="text-center">Average Rating</div>
                      </div>

                      {/* Designer List */}
                      <div className="max-h-48 overflow-y-auto">
                        {filteredDesigners.length === 0 ? (
                          <div className="p-4 text-center text-gray-500 text-sm">
                            {designerSearchQuery ? 'No designers found matching your search' : 'No designers available'}
                          </div>
                        ) : (
                          filteredDesigners.map((designer) => (
                            <button
                              key={designer._id}
                              type="button"
                              onClick={async () => {
                                setFormData(prev => ({ ...prev, selectedDesigner: designer._id || '' }));
                                setIsDesignerDropdownOpen(false);

                                // Fetch designer's delivery options from their products
                                try {
                                  // For now, we'll use default delivery options with pricing
                                  // In a real implementation, you'd fetch this from the designer's profile or products
                                  setSelectedDesignerDeliveryOptions({
                                    standard: { enabled: true, days: 14, description: 'Standard delivery', price: 0 },
                                    express: { enabled: true, days: 7, description: 'Express delivery', price: 5000 },
                                    premium: { enabled: true, days: 3, description: 'Premium delivery', price: 15000 },
                                    shopAddress: (designer as any).businessAddress || 'Shop address will be provided'
                                  });

                                  // Reset delivery type when designer changes
                                  setFormData(prev => ({ ...prev, deliveryType: 'standard' }));
                                } catch (error) {
                                  console.error('Error fetching designer delivery options:', error);
                                }
                              }}
                              className={`w-full grid grid-cols-2 gap-4 px-4 py-3 text-left border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors ${
                                formData.selectedDesigner === designer._id
                                  ? 'bg-yellow-50 border-l-4 border-l-yellow-400'
                                  : ''
                              }`}
                            >
                              <div>
                                <div className="font-medium text-gray-900 text-sm">{designer.name}</div>
                                <div className="text-xs text-gray-600">
                                  {designer.businessName && `${designer.businessName} • `}
                                  {designer.specialty || 'General Fashion'}
                                </div>
                              </div>
                              <div className="text-center">
                                {(designer as any).rating > 0 ? (
                                  <div className="flex items-center justify-center">
                                    <div className="flex items-center text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                      <Star className="h-3 w-3 mr-1 fill-current" />
                                      {((designer as any).rating).toFixed(1)}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400">No rating</span>
                                )}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 5: Quality Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quality Level *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {qualityOptions.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => setFormData(prev => ({ ...prev, quality: option.value }))}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.quality === option.value
                        ? 'border-yellow-400 bg-yellow-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{option.label}</h4>
                        <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        formData.quality === option.value
                          ? 'border-yellow-400 bg-yellow-400'
                          : 'border-gray-300'
                      }`}>
                        {formData.quality === option.value && (
                          <div className="w-full h-full rounded-full bg-yellow-400"></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 6: Budget, Timeline & Location */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget (MWK)
                </label>
                <div className="space-y-3">
                  {/* Budget Type Selection */}
                  <div className="flex space-x-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="budgetType"
                        value="input"
                        checked={formData.budgetType === 'input'}
                        onChange={(e) => setFormData(prev => ({ ...prev, budgetType: e.target.value }))}
                        className="mr-2 text-yellow-400 focus:ring-yellow-400"
                      />
                      <span className="text-sm text-gray-700">Set Budget</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="budgetType"
                        value="negotiate"
                        checked={formData.budgetType === 'negotiate'}
                        onChange={(e) => setFormData(prev => ({ ...prev, budgetType: e.target.value }))}
                        className="mr-2 text-yellow-400 focus:ring-yellow-400"
                      />
                      <span className="text-sm text-gray-700">To Negotiate</span>
                    </label>
                  </div>

                  {/* Budget Input Field */}
                  {formData.budgetType === 'input' && (
                    <input
                      type="text"
                      value={formData.budget}
                      onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      placeholder="e.g., 50,000 - 100,000"
                    />
                  )}

                  {/* Negotiate Message */}
                  {formData.budgetType === 'negotiate' && (
                    <div className="p-2 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-600">
                        💬 Budget will be discussed with the designer
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Type
                </label>
                <select
                  title="Select delivery type"
                  value={formData.deliveryType}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliveryType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  disabled={!formData.selectedDesigner}
                >
                  <option value="">
                    {!formData.selectedDesigner ? 'Select a designer first' : 'Choose delivery type'}
                  </option>
                  {formData.selectedDesigner && selectedDesignerDeliveryOptions && (
                    <>
                      {selectedDesignerDeliveryOptions.standard?.enabled && (
                        <option value="standard">
                          Standard ({selectedDesignerDeliveryOptions.standard.days} days) - MWK {selectedDesignerDeliveryOptions.standard.price?.toLocaleString() || '0'}
                        </option>
                      )}
                      {selectedDesignerDeliveryOptions.express?.enabled && (
                        <option value="express">
                          Express ({selectedDesignerDeliveryOptions.express.days} days) - MWK {selectedDesignerDeliveryOptions.express.price?.toLocaleString() || '0'}
                        </option>
                      )}
                      {selectedDesignerDeliveryOptions.premium?.enabled && (
                        <option value="premium">
                          Premium ({selectedDesignerDeliveryOptions.premium.days} days) - MWK {selectedDesignerDeliveryOptions.premium.price?.toLocaleString() || '0'}
                        </option>
                      )}
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Collection Method
                </label>
                <div className="space-y-2">
                  <label className="flex items-center p-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="collectionMethod"
                      value="delivery"
                      checked={formData.collectionMethod === 'delivery'}
                      onChange={(e) => setFormData(prev => ({ ...prev, collectionMethod: e.target.value }))}
                      className="mr-2"
                    />
                    <div className="text-sm">
                      <div className="font-medium">Delivery</div>
                      <div className="text-gray-500">Have it delivered to your location</div>
                    </div>
                  </label>
                  <label className="flex items-center p-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="collectionMethod"
                      value="pickup"
                      checked={formData.collectionMethod === 'pickup'}
                      onChange={(e) => setFormData(prev => ({ ...prev, collectionMethod: e.target.value }))}
                      className="mr-2"
                    />
                    <div className="text-sm">
                      <div className="font-medium">Pickup at Designer Shop</div>
                      <div className="text-gray-500">Collect from the designer's location</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Step 7: Location Details */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.collectionMethod === 'delivery' ? 'Delivery Location' : 'Designer Shop Address'}
              </label>
              {formData.collectionMethod === 'delivery' ? (
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="e.g., Lilongwe, Area 10"
                  required
                />
              ) : (
                <div className="p-3 bg-gray-50 border border-gray-300 rounded-md">
                  <div className="text-sm text-gray-600">
                    {formData.selectedDesigner ? (
                      selectedDesignerDeliveryOptions?.shopAddress || 'Designer shop address will be provided after confirmation'
                    ) : (
                      'Select a designer to see shop address'
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Step 7: Reference Images */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference Images
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-yellow-400 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload-modal"
                />
                <label htmlFor="file-upload-modal" className="cursor-pointer">
                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    Click to upload reference images (max 5)
                  </p>
                </label>
              </div>

              {/* Image previews */}
              {filePreviewUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {filePreviewUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        title="Remove image"
                        onClick={() => removeFile(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-100 px-6 py-4 flex justify-end space-x-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 bg-black text-yellow-400 rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50 border border-yellow-400 transition-colors"
            >
              {isSubmitting ? 'Adding to Cart...' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>

      {/* Measurement Guide Modal */}
      <MeasurementGuide
        isOpen={showMeasurementGuide}
        onClose={() => setShowMeasurementGuide(false)}
        guideImage={productReference?.product?.measurementConfig?.guideImage}
        productName={productReference?.name || (() => {
          if (selectedProduct) {
            for (const category of productCategories) {
              const product = category.products.find(p => p.id === selectedProduct);
              if (product) return product.name;
            }
          }
          return 'Selected Product';
        })()}
        measurements={selectedProduct ? getMeasurementFields(selectedProduct).map(field => ({
          field: field.field,
          label: field.label,
          helpText: field.helpText,
          required: field.required
        })) : []}
      />
    </div>
  );
};

export default CustomOrderModal;
