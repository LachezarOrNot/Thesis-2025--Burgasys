import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

interface EventMapProps {
  latitude: number;
  longitude: number;
  eventName: string;
  location: string;
  height?: string;
  interactive?: boolean;
}

const createEventIcon = () => {
  return L.divIcon({
    className: 'event-marker',
    html: `
      <div style="
        background: #EF4444;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 14px;
      ">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

const EventMap: React.FC<EventMapProps> = ({
  latitude,
  longitude,
  eventName,
  location,
  height = '300px',
  interactive = true,
}) => {
  const position: [number, number] = [latitude || 51.505, longitude || -0.09];
  
  if (!latitude || !longitude || latitude === 0 || longitude === 0) {
    return (
      <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">No location data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-md">
      <MapContainer
        center={position}
        zoom={15}
        style={{ 
          height, 
          width: '100%',
          position: 'relative'
        }}
        scrollWheelZoom={interactive}
        dragging={interactive}
        touchZoom={interactive}
        doubleClickZoom={interactive}
        preferCanvas={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} icon={createEventIcon()}>
          <Popup>
            <div style={{ padding: '8px', maxWidth: '200px' }}>
              <h3 style={{ fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}>{eventName}</h3>
              <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '8px' }}>{location}</p>
              <div style={{ fontSize: '12px', color: '#6b7280', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div>Latitude: {position[0].toFixed(6)}</div>
                <div>Longitude: {position[1].toFixed(6)}</div>
              </div>
              <div style={{ marginTop: '12px' }}>
                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${position[0]},${position[1]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    background: '#3b82f6',
                    color: 'white',
                    fontSize: '12px',
                    borderRadius: '4px',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
                >
                  Get Directions
                </a>
              </div>
            </div>
          </Popup>
        </Marker>
        
        <style>{`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          
          .event-marker {
            animation: pulse 2s infinite;
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
  );
};

export default EventMap;