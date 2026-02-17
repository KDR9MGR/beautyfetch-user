import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin, Navigation, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client.ts';

export const RouteMap = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [deliveries, setDeliveries] = useState<any[]>([]);

  useEffect(() => {
    const fetchRoute = async () => {
      if (!user) return;
      setLoading(true);
      const supabaseAny = supabase as any;
      const { data } = await supabaseAny
        .from('deliveries')
        .select('id, status, pickup_address, delivery_address, estimated_delivery_time')
        .eq('driver_id', user.id)
        .in('status', ['assigned', 'picked_up', 'in_transit'])
        .order('assigned_at', { ascending: true });
      setDeliveries(data || []);
      setLoading(false);
    };
    fetchRoute();
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Route Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Today's Route
          </CardTitle>
          <CardDescription>Your delivery route for today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{deliveries.length}</div>
              <p className="text-sm text-gray-500">Total Stops</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">—</div>
              <p className="text-sm text-gray-500">Miles</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {deliveries.length > 0
                  ? `${deliveries.length * 20}m`
                  : '—'}
              </div>
              <p className="text-sm text-gray-500">Est. Time</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Route Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Interactive map will be displayed here</p>
              <p className="text-sm text-gray-400">Map integration coming soon</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delivery List */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Deliveries</CardTitle>
          <CardDescription>Your scheduled deliveries</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && <div className="text-sm text-gray-500">Loading route...</div>}
          {!loading && deliveries.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p>No deliveries scheduled for today</p>
              <p className="text-sm text-gray-400">Check back later for new assignments</p>
            </div>
          )}
          {!loading && deliveries.length > 0 && (
            <div className="space-y-3">
              {deliveries.map((delivery) => (
                <div key={delivery.id} className="border rounded-lg p-3">
                  <p className="text-sm font-medium">Pickup: {delivery.pickup_address?.address_line_1 || 'Store pickup'}</p>
                  <p className="text-sm text-gray-600">
                    Drop-off: {delivery.delivery_address?.address_line_1 || 'Customer address'}
                  </p>
                  <p className="text-xs text-gray-500">
                    ETA: {delivery.estimated_delivery_time ? new Date(delivery.estimated_delivery_time).toLocaleTimeString() : 'Pending'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
