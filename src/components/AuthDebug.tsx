import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

const AuthDebug = () => {
  const { user, profile, loading, initialized } = useAuth();

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">Auth Debug Info:</h3>
      <div className="space-y-1">
        <div>Loading: {loading ? 'true' : 'false'}</div>
        <div>Initialized: {initialized ? 'true' : 'false'}</div>
        <div>User ID: {user?.id || 'null'}</div>
        <div>User Email: {user?.email || 'null'}</div>
        <div>Profile ID: {profile?.id || 'null'}</div>
        <div>Profile Role: {profile?.role || 'null'}</div>
        <div>Profile Name: {profile?.first_name} {profile?.last_name}</div>
        <div>Is Admin Check: {profile?.role === 'admin' ? 'true' : 'false'}</div>
      </div>
    </div>
  );
};

export default AuthDebug;