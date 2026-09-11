import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/EmptyState";
import { PLANS, ROLE_LABEL } from "../types";
import { useEnergy, useSession } from "../store/EnergyFlowContext";

export default function Settings() {
  const { state, dispatch } = useEnergy();
  const { user, company } = useSession();
  const locCount = state.locations.filter((l) => l.companyId === company?.id).length;
  const userCount = state.users.filter((u) => u.companyId === company?.id).length;
  const plan = PLANS.find((p) => p.id === company?.planId);

  return (
    <div>
      <PageHeader eyebrow="Workspace" title="Settings" subtitle="Tenant profile, plan limits and demo controls. Secrets never appear here." />
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-panel p-5">
          <h2 className="font-semibold">Company</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row k="Legal name" v={company?.name ?? "Platform"} />
            <Row k="City" v={company?.city ?? "—"} />
            <Row k="NPA licence" v={company?.licenseNo ?? "—"} />
            <Row k="Plan" v={plan?.name ?? "—"} />
            <Row k="Users" v={`${userCount} / ${plan?.userLimit ?? "—"}`} />
            <Row k="Locations" v={`${locCount} / ${plan?.locationLimit ?? "—"}`} />
            <Row k="Your role" v={user ? ROLE_LABEL[user.role] : "—"} />
          </dl>
        </section>
        <section className="rounded-2xl border border-line bg-panel p-5">
          <h2 className="font-semibold">Security posture (frontend)</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-mist">
            <li>Demo JWT is a local token, not a signed production secret.</li>
            <li>Passwords in this MVP are seed credentials for UX only — Django will hash them.</li>
            <li>Tenant documents always carry companyId; UI never shows another company book.</li>
            <li>REST client in src/api/client.ts is the swap point for /api/*.</li>
          </ul>
          <Button className="mt-4" variant="danger" onClick={() => dispatch({ type: "reset" })}>
            Reset demo data
          </Button>
        </section>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line py-2">
      <dt className="text-mist">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
