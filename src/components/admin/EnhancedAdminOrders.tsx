import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Eye, Search, Archive, AlertTriangle, XCircle, DollarSign, 
  TrendingUp, Store, RefreshCw, User, Package, Clock, MapPin 
} from "lucide-react";
import { 
  adminOverrideOrderStatus, 
  adminTriggerRefund, 
  adminEmergencyCancel, 
  adminReassignDelivery,
  adminResolvePaymentMismatch,
  getAllOrdersRealTime,
  logAdminAction 
} from "@/utils/adminControls";

type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";

interface OrderWithDetails {
  id: string;
  order_number: string;
  total_amount: number;
  status: OrderStatus;
  fraud_risk_level: string;
  is_archived: boolean;
  created_at: string;
  customer_id: string;
  payment_status: string;
  payment_intent_id: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  };
  order_items: {
    id: string;
    quantity: number;
    price: number;
    total: number;
    stores: { id: string; name: string };
    products: { id: string; name: string };
  }[];
  deliveries: {
    id: string;
    status: string;
    driver_id: string;
    assigned_at: string;
    estimated_delivery_time: string;
  }[];
  cost_breakdown?: {
    item_cost: number;
    store_commission: number;
    platform_fee: number;
    payment_processing_fee: number;
    delivery_cost: number;
    gross_profit: number;
    net_profit: number;
  };
}

export const EnhancedAdminOrders = () => {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [costDialogOpen, setCostDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  // Real-time subscription to orders
  useEffect(() => {
    fetchOrders();
    fetchStores();
    
    // Subscribe to real-time order updates
    const subscription = supabase
      .channel('orders-realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Order update received:', payload);
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchStores = async () => {
    const { data, error } = await supabase
      .from("stores")
      .select("id, name")
      .eq("status", "active")
      .order("name");

    if (!error) {
      setStores(data || []);
    }
  };

  const fetchOrders = async () => {
    try {
      setRefreshing(true);
      const ordersData = await getAllOrdersRealTime({
        status: activeTab === "all" ? undefined : activeTab
      });
      setOrders(ordersData);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus, reason: string) => {
    if (!user?.id) return;

    try {
      const result = await adminOverrideOrderStatus(orderId, newStatus, reason, user.id);
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
        
        // Log admin action
        await logAdminAction(user.id, 'order_status_override', 'order', orderId, {
          old_status: orders.find(o => o.id === orderId)?.status,
          new_status: newStatus,
          reason
        });
        
        fetchOrders();
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const triggerRefund = async (orderId: string, amount: number, reason: string) => {
    if (!user?.id) return;

    try {
      const result = await adminTriggerRefund(orderId, amount, reason, user.id);
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
        
        // Log admin action
        await logAdminAction(user.id, 'refund_triggered', 'order', orderId, {
          amount,
          reason
        });
        
        fetchOrders();
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error triggering refund:", error);
      toast({
        title: "Error",
        description: "Failed to trigger refund",
        variant: "destructive",
      });
    }
  };

  const emergencyCancel = async (orderId: string, reason: string) => {
    if (!user?.id) return;

    try {
      const result = await adminEmergencyCancel(orderId, reason, user.id);
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
        
        // Log admin action
        await logAdminAction(user.id, 'emergency_cancel', 'order', orderId, {
          reason
        });
        
        fetchOrders();
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error with emergency cancel:", error);
      toast({
        title: "Error",
        description: "Failed to cancel order",
        variant: "destructive",
      });
    }
  };

  const reassignDelivery = async (orderId: string, newDriverId: string, reason: string) => {
    if (!user?.id) return;

    try {
      const result = await adminReassignDelivery(orderId, newDriverId, reason, user.id);
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
        
        // Log admin action
        await logAdminAction(user.id, 'delivery_reassigned', 'order', orderId, {
          new_driver_id: newDriverId,
          reason
        });
        
        fetchOrders();
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error reassigning delivery:", error);
      toast({
        title: "Error",
        description: "Failed to reassign delivery",
        variant: "destructive",
      });
    }
  };

  const resolvePaymentMismatch = async (orderId: string, expectedAmount: number, actualAmount: number) => {
    if (!user?.id) return;

    try {
      const result = await adminResolvePaymentMismatch(orderId, expectedAmount, actualAmount, user.id);
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
        
        // Log admin action
        await logAdminAction(user.id, 'payment_mismatch_resolved', 'order', orderId, {
          expected_amount: expectedAmount,
          actual_amount: actualAmount
        });
        
        fetchOrders();
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error resolving payment mismatch:", error);
      toast({
        title: "Error",
        description: "Failed to resolve payment mismatch",
        variant: "destructive",
      });
    }
  };

  const archiveOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ 
          is_archived: true,
          archived_at: new Date().toISOString()
        })
        .eq("id", orderId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order archived successfully",
      });
      fetchOrders();
    } catch (error) {
      console.error("Error archiving order:", error);
      toast({
        title: "Error",
        description: "Failed to archive order",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === "" || 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStore = selectedStore === "all" || 
      order.order_items.some(item => item.stores.id === selectedStore);
    
    return matchesSearch && matchesStore;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-beauty-purple"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Management Dashboard
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchOrders}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardTitle>
          <CardDescription>
            Real-time order monitoring and management with emergency controls
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Stores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stores</SelectItem>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-6 w-full">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
              <TabsTrigger value="processing">Processing</TabsTrigger>
              <TabsTrigger value="shipped">Shipped</TabsTrigger>
              <TabsTrigger value="delivered">Delivered</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Store</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Delivery</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.order_number}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {order.profiles?.first_name} {order.profiles?.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{order.profiles?.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {order.order_items.map((item, index) => (
                            <div key={index} className="text-sm">
                              {item.stores.name}
                            </div>
                          ))}
                        </TableCell>
                        <TableCell>${order.total_amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPaymentStatusColor(order.payment_status)}>
                            {order.payment_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {order.deliveries?.[0] && (
                            <Badge className="bg-blue-100 text-blue-800">
                              {order.deliveries[0].status}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(order.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl">
                                <DialogHeader>
                                  <DialogTitle>Order Details - {order.order_number}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-medium mb-2">Customer Information</h4>
                                      <p className="text-sm">{order.profiles?.first_name} {order.profiles?.last_name}</p>
                                      <p className="text-sm text-gray-500">{order.profiles?.email}</p>
                                    </div>
                                    <div>
                                      <h4 className="font-medium mb-2">Order Summary</h4>
                                      <p className="text-sm">Total: ${order.total_amount.toFixed(2)}</p>
                                      <p className="text-sm">Status: {order.status}</p>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h4 className="font-medium mb-2">Order Items</h4>
                                    <div className="space-y-2">
                                      {order.order_items.map((item, index) => (
                                        <div key={index} className="flex justify-between text-sm">
                                          <span>{item.products.name} x{item.quantity}</span>
                                          <span>${item.total.toFixed(2)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="flex gap-2 pt-4 border-t">
                                    <Select
                                      onValueChange={(newStatus) => updateOrderStatus(order.id, newStatus as OrderStatus, 'Manual status update')}
                                    >
                                      <SelectTrigger className="w-[150px]">
                                        <SelectValue placeholder="Update Status" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="confirmed">Confirmed</SelectItem>
                                        <SelectItem value="processing">Processing</SelectItem>
                                        <SelectItem value="shipped">Shipped</SelectItem>
                                        <SelectItem value="delivered">Delivered</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => emergencyCancel(order.id, 'Emergency cancellation requested')}
                                    >
                                      <XCircle className="h-4 w-4 mr-1" />
                                      Emergency Cancel
                                    </Button>
                                    
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => triggerRefund(order.id, order.total_amount, 'Full refund requested')}
                                    >
                                      <DollarSign className="h-4 w-4 mr-1" />
                                      Refund
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};