import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { StoreLayout } from './components/StoreLayout';
import { ScrollToTop } from './components/ScrollToTop';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ProductPage } from './pages/ProductPage';
import { CartPage } from './pages/CartPage';
import { AuthProvider } from './store/auth';
import { CartProvider } from './store/cart';
import { CityProvider } from './store/city';

function lazyNamed<T extends Record<string, unknown>, K extends keyof T>(
  loader: () => Promise<T>,
  exportName: K,
) {
  return lazy(async () => {
    const mod = await loader();
    return { default: mod[exportName] as ComponentType };
  });
}

const PickerPage = lazyNamed(() => import('./pages/PickerPage'), 'PickerPage');
const ServicesPage = lazyNamed(() => import('./pages/ServicesPage'), 'ServicesPage');
const ServiceDetailPage = lazyNamed(
  () => import('./pages/ServiceDetailPage'),
  'ServiceDetailPage',
);
const PromotionsPage = lazyNamed(() => import('./pages/ContentPages'), 'PromotionsPage');
const WorksPage = lazyNamed(() => import('./pages/ContentPages'), 'WorksPage');
const StoresPage = lazyNamed(() => import('./pages/ContentPages'), 'StoresPage');
const ContactsPage = lazyNamed(() => import('./pages/ContentPages'), 'ContactsPage');
const PartnerAudiencePage = lazyNamed(
  () => import('./pages/PartnerAudiencePage'),
  'PartnerAudiencePage',
);

const AdminLoginPage = lazyNamed(() => import('./pages/admin/AdminShell'), 'AdminLoginPage');
const AdminGuard = lazyNamed(() => import('./pages/admin/AdminShell'), 'AdminGuard');
const AdminLayout = lazyNamed(() => import('./pages/admin/AdminShell'), 'AdminLayout');
const AdminDashboard = lazyNamed(() => import('./pages/admin/AdminShell'), 'AdminDashboard');
const RequireAdmin = lazyNamed(() => import('./pages/admin/AdminShell'), 'RequireAdmin');
const AdminProductsPage = lazyNamed(() => import('./pages/admin/AdminProducts'), 'AdminProductsPage');
const AdminProductFormPage = lazyNamed(
  () => import('./pages/admin/AdminProducts'),
  'AdminProductFormPage',
);
const AdminCategoriesPage = lazyNamed(() => import('./pages/admin/AdminCrud'), 'AdminCategoriesPage');
const AdminBrandsPage = lazyNamed(() => import('./pages/admin/AdminCrud'), 'AdminBrandsPage');
const AdminLeadsPage = lazyNamed(() => import('./pages/admin/AdminCrud'), 'AdminLeadsPage');
const AdminCollectionPricesPage = lazyNamed(
  () => import('./pages/admin/AdminCollectionPrices'),
  'AdminCollectionPricesPage',
);
const AdminProspectsPage = lazyNamed(
  () => import('./pages/admin/AdminProspects'),
  'AdminProspectsPage',
);
const AdminPromotionsPage = lazyNamed(
  () => import('./pages/admin/AdminCrud'),
  'AdminPromotionsPage',
);

function LazyFallback() {
  return <div className="container-dp py-16 text-sm text-graphite/55">Загрузка…</div>;
}

function LazyRoute({ children }: { children: ReactNode }) {
  return <Suspense fallback={<LazyFallback />}>{children}</Suspense>;
}

export default function App() {
  return (
    <AuthProvider>
      <CityProvider>
        <CartProvider>
          <BrowserRouter
            basename={
              (import.meta.env.BASE_URL.replace(/\/$/, '') || undefined) as string | undefined
            }
          >
            <ScrollToTop />
            <Routes>
              <Route element={<StoreLayout />}>
                <Route index element={<HomePage />} />
                <Route path="catalog" element={<CatalogPage />} />
                <Route path="catalog/:categorySlug" element={<CatalogPage />} />
                <Route path="catalog/:categorySlug/:brandSlug" element={<CatalogPage />} />
                <Route path="catalog/:categorySlug/:brandSlug/:collectionSlug" element={<CatalogPage />} />
                <Route path="product/:slug" element={<ProductPage />} />
                <Route path="cart" element={<CartPage />} />
                <Route
                  path="picker"
                  element={
                    <LazyRoute>
                      <PickerPage />
                    </LazyRoute>
                  }
                />
                <Route
                  path="services"
                  element={
                    <LazyRoute>
                      <ServicesPage />
                    </LazyRoute>
                  }
                />
                <Route
                  path="services/:slug"
                  element={
                    <LazyRoute>
                      <ServiceDetailPage />
                    </LazyRoute>
                  }
                />
                <Route
                  path="promotions"
                  element={
                    <LazyRoute>
                      <PromotionsPage />
                    </LazyRoute>
                  }
                />
                <Route
                  path="works"
                  element={
                    <LazyRoute>
                      <WorksPage />
                    </LazyRoute>
                  }
                />
                <Route
                  path="stores"
                  element={
                    <LazyRoute>
                      <StoresPage />
                    </LazyRoute>
                  }
                />
                <Route
                  path="contacts"
                  element={
                    <LazyRoute>
                      <ContactsPage />
                    </LazyRoute>
                  }
                />
                <Route
                  path="for/:audience"
                  element={
                    <LazyRoute>
                      <PartnerAudiencePage />
                    </LazyRoute>
                  }
                />
              </Route>

              <Route
                path="/admin/login"
                element={
                  <LazyRoute>
                    <AdminLoginPage />
                  </LazyRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <LazyRoute>
                    <AdminGuard />
                  </LazyRoute>
                }
              >
                <Route element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="prospects" element={<AdminProspectsPage />} />
                  <Route path="leads" element={<AdminLeadsPage />} />
                  <Route path="measurements" element={<Navigate to="/admin" replace />} />
                  <Route path="stats" element={<Navigate to="/admin" replace />} />
                  <Route path="stores" element={<Navigate to="/admin" replace />} />

                  {/* Admin-only: prices, catalog, promotions */}
                  <Route element={<RequireAdmin />}>
                    <Route path="products" element={<AdminProductsPage />} />
                    <Route path="products/new" element={<AdminProductFormPage />} />
                    <Route path="products/:id" element={<AdminProductFormPage />} />
                    <Route path="collection-prices" element={<AdminCollectionPricesPage />} />
                    <Route path="categories" element={<AdminCategoriesPage />} />
                    <Route path="brands" element={<AdminBrandsPage />} />
                    <Route path="promotions" element={<AdminPromotionsPage />} />
                  </Route>
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
