import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client.ts';
import { User } from '@supabase/supabase-js';
import { toast } from '@/components/ui/sonner';
import { authLogger, dbLogger, rlsLogger } from '@/lib/logger';
import { validateSession, handleTokenExpiry, preventMultipleSessions, setupSessionMonitoring } from '@/utils/sessionSecurity';

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: 'customer' | 'store_owner' | 'admin' | 'driver' | null;
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
  address: {
    street?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
  } | null;
  contact_info: {
    email?: string;
    phone?: string;
    website?: string;
  } | null;
  business_hours: {
    [key: string]: {
      open?: string;
      close?: string;
      closed?: boolean;
    };
  } | null;
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
  const [isActivelyLoggingIn, setIsActivelyLoggingIn] = useState(false);


  const fetchUserProfileAndStore = async (userId: string) => {
    authLogger.debug('Fetching user profile and store data', { userId });
    
    try {
      // PERFORMANCE OPTIMIZATION: Fetch complete profile data in one query with timeout
      // This reduces the number of database calls and improves login speed
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      // Add timeout to prevent hanging requests
      // Use reasonable timeouts for different scenarios
      const isInitialLogin = !profile; // If no profile exists, this is likely initial login
      const timeoutDuration = isInitialLogin ? 10000 : 30000; // 10s for login, 30s for tab switching
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), timeoutDuration)
      );
      
      const result = await Promise.race([
        profilePromise,
        timeoutPromise
      ]);
      const { data: profileData, error: profileError } = result as { data: Profile | null; error: any };
        
      if (profileError) {
        authLogger.error('Profile query returned error', profileError, { userId });
        if (profileError.code === '42501' || profileError.message?.includes('RLS')) {
          rlsLogger.error('RLS policy violation when fetching profile', profileError);
        } else {
          dbLogger.error('Database error fetching profile', profileError);
        }
        throw profileError;
      }

      if (!profileData) {
        authLogger.warn('Profile not found in database', { userId });
        setProfile(null);
        setUserStore(null);
        return null;
      }

      // Set complete profile immediately
      const completeProfile = profileData as Profile;
      setProfile(completeProfile);
      
      authLogger.info('Profile loaded successfully', { 
        userId, 
        role: profileData.role,
        email: profileData.email,
        profileId: profileData.id
      });
      
      // Only fetch store data if user is a merchant - do this asynchronously to not block login
       if (profileData.role === 'store_owner') {
         // Fetch store data in background without blocking the UI
         (async () => {
           try {
             const { data: storeData, error: storeError } = await supabase
               .from('stores')
               .select('*')
               .eq('owner_id', userId)
               .maybeSingle();
               
             if (storeError && storeError.code !== 'PGRST116') {
               authLogger.error('Store query returned error', storeError, { userId });
             } else if (storeData) {
               authLogger.info('Store loaded successfully', { 
                 userId, 
                 storeId: storeData.id,
                 storeName: storeData.name 
               });
               setUserStore(storeData as Store);
             } else {
               setUserStore(null);
             }
           } catch (error) {
             authLogger.error('Failed to fetch store data', error as Error, { userId });
             setUserStore(null);
           }
         })();
       } else {
         setUserStore(null);
       }
      
      return completeProfile;
    } catch (error) {
      authLogger.error('Failed to fetch user data', error as Error, { userId });
      setProfile(null);
      setUserStore(null);
      return null;
    }
  };


  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfileAndStore(user.id);
    }
  };

  useEffect(() => {
    let mounted = true;
    let isTabVisible = true;

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
      authLogger.debug('Tab visibility changed', { isVisible: isTabVisible });
      
      // When tab becomes visible again, refresh session if needed
      if (isTabVisible && !isActivelyLoggingIn) {
        authLogger.debug('Tab became visible, checking session validity');
        // Small delay to ensure tab is fully active
        setTimeout(async () => {
          // Double check we're not in the middle of logging in
          if (isActivelyLoggingIn) {
            authLogger.debug('Skipping tab visibility session check - login in progress');
            return;
          }
          
          try {
            // Set loading state for better UX during session check
            setLoading(true);
            
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
              authLogger.warn('Session error after tab became visible', error);
              // Don't immediately clear auth state for network errors
              if (!error.message?.includes('Network') && !error.message?.includes('fetch')) {
                setUser(null);
                setProfile(null);
                setUserStore(null);
              }
              setLoading(false);
              return;
            }
            
            if (session?.user && !user) {
              // Session exists but user state is null - restore it
              authLogger.info('Restoring session after tab became visible', { userId: session.user.id });
              setUser(session.user);
              
              try {
                await fetchUserProfileAndStore(session.user.id);
              } catch (profileError) {
                authLogger.error('Profile fetch failed during session restoration from tab switch', profileError as Error);
                // Don't clear user state, just log the error and continue
                // The user can still access the app with basic session data
              }
            } else if (!session && user) {
              // User state exists but no session - clear it
              authLogger.warn('Session lost while tab was hidden, clearing auth state');
              setUser(null);
              setProfile(null);
              setUserStore(null);
            }
            
            // Always clear loading state
            setLoading(false);
          } catch (error) {
            authLogger.error('Error checking session after tab visibility change', error as Error);
            setLoading(false);
          }
        }, 100);
      }
    };

    // Handle window focus/blur events
    const handleFocus = () => {
      authLogger.debug('Window gained focus');
    };

    const handleBlur = () => {
      authLogger.debug('Window lost focus');
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // Get initial session
    const getInitialSession = async () => {
      authLogger.debug('Getting initial session');
      
      try {
        setLoading(true);
        console.log('Getting initial session...'); // Debug log
        
        // Get session with longer timeout and better error handling
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          authLogger.error('Session error during initialization', error);
          
          // Handle different types of session errors
          if (error.message?.includes('Invalid Refresh Token') || 
              error.code === 'refresh_token_not_found' ||
              error.message?.includes('refresh_token_not_found')) {
            authLogger.warn('Invalid refresh token detected, clearing auth state');
            
            // Clear all browser storage
            localStorage.removeItem('supabase.auth.token');
            localStorage.removeItem('sb-ysmzgrtfxbtqkaeltoug-auth-token');
            localStorage.removeItem('cached_user_role');
            
            // Clear any other auth-related items
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && (key.includes('supabase') || key.includes('auth') || key.includes('sb-'))) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
            
            await supabase.auth.signOut();
          } else if (error.message?.includes('Network') || error.message?.includes('fetch')) {
            // Network errors - don't clear auth state, just log and continue
            authLogger.warn('Network error during session initialization, will retry on tab focus', error);
          }
          
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
          
          // CRITICAL FIX: Wait for profile to load completely before setting initialized=true
          // This ensures isAdmin() has the correct data when components first render
          authLogger.debug('Starting SYNCHRONOUS profile fetch during session restoration', { userId: session.user.id });
          
          try {
            const profileData = await fetchUserProfileAndStore(session.user.id);
            
            if (!profileData) {
              authLogger.warn('Profile failed to load during session restoration, but keeping session', { userId: session.user.id });
              // Clear cached role if profile fails to load
              localStorage.removeItem('cached_user_role');
              setProfile(null);
            } else {
              // Cache the role immediately for faster subsequent checks
              if (profileData.role) {
                localStorage.setItem('cached_user_role', profileData.role);
                authLogger.debug('Cached user role during session restoration', { role: profileData.role });
              }
            }
           } catch (profileError) {
                authLogger.error('Profile fetch error during session restoration, but keeping session', profileError as Error, { userId: session.user.id });
                // Clear cached role if profile fails to load
                localStorage.removeItem('cached_user_role');
                setProfile(null);
             }
        } else {
          authLogger.debug('No initial session found');
          // Clear cached role when no session
          localStorage.removeItem('cached_user_role');
        }
      } catch (error) {
        authLogger.error('Error getting initial session', error as Error);
        if (mounted) {
          setUser(null);
          setProfile(null);
          setUserStore(null);
          localStorage.removeItem('cached_user_role');
        }
      } finally {
        if (mounted) {
          console.log('AuthContext: Setting loading=false, initialized=true in getInitialSession');
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    getInitialSession();

    // Setup session security monitoring
    setupSessionMonitoring();

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
          setIsActivelyLoggingIn(true); // Mark login as active
          setUser(session.user);
          
          // Validate session security
          const sessionValidation = await validateSession();
          if (!sessionValidation.isValid && sessionValidation.shouldLogout) {
            await supabase.auth.signOut();
            setUser(null);
            setProfile(null);
            setUserStore(null);
            toast.error(sessionValidation.reason || 'Session validation failed');
            return;
          }
          
          // Prevent multiple sessions
          if (session.user.id) {
            await preventMultipleSessions(session.user.id);
          }
          
          // Set loading to false immediately after setting user to improve perceived performance
          // This allows the UI to show the logged-in state while profile loads in background
          setLoading(false);
          setInitialized(true);
          
          // Show immediate feedback to user
          toast.success('Authentication successful', {
            description: 'Loading your profile...',
            duration: 2000
          });
          
          let profileData: Profile | null = null;
          
          // Try to get cached profile first for immediate display
          const cachedProfile = localStorage.getItem(`profile_${session.user.id}`);
          if (cachedProfile) {
            try {
              profileData = JSON.parse(cachedProfile);
              setProfile(profileData);
              authLogger.debug('Using cached profile data', { userId: session.user.id });
              
              // Show success message for cached profile
              toast.success('Welcome back!', {
                description: 'Profile loaded from cache',
                duration: 1500
              });
            } catch (error) {
              authLogger.warn('Failed to parse cached profile', error as Error);
              localStorage.removeItem(`profile_${session.user.id}`);
            }
          }
          
          // Fetch fresh profile data in background
          try {
            const freshProfile = await fetchUserProfileAndStore(session.user.id);
            if (freshProfile) {
              profileData = freshProfile;
              // Cache the profile for faster subsequent loads
              localStorage.setItem(`profile_${session.user.id}`, JSON.stringify(freshProfile));
              
              // Only show success if we didn't have cached data
              if (!cachedProfile) {
                toast.success('Profile loaded successfully');
              }
              
              // Cache the role immediately for faster subsequent checks
              if (freshProfile.role) {
                localStorage.setItem('cached_user_role', freshProfile.role);
                authLogger.debug('Cached user role during login', { role: freshProfile.role });
              }
            } else {
              authLogger.warn('Profile not found for authenticated user, but keeping session', { userId: session.user.id });
              // Clear cached role if profile fails to load
              localStorage.removeItem('cached_user_role');
              if (!cachedProfile) {
                setProfile(null);
              }
            }
          } catch (profileError) {
               // Check if the error is due to invalid refresh token
               const errorMessage = (profileError as any)?.message || '';
               if (errorMessage.includes('Invalid Refresh Token') || errorMessage.includes('refresh_token_not_found')) {
                 authLogger.warn('Invalid refresh token during profile fetch, clearing auth state');
                 
                 // Clear storage and sign out
                 localStorage.removeItem('supabase.auth.token');
                 localStorage.removeItem('sb-ysmzgrtfxbtqkaeltoug-auth-token');
                 localStorage.removeItem('cached_user_role');
                 
                 await supabase.auth.signOut();
                 setUser(null);
                 setProfile(null);
                 setUserStore(null);
                 setIsActivelyLoggingIn(false); // Clear login state
                 return;
               }
               
               authLogger.error('Profile fetch failed during auth state change, but keeping session', profileError as Error, { userId: session.user.id });
               // Clear cached role if profile fails to load
               localStorage.removeItem('cached_user_role');
               
               // If we have cached data, continue with that
               if (!profileData) {
                 toast.error('Failed to load profile data', {
                   description: 'Please try refreshing the page'
                 });
                 setProfile(null);
               }
             }
             
             // Mark login as complete
             setIsActivelyLoggingIn(false);

          // Handle driver application status check asynchronously to not block sign-in
          if (profileData?.role !== 'driver') {
            // Run this check in background without blocking the sign-in process
            setTimeout(async () => {
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
            }, 1000); // Delay by 1 second to not block sign-in
          }
        } else {
          authLogger.info('User logged out, clearing session data');
          setUser(null);
          setProfile(null);
          setUserStore(null);
          setIsActivelyLoggingIn(false); // Clear login state on logout
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
        if (mounted && !session?.user) {
          // Only set loading=false here if there's no user (logout case)
          // For login case, we set it earlier for better performance
          console.log('AuthContext: Setting loading=false, initialized=true for logout case');
          setLoading(false);
          setInitialized(true);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      
      // Clean up event listeners
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  const isAdmin = () => {
    // Check current profile first - this is the most reliable source
    if (profile?.role === 'admin') {
      authLogger.debug('isAdmin check - profile loaded, user is admin', { profileRole: profile.role });
      return true;
    }
    
    // If profile is temporarily null but user exists, check cached role
    // This handles the case during page refresh when session is restored but profile is still loading
    if (user && !profile) {
      const cachedRole = localStorage.getItem('cached_user_role');
      const result = cachedRole === 'admin';
      authLogger.debug('isAdmin check using cached role during profile loading', { 
        cachedRole, 
        isAdmin: result, 
        userExists: !!user, 
        profileExists: !!profile,
        loading,
        initialized
      });
      return result;
    }
    
    // If we reach here, either no user or profile loaded and not admin
    authLogger.debug('isAdmin check - not admin', { 
      profileRole: profile?.role, 
      isAdmin: false, 
      profileExists: !!profile, 
      userExists: !!user,
      loading,
      initialized
    });
    return false;
  };
  const isMerchant = () => profile?.role === 'store_owner' || profile?.role === 'admin';
  const isDriver = () => profile?.role === 'driver' || profile?.role === 'admin';
  const isCustomer = () => profile?.role === 'customer';

  const signOut = async () => {
    authLogger.info('Initiating user sign out');
    
    try {
      // Clear state immediately to prevent UI hanging
      setUser(null);
      setProfile(null);
      setUserStore(null);
      setLoading(false);
      
      // Clear browser storage immediately and thoroughly
      try {
        // Clear all session storage including admin session markers
        sessionStorage.removeItem('admin-session-active');
        sessionStorage.clear();
        
        // Clear specific auth-related localStorage items
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('sb-ysmzgrtfxbtqkaeltoug-auth-token');
        localStorage.removeItem('userLocation');
        localStorage.removeItem('hasSeenLocationModal');
        localStorage.removeItem('debug-session-id');
        localStorage.removeItem('cached_user_role');
        
        // Clear all supabase and auth related keys
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('supabase') || key.includes('auth') || key.includes('sb-') || key.includes('session'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        authLogger.info('Browser storage cleared successfully');
      } catch (storageError) {
        authLogger.warn('Failed to clear some browser storage', storageError as Error);
      }
      
      // Sign out from Supabase properly
      try {
        await supabase.auth.signOut();
        authLogger.info('User signed out from Supabase successfully');
      } catch (error) {
        authLogger.error('Sign out from Supabase failed', error as Error);
        // Continue with logout even if Supabase signOut fails
      }
      
      authLogger.info('User signed out successfully');
      
    } catch (error) {
      authLogger.error('Error during sign out process', error as Error);
      // Ensure state is cleared even if there's an error
      setUser(null);
      setProfile(null);
      setUserStore(null);
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
