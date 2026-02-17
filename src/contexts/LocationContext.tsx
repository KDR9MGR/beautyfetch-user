import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  LocationCoordinates, 
  getUserLocation, 
  saveUserLocation, 
  clearUserLocation,
  calculateDeliveryFee,
  getCurrentLocation,
  geocodeAddress,
  getNearbyStores,
  getLocationServiceStatus,
  type UnifiedStore
} from '@/lib/hybridLocationService';

interface LocationContextType {
  // Location state
  userLocation: (LocationCoordinates & { address?: string }) | null;
  nearbyStores: UnifiedStore[];
  showLocationModal: boolean;
  locationSkipped: boolean;
  
  // Location actions
  setUserLocation: (location: LocationCoordinates & { address?: string }) => void;
  skipLocation: () => void;
  clearLocation: () => void;
  refreshNearbyStores: () => void;
  setShowLocationModal: (show: boolean) => void;
  
  // Utility functions
  getDeliveryFee: (distance?: number) => number;
  getDistanceToStore: (storeId: string) => number | null;
  
  // Service status
  getServiceStatus: () => ReturnType<typeof getLocationServiceStatus>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [userLocation, setUserLocationState] = useState<(LocationCoordinates & { address?: string }) | null>(null);
  const [nearbyStores, setNearbyStores] = useState<UnifiedStore[]>([]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationSkipped, setLocationSkipped] = useState(false);

  // Load saved location on mount
  useEffect(() => {
    const skipped = localStorage.getItem('hasSkippedLocation') === 'true';
    setLocationSkipped(skipped);

    const savedLocation = getUserLocation();
    if (savedLocation) {
      setUserLocationState(savedLocation);
      updateNearbyStores(savedLocation);
    } else {
      // Show location modal if no saved location
      const hasSeenModal = localStorage.getItem('hasSeenLocationModal');
      if (!hasSeenModal && !skipped) {
        setShowLocationModal(true);
      }
    }
  }, []);

  const updateNearbyStores = async (location: LocationCoordinates) => {
    try {
      const stores = await getNearbyStores(location, 25); // 25 mile radius
      setNearbyStores(stores);
    } catch (error) {
      console.error('Failed to update nearby stores:', error);
      setNearbyStores([]);
    }
  };

  const setUserLocation = (location: LocationCoordinates & { address?: string }) => {
    setUserLocationState(location);
    saveUserLocation(location, location.address);
    updateNearbyStores(location);
    setShowLocationModal(false);
    setLocationSkipped(false);
    localStorage.setItem('hasSeenLocationModal', 'true');
    localStorage.removeItem('hasSkippedLocation');
  };

  const skipLocation = () => {
    setLocationSkipped(true);
    setShowLocationModal(false);
    localStorage.setItem('hasSeenLocationModal', 'true');
    localStorage.setItem('hasSkippedLocation', 'true');
  };

  const clearLocation = () => {
    setUserLocationState(null);
    setNearbyStores([]);
    clearUserLocation();
    setLocationSkipped(false);
    localStorage.removeItem('hasSeenLocationModal');
    localStorage.removeItem('hasSkippedLocation');
  };

  const refreshNearbyStores = () => {
    if (userLocation) {
      updateNearbyStores(userLocation);
    }
  };

  const getDeliveryFee = (distance?: number): number => {
    if (!distance && nearbyStores.length > 0) {
      // Use distance to nearest store
      distance = nearbyStores[0].distance;
    }
    
    return distance ? calculateDeliveryFee(distance) : 3.99; // Default base fee
  };

  const getDistanceToStore = (storeId: string): number | null => {
    const store = nearbyStores.find(s => s.id === storeId);
    return store?.distance || null;
  };

  const contextValue: LocationContextType = {
    userLocation,
    nearbyStores,
    showLocationModal,
    locationSkipped,
    setUserLocation,
    skipLocation,
    clearLocation,
    refreshNearbyStores,
    setShowLocationModal,
    getDeliveryFee,
    getDistanceToStore,
    getServiceStatus: getLocationServiceStatus,
  };

  return (
    <LocationContext.Provider value={contextValue}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}; 
