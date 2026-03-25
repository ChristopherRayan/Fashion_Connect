import React, { useState, useEffect, useCallback } from 'react';
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
  Clock
} from 'lucide-react';
import { adminService, AdminUser } from '../../services/adminService';
import { useNotification } from '../../contexts/NotificationContext';
import LoadingSpinner from '../common/LoadingSpinner';

interface DesignerVerificationProps {
  onVerificationUpdate?: () => void;
}

const DesignerVerification: React.FC<DesignerVerificationProps> = ({
  onVerificationUpdate
}) => {
  const [pendingDesigners, setPendingDesigners] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedDesigner, setSelectedDesigner] = useState<AdminUser | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const { addToast } = useNotification();

  const fetchPendingDesigners = useCallback(async () => {
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
  }, [addToast]);

  useEffect(() => {
    fetchPendingDesigners();
  }, [fetchPendingDesigners]);

  const handleApprove = async (designerId: string) => {
    try {
      setActionLoading(designerId);
      await adminService.approveDesigner(designerId);
      
      // Remove from pending list
      setPendingDesigners(prev => prev.filter(d => d._id !== designerId));
      
      addToast('success', 'Designer approved successfully');
      onVerificationUpdate?.();
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
      onVerificationUpdate?.();
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
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Designer Verification</h2>
          <p className="text-gray-600 mt-1">
            Review and approve pending designer applications
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-yellow-50 px-4 py-2 rounded-lg">
          <Clock className="h-5 w-5 text-yellow-600" />
          <span className="text-yellow-800 font-medium">
            {pendingDesigners.length} Pending
          </span>
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
                        <p className="text-sm text-gray-500 flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          Applied {formatDate(designer.createdAt)}
                        </p>
                      </div>
                      
                      {designer.specialty && (
                        <div className="mt-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {designer.specialty}
                          </span>
                        </div>
                      )}
                      
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
                      onClick={() => {/* TODO: View documents */}}
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
                        <LoadingSpinner size="sm" />
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
                    <LoadingSpinner size="sm" />
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
  );
};

export default DesignerVerification;
