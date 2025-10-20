import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { databaseService } from '../services/database';
import { Event } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import { format } from 'date-fns';

const PastEvents: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPastEvents();
  }, []);

  const loadPastEvents = async () => {
    try {
      setLoading(true);
      // Get all events and filter for finished ones
      const allEvents = await databaseService.getEvents();
      const pastEvents = allEvents.filter(event => 
        event.status === 'finished' || new Date(event.end_datetime) < new Date()
      );
      setEvents(pastEvents);
    } catch (error) {
      console.error('Error loading past events:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Past Events Gallery
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Browse our archive of completed events and their highlights.
        </p>

        {events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-24 h-24 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Past Events Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Check back later for completed events and reports.
            </p>
            <Link 
              to="/events"
              className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Browse Current Events
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => (
              <div key={event.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
                {event.images.length > 0 ? (
                  <img 
                    src={event.images[0]} 
                    alt={event.name}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center">
                    <Calendar className="w-12 h-12 text-primary-500 dark:text-primary-400" />
                  </div>
                )}
                
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {event.name}
                  </h3>
                  
                  {event.subtitle && (
                    <p className="text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                      {event.subtitle}
                    </p>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span className="text-sm">
                        {format(new Date(event.start_datetime), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4 mr-2" />
                      <span className="text-sm">
                        {format(new Date(event.start_datetime), 'HH:mm')} - {format(new Date(event.end_datetime), 'HH:mm')}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span className="text-sm line-clamp-1">{event.location}</span>
                    </div>
                    
                    {event.capacity && (
                      <div className="flex items-center text-gray-600 dark:text-gray-400">
                        <Users className="w-4 h-4 mr-2" />
                        <span className="text-sm">
                          {event.registeredUsers?.length || 0} / {event.capacity} attended
                        </span>
                      </div>
                    )}
                  </div>

                  {event.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {event.tags.slice(0, 3).map(tag => (
                        <span 
                          key={tag}
                          className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {event.organization?.name || 'Unknown Organizer'}
                    </span>
                    <Link 
                      to={`/events/${event.id}`}
                      className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PastEvents;