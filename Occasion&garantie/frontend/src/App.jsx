import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppFloat from './components/WhatsAppFloat';
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
import SellPage from './pages/SellPage';
import SellerDashboard from './pages/SellerDashboard';
import SellerProductForm from './pages/SellerProductForm';
import SellerProfile from './pages/SellerProfile';
import SellerStats from './pages/SellerStats';

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

  return (
    <>
      <Navbar />
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
          <Route path="/admin" element={<Navigate to="/admin/premium" replace />} />
          <Route path="/admin/premium" element={<AnimatedPage><AdminRoute><AdminPremium /></AdminRoute></AnimatedPage>} />
          <Route path="/vendre" element={<AnimatedPage><SellPage /></AnimatedPage>} />
          <Route path="/seller" element={<AnimatedPage><SellerRoute><SellerDashboard /></SellerRoute></AnimatedPage>} />
          <Route path="/seller/stats" element={<AnimatedPage><SellerRoute><SellerStats /></SellerRoute></AnimatedPage>} />
          <Route path="/seller/products/new" element={<AnimatedPage><SellerRoute><SellerProductForm /></SellerRoute></AnimatedPage>} />
          <Route path="/seller/products/edit/:id" element={<AnimatedPage><SellerRoute><SellerProductForm /></SellerRoute></AnimatedPage>} />
          <Route path="/seller/:id" element={<AnimatedPage><SellerProfile /></AnimatedPage>} />
          <Route path="*" element={<AnimatedPage><NotFound /></AnimatedPage>} />
        </Routes>
      </AnimatePresence>
      <WhatsAppFloat />
      <Footer />
    </>
  );
}
