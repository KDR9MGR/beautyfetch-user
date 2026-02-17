import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LogViewer from '@/components/LogViewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { authLogger, dbLogger, rlsLogger, logger, LogLevel } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client.ts';

const Debug: React.FC = () => {
  const { user, profile, userStore, loading, initialized } = useAuth();

  const testAuthFlow = async () => {
    authLogger.info('Testing authentication flow manually');
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        authLogger.error('Session test failed', error);
      } else {
        authLogger.info('Session test successful', { 
          hasSession: !!session,
          userId: session?.user?.id 
        });
      }
    } catch (error) {
      authLogger.error('Session test error', error as Error);
    }
  };

  const testProfileFetch = async () => {
    if (!user) {
      authLogger.warn('Cannot test profile fetch - no user logged in');
      return;
    }

    authLogger.info('Testing profile fetch manually');
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        if (error.code === '42501' || error.message?.includes('RLS')) {
          rlsLogger.error('RLS policy violation during manual profile test', error, { userId: user.id });
        } else {
          dbLogger.error('Database error during manual profile test', error, { userId: user.id });
        }
      } else {
        authLogger.info('Manual profile fetch successful', { 
          userId: user.id,
          role: data.role 
        });
      }
    } catch (error) {
      authLogger.error('Manual profile fetch failed', error as Error, { userId: user.id });
    }
  };

  const testRLSPolicies = async () => {
    authLogger.info('Testing RLS policies');
    
    // Test profiles table
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (error) {
        if (error.code === '42501' || error.message?.includes('RLS')) {
          rlsLogger.warn('RLS policy blocking access to profiles', { 
            table: 'profiles',
            errorCode: error.code,
            errorMessage: error.message 
          });
        } else {
          dbLogger.error('Database error accessing profiles', error, { table: 'profiles' });
        }
      } else {
        dbLogger.info('Successfully accessed profiles', { table: 'profiles', recordCount: data?.length || 0 });
      }
    } catch (error) {
      dbLogger.error('Failed to test profiles', error as Error, { table: 'profiles' });
    }

    // Test stores table
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('id')
        .limit(1);

      if (error) {
        if (error.code === '42501' || error.message?.includes('RLS')) {
          rlsLogger.warn('RLS policy blocking access to stores', { 
            table: 'stores',
            errorCode: error.code,
            errorMessage: error.message 
          });
        } else {
          dbLogger.error('Database error accessing stores', error, { table: 'stores' });
        }
      } else {
        dbLogger.info('Successfully accessed stores', { table: 'stores', recordCount: data?.length || 0 });
      }
    } catch (error) {
      dbLogger.error('Failed to test stores', error as Error, { table: 'stores' });
    }

    // Test products table
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id')
        .limit(1);

      if (error) {
        if (error.code === '42501' || error.message?.includes('RLS')) {
          rlsLogger.warn('RLS policy blocking access to products', { 
            table: 'products',
            errorCode: error.code,
            errorMessage: error.message 
          });
        } else {
          dbLogger.error('Database error accessing products', error, { table: 'products' });
        }
      } else {
        dbLogger.info('Successfully accessed products', { table: 'products', recordCount: data?.length || 0 });
      }
    } catch (error) {
      dbLogger.error('Failed to test products', error as Error, { table: 'products' });
    }
  };

  const generateTestLogs = () => {
    authLogger.debug('This is a debug message for testing');
    authLogger.info('This is an info message for testing');
    authLogger.warn('This is a warning message for testing');
    authLogger.error('This is an error message for testing', new Error('Test error'));
    
    dbLogger.info('Database operation test log');
    rlsLogger.warn('RLS policy test log');
  };

  const setLogLevel = (level: LogLevel) => {
    logger.setLogLevel(level);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Debug Dashboard</h1>
        <Badge variant={initialized ? 'default' : 'secondary'}>
          {initialized ? 'Initialized' : 'Loading'}
        </Badge>
      </div>

      {/* Authentication Status */}
      <Card>
        <CardHeader>
          <CardTitle>Authentication Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">User</label>
              <p className="text-sm">{user ? `${user.email} (${user.id.slice(0, 8)}...)` : 'Not logged in'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Profile</label>
              <p className="text-sm">{profile ? `${profile.role}` : 'No profile'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Store</label>
              <p className="text-sm">{userStore ? userStore.name : 'No store'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Loading</label>
              <p className="text-sm">{loading ? 'Yes' : 'No'}</p>
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={testAuthFlow}>
              Test Auth Flow
            </Button>
            <Button variant="outline" size="sm" onClick={testProfileFetch} disabled={!user}>
              Test Profile Fetch
            </Button>
            <Button variant="outline" size="sm" onClick={testRLSPolicies}>
              Test RLS Policies
            </Button>
            <Button variant="outline" size="sm" onClick={generateTestLogs}>
              Generate Test Logs
            </Button>
            
            <Button 
              onClick={() => {
                console.log('=== MANUAL REFRESH TEST ===');
                console.log('Current auth state before refresh:', {
                  user: user?.id,
                  profile: profile?.role,
                  loading,
                  initialized
                });
                window.location.reload();
              }} 
              variant="outline"
              size="sm"
            >
              Test Page Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Log Level Control */}
      <Card>
        <CardHeader>
          <CardTitle>Log Level Control</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setLogLevel(LogLevel.DEBUG)}>
              DEBUG
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLogLevel(LogLevel.INFO)}>
              INFO
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLogLevel(LogLevel.WARN)}>
              WARN
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLogLevel(LogLevel.ERROR)}>
              ERROR
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Log Viewer */}
      <LogViewer maxLogs={200} autoRefresh={true} refreshInterval={3000} />
    </div>
  );
};

export default Debug;