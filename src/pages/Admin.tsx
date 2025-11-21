
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
import { EnhancedCustomization } from "@/components/admin/EnhancedCustomization";
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
