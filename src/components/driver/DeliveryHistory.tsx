import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client.ts';
import { useAuth } from '@/contexts/AuthContext';

export const DeliveryHistory = () => {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      setLoading(true);
      const supabaseAny = supabase as any;
      const { data } = await supabaseAny
        .from('deliveries')
        .select('id,status,delivery_address,actual_delivery_time,order:orders(order_number,total_amount)')
        .eq('driver_id', user.id)
        .eq('status', 'delivered')
        .order('actual_delivery_time', { ascending: false });
      setDeliveries(data || []);
      setLoading(false);
    };
    fetchHistory();
  }, [user]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Delivery History
          </CardTitle>
          <CardDescription>
            View your past delivery history and earnings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading && <div className="text-sm text-gray-500">Loading delivery history...</div>}
            {!loading && deliveries.length === 0 && (
              <div className="text-center py-8 text-gray-600">No delivery history yet.</div>
            )}
            {deliveries.map((delivery) => (
              <div key={delivery.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Order {delivery.order?.order_number || delivery.order?.id}</p>
                    <p className="text-sm text-gray-600">
                      Delivered {delivery.actual_delivery_time ? new Date(delivery.actual_delivery_time).toLocaleString() : '—'}
                    </p>
                  </div>
                  <Badge className="capitalize">{delivery.status}</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Drop-off: {delivery.delivery_address?.address_line_1 || 'Customer address'}
                </p>
                <p className="text-sm font-medium">Order Total: ${Number(delivery.order?.total_amount || 0).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
