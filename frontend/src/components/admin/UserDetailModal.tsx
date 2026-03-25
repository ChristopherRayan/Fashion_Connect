import React, { useState } from 'react';
import {
  XCircle,

  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  AlertCircle,
  Building,
  FileText,
  Eye,
  Download,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { AdminUser } from '../../services/adminService';

interface UserDetailModalProps {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ImagePreviewModalProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ imageUrl, isOpen, onClose, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="relative max-w-4xl max-h-full p-4">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
        <div className="bg-white rounded-lg overflow-hidden">
          <div className="bg-gray-900 text-white px-4 py-2">
            <h3 className="text-lg font-medium">{title}</h3>
          </div>
          <div className="p-4">
            <img
              src={imageUrl}
              alt={title}
              className="max-w-full max-h-[70vh] object-contain mx-auto"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder-image.png';
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const UserDetailModal: React.FC<UserDetailModalProps> = ({ user, isOpen, onClose }) => {
  const [imagePreview, setImagePreview] = useState<{ url: string; title: string } | null>(null);

  if (!isOpen || !user) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'PENDING_VERIFICATION':
        return 'bg-yellow-100 text-yellow-800';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800';
      case 'DESIGNER':
        return 'bg-blue-100 text-blue-800';
      case 'CLIENT':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity bg-black bg-opacity-75" onClick={onClose} />

          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full border-2 border-gray-800">
            {/* Header */}
            <div className="bg-gray-900 px-6 py-4 border-b-2 border-yellow-400">
              <div className="flex items-start justify-between">
                <h3 className="text-xl leading-6 font-semibold text-white">
                  User Details
                </h3>
                <button
                  onClick={onClose}
                  className="text-gray-300 hover:text-yellow-400 transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mt-6 space-y-6">
              {/* User Header */}
              <div className="flex items-center space-x-4">
                <div className="h-20 w-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                      <Shield className="w-3 h-3 mr-1" />
                      {user.role}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(user.status)}`}>
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {user.status === 'ACTIVE' ? 'Active' :
                       user.status === 'PENDING_VERIFICATION' ? 'Pending Verification' :
                       'Suspended'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Personal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.email}</p>
                      <p className="text-sm text-gray-500">Email Address</p>
                    </div>
                  </div>
                  {user.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.phone}</p>
                        <p className="text-sm text-gray-500">Phone Number</p>
                      </div>
                    </div>
                  )}
                  {user.location && (
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.location}</p>
                        <p className="text-sm text-gray-500">Location</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{formatDate(user.createdAt)}</p>
                      <p className="text-sm text-gray-500">Registration Date</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Information (for designers) */}
              {user.role === 'DESIGNER' && (user.businessName || user.specialty) && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Business Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {user.businessName && (
                      <div className="flex items-center space-x-3">
                        <Building className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.businessName}</p>
                          <p className="text-sm text-gray-500">Business Name</p>
                        </div>
                      </div>
                    )}
                    {user.specialty && (
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.specialty}</p>
                          <p className="text-sm text-gray-500">Specialty</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {user.bio && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-900 mb-2">Business Description</p>
                      <p className="text-sm text-gray-700">{user.bio}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Documents Section (for designers) */}
              {user.role === 'DESIGNER' && (
                <div className="bg-gray-100 p-6 rounded-lg border-2 border-gray-300">
                  <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-yellow-600" />
                    Uploaded Documents
                  </h4>
                  {user.documents && Object.keys(user.documents).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Object.entries(user.documents).map(([key, value]) => {
                        // Skip empty, null, or undefined values
                        if (!value || value === '' || value === null || value === undefined) return null;

                        const documentUrl = `http://localhost:8000${value}`;
                        const isImage = typeof value === 'string' && (
                          value.includes('.jpg') || value.includes('.jpeg') ||
                          value.includes('.png') || value.includes('.gif') ||
                          value.includes('.webp')
                        );
                        const documentName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

                        return (
                          <div key={key} className="bg-white rounded-lg border-2 border-gray-800 p-4 hover:shadow-lg transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                {isImage ? (
                                  <ImageIcon className="h-6 w-6 text-yellow-600" />
                                ) : (
                                  <FileText className="h-6 w-6 text-gray-600" />
                                )}
                                <div>
                                  <p className="text-sm font-semibold text-gray-900">{documentName}</p>
                                  <p className="text-xs text-gray-500">
                                    {isImage ? 'Image Document' : 'Document'}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Image Preview */}
                            {isImage && (
                              <div className="mb-4">
                                <img
                                  src={documentUrl}
                                  alt={documentName}
                                  className="w-full h-32 object-cover rounded-lg border border-gray-300 cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => setImagePreview({ url: documentUrl, title: documentName })}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  if (isImage) {
                                    setImagePreview({ url: documentUrl, title: documentName });
                                  } else {
                                    window.open(documentUrl, '_blank');
                                  }
                                }}
                                className="flex-1 inline-flex items-center justify-center px-3 py-2 border-2 border-yellow-400 text-sm font-medium rounded-lg text-gray-900 bg-yellow-100 hover:bg-yellow-200 transition-colors"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                {isImage ? 'Preview' : 'View'}
                              </button>
                              <button
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = documentUrl;
                                  link.download = `${user.name}_${key}`;
                                  link.click();
                                }}
                                className="flex-1 inline-flex items-center justify-center px-3 py-2 border-2 border-gray-800 text-sm font-medium rounded-lg text-white bg-gray-800 hover:bg-gray-700 transition-colors"
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                      <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No documents uploaded</h3>
                      <p className="text-sm text-gray-500">
                        This user hasn't uploaded any documents yet.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Account Status Information */}
              <div className="bg-gray-100 p-6 rounded-lg border-2 border-gray-300">
                <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-yellow-600" />
                  Account Status
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-800">
                    <div className="flex items-center space-x-3">
                      <AlertCircle className="h-6 w-6 text-yellow-600" />
                      <div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border-2 ${
                          user.status === 'ACTIVE' ? 'bg-green-100 text-green-800 border-green-300' :
                          user.status === 'PENDING_VERIFICATION' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                          'bg-red-100 text-red-800 border-red-300'
                        }`}>
                          {user.status === 'ACTIVE' ? 'Active' :
                           user.status === 'PENDING_VERIFICATION' ? 'Pending Verification' :
                           'Suspended'}
                        </span>
                        <p className="text-sm text-gray-500 mt-2">Current Status</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-800">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-6 w-6 text-yellow-600" />
                      <div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border-2 ${
                          user.role === 'DESIGNER' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                          user.role === 'ADMIN' ? 'bg-gray-800 text-white border-gray-800' :
                          'bg-gray-100 text-gray-800 border-gray-300'
                        }`}>
                          {user.role}
                        </span>
                        <p className="text-sm text-gray-500 mt-2">User Role</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rejection Reason */}
              {user.rejectionReason && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h4 className="text-md font-semibold text-red-900 mb-2">Rejection Reason</h4>
                  <p className="text-sm text-red-700">{user.rejectionReason}</p>
                </div>
              )}
            </div>
          </div>
          
            {/* Footer */}
            <div className="bg-gray-900 px-6 py-4 border-t-2 border-yellow-400">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex items-center px-6 py-2 border-2 border-yellow-400 text-sm font-medium rounded-lg text-yellow-400 bg-transparent hover:bg-yellow-400 hover:text-gray-900 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {imagePreview && (
        <ImagePreviewModal
          imageUrl={imagePreview.url}
          title={imagePreview.title}
          isOpen={!!imagePreview}
          onClose={() => setImagePreview(null)}
        />
      )}
    </>
  );
};

export default UserDetailModal;
