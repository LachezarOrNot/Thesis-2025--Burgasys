import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { databaseService } from '../services/database';
import { Organization as OrganizationType, Event, User } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { MapPin, Phone, Mail, Calendar, Users, Building, ExternalLink, Sparkles, AlertCircle, ArrowLeft, Eye, Clock, TrendingUp } from 'lucide-react';
import { format, isValid } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

const Organization: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [organization, setOrganization] = useState<OrganizationType | null>(null);
  const [organizationEvents, setOrganizationEvents] = useState<Event[]>([]);
  const [allOrganizations, setAllOrganizations] = useState<OrganizationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [viewMode, setViewMode] = useState<'single' | 'all'>('single');

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (id) {
      setViewMode('single');
      loadOrganizationData(id);
    } else if (isAdmin) {
      setViewMode('all');
      loadAllOrganizations();
    } else if (user?.affiliatedOrganizationId) {
      navigate(`/organizations/${user.affiliatedOrganizationId}`, { replace: true });
    } else {
      setError('No organization ID provided and you are not affiliated with any organization');
      setLoading(false);
    }
  }, [id, isAdmin, user, navigate]);

  const loadOrganizationData = async (orgId: string) => {
    try {
      setLoading(true);
      setError('');
      
      const orgData = await databaseService.getOrganization(orgId);
      
      if (!orgData) {
        setError('Organization not found');
        setLoading(false);
        return;
      }

      const canViewOrganization = isAdmin || user?.affiliatedOrganizationId === orgId;

      if (!canViewOrganization) {
        setError('You do not have permission to view this organization');
        setLoading(false);
        return;
      }

      setOrganization(orgData);

      const events = await databaseService.getEvents({ organiser_org_id: orgId });
      setOrganizationEvents(events);

    } catch (error) {
      setError('Failed to load organization data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadAllOrganizations = async () => {
    try {
      setLoading(true);
      setError('');
      
      const organizations = await databaseService.getOrganizations();
      
      let filteredOrganizations = organizations;
      if (!isAdmin && user?.affiliatedOrganizationId) {
        filteredOrganizations = organizations.filter(org => 
          org.id === user.affiliatedOrganizationId
        );
      }
      
      setAllOrganizations(filteredOrganizations);

    } catch (error) {
      setError('Failed to load organizations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDateSafe = (date: any): string => {
    if (!date) return 'Date not set';
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return isValid(dateObj) ? format(dateObj, 'MMM dd, yyyy') : 'Invalid date';
    } catch {
      return 'Date error';
    }
  };

  // Admin view - All organizations
  if (viewMode === 'all' && isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-primary-900 py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-primary-100 dark:border-primary-700 p-8 mb-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center">
                  <Building className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-gray-900 dark:text-white">
                    All Organizations
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
                    Administrative view - Manage all organizations in the system
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl text-sm font-semibold">
                <Sparkles className="w-4 h-4" />
                Admin View
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-4 text-center border border-primary-100 dark:border-primary-700">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{allOrganizations.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Organizations</div>
              </div>
              <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-4 text-center border border-primary-100 dark:border-primary-700">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {allOrganizations.filter(org => org.verified).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Verified</div>
              </div>
              <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-4 text-center border border-primary-100 dark:border-primary-700">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {allOrganizations.filter(org => !org.verified).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
              </div>
              <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-4 text-center border border-primary-100 dark:border-primary-700">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {allOrganizations.filter(org => org.type === 'firm').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Companies</div>
              </div>
            </div>
          </div>

          {/* Organizations Grid */}
          {loading ? (
            <div className="text-center py-20">
              <LoadingSpinner />
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Loading organizations...</p>
            </div>
          ) : error ? (
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl p-12 text-center border border-primary-100 dark:border-primary-700">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Error Loading Organizations
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">{error}</p>
              <button
                onClick={loadAllOrganizations}
                className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                Try Again
              </button>
            </div>
          ) : allOrganizations.length === 0 ? (
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl p-12 text-center border border-primary-100 dark:border-primary-700">
              <div className="w-24 h-24 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Building className="w-12 h-12 text-primary-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                No Organizations Found
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {isAdmin 
                  ? 'There are no organizations in the system yet.'
                  : 'You are not affiliated with any organization yet.'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {allOrganizations.map((org, index) => (
                <div 
                  key={org.id} 
                  className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-lg border border-primary-100 dark:border-primary-700 p-6 hover:scale-105 transition-all duration-300"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                      <Building className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg truncate">
                        {org.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-full text-xs font-semibold capitalize">
                          {org.type}
                        </span>
                        {org.verified ? (
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold">
                            Verified
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 rounded-full text-xs font-semibold">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2 leading-relaxed">
                    {org.description || 'No description available.'}
                  </p>
                  
                  {/* Contact Information */}
                  <div className="space-y-2 mb-4">
                    {org.address && (
                      <div className="flex items-center text-gray-700 dark:text-gray-300 text-sm">
                        <MapPin className="w-4 h-4 mr-3 text-primary-500 flex-shrink-0" />
                        <span className="truncate">{org.address}</span>
                      </div>
                    )}
                    
                    {org.email && (
                      <div className="flex items-center text-gray-700 dark:text-gray-300 text-sm">
                        <Mail className="w-4 h-4 mr-3 text-primary-500 flex-shrink-0" />
                        <span className="truncate">{org.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-600">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {org.id?.substring(0, 8)}...
                    </span>
                    <Link 
                      to={`/organizations/${org.id}`}
                      className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-105 flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Single organization view
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-primary-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Loading organization...</p>
        </div>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-primary-900 py-8">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl p-12 border border-primary-100 dark:border-primary-700">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {error ? 'Error Loading Organization' : 'Organization Not Found'}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              {error || "The organization you're looking for doesn't exist or has been removed."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAdmin ? (
                <Link 
                  to="/organizations"
                  className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  Browse All Organizations
                </Link>
              ) : user?.affiliatedOrganizationId ? (
                <Link 
                  to={`/organizations/${user.affiliatedOrganizationId}`}
                  className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  Go to My Organization
                </Link>
              ) : (
                <Link 
                  to="/events"
                  className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  Browse Events
                </Link>
              )}
              <button
                onClick={() => window.location.reload()}
                className="border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const upcomingEvents = organizationEvents.filter(event => {
    try {
      return new Date(event.start_datetime) > new Date();
    } catch {
      return false;
    }
  });
  
  const pastEvents = organizationEvents.filter(event => {
    try {
      return new Date(event.start_datetime) <= new Date();
    } catch {
      return false;
    }
  });

  const isUserAffiliated = user?.affiliatedOrganizationId === organization.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-primary-900 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Back button for admin */}
        {isAdmin && (
          <div className="mb-6">
            <Link 
              to="/organizations"
              className="inline-flex items-center gap-3 text-primary-500 hover:text-primary-600 font-semibold transition-all duration-300 hover:translate-x-1"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to All Organizations
            </Link>
          </div>
        )}

        {/* Organization Header */}
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-primary-100 dark:border-primary-700 p-8 mb-10">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Organization Info */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center">
                  <Building className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">
                    {organization.name}
                  </h1>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-full text-sm font-semibold capitalize">
                      {organization.type}
                    </span>
                    {organization.verified && (
                      <span className="px-3 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-full text-sm font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                    {!organization.verified && (
                      <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 rounded-full text-sm font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Pending Verification
                      </span>
                    )}
                    {isAdmin && (
                      <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-sm font-medium font-mono">
                        ID: {organization.id}
                      </span>
                    )}
                    {isUserAffiliated && (
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-sm font-semibold">
                        My Organization
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                {organization.description || 'No description available.'}
              </p>
              
              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {organization.address && (
                  <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">Address</div>
                      <div className="text-gray-600 dark:text-gray-400">{organization.address}</div>
                    </div>
                  </div>
                )}
                
                {organization.phone && (
                  <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                      <Phone className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">Phone</div>
                      <div className="text-gray-600 dark:text-gray-400">{organization.phone}</div>
                    </div>
                  </div>
                )}
                
                {organization.email && (
                  <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                      <Mail className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">Email</div>
                      <div className="text-gray-600 dark:text-gray-400">{organization.email}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Stats Sidebar */}
            <div className="lg:w-80 space-y-6">
              <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-6 text-white text-center">
                <div className="text-3xl font-bold mb-2">{organizationEvents.length}</div>
                <div className="text-sm opacity-90">Total Events</div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                      {upcomingEvents.length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Upcoming Events</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600 dark:text-gray-400 mb-1">
                      {pastEvents.length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Past Events</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Organization Events */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-primary-500" />
              Events by {organization.name}
            </h2>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {organizationEvents.length} event{organizationEvents.length !== 1 ? 's' : ''}
            </div>
          </div>
          
          {organizationEvents.length === 0 ? (
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl p-12 text-center border border-primary-100 dark:border-primary-700">
              <div className="w-24 h-24 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-12 h-12 text-primary-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                No Events Found
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                This organization hasn't created any events yet.
              </p>
              {isUserAffiliated && (
                <Link
                  to="/events/create"
                  className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 hover:scale-105 inline-block"
                >
                  Create First Event
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {organizationEvents.map((event, index) => (
                <div 
                  key={event.id} 
                  className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-lg border border-primary-100 dark:border-primary-700 p-6 hover:scale-105 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 flex-1">
                      {event.name}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      event.status === 'published' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      event.status === 'finished' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' :
                      event.status === 'draft' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {event.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4 mr-3 text-primary-500" />
                      <span className="text-sm font-medium">{formatDateSafe(event.start_datetime)}</span>
                    </div>
                    
                    {event.location && (
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <MapPin className="w-4 h-4 mr-3 text-primary-500" />
                        <span className="text-sm font-medium line-clamp-1">{event.location}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {event.registeredUsers?.length || 0} registered
                    </span>
                    <Link 
                      to={`/events/${event.id}`}
                      className="text-primary-500 hover:text-primary-600 font-semibold text-sm flex items-center gap-2 transition-all duration-200 hover:gap-3"
                    >
                      View Details
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Organization;