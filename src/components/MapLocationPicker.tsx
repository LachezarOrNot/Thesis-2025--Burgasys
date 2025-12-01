import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { MapPin, Search, Navigation, Globe } from 'lucide-react';
import L from 'leaflet';

interface MapLocationPickerProps {
  latitude: number;
  longitude: number;
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
  onLocationNameChange?: (location: string) => void;
  locationName?: string;
}

const createCustomIcon = () => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: #3B82F6;
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

// Component to handle map click events
function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Component to center map on user's location
function LocateButton({ onLocated }: { onLocated: (lat: number, lng: number) => void }) {
  const map = useMap();
  const [located, setLocated] = useState(false);

  const handleLocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newPos = { lat: latitude, lng: longitude };
          map.flyTo(newPos, 15);
          onLocated(latitude, longitude);
          setLocated(true);
          
          // Add a temporary marker
          const marker = L.marker([latitude, longitude], {
            icon: L.divIcon({
              className: 'location-marker',
              html: '<div style="background: #10B981; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
              iconSize: [16, 16],
              iconAnchor: [8, 16]
            })
          }).addTo(map);
          
          marker.bindPopup('Your current location').openPopup();
          
          // Remove marker after 5 seconds
          setTimeout(() => {
            marker.remove();
          }, 5000);
        },
        (error) => {
          alert(`Error getting location: ${error.message}`);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  };

  return (
    <div className="leaflet-top leaflet-right" style={{ zIndex: 1000 }}>
      <div className="leaflet-control leaflet-bar">
        <button
          onClick={handleLocate}
          style={{
            background: 'white',
            border: '2px solid rgba(0,0,0,0.2)',
            borderRadius: '0.375rem',
            padding: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
          title="Find my location"
        >
          <Navigation className="w-5 h-5 text-gray-700" />
        </button>
      </div>
    </div>
  );
}

const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
  latitude,
  longitude,
  onLocationSelect,
  onLocationNameChange,
  locationName,
}) => {
  const [position, setPosition] = useState<[number, number]>([latitude || 51.505, longitude || -0.09]);
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(
    latitude && longitude ? [latitude, longitude] : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(locationName || '');
  const mapRef = useRef<L.Map>(null);

  // Update position when props change
  useEffect(() => {
    if (latitude && longitude) {
      const newPos: [number, number] = [latitude, longitude];
      setPosition(newPos);
      setMarkerPosition(newPos);
    }
  }, [latitude, longitude]);

  useEffect(() => {
    setSelectedAddress(locationName || '');
  }, [locationName]);

  const handleMapClick = (lat: number, lng: number) => {
    const newPos: [number, number] = [lat, lng];
    setMarkerPosition(newPos);
    setPosition(newPos);
    
    // Reverse geocode to get address
    reverseGeocode(lat, lng);
    
    // Center map on clicked location
    if (mapRef.current) {
      mapRef.current.flyTo(newPos, 15);
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      if (data.display_name) {
        const address = data.display_name;
        setSelectedAddress(address);
        onLocationSelect(lat, lng, address);
        if (onLocationNameChange) {
          onLocationNameChange(address);
        }
      } else {
        onLocationSelect(lat, lng);
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      onLocationSelect(lat, lng);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      );
      const results = await response.json();
      setSearchResults(results);
      
      if (results.length > 0) {
        const firstResult = results[0];
        const newPos: [number, number] = [parseFloat(firstResult.lat), parseFloat(firstResult.lon)];
        setPosition(newPos);
        setMarkerPosition(newPos);
        
        if (mapRef.current) {
          mapRef.current.flyTo(newPos, 15);
        }
        
        setSelectedAddress(firstResult.display_name);
        onLocationSelect(parseFloat(firstResult.lat), parseFloat(firstResult.lon), firstResult.display_name);
        if (onLocationNameChange) {
          onLocationNameChange(firstResult.display_name);
        }
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocationSelect = (result: any) => {
    const newPos: [number, number] = [parseFloat(result.lat), parseFloat(result.lon)];
    setPosition(newPos);
    setMarkerPosition(newPos);
    setSearchResults([]);
    setSearchQuery('');
    
    if (mapRef.current) {
      mapRef.current.flyTo(newPos, 15);
    }
    
    setSelectedAddress(result.display_name);
    onLocationSelect(parseFloat(result.lat), parseFloat(result.lon), result.display_name);
    if (onLocationNameChange) {
      onLocationNameChange(result.display_name);
    }
  };

  const handleGeolocation = (lat: number, lng: number) => {
    const newPos: [number, number] = [lat, lng];
    setPosition(newPos);
    setMarkerPosition(newPos);
    reverseGeocode(lat, lng);
  };

  const handleManualCoordinateChange = (type: 'lat' | 'lng', value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    
    if (markerPosition) {
      const newPos: [number, number] = type === 'lat' 
        ? [numValue, markerPosition[1]]
        : [markerPosition[0], numValue];
      
      setMarkerPosition(newPos);
      setPosition(newPos);
      
      if (mapRef.current) {
        mapRef.current.flyTo(newPos, mapRef.current.getZoom());
      }
      
      onLocationSelect(newPos[0], newPos[1], selectedAddress);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Select Location on Map
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Click on the map to set a location or search for an address
          </p>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <MapPin className="w-4 h-4" />
          Click to place marker
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
            placeholder="Search for an address, city, or landmark..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          />
          <button
            onClick={() => handleSearch(searchQuery)}
            disabled={isSearching}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-400 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 transition-colors"
          >
            <Search className="w-4 h-4" />
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
        
        {/* Search Results */}
        {searchResults.length > 0 && (
          <div 
            className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#888 #f1f1f1'
            }}
          >
            {searchResults.map((result, index) => (
              <div
                key={index}
                onClick={() => handleLocationSelect(result)}
                className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b dark:border-gray-700 last:border-b-0 transition-colors"
              >
                <div className="font-medium text-gray-900 dark:text-white">{result.display_name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {result.lat}, {result.lon}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Map Container */}
      <div 
        className="relative h-96 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 shadow-lg"
        style={{ position: 'relative' }}
      >
        <MapContainer
          center={position}
          zoom={13}
          style={{ 
            height: '100%', 
            width: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
          ref={mapRef}
          preferCanvas={true} // Fix for WebGL issues
          maxZoom={19}
          minZoom={1}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {markerPosition && (
            <Marker 
              position={markerPosition} 
              icon={createCustomIcon()}
            >
              <Popup>
                <div style={{ padding: '8px', maxWidth: '200px' }}>
                  <div style={{ fontWeight: 600, color: '#111827' }}>Selected Location</div>
                  <div style={{ fontSize: '14px', color: '#4b5563', marginTop: '4px' }}>
                    {selectedAddress || 'No address available'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                    Coordinates: {markerPosition[0].toFixed(6)}, {markerPosition[1].toFixed(6)}
                  </div>
                </div>
              </Popup>
            </Marker>
          )}
          
          <ClickHandler onMapClick={handleMapClick} />
          <LocateButton onLocated={handleGeolocation} />
          
          {/* Add a style tag for animations */}
          <style>{`
            @keyframes pulse {
              0% { transform: scale(1); }
              50% { transform: scale(1.05); }
              100% { transform: scale(1); }
            }
            
            .custom-marker {
              animation: pulse 2s infinite;
            }
            
            /* Dark mode support for tiles */
            .dark .leaflet-tile {
              filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7);
            }
            
            /* Fix popup styles */
            .leaflet-popup-content-wrapper {
              border-radius: 8px;
              padding: 0;
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            }
            
            .leaflet-popup-content {
              margin: 0;
              line-height: 1.4;
            }
            
            .dark .leaflet-popup-content-wrapper {
              background-color: #374151;
              color: #e5e7eb;
            }
            
            .dark .leaflet-popup-tip {
              background-color: #374151;
            }
          `}</style>
        </MapContainer>
      </div>

      {/* Coordinates Input */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Latitude
          </label>
          <input
            type="number"
            step="0.000001"
            value={markerPosition ? markerPosition[0].toFixed(6) : ''}
            onChange={(e) => handleManualCoordinateChange('lat', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            placeholder="Enter latitude"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Longitude
          </label>
          <input
            type="number"
            step="0.000001"
            value={markerPosition ? markerPosition[1].toFixed(6) : ''}
            onChange={(e) => handleManualCoordinateChange('lng', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            placeholder="Enter longitude"
          />
        </div>
      </div>

      {/* Selected Location Info */}
      {selectedAddress && (
        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Globe className="w-5 h-5 text-primary-500 dark:text-primary-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-primary-800 dark:text-primary-300">Selected Location</h4>
              <p className="text-sm text-primary-700 dark:text-primary-400 mt-1">{selectedAddress}</p>
              {markerPosition && (
                <p className="text-xs text-primary-600 dark:text-primary-500 mt-2">
                  Coordinates: {markerPosition[0].toFixed(6)}, {markerPosition[1].toFixed(6)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapLocationPicker;