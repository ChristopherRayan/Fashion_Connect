import React, { useState, useEffect } from 'react';
import { X, MessageCircle, Star, MapPin, Clock, Search } from 'lucide-react';
import { designerService } from '../../services/designerService';
import { useNotification } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import LoadingSpinner from '../common/LoadingSpinner';

interface Designer {
  _id: string;
  name: string;
  businessName?: string;
  bio?: string;
  specialty?: string;
  location?: string;
  profileImage?: string;
  rating?: number;
  customOrdersAvailable?: boolean;
  turnaroundTime?: string;
}

interface DesignerListPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDesigner: (designerId: string, designerName: string) => void;
}

const DesignerListPopup: React.FC<DesignerListPopupProps> = ({
  isOpen,
  onClose,
  onSelectDesigner
}) => {
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { addToast } = useNotification();
  const { t } = useLanguage();

  useEffect(() => {
    if (isOpen) {
      fetchDesigners();
    }
  }, [isOpen]);

  const fetchDesigners = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching designers for messaging...');
      
      const response = await designerService.getDesigners({
        page: 1,
        limit: 50,
        sortBy: 'rating',
        sortType: 'desc'
      });

      console.log('✅ Designers fetched:', response.docs.length);
      setDesigners(response.docs);
    } catch (error) {
      console.error('❌ Error fetching designers:', error);
      addToast('error', 'Failed to load designers');
    } finally {
      setLoading(false);
    }
  };

  const filteredDesigners = designers.filter(designer =>
    designer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    designer.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    designer.specialty?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectDesigner = (designer: Designer) => {
    console.log('💬 Starting chat with designer:', designer.name);
    onSelectDesigner(designer._id, designer.name);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full max-h-[80vh]">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <MessageCircle className="h-5 w-5 text-white mr-2" />
                <h3 className="text-sm font-medium text-white">
                  Choose a Designer to Chat With
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search designers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Designer list */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : filteredDesigners.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p>No designers found</p>
                {searchQuery && (
                  <p className="text-sm mt-2">Try adjusting your search</p>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredDesigners.map((designer) => (
                  <div
                    key={designer._id}
                    onClick={() => handleSelectDesigner(designer)}
                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        {designer.profileImage ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={designer.profileImage}
                            alt={designer.name}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                            {designer.name.charAt(0)}
                          </div>
                        )}
                      </div>

                      {/* Designer info */}
                      <div className="ml-3 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-gray-900 truncate">
                            {designer.name}
                          </p>
                          {designer.rating && (
                            <div className="flex items-center">
                              <Star className="h-3 w-3 text-yellow-400 fill-current" />
                              <span className="ml-1 text-xs text-gray-600">
                                {designer.rating.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>

                        {designer.businessName && (
                          <p className="text-xs text-blue-600 truncate">
                            {designer.businessName}
                          </p>
                        )}

                        {designer.specialty && (
                          <p className="text-xs text-gray-500 truncate">
                            {designer.specialty}
                          </p>
                        )}
                        
                        <div className="flex items-center mt-1 space-x-4">
                          {designer.location && (
                            <div className="flex items-center text-xs text-gray-500">
                              <MapPin className="h-3 w-3 mr-1" />
                              {designer.location}
                            </div>
                          )}
                          
                          {designer.customOrdersAvailable && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Custom Orders
                            </span>
                          )}
                        </div>
                        
                        {designer.turnaroundTime && (
                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            {designer.turnaroundTime}
                          </div>
                        )}
                      </div>

                      {/* Chat icon */}
                      <div className="ml-4">
                        <MessageCircle className="h-5 w-5 text-blue-500" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-2">
            <p className="text-xs text-gray-500 text-center">
              Select a designer to start a conversation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignerListPopup;
