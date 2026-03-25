import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  RefreshCw,
  AlertCircle,
  MessageSquare,
  User,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { complaintService, Complaint, ComplaintStats } from '../../services/complaintService';

// Use Complaint type from service
type UserComplaint = Complaint;

const Reports = () => {
  const { addToast } = useNotification();

  // State
  const [complaints, setComplaints] = useState<UserComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all');
  const [selectedComplaint, setSelectedComplaint] = useState<UserComplaint | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [complaintResponses, setComplaintResponses] = useState<any[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [stats, setStats] = useState<ComplaintStats>({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    urgent: 0,
    high: 0,
    pending: 0
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalDocs: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  useEffect(() => {
    console.log('📊 Reports component mounted, fetching data...');
    fetchComplaints();
    fetchStats();
  }, [statusFilter]);

  const fetchComplaints = async () => {
    try {
      console.log('📋 Fetching complaints with filter:', statusFilter);
      setLoading(true);

      const params: any = {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortType: 'desc' as const
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      console.log('📋 Calling complaintService.getAllComplaints with params:', params);
      const response = await complaintService.getAllComplaints(params);
      console.log('📋 Complaints response:', response);

      setComplaints(response.docs);
      setPagination({
        currentPage: response.page,
        totalPages: response.totalPages,
        totalDocs: response.totalDocs,
        hasNextPage: response.hasNextPage,
        hasPrevPage: response.hasPrevPage
      });

      console.log('✅ Complaints loaded successfully:', response.docs.length, 'items');
    } catch (error) {
      console.error('❌ Failed to fetch complaints:', error);
      addToast('error', 'Failed to load complaints');
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      console.log('📊 Fetching complaint stats...');
      const statsData = await complaintService.getComplaintStats();
      console.log('📊 Stats response:', statsData);
      setStats(statsData);
      console.log('✅ Stats loaded successfully');
    } catch (error) {
      console.error('❌ Failed to fetch complaint stats:', error);
      addToast('error', 'Failed to load statistics');
    }
  };

  const handleUpdateStatus = async (complaintId: string, newStatus: string) => {
    try {
      await complaintService.updateComplaint(complaintId, {
        status: newStatus as any
      });

      // Update local state
      setComplaints(prev => prev.map(c =>
        c._id === complaintId
          ? { ...c, status: newStatus as any, updatedAt: new Date().toISOString() }
          : c
      ));

      addToast('success', 'Status updated successfully');
      fetchStats(); // Refresh stats
    } catch (error) {
      console.error('Error updating status:', error);
      addToast('error', 'Failed to update status');
    }
  };

  const fetchComplaintResponses = async (complaintId: string) => {
    try {
      setLoadingResponses(true);
      const response = await fetch(`http://localhost:8000/api/v1/complaints/${complaintId}/responses`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setComplaintResponses(data.data.responses || []);
      }
    } catch (error) {
      console.error('Error fetching responses:', error);
      addToast('error', 'Failed to load responses');
    } finally {
      setLoadingResponses(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!selectedComplaint || !adminResponse.trim()) {
      addToast('error', 'Please provide a response');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/v1/complaints/${selectedComplaint._id}/response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          message: adminResponse,
          isInternal: isInternal
        })
      });

      if (response.ok) {
        const data = await response.json();

        // Update local state
        setComplaints(prev => prev.map(c =>
          c._id === selectedComplaint._id ? data.data : c
        ));

        addToast('success', `${isInternal ? 'Internal note' : 'Response'} submitted successfully`);
        setAdminResponse('');
        setIsInternal(false);

        // Refresh responses
        await fetchComplaintResponses(selectedComplaint._id);
        fetchStats(); // Refresh stats
      } else {
        throw new Error('Failed to submit response');
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      addToast('error', 'Failed to submit response');
    }
  };

  const handleEscalateComplaint = async (complaintId: string, reason: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/complaints/${complaintId}/escalate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        const data = await response.json();

        // Update local state
        setComplaints(prev => prev.map(c =>
          c._id === complaintId ? data.data : c
        ));

        addToast('success', 'Complaint escalated successfully');
        fetchStats(); // Refresh stats
      } else {
        throw new Error('Failed to escalate complaint');
      }
    } catch (error) {
      console.error('Error escalating complaint:', error);
      addToast('error', 'Failed to escalate complaint');
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Reports & Complaints</h1>
              <p className="mt-2 text-gray-600">
                Manage user complaints and support requests from all users
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => { fetchComplaints(); fetchStats(); }}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-yellow-500 hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors duration-200"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <MessageSquare className="h-6 w-6 text-gray-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Complaints</dt>
                    <dd className="text-lg font-semibold text-gray-900">{stats.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-yellow-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                    <dd className="text-lg font-semibold text-gray-900">{stats.pending}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Resolved</dt>
                    <dd className="text-lg font-semibold text-gray-900">{stats.resolved}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircle className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Urgent</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.urgent}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="text-sm text-gray-500">
            {complaints.length} complaint{complaints.length !== 1 ? 's' : ''} found
          </div>
        </div>
      </div>

      {/* Complaints List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Complaints & Reports
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {complaints.map((complaint) => (
            <div key={complaint._id} className="px-4 py-6 sm:px-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {complaint.user?.name?.charAt(0) || 'U'}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-lg font-medium text-gray-900 truncate">
                        {complaint.subject}
                      </h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(complaint.status)}`}>
                        {complaint.status.replace('_', ' ')}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(complaint.priority)}`}>
                        {complaint.priority}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {complaint.user?.name || 'Unknown User'} ({complaint.user?.email || 'No email'})
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(complaint.createdAt)}
                      </div>
                    </div>

                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                      {complaint.description}
                    </p>

                    {complaint.adminResponse && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-sm text-blue-800">
                          <strong>Admin Response:</strong> {complaint.adminResponse}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setSelectedComplaint(complaint);
                      setAdminResponse('');
                      setIsInternal(false);
                      fetchComplaintResponses(complaint._id);
                    }}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </button>

                  {complaint.status !== 'resolved' && (
                    <button
                      onClick={() => handleUpdateStatus(complaint._id, 'resolved')}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Resolve
                    </button>
                  )}

                  {complaint.status !== 'closed' && (
                    <button
                      onClick={() => handleUpdateStatus(complaint._id, 'closed')}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Close
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {complaints.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No complaints found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No complaints match your current filters.
            </p>
          </div>
        )}
      </div>

      {/* Complaint Detail Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setSelectedComplaint(null)} />

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Complaint Details
                  </h3>
                  <button
                    onClick={() => setSelectedComplaint(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Subject</h4>
                    <p className="mt-1 text-sm text-gray-600">{selectedComplaint.subject}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900">User</h4>
                    <p className="mt-1 text-sm text-gray-600">{selectedComplaint.user.name} ({selectedComplaint.user.email})</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Category</h4>
                      <p className="mt-1 text-sm text-gray-600 capitalize">{selectedComplaint.category}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Priority</h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(selectedComplaint.priority)}`}>
                        {selectedComplaint.priority}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Description</h4>
                    <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{selectedComplaint.description}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Status</h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(selectedComplaint.status)}`}>
                      {selectedComplaint.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Created</h4>
                      <p className="mt-1 text-sm text-gray-600">{formatDate(selectedComplaint.createdAt)}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Last Updated</h4>
                      <p className="mt-1 text-sm text-gray-600">{formatDate(selectedComplaint.updatedAt)}</p>
                    </div>
                  </div>

                  {/* Response History */}
                  {complaintResponses.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Response History</h4>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {complaintResponses.map((response: any, index: number) => (
                          <div
                            key={index}
                            className={`p-3 rounded-lg ${
                              response.isInternal
                                ? 'bg-yellow-50 border border-yellow-200'
                                : 'bg-blue-50 border border-blue-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs font-medium ${
                                response.isInternal ? 'text-yellow-800' : 'text-blue-800'
                              }`}>
                                {response.adminUser?.name || 'Admin'}
                                {response.isInternal && ' (Internal Note)'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(response.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className={`text-sm ${
                              response.isInternal ? 'text-yellow-700' : 'text-blue-700'
                            }`}>
                              {response.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Legacy admin response for backward compatibility */}
                  {selectedComplaint.adminResponse && !complaintResponses.length && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-900">Previous Admin Response</h4>
                      <p className="mt-1 text-sm text-blue-800">{selectedComplaint.adminResponse}</p>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">Add Response</h4>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isInternal}
                          onChange={(e) => setIsInternal(e.target.checked)}
                          className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-600">Internal note (not visible to user)</span>
                      </label>
                    </div>
                    <textarea
                      value={adminResponse}
                      onChange={(e) => setAdminResponse(e.target.value)}
                      placeholder={isInternal ? "Enter internal note for admin team..." : "Enter your response to the user..."}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleSubmitResponse}
                  disabled={!adminResponse.trim()}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 ${
                    isInternal
                      ? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
                      : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                  }`}
                >
                  {isInternal ? 'Add Internal Note' : 'Send Response to User'}
                </button>
                <button
                  onClick={() => setSelectedComplaint(null)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
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

export default Reports;