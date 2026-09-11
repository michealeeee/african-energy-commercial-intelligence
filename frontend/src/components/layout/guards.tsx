import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Locked } from "../ui/EmptyState";
import { planHas } from "../../lib/permissions";
import { useSession } from "../../store/EnergyFlowContext";
import type { FeatureKey } from "../../types";

export function RequireAuth({ admin }: { admin?: boolean }) {
  const { user } = useSession();
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== "super_admin") return <Navigate to="/" replace />;
  if (!admin && user.role === "super_admin") return <Navigate to="/admin" replace />;
  return <Outlet />;
}

export function PlanGate({ feature, children, plan = "Professional" }: { feature: FeatureKey; children: ReactNode; plan?: string }) {
  const { company } = useSession();
  if (!company) return <>{children}</>;
  if (!planHas(company.planId, feature)) return <Locked plan={plan} />;
  return <>{children}</>;
}
