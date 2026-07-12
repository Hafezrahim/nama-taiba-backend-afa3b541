import React, { lazy, Suspense } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import Index from "./pages/Index";
import DynamicSEO from './components/DynamicSEO';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from "@/components/ui/toaster"
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { PWAProvider } from './contexts/PWAContext';
import PWAInstallBanner from './components/PWAInstallBanner';
import NotFound from './pages/NotFound';

// Lazy-loaded public pages
const Products = lazy(() => import('./pages/Products'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Projects = lazy(() => import('./pages/Projects'));
const ProjectDetails = lazy(() => import('./pages/ProjectDetails'));
const Services = lazy(() => import('./pages/Services'));
const Contact = lazy(() => import('./pages/Contact'));
const About = lazy(() => import('./pages/About'));
const Partners = lazy(() => import('./pages/Partners'));
const Quality = lazy(() => import('./pages/Quality'));
const Cart = lazy(() => import('./pages/Cart'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogDetails = lazy(() => import('./pages/BlogDetails'));
const Offers = lazy(() => import('./pages/Offers'));
const Login = lazy(() => import('./pages/Login'));
const SignUp = lazy(() => import('./pages/SignUp'));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation'));
const Profile = lazy(() => import('./pages/Profile'));
const Install = lazy(() => import('./pages/Install'));
const SupportTickets = lazy(() => import('./pages/SupportTickets'));

// Lazy-loaded client pages
const ClientLayout = lazy(() => import('./components/client/ClientLayout').then(m => ({ default: m.ClientLayout })));
const ClientDashboard = lazy(() => import('./pages/client/ClientDashboard'));
const ClientOrders = lazy(() => import('./pages/client/ClientOrders'));
const ClientQuote = lazy(() => import('./pages/client/ClientQuote'));
const ClientMyQuotes = lazy(() => import('./pages/client/ClientMyQuotes'));

// Lazy-loaded admin pages
const AdminLayout = lazy(() => import('./components/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminOrderDetails = lazy(() => import('./pages/admin/AdminOrderDetails'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminBlogs = lazy(() => import('./pages/admin/AdminBlogs'));
const AdminProjects = lazy(() => import('./pages/admin/AdminProjects'));
const AdminOffers = lazy(() => import('./pages/admin/AdminOffers'));
const AdminServices = lazy(() => import('./pages/admin/AdminServices'));
const AdminPartners = lazy(() => import('./pages/admin/AdminPartners'));
const AdminTeam = lazy(() => import('./pages/admin/AdminTeam'));
const AdminCertifications = lazy(() => import('./pages/admin/AdminCertifications'));
const AdminTestimonials = lazy(() => import('./pages/admin/AdminTestimonials'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminSlider = lazy(() => import('./pages/admin/AdminSlider'));
const AdminContactInfo = lazy(() => import('./pages/admin/AdminContactInfo'));
const AdminRoles = lazy(() => import('./pages/admin/AdminRoles'));
const AdminAbout = lazy(() => import('./pages/admin/AdminAbout'));
const AdminQuality = lazy(() => import('./pages/admin/AdminQuality'));
const AdminContacts = lazy(() => import('./pages/admin/AdminContacts'));
const AdminQuotes = lazy(() => import('./pages/admin/AdminQuotes'));
const AdminQuoteDetails = lazy(() => import('./pages/admin/AdminQuoteDetails'));
const AdminMarketers = lazy(() => import('./pages/admin/AdminMarketers'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminSEO = lazy(() => import('./pages/admin/AdminSEO'));
const AdminCities = lazy(() => import('./pages/admin/AdminCities'));
const AdminDistricts = lazy(() => import('./pages/admin/AdminDistricts'));
const AdminBackup = lazy(() => import('./pages/admin/AdminBackup'));
const AdminChatbot = lazy(() => import('./pages/admin/AdminChatbot'));
const AdminTickets = lazy(() => import('./pages/admin/AdminTickets'));
const AdminDeliverers = lazy(() => import('./pages/admin/AdminDeliverers'));
const AdminDelivererDetails = lazy(() => import('./pages/admin/AdminDelivererDetails'));
const AdminShipments = lazy(() => import('./pages/admin/AdminShipments'));
const AdminSecurity = lazy(() => import('./pages/admin/AdminSecurity'));
const AdminMapLocations = lazy(() => import('./pages/admin/AdminMapLocations'));

// Lazy-loaded marketer pages
const MarketerLayout = lazy(() => import('./components/marketer/MarketerLayout').then(m => ({ default: m.MarketerLayout })));
const MarketerDashboard = lazy(() => import('./pages/marketer/MarketerDashboard'));
const MarketerQuotations = lazy(() => import('./pages/marketer/MarketerQuotations'));
const MarketerConfirmed = lazy(() => import('./pages/marketer/MarketerConfirmed'));
const MarketerQuoteDetails = lazy(() => import('./pages/marketer/MarketerQuoteDetails'));
const MarketerProfile = lazy(() => import('./pages/marketer/MarketerProfile'));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

function App() {
  const queryClient = new QueryClient()
  
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <AuthProvider>
            <LanguageProvider>
              <CartProvider>
                <WishlistProvider>
                  <PWAProvider>
                  <Suspense fallback={<PageLoader />}>
                    <DynamicSEO />
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/products" element={<Products />} />
                      <Route path="/products/:productSlug" element={<ProductDetails />} />
                      <Route path="/projects" element={<Projects />} />
                      <Route path="/projects/:projectSlug" element={<ProjectDetails />} />
                      <Route path="/services" element={<Services />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/partners" element={<Partners />} />
                      <Route path="/quality" element={<Quality />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/wishlist" element={<Wishlist />} />
                      <Route path="/blog" element={<Blog />} />
                      <Route path="/blog/:blogSlug" element={<BlogDetails />} />
                      <Route path="/offers" element={<Offers />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/signup" element={<SignUp />} />
                      <Route path="/order-confirmation" element={<OrderConfirmation />} />
                      <Route path="/profile" element={<Navigate to="/client/profile" replace />} />
                      <Route path="/install" element={<Install />} />
                      <Route path="/support" element={<Navigate to="/client/tickets" replace />} />

                      {/* Client Routes */}
                      <Route path="/client" element={<ClientLayout />}>
                        <Route index element={<ClientDashboard />} />
                        <Route path="orders" element={<ClientOrders />} />
                        <Route path="quote" element={<ClientQuote />} />
                        <Route path="quotes" element={<ClientMyQuotes />} />
                        <Route path="tickets" element={<SupportTickets />} />
                        <Route path="profile" element={<Profile />} />
                      </Route>
                      
                      {/* Admin Routes */}
                      <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<AdminDashboard />} />
                        <Route path="products" element={<AdminProducts />} />
                        <Route path="blogs" element={<AdminBlogs />} />
                        <Route path="projects" element={<AdminProjects />} />
                        <Route path="offers" element={<AdminOffers />} />
                        <Route path="orders" element={<AdminOrders />} />
                        <Route path="orders/:orderId" element={<AdminOrderDetails />} />
                        <Route path="users" element={<AdminUsers />} />
                        <Route path="services" element={<AdminServices />} />
                        <Route path="partners" element={<AdminPartners />} />
                        <Route path="team" element={<AdminTeam />} />
                        <Route path="certifications" element={<AdminCertifications />} />
                        <Route path="testimonials" element={<AdminTestimonials />} />
                        <Route path="categories" element={<AdminCategories />} />
                        <Route path="slider" element={<AdminSlider />} />
                        <Route path="contact-info" element={<AdminContactInfo />} />
                        <Route path="map-locations" element={<AdminMapLocations />} />
                        <Route path="roles" element={<AdminRoles />} />
                        <Route path="about" element={<AdminAbout />} />
                        <Route path="quality" element={<AdminQuality />} />
                        <Route path="contacts" element={<AdminContacts />} />
                        <Route path="quotes" element={<AdminQuotes />} />
                        <Route path="quotes/:id" element={<AdminQuoteDetails />} />
                        <Route path="marketers" element={<AdminMarketers />} />
                        <Route path="settings" element={<AdminSettings />} />
                        <Route path="seo" element={<AdminSEO />} />
                        <Route path="cities" element={<AdminCities />} />
                        <Route path="districts" element={<AdminDistricts />} />
                        <Route path="backup" element={<AdminBackup />} />
                        <Route path="chatbot" element={<AdminChatbot />} />
                        <Route path="tickets" element={<AdminTickets />} />
                        <Route path="deliverers" element={<AdminDeliverers />} />
                        <Route path="deliverers/:id" element={<AdminDelivererDetails />} />
                        <Route path="shipments" element={<AdminShipments />} />
                        <Route path="security" element={<AdminSecurity />} />
                      </Route>
                      
                      {/* Marketer Routes */}
                      <Route path="/marketer" element={<MarketerLayout />}>
                        <Route index element={<MarketerDashboard />} />
                        <Route path="quotations" element={<MarketerQuotations />} />
                        <Route path="confirmed" element={<MarketerConfirmed />} />
                        <Route path="quotes/:id" element={<MarketerQuoteDetails />} />
                        <Route path="profile" element={<MarketerProfile />} />
                      </Route>
                      
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                  <PWAInstallBanner />
                  <Toaster />
                  </PWAProvider>
                </WishlistProvider>
              </CartProvider>
            </LanguageProvider>
          </AuthProvider>
        </Router>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
