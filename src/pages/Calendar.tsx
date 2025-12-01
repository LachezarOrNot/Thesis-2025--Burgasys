import React, { useEffect, useState } from 'react';
import { databaseService } from '../services/database';
import { Event } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { format, isToday, isThisWeek, isThisMonth, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, MapPin, Clock, Users, Filter, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Calendar: React.FC = () => {
  const { t } = useTranslation();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [events, dateFilter, locationFilter]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError('');
      const eventsData = await databaseService.getEvents();
      
      const upcomingEvents = eventsData.filter(event => {
        try {
          const eventDate = new Date(event.start_datetime);
          const isValidDate = !isNaN(eventDate.getTime());
          return event.status === 'published' && isValidDate && eventDate >= new Date();
        } catch {
          return false;
        }
      });
      
      setEvents(upcomingEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      setError(t('events.errorLoading') || 'Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...events];

    if (dateFilter !== 'all') {
      filtered = filtered.filter(event => {
        try {
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
        } catch {
          return false;
        }
      });
    }

    if (locationFilter !== 'all') {
      filtered = filtered.filter(event => {
        const location = event.location?.toLowerCase() || '';
        if (locationFilter === 'online') {
          return location.includes('online') || 
                 location.includes('virtual') ||
                 location.includes('zoom') ||
                 location.includes('meet') ||
                 location.includes('webinar');
        } else if (locationFilter === 'in-person') {
          return !location.includes('online') &&
                 !location.includes('virtual') &&
                 !location.includes('zoom') &&
                 !location.includes('meet') &&
                 !location.includes('webinar');
        }
        return true;
      });
    }

    setFilteredEvents(filtered);
  };

  const groupedEvents: Record<string, Event[]> = {};
  filteredEvents.forEach(event => {
    try {
      const dateKey = format(new Date(event.start_datetime), 'yyyy-MM-dd');
      if (!groupedEvents[dateKey]) {
        groupedEvents[dateKey] = [];
      }
      groupedEvents[dateKey].push(event);
    } catch (error) {
      console.error('Error processing event date:', error);
    }
  });

  const sortedDates = Object.keys(groupedEvents).sort();

  const getEventCountByDate = (date: string) => {
    return groupedEvents[date]?.length || 0;
  };

  const clearFilters = () => {
    setDateFilter('all');
    setLocationFilter('all');
  };

  const hasActiveFilters = dateFilter !== 'all' || locationFilter !== 'all';

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">
              {t('events.errorLoading')}
            </h2>
            <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
            <button
              onClick={loadEvents}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {t('events.tryAgain')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('navigation.calendarView')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('calendar.subtitle', 'Browse and filter upcoming events by date and location')}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Filter className="w-5 h-5" />
                {t('events.filters')}
                {hasActiveFilters && (
                  <span className="bg-primary-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                    !
                  </span>
                )}
              </h3>
            </div>
            <div className="flex gap-2">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  {t('events.clearAll')}
                </button>
              )}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="text-sm text-primary-500 hover:text-primary-600"
              >
                {showFilters ? t('events.hideFilters') : t('events.filters')}
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4 dark:border-gray-600">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('events.date')}
                </label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">{t('events.anyDate')}</option>
                  <option value="today">{t('events.today')}</option>
                  <option value="week">{t('events.thisWeek')}</option>
                  <option value="month">{t('events.thisMonth')}</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('events.location')}
                </label>
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">{t('events.anyLocation')}</option>
                  <option value="online">{t('events.online')}</option>
                  <option value="in-person">{t('events.inPerson')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('common.results', 'Results')}
                </label>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 text-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {filteredEvents.length} {t('events.events')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {hasActiveFilters && (
            <div className="mt-4 flex flex-wrap gap-2">
              {dateFilter !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-sm">
                  {t('events.date')}: {t(`events.${dateFilter}`)}
                  <button
                    onClick={() => setDateFilter('all')}
                    className="ml-2 hover:text-primary-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {locationFilter !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-sm">
                  {t('events.location')}: {t(`events.${locationFilter}`)}
                  <button
                    onClick={() => setLocationFilter('all')}
                    className="ml-2 hover:text-primary-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : sortedDates.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
            <CalendarIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {events.length === 0 ? t('calendar.noEvents', 'No Upcoming Events') : t('events.noEventsFound')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {events.length === 0 
                ? t('calendar.noEventsDescription', "There are no upcoming events scheduled yet.") 
                : t('events.noEventsMatch')
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {events.length === 0 && (
                <Link 
                  to="/events/create"
                  className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                >
                  <CalendarIcon className="w-4 h-4" />
                  {t('events.createFirstEvent')}
                </Link>
              )}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="border border-primary-500 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900 px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  {t('events.clearAllFilters')}
                </button>
              )}
              <Link 
                to="/events"
                className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                {t('navigation.browseEvents')}
              </Link>
            </div>
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
                    {getEventCountByDate(date)} {t('events.events')}
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
                              {event.images && event.images.length > 0 ? (
                                <img 
                                  src={event.images[0]} 
                                  alt={event.name}
                                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
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
                                  <p className="text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
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
                                    <span className="max-w-xs truncate">{event.location || t('eventDetail.locationNotSpecified')}</span>
                                  </div>

                                  {event.capacity && (
                                    <div className="flex items-center gap-1">
                                      <Users className="w-4 h-4" />
                                      <span>
                                        {(event.registeredUsers?.length || 0)} / {event.capacity}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {event.tags && event.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {event.tags.slice(0, 3).map(tag => (
                                      <span 
                                        key={tag}
                                        className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded text-xs"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                    {event.tags.length > 3 && (
                                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs">
                                        +{event.tags.length - 3} {t('common.more', 'more')}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 lg:items-end">
                            <Link 
                              to={`/events/${event.id}`}
                              className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap text-center"
                            >
                              {t('eventCard.viewDetails')}
                            </Link>
                            <span className="text-xs text-gray-500 dark:text-gray-400 text-center lg:text-right">
                              {t('common.by')} {event.organization?.name || t('eventCard.unknownOrganizer')}
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