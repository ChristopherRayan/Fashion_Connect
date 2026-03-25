import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  Eye,
  Download,
  User,
  MapPin,
  Calendar,
  FileText,
  AlertCircle,
  Clock,
  RefreshCw,
  Building,
  Phone,
  Mail,
  Globe,
  Award,
  Briefcase
} from 'lucide-react';
import { adminService, AdminUser } from '../../services/adminService';
import { useNotification } from '../../contexts/NotificationContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { UserStatus } from '../../types';

interface DocumentViewModalProps {
  designer: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
}

const DocumentViewModal: React.FC<DocumentViewModalProps> = ({ designer, isOpen, onClose }) => {
  if (!isOpen || !designer) return null;

  // Debug logging
  console.log('👤 Designer data for verification:', designer);
  console.log('📄 Documents available:', designer.documents);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-start justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Designer Registration Details
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mt-6 space-y-6">
              {/* Personal Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Personal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{designer.name}</p>
                      <p className="text-sm text-gray-500">Full Name</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{designer.email}</p>
                      <p className="text-sm text-gray-500">Email Address</p>
                    </div>
                  </div>
                  {designer.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{designer.phone}</p>
                        <p className="text-sm text-gray-500">Phone Number</p>
                      </div>
                    </div>
                  )}
                  {designer.location && (
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{designer.location}</p>
                        <p className="text-sm text-gray-500">Location</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Business Information */}
              {(designer.businessName || designer.specialty) && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Business Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {designer.businessName && (
                      <div className="flex items-center space-x-3">
                        <Building className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{designer.businessName}</p>
                          <p className="text-sm text-gray-500">Business Name</p>
                        </div>
                      </div>
                    )}
                    {designer.specialty && (
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{designer.specialty}</p>
                          <p className="text-sm text-gray-500">Specialty</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {designer.bio && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-900 mb-2">Business Description</p>
                      <p className="text-sm text-gray-700">{designer.bio}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Professional Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Professional Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(designer as any).experience && (
                    <div className="flex items-center space-x-3">
                      <Award className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{(designer as any).experience}</p>
                        <p className="text-sm text-gray-500">Years of Experience</p>
                      </div>
                    </div>
                  )}
                  {(designer as any).businessWebsite && (
                    <div className="flex items-center space-x-3">
                      <Globe className="h-5 w-5 text-gray-400" />
                      <div>
                        <a
                          href={(designer as any).businessWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          {(designer as any).businessWebsite}
                        </a>
                        <p className="text-sm text-gray-500">Portfolio/Website</p>
                      </div>
                    </div>
                  )}
                  {designer.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{designer.phone}</p>
                        <p className="text-sm text-gray-500">Phone Number</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    <Briefcase className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Fashion Designer</p>
                      <p className="text-sm text-gray-500">Role</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Registration Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Registration Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(designer.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <p className="text-sm text-gray-500">Registration Date</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-5 w-5 text-gray-400" />
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        designer.status === UserStatus.ACTIVE ? 'bg-green-100 text-green-800' :
                        designer.status === UserStatus.PENDING_VERIFICATION ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {designer.status === UserStatus.ACTIVE ? 'Active' :
                         designer.status === UserStatus.PENDING_VERIFICATION ? 'Pending Verification' :
                         'Suspended'}
                      </span>
                      <p className="text-sm text-gray-500 mt-1">Current Status</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documents Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-md font-semibold text-gray-900 mb-4">Uploaded Documents</h4>
                {/* Debug: Show raw documents data */}
                {import.meta.env.DEV && (
                  <div className="mb-4 p-2 bg-yellow-100 rounded text-xs">
                    <strong>Debug - Documents:</strong> {JSON.stringify(designer.documents, null, 2)}
                  </div>
                )}
                {designer.documents && Object.keys(designer.documents).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(designer.documents)
                      .filter(([, value]) => value && value !== '' && value !== null && value !== undefined)
                      .map(([key, value]) => {

                      console.log(`📄 Processing document: ${key} = ${value}`);
                      const documentUrl = `http://localhost:8000${value}`;
                      const isImage = typeof value === 'string' && (value.includes('.jpg') || value.includes('.jpeg') || value.includes('.png') || value.includes('.gif') || value.includes('.webp'));
                      const isPDF = typeof value === 'string' && value.includes('.pdf');

                      return (
                        <div key={key} className="bg-white rounded-lg border p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <FileText className="h-5 w-5 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {isImage ? 'Image Document' : isPDF ? 'PDF Document' : 'Document'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => window.open(documentUrl, '_blank')}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View Full
                              </button>
                              <button
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = documentUrl;
                                  link.download = `${designer.name}_${key}`;
                                  link.click();
                                }}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </button>
                            </div>
                          </div>

                          {/* Document Preview */}
                          <div className="mt-3">
                            {isImage ? (
                              <div className="border rounded-lg overflow-hidden bg-gray-100">
                                <img
                                  src={documentUrl}
                                  alt={`${key} document`}
                                  className="w-full h-48 object-contain"
                                  onLoad={() => {
                                    console.log(`✅ Image loaded successfully: ${documentUrl}`);
                                  }}
                                  onError={(e) => {
                                    console.error(`❌ Failed to load image: ${documentUrl}`);
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const errorDiv = target.nextElementSibling as HTMLElement;
                                    if (errorDiv) {
                                      errorDiv.classList.remove('hidden');
                                    }
                                  }}
                                />
                                <div className="hidden p-4 text-center text-red-500">
                                  <FileText className="mx-auto h-8 w-8 mb-2" />
                                  <p className="text-sm font-medium">Unable to preview image</p>
                                  <p className="text-xs text-gray-500 mt-1">URL: {documentUrl}</p>
                                  <p className="text-xs text-gray-400 mt-1">Click "View Full" to try opening in new tab</p>
                                </div>
                              </div>
                            ) : isPDF ? (
                              <div className="border rounded-lg p-4 bg-gray-100 text-center">
                                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                                <p className="text-sm text-gray-600">PDF Document</p>
                                <p className="text-xs text-gray-500 mt-1">Click "View Full" to open in new tab</p>
                              </div>
                            ) : (
                              <div className="border rounded-lg p-4 bg-gray-100 text-center">
                                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                                <p className="text-sm text-gray-600">Document File</p>
                                <p className="text-xs text-gray-500 mt-1">Click "View Full" to open</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No documents uploaded</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      This designer hasn't uploaded any verification documents yet.
                    </p>
                    {designer.documents && (
                      <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-xs text-yellow-800 font-medium">Debug Information:</p>
                        <p className="text-xs text-yellow-700 mt-1">
                          Documents object: {JSON.stringify(designer.documents, null, 2)}
                        </p>
                        <p className="text-xs text-yellow-600 mt-1">
                          Available fields: {Object.keys(designer.documents).join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Rejection Reason */}
              {designer.rejectionReason && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h4 className="text-md font-semibold text-red-900 mb-2">Rejection Reason</h4>
                  <p className="text-sm text-red-700">{designer.rejectionReason}</p>
                </div>
              )}
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

const DesignerVerification = () => {
  const [pendingDesigners, setPendingDesigners] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedDesigner, setSelectedDesigner] = useState<AdminUser | null>(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const { addToast } = useNotification();

  useEffect(() => {
    fetchPendingDesigners();
  }, []);

  const fetchPendingDesigners = async () => {
    try {
      setLoading(true);
      const designers = await adminService.getPendingDesigners();
      setPendingDesigners(designers);
    } catch (error) {
      console.error('Error fetching pending designers:', error);
      addToast('error', 'Failed to load pending designers');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (designerId: string) => {
    try {
      setActionLoading(designerId);
      await adminService.approveDesigner(designerId);
      
      // Remove from pending list
      setPendingDesigners(prev => prev.filter(d => d._id !== designerId));
      
      addToast('success', 'Designer approved successfully');
    } catch (error) {
      console.error('Error approving designer:', error);
      addToast('error', 'Failed to approve designer');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!selectedDesigner || !rejectionReason.trim()) {
      addToast('error', 'Please provide a rejection reason');
      return;
    }

    try {
      setActionLoading(selectedDesigner._id!);
      await adminService.rejectDesigner(selectedDesigner._id!, rejectionReason);
      
      // Remove from pending list
      setPendingDesigners(prev => prev.filter(d => d._id !== selectedDesigner._id));
      
      addToast('success', 'Designer rejected successfully');
      setShowRejectModal(false);
      setSelectedDesigner(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting designer:', error);
      addToast('error', 'Failed to reject designer');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Designer Verification</h1>
              <p className="mt-2 text-gray-600">
                Review and approve pending designer applications
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-yellow-50 px-4 py-2 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
                <span className="text-yellow-800 font-medium">
                  {pendingDesigners.length} Pending
                </span>
              </div>
              <button
                onClick={fetchPendingDesigners}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Pending Designers List */}
        {pendingDesigners.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              All caught up!
            </h3>
            <p className="mt-2 text-gray-500">
              No pending designer verifications at the moment.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {pendingDesigners.map((designer) => (
              <div
                key={designer._id}
                className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    {/* Designer Info */}
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                          {designer.name.charAt(0)}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {designer.name}
                          </h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Pending Verification
                          </span>
                        </div>

                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-600 flex items-center">
                            <User className="h-4 w-4 mr-2" />
                            {designer.email}
                          </p>
                          {designer.businessName && (
                            <p className="text-sm text-gray-600 flex items-center">
                              <FileText className="h-4 w-4 mr-2" />
                              {designer.businessName}
                            </p>
                          )}
                          {designer.location && (
                            <p className="text-sm text-gray-600 flex items-center">
                              <MapPin className="h-4 w-4 mr-2" />
                              {designer.location}
                            </p>
                          )}
                          {designer.phone && (
                            <p className="text-sm text-gray-600 flex items-center">
                              <Phone className="h-4 w-4 mr-2" />
                              {designer.phone}
                            </p>
                          )}
                          {(designer as any).experience && (
                            <p className="text-sm text-gray-600 flex items-center">
                              <Award className="h-4 w-4 mr-2" />
                              {(designer as any).experience} experience
                            </p>
                          )}
                          <p className="text-sm text-gray-500 flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            Applied {formatDate(designer.createdAt)}
                          </p>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {designer.specialty && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {designer.specialty}
                            </span>
                          )}
                          {(designer as any).businessWebsite && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Globe className="h-3 w-3 mr-1" />
                              Portfolio
                            </span>
                          )}
                        </div>

                        {designer.bio && (
                          <div className="mt-3">
                            <p className="text-sm text-gray-700 line-clamp-2">
                              {designer.bio}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => {
                          setSelectedDesigner(designer);
                          setShowDocumentModal(true);
                        }}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Documents
                      </button>

                      <button
                        onClick={() => handleApprove(designer._id!)}
                        disabled={actionLoading === designer._id}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                      >
                        {actionLoading === designer._id ? (
                          <LoadingSpinner size="small" />
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          setSelectedDesigner(designer);
                          setShowRejectModal(true);
                        }}
                        disabled={actionLoading === designer._id}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Document View Modal */}
        <DocumentViewModal
          designer={selectedDesigner}
          isOpen={showDocumentModal}
          onClose={() => {
            setShowDocumentModal(false);
            setSelectedDesigner(null);
          }}
        />

        {/* Reject Modal */}
        {showRejectModal && selectedDesigner && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" />

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <XCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Reject Designer Application
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Are you sure you want to reject {selectedDesigner.name}'s application?
                          Please provide a reason for rejection.
                        </p>
                      </div>
                      <div className="mt-4">
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Enter rejection reason..."
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={!rejectionReason.trim() || actionLoading === selectedDesigner._id}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {actionLoading === selectedDesigner._id ? (
                      <LoadingSpinner size="small" />
                    ) : (
                      'Reject Application'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRejectModal(false);
                      setSelectedDesigner(null);
                      setRejectionReason('');
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DesignerVerification;
