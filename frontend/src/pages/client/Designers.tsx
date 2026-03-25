import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Star, Users } from 'lucide-react';
import { designerService, Designer } from '../../services/designerService';
import { useNotification } from '../../contexts/NotificationContext';
import DesignerCard from '../../components/common/DesignerCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const Designers: React.FC = () => {
  const { addToast } = useNotification();
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [customOrdersOnly, setCustomOrdersOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDesigners, setTotalDesigners] = useState(0);

  const specialties = [
    'Traditional Wear',
    'Formal Wear',
    'Casual Wear',
    'Wedding Dresses',
    'Evening Wear',
    'Streetwear',
    'Accessories',
    'Footwear',
    'Children\'s Wear',
    'Plus Size',
    'Sustainable Fashion',
    'Haute Couture'
  ];

  const locations = [
    'Lilongwe',
    'Blantyre',
    'Mzuzu',
    'Zomba',
    'Kasungu',
    'Mangochi',
    'Salima',
    'Balaka',
    'Chiradzulu',
    'Thyolo'
  ];

  const fetchDesigners = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 12,
        sortBy: 'rating',
        sortType: 'desc'
      };

      if (searchQuery) params.query = searchQuery;
      if (selectedSpecialty) params.specialty = selectedSpecialty;
      if (selectedLocation) params.location = selectedLocation;
      if (customOrdersOnly) params.customOrders = 'true';

      const response = await designerService.getDesigners(params);
      
      setDesigners(response.docs);
      setTotalPages(response.totalPages);
      setTotalDesigners(response.totalDocs);
    } catch (error) {
      console.error('Error fetching designers:', error);
      addToast('error', 'Failed to load designers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDesigners();
  }, [currentPage]);

  // Separate effect for filters to reset page and fetch
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedSpecialty, selectedLocation, customOrdersOnly]);

  // Effect to fetch when page changes or when filters change and page is 1
  useEffect(() => {
    if (currentPage === 1) {
      fetchDesigners();
    }
  }, [currentPage, searchQuery, selectedSpecialty, selectedLocation, customOrdersOnly]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchDesigners();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSpecialty('');
    setSelectedLocation('');
    setCustomOrdersOnly(false);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
            <Users className="inline-block mr-3 h-10 w-10 text-yellow-500" />
            Our Designers
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover talented fashion designers from across Malawi and explore their unique collections
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search designers by name, business, or specialty..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Specialty Filter */}
              <div className="md:w-48">
                <select
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  aria-label="Filter designers by specialty"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  <option value="">All Specialties</option>
                  {specialties.map((specialty) => (
                    <option key={specialty} value={specialty}>
                      {specialty}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location Filter */}
              <div className="md:w-48">
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  aria-label="Filter designers by location"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  <option value="">All Locations</option>
                  {locations.map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Additional Filters */}
            <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={customOrdersOnly}
                  onChange={(e) => setCustomOrdersOnly(e.target.checked)}
                  className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                />
                <span className="ml-2 text-sm text-gray-700">Custom orders available only</span>
              </label>
            </div>

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={clearFilters}
                className="text-gray-600 hover:text-gray-800 text-sm flex items-center"
                disabled={!searchQuery && !selectedSpecialty && !selectedLocation && !customOrdersOnly}
              >
                <Filter className="h-4 w-4 mr-1" />
                Clear Filters
              </button>
              <div className="flex items-center space-x-3">
                {(searchQuery || selectedSpecialty || selectedLocation || customOrdersOnly) && (
                  <span className="text-sm text-gray-600">
                    Showing {totalDesigners} designer{totalDesigners !== 1 ? 's' : ''}
                  </span>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-yellow-400 hover:bg-yellow-500 disabled:bg-yellow-300 text-black font-medium px-6 py-2 rounded-lg transition-colors duration-200 flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full mr-2" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-gray-600">
            {loading ? 'Loading...' : `Showing ${designers.length} of ${totalDesigners} designers`}
          </p>
        </div>

        {/* Active Filters Summary */}
        {(searchQuery || selectedSpecialty || selectedLocation || customOrdersOnly) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Active filters:</span>
              {searchQuery && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-200 text-yellow-800">
                  Search: "{searchQuery}"
                  <button
                    onClick={() => setSearchQuery('')}
                    className="ml-2 text-yellow-600 hover:text-yellow-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedSpecialty && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-200 text-yellow-800">
                  Specialty: {selectedSpecialty}
                  <button
                    onClick={() => setSelectedSpecialty('')}
                    className="ml-2 text-yellow-600 hover:text-yellow-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedLocation && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-200 text-yellow-800">
                  Location: {selectedLocation}
                  <button
                    onClick={() => setSelectedLocation('')}
                    className="ml-2 text-yellow-600 hover:text-yellow-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {customOrdersOnly && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-200 text-yellow-800">
                  Custom Orders Available
                  <button
                    onClick={() => setCustomOrdersOnly(false)}
                    className="ml-2 text-yellow-600 hover:text-yellow-800"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Results Summary */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600">
            {loading ? (
              'Loading designers...'
            ) : (
              `Showing ${designers.length} of ${totalDesigners} designer${totalDesigners !== 1 ? 's' : ''}`
            )}
          </p>
          {!loading && totalDesigners > 0 && (
            <div className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </div>
          )}
        </div>

        {/* Designers Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(12)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-300" />
                <div className="p-4">
                  <div className="h-3 bg-gray-300 rounded mb-2" />
                  <div className="h-4 bg-gray-300 rounded mb-2" />
                  <div className="h-3 bg-gray-300 rounded mb-3" />
                  <div className="h-8 bg-gray-300 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : designers.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {designers.map((designer) => (
                <DesignerCard key={designer._id} designer={designer} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-12">
                <nav className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-md bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {[...Array(Math.min(5, totalPages))].map((_, index) => {
                    const page = index + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-md ${
                          currentPage === page
                            ? 'bg-yellow-400 text-black'
                            : 'bg-white border border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded-md bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No designers found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Designers;
