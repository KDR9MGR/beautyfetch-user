import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client.ts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthResponse, AuthError, PostgrestError } from '@supabase/supabase-js';

interface TestResult {
  healthCheck?: {
    data: unknown;
    error: PostgrestError | null;
  };
  authTest?: {
    data: {
      user: any;
      session: any;
      weakPassword?: any;
    } | null;
    error: AuthError | null;
  };
  signupTest?: {
    data: {
      user: any;
      session: any;
      weakPassword?: any;
    } | null;
    error: AuthError | null;
  };
  error?: string;
  timestamp: string;
}

const AuthTest = () => {
  const [email, setEmail] = useState('testadmin@gmail.com');
  const [password, setPassword] = useState('password123');
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('Testing Supabase connection...');
      
      // Test basic connection
      const { data: healthCheck, error: healthError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      console.log('Health check:', { healthCheck, healthError });
      
      // Test authentication
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      console.log('Auth test:', { authData, authError });
      
      setResult({
        healthCheck: { data: healthCheck, error: healthError },
        authTest: { data: authData, error: authError },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Test error:', error);
      setResult({ error: (error as Error).message, timestamp: new Date().toISOString() });
    } finally {
      setLoading(false);
    }
  };

  const testSignup = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const testEmail = `test${Date.now()}@example.com`;
      console.log('Testing signup with:', testEmail);
      
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: 'testpassword123'
      });
      
      console.log('Signup test:', { data, error });
      
      setResult({
        signupTest: { data, error },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Signup test error:', error);
      setResult({ error: (error as Error).message, timestamp: new Date().toISOString() });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Authentication Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Button 
            onClick={testConnection} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Testing...' : 'Test Login'}
          </Button>
          
          <Button 
            onClick={testSignup} 
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? 'Testing...' : 'Test Signup'}
          </Button>
        </div>
        
        {result && (
          <div className="mt-4 p-4 bg-gray-100 rounded text-xs">
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AuthTest;