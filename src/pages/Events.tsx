import React, { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, X, Calendar } from 'lucide-react';
import EventCard from '../components/EventCard';
import { Event } from '../types';
import { databaseService } from '../services/database';
import LoadingSpinner from '../components/LoadingSpinner';
import { isToday, isThisWeek, isThisMonth } from 'date-fns';
import { Link } from 'react-router-dom';

const Events: React.FC = () => {
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
  }, []);

  useEffect(() => {
    applyFilters();
  }, [events, searchTerm, dateFilter, categoryFilter, locationFilter, sortBy]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError('');
      const eventsData = await databaseService.getEvents({ 
        status: 'published' 
      });
      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading events:', error);
      setError('Failed to load events. Please try refreshing the page.');
    } finally {
      setLoading(false);
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

    // Apply date filter with error handling
    if (dateFilter !== 'all') {
      filtered = filtered.filter(event => {
        try {
          const eventDate = new Date(event.start_datetime);
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

    // Apply sorting with error handling
    filtered.sort((a, b) => {
      try {
        switch (sortBy) {
          case 'name':
            return (a.name || '').localeCompare(b.name || '');
          case 'popularity':
            return (b.registeredUsers?.length || 0) - (a.registeredUsers?.length || 0);
          case 'date':
          default:
            const dateA = new Date(a.start_datetime).getTime();
            const dateB = new Date(b.start_datetime).getTime();
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">
              Error Loading Events
            </h2>
            <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
            <button
              onClick={loadEvents}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Discover Events
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Find and join amazing events happening around you
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search events, topics, or locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <SlidersHorizontal className="w-5 h-5" />
              Filters
              {hasActiveFilters && (
                <span className="bg-white text-primary-500 rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  !
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
                <div className="flex gap-2">
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      Clear All
                    </button>
                  )}
                  <button
                    onClick={() => setShowFilters(false)}
                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    Hide
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date
                  </label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">Any date</option>
                    <option value="today">Today</option>
                    <option value="week">This week</option>
                    <option value="month">This month</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">All categories</option>
                    <option value="technology">Technology</option>
                    <option value="business">Business</option>
                    <option value="education">Education</option>
                    <option value="social">Social</option>
                    <option value="sports">Sports</option>
                    <option value="arts">Arts & Culture</option>
                    <option value="science">Science</option>
                    <option value="health">Health & Wellness</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location
                  </label>
                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">Any location</option>
                    <option value="online">Online</option>
                    <option value="in-person">In-person</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="date">Date (Soonest)</option>
                    <option value="name">Name (A-Z)</option>
                    <option value="popularity">Most Popular</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="mt-4 flex flex-wrap gap-2">
              {searchTerm && (
                <span className="inline-flex items-center px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-sm">
                  Search: "{searchTerm}"
                  <button
                    onClick={() => setSearchTerm('')}
                    className="ml-2 hover:text-primary-600 dark:hover:text-primary-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {dateFilter !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-sm">
                  Date: {dateFilter}
                  <button
                    onClick={() => setDateFilter('all')}
                    className="ml-2 hover:text-primary-600 dark:hover:text-primary-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {categoryFilter !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-sm">
                  Category: {categoryFilter}
                  <button
                    onClick={() => setCategoryFilter('all')}
                    className="ml-2 hover:text-primary-600 dark:hover:text-primary-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {locationFilter !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-sm">
                  Location: {locationFilter}
                  <button
                    onClick={() => setLocationFilter('all')}
                    className="ml-2 hover:text-primary-600 dark:hover:text-primary-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-6 flex justify-between items-center">
          <p className="text-gray-600 dark:text-gray-400">
            Showing {filteredEvents.length} of {events.length} event{events.length !== 1 ? 's' : ''}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Clear Filters
            </button>
          )}
        </div>

        {/* Events Grid */}
        {loading ? (
          <LoadingSpinner />
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="w-24 h-24 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No events found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {hasActiveFilters 
                ? 'Try adjusting your filters or search terms' 
                : 'Check back later for new events'
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Clear All Filters
                </button>
              )}
              {events.length === 0 && (
                <Link 
                  to="/events/create"
                  className="border border-primary-500 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900 px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Create First Event
                </Link>
              )}
              <Link 
                to="/calendar"
                className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                View Calendar
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;