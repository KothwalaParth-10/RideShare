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
    maximumAge: 30000,
    timeout: 30000
  }
) => {
  if (!navigator.geolocation) {
    console.warn('Geolocation is not supported by this browser.');
    return () => {}; // Return empty cleanup function
  }

  let retryCount = 0;
  const maxRetries = 3;

  const getPosition = (retryOptions: PositionOptions) => {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve(position);
        },
        (error) => {
          console.warn(`Geolocation attempt ${retryCount + 1} failed:`, error);
          if (retryCount < maxRetries) {
            retryCount++;
            // Exponential backoff: 5s, 10s, 20s
            setTimeout(() => {
              getPosition({ ...retryOptions, timeout: retryOptions.timeout * 2 })
                .then(resolve)
                .catch(reject);
            }, 5000 * Math.pow(2, retryCount - 1));
          } else {
            reject(error);
          }
        },
        retryOptions
      );
    });
  };

  // Start with initial position
  getPosition(options)
    .then((position) => {
      const location: Location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        heading: position.coords.heading || undefined,
        speed: position.coords.speed || undefined,
        timestamp: position.timestamp
      };
      onLocationUpdate(location);
    })
    .catch((error) => {
      console.warn('Failed to get initial position after retries:', error);
    });

  // Start watching position
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
      console.error('Error watching position:', error);
      switch (error.code) {
        case error.PERMISSION_DENIED:
          console.warn('Location permission denied');
          break;
        case error.POSITION_UNAVAILABLE:
          console.warn('Location information unavailable');
          break;
        case error.TIMEOUT:
          console.warn('Location request timed out');
          break;
        default:
          console.error('Unknown error getting location:', error);
      }
    },
    options
  );

  return () => {
    navigator.geolocation.clearWatch(watchId);
  };
};

// Function to geocode location names to coordinates
export const geocodeLocation = async (locationName: string): Promise<{ lat: number; lng: number; name: string } | null> => {
  try {
    console.log('Geocoding location:', locationName);
    
    // Use the Nominatim API with proper headers
    const nominatimUrl = 'https://nominatim.openstreetmap.org/search';
    
    // First try with Gujarat, India
    let response = await fetch(
      `${nominatimUrl}?format=json&q=${encodeURIComponent(locationName)}, Gujarat, India`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'User-Agent': 'RideShare/1.0 (https://github.com/yourusername/rideshare)',
          'Referer': window.location.origin
        },
        mode: 'cors',
        credentials: 'omit'
      }
    );
    
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`);
    }

    let data = await response.json();
    
    // If no results found with Gujarat, try without it
    if (!data || data.length === 0) {
      console.log('No results found with Gujarat, trying without location context');
      response = await fetch(
        `${nominatimUrl}?format=json&q=${encodeURIComponent(locationName)}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
            'User-Agent': 'RideShare/1.0 (https://github.com/yourusername/rideshare)',
            'Referer': window.location.origin
          },
          mode: 'cors',
          credentials: 'omit'
        }
      );
      
      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.statusText}`);
      }

      data = await response.json();
    }
    
    if (data && data[0]) {
      const coords = {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        name: data[0].display_name.split(',')[0] // Get the first part of the display name
      };
      console.log('Found coordinates:', coords);
      return coords;
    }
    
    console.warn(`No results found for location: ${locationName}`);
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};