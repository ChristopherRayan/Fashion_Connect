import React, { useState, useEffect } from 'react';
import {
  Users,
  Scissors,
  Package,
  Calendar,
  User,
  MapPin,
  DollarSign,
  MessageSquare,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { tailorService } from '../../services/tailorService';
import { Tailor, CustomOrder } from '../../types';
import { formatCurrency } from '../../utils/helpers';

interface OrderAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: CustomOrder;
  onSuccess: () => void;
}

const OrderAssignmentModal: React.FC<OrderAssignmentModalProps> = ({
  isOpen,
  onClose,
  order,
  onSuccess
}) => {
  const { addToast } = useNotification();
  const [tailors, setTailors] = useState<Tailor[]>([]);
  const [selectedTailor, setSelectedTailor] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingTailors, setFetchingTailors] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchTailors();
    }
  }, [isOpen]);

  const fetchTailors = async () => {
    try {
      setFetchingTailors(true);
      const data = await tailorService.getDesignerTailors();
      setTailors(data);
    } catch (error) {
      console.error('Error fetching tailors:', error);
      addToast('error', 'Failed to load tailors');
    } finally {
      setFetchingTailors(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedTailor) {
      addToast('error', 'Please select a tailor');
      return;
    }

    try {
      setLoading(true);
      await tailorService.assignOrderToTailor(order.id, {
        tailorId: selectedTailor,
        notes: notes.trim() || undefined
      });
      
      addToast('success', 'Order assigned to tailor successfully');
      onSuccess();
      onClose();
      
      // Reset form
      setSelectedTailor('');
      setNotes('');
    } catch (error) {
      console.error('Error assigning order:', error);
      addToast('error', error instanceof Error ? error.message : 'Failed to assign order');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Assign Order to Tailor
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Order Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Order Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center">
                  <Package className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">Product:</span>
                  <span className="ml-1 font-medium">{order.productType}</span>
                </div>
                <div className="flex items-center">
                  <User className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">Customer:</span>
                  <span className="ml-1 font-medium">{order.user.name}</span>
                </div>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">Price:</span>
                  <span className="ml-1 font-medium">{formatCurrency(order.estimatedPrice)}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">Due:</span>
                  <span className="ml-1 font-medium">
                    {new Date(order.expectedDeliveryDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center sm:col-span-2">
                  <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">Location:</span>
                  <span className="ml-1 font-medium">{order.deliveryLocation}</span>
                </div>
              </div>
              
              {order.additionalNotes && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <strong>Customer Notes:</strong> {order.additionalNotes}
                  </p>
                </div>
              )}
            </div>

            {fetchingTailors ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                <span className="ml-2 text-gray-600">Loading tailors...</span>
              </div>
            ) : tailors.length === 0 ? (
              <div className="text-center py-8">
                <Scissors className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No tailors available</h3>
                <p className="mt-1 text-sm text-gray-500">
                  You need to create tailor accounts first.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Tailor Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Tailor
                  </label>
                  <div className="space-y-2">
                    {tailors.map((tailor) => (
                      <div
                        key={tailor.id}
                        className={`relative rounded-lg border p-4 cursor-pointer transition-colors ${
                          selectedTailor === tailor.id
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        onClick={() => setSelectedTailor(tailor.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                <Scissors className="h-5 w-5 text-indigo-600" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                {tailor.name}
                              </p>
                              <p className="text-sm text-gray-500">{tailor.email}</p>
                            </div>
                          </div>
                          
                          {tailor.orderStats && (
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <div className="text-center">
                                <div className="font-medium text-gray-900">
                                  {tailor.orderStats.processing}
                                </div>
                                <div>Active</div>
                              </div>
                              <div className="text-center">
                                <div className="font-medium text-gray-900">
                                  {tailor.orderStats.completed}
                                </div>
                                <div>Completed</div>
                              </div>
                            </div>
                          )}
                          
                          {selectedTailor === tailor.id && (
                            <div className="absolute top-2 right-2">
                              <Check className="h-5 w-5 text-indigo-600" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Assignment Notes */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                    Assignment Notes (Optional)
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="notes"
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Add any special instructions or notes for the tailor..."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleAssign}
              disabled={loading || !selectedTailor || tailors.length === 0}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <Users className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Assigning...' : 'Assign Order'}
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

export default OrderAssignmentModal;