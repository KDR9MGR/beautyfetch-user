import { supabase } from '@/integrations/supabase/client.ts';
import { toast } from '@/components/ui/sonner';

export interface SessionValidationResult {
  isValid: boolean;
  shouldLogout?: boolean;
  reason?: string;
}

export const validateSession = async (): Promise<SessionValidationResult> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return { 
        isValid: false, 
        shouldLogout: true,
        reason: 'No active session' 
      };
    }

    // Check if token is expired
    const expiresAt = session.expires_at ? new Date(session.expires_at * 1000) : null;
    if (expiresAt && expiresAt < new Date()) {
      return { 
        isValid: false, 
        shouldLogout: true,
        reason: 'Session expired' 
      };
    }

    // Check for concurrent sessions (optional security feature)
    const { data: sessionData, error: sessionError } = await supabase
      .from('user_sessions')
      .select('id, created_at, device_info')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!sessionError && sessionData && sessionData.length > 3) {
      // Too many active sessions - invalidate oldest ones
      const oldestSessions = sessionData.slice(3);
      for (const oldSession of oldestSessions) {
        await supabase
          .from('user_sessions')
          .delete()
          .eq('id', oldSession.id);
      }
    }

    return { isValid: true };
  } catch (error) {
    console.error('Session validation error:', error);
    return { 
      isValid: false, 
      shouldLogout: true,
      reason: 'Session validation failed' 
    };
  }
};

export const handleTokenExpiry = async (): Promise<void> => {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Token refresh error:', error);
      // Force logout if refresh fails
      await supabase.auth.signOut();
      toast.error('Session expired. Please log in again.');
      return;
    }

    if (data?.session) {
      toast.success('Session refreshed successfully');
    }
  } catch (error) {
    console.error('Token refresh exception:', error);
    await supabase.auth.signOut();
    toast.error('Session expired. Please log in again.');
  }
};

export const preventMultipleSessions = async (userId: string): Promise<void> => {
  try {
    // Get current device info
    const deviceInfo = {
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    // Check for existing sessions
    const { data: existingSessions, error } = await supabase
      .from('user_sessions')
      .select('id, device_info')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && existingSessions && existingSessions.length > 0) {
      // Check if this is a different device/session
      const currentDeviceFingerprint = JSON.stringify(deviceInfo);
      const isSameDevice = existingSessions.some(session => 
        JSON.stringify(session.device_info) === currentDeviceFingerprint
      );

      if (!isSameDevice && existingSessions.length >= 2) {
        // Multiple sessions detected - show warning
        toast.warning('Multiple sessions detected. For security, only the most recent session will remain active.');
        
        // Keep only the most recent session
        const sessionsToDelete = existingSessions.slice(1);
        for (const session of sessionsToDelete) {
          await supabase
            .from('user_sessions')
            .delete()
            .eq('id', session.id);
        }
      }
    }

    // Create new session record
    await supabase
      .from('user_sessions')
      .insert({
        user_id: userId,
        device_info: deviceInfo,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Multiple session prevention error:', error);
  }
};

export const setupSessionMonitoring = (): void => {
  // Monitor for session changes
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'TOKEN_REFRESHED') {
      console.log('Token refreshed successfully');
    } else if (event === 'SIGNED_OUT') {
      console.log('User signed out');
    } else if (event === 'USER_UPDATED') {
      console.log('User data updated');
    }
  });

  // Set up periodic session validation
  setInterval(async () => {
    const result = await validateSession();
    if (!result.isValid && result.shouldLogout) {
      await supabase.auth.signOut();
      window.location.href = '/login';
    }
  }, 5 * 60 * 1000); // Check every 5 minutes
};