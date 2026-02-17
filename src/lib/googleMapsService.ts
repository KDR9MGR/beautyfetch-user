// Production Google Maps Service
// This replaces mockLocationService.ts with real Google Maps APIs
import { supabase } from '@/integrations/supabase/client.ts';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface RealStore {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance?: number; // in miles
}

export interface DeliveryFeeSettings {
  baseFee: number;
  perMileRate: number;
  minFee: number;
  maxFee: number;
  freeDeliveryThreshold: number;
  surgeMultiplier: number;
  surgeActive: boolean;
  distanceTiers?: Array<{
    upToMiles: number;
    fee: number;
  }>;
}

// Google Maps API configuration
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Cache for Google Maps script loading
let isGoogleMapsLoaded = false;
let isGoogleMapsLoading = false;
let googleMapsLoadPromise: Promise<void> | null = null;
const geocodeCache = new Map<string, LocationCoordinates>();
const distanceCache = new Map<string, { distance: number; duration: number }[]>();
const apiCallTimestamps: Record<'geocode' | 'distance', number[]> = {
  geocode: [],
  distance: [],
};
const RATE_LIMIT_PER_MINUTE = 60;
const RATE_WINDOW_MS = 60_000;

const canCallApi = (bucket: 'geocode' | 'distance') => {
  const now = Date.now();
  apiCallTimestamps[bucket] = apiCallTimestamps[bucket].filter((t) => now - t < RATE_WINDOW_MS);
  if (apiCallTimestamps[bucket].length >= RATE_LIMIT_PER_MINUTE) {
    return false;
  }
  apiCallTimestamps[bucket].push(now);
  return true;
};

const logMapsUsage = async (action: string, details: Record<string, unknown>) => {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await (supabase as any).from('user_activity_log').insert({
    user_id: data.user.id,
    action_type: action,
    metadata: details,
  });
};

export const formatAddress = (address: unknown): string => {
  if (!address) return '';
  if (typeof address === 'string') return address;
  const addressRecord = address as Record<string, unknown>;
  const parts = [
    addressRecord.address_line_1 || addressRecord.street || addressRecord.line1,
    addressRecord.address_line_2 || addressRecord.line2,
    addressRecord.city,
    addressRecord.state,
    addressRecord.postal_code || addressRecord.zip,
    addressRecord.country,
  ]
    .filter(Boolean)
    .map((value) => String(value));
  return parts.join(', ');
};

// Load Google Maps script dynamically
export function loadGoogleMapsScript(): Promise<void> {
  if (isGoogleMapsLoaded) {
    return Promise.resolve();
  }

  if (isGoogleMapsLoading && googleMapsLoadPromise) {
    return googleMapsLoadPromise;
  }

  isGoogleMapsLoading = true;
  googleMapsLoadPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google && window.google.maps) {
      isGoogleMapsLoaded = true;
      isGoogleMapsLoading = false;
      resolve();
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      isGoogleMapsLoaded = true;
      isGoogleMapsLoading = false;
      resolve();
    };

    script.onerror = () => {
      isGoogleMapsLoading = false;
      googleMapsLoadPromise = null;
      reject(new Error('Failed to load Google Maps script'));
    };

    document.head.appendChild(script);
  });

  return googleMapsLoadPromise;
}

// Get user's current location using browser geolocation
export function getCurrentLocation(): Promise<LocationCoordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000, // 10 seconds
      maximumAge: 300000 // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        let errorMessage = 'Failed to get location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        
        reject(new Error(errorMessage));
      },
      options
    );
  });
}

// Geocode address to coordinates using Google Geocoding API
export async function geocodeAddress(address: string): Promise<LocationCoordinates> {
  try {
    const normalized = address.trim().toLowerCase();
    if (geocodeCache.has(normalized)) {
      return geocodeCache.get(normalized) as LocationCoordinates;
    }
    if (!canCallApi('geocode')) {
      throw new Error('Geocoding rate limit exceeded');
    }
    await loadGoogleMapsScript();
    
    const geocoder = new google.maps.Geocoder();
    
    return new Promise((resolve, reject) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          const location = results[0].geometry.location;
          const coords = {
            latitude: location.lat(),
            longitude: location.lng(),
          };
          geocodeCache.set(normalized, coords);
          logMapsUsage('google_maps_geocode', { address });
          resolve(coords);
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });
  } catch (error) {
    throw new Error(`Failed to geocode address: ${error}`);
  }
}

// Calculate distance between two coordinates using Haversine formula
export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 3959; // Radius of the Earth in miles
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c; // Distance in miles
  return Math.round(d * 10) / 10; // Round to 1 decimal place
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

// Get distance matrix for multiple destinations using Google Distance Matrix API
export async function getDistanceMatrix(
  origin: LocationCoordinates,
  destinations: LocationCoordinates[]
): Promise<{ distance: number; duration: number }[]> {
  try {
    const cacheKey = `${origin.latitude},${origin.longitude}:${destinations
      .map((dest) => `${dest.latitude},${dest.longitude}`)
      .join('|')}`;
    if (distanceCache.has(cacheKey)) {
      return distanceCache.get(cacheKey) as { distance: number; duration: number }[];
    }
    if (!canCallApi('distance')) {
      throw new Error('Distance Matrix rate limit exceeded');
    }
    await loadGoogleMapsScript();
    
    const service = new google.maps.DistanceMatrixService();
    
    return new Promise((resolve, reject) => {
      service.getDistanceMatrix({
        origins: [new google.maps.LatLng(origin.latitude, origin.longitude)],
        destinations: destinations.map(dest => 
          new google.maps.LatLng(dest.latitude, dest.longitude)
        ),
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.IMPERIAL,
        avoidHighways: false,
        avoidTolls: false,
      }, (response, status) => {
        if (status === google.maps.DistanceMatrixStatus.OK && response) {
          const results = response.rows[0].elements.map(element => {
            if (element.status === 'OK') {
              return {
                distance: parseFloat(element.distance.text.replace(' mi', '')),
                duration: element.duration.value / 60, // Convert seconds to minutes
              };
            }
            return { distance: 0, duration: 0 };
          });
          distanceCache.set(cacheKey, results);
          logMapsUsage('google_maps_distance', { origin, destinations });
          resolve(results);
        } else {
          reject(new Error(`Distance Matrix failed: ${status}`));
        }
      });
    });
  } catch (error) {
    // Fallback to Haversine calculation
    console.warn('Distance Matrix API failed, using fallback calculation:', error);
    return destinations.map(dest => ({
      distance: calculateDistance(origin.latitude, origin.longitude, dest.latitude, dest.longitude),
      duration: calculateDistance(origin.latitude, origin.longitude, dest.latitude, dest.longitude) * 2.5 // Rough estimate: 2.5 min per mile
    }));
  }
}

export function calculateDeliveryFeeWithSettings(distance: number, settings: DeliveryFeeSettings): number {
  const { baseFee, perMileRate, minFee, maxFee, freeDeliveryThreshold, surgeMultiplier, surgeActive, distanceTiers } =
    settings;
  let fee = baseFee + Math.max(0, distance) * perMileRate;
  if (distanceTiers && distanceTiers.length > 0) {
    const tier = distanceTiers
      .slice()
      .sort((a, b) => a.upToMiles - b.upToMiles)
      .find((t) => distance <= t.upToMiles);
    if (tier) {
      fee = tier.fee;
    }
  }
  if (surgeActive && surgeMultiplier > 1) {
    fee *= surgeMultiplier;
  }
  fee = Math.max(minFee, fee);
  fee = Math.min(maxFee, fee);
  if (freeDeliveryThreshold > 0 && fee > 0) {
    return fee;
  }
  return fee;
}

export function calculateDeliveryFee(distance: number, settings: DeliveryFeeSettings = getDefaultDeliveryFeeSettings()): number {
  return calculateDeliveryFeeWithSettings(distance, settings);
}

export const getDefaultDeliveryFeeSettings = (): DeliveryFeeSettings => ({
  baseFee: 3.99,
  perMileRate: 1.5,
  minFee: 3.99,
  maxFee: 25,
  freeDeliveryThreshold: 50,
  surgeMultiplier: 1.2,
  surgeActive: false,
  distanceTiers: [
    { upToMiles: 2, fee: 3.99 },
    { upToMiles: 5, fee: 6.99 },
    { upToMiles: 10, fee: 9.99 },
    { upToMiles: 20, fee: 14.99 },
  ],
});

export async function calculateDeliveryFeeForAddress(
  storeAddress: unknown,
  deliveryAddress: unknown,
  settings: DeliveryFeeSettings
): Promise<{ fee: number; distance: number; duration: number }> {
  const formattedStore = formatAddress(storeAddress);
  const formattedDelivery = formatAddress(deliveryAddress);
  if (!formattedStore || !formattedDelivery) {
    return { fee: settings.baseFee, distance: 0, duration: 0 };
  }
  const [storeCoords, deliveryCoords] = await Promise.all([
    geocodeAddress(formattedStore),
    geocodeAddress(formattedDelivery),
  ]);
  const [distanceResult] = await getDistanceMatrix(storeCoords, [deliveryCoords]);
  const fee = calculateDeliveryFeeWithSettings(distanceResult.distance, settings);
  return { fee, distance: distanceResult.distance, duration: distanceResult.duration };
}

// Get nearby stores from your actual store data
export async function getNearbyStores(
  userLocation: LocationCoordinates,
  stores: RealStore[],
  maxDistance: number = 25
): Promise<RealStore[]> {
  try {
    // Use Google Distance Matrix for accurate distances
    const storeCoordinates = stores.map(store => ({
      latitude: store.latitude,
      longitude: store.longitude
    }));
    
    const distances = await getDistanceMatrix(userLocation, storeCoordinates);
    
    const storesWithDistance = stores.map((store, index) => ({
      ...store,
      distance: distances[index].distance
    }));
    
    return storesWithDistance
      .filter(store => store.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);
      
  } catch (error) {
    console.warn('Failed to get distance matrix, using fallback calculation:', error);
    
    // Fallback to Haversine calculation
    const storesWithDistance = stores.map(store => ({
      ...store,
      distance: calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        store.latitude,
        store.longitude
      )
    }));
    
    return storesWithDistance
      .filter(store => store.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);
  }
}

// Store location data in localStorage for persistence
export function saveUserLocation(location: LocationCoordinates, address?: string) {
  localStorage.setItem('userLocation', JSON.stringify({
    ...location,
    address,
    timestamp: Date.now()
  }));
}

export function getUserLocation(): (LocationCoordinates & { address?: string }) | null {
  const saved = localStorage.getItem('userLocation');
  if (!saved) return null;
  
  try {
    const data = JSON.parse(saved);
    // Check if location is less than 1 hour old
    if (Date.now() - data.timestamp < 3600000) {
      return data;
    }
  } catch {
    // Invalid data
  }
  
  localStorage.removeItem('userLocation');
  return null;
}

export function clearUserLocation() {
  localStorage.removeItem('userLocation');
}

// Error handling utility
export function isGoogleMapsError(error: any): boolean {
  return error && (
    error.message?.includes('Google Maps') ||
    error.message?.includes('Geocoding') ||
    error.message?.includes('Distance Matrix')
  );
}

// Health check for Google Maps API
export async function checkGoogleMapsHealth(): Promise<boolean> {
  try {
    await loadGoogleMapsScript();
    return !!(window.google && window.google.maps);
  } catch {
    return false;
  }
}

// Google Maps types are now available via @types/google.maps 
