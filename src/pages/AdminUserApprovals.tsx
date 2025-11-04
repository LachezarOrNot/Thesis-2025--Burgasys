import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/database';
import { UserApprovalRequest } from '../types';
import { Check, X, Clock, User, Mail, Building, Eye } from 'lucide-react';

const AdminUserApprovals: React.FC = () => {
  const { user } = useAuth();
  const [approvalRequests, setApprovalRequests] = useState<UserApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<UserApprovalRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadApprovalRequests();
  }, []);

  const loadApprovalRequests = async () => {
    try {
      const requests = await databaseService.getUserApprovalRequests('pending');
      setApprovalRequests(requests);
    } catch (error) {
      console.error('Error loading approval requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (requestId: string) => {
    try {
      await databaseService.updateUserApprovalRequest(requestId, {
        status: 'approved',
        reviewedBy: user?.uid
      });
      await loadApprovalRequests();
      setSelectedRequest(null);
      alert('User approved successfully!');
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Failed to approve user');
    }
  };

  const rejectUser = async (requestId: string) => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      await databaseService.updateUserApprovalRequest(requestId, {
        status: 'rejected',
        reviewedBy: user?.uid,
        reason: rejectReason
      });
      await loadApprovalRequests();
      setSelectedRequest(null);
      setRejectReason('');
      alert('User request rejected');
    } catch (error) {
      console.error('Error rejecting user:', error);
      alert('Failed to reject user');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Restricted
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Admin access required.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/4 mb-8"></div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            User Approval Requests
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Review and approve organization account requests
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Requests List */}
          <div className="lg:col-span-2 space-y-4">
            {approvalRequests.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
                <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Pending Requests
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  There are no user approval requests waiting for review.
                </p>
              </div>
            ) : (
              approvalRequests.map(request => (
                <div
                  key={request.id}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {request.userDisplayName}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">
                            {request.userEmail}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Building className="w-4 h-4" />
                          <span className="capitalize">{request.requestedRole}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{request.submittedAt.toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <Eye className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => approveUser(request.id)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setRejectReason('');
                      }}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Request Details Sidebar */}
          {selectedRequest && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Request Details
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    User Information
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900 dark:text-white">{selectedRequest.userDisplayName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900 dark:text-white">{selectedRequest.userEmail}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900 dark:text-white capitalize">{selectedRequest.requestedRole}</span>
                    </div>
                  </div>
                </div>

                {selectedRequest.organizationInfo && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Organization Information
                    </label>
                    <div className="space-y-2 text-sm">
                      {selectedRequest.organizationInfo.name && (
                        <p><strong>Name:</strong> {selectedRequest.organizationInfo.name}</p>
                      )}
                      {selectedRequest.organizationInfo.address && (
                        <p><strong>Address:</strong> {selectedRequest.organizationInfo.address}</p>
                      )}
                      {selectedRequest.organizationInfo.phone && (
                        <p><strong>Phone:</strong> {selectedRequest.organizationInfo.phone}</p>
                      )}
                      {selectedRequest.organizationInfo.description && (
                        <p><strong>Description:</strong> {selectedRequest.organizationInfo.description}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Rejection Reason Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Rejection Reason
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Provide a reason for rejection..."
                  />
                  <button
                    onClick={() => rejectUser(selectedRequest.id)}
                    disabled={!rejectReason.trim()}
                    className="w-full mt-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    Confirm Reject
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUserApprovals;