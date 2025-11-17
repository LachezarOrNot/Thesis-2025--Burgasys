import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Organization, Event, EventCreationRequest, UserApprovalRequest } from '../types';
import { databaseService } from '../services/database';
import { Check, X, Building, Calendar, Users, Clock, Eye, Mail, User, ChevronRight, AlertCircle } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to convert undefined to null for Firestore
  const prepareDataForFirestore = (obj: any): any => {
    if (obj === undefined) return null;
    if (obj === null) return null;
    
    if (Array.isArray(obj)) {
      return obj.map(item => prepareDataForFirestore(item));
    }
    
    if (obj && typeof obj === 'object' && !(obj instanceof Date)) {
      const cleaned: any = {};
      Object.keys(obj).forEach(key => {
        const value = prepareDataForFirestore(obj[key]);
        cleaned[key] = value;
      });
      return cleaned;
    }
    
    return obj;
  };

  const handleVerifyOrganization = async (orgId: string, verified: boolean) => {
    try {
      // First, get the organization to find out who created it
      const organization = organizations.find(org => org.id === orgId);
      if (!organization) return;

      // Update organization verification status
      await databaseService.updateOrganization(orgId, { verified });

      // If organization is being verified (approved), update the user's affiliatedOrganizationId
      if (verified && organization.createdBy) {
        try {
          // Update the user's profile to link them to this organization
          await databaseService.updateUser(organization.createdBy, {
            affiliatedOrganizationId: orgId
          });
          console.log(`User ${organization.createdBy} linked to organization ${orgId}`);
        } catch (userError) {
          console.error('Error updating user organization affiliation:', userError);
          // Don't fail the entire operation if user update fails
        }
      }

      // Reload data to reflect changes
      await loadData();
    } catch (error) {
      console.error('Error updating organization:', error);
    }
  };

  const handleApproveEvent = async (eventId: string) => {
    try {
      await databaseService.updateEvent(eventId, { status: 'published' });
      loadData();
    } catch (error) {
      console.error('Error approving event:', error);
    }
  };

  const handleRejectEvent = async (eventId: string) => {
    try {
      await databaseService.updateEvent(eventId, { status: 'rejected' });
      loadData();
    } catch (error) {
      console.error('Error rejecting event:', error);
    }
  };

  const handleApproveEventRequest = async (requestId: string) => {
    try {
      const request = eventRequests.find(r => r.id === requestId);
      if (!request) return;

      // Create the actual event from the request - ensure no undefined values
      const eventData = prepareDataForFirestore({
        ...request.eventData,
        status: 'published' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log('Creating approved event with data:', eventData);
      await databaseService.createEvent(eventData);
      
      // Update the request status
      const updateData = prepareDataForFirestore({
        status: 'approved',
        reviewedBy: user?.uid,
        reviewedAt: new Date()
      });

      await databaseService.updateEventRequest(requestId, updateData);

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
      const updateData = prepareDataForFirestore({
        status: 'rejected',
        reviewedBy: user?.uid,
        reviewedAt: new Date(),
        reason: rejectReason
      });

      await databaseService.updateEventRequest(requestId, updateData);

      await loadData();
      setSelectedRequest(null);
      setRejectReason('');
    } catch (error) {
      console.error('Error rejecting event request:', error);
    }
  };

  const handleApproveUser = async (requestId: string) => {
    try {
      const updateData = prepareDataForFirestore({
        status: 'approved',
        reviewedBy: user?.uid,
        reviewedAt: new Date()
      });

      await databaseService.updateUserApprovalRequest(requestId, updateData);
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
      const updateData = prepareDataForFirestore({
        status: 'rejected',
        reviewedBy: user?.uid,
        reviewedAt: new Date(),
        reason: userRejectReason
      });

      await databaseService.updateUserApprovalRequest(requestId, updateData);
      await loadData();
      setSelectedUserApproval(null);
      setUserRejectReason('');
    } catch (error) {
      console.error('Error rejecting user:', error);
    }
  };

  const pendingOrganizations = organizations.filter(org => !org.verified);
  const pendingEvents = events.filter(event => event.status === 'pending_approval');

  // Loading animation
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-600 rounded-full animate-pulse"></div>
          </div>
          <p className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-300">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 flex items-center justify-center p-4">
        <div className="text-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl p-12 border border-indigo-100 dark:border-indigo-800 transform hover:scale-105 transition-transform duration-300">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
            Access Denied
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md">
            You need administrator privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-gray-900 dark:text-white mb-4 tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Manage organizations, events, and user approvals with powerful administrative tools
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl shadow-lg border border-indigo-100 dark:border-indigo-800 p-6 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Pending Orgs</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{pendingOrganizations.length}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                <Building className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl shadow-lg border border-purple-100 dark:border-purple-800 p-6 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Pending Events</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{pendingEvents.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl shadow-lg border border-pink-100 dark:border-pink-800 p-6 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Event Requests</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{eventRequests.length}</p>
              </div>
              <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl shadow-lg border border-green-100 dark:border-green-800 p-6 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">User Approvals</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{userApprovals.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-indigo-100 dark:border-indigo-800 mb-10 overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-indigo-100 dark:border-indigo-800 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-indigo-900/20">
            <nav className="flex -mb-px overflow-x-auto">
              {[
                { id: 'organizations', icon: Building, label: 'Organizations', count: pendingOrganizations.length },
                { id: 'events', icon: Calendar, label: 'Events', count: pendingEvents.length },
                { id: 'eventRequests', icon: Clock, label: 'Event Requests', count: eventRequests.length },
                { id: 'userApprovals', icon: Users, label: 'User Approvals', count: userApprovals.length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group flex items-center py-6 px-8 font-bold text-lg border-b-4 transition-all duration-300 flex-shrink-0 ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-900 shadow-sm'
                      : 'border-transparent text-gray-500 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-white/50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <tab.icon className={`w-6 h-6 mr-3 transition-transform duration-300 ${
                    activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'
                  }`} />
                  {tab.label}
                  <span className={`ml-3 px-2.5 py-1 rounded-full text-sm font-semibold transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {tab.count}
                  </span>
                  <ChevronRight className={`w-4 h-4 ml-2 transition-transform duration-300 ${
                    activeTab === tab.id ? 'rotate-90 opacity-100' : 'opacity-0 group-hover:opacity-50'
                  }`} />
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {/* Organizations Tab */}
            {activeTab === 'organizations' && (
              <div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-3">
                  <Building className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                  Pending Organization Verifications
                </h3>
                {pendingOrganizations.length > 0 ? (
                  <div className="space-y-6">
                    {pendingOrganizations.map((org, index) => (
                      <div 
                        key={org.id} 
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-indigo-100 dark:border-indigo-800 p-8 flex items-center justify-between transform hover:scale-[1.02] transition-all duration-300"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                              <Building className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 dark:text-white text-xl mb-1">{org.name}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{org.type}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <p className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              {org.email}
                            </p>
                            <p className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              {org.phone}
                            </p>
                            <p className="md:col-span-2 flex items-start gap-2">
                              <Building className="w-4 h-4 mt-0.5" />
                              {org.address}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3 ml-6">
                          <button
                            onClick={() => handleVerifyOrganization(org.id, true)}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white p-4 rounded-xl font-bold shadow-lg transform hover:scale-110 transition-all duration-200 group"
                            title="Verify Organization"
                          >
                            <Check className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          </button>
                          <button
                            onClick={() => handleVerifyOrganization(org.id, false)}
                            className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white p-4 rounded-xl font-bold shadow-lg transform hover:scale-110 transition-all duration-200 group"
                            title="Reject Organization"
                          >
                            <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Check className="w-12 h-12 text-green-500" />
                    </div>
                    <p className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">All caught up!</p>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">No pending organization verifications</p>
                  </div>
                )}
              </div>
            )}

            {/* Events Tab */}
            {activeTab === 'events' && (
              <div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-3">
                  <Calendar className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  Events Pending Approval
                </h3>
                {pendingEvents.length > 0 ? (
                  <div className="space-y-6">
                    {pendingEvents.map((event, index) => (
                      <div 
                        key={event.id} 
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-purple-100 dark:border-purple-800 p-8 flex items-center justify-between transform hover:scale-[1.02] transition-all duration-300"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 dark:text-white text-xl mb-3">{event.name}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-400">
                            <p className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {new Date(event.start_datetime).toLocaleDateString()}
                            </p>
                            <p className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {new Date(event.start_datetime).toLocaleTimeString()}
                            </p>
                            <p className="md:col-span-2 flex items-start gap-2">
                              <Building className="w-4 h-4 mt-0.5" />
                              {event.location}
                            </p>
                            {event.description && (
                              <p className="md:col-span-2 text-gray-700 dark:text-gray-300 line-clamp-2">
                                {event.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-3 ml-6">
                          <button
                            onClick={() => handleApproveEvent(event.id)}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
                          >
                            <Check className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectEvent(event.id)}
                            className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Check className="w-12 h-12 text-green-500" />
                    </div>
                    <p className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">All clear!</p>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">No events pending approval</p>
                  </div>
                )}
              </div>
            )}

            {/* Event Requests Tab */}
            {activeTab === 'eventRequests' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-3">
                    <Clock className="w-8 h-8 text-pink-600 dark:text-pink-400" />
                    Event Creation Requests
                  </h3>
                  {eventRequests.length > 0 ? (
                    <div className="space-y-4">
                      {eventRequests.map((request, index) => (
                        <div
                          key={request.id}
                          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-pink-100 dark:border-pink-800 p-6 transform hover:scale-[1.01] transition-all duration-300"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                {request.eventData.name}
                              </h4>
                              <p className="text-gray-600 dark:text-gray-400 mb-2">
                                Requested by: <span className="font-semibold">{request.userName}</span> ({request.userEmail})
                              </p>
                              {request.organizationName && (
                                <p className="text-gray-600 dark:text-gray-400">
                                  Organization: <span className="font-semibold">{request.organizationName}</span>
                                </p>
                              )}
                              <p className="text-gray-500 dark:text-gray-400 text-sm">
                                Submitted: {new Date(request.submittedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <button
                              onClick={() => setSelectedRequest(request)}
                              className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 transform hover:scale-110"
                            >
                              <Eye className="w-5 h-5 text-gray-500" />
                            </button>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
                              <Calendar className="w-4 h-4" />
                              {new Date(request.eventData.start_datetime).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
                              <Clock className="w-4 h-4" />
                              {new Date(request.eventData.start_datetime).toLocaleTimeString()}
                            </div>
                            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
                              <Building className="w-4 h-4" />
                              {request.eventData.location}
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <button
                              onClick={() => handleApproveEventRequest(request.id)}
                              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 px-4 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3"
                            >
                              <Check className="w-4 h-4" />
                              Approve Event
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRequest(request);
                                setRejectReason('');
                              }}
                              className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white py-3 px-4 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3"
                            >
                              <X className="w-4 h-4" />
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check className="w-12 h-12 text-green-500" />
                      </div>
                      <p className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No requests!</p>
                      <p className="text-gray-500 dark:text-gray-400 text-lg">No event creation requests pending</p>
                    </div>
                  )}
                </div>

                {/* Event Request Details Sidebar */}
                {selectedRequest && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-pink-100 dark:border-pink-800 p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                      <Eye className="w-5 h-5 text-pink-500" />
                      Event Details
                    </h3>

                    <div className="space-y-6">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                          Event Name
                        </label>
                        <p className="text-gray-900 dark:text-white font-medium">{selectedRequest.eventData.name}</p>
                      </div>

                      {selectedRequest.eventData.subtitle && (
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                            Subtitle
                          </label>
                          <p className="text-gray-900 dark:text-white">{selectedRequest.eventData.subtitle}</p>
                        </div>
                      )}

                      {selectedRequest.eventData.description && (
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                            Description
                          </label>
                          <p className="text-gray-900 dark:text-white">{selectedRequest.eventData.description}</p>
                        </div>
                      )}

                      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                          Date & Time
                        </label>
                        <p className="text-gray-900 dark:text-white">
                          {new Date(selectedRequest.eventData.start_datetime).toLocaleString()} - {' '}
                          {new Date(selectedRequest.eventData.end_datetime).toLocaleString()}
                        </p>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                          Location
                        </label>
                        <p className="text-gray-900 dark:text-white">{selectedRequest.eventData.location}</p>
                      </div>

                      {selectedRequest.eventData.capacity && (
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                            Capacity
                          </label>
                          <p className="text-gray-900 dark:text-white">{selectedRequest.eventData.capacity} attendees</p>
                        </div>
                      )}

                      {selectedRequest.eventData.tags && selectedRequest.eventData.tags.length > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                            Tags
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {selectedRequest.eventData.tags.map((tag, index) => (
                              <span key={index} className="px-3 py-1 bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 rounded-full text-sm">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Rejection Reason Input */}
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-100 dark:border-red-800">
                        <label className="block text-sm font-semibold text-red-700 dark:text-red-300 mb-2">
                          Rejection Reason
                        </label>
                        <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-red-200 dark:border-red-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-red-900/30 dark:text-white transition-all duration-200"
                          placeholder="Provide a reason for rejection..."
                        />
                        <button
                          onClick={() => handleRejectEventRequest(selectedRequest.id)}
                          disabled={!rejectReason.trim()}
                          className="w-full mt-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 px-4 rounded-lg font-semibold shadow-lg transform hover:scale-105 disabled:hover:scale-100 transition-all duration-200"
                        >
                          Confirm Rejection
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
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-3">
                    <Users className="w-8 h-8 text-green-600 dark:text-green-400" />
                    User Approval Requests
                  </h3>
                  {userApprovals.length > 0 ? (
                    <div className="space-y-4">
                      {userApprovals.map((request, index) => (
                        <div
                          key={request.id}
                          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-green-100 dark:border-green-800 p-6 transform hover:scale-[1.01] transition-all duration-300"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                                  <User className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                                    {request.userDisplayName}
                                  </h3>
                                  <p className="text-gray-600 dark:text-gray-400">
                                    {request.userEmail}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
                                  <Building className="w-4 h-4" />
                                  <span className="capitalize font-medium">{request.requestedRole}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
                                  <Clock className="w-4 h-4" />
                                  <span>{request.submittedAt.toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => setSelectedUserApproval(request)}
                              className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 transform hover:scale-110"
                            >
                              <Eye className="w-5 h-5 text-gray-500" />
                            </button>
                          </div>

                          <div className="flex gap-3">
                            <button
                              onClick={() => handleApproveUser(request.id)}
                              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 px-4 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3"
                            >
                              <Check className="w-4 h-4" />
                              Approve User
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUserApproval(request);
                                setUserRejectReason('');
                              }}
                              className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white py-3 px-4 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3"
                            >
                              <X className="w-4 h-4" />
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Check className="w-12 h-12 text-green-500" />
                      </div>
                      <p className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No approvals needed!</p>
                      <p className="text-gray-500 dark:text-gray-400 text-lg">No user approval requests pending</p>
                    </div>
                  )}
                </div>

                {/* User Approval Details Sidebar */}
                {selectedUserApproval && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-green-100 dark:border-green-800 p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                      <Eye className="w-5 h-5 text-green-500" />
                      Request Details
                    </h3>

                    <div className="space-y-6">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                          User Information
                        </label>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900 dark:text-white font-medium">{selectedUserApproval.userDisplayName}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900 dark:text-white">{selectedUserApproval.userEmail}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Building className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900 dark:text-white capitalize font-medium">{selectedUserApproval.requestedRole}</span>
                          </div>
                        </div>
                      </div>

                      {selectedUserApproval.organizationInfo && (
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
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
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-100 dark:border-red-800">
                        <label className="block text-sm font-semibold text-red-700 dark:text-red-300 mb-2">
                          Rejection Reason
                        </label>
                        <textarea
                          value={userRejectReason}
                          onChange={(e) => setUserRejectReason(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-red-200 dark:border-red-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-red-900/30 dark:text-white transition-all duration-200"
                          placeholder="Provide a reason for rejection..."
                        />
                        <button
                          onClick={() => handleRejectUser(selectedUserApproval.id)}
                          disabled={!userRejectReason.trim()}
                          className="w-full mt-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 px-4 rounded-lg font-semibold shadow-lg transform hover:scale-105 disabled:hover:scale-100 transition-all duration-200"
                        >
                          Confirm Rejection
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