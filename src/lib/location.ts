import { supabase } from './supabase';

type Location = {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  timestamp: number;
};

export const updateDriverLocation = async (driverId: string, location: Location) => {
  try {
    const { error } = await supabase
      .from('driver_locations')
      .upsert({
        driver_id: driverId,
        latitude: location.latitude,
        longitude: location.longitude,
        heading: location.heading,
        speed: location.speed,
        last_updated: new Date(location.timestamp).toISOString()
      });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error updating location:', error);
    return { error };
  }
};

export const startLocationTracking = (
  onLocationUpdate: (location: Location) => void,
  options: PositionOptions = {
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: 15000 // Increased timeout to 15 seconds
  }
) => {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported by this browser.');
  }

  // First try to get a quick position
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const location: Location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        heading: position.coords.heading || undefined,
        speed: position.coords.speed || undefined,
        timestamp: position.timestamp
      };
      onLocationUpdate(location);
    },
    (error) => {
      console.warn('Initial position error:', error);
    },
    { ...options, timeout: 5000 } // Quick initial attempt
  );

  // Then start watching with longer timeout
  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const location: Location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        heading: position.coords.heading || undefined,
        speed: position.coords.speed || undefined,
        timestamp: position.timestamp
      };
      onLocationUpdate(location);
    },
    (error) => {
      console.error('Error getting location:', error);
      // Let the component handle the error
      if (error.code === error.TIMEOUT) {
        console.warn('Location request timed out, retrying...');
        // The watch will automatically retry
      }
    },
    options
  );

  return () => {
    navigator.geolocation.clearWatch(watchId);
  };
};

// Function to geocode location names to coordinates
export const geocodeLocation = async (locationName: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}, Gujarat, India`
    );
    const data = await response.json();
    
    if (data && data[0]) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};