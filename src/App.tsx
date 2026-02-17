import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { CustomizationProvider } from "@/contexts/CustomizationContext";
import { LocationPermissionModal } from "@/components/LocationPermissionModal";
import { useLocation } from "@/contexts/LocationContext";
import Index from "./pages/Index";
import Store from "./pages/Store";
import Stores from "./pages/Stores";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import SecureCheckout from "./pages/SecureCheckout";
import OrderConfirmation from "./pages/OrderConfirmation";
import PaymentSuccess from "./pages/PaymentSuccess";
import TestPayment from "./pages/TestPayment";
import TrackOrder from "./pages/TrackOrder";
import Explore from "./pages/Explore";
import Home from "./pages/Home";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Appointments from "./pages/Appointments";
import Schools from "./pages/Schools";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import MerchantDashboard from "./pages/MerchantDashboard";
import MerchantSignup from "./pages/MerchantSignup";
import DriverSignup from "./pages/DriverSignup";
import UserAuth from "./pages/UserAuth";
import MerchantAuth from "./pages/MerchantAuth";
import DriverAuth from "./pages/DriverAuth";
import DriverDashboard from "./pages/DriverDashboard";
// Debug page removed for production
import NotFound from "./pages/NotFound";
import { LocationDemoPage } from "@/components/LocationDemoPage";
import AuthStateDebug from "@/components/AuthStateDebug";
import { AdminRoute, DriverRoute, MerchantRoute } from "@/components/ProtectedRoute";


const queryClient = new QueryClient();

// Location Modal Wrapper Component
const LocationModalWrapper = () => {
  const { showLocationModal, setUserLocation, skipLocation, setShowLocationModal } = useLocation();
  const navigate = useNavigate();
  
  return (
    <LocationPermissionModal 
      isOpen={showLocationModal}
      onLocationSet={setUserLocation}
      onSkip={() => {
        skipLocation();
        setShowLocationModal(false);
        navigate("/home");
      }}
    />
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CustomizationProvider>
      <AuthProvider>
        <CartProvider>
          <LocationProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner richColors closeButton />
              <BrowserRouter>
              <LocationModalWrapper />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/stores" element={<Stores />} />
                <Route path="/store/:slug" element={<Store />} />
                <Route path="/product/:slug" element={<Product />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<SecureCheckout />} />
                <Route path="/order-confirmation" element={<OrderConfirmation />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/test-payment" element={<TestPayment />} />
                <Route path="/track-order" element={<TrackOrder />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/home" element={<Home />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/appointments" element={<Appointments />} />
                <Route path="/schools" element={<Schools />} />
                <Route path="/auth" element={<AdminRoute><Auth /></AdminRoute>} />
                <Route path="/login" element={<UserAuth />} />
                <Route path="/merchant/login" element={<MerchantAuth />} />
                <Route path="/driver/login" element={<DriverAuth />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/merchant" element={<MerchantRoute><MerchantDashboard /></MerchantRoute>} />
                <Route path="/driver" element={<DriverRoute><DriverDashboard /></DriverRoute>} />
                <Route path="/merchant-signup" element={<MerchantSignup />} />
                <Route path="/driver-signup" element={<DriverSignup />} />
              <Route path="/profile" element={<Profile />} />
                <Route path="/profile/:section" element={<Profile />} />
                <Route path="/location-demo" element={<LocationDemoPage />} />
                <Route path="/auth-debug" element={<AuthStateDebug />} />
                {/* Debug route removed for production */}
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </LocationProvider>
      </CartProvider>
    </AuthProvider>
    </CustomizationProvider>
  </QueryClientProvider>
);

export default App;
