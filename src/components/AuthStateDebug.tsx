import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client.ts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Session } from '@supabase/supabase-js';

const AuthStateDebug = () => {
  const { user, profile, loading, signOut } = useAuth();
  const [sessionInfo, setSessionInfo] = useState<Session | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
    console.log(`[AuthDebug] ${message}`);
  };

  useEffect(() => {
    addLog('AuthStateDebug component mounted');
    
    // Check initial session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          addLog(`Session error: ${error.message}`);
        } else {
          setSessionInfo(session);
          addLog(`Session found: ${session ? 'Yes' : 'No'}`);
          if (session) {
            addLog(`User ID: ${session.user.id}`);
            addLog(`User email: ${session.user.email}`);
          }
        }
      } catch (err) {
        addLog(`Session check failed: ${err}`);
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      addLog(`Auth state changed: ${event}`);
      setSessionInfo(session);
      if (session) {
        addLog(`New session - User: ${session.user.email}`);
      } else {
        addLog('Session cleared');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    addLog(`Auth context - Loading: ${loading}, User: ${user ? user.email : 'null'}, Profile: ${profile ? profile.role : 'null'}`);
  }, [user, profile, loading]);

  const handleTestLogout = async () => {
    addLog('Testing logout...');
    try {
      await signOut();
      addLog('Logout completed');
    } catch (error) {
      addLog(`Logout error: ${error}`);
    }
  };

  const handleRefreshSession = async () => {
    addLog('Refreshing session...');
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        addLog(`Refresh error: ${error.message}`);
      } else {
        addLog('Session refreshed successfully');
      }
    } catch (err) {
      addLog(`Refresh failed: ${err}`);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Authentication State Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Auth Context State</h3>
              <div className="text-sm space-y-1">
                <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
                <p><strong>User:</strong> {user ? user.email : 'null'}</p>
                <p><strong>User ID:</strong> {user?.id || 'null'}</p>
                <p><strong>Profile:</strong> {profile ? JSON.stringify(profile) : 'null'}</p>
                <p><strong>Is Admin:</strong> {profile?.role === 'admin' ? 'Yes' : 'No'}</p>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Supabase Session</h3>
              <div className="text-sm space-y-1">
                <p><strong>Session exists:</strong> {sessionInfo ? 'Yes' : 'No'}</p>
                {sessionInfo && (
                  <>
                    <p><strong>Session User:</strong> {sessionInfo.user?.email}</p>
                    <p><strong>Access Token:</strong> {sessionInfo.access_token ? 'Present' : 'Missing'}</p>
                    <p><strong>Expires at:</strong> {new Date(sessionInfo.expires_at * 1000).toLocaleString()}</p>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleTestLogout} variant="destructive" size="sm">
              Test Logout
            </Button>
            <Button onClick={handleRefreshSession} variant="outline" size="sm">
              Refresh Session
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline" size="sm">
              Reload Page
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Debug Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 p-3 rounded text-sm font-mono max-h-60 overflow-y-auto">
            {logs.length === 0 ? (
              <p>No logs yet...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthStateDebug;