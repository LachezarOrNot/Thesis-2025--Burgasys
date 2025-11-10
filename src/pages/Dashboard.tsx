import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/database';
import { Event, EventRegistration } from '../types';
import { Calendar, Users, MapPin, Plus, Clock, Activity, ArrowRight } from 'lucide-react';
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-primary-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-primary-500 rounded-full animate-pulse"></div>
          </div>
          <p className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-300">Loading Your Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-primary-900 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl font-black text-gray-900 dark:text-white mb-4 tracking-tight bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            Welcome back, {user?.displayName}!
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Here's what's happening with your events.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 animate-fade-in-up">
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl shadow-lg border border-primary-100 dark:border-primary-700 p-6 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Your Events
            </h3>
            <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">{userEvents.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {upcomingEvents.length} upcoming
            </p>
          </div>
          
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl shadow-lg border border-primary-100 dark:border-primary-700 p-6 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Registered Events
            </h3>
            <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">{totalRegistrations}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Events you're attending
            </p>
          </div>
          
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl shadow-lg border border-primary-100 dark:border-primary-700 p-6 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Locations
            </h3>
            <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">{uniqueLocations}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Unique venues
            </p>
          </div>

          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl shadow-lg border border-primary-100 dark:border-primary-700 p-6 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Role
            </h3>
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 capitalize">{user?.role}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Account type
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-primary-100 dark:border-primary-700 p-8 mb-10 animate-fade-in-up">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              to="/events/create"
              className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white p-6 rounded-2xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <div className="text-lg font-bold">Create Event</div>
                <div className="text-sm opacity-90">Start a new event</div>
              </div>
            </Link>
            
            <Link 
              to="/events"
              className="border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white dark:hover:bg-primary-600 p-6 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary-500" />
              </div>
              <div className="text-left">
                <div className="text-lg font-bold">Browse Events</div>
                <div className="text-sm opacity-90">Discover events</div>
              </div>
            </Link>
            
            <Link 
              to="/calendar"
              className="border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white dark:hover:bg-primary-600 p-6 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary-500" />
              </div>
              <div className="text-left">
                <div className="text-lg font-bold">View Calendar</div>
                <div className="text-sm opacity-90">Schedule view</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Events */}
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-primary-100 dark:border-primary-700 p-8 animate-fade-in-up">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Your Recent Events
            </h2>
            {userEvents.length > 0 && (
              <Link 
                to="/events"
                className="text-primary-500 hover:text-primary-600 font-semibold flex items-center gap-2 transition-all duration-200 transform hover:scale-105"
              >
                View all
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {userEvents.length === 0 ? (
            <div className="text-center py-12 animate-fade-in">
              <div className="w-24 h-24 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-12 h-12 text-primary-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                No Events Created Yet
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                You haven't created any events yet
              </p>
              <Link 
                to="/events/create"
                className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-200 inline-flex items-center gap-3"
              >
                <Plus className="w-5 h-5" />
                Create Your First Event
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userEvents.slice(0, 3).map((event, index) => (
                <div 
                  key={event.id} 
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-primary-100 dark:border-primary-700 p-6 transform hover:scale-105 transition-all duration-300 animate-fade-in-up"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg line-clamp-2 flex-1">
                      {event.name}
                    </h3>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      event.status === 'published' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : event.status === 'draft'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {event.status.replace('_', ' ')}
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      {new Date(event.start_datetime).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      {new Date(event.start_datetime).toLocaleTimeString()}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {event.registeredUsers?.length || 0} registered
                    </span>
                    <Link 
                      to={`/events/${event.id}`}
                      className="text-primary-500 hover:text-primary-600 font-semibold text-sm flex items-center gap-1 transition-all duration-200 hover:gap-2"
                    >
                      View Details
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Registered Events Section - Only show if we have registrations */}
        {registeredEvents.length > 0 && (
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-primary-100 dark:border-primary-700 p-8 mt-10 animate-fade-in-up">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Events You're Attending
              </h2>
              <Link 
                to="/events"
                className="text-primary-500 hover:text-primary-600 font-semibold flex items-center gap-2 transition-all duration-200 transform hover:scale-105"
              >
                View all
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {registeredEvents.slice(0, 3).map((registration, index) => (
                <div 
                  key={registration.id} 
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-primary-100 dark:border-primary-700 p-6 transform hover:scale-105 transition-all duration-300 animate-fade-in-up"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-3 line-clamp-2">
                    Event #{registration.eventId}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Registered for event
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Status: {registration.status || 'registered'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;