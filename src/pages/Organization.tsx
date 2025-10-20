import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { databaseService } from '../services/database';
import { Organization as OrganizationType, Event } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { MapPin, Phone, Mail, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';

const Organization: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [organization, setOrganization] = useState<OrganizationType | null>(null);
  const [organizationEvents, setOrganizationEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadOrganizationData(id);
    }
  }, [id]);

  const loadOrganizationData = async (orgId: string) => {
    try {
      setLoading(true);
      
      // Load organization data
      const orgData = await databaseService.getOrganization(orgId);
      setOrganization(orgData);

      // Load organization events
      const events = await databaseService.getEvents({ organiser_org_id: orgId });
      setOrganizationEvents(events);
    } catch (error) {
      console.error('Error loading organization data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Organization Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The organization you're looking for doesn't exist or has been removed.
          </p>
          <Link 
            to="/events"
            className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Browse Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Organization Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {organization.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
                {organization.description || 'No description available.'}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <Users className="w-5 h-5 mr-3 text-primary-500" />
                  <span className="capitalize">{organization.type}</span>
                </div>
                
                {organization.address && (
                  <div className="flex items-center text-gray-700 dark:text-gray-300">
                    <MapPin className="w-5 h-5 mr-3 text-primary-500" />
                    <span>{organization.address}</span>
                  </div>
                )}
                
                {organization.phone && (
                  <div className="flex items-center text-gray-700 dark:text-gray-300">
                    <Phone className="w-5 h-5 mr-3 text-primary-500" />
                    <span>{organization.phone}</span>
                  </div>
                )}
                
                {organization.email && (
                  <div className="flex items-center text-gray-700 dark:text-gray-300">
                    <Mail className="w-5 h-5 mr-3 text-primary-500" />
                    <span>{organization.email}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col items-center gap-4">
              <span className="inline-block px-4 py-2 bg-primary-500 text-white rounded-lg font-semibold">
                ID: {organization.id}
              </span>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">
                  {organizationEvents.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Events
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Organization Events */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Events by {organization.name}
          </h2>
          
          {organizationEvents.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
              <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Events Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                This organization hasn't created any events yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {organizationEvents.map(event => (
                <div key={event.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {event.name}
                  </h3>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span className="text-sm">
                        {format(new Date(event.start_datetime), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span className="text-sm line-clamp-1">{event.location}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      event.status === 'published' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      event.status === 'finished' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' :
                      event.status === 'draft' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {event.status.replace('_', ' ')}
                    </span>
                    
                    <Link 
                      to={`/events/${event.id}`}
                      className="text-primary-500 hover:text-primary-600 text-sm font-medium"
                    >
                      View Details
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