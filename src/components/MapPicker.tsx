import React, { useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { isGoogleMapsEnabled } from '../services/firebase';

interface MapPickerProps {
  onLocationSelect: (location: string, lat: number, lng: number) => void;
  initialLocation?: string;
  initialLat?: number;
  initialLng?: number;
}

const MapPicker: React.FC<MapPickerProps> = ({ 
  onLocationSelect, 
  initialLocation = '',
  initialLat = 0,
  initialLng = 0
}) => {
  const [location, setLocation] = useState(initialLocation);
  const [coordinates, setCoordinates] = useState({ lat: initialLat, lng: initialLng });

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLocation = e.target.value;
    setLocation(newLocation);
    onLocationSelect(newLocation, coordinates.lat, coordinates.lng);
  };

  const handleCoordinateChange = (type: 'lat' | 'lng', value: string) => {
    const numValue = parseFloat(value) || 0;
    const newCoords = { ...coordinates, [type]: numValue };
    setCoordinates(newCoords);
    onLocationSelect(location, newCoords.lat, newCoords.lng);
  };

  if (!isGoogleMapsEnabled) {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Event Location *
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              required
              value={location}
              onChange={handleLocationChange}
              placeholder="Enter event location or address..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Latitude
            </label>
            <input
              type="number"
              step="any"
              value={coordinates.lat}
              onChange={(e) => handleCoordinateChange('lat', e.target.value)}
              placeholder="0.000000"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Longitude
            </label>
            <input
              type="number"
              step="any"
              value={coordinates.lng}
              onChange={(e) => handleCoordinateChange('lng', e.target.value)}
              placeholder="0.000000"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
          <div className="flex items-start">
            <Navigation className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="text-yellow-800 dark:text-yellow-200 text-sm font-medium">
                Google Maps Not Configured
              </p>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                Add <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code> to your .env file for interactive map features.
                For now, you can enter the location manually.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Event Location *
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            required
            value={location}
            onChange={handleLocationChange}
            placeholder="Search for a location or enter address..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      <div className="w-full h-64 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg border-2 border-dashed border-blue-300 dark:border-blue-600 flex flex-col items-center justify-center">
        <Navigation className="w-12 h-12 text-blue-500 dark:text-blue-400 mb-3" />
        <p className="text-blue-700 dark:text-blue-300 font-medium">Google Maps Ready</p>
        <p className="text-blue-600 dark:text-blue-400 text-sm mt-1 text-center">
          Interactive map would be displayed here<br />
          with location search and pin placement
        </p>
      </div>

      <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-3">
        <p className="text-green-800 dark:text-green-200 text-sm">
          <strong>✓ Google Maps is configured!</strong> The map component is ready for implementation.
        </p>
      </div>
    </div>
  );
};

export default MapPicker;