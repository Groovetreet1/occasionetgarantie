import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppFloat from './components/WhatsAppFloat';
import AdminRoute from './components/AdminRoute';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import AdminDashboard from './pages/AdminDashboard';
import AdminProductForm from './pages/AdminProductForm';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:slug" element={<ProductDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/products/new" element={<AdminRoute><AdminProductForm /></AdminRoute>} />
        <Route path="/admin/products/edit/:id" element={<AdminRoute><AdminProductForm /></AdminRoute>} />
      </Routes>
      <WhatsAppFloat />
      <Footer />
    </>
  );
}
