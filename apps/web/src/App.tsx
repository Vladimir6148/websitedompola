import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { StoreLayout } from './components/StoreLayout';
import { ScrollToTop } from './components/ScrollToTop';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ProductPage } from './pages/ProductPage';
import { CartPage } from './pages/CartPage';
import { PickerPage } from './pages/PickerPage';
import { ServicesPage } from './pages/ServicesPage';
import { ContactsPage, PromotionsPage, StoresPage, WorksPage } from './pages/ContentPages';
import {
  AdminDashboard,
  AdminGuard,
  AdminLayout,
  AdminLoginPage,
} from './pages/admin/AdminShell';
import { AdminProductFormPage, AdminProductsPage } from './pages/admin/AdminProducts';
import {
  AdminBrandsPage,
  AdminCategoriesPage,
  AdminLeadsPage,
  AdminPromotionsPage,
  AdminStoresPage,
} from './pages/admin/AdminCrud';
import { AuthProvider } from './store/auth';
import { CartProvider } from './store/cart';
import { CityProvider } from './store/city';

export default function App() {
  return (
    <AuthProvider>
      <CityProvider>
        <CartProvider>
          <BrowserRouter basename={(import.meta.env.BASE_URL.replace(/\/$/, '') || undefined) as string | undefined}>
            <ScrollToTop />
            <Routes>
              <Route element={<StoreLayout />}>
                <Route index element={<HomePage />} />
                <Route path="catalog" element={<CatalogPage />} />
                <Route path="catalog/:categorySlug" element={<CatalogPage />} />
                <Route path="product/:slug" element={<ProductPage />} />
                <Route path="cart" element={<CartPage />} />
                <Route path="picker" element={<PickerPage />} />
                <Route path="services" element={<ServicesPage />} />
                <Route path="promotions" element={<PromotionsPage />} />
                <Route path="works" element={<WorksPage />} />
                <Route path="stores" element={<StoresPage />} />
                <Route path="contacts" element={<ContactsPage />} />
              </Route>

              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin" element={<AdminGuard />}>
                <Route element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="products" element={<AdminProductsPage />} />
                  <Route path="products/new" element={<AdminProductFormPage />} />
                  <Route path="products/:id" element={<AdminProductFormPage />} />
                  <Route path="categories" element={<AdminCategoriesPage />} />
                  <Route path="brands" element={<AdminBrandsPage />} />
                  <Route path="leads" element={<AdminLeadsPage />} />
                  <Route path="stores" element={<AdminStoresPage />} />
                  <Route path="promotions" element={<AdminPromotionsPage />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </CityProvider>
    </AuthProvider>
  );
}
