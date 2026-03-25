import React, { useState, useEffect } from 'react';
import {
  Plus,
  Users,
  Scissors,
  Mail,
  Phone,
  Calendar,
  Package,
  CheckCircle,
  Clock,
  MoreVertical,
  UserPlus,
  X
} from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { tailorService } from '../../services/tailorService';
import { Tailor } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';
import TailorDetailsModal from './TailorDetailsModal';
import { getImageUrl, isValidImagePath, DEFAULT_PROFILE_IMAGE } from '../../utils/imageUtils';

interface CreateTailorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateTailorModal: React.FC<CreateTailorModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { addToast } = useNotification();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await tailorService.inviteTailor(formData);
      addToast('success', 'Tailor invitation sent successfully! They will receive an email to complete their account setup.');
      setFormData({ name: '', email: '', phone: '' });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error sending tailor invitation:', error);
      addToast('error', error instanceof Error ? error.message : 'Failed to send tailor invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Invite Tailor
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>How it works:</strong> The tailor will receive an email invitation to join your team. 
                They'll complete their account setup by creating a password and adding their details.
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  placeholder="Enter tailor's full name"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  placeholder="Enter tailor's email"
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  placeholder="Enter tailor's phone number"
                />
              </div>
            </form>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Sending Invitation...' : 'Send Invitation'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TailorManagement: React.FC = () => {
  const { addToast } = useNotification();
  const [tailors, setTailors] = useState<Tailor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTailor, setSelectedTailor] = useState<any>(null);

  useEffect(() => {
    fetchTailors();
  }, []);

  const fetchTailors = async () => {
    try {
      setLoading(true);
      const data = await tailorService.getDesignerTailors();
      
      // Transform the data to ensure proper image URLs
      const transformedData = data.map(tailor => ({
        ...tailor,
        profileImage: tailor.profileImage ? getImageUrl(tailor.profileImage) : null
      }));

      setTailors(transformedData);
    } catch (error) {
      console.error('Error fetching tailors:', error);
      addToast('error', 'Failed to load tailors');
    } finally {
      setLoading(false);
    }
  };

//

  const handleCreateSuccess = () => {
    fetchTailors();
  };

  const handleToggleStatus = async (tailorId: string, isCurrentlyActive: boolean) => {
    try {
      await tailorService.updateTailorStatus(tailorId, !isCurrentlyActive);
      addToast('success', `Tailor ${isCurrentlyActive ? 'deactivated' : 'activated'} successfully`);
      fetchTailors(); // Refresh the list
    } catch (error) {
      console.error('Error updating tailor status:', error);
      addToast('error', error instanceof Error ? error.message : 'Failed to update tailor status');
    }
  };

  const handleResendInvitation = async (tailorId: string) => {
    try {
      await tailorService.resendInvitation(tailorId);
      addToast('success', 'Invitation resent successfully');
      fetchTailors(); // Refresh the list to update expiry date
    } catch (error) {
      console.error('Error resending invitation:', error);
      addToast('error', error instanceof Error ? error.message : 'Failed to resend invitation');
    }
  };

  const handleViewDetails = async (tailorId: string) => {
    try {
      const tailorDetails = await tailorService.getTailorDetails(tailorId);
      setSelectedTailor(tailorDetails);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching tailor details:', error);
      addToast('error', error instanceof Error ? error.message : 'Failed to fetch tailor details');
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                My Tailors
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Invite tailors to join your team and manage their access
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Invite Tailor
            </button>
          </div>
        </div>

        {tailors.length === 0 ? (
          <div className="text-center py-12">
            <Scissors className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No tailors yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by inviting your first tailor to join your team.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Invite Your First Tailor
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {tailors.map((tailor) => (
              <div key={tailor.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {isValidImagePath(tailor.profileImage) ? (
                        <img
                          src={getImageUrl(tailor.profileImage)}
                          alt={tailor.name}
                          className="h-10 w-10 rounded-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            console.log('🖼️ Image load error for:', tailor.name, 'Path:', tailor.profileImage);
                            console.log('🖼️ Current src:', target.src);
                            
                            // Try direct backend URL as fallback
                            const directUrl = `http://localhost:8000${tailor.profileImage}`;
                            console.log('🖼️ Trying direct URL:', directUrl);
                            target.src = directUrl;
                            target.onerror = () => {
                              console.log('🖼️ Direct URL also failed for:', tailor.name);
                              // Final fallback to UI avatar
                              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(tailor.name)}&background=6366f1&color=fff`;
                            };
                          }}
                        />
                      ) : (
                        <img 
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(tailor.name)}&background=6366f1&color=fff`}
                          alt={tailor.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900">
                          {tailor.name}
                        </p>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          tailor.isPendingInvitation 
                            ? 'bg-yellow-100 text-yellow-800'
                            : tailor.accountStatus === 'ACTIVE' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {tailor.isPendingInvitation ? 'Pending Setup' : tailor.accountStatus === 'ACTIVE' ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Mail className="flex-shrink-0 mr-1.5 h-4 w-4" />
                        <span className="mr-4">{tailor.email}</span>
                        {tailor.phone && (
                          <>
                            <Phone className="flex-shrink-0 mr-1.5 h-4 w-4" />
                            <span className="mr-4">{tailor.phone}</span>
                          </>
                        )}
                        <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4" />
                        <span>Joined {new Date(tailor.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {tailor.orderStats && !tailor.isPendingInvitation && (
                      <>
                        <div className="text-center">
                          <div className="text-lg font-medium text-gray-900">
                            {tailor.orderStats.total}
                          </div>
                          <div className="text-xs text-gray-500">Total</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-medium text-yellow-600">
                            {tailor.orderStats.processing}
                          </div>
                          <div className="text-xs text-gray-500">Processing</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-medium text-green-600">
                            {tailor.orderStats.completed}
                          </div>
                          <div className="text-xs text-gray-500">Completed</div>
                        </div>
                      </>
                    )}
                    
                    {/* Action buttons */}
                    <div className="flex items-center space-x-2">
                      {tailor.isPendingInvitation ? (
                        <button
                          onClick={() => tailor.id && handleResendInvitation(tailor.id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                        >
                          Resend Invitation
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => tailor.id && handleViewDetails(tailor.id)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => tailor.id && handleToggleStatus(tailor.id, tailor.accountStatus === 'ACTIVE')}
                            className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md ${
                              tailor.accountStatus === 'ACTIVE'
                                ? 'text-red-700 bg-red-100 hover:bg-red-200'
                                : 'text-green-700 bg-green-100 hover:bg-green-200'
                            }`}
                          >
                            {tailor.accountStatus === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          </button>
                        </>
                      )}
                    </div>
                    
                    {/* Show expiry info for pending invitations */}
                    {tailor.isPendingInvitation && tailor.expiresAt && (
                      <div className="text-xs text-gray-500">
                        Expires: {new Date(tailor.expiresAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateTailorModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <TailorDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedTailor(null);
        }}
        tailor={selectedTailor}
      />
    </>
  );
};

export default TailorManagement;
