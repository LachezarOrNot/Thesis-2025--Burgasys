import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/database';
import { Event, EventRegistration } from '../types';
import { Calendar, Users, MapPin, Plus, Clock, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [registeredEvents, setRegisteredEvents] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Load user's created events
      const createdEvents = await databaseService.getEvents({ 
        organiser_org_id: user.uid 
      });
      setUserEvents(createdEvents);

      // Load user's event registrations
      const allEvents = await databaseService.getEvents();
      const userRegistrations: EventRegistration[] = [];
      
      for (const event of allEvents) {
        const registration = await databaseService.getUserEventRegistration(event.id, user.uid);
        if (registration) {
          userRegistrations.push(registration);
        }
      }
      
      setRegisteredEvents(userRegistrations);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const upcomingEvents = userEvents.filter(event => 
    new Date(event.start_datetime) > new Date()
  );

  const totalRegistrations = registeredEvents.length;
  const uniqueLocations = new Set(userEvents.map(event => event.location)).size;

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {user?.displayName}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Here's what's happening with your events.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <Calendar className="w-8 h-8 text-primary-500 mb-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Your Events
            </h3>
            <p className="text-2xl font-bold text-primary-600">{userEvents.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {upcomingEvents.length} upcoming
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <Users className="w-8 h-8 text-primary-500 mb-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Registered Events
            </h3>
            <p className="text-2xl font-bold text-primary-600">{totalRegistrations}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Events you're attending
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <MapPin className="w-8 h-8 text-primary-500 mb-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Locations
            </h3>
            <p className="text-2xl font-bold text-primary-600">{uniqueLocations}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Unique venues
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <Activity className="w-8 h-8 text-primary-500 mb-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Role
            </h3>
            <p className="text-lg font-bold text-primary-600 capitalize">{user?.role}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Account type
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-4">
            <Link 
              to="/events/create"
              className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Event
            </Link>
            <Link 
              to="/events"
              className="border border-primary-500 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900 px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              Browse Events
            </Link>
            <Link 
              to="/calendar"
              className="border border-primary-500 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900 px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Clock className="w-5 h-5" />
              View Calendar
            </Link>
          </div>
        </div>

        {/* Recent Events */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Your Recent Events
            </h2>
            {userEvents.length > 0 && (
              <Link 
                to="/events"
                className="text-primary-500 hover:text-primary-600 text-sm font-medium"
              >
                View all
              </Link>
            )}
          </div>

          {userEvents.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="mb-4">You haven't created any events yet</p>
              <Link 
                to="/events/create"
                className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Your First Event
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userEvents.slice(0, 3).map(event => (
                <div key={event.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {event.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {new Date(event.start_datetime).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 capitalize">
                    {event.status.replace('_', ' ')}
                  </p>
                  <Link 
                    to={`/events/${event.id}`}
                    className="text-primary-500 hover:text-primary-600 text-sm font-medium mt-2 inline-block"
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;