import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from '@/components/ui/sonner';
import { authLogger, dbLogger, rlsLogger } from '@/lib/logger';

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: 'customer' | 'store_owner' | 'admin' | 'driver';
  created_at: string;
  updated_at: string;
}

interface Store {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  address: any;
  contact_info: any;
  business_hours: any;
  status: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  userStore: Store | null;
  loading: boolean;
  initialized: boolean;
  isAdmin: () => boolean;
  isMerchant: () => boolean;
  isDriver: () => boolean;
  isCustomer: () => boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userStore, setUserStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const fetchUserProfile = async (userId: string) => {
    authLogger.debug('Fetching user profile', { userId });
    
    try {
      // Add detailed logging for the database query
      authLogger.debug('Executing profile query', { userId, table: 'profiles' });
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle instead of single

      if (profileError) {
        authLogger.error('Profile query returned error', profileError, {
          userId,
          errorCode: profileError.code,
          errorDetails: profileError.details,
          errorHint: profileError.hint
        });
        
        if (profileError.code === 'PGRST116') {
          authLogger.warn('Profile not found in database', { userId, errorCode: profileError.code });
          setProfile(null);
          return null;
        }
        
        // Check for RLS policy violations
        if (profileError.code === '42501' || profileError.message?.includes('RLS')) {
          rlsLogger.error('RLS policy violation when fetching profile', profileError);
        } else {
          dbLogger.error('Database error fetching profile', profileError);
        }
        
        throw profileError;
      }

      authLogger.info('Profile loaded successfully', { 
        userId, 
        role: profileData.role,
        email: profileData.email,
        profileId: profileData.id
      });
      
      setProfile(profileData as Profile);
      return profileData as Profile;
    } catch (error) {
      authLogger.error('Failed to fetch user profile', error as Error, { userId });
      setProfile(null);
      return null;
    }
  };

  const fetchUserStore = async (userId: string) => {
    authLogger.debug('Fetching user store', { userId });
    
    try {
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('owner_id', userId)
        .single();

      if (storeError) {
        if (storeError.code === 'PGRST116') {
          authLogger.debug('No store found for user', { userId });
          setUserStore(null);
          return null;
        }
        
        if (storeError.code === '42501' || storeError.message?.includes('RLS')) {
          rlsLogger.error('RLS policy violation when fetching store', storeError);
        } else {
          dbLogger.error('Database error fetching store', storeError);
        }
        
        throw storeError;
      }

      authLogger.info('Store loaded successfully', { 
        userId, 
        storeId: storeData.id,
        storeName: storeData.name 
      });
      
      setUserStore(storeData as Store);
      return storeData as Store;
    } catch (error) {
      authLogger.error('Failed to fetch user store', error as Error, { userId });
      setUserStore(null);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchUserProfile(user.id);
      if (profileData?.role === 'store_owner') {
        await fetchUserStore(user.id);
      }
    }
  };

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      authLogger.debug('Getting initial session');
      
      try {
        setLoading(true);
        console.log('Getting initial session...'); // Debug log
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          authLogger.error('Session error during initialization', error);
          if (mounted) {
            setUser(null);
            setProfile(null);
            setUserStore(null);
          }
          return;
        }

        console.log('Initial session:', session?.user?.id); // Debug log
        if (session?.user && mounted) {
          authLogger.info('Initial session found', { userId: session.user.id, email: session.user.email });
          setUser(session.user);
          
          // Add extra logging for profile fetch during session restoration
          authLogger.debug('Starting profile fetch during session restoration', { userId: session.user.id });
          
          try {
            const profileData = await fetchUserProfile(session.user.id);
            
            if (profileData) {
              authLogger.info('Profile successfully loaded during session restoration', { 
                userId: session.user.id, 
                role: profileData.role,
                profileId: profileData.id 
              });
              
              if (profileData.role === 'store_owner') {
                await fetchUserStore(session.user.id);
              }
            } else {
              authLogger.error('Profile failed to load during session restoration - signing out user', undefined, { userId: session.user.id });
              // If profile fails to load, sign out the user to prevent inconsistent state
              await supabase.auth.signOut();
              setUser(null);
              setProfile(null);
              setUserStore(null);
              return;
            }
          } catch (profileError) {
               authLogger.error('Profile fetch error during session restoration - signing out user', profileError as Error, { userId: session.user.id });
               // If profile fetch throws an error, sign out the user to prevent inconsistent state
               await supabase.auth.signOut();
               setUser(null);
               setProfile(null);
               setUserStore(null);
               return;
             }
        } else {
          authLogger.debug('No initial session found');
        }
      } catch (error) {
        authLogger.error('Error getting initial session', error as Error);
        if (mounted) {
          setUser(null);
          setProfile(null);
          setUserStore(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    getInitialSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      authLogger.info('Auth state change detected', { 
        event, 
        userId: session?.user?.id,
        email: session?.user?.email 
      });
      
      setLoading(true);
      
      try {
        if (session?.user) {
          authLogger.debug('Processing user login', { userId: session.user.id });
          setUser(session.user);
          
          let profileData: Profile | null = null;
          
          try {
            profileData = await fetchUserProfile(session.user.id);
            
            if (!profileData) {
              authLogger.error('Profile not found for authenticated user - signing out', undefined, { userId: session.user.id });
              await supabase.auth.signOut();
              setUser(null);
              setProfile(null);
              setUserStore(null);
              return;
            }

            // If merchant, fetch store details
            if (profileData.role === 'store_owner') {
              await fetchUserStore(session.user.id);
            } else {
              setUserStore(null);
            }
          } catch (profileError) {
               authLogger.error('Profile fetch failed during auth state change - signing out', profileError as Error, { userId: session.user.id });
               await supabase.auth.signOut();
               setUser(null);
               setProfile(null);
               setUserStore(null);
               return;
             }

          // Handle driver application status check
          if (profileData?.role !== 'driver') {
            try {
              const { data: application } = await supabase
                .from('driver_applications')
                .select('status')
                .eq('email', session.user.email)
                .single();

              if (application) {
                switch (application.status) {
                  case 'pending':
                    toast.info("Your driver application is pending review.");
                    break;
                  case 'in_review':
                    toast.info("Your application is being reviewed.");
                    break;
                  case 'needs_info':
                    toast.warning("Additional information needed for your application.");
                    break;
                  case 'rejected':
                    toast.error("Your driver application was rejected.");
                    break;
                }
              }
            } catch (error) {
              // Silently handle driver application check errors
              console.log('Driver application check skipped:', error);
            }
          }
        } else {
          authLogger.info('User logged out, clearing session data');
          setUser(null);
          setProfile(null);
          setUserStore(null);
        }
      } catch (error) {
        authLogger.error('Error in auth state change handler', error as Error, { event });
        // Don't show error toast for session handling issues
        if (mounted) {
          setUser(null);
          setProfile(null);
          setUserStore(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const isAdmin = () => {
    const result = profile?.role === 'admin';
    authLogger.debug('isAdmin check', { profileRole: profile?.role, isAdmin: result, profileExists: !!profile });
    return result;
  };
  const isMerchant = () => profile?.role === 'store_owner';
  const isDriver = () => profile?.role === 'driver';
  const isCustomer = () => profile?.role === 'customer';

  const signOut = async () => {
    authLogger.info('Initiating user sign out');
    
    try {
      setLoading(true);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        authLogger.error('Sign out failed', error);
        toast.error('Failed to sign out');
        return;
      }
      
      // Clear all state
      setUser(null);
      setProfile(null);
      setUserStore(null);
      
      // Explicitly clear all browser storage to prevent session persistence issues
      try {
        // Clear localStorage
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('sb-ysmzgrtfxbtqkaeltoug-auth-token');
        
        // Clear sessionStorage
        sessionStorage.clear();
        
        // Clear any other auth-related items
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('supabase') || key.includes('auth') || key.includes('sb-'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        authLogger.info('Browser storage cleared successfully');
      } catch (storageError) {
        authLogger.warn('Failed to clear some browser storage', storageError as Error);
      }
      
      authLogger.info('User signed out successfully');
    } catch (error) {
      authLogger.error('Error during sign out process', error as Error);
      toast.error('Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    profile,
    userStore,
    loading,
    initialized,
    isAdmin,
    isMerchant,
    isDriver,
    isCustomer,
    signOut,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
