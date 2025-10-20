import React, { useEffect, useState } from 'react';
import { databaseService } from '../services/database';
import { Event, EventStatus } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { format, isToday, isThisWeek, isThisMonth, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, MapPin, Clock, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const Calendar: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [events, dateFilter, locationFilter]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const eventsData = await databaseService.getEvents();
      // Only show published and upcoming events in calendar
      const upcomingEvents = eventsData.filter(event => 
        event.status === 'published' && new Date(event.start_datetime) >= new Date()
      );
      setEvents(upcomingEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...events];

    // Apply date filter
    if (dateFilter !== 'all') {
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.start_datetime);
        switch (dateFilter) {
          case 'today':
            return isToday(eventDate);
          case 'week':
            return isThisWeek(eventDate);
          case 'month':
            return isThisMonth(eventDate);
          default:
            return true;
        }
      });
    }

    // Apply location filter
    if (locationFilter !== 'all') {
      filtered = filtered.filter(event => {
        if (locationFilter === 'online') {
          return event.location.toLowerCase().includes('online') || 
                 event.location.toLowerCase().includes('virtual') ||
                 event.location.toLowerCase().includes('zoom');
        } else if (locationFilter === 'in-person') {
          return !event.location.toLowerCase().includes('online') &&
                 !event.location.toLowerCase().includes('virtual') &&
                 !event.location.toLowerCase().includes('zoom');
        }
        return true;
      });
    }

    setFilteredEvents(filtered);
  };

  // Group events by date
  const groupedEvents: Record<string, Event[]> = {};
  filteredEvents.forEach(event => {
    const dateKey = format(new Date(event.start_datetime), 'yyyy-MM-dd');
    if (!groupedEvents[dateKey]) {
      groupedEvents[dateKey] = [];
    }
    groupedEvents[dateKey].push(event);
  });

  // Sort dates chronologically
  const sortedDates = Object.keys(groupedEvents).sort();

  const getEventCountByDate = (date: string) => {
    return groupedEvents[date]?.length || 0;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Event Calendar
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Browse and filter upcoming events by date and location
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Range
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Upcoming Dates</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Location Type
              </label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Locations</option>
                <option value="online">Online Events</option>
                <option value="in-person">In-Person Events</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Results
              </label>
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 text-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
                </span>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : sortedDates.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
            <CalendarIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Events Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {events.length === 0 
                ? "There are no upcoming events scheduled yet." 
                : "No events match your current filters."
              }
            </p>
            {events.length === 0 && (
              <Link 
                to="/events/create"
                className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
              >
                <CalendarIcon className="w-4 h-4" />
                Create First Event
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {sortedDates.map(date => (
              <div key={date} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <div className="bg-primary-500 text-white px-6 py-4">
                  <h3 className="text-xl font-semibold">
                    {format(parseISO(date), 'EEEE, MMMM do, yyyy')}
                  </h3>
                  <p className="text-primary-100 text-sm">
                    {getEventCountByDate(date)} event{getEventCountByDate(date) !== 1 ? 's' : ''} scheduled
                  </p>
                </div>
                
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {groupedEvents[date]
                    .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())
                    .map(event => (
                      <div key={event.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start gap-4">
                              {event.images.length > 0 ? (
                                <img 
                                  src={event.images[0]} 
                                  alt={event.name}
                                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="w-16 h-16 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
                                  <CalendarIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                                </div>
                              )}
                              
                              <div className="flex-1">
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                  {event.name}
                                </h4>
                                
                                {event.subtitle && (
                                  <p className="text-gray-600 dark:text-gray-300 mb-2 line-clamp-1">
                                    {event.subtitle}
                                  </p>
                                )}

                                <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span>
                                      {format(new Date(event.start_datetime), 'HH:mm')} - {format(new Date(event.end_datetime), 'HH:mm')}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    <span className="max-w-xs truncate">{event.location}</span>
                                  </div>

                                  {event.capacity && (
                                    <div className="flex items-center gap-1">
                                      <Users className="w-4 h-4" />
                                      <span>
                                        {event.registeredUsers?.length || 0} / {event.capacity}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {event.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
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
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 lg:items-end">
                            <Link 
                              to={`/events/${event.id}`}
                              className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                            >
                              View Details
                            </Link>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              By {event.organization?.name || 'Unknown Organizer'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;