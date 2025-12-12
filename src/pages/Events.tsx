import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, SlidersHorizontal, X, Calendar, MapPin, Users, Clock, Sparkles } from 'lucide-react';
import EventCard from '../components/EventCard';
import { Event } from '../types';
import { databaseService } from '../services/database';
import LoadingSpinner from '../components/LoadingSpinner';
import { isToday, isThisWeek, isThisMonth } from 'date-fns';
import { Link } from 'react-router-dom';

const Events: React.FC = () => {
  const { t } = useTranslation();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date');

  useEffect(() => {
    loadEvents();
    
    // Set up interval to check for finished events every 5 minutes
    const intervalId = setInterval(() => {
      checkAndUpdateFinishedEvents();
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [events, searchTerm, dateFilter, categoryFilter, locationFilter, sortBy]);

  const checkAndUpdateFinishedEvents = async () => {
    try {
      const now = new Date();
      const eventsToUpdate = events.filter(event => {
        try {
          const endDate = new Date(event.end_datetime);
          return event.status === 'published' && endDate < now;
        } catch {
          return false;
        }
      });

      if (eventsToUpdate.length > 0) {
        console.log(`Found ${eventsToUpdate.length} events to mark as finished`);
        
        // Update each event
        const updatePromises = eventsToUpdate.map(event => 
          databaseService.updateEvent(event.id, {
            status: 'finished',
            updatedAt: new Date()
          })
        );
        
        await Promise.all(updatePromises);
        
        // Refresh events list
        await loadEvents();
      }
    } catch (error) {
      console.error('Error checking finished events:', error);
    }
  };

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError('');
      
      // First, check and update any events that should be marked as finished
      await checkForFinishedEvents();
      
      // Then load published events
      const eventsData = await databaseService.getEvents({ 
        status: 'published' 
      });
      setEvents(eventsData);
      
    } catch (error) {
      console.error('Error loading events:', error);
      setError(t('events.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const checkForFinishedEvents = async () => {
    try {
      const now = new Date();
      
      // Get all published events
      const allPublishedEvents = await databaseService.getEvents({ 
        status: 'published' 
      });
      
      // Find events that should be finished
      const eventsToUpdate = allPublishedEvents.filter(event => {
        try {
          const endDate = new Date(event.end_datetime);
          return endDate < now;
        } catch {
          return false;
        }
      });

      if (eventsToUpdate.length > 0) {
        console.log(`Updating ${eventsToUpdate.length} events to finished status`);
        
        // Update each event
        const updatePromises = eventsToUpdate.map(event => 
          databaseService.updateEvent(event.id, {
            status: 'finished',
            updatedAt: new Date()
          })
        );
        
        await Promise.all(updatePromises);
      }
    } catch (error) {
      console.error('Error checking for finished events:', error);
    }
  };

  const applyFilters = () => {
    let filtered = events.filter(event => {
      const searchLower = searchTerm.toLowerCase();
      return (
        event.name?.toLowerCase().includes(searchLower) ||
        event.description?.toLowerCase().includes(searchLower) ||
        event.tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
        event.location?.toLowerCase().includes(searchLower)
      );
    });

    // Apply date filter with error handling - USE START_DATETIME NOT CREATED_AT
    if (dateFilter !== 'all') {
      filtered = filtered.filter(event => {
        try {
          const eventDate = new Date(event.start_datetime); // Use event start date
          if (isNaN(eventDate.getTime())) return false;
          
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

    // Apply category filter (using tags) with null safety
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(event => 
        event.tags?.some(tag => tag.toLowerCase().includes(categoryFilter.toLowerCase()))
      );
    }

    // Apply location filter with better detection
    if (locationFilter !== 'all') {
      filtered = filtered.filter(event => {
        const location = event.location?.toLowerCase() || '';
        if (locationFilter === 'online') {
          return location.includes('online') || 
                 location.includes('virtual') ||
                 location.includes('zoom') ||
                 location.includes('meet') ||
                 location.includes('webinar') ||
                 location.includes('digital');
        } else if (locationFilter === 'in-person') {
          return !location.includes('online') &&
                 !location.includes('virtual') &&
                 !location.includes('zoom') &&
                 !location.includes('meet') &&
                 !location.includes('webinar') &&
                 !location.includes('digital');
        }
        return true;
      });
    }

    // Apply sorting with error handling - USE START_DATETIME FOR DATE SORTING
    filtered.sort((a, b) => {
      try {
        switch (sortBy) {
          case 'name':
            return (a.name || '').localeCompare(b.name || '');
          case 'popularity':
            return (b.registeredUsers?.length || 0) - (a.registeredUsers?.length || 0);
          case 'date':
          default:
            const dateA = new Date(a.start_datetime).getTime(); // Use start_datetime
            const dateB = new Date(b.start_datetime).getTime(); // Use start_datetime
            return dateA - dateB;
        }
      } catch {
        return 0;
      }
    });

    setFilteredEvents(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDateFilter('all');
    setCategoryFilter('all');
    setLocationFilter('all');
    setSortBy('date');
  };

  const hasActiveFilters = searchTerm || dateFilter !== 'all' || categoryFilter !== 'all' || locationFilter !== 'all';

  // Helper function to check if an event date is in a specific timeframe
  const isEventInTimeframe = (event: Event, timeframe: string): boolean => {
    try {
      const eventDate = new Date(event.start_datetime);
      if (isNaN(eventDate.getTime())) return false;
      
      switch (timeframe) {
        case 'today':
          return isToday(eventDate);
        case 'week':
          return isThisWeek(eventDate);
        case 'month':
          return isThisMonth(eventDate);
        default:
          return false;
      }
    } catch {
      return false;
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-primary-900 py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="bg-red-50 dark:bg-red-900/80 backdrop-blur-lg border border-red-200 dark:border-red-700 rounded-2xl p-8 text-center transform hover:scale-105 transition-all duration-300">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-3">
              {t('events.errorLoading')}
            </h2>
            <p className="text-red-700 dark:text-red-300 mb-6 text-lg">{error}</p>
            <button
              onClick={loadEvents}
              className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              {t('events.tryAgain')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-primary-900 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-5xl font-black text-gray-900 dark:text-white tracking-tight bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
              {t('events.title')}
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            {t('events.subtitle')}
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 animate-fade-in-up">
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl shadow-lg border border-primary-100 dark:border-primary-700 p-6 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  {t('events.totalEvents')}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{events.length}</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl shadow-lg border border-primary-100 dark:border-primary-700 p-6 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  {t('events.thisWeekStats')}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {events.filter(event => isEventInTimeframe(event, 'week')).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl shadow-lg border border-primary-100 dark:border-primary-700 p-6 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  {t('events.onlineStats')}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {events.filter(event => {
                    const location = event.location?.toLowerCase() || '';
                    return location.includes('online') || 
                           location.includes('virtual') ||
                           location.includes('zoom') ||
                           location.includes('meet') ||
                           location.includes('webinar') ||
                           location.includes('digital');
                  }).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl shadow-lg border border-primary-100 dark:border-primary-700 p-6 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  {t('events.inPersonStats')}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {events.filter(event => {
                    const location = event.location?.toLowerCase() || '';
                    return !location.includes('online') &&
                           !location.includes('virtual') &&
                           !location.includes('zoom') &&
                           !location.includes('meet') &&
                           !location.includes('webinar') &&
                           !location.includes('digital');
                  }).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-primary-100 dark:border-primary-700 mb-10 overflow-hidden animate-fade-in-up">
          <div className="p-8">
            {/* Search Bar */}
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder={t('events.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-2xl text-lg focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all duration-300"
                />
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center gap-3"
              >
                <SlidersHorizontal className="w-5 h-5" />
                {t('events.filters')}
                {hasActiveFilters && (
                  <span className="bg-white text-primary-500 rounded-full w-6 h-6 text-xs flex items-center justify-center font-bold animate-pulse">
                    !
                  </span>
                )}
              </button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-600 animate-slide-down">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <SlidersHorizontal className="w-5 h-5 text-primary-500" />
                    {t('events.filterEvents')}
                  </h3>
                  <div className="flex gap-3">
                    {hasActiveFilters && (
                      <button
                        onClick={clearFilters}
                        className="text-primary-500 hover:text-primary-600 font-semibold flex items-center gap-2 transition-colors duration-200"
                      >
                        <X className="w-4 h-4" />
                        {t('events.clearAll')}
                      </button>
                    )}
                    <button
                      onClick={() => setShowFilters(false)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 font-medium transition-colors duration-200"
                    >
                      {t('events.hideFilters')}
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      📅 {t('events.date')}
                    </label>
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    >
                      <option value="all">{t('events.anyDate')}</option>
                      <option value="today">{t('events.today')}</option>
                      <option value="week">{t('events.thisWeek')}</option>
                      <option value="month">{t('events.thisMonth')}</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      🏷️ {t('events.category')}
                    </label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    >
                      <option value="all">{t('events.allCategories')}</option>
                      <option value="technology">{t('events.technology')}</option>
                      <option value="business">{t('events.business')}</option>
                      <option value="education">{t('events.education')}</option>
                      <option value="social">{t('events.social')}</option>
                      <option value="sports">{t('events.sports')}</option>
                      <option value="arts">{t('events.arts')}</option>
                      <option value="science">{t('events.science')}</option>
                      <option value="health">{t('events.health')}</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      📍 {t('events.location')}
                    </label>
                    <select
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    >
                      <option value="all">{t('events.anyLocation')}</option>
                      <option value="online">{t('events.online')}</option>
                      <option value="in-person">{t('events.inPerson')}</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      🔄 {t('events.sortBy')}
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    >
                      <option value="date">{t('events.dateSoonest')}</option>
                      <option value="name">{t('events.nameAZ')}</option>
                      <option value="popularity">{t('events.mostPopular')}</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <div className="mt-6 animate-fade-in">
                <div className="flex flex-wrap gap-3">
                  {searchTerm && (
                    <span className="inline-flex items-center px-4 py-2 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-sm font-medium shadow-sm transition-all duration-200 hover:scale-105">
                      🔍 "{searchTerm}"
                      <button
                        onClick={() => setSearchTerm('')}
                        className="ml-2 hover:text-primary-600 dark:hover:text-primary-300 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {dateFilter !== 'all' && (
                    <span className="inline-flex items-center px-4 py-2 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-sm font-medium shadow-sm transition-all duration-200 hover:scale-105">
                      📅 {t(`events.${dateFilter}`)}
                      <button
                        onClick={() => setDateFilter('all')}
                        className="ml-2 hover:text-primary-600 dark:hover:text-primary-300 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {categoryFilter !== 'all' && (
                    <span className="inline-flex items-center px-4 py-2 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-sm font-medium shadow-sm transition-all duration-200 hover:scale-105">
                      🏷️ {t(`events.${categoryFilter}`)}
                      <button
                        onClick={() => setCategoryFilter('all')}
                        className="ml-2 hover:text-primary-600 dark:hover:text-primary-300 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {locationFilter !== 'all' && (
                    <span className="inline-flex items-center px-4 py-2 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-sm font-medium shadow-sm transition-all duration-200 hover:scale-105">
                      📍 {t(`events.${locationFilter === 'in-person' ? 'inPerson' : locationFilter}`)}
                      <button
                        onClick={() => setLocationFilter('all')}
                        className="ml-2 hover:text-primary-600 dark:hover:text-primary-300 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Header */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {hasActiveFilters ? t('events.filteredEvents') : t('events.allEvents')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('events.showing')} <span className="font-semibold text-primary-600 dark:text-primary-400">{filteredEvents.length}</span> {t('events.of')}{' '}
              <span className="font-semibold">{events.length}</span> {t('events.events')}
            </p>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              {t('events.clearAllFilters')}
            </button>
          )}
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner />
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event, index) => (
              <div 
                key={event.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <EventCard event={event} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-32 h-32 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-16 h-16 text-primary-500" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {t('events.noEventsFound')}
            </h3>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              {hasActiveFilters 
                ? t('events.noEventsMatch') 
                : t('events.noEventsAvailable')
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  {t('events.clearAllFilters')}
                </button>
              )}
              {events.length === 0 && (
                <Link 
                  to="/events/create"
                  className="border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white dark:hover:bg-primary-600 px-8 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 flex items-center gap-3"
                >
                  <Calendar className="w-5 h-5" />
                  {t('events.createFirstEvent')}
                </Link>
              )}
              <Link 
                to="/calendar"
                className="border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-8 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
              >
                {t('events.viewCalendar')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;