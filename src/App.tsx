import ScrollToTop from "@/components/ScrollToTop";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import Admin from "./pages/Admin";
import EnhancedAdmin from "./pages/EnhancedAdmin";
import { WebsiteAnimation } from "./pages/admin/WebsiteAnimation";
import { TeamManagement } from "./pages/admin/TeamManagement";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import FAQ from "./pages/FAQ";
import Refund from "./pages/Refund";
import Team from "./pages/Team";
import RequestPayment from "./pages/RequestPayment";
import NotFound from "./pages/NotFound";
import Footer from "./components/Footer";
import HoverReceiver from "@/visual-edits/VisualEditsMessenger";

// Visitor tracking component
const VisitorTracker = () => {
  useVisitorTracking();
  return null;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HoverReceiver />
      <Router>
        <ScrollToTop />
        <AuthProvider>
          <CurrencyProvider>
            <VisitorTracker />
            <Navbar />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/products" element={<Products />} />
              <Route path="/product/:productId" element={<ProductDetails />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/team" element={<Team />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/refund" element={<Refund />} />
              <Route 
                path="/request-payment/:productId" 
                element={
                  <ProtectedRoute>
                    <RequestPayment />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/notifications" 
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute requireAdmin>
                    <Admin />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/enhanced-admin" 
                element={
                  <ProtectedRoute requireAdmin>
                    <EnhancedAdmin />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/website-animation" 
                element={
                  <ProtectedRoute requireAdmin>
                    <WebsiteAnimation />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin/team" 
                element={
                  <ProtectedRoute requireAdmin>
                    <TeamManagement />
                  </ProtectedRoute>
                } 
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Footer />
          </CurrencyProvider>
        </AuthProvider>
      </Router>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;