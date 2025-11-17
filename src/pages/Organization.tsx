import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { databaseService } from '../services/database';
import { Organization as OrganizationType, Event } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { MapPin, Phone, Mail, Calendar, Users, Building, ExternalLink, Sparkles, AlertCircle, ArrowLeft } from 'lucide-react';
import { format, isValid } from 'date-fns';
import { useAuth } from '../contexts/AuthContext'; // Assuming you have an auth context

const Organization: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth(); // Get current user info
  const [organization, setOrganization] = useState<OrganizationType | null>(null);
  const [organizationEvents, setOrganizationEvents] = useState<Event[]>([]);
  const [allOrganizations, setAllOrganizations] = useState<OrganizationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [viewMode, setViewMode] = useState<'single' | 'all'>('single');

  const isAdmin = user?.role === 'admin'; // Adjust based on your user role structure

  useEffect(() => {
    console.log('Organization component mounted with ID:', id);
    console.log('User is admin:', isAdmin);
    
    if (id) {
      setViewMode('single');
      loadOrganizationData(id);
    } else if (isAdmin) {
      setViewMode('all');
      loadAllOrganizations();
    } else {
      setError('No organization ID provided');
      setLoading(false);
    }
  }, [id, isAdmin]);

  const loadOrganizationData = async (orgId: string) => {
    try {
      setLoading(true);
      setError('');
      console.log('Loading organization data for ID:', orgId);
      
      // Load organization data
      const orgData = await databaseService.getOrganization(orgId);
      console.log('Organization data loaded:', orgData);
      setOrganization(orgData);

      if (!orgData) {
        setError('Organization not found');
        return;
      }

      // Load organization events
      console.log('Loading events for organization:', orgId);
      const events = await databaseService.getEvents({ organiser_org_id: orgId });
      console.log('Organization events loaded:', events.length);
      setOrganizationEvents(events);

    } catch (error) {
      console.error('Error loading organization data:', error);
      setError('Failed to load organization data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadAllOrganizations = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Loading all organizations for admin');
      
      const organizations = await databaseService.getOrganizations();
      console.log('All organizations loaded:', organizations.length);
      setAllOrganizations(organizations);

    } catch (error) {
      console.error('Error loading all organizations:', error);
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center">
                  <Building className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    All Organizations
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Administrative view - All organizations in the system
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                Admin View
              </div>
            </div>
          </div>

          {/* Organizations Grid */}
          {loading ? (
            <div className="text-center py-12">
              <LoadingSpinner />
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading organizations...</p>
            </div>
          ) : error ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Error Loading Organizations
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <button
                onClick={loadAllOrganizations}
                className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : allOrganizations.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
              <Building className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Organizations Found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                There are no organizations in the system yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allOrganizations.map(org => (
                <div key={org.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                      <Building className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate">
                        {org.name}
                      </h3>
                      <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {org.type}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                    {org.description || 'No description available.'}
                  </p>
                  
                  {/* Contact Information */}
                  <div className="space-y-2 mb-4">
                    {org.address && (
                      <div className="flex items-center text-gray-700 dark:text-gray-300 text-sm">
                        <MapPin className="w-3 h-3 mr-2 text-primary-500 flex-shrink-0" />
                        <span className="truncate">{org.address}</span>
                      </div>
                    )}
                    
                    {org.email && (
                      <div className="flex items-center text-gray-700 dark:text-gray-300 text-sm">
                        <Mail className="w-3 h-3 mr-2 text-primary-500 flex-shrink-0" />
                        <span className="truncate">{org.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-600">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ID: {org.id?.substring(0, 8)}...
                    </span>
                    <Link 
                      to={`/organizations/${org.id}`}
                      className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                    >
                      View Details
                      <ExternalLink className="w-3 h-3" />
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

  // Single organization view (existing functionality)
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading organization...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Error Loading Organization
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/organizations"
                className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Browse Organizations
              </Link>
              <Link 
                to="/events"
                className="border border-primary-500 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Browse Events
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building className="w-8 h-8 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Organization Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The organization you're looking for doesn't exist or has been removed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/organizations"
                className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Browse Organizations
              </Link>
              <Link 
                to="/events"
                className="border border-primary-500 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Browse Events
              </Link>
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Back button for admin */}
        {isAdmin && (
          <div className="mb-4">
            <Link 
              to="/organizations"
              className="inline-flex items-center gap-2 text-primary-500 hover:text-primary-600 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to All Organizations
            </Link>
          </div>
        )}

        {/* Organization Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Organization Info */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center">
                  <Building className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {organization.name}
                  </h1>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded text-sm font-medium capitalize">
                      {organization.type}
                    </span>
                    {isAdmin && (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-sm font-medium">
                        ID: {organization.id?.substring(0, 8)}...
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {organization.description || 'No description available.'}
              </p>
              
              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {organization.address && (
                  <div className="flex items-center text-gray-700 dark:text-gray-300">
                    <MapPin className="w-4 h-4 mr-3 text-primary-500" />
                    <span>{organization.address}</span>
                  </div>
                )}
                
                {organization.phone && (
                  <div className="flex items-center text-gray-700 dark:text-gray-300">
                    <Phone className="w-4 h-4 mr-3 text-primary-500" />
                    <span>{organization.phone}</span>
                  </div>
                )}
                
                {organization.email && (
                  <div className="flex items-center text-gray-700 dark:text-gray-300">
                    <Mail className="w-4 h-4 mr-3 text-primary-500" />
                    <span>{organization.email}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Stats Sidebar */}
            <div className="lg:w-64 space-y-4">
              <div className="bg-primary-500 text-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold mb-1">{organizationEvents.length}</div>
                <div className="text-sm">Total Events</div>
              </div>
              
              <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600 dark:text-green-400 mb-1">
                      {upcomingEvents.length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Upcoming</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-600 dark:text-gray-400 mb-1">
                      {pastEvents.length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Past</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Organization Events */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Events by {organization.name}
          </h2>
          
          {organizationEvents.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Events Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                This organization hasn't created any events yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {organizationEvents.map(event => (
                <div key={event.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {event.name}
                  </h3>
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{formatDateSafe(event.start_datetime)}</span>
                    </div>
                    
                    {event.location && (
                      <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      event.status === 'published' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      event.status === 'finished' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' :
                      event.status === 'draft' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {event.status.replace('_', ' ')}
                    </span>
                    
                    <Link 
                      to={`/events/${event.id}`}
                      className="text-primary-500 hover:text-primary-600 text-sm font-medium flex items-center gap-1"
                    >
                      View
                      <ExternalLink className="w-3 h-3" />
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