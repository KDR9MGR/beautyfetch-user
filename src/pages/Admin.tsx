import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { AdminStores } from "@/components/admin/AdminStores";
import { AdminProducts } from "@/components/admin/AdminProducts";
import { AdminCategories } from "@/components/admin/AdminCategories";
import { AdminCatalog } from "@/components/admin/AdminCatalog";
import { AdminOrders } from "@/components/admin/AdminOrders";
import { EnhancedAdminOrders } from "@/components/admin/EnhancedAdminOrders";
import { AdminBlogPosts } from "@/components/admin/AdminBlogPosts";
import { AdminUsers } from "@/components/admin/AdminUsers";
import AdminMerchantApprovals from "@/components/admin/AdminMerchantApprovals";
import { AdminMessages } from "@/components/admin/AdminMessages";
import { AdminDrivers } from "@/components/admin/AdminDrivers";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { AdminAnalytics } from "@/components/admin/AdminAnalytics";
import { AdminCustomization } from "@/components/admin/AdminCustomization";
import { EnhancedCustomization } from "@/components/admin/EnhancedCustomization";

const Admin = () => {
  const { profile } = useAuth();
  const [tab, setTab] = useState("analytics");

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Admin Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} defaultValue="analytics" onValueChange={setTab} className="space-y-6">
              <TabsList className="flex flex-wrap gap-2">
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="approvals">Approvals</TabsTrigger>
                <TabsTrigger value="messages">Messages</TabsTrigger>
                <TabsTrigger value="stores">Stores</TabsTrigger>
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="categories">Categories</TabsTrigger>
                <TabsTrigger value="catalog">Catalog</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="blog">Blog</TabsTrigger>
                <TabsTrigger value="drivers">Drivers</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="customization">Customization</TabsTrigger>
                <TabsTrigger value="enhanced">Enhanced</TabsTrigger>
              </TabsList>

              <TabsContent value="analytics">
                <AdminAnalytics />
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
                <EnhancedAdminOrders />
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
              <TabsContent value="customization">
                <AdminCustomization />
              </TabsContent>
              <TabsContent value="enhanced">
                <EnhancedCustomization />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
