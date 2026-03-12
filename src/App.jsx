import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import Privacy from './pages/Privacy';
import Blog from './pages/Blog';
import BlogDetail from './pages/BlogDetail';
import About from './pages/About';
import License from './pages/License';
import Contacts from './pages/Contacts';
import Payment from './pages/Payment';
import Delivery from './pages/Delivery';
import Favorites from './pages/Favorites';
import Checkout from './pages/Checkout';
import AdminPanel from './pages/AdminPanel';
import NotFound from './pages/NotFound';
import './App.css';

function AppRoutes() {
  return (
    <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="catalog" element={<Catalog />} />
          <Route path="catalog/:category" element={<Catalog />} />
          <Route path="product/:id" element={<ProductDetail />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="blog" element={<Blog />} />
          <Route path="blog/:id" element={<BlogDetail />} />
          <Route path="about" element={<About />} />
          <Route path="license" element={<License />} />
          <Route path="payment" element={<Payment />} />
          <Route path="delivery" element={<Delivery />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="vapeAdminDanik" element={<AdminPanel />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
  );
}

export default function App() {
  return <AppRoutes />;
}
