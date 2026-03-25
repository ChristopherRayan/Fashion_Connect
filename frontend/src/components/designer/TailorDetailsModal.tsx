import React from 'react';
import { X, Mail, Phone, Calendar, MapPin, Award, Clock, Package, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';
import { getImageUrl, isValidImagePath } from '../../utils/imageUtils';
import { messageService } from '../../services/messageService';

interface TailorDetails {
  _id: string;
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  verified: boolean;
  emailVerified: boolean;
  emailVerifiedAt?: string;
  profileImage?: string;
  address?: {
    street?: string;
    city?: string;
    country?: string;
    zipCode?: string;
  };
  specialties?: string[];
  experience?: string;
  designerId: string;
  createdAt: string;
  updatedAt: string;
  orderStats: {
    total: number;
    processing: number;
    completed: number;
    pending: number;
  };
  recentOrders: Array<{
    _id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    user: {
      name: string;
      email: string;
    };
    designer: {
      name: string;
      businessName?: string;
    };
  }>;
}

interface TailorDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tailor: TailorDetails | null;
}

const TailorDetailsModal: React.FC<TailorDetailsModalProps> = ({ isOpen, onClose, tailor }) => {
  if (!isOpen || !tailor) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'DEACTIVATED':
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800';
      case 'PENDING_VERIFICATION':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'tailor_completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'assigned_to_tailor':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatAddress = (address: any) => {
    if (!address) return 'Not provided';
    const parts = [address.street, address.city, address.country, address.zipCode].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Not provided';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
                  {tailor.profileImage ? (
                    <img
                      src={getImageUrl(tailor.profileImage)}
                      alt={tailor.name}
                      className="h-12 w-12 rounded-full object-cover"
                      onError={(e) => {
                        console.warn('🖼️ Failed to load tailor profile image in modal:', getImageUrl(tailor.profileImage));
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) {
                          fallback.classList.remove('hidden');
                        }
                      }}
                    />
                  ) : null}
                  <Award className={`h-6 w-6 text-indigo-600 ${
                    tailor.profileImage ? 'hidden' : ''
                  }`} />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">{tailor.name}</h3>
                  <div className="flex items-center mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(tailor.status)}`}>
                      {tailor.status === 'ACTIVE' ? 'Active' : tailor.status === 'DEACTIVATED' ? 'Deactivated' : tailor.status}
                    </span>
                    {tailor.verified && (
                      <CheckCircle className="ml-2 h-4 w-4 text-green-500" />
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Personal Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">{tailor.email}</span>
                    {tailor.emailVerified && (
                      <CheckCircle className="ml-2 h-3 w-3 text-green-500" />
                    )}
                  </div>
                  {tailor.phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">{tailor.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">{formatAddress(tailor.address)}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-600">
                      Joined {new Date(tailor.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {tailor.emailVerifiedAt && (
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">
                        Email verified {new Date(tailor.emailVerifiedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Professional Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Professional Information</h4>
                <div className="space-y-3">
                  {tailor.experience && (
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Experience: {tailor.experience}</span>
                    </div>
                  )}
                  {tailor.specialties && tailor.specialties.length > 0 && (
                    <div>
                      <div className="flex items-center mb-2">
                        <Award className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-600">Specialties:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {tailor.specialties.map((specialty, index) => (
                          <span
                            key={`${specialty}-${index}`}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* Actions */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={async () => {
                    try {
                      const receiverId = (tailor.id || tailor._id) as string;
                      if (!receiverId) return;
                      // Send initial message; backend will create conversation if not exists
                      await messageService.sendMessage('', {
                        receiverId,
                        content: `Hello ${tailor.name}!`
                      });
                      // Navigate to messages view
                      window.location.href = '/designer/messages';
                    } catch (e) {
                      console.error('Failed to start chat:', e);
                    }
                  }}
                  className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  title="Message Tailor"
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Message
                </button>
              </div>
            </div>

            {/* Order Statistics */}
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Order Statistics</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{tailor.orderStats.total}</div>
                  <div className="text-xs text-gray-500">Total Orders</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{tailor.orderStats.pending}</div>
                  <div className="text-xs text-gray-500">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{tailor.orderStats.processing}</div>
                  <div className="text-xs text-gray-500">Processing</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{tailor.orderStats.completed}</div>
                  <div className="text-xs text-gray-500">Completed</div>
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            {tailor.recentOrders && tailor.recentOrders.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Orders</h4>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="max-h-64 overflow-y-auto">
                    {tailor.recentOrders.map((order, idx) => (
                      <div key={order._id || idx} className="px-4 py-3 border-b border-gray-200 last:border-b-0">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <Package className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-sm font-medium text-gray-900">
                                #{order.orderNumber}
                              </span>
                              <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                                {order.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              Customer: {order.user.name} • ${order.totalAmount}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TailorDetailsModal;