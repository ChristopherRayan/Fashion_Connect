import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Users,
  Eye,
  RefreshCw
} from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { adminService, AdminUser } from '../../services/adminService';
import UserDetailModal from '../../components/admin/UserDetailModal';

type RoleFilter = 'all' | 'CLIENT' | 'DESIGNER' | 'ADMIN';
type StatusFilter = 'all' | 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED';
type SortOption = 'name-asc' | 'name-desc' | 'newest' | 'oldest';

const UserManagement = () => {
  const { addToast } = useNotification();
  
  // State
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  // Fetch users
  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (roleFilter !== 'all') params.role = roleFilter;
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await adminService.getUsers(params);
      setUsers(response.docs);
    } catch (error) {
      console.error('Error fetching users:', error);
      addToast('error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };



  const handleStatusUpdate = async (userId: string, newStatus: 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED') => {
    try {
      const updatedUser = await adminService.updateUserStatus(userId, newStatus);
      setUsers(prev => prev.map(u => u._id === userId ? updatedUser : u));
      addToast('success', `User status updated to ${newStatus.toLowerCase().replace('_', ' ')}`);
    } catch (error) {
      console.error('Error updating user status:', error);
      addToast('error', 'Failed to update user status');
    }
  };

  // Filter and sort users
  const getFilteredUsers = () => {
    let filtered = users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      
      return matchesSearch && matchesRole && matchesStatus;
    });

    // Sort users
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 bg-white shadow rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="mt-2 text-gray-600">
                Manage users, verify designers, and monitor platform activity
              </p>
            </div>
            <button
              onClick={fetchUsers}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-yellow-500 hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors duration-200"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* User Management Content */}
        <div className="space-y-6">
            {/* Filters and Search */}
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 bg-white text-gray-900 rounded-md focus:ring-yellow-500 focus:border-yellow-500 placeholder-gray-400"
                  />
                </div>

                {/* Filter Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {showFilters ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                </button>
              </div>

              {/* Filter Options */}
              {showFilters && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Role Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                      <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
                        className="w-full border border-gray-300 bg-white text-gray-900 rounded-md px-3 py-2 focus:ring-yellow-500 focus:border-yellow-500"
                      >
                        <option value="all">All Roles</option>
                        <option value="CLIENT">Clients</option>
                        <option value="DESIGNER">Designers</option>
                        <option value="ADMIN">Admins</option>
                      </select>
                    </div>

                    {/* Status Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                        className="w-full border border-gray-700 bg-gray-800 text-white rounded-md px-3 py-2 focus:ring-yellow-500 focus:border-yellow-500"
                      >
                        <option value="all">All Statuses</option>
                        <option value="ACTIVE">Active</option>
                        <option value="PENDING_VERIFICATION">Pending</option>
                        <option value="SUSPENDED">Suspended</option>
                      </select>
                    </div>

                    {/* Sort */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="w-full border border-gray-700 bg-gray-800 text-white rounded-md px-3 py-2 focus:ring-yellow-500 focus:border-yellow-500"
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="name-asc">Name A-Z</option>
                        <option value="name-desc">Name Z-A</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Users Table */}
            <div className="bg-gray-900 shadow overflow-hidden sm:rounded-md border border-gray-800">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg leading-6 font-medium text-white">
                    Users ({getFilteredUsers().length})
                  </h3>
                </div>
              </div>

              <ul className="divide-y divide-gray-800">
                {getFilteredUsers().map((user) => (
                  <li key={user._id} className="px-4 py-4 sm:px-6 hover:bg-gray-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-yellow-500 flex items-center justify-center text-black font-bold">
                            {user.name.charAt(0)}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-white">{user.name}</p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.role === 'ADMIN' ? 'bg-yellow-500 text-black' :
                              user.role === 'DESIGNER' ? 'bg-blue-500 text-white' :
                              'bg-gray-500 text-white'
                            }`}>
                              {adminService.formatUserRole(user.role)}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.status === 'ACTIVE' ? 'bg-green-500 text-white' :
                              user.status === 'PENDING_VERIFICATION' ? 'bg-yellow-500 text-black' :
                              'bg-red-500 text-white'
                            }`}>
                              {adminService.formatUserStatus(user.status)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 mt-1">
                            <p className="text-sm text-gray-300">{user.email}</p>
                            <p className="text-sm text-gray-300">Joined {formatDate(user.createdAt)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        {/* View User Details Button */}
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserModal(true);
                          }}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-600 rounded-md text-xs font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </button>

                        {/* Status Update Dropdown */}
                        <select
                          value={user.status}
                          onChange={(e) => handleStatusUpdate(user._id!, e.target.value as 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED')}
                          disabled={user.role === 'ADMIN'}
                          className="text-xs border border-gray-600 bg-gray-800 text-white rounded-md px-2 py-1.5 focus:ring-yellow-500 focus:border-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="ACTIVE">Activate</option>
                          <option value="SUSPENDED">Deactivate</option>
                          <option value="PENDING_VERIFICATION">Pending Verification</option>
                        </select>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              
              {getFilteredUsers().length === 0 && (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-white">No users found</h3>
                  <p className="mt-1 text-sm text-gray-300">
                    Try adjusting your search or filter criteria.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User Detail Modal */}
        <UserDetailModal
          user={selectedUser}
          isOpen={showUserModal}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }}
        />


      </div>
    </>
  );
};

export default UserManagement;
