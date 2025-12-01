import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/database';
import { Event } from '../types';
import { MapPin, Filter, Search, Calendar, Users, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const createEventIcon = (status: string) => {
  let color = '#3B82F6'; // Default blue
  
  switch (status) {
    case 'published':
      color = '#10B981'; // Green
      break;
    case 'draft':
      color = '#6B7280'; // Gray
      break;
    case 'pending_approval':
      color = '#F59E0B'; // Yellow
      break;
    case 'finished':
      color = '#8B5CF6'; // Purple
      break;
  }
  
  return L.divIcon({
    className: 'event-marker',
    html: `
      <div style="
        background: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24]
  });
};

const MapExplorer: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    loadEvents();
    
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.log('Geolocation error:', error.message);
        }
      );
    }
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchQuery, selectedStatus]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const allEvents = await databaseService.getEvents();
      // Filter events that have valid coordinates
      const eventsWithLocation = allEvents.filter(event => 
        event.lat && event.lng && event.lat !== 0 && event.lng !== 0
      );
      setEvents(eventsWithLocation);
      setFilteredEvents(eventsWithLocation);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = [...events];
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event =>
        event.name.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(event => event.status === selectedStatus);
    }
    
    setFilteredEvents(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'pending_approval': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'finished': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Event Map Explorer
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Explore events on an interactive map. Click on markers for details.
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search events by name, location, or tags..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">All Events</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="finished">Finished</option>
                </select>
              </div>
              
              <button
                onClick={() => setSelectedStatus('all')}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                Clear Filters
              </button>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredEvents.length} of {events.length} events with location data
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Container */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden h-[600px]">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No events found with location data</p>
                  </div>
                </div>
              ) : (
                <MapContainer
                  center={userLocation || [51.505, -0.09]}
                  zoom={3}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  {/* User location marker */}
                  {userLocation && (
                    <Marker position={userLocation}>
                      <Popup>
                        <div className="p-2">
                          <div className="font-semibold text-gray-900">Your Location</div>
                          <div className="text-sm text-gray-600">
                            {userLocation[0].toFixed(6)}, {userLocation[1].toFixed(6)}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                  
                  {/* Event markers */}
                  {filteredEvents.map((event) => (
                    <Marker
                      key={event.id}
                      position={[event.lat, event.lng]}
                      icon={createEventIcon(event.status)}
                    >
                      <Popup>
                        <div className="p-2 max-w-xs">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-gray-900 text-sm">{event.name}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                              {event.status.replace('_', ' ')}
                            </span>
                          </div>
                          
                          {event.subtitle && (
                            <p className="text-sm text-gray-600 mb-2">{event.subtitle}</p>
                          )}
                          
                          <div className="space-y-2 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(event.start_datetime)}</span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate">{event.location}</span>
                            </div>
                            
                            {event.capacity && (
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                <span>{event.registeredUsers?.length || 0} / {event.capacity} registered</span>
                              </div>
                            )}
                            
                            {event.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {event.tags.slice(0, 3).map(tag => (
                                  <span key={tag} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs">
                                    {tag}
                                  </span>
                                ))}
                                {event.tags.length > 3 && (
                                  <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs">
                                    +{event.tags.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={() => navigate(`/events/${event.id}`)}
                              className="flex-1 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-xs rounded text-center"
                            >
                              View Details
                            </button>
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${event.lat},${event.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs rounded"
                            >
                              Directions
                            </a>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              )}
            </div>
          </div>

          {/* Event List Sidebar */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Events on Map ({filteredEvents.length})
              </h3>
              
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading events...</p>
                  </div>
                ) : filteredEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">No events match your filters</p>
                  </div>
                ) : (
                  filteredEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                      onClick={() => navigate(`/events/${event.id}`)}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                          {event.name}
                        </h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                          {event.status.charAt(0).toUpperCase() + event.status.slice(1).replace('_', ' ')}
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate mb-2">
                        {event.location}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(event.start_datetime).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>
                            {event.lat.toFixed(2)}, {event.lng.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Map Legend */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Map Legend</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Published Events</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Pending Approval</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Draft Events</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Finished Events</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gray-400 border border-white"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Your Location</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/events/create')}
                  className="w-full px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium"
                >
                  Create New Event
                </button>
                <button
                  onClick={loadEvents}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium"
                >
                  Refresh Map Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapExplorer;