import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client.ts';
import { toast } from '@/components/ui/sonner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const AdminRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        setIsAdmin(profile?.role === 'admin');
      }
    };

    checkAdminStatus();
  }, [user]);

  if (loading || isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-beauty-purple"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    toast.error("You don't have admin privileges");
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

export const MerchantRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const [isMerchantOrAdmin, setIsMerchantOrAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkMerchantStatus = async () => {
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        // Allow both merchants and admins
        setIsMerchantOrAdmin(profile?.role === 'store_owner' || profile?.role === 'admin');
      }
    };

    checkMerchantStatus();
  }, [user]);

  if (loading || isMerchantOrAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-beauty-purple"></div>
      </div>
    );
  }

  if (!user || !isMerchantOrAdmin) {
    toast.error("You don't have merchant privileges");
    return <Navigate to="/merchant/login" />;
  }

  return <>{children}</>;
};

export const DriverRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const [isDriverOrAdmin, setIsDriverOrAdmin] = useState<boolean | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);

  useEffect(() => {
    const checkDriverStatus = async () => {
      if (user) {
        // Check profile role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        // Allow both drivers and admins
        setIsDriverOrAdmin(profile?.role === 'driver' || profile?.role === 'admin');

        // If not a driver or admin, check application status
        if (profile?.role !== 'driver' && profile?.role !== 'admin') {
          const { data: application } = await supabase
            .from('driver_applications')
            .select('status')
            .eq('email', user.email)
            .single();

          setApplicationStatus(application?.status || null);
        }
      }
    };

    checkDriverStatus();
  }, [user]);

  if (loading || isDriverOrAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/driver/login" />;
  }

  if (!isDriverOrAdmin) {
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
    return <Navigate to="/driver/login" />;
  }

  return <>{children}</>;
};