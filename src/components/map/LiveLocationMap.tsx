import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import { Navigation } from 'lucide-react';
import { startLocationTracking } from '../../lib/location';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

interface LiveLocationMapProps {
  center?: [number, number];
  zoom?: number;
  fromLocation?: { lat: number; lng: number; name: string };
  toLocation?: { lat: number; lng: number; name: string };
  onLocationUpdate?: (lat: number, lng: number) => void;
}

// Custom hook for tracking user's location
const useCurrentLocation = (onLocationUpdate?: (lat: number, lng: number) => void) => {
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stopTracking = startLocationTracking(
        (loc) => {
          const newLocation: [number, number] = [loc.latitude, loc.longitude];
          setLocation(newLocation);
          onLocationUpdate?.(loc.latitude, loc.longitude);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 30000,
          timeout: 30000
        }
      );

      return () => {
        stopTracking();
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location');
    }
  }, [onLocationUpdate]);

  return location;
};

// Custom marker icons
const createIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="w-10 h-10 bg-${color}-500 rounded-full flex items-center justify-center text-white shadow-lg transform hover:scale-110 transition-transform">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8l4 4-4 4M8 12h8"/>
        </svg>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
};

const userIcon = createIcon('blue');
const fromIcon = createIcon('green');
const toIcon = createIcon('red');

// Gujarat bounds
const GUJARAT_BOUNDS: L.LatLngBoundsExpression = [
  [20.1, 68.1], // Southwest coordinates
  [24.7, 74.8]  // Northeast coordinates
];

// Component to handle routing
const RoutingMachine: React.FC<{
  from?: { lat: number; lng: number };
  to?: { lat: number; lng: number };
}> = ({ from, to }) => {
  const map = useMap();

  useEffect(() => {
    if (!from || !to) return;

    try {
      console.log('Creating route between:', from, to);
      
      // Create routing control with basic options
      const routingControl = L.Routing.control({
        waypoints: [
          L.latLng(from.lat, from.lng),
          L.latLng(to.lat, to.lng)
        ],
        routeWhileDragging: false,
        addWaypoints: false,
        fitSelectedRoutes: true,
        showAlternatives: false,
        lineOptions: {
          styles: [{ color: '#4F46E5', weight: 6 }],
          extendToWaypoints: true,
          missingRouteTolerance: 0
        }
      }).addTo(map);

      // Handle routing errors
      routingControl.on('routingerror', (error: any) => {
        console.error('Routing error:', error);
      });

      // Fit bounds to show the entire route with padding
      const bounds = L.latLngBounds([
        [from.lat, from.lng],
        [to.lat, to.lng]
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });

      return () => {
        map.removeControl(routingControl);
      };
    } catch (error) {
      console.error('Error creating routing control:', error);
    }
  }, [map, from, to]);

  return null;
};

export const LiveLocationMap: React.FC<LiveLocationMapProps> = ({
  center = [22.2587, 71.1924],
  zoom = 7,
  fromLocation,
  toLocation,
  onLocationUpdate
}) => {
  const currentLocation = useCurrentLocation(onLocationUpdate);
  const mapCenter = currentLocation || center;

  // Log when locations change
  useEffect(() => {
    if (fromLocation) {
      console.log('From location updated:', fromLocation);
    }
    if (toLocation) {
      console.log('To location updated:', toLocation);
    }
  }, [fromLocation, toLocation]);

  return (
    <MapContainer
      center={mapCenter}
      zoom={zoom}
      className="h-full w-full"
      style={{ minHeight: '400px' }}
      maxBounds={GUJARAT_BOUNDS}
      minZoom={7}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {currentLocation && (
        <Marker position={currentLocation} icon={userIcon}>
          <Popup>
            <div className="text-center">
              <Navigation className="h-5 w-5 text-blue-500 mx-auto mb-1" />
              <div className="font-semibold">Your Location</div>
            </div>
          </Popup>
        </Marker>
      )}

      {fromLocation && (
        <Marker 
          position={[fromLocation.lat, fromLocation.lng]} 
          icon={fromIcon}
          key={`from-${fromLocation.lat}-${fromLocation.lng}`}
        >
          <Popup>
            <div className="font-semibold">From: {fromLocation.name}</div>
          </Popup>
        </Marker>
      )}

      {toLocation && (
        <Marker 
          position={[toLocation.lat, toLocation.lng]} 
          icon={toIcon}
          key={`to-${toLocation.lat}-${toLocation.lng}`}
        >
          <Popup>
            <div className="font-semibold">To: {toLocation.name}</div>
          </Popup>
        </Marker>
      )}

      {fromLocation && toLocation && (
        <RoutingMachine
          from={{ lat: fromLocation.lat, lng: fromLocation.lng }}
          to={{ lat: toLocation.lat, lng: toLocation.lng }}
        />
      )}
    </MapContainer>
  );
};