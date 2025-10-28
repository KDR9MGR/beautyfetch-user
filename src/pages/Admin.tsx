
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { AdminStores } from "@/components/admin/AdminStores";
import { AdminProducts } from "@/components/admin/AdminProducts";
import { AdminCategories } from "@/components/admin/AdminCategories";
import { AdminCatalog } from "@/components/admin/AdminCatalog";
import { AdminOrders } from "@/components/admin/AdminOrders";
import { AdminBlogPosts } from "@/components/admin/AdminBlogPosts";
import { AdminUsers } from "@/components/admin/AdminUsers";
import AdminMerchantApprovals from "@/components/admin/AdminMerchantApprovals";
import { AdminMessages } from "@/components/admin/AdminMessages";
import { AdminDrivers } from "@/components/admin/AdminDrivers";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { AdminAnalytics } from "@/components/admin/AdminAnalytics";
import { AdminCustomization } from "@/components/admin/AdminCustomization";
import { Store, Package, ShoppingCart, Users, LogOut, Shield, Home } from "lucide-react";
import { Link } from "react-router-dom";

const Admin = () => {
  const { user, profile, loading, initialized, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State management for active tab with localStorage persistence
  const [activeTab, setActiveTab] = useState(() => {
    try {
      return localStorage.getItem('admin-active-tab') || 'overview';
    } catch {
      return 'overview';
    }
  });
  
  // Save active tab to localStorage whenever it changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    try {
      localStorage.setItem('admin-active-tab', value);
    } catch (error) {
      console.warn('Failed to save active tab to localStorage:', error);
    }
  };

  useEffect(() => {
    // Only redirect when auth is fully initialized and stable
    // Add extra protection against tab switching temporary states
    if (initialized && !loading) {
      // Check for cached admin role to prevent redirect during profile reload
      const cachedRole = localStorage.getItem('cached_user_role');
      const isAdminByCachedRole = cachedRole === 'admin';
      
      if (!user) {
        // Only redirect if we're sure there's no session (not during tab switch restoration)
        const hasRecentSession = sessionStorage.getItem('admin-session-active');
        if (!hasRecentSession) {
          toast({
            title: "Authentication Required", 
            description: "Please log in to access the admin dashboard",
            variant: "destructive",
          });
          navigate("/login");
          return;
        }
      }

      // Don't redirect if we have cached admin role and user exists (profile might be loading)
      if (user && !isAdminByCachedRole && profile?.role !== "admin" && profile !== null) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges", 
          variant: "destructive",
        });
        navigate("/");
        return;
      }
      
      // Mark that we have an active admin session
      if (user && (profile?.role === "admin" || isAdminByCachedRole)) {
        sessionStorage.setItem('admin-session-active', 'true');
      }
    }
  }, [user, profile, loading, initialized, navigate, toast]);
  
  // Handle page visibility changes to maintain tab state
   useEffect(() => {
     const handleVisibilityChange = () => {
       if (!document.hidden) {
         // When tab becomes visible, restore the active tab from localStorage
         try {
           const savedTab = localStorage.getItem('admin-active-tab');
           if (savedTab && savedTab !== activeTab) {
             setActiveTab(savedTab);
           }
         } catch (error) {
           console.warn('Failed to restore active tab from localStorage:', error);
         }
       }
     };
     
     document.addEventListener('visibilitychange', handleVisibilityChange);
     
     return () => {
       document.removeEventListener('visibilitychange', handleVisibilityChange);
     };
   }, [activeTab]);

  const handleLogout = async () => {
    try {
      // Clear admin session marker
      sessionStorage.removeItem('admin-session-active');
      
      await signOut();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      navigate("/");
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    }
  };

  // Show loading state while authentication is being determined
  // But allow cached admin role to bypass loading for better UX during tab switches
  const cachedRole = localStorage.getItem('cached_user_role');
  const isAdminByCachedRole = cachedRole === 'admin';
  const hasAdminSession = sessionStorage.getItem('admin-session-active');
  
  if ((loading || !initialized) && !isAdminByCachedRole && !hasAdminSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Show access denied screen if not authenticated or not admin
  // But be more lenient during tab switching when we have cached admin status
  const shouldShowAccessDenied = (!user && !hasAdminSession) || 
    (user && profile !== null && profile?.role !== "admin" && !isAdminByCachedRole);
    
  if (shouldShowAccessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            {!user 
              ? "You need to log in to access the admin dashboard." 
              : "You don't have admin privileges to access this page."
            }
          </p>
          <div className="space-y-3">
            {!user ? (
              <Link to="/login">
                <Button className="w-full">
                  Log In
                </Button>
              </Link>
            ) : (
              <Link to="/">
                <Button variant="outline" className="w-full">
                  <Home className="h-4 w-4 mr-2" />
                  Go to Home
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-pink-600 hover:text-pink-700">
                <Home className="h-5 w-5" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">BeautyFetch Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Welcome, {profile?.first_name || user?.email}
              </span>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <div className="w-full overflow-x-auto">
            <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground min-w-max">
              <TabsTrigger value="overview" className="whitespace-nowrap">Overview</TabsTrigger>
              <TabsTrigger value="analytics" className="whitespace-nowrap">Analytics</TabsTrigger>
              <TabsTrigger value="customization" className="whitespace-nowrap">Customization</TabsTrigger>
              <TabsTrigger value="approvals" className="whitespace-nowrap">Approvals</TabsTrigger>
              <TabsTrigger value="messages" className="whitespace-nowrap">Messages</TabsTrigger>
              <TabsTrigger value="stores" className="whitespace-nowrap">Stores</TabsTrigger>
              <TabsTrigger value="products" className="whitespace-nowrap">Products</TabsTrigger>
              <TabsTrigger value="categories" className="whitespace-nowrap">Categories</TabsTrigger>
              <TabsTrigger value="catalog" className="whitespace-nowrap">Catalog</TabsTrigger>
              <TabsTrigger value="orders" className="whitespace-nowrap">Orders</TabsTrigger>
              <TabsTrigger value="drivers" className="whitespace-nowrap">Drivers</TabsTrigger>
              <TabsTrigger value="blog" className="whitespace-nowrap">Blog</TabsTrigger>
              <TabsTrigger value="users" className="whitespace-nowrap">Users</TabsTrigger>
              <TabsTrigger value="settings" className="whitespace-nowrap">Settings</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Stores</CardTitle>
                  <Store className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">+2 from last month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">346</div>
                  <p className="text-xs text-muted-foreground">+15 from last week</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">89</div>
                  <p className="text-xs text-muted-foreground">+7 from yesterday</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,234</div>
                  <p className="text-xs text-muted-foreground">+12% from last month</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <AdminAnalytics />
          </TabsContent>

          <TabsContent value="customization">
            <AdminCustomization />
          </TabsContent>

          <TabsContent value="approvals">
            <AdminMerchantApprovals />
          </TabsContent>

          <TabsContent value="messages">
            <AdminMessages />
          </TabsContent>

          <TabsContent value="stores">
            <AdminStores />
          </TabsContent>

          <TabsContent value="products">
            <AdminProducts />
          </TabsContent>

          <TabsContent value="categories">
            <AdminCategories />
          </TabsContent>

          <TabsContent value="catalog">
            <AdminCatalog />
          </TabsContent>

          <TabsContent value="orders">
            <AdminOrders />
          </TabsContent>

          <TabsContent value="blog">
            <AdminBlogPosts />
          </TabsContent>

          <TabsContent value="drivers">
            <AdminDrivers />
          </TabsContent>

          <TabsContent value="users">
            <AdminUsers />
          </TabsContent>

          <TabsContent value="settings">
            <AdminSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
