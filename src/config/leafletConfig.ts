import L from 'leaflet';

// Fix Leaflet default icon paths (only run once)
let isLeafletConfigured = false;

export const configureLeaflet = () => {
  if (isLeafletConfigured) return;
  
  // Delete the default icon URL getter
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  
  // Set new default icon URLs
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
  
  isLeafletConfigured = true;
};