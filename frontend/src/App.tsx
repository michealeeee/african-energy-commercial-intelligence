import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { RequireAuth } from "./components/layout/guards";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Market from "./pages/Market";
import Purchases from "./pages/Purchases";
import Sales from "./pages/Sales";
import Inventory from "./pages/Inventory";
import Positions from "./pages/Positions";
import Pricing from "./pages/Pricing";
import Customers from "./pages/Customers";
import Suppliers from "./pages/Suppliers";
import Contracts from "./pages/Contracts";
import Products from "./pages/Products";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import Assistant from "./pages/Assistant";
import Alerts from "./pages/Alerts";
import Settings from "./pages/Settings";
import AdminHome, { AdminAudit, AdminBilling, AdminCompanies, AdminConfig, AdminMarket, AdminUsers } from "./pages/Admin";
import { useSession } from "./store/EnergyFlowContext";

export default function App() {
  const { user } = useSession();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === "super_admin" ? "/admin" : "/"} replace /> : <Login />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/market" element={<Market />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/positions" element={<Positions />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/contracts" element={<Contracts />} />
          <Route path="/products" element={<Products />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>
      <Route element={<RequireAuth admin />}>
        <Route element={<AppShell />}>
          <Route path="/admin" element={<AdminHome />} />
          <Route path="/admin/companies" element={<AdminCompanies />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/billing" element={<AdminBilling />} />
          <Route path="/admin/market" element={<AdminMarket />} />
          <Route path="/admin/config" element={<AdminConfig />} />
          <Route path="/admin/audit" element={<AdminAudit />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to={user ? (user.role === "super_admin" ? "/admin" : "/") : "/login"} replace />} />
    </Routes>
  );
}
