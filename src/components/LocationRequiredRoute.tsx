import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';
import { useLocation } from '@/contexts/LocationContext';

export function LocationRequiredRoute({ children }: { children: React.ReactNode }) {
  const { userLocation, locationSkipped } = useLocation();

  useEffect(() => {
    if (!userLocation && !locationSkipped) {
      toast.info('Please enter your delivery address to continue');
    }
  }, [locationSkipped, userLocation]);

  if (!userLocation && !locationSkipped) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
