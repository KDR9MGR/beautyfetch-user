import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Truck, MapPin, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client.ts';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';

export const ActiveDeliveries = () => {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeliveries = async () => {
    if (!user) return;
    setLoading(true);
    const supabaseAny = supabase as any;
    const { data } = await supabaseAny
      .from('deliveries')
      .select('id, status, pickup_address, delivery_address, assigned_at, estimated_delivery_time, order:orders(id, order_number, total_amount)')
      .eq('driver_id', user.id)
      .in('status', ['assigned', 'picked_up', 'in_transit'])
      .order('assigned_at', { ascending: true });
    setDeliveries(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchDeliveries();
    if (!user) return;
    const supabaseAny = supabase as any;
    const channel = supabaseAny
      .channel('driver_deliveries')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'deliveries', filter: `driver_id=eq.${user.id}` },
        () => fetchDeliveries()
      )
      .subscribe();
    return () => {
      supabaseAny.removeChannel(channel);
    };
  }, [user]);

  const updateDeliveryStatus = async (deliveryId: string, status: string, notes?: string) => {
    const supabaseAny = supabase as any;
    const updates: any = { status };
    if (status === 'delivered') {
      updates.actual_delivery_time = new Date().toISOString();
    }
    const { error } = await supabaseAny.from('deliveries').update(updates).eq('id', deliveryId);
    if (error) {
      toast.error('Failed to update delivery status');
      return;
    }
    await supabaseAny.from('delivery_tracking').insert({
      delivery_id: deliveryId,
      status,
      location: {},
      notes,
    });
    toast.success('Delivery updated');
    fetchDeliveries();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Active Deliveries
          </CardTitle>
          <CardDescription>
            Manage your current delivery assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {loading && <div className="text-sm text-gray-500">Loading deliveries...</div>}
            {!loading && deliveries.length === 0 && (
              <div className="text-center py-8 text-gray-600">No active deliveries right now.</div>
            )}
            {deliveries.map((delivery) => (
              <div
                key={delivery.id}
                className="border rounded-lg p-4 space-y-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Order {delivery.order?.order_number || delivery.order?.id}</h3>
                    <p className="text-sm text-gray-600">
                      Assigned {new Date(delivery.assigned_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <Badge className="capitalize">{delivery.status.replace('_', ' ')}</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      Pickup: {delivery.pickup_address?.address_line_1 || 'Store pickup'}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      Drop-off: {delivery.delivery_address?.address_line_1 || 'Customer address'}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      ETA: {delivery.estimated_delivery_time ? new Date(delivery.estimated_delivery_time).toLocaleTimeString() : 'Pending'}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Order Details</p>
                    <p className="text-sm font-medium">Total: ${Number(delivery.order?.total_amount || 0).toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {delivery.status === 'assigned' && (
                    <>
                      <Button size="sm" className="flex-1" onClick={() => updateDeliveryStatus(delivery.id, 'picked_up')}>
                        Accept Pickup
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => updateDeliveryStatus(delivery.id, 'failed', 'Driver rejected')}>
                        Reject
                      </Button>
                    </>
                  )}
                  {delivery.status === 'picked_up' && (
                    <Button size="sm" className="flex-1" onClick={() => updateDeliveryStatus(delivery.id, 'in_transit')}>
                      Start Delivery
                    </Button>
                  )}
                  {delivery.status === 'in_transit' && (
                    <Button size="sm" className="flex-1" onClick={() => updateDeliveryStatus(delivery.id, 'delivered')}>
                      Complete Delivery
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
