const NAV = [
  { to: "/", label: "Dashboard" },
  { to: "/market", label: "Market Intelligence" },
  { to: "/purchases", label: "Purchases" },
  { to: "/sales", label: "Sales" },
  { to: "/inventory", label: "Inventory" },
  { to: "/positions", label: "Positions" },
  { to: "/pricing", label: "Pricing Calculator" },
  { to: "/customers", label: "Customers" },
  { to: "/suppliers", label: "Suppliers" },
  { to: "/contracts", label: "Contracts" },
  { to: "/products", label: "Products" },
  { to: "/analytics", label: "Analytics" },
  { to: "/reports", label: "Reports" },
  { to: "/assistant", label: "AI Assistant" },
  { to: "/alerts", label: "Alerts" },
  { to: "/settings", label: "Settings" },
];

const ADMIN_NAV = [
  { to: "/admin", label: "Overview" },
  { to: "/admin/companies", label: "Companies" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/billing", label: "Subscriptions" },
  { to: "/admin/market", label: "Market settings" },
  { to: "/admin/config", label: "System config" },
  { to: "/admin/audit", label: "Audit logs" },
];

import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { planHas } from "../../lib/permissions";
import { NAV_FEATURES } from "../../lib/permissions";
import { openAlerts, useEnergy, useSession } from "../../store/EnergyFlowContext";
import { APP_MARK, APP_NAV_TAGLINE, APP_SHORT } from "../../brand";
import { ROLE_LABEL } from "../../types";
import { useState } from "react";

export function AppShell() {
  const { user, company } = useSession();
  const { state, dispatch } = useEnergy();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const alerts = openAlerts(state.alerts, company?.id ?? null).filter((a) => a.status === "open");
  const isAdmin = user?.role === "super_admin";
  const items = isAdmin
    ? ADMIN_NAV
    : NAV.filter((n) => {
        const f = NAV_FEATURES[n.to];
        if (!f || !company) return true;
        return planHas(company.planId, f);
      });

  return (
    <div className="min-h-screen bg-ink text-paper lg:grid lg:grid-cols-[260px_1fr]">
      <aside className={`fixed inset-y-0 left-0 z-40 w-[260px] border-r border-line bg-[#081018] transition-transform lg:static lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-16 items-center gap-3 border-b border-line px-5">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-gold text-sm font-bold text-ink">{APP_MARK}</div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-wide">{APP_SHORT}</p>
            <p className="truncate text-[11px] text-mist">{APP_NAV_TAGLINE}</p>
          </div>
        </div>
        <nav className="space-y-0.5 p-3">
          {items.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/" || n.to === "/admin"}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm ${isActive ? "bg-panel-2 text-gold-2" : "text-mist hover:bg-panel hover:text-paper"}`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}
      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-line bg-ink/90 px-4 backdrop-blur">
          <button className="rounded-lg border border-line px-3 py-1.5 text-sm lg:hidden" onClick={() => setOpen(true)}>
            Menu
          </button>
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-sm font-semibold">{isAdmin ? "Platform control" : company?.name}</p>
            <p className="text-[11px] text-mist">{isAdmin ? "Super Admin" : `${company?.city} · ${company?.planId} · NPA ${company?.licenseNo}`}</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="rounded-full border border-line px-2 py-1 text-[11px] uppercase tracking-wide text-gold">Demo book</span>
            {!isAdmin && (
              <button className="relative text-sm text-mist" onClick={() => navigate("/alerts")}>
                Alerts
                {alerts.length > 0 && <span className="ml-1 rounded-full bg-loss px-1.5 text-[10px] text-white">{alerts.length}</span>}
              </button>
            )}
            <div className="text-right">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-[11px] text-mist">{user ? ROLE_LABEL[user.role] : ""}</p>
            </div>
            <button
              className="rounded-lg border border-line px-3 py-1.5 text-xs text-mist"
              onClick={() => {
                dispatch({ type: "logout" });
                navigate("/");
              }}
            >
              Sign out
            </button>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
