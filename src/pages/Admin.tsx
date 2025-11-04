import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Organization, Event, EventCreationRequest, UserApprovalRequest } from '../types';
import { databaseService } from '../services/database';
import { Check, X, Building, Calendar, Users, Clock, Eye, Mail, User } from 'lucide-react';

const Admin: React.FC = () => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventRequests, setEventRequests] = useState<EventCreationRequest[]>([]);
  const [userApprovals, setUserApprovals] = useState<UserApprovalRequest[]>([]);
  const [activeTab, setActiveTab] = useState('organizations');
  const [selectedRequest, setSelectedRequest] = useState<EventCreationRequest | null>(null);
  const [selectedUserApproval, setSelectedUserApproval] = useState<UserApprovalRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [userRejectReason, setUserRejectReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [orgsData, eventsData, requestsData, approvalsData] = await Promise.all([
        databaseService.getOrganizations(),
        databaseService.getEvents(),
        databaseService.getEventRequests('pending'),
        databaseService.getUserApprovalRequests('pending')
      ]);
      setOrganizations(orgsData);
      setEvents(eventsData);
      setEventRequests(requestsData);
      setUserApprovals(approvalsData);
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  const handleVerifyOrganization = async (orgId: string, verified: boolean) => {
    try {
      await databaseService.updateOrganization(orgId, { verified });
      loadData();
    } catch (error) {
      console.error('Error updating organization:', error);
    }
  };

  const handleApproveEvent = async (eventId: string) => {
    try {
      await databaseService.updateEventRequest(eventId, { status: 'approved' });
      loadData();
    } catch (error) {
      console.error('Error approving event:', error);
    }
  };

  const handleRejectEvent = async (eventId: string) => {
    try {
      await databaseService.updateEventRequest(eventId, { status: 'rejected' });
      loadData();
    } catch (error) {
      console.error('Error rejecting event:', error);
    }
  };

  const handleApproveEventRequest = async (requestId: string) => {
    try {
      const request = eventRequests.find(r => r.id === requestId);
      if (!request) return;

      // Create the event
      await databaseService.createEvent(request.eventData);
      
      // Update request status
      await databaseService.updateEventRequest(requestId, {
        status: 'approved',
        reviewedBy: user?.uid
      });

      await loadData();
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error approving event request:', error);
    }
  };

  const handleRejectEventRequest = async (requestId: string) => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      await databaseService.updateEventRequest(requestId, {
        status: 'rejected',
        reviewedBy: user?.uid,
        reason: rejectReason
      });

      await loadData();
      setSelectedRequest(null);
      setRejectReason('');
    } catch (error) {
      console.error('Error rejecting event request:', error);
    }
  };

  const handleApproveUser = async (requestId: string) => {
    try {
      await databaseService.updateUserApprovalRequest(requestId, {
        status: 'approved',
        reviewedBy: user?.uid
      });
      await loadData();
      setSelectedUserApproval(null);
    } catch (error) {
      console.error('Error approving user:', error);
    }
  };

  const handleRejectUser = async (requestId: string) => {
    if (!userRejectReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      await databaseService.updateUserApprovalRequest(requestId, {
        status: 'rejected',
        reviewedBy: user?.uid,
        reason: userRejectReason
      });
      await loadData();
      setSelectedUserApproval(null);
      setUserRejectReason('');
    } catch (error) {
      console.error('Error rejecting user:', error);
    }
  };

  const pendingOrganizations = organizations.filter(org => !org.verified);
  const pendingEvents = events.filter(event => event.status === 'pending_approval');

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-100 via-gray-50 to-primary-200 dark:from-gray-900 dark:via-gray-800 dark:to-primary-900 flex items-center justify-center">
        <div className="text-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-xl shadow-xl p-10 border border-primary-200 dark:border-primary-700">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">Access Denied</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-100 via-gray-50 to-primary-200 dark:from-gray-900 dark:via-gray-800 dark:to-primary-900 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
          Admin Dashboard
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-10">
          Manage organizations, events, and user approvals
        </p>

        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-xl shadow-xl mb-10 border border-primary-200 dark:border-primary-700">
          <div className="border-b border-primary-200 dark:border-primary-700">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('organizations')}
                className={`py-5 px-8 font-bold text-base border-b-4 transition-colors duration-200 ${
                  activeTab === 'organizations'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900'
                    : 'border-transparent text-gray-500 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-800'
                }`}
              >
                <Building className="w-5 h-5 inline mr-2" />
                Organizations ({pendingOrganizations.length})
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`py-5 px-8 font-bold text-base border-b-4 transition-colors duration-200 ${
                  activeTab === 'events'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900'
                    : 'border-transparent text-gray-500 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-800'
                }`}
              >
                <Calendar className="w-5 h-5 inline mr-2" />
                Events ({pendingEvents.length})
              </button>
              <button
                onClick={() => setActiveTab('eventRequests')}
                className={`py-5 px-8 font-bold text-base border-b-4 transition-colors duration-200 ${
                  activeTab === 'eventRequests'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900'
                    : 'border-transparent text-gray-500 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-800'
                }`}
              >
                <Calendar className="w-5 h-5 inline mr-2" />
                Event Requests ({eventRequests.length})
              </button>
              <button
                onClick={() => setActiveTab('userApprovals')}
                className={`py-5 px-8 font-bold text-base border-b-4 transition-colors duration-200 ${
                  activeTab === 'userApprovals'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900'
                    : 'border-transparent text-gray-500 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-800'
                }`}
              >
                <Users className="w-5 h-5 inline mr-2" />
                User Approvals ({userApprovals.length})
              </button>
            </nav>
          </div>

          <div className="p-8">
            {/* Organizations Tab */}
            {activeTab === 'organizations' && (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Pending Organization Verifications
                </h3>
                {pendingOrganizations.length > 0 ? (
                  <div className="space-y-6">
                    {pendingOrganizations.map(org => (
                      <div key={org.id} className="bg-white/90 dark:bg-gray-900/90 rounded-lg shadow border border-primary-100 dark:border-primary-700 p-6 flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-1">{org.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 capitalize mb-1">{org.type}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{org.address}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{org.phone} • {org.email}</p>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleVerifyOrganization(org.id, true)}
                            className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-xl font-bold shadow transition-colors"
                            title="Verify Organization"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleVerifyOrganization(org.id, false)}
                            className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-xl font-bold shadow transition-colors"
                            title="Reject Organization"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-10">
                    <Check className="w-14 h-14 mx-auto mb-5 text-green-500" />
                    <p className="text-lg font-semibold">No pending organization verifications</p>
                  </div>
                )}
              </div>
            )}

            {/* Events Tab */}
            {activeTab === 'events' && (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Events Pending Approval
                </h3>
                {pendingEvents.length > 0 ? (
                  <div className="space-y-6">
                    {pendingEvents.map(event => (
                      <div key={event.id} className="bg-white/90 dark:bg-gray-900/90 rounded-lg shadow border border-primary-100 dark:border-primary-700 p-6 flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-1">{event.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            {new Date(event.start_datetime).toLocaleDateString()} • {event.location}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-1">
                            {event.description}
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleApproveEvent(event.id)}
                            className="bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded-xl font-bold shadow transition-colors text-base"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectEvent(event.id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-5 py-3 rounded-xl font-bold shadow transition-colors text-base"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-10">
                    <Check className="w-14 h-14 mx-auto mb-5 text-green-500" />
                    <p className="text-lg font-semibold">No events pending approval</p>
                  </div>
                )}
              </div>
            )}

            {/* Event Requests Tab */}
            {activeTab === 'eventRequests' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Event Creation Requests
                  </h3>
                  {eventRequests.length > 0 ? (
                    <div className="space-y-4">
                      {eventRequests.map(request => (
                        <div
                          key={request.id}
                          className="bg-white/90 dark:bg-gray-900/90 rounded-lg shadow border border-primary-100 dark:border-primary-700 p-6"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                {request.eventData.name}
                              </h4>
                              <p className="text-gray-600 dark:text-gray-400 mb-2">
                                Requested by: {request.userName} ({request.userEmail})
                              </p>
                              {request.organizationName && (
                                <p className="text-gray-600 dark:text-gray-400">
                                  Organization: {request.organizationName}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => setSelectedRequest(request)}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                              <Eye className="w-5 h-5 text-gray-500" />
                            </button>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(request.eventData.start_datetime).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(request.eventData.start_datetime).toLocaleTimeString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Building className="w-4 h-4" />
                              {request.eventData.location}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveEventRequest(request.id)}
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
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-10">
                      <Check className="w-14 h-14 mx-auto mb-5 text-green-500" />
                      <p className="text-lg font-semibold">No event creation requests</p>
                    </div>
                  )}
                </div>

                {/* Event Request Details Sidebar */}
                {selectedRequest && (
                  <div className="bg-white/90 dark:bg-gray-900/90 rounded-lg shadow border border-primary-100 dark:border-primary-700 p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      Event Details
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Event Name
                        </label>
                        <p className="text-gray-900 dark:text-white">{selectedRequest.eventData.name}</p>
                      </div>

                      {selectedRequest.eventData.subtitle && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Subtitle
                          </label>
                          <p className="text-gray-900 dark:text-white">{selectedRequest.eventData.subtitle}</p>
                        </div>
                      )}

                      {selectedRequest.eventData.description && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description
                          </label>
                          <p className="text-gray-900 dark:text-white">{selectedRequest.eventData.description}</p>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Date & Time
                        </label>
                        <p className="text-gray-900 dark:text-white">
                          {new Date(selectedRequest.eventData.start_datetime).toLocaleString()} - {' '}
                          {new Date(selectedRequest.eventData.end_datetime).toLocaleString()}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Location
                        </label>
                        <p className="text-gray-900 dark:text-white">{selectedRequest.eventData.location}</p>
                      </div>

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
                          onClick={() => handleRejectEventRequest(selectedRequest.id)}
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
            )}

            {/* User Approvals Tab */}
            {activeTab === 'userApprovals' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    User Approval Requests
                  </h3>
                  {userApprovals.length > 0 ? (
                    <div className="space-y-4">
                      {userApprovals.map(request => (
                        <div
                          key={request.id}
                          className="bg-white/90 dark:bg-gray-900/90 rounded-lg shadow border border-primary-100 dark:border-primary-700 p-6"
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
                              onClick={() => setSelectedUserApproval(request)}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                              <Eye className="w-5 h-5 text-gray-500" />
                            </button>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveUser(request.id)}
                              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                            >
                              <Check className="w-4 h-4" />
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUserApproval(request);
                                setUserRejectReason('');
                              }}
                              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                            >
                              <X className="w-4 h-4" />
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-10">
                      <Check className="w-14 h-14 mx-auto mb-5 text-green-500" />
                      <p className="text-lg font-semibold">No user approval requests</p>
                    </div>
                  )}
                </div>

                {/* User Approval Details Sidebar */}
                {selectedUserApproval && (
                  <div className="bg-white/90 dark:bg-gray-900/90 rounded-lg shadow border border-primary-100 dark:border-primary-700 p-6">
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
                            <span className="text-gray-900 dark:text-white">{selectedUserApproval.userDisplayName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900 dark:text-white">{selectedUserApproval.userEmail}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900 dark:text-white capitalize">{selectedUserApproval.requestedRole}</span>
                          </div>
                        </div>
                      </div>

                      {selectedUserApproval.organizationInfo && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Organization Information
                          </label>
                          <div className="space-y-2 text-sm">
                            {selectedUserApproval.organizationInfo.name && (
                              <p><strong>Name:</strong> {selectedUserApproval.organizationInfo.name}</p>
                            )}
                            {selectedUserApproval.organizationInfo.address && (
                              <p><strong>Address:</strong> {selectedUserApproval.organizationInfo.address}</p>
                            )}
                            {selectedUserApproval.organizationInfo.phone && (
                              <p><strong>Phone:</strong> {selectedUserApproval.organizationInfo.phone}</p>
                            )}
                            {selectedUserApproval.organizationInfo.description && (
                              <p><strong>Description:</strong> {selectedUserApproval.organizationInfo.description}</p>
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
                          value={userRejectReason}
                          onChange={(e) => setUserRejectReason(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Provide a reason for rejection..."
                        />
                        <button
                          onClick={() => handleRejectUser(selectedUserApproval.id)}
                          disabled={!userRejectReason.trim()}
                          className="w-full mt-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                        >
                          Confirm Reject
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;