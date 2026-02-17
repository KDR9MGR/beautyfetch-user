import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DriverRoute } from '@/components/ProtectedRoute';
import { DriverHeader } from '@/components/driver/DriverHeader';
import { ActiveDeliveries } from '@/components/driver/ActiveDeliveries';
import { DeliveryHistory } from '@/components/driver/DeliveryHistory';
import { EarningsReport } from '@/components/driver/EarningsReport';
import { RouteMap } from '@/components/driver/RouteMap';
import {
  Truck,
  Package,
  DollarSign,
  TrendingUp,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Navigation
} from 'lucide-react';

const DriverDashboard = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activeDeliveries: 0,
    completedToday: 0,
    todayEarnings: 0,
    weeklyEarnings: 0,
    monthlyEarnings: 0,
    totalDeliveries: 0,
    averageRating: 0,
    pendingPickups: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [driverStatus, setDriverStatus] = useState<{ isOnline: boolean }>({ isOnline: false });

  useEffect(() => {
    if (!loading && profile?.role !== 'driver' && profile?.role !== 'admin') {
      navigate('/driver/login');
    } else if (profile?.role === 'driver' || profile?.role === 'admin') {
      fetchDashboardStats();
      fetchDriverStatus();
    }
  }, [loading, profile, navigate]);

  const fetchDriverStatus = async () => {
    if (!user) return;

    try {
      const supabaseAny = supabase as any;
      const { data } = await supabaseAny
        .from('driver_status')
        .select('is_online')
        .eq('driver_id', user.id)
        .maybeSingle();

      if (!data) {
        await supabaseAny.from('driver_status').insert({
          driver_id: user.id,
          is_online: false,
        });
        setDriverStatus({ isOnline: false });
        return;
      }
      setDriverStatus({ isOnline: data.is_online });
    } catch (error) {
      console.error('Error fetching driver status:', error);
    }
  };

  const fetchDashboardStats = async () => {
    if (!user) return;

    try {
      setLoadingStats(true);

      // Fetch all deliveries for this driver
      const supabaseAny = supabase as any;
      const { data: deliveriesData } = await supabaseAny
        .from('deliveries')
        .select('id,status,assigned_at,actual_delivery_time')
        .eq('driver_id', user.id);

      const { data: earningsData } = await supabaseAny
        .from('driver_earnings')
        .select('total_amount,created_at')
        .eq('driver_id', user.id);

      // Calculate stats
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const activeDeliveries = deliveriesData?.filter(d =>
        d.status === 'assigned' || d.status === 'picked_up' || d.status === 'in_transit'
      ).length || 0;

      const completedToday = deliveriesData?.filter(d => {
        if (d.status !== 'delivered' || !d.actual_delivery_time) return false;
        const completedDate = new Date(d.actual_delivery_time);
        return completedDate >= today;
      }).length || 0;

      const todayEarnings = earningsData?.filter(e => {
        const earnedDate = new Date(e.created_at);
        return earnedDate >= today;
      }).reduce((sum, e) => sum + Number(e.total_amount || 0), 0) || 0;

      const weeklyEarnings = earningsData?.filter(e => {
        const earnedDate = new Date(e.created_at);
        return earnedDate >= weekAgo;
      }).reduce((sum, e) => sum + Number(e.total_amount || 0), 0) || 0;

      const monthlyEarnings = earningsData?.filter(e => {
        const earnedDate = new Date(e.created_at);
        return earnedDate >= monthStart;
      }).reduce((sum, e) => sum + Number(e.total_amount || 0), 0) || 0;

      const totalDeliveries = deliveriesData?.filter(d => d.status === 'delivered').length || 0;
      const pendingPickups = deliveriesData?.filter(d => d.status === 'assigned').length || 0;

      setStats({
        activeDeliveries,
        completedToday,
        todayEarnings,
        weeklyEarnings,
        monthlyEarnings,
        totalDeliveries,
        averageRating: 4.8, // Would come from ratings table
        pendingPickups
      });
    } catch (error) {
      console.error('Error fetching driver stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const toggleDriverStatus = async () => {
    if (!user) return;

    const newStatus = !driverStatus.isOnline;
    let lastLocation = null;
    if (newStatus && navigator.geolocation) {
      lastLocation = await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) =>
            resolve({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            }),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 5000 }
        );
      });
    }

    try {
      const supabaseAny = supabase as any;
      const { error } = await supabaseAny
        .from('driver_status')
        .upsert({
          driver_id: user.id,
          is_online: newStatus,
          last_updated: new Date().toISOString(),
          last_location: lastLocation,
        }, { onConflict: 'driver_id' });

      if (!error) {
        setDriverStatus({ isOnline: newStatus });
      }
    } catch (error) {
      console.error('Error updating driver status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-beauty-purple"></div>
      </div>
    );
  }

  return (
    <DriverRoute>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <DriverHeader />

        <main className="flex-grow">
          <div className="container mx-auto px-4 py-6 md:py-8">
            {/* Header with Status Toggle */}
            <div className="mb-6 md:mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    Welcome back, Driver!
                  </h1>
                  <p className="text-gray-600">Manage your deliveries and track your earnings</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${driverStatus.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span className="text-sm font-medium capitalize">{driverStatus.isOnline ? 'online' : 'offline'}</span>
                  </div>
                  <Button
                    onClick={toggleDriverStatus}
                    variant={driverStatus.isOnline ? 'destructive' : 'default'}
                    size="sm"
                  >
                    {driverStatus.isOnline ? 'Go Offline' : 'Go Online'}
                  </Button>
                </div>
              </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto">
                <TabsTrigger value="overview" className="text-xs md:text-sm">Overview</TabsTrigger>
                <TabsTrigger value="active" className="text-xs md:text-sm">Active</TabsTrigger>
                <TabsTrigger value="map" className="text-xs md:text-sm">Map</TabsTrigger>
                <TabsTrigger value="history" className="text-xs md:text-sm">History</TabsTrigger>
                <TabsTrigger value="earnings" className="text-xs md:text-sm">Earnings</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Active Deliveries</CardTitle>
                      <Truck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{loadingStats ? '-' : stats.activeDeliveries}</div>
                      <p className="text-xs text-muted-foreground">
                        {stats.pendingPickups} pending pickups
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{loadingStats ? '-' : stats.completedToday}</div>
                      <p className="text-xs text-muted-foreground">
                        {stats.totalDeliveries} total deliveries
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Today's Earnings</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        ${loadingStats ? '-' : stats.todayEarnings.toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        ${stats.weeklyEarnings.toFixed(2)} this week
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Rating</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)} ⭐</div>
                      <p className="text-xs text-muted-foreground">
                        Based on {stats.totalDeliveries} deliveries
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common tasks for drivers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <Button variant="outline" className="h-20 flex flex-col gap-2">
                        <Navigation className="h-6 w-6" />
                        <span className="text-sm">Start Route</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex flex-col gap-2">
                        <MapPin className="h-6 w-6" />
                        <span className="text-sm">View Map</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex flex-col gap-2">
                        <Package className="h-6 w-6" />
                        <span className="text-sm">Scan Package</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex flex-col gap-2">
                        <Clock className="h-6 w-6" />
                        <span className="text-sm">Break Time</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Notifications */}
                <Card>
                  <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>Important updates and alerts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.pendingPickups > 0 && (
                        <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                          <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-orange-900">
                              {stats.pendingPickups} pending {stats.pendingPickups === 1 ? 'pickup' : 'pickups'}
                            </p>
                            <p className="text-sm text-orange-700">
                              New deliveries waiting for pickup
                            </p>
                          </div>
                        </div>
                      )}

                      {stats.activeDeliveries > 0 && (
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                          <Truck className="h-5 w-5 text-blue-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-blue-900">
                              {stats.activeDeliveries} active {stats.activeDeliveries === 1 ? 'delivery' : 'deliveries'}
                            </p>
                            <p className="text-sm text-blue-700">
                              Continue with your current deliveries
                            </p>
                          </div>
                        </div>
                      )}

                      {driverStatus === 'offline' && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <Clock className="h-5 w-5 text-gray-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900">
                              You're currently offline
                            </p>
                            <p className="text-sm text-gray-700">
                              Go online to receive new delivery requests
                            </p>
                          </div>
                        </div>
                      )}

                      {stats.activeDeliveries === 0 && stats.pendingPickups === 0 && driverStatus === 'online' && (
                        <p className="text-gray-500 text-center py-8">
                          All caught up! Waiting for new deliveries...
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>This Month's Performance</CardTitle>
                    <CardDescription>Your delivery statistics for the current month</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Earnings</span>
                        <span className="text-lg font-bold text-green-600">
                          ${stats.monthlyEarnings.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Deliveries Completed</span>
                        <span className="text-lg font-bold">{stats.totalDeliveries}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Average Rating</span>
                        <span className="text-lg font-bold">{stats.averageRating.toFixed(1)} ⭐</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Avg. Earnings per Delivery</span>
                        <span className="text-lg font-bold">
                          ${stats.totalDeliveries > 0 ? (stats.monthlyEarnings / stats.totalDeliveries).toFixed(2) : '0.00'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="active">
                <ActiveDeliveries />
              </TabsContent>

              <TabsContent value="map">
                <RouteMap />
              </TabsContent>

              <TabsContent value="history">
                <DeliveryHistory />
              </TabsContent>

              <TabsContent value="earnings">
                <EarningsReport />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </DriverRoute>
  );
};

export default DriverDashboard;
