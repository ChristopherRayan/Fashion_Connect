import React from 'react';
import { 
  XCircle, 
  User, 
  Calendar, 
  DollarSign, 
  Package, 
  Tag,
  MapPin,
  AlertCircle,
  Eye,
  Flag
} from 'lucide-react';
import { getFirstProductImageUrl } from '../../utils/productImageUtils';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  subcategory?: string;
  sizes?: string[];
  colors?: string[];
  customizable: boolean;
  status: 'ACTIVE' | 'PENDING' | 'FLAGGED' | 'SUSPENDED';
  designer: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  moderationReason?: string;
}

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, isOpen, onClose }) => {
  if (!isOpen || !product) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FLAGGED':
        return 'bg-red-100 text-red-800';
      case 'SUSPENDED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-start justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Product Details
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mt-6 space-y-6">
              {/* Product Header */}
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0">
                  <img
                    className="h-32 w-32 rounded-lg object-cover"
                    src={getFirstProductImageUrl(product.images)}
                    alt={product.name}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">{product.name}</h2>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(product.status)}`}>
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {product.status}
                    </span>
                  </div>
                  <p className="mt-2 text-lg font-semibold text-green-600">{formatPrice(product.price)}</p>
                  <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {product.designer.name}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(product.createdAt)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Product Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Tag className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{product.category}</p>
                      <p className="text-sm text-gray-500">Category</p>
                    </div>
                  </div>
                  {product.subcategory && (
                    <div className="flex items-center space-x-3">
                      <Package className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{product.subcategory}</p>
                        <p className="text-sm text-gray-500">Subcategory</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{formatPrice(product.price)}</p>
                      <p className="text-sm text-gray-500">Price</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{product.customizable ? 'Yes' : 'No'}</p>
                      <p className="text-sm text-gray-500">Customizable</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-md font-semibold text-gray-900 mb-2">Description</h4>
                <p className="text-sm text-gray-700">{product.description}</p>
              </div>

              {/* Product Options */}
              {(product.sizes || product.colors) && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Available Options</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {product.sizes && product.sizes.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-2">Sizes</p>
                        <div className="flex flex-wrap gap-2">
                          {product.sizes.map((size, index) => (
                            <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {size}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {product.colors && product.colors.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-900 mb-2">Colors</p>
                        <div className="flex flex-wrap gap-2">
                          {product.colors.map((color, index) => (
                            <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {color}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Designer Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Designer Information</h4>
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {product.designer.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{product.designer.name}</p>
                    <p className="text-sm text-gray-500">{product.designer.email}</p>
                  </div>
                </div>
              </div>

              {/* Product Images */}
              {product.images && product.images.length > 1 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Product Images</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {product.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          className="h-24 w-24 rounded-lg object-cover cursor-pointer hover:opacity-75"
                          src={image}
                          alt={`${product.name} ${index + 1}`}
                          onClick={() => window.open(image, '_blank')}
                        />
                        <button
                          onClick={() => window.open(image, '_blank')}
                          className="absolute top-1 right-1 p-1 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-75"
                        >
                          <Eye className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Moderation Information */}
              {product.moderationReason && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Flag className="h-5 w-5 text-red-600" />
                    <h4 className="text-md font-semibold text-red-900">Moderation Note</h4>
                  </div>
                  <p className="text-sm text-red-700">{product.moderationReason}</p>
                </div>
              )}

              {/* Timestamps */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Timeline</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{formatDate(product.createdAt)}</p>
                      <p className="text-sm text-gray-500">Created</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{formatDate(product.updatedAt)}</p>
                      <p className="text-sm text-gray-500">Last Updated</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;
