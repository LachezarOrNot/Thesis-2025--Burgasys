import React, { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import EventCard from '../components/EventCard';
import { Event } from '../types';
import { databaseService } from '../services/database';
import LoadingSpinner from '../components/LoadingSpinner';
import { isToday, isThisWeek, isThisMonth } from 'date-fns';

const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
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
      const eventsData = await databaseService.getEvents({ 
        status: 'published' 
      });
      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = events.filter(event => 
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

    // Apply category filter (using tags)
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(event => 
        event.tags.some(tag => tag.toLowerCase().includes(categoryFilter.toLowerCase()))
      );
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

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'popularity':
          return (b.registeredUsers?.length || 0) - (a.registeredUsers?.length || 0);
        case 'date':
        default:
          return new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime();
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
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    Clear All
                  </button>
                )}
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
                    <option value="date">Date</option>
                    <option value="name">Name</option>
                    <option value="popularity">Popularity</option>
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
                    className="ml-2 hover:text-primary-600"
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
                    className="ml-2 hover:text-primary-600"
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
                    className="ml-2 hover:text-primary-600"
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
                    className="ml-2 hover:text-primary-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-400">
            Showing {filteredEvents.length} of {events.length} event{events.length !== 1 ? 's' : ''}
          </p>
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
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;