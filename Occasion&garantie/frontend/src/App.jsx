import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import api from './api/axios';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SupportFloat from './components/SupportFloat';
import ErrorBoundary from './components/ErrorBoundary';
import AdminRoute from './components/AdminRoute';
import SellerRoute from './components/SellerRoute';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import About from './pages/About';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import VerifyCode from './pages/VerifyCode';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import AdminPremium from './pages/AdminPremium';
import AdminCreditPurchases from './pages/AdminCreditPurchases';

import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminTickets from './pages/AdminTickets';
import AdminVendorLogs from './pages/AdminVendorLogs';
import AdminManagedVendors from './pages/AdminManagedVendors';
import AdminPendingProducts from './pages/AdminPendingProducts';
import AdminStoreProducts from './pages/AdminStoreProducts';
import SellPage from './pages/SellPage';
import SellerDashboard from './pages/SellerDashboard';
import SellerProductForm from './pages/SellerProductForm';
import SellerProfile from './pages/SellerProfile';
import SellerStats from './pages/SellerStats';
import Messenger from './pages/Messenger';
import Privacy from './pages/Privacy';
import RepriseForm from './pages/RepriseForm';
import RepriseList from './pages/RepriseList';
import NotificationsPage from './pages/NotificationsPage';
import Legal from './pages/Legal';
import StorePage from './pages/StorePage';
import StoreProductDetail from './pages/StoreProductDetail';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -12 },
};

const pageTransition = {
  duration: 0.25,
  ease: 'easeInOut',
};

function AnimatedPage({ children }) {
  return (
    <motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
      {children}
    </motion.div>
  );
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);
  useEffect(() => { api.onUnauthorized(() => navigate('/login', { replace: true })); }, [navigate]);

  return (
    <>
      <Navbar />
      <ErrorBoundary>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<AnimatedPage><Home /></AnimatedPage>} />
          <Route path="/products" element={<AnimatedPage><Products /></AnimatedPage>} />
          <Route path="/products/:slug" element={<AnimatedPage><ProductDetail /></AnimatedPage>} />
          <Route path="/about" element={<AnimatedPage><About /></AnimatedPage>} />
          <Route path="/login" element={<AnimatedPage><Login /></AnimatedPage>} />
          <Route path="/signup" element={<AnimatedPage><SignUp /></AnimatedPage>} />
          <Route path="/verify-code" element={<AnimatedPage><VerifyCode /></AnimatedPage>} />
          <Route path="/forgot-password" element={<AnimatedPage><ForgotPassword /></AnimatedPage>} />
          <Route path="/reset-password" element={<AnimatedPage><ResetPassword /></AnimatedPage>} />
          <Route path="/profile" element={<AnimatedPage><Profile /></AnimatedPage>} />
          <Route path="/admin" element={<AnimatedPage><AdminRoute><AdminDashboardPage /></AdminRoute></AnimatedPage>} />
          <Route path="/admin/premium" element={<AnimatedPage><AdminRoute><AdminPremium /></AdminRoute></AnimatedPage>} />
          <Route path="/admin/credits" element={<AnimatedPage><AdminRoute><AdminCreditPurchases /></AdminRoute></AnimatedPage>} />

          <Route path="/admin/users" element={<AnimatedPage><AdminRoute><AdminUsers /></AdminRoute></AnimatedPage>} />
          <Route path="/admin/tickets" element={<AnimatedPage><AdminRoute><AdminTickets /></AdminRoute></AnimatedPage>} />
          <Route path="/admin/vendor-logs" element={<AnimatedPage><AdminRoute><AdminVendorLogs /></AdminRoute></AnimatedPage>} />
          <Route path="/admin/managed-vendors" element={<AnimatedPage><AdminRoute><AdminManagedVendors /></AdminRoute></AnimatedPage>} />
          <Route path="/admin/products/pending" element={<AnimatedPage><AdminRoute><AdminPendingProducts /></AdminRoute></AnimatedPage>} />
          <Route path="/admin/store-products" element={<AnimatedPage><AdminRoute><AdminStoreProducts /></AdminRoute></AnimatedPage>} />
          <Route path="/admin/products" element={<AnimatedPage><AdminRoute><AdminDashboard /></AdminRoute></AnimatedPage>} />
          <Route path="/vendre" element={<AnimatedPage><SellPage /></AnimatedPage>} />
          <Route path="/reprise" element={<AnimatedPage><RepriseForm /></AnimatedPage>} />
          <Route path="/reprise/list" element={<AnimatedPage><RepriseList /></AnimatedPage>} />
          <Route path="/notifications" element={<AnimatedPage><NotificationsPage /></AnimatedPage>} />
          <Route path="/seller" element={<AnimatedPage><SellerRoute><SellerDashboard /></SellerRoute></AnimatedPage>} />
          <Route path="/seller/stats" element={<AnimatedPage><SellerRoute><SellerStats /></SellerRoute></AnimatedPage>} />
          <Route path="/seller/products/new" element={<AnimatedPage><SellerRoute><SellerProductForm /></SellerRoute></AnimatedPage>} />
          <Route path="/seller/products/edit/:id" element={<AnimatedPage><SellerRoute><SellerProductForm /></SellerRoute></AnimatedPage>} />
          <Route path="/seller/:id" element={<AnimatedPage><SellerProfile /></AnimatedPage>} />
          <Route path="/messenger" element={<AnimatedPage><Messenger /></AnimatedPage>} />
          <Route path="/messenger/:id" element={<AnimatedPage><Messenger /></AnimatedPage>} />
          <Route path="/privacy" element={<AnimatedPage><Privacy /></AnimatedPage>} />
          <Route path="/legal" element={<AnimatedPage><Legal /></AnimatedPage>} />
          <Route path="/boutique" element={<AnimatedPage><StorePage /></AnimatedPage>} />
          <Route path="/boutique/:slug" element={<AnimatedPage><StoreProductDetail /></AnimatedPage>} />
          <Route path="*" element={<AnimatedPage><NotFound /></AnimatedPage>} />
        </Routes>
      </AnimatePresence>
      </ErrorBoundary>
      <SupportFloat />
      <Footer />
    </>
  );
}
