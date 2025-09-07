import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client.ts';
import { toast } from '@/components/ui/sonner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const AdminRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, initialized, isAdmin } = useAuth();

  // Show loading only if not initialized or still loading
  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-beauty-purple"></div>
      </div>
    );
  }

  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Use AuthContext's isAdmin method instead of separate DB call
  if (!isAdmin()) {
    toast.error("You don't have admin privileges");
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const MerchantRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, initialized, isMerchant } = useAuth();

  // Show loading only if not initialized or still loading
  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-beauty-purple"></div>
      </div>
    );
  }

  // If not logged in, redirect to merchant auth
  if (!user) {
    return <Navigate to="/merchant/login" replace />;
  }

  // Use AuthContext's isMerchant method instead of separate DB call
  if (!isMerchant()) {
    toast.error("You don't have merchant privileges");
    return <Navigate to="/merchant/login" replace />;
  }

  return <>{children}</>;
};

export const DriverRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, initialized, isDriver } = useAuth();
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);

  useEffect(() => {
    // Only check application status if user exists but is not a driver
    const checkApplicationStatus = async () => {
      if (user && initialized && !isDriver()) {
        try {
          const { data: application } = await supabase
            .from('driver_applications')
            .select('status')
            .eq('email', user.email)
            .single();

          setApplicationStatus(application?.status || null);
        } catch (error) {
          console.log('No driver application found');
          setApplicationStatus(null);
        }
      }
    };

    if (initialized) {
      checkApplicationStatus();
    }
  }, [user, initialized, isDriver]);

  // Show loading only if not initialized or still loading
  if (!initialized || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // If not logged in, redirect to driver auth
  if (!user) {
    return <Navigate to="/driver/login" replace />;
  }

  // Use AuthContext's isDriver method instead of separate DB call
  if (!isDriver()) {
    switch (applicationStatus) {
      case 'pending':
        toast.info("Your application is pending review. We'll notify you once it's approved.");
        break;
      case 'in_review':
        toast.info("Your application is currently being reviewed. We'll notify you soon.");
        break;
      case 'needs_info':
        toast.warning("We need additional information for your application. Please check your email.");
        break;
      case 'rejected':
        toast.error("Your application has been rejected. Please check your email for details.");
        break;
      default:
        toast.error("You don't have driver privileges");
        break;
    }
    return <Navigate to="/driver/login" replace />;
  }

  return <>{children}</>;
};