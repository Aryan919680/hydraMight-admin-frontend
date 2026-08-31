import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "./pages/NotFound.tsx";
import AdminLayout from "./components/AdminLayout";
import Login from "./pages/Login";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Inventory from "./pages/Inventory";
import Pricing from "./pages/Pricing";
import Orders from "./pages/Orders";
import Customers from "./pages/Customers";
import UsersAndRoles from "./pages/UsersAndRoles";
import Locations from "./pages/Locations";
import AuditLogs from "./pages/AuditLogs";
import CommercialSignups from "./pages/CommercialSignups";
import Distributors from "./pages/Distributors";
import { Navigate } from "react-router-dom";
import DistributorProducts from "./pages/DistributorProducts";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />

      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/" element={<Orders />} />
              <Route path="/products" element={<Products />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/users" element={<UsersAndRoles />} />
              <Route path="/locations" element={<Locations />} />
              <Route path="/commercial-signups" element={<CommercialSignups />} />
              <Route path="/distributors" element={<Navigate to="/distributors/stockists" replace />} />
              <Route path="/distributors/stockists" element={<Distributors view="stockists" />} />
              <Route path="/distributors/agencies" element={<Distributors view="agencies" />} />
              <Route path="/distributors/agency-requests" element={<Distributors view="agencyRequests" />} />
              <Route path="/distributor-products" element={<DistributorProducts />} />
              <Route path="/audit" element={<AuditLogs />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;