import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Field, inputClass } from "../components/ui/Button";
import { APP_MARK, APP_NAME, APP_SHORT, APP_SLOGAN, APP_BLURB } from "../brand";
import { useEnergy } from "../store/EnergyFlowContext";
import { ROLE_LABEL } from "../types";

const LOOP = [
  { n: "01", t: "Purchase", d: "Land the cargo in GH₵, with freight, tax and FX in the ticket." },
  { n: "02", t: "Inventory", d: "Know what sits in the tanks before the next lift." },
  { n: "03", t: "Price & margin", d: "Sell off true cost, not the last pump rumour." },
];

const GRADES = [
  { name: "PMS", tone: "bg-[#c6b37a] text-ink" },
  { name: "AGO", tone: "bg-[#2c3338] text-gold-2 ring-1 ring-line" },
  { name: "LPG", tone: "bg-[#8f7349] text-paper" },
  { name: "Jet A-1", tone: "bg-[#3d5a73] text-paper" },
];

export default function Login() {
  const { state, dispatch } = useEnergy();
  const navigate = useNavigate();
  const [email, setEmail] = useState("oscar.d@example.net");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState("");
  const brent = state.market.find((m) => m.id === "m_brent");
  const wti = state.market.find((m) => m.id === "m_wti");
  const fx = state.market.find((m) => m.id === "m_usd_ghs");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: "login", email, password });
    const user = state.users.find((u) => u.email === email && u.password === password && u.status === "active");
    if (!user) {
      setError("Invalid credentials or suspended tenant.");
      return;
    }
    const co = user.companyId ? state.companies.find((c) => c.id === user.companyId) : null;
    if (user.companyId && co?.status === "suspended") {
      setError("This company is suspended.");
      return;
    }
    navigate(user.role === "super_admin" ? "/admin" : "/");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink text-paper">
      <img
        src="/landing-tankfarm.jpg"
        alt="Coastal petroleum tank farm at dusk"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/90 to-[#0a1218]/45" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-[#0a1218]/55" />

      <div className="product-rail relative z-10">
        <span /><span /><span /><span />
      </div>

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-6px)] max-w-[1440px] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="flex flex-col justify-between px-5 py-7 sm:px-10 lg:px-14 lg:py-10">
          <header className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-md bg-gold text-sm font-bold text-ink">
              {APP_MARK}
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.08em] uppercase">{APP_SHORT}</p>
              <p className="max-w-[16rem] text-[11px] leading-snug text-mist">{APP_NAME}</p>
            </div>
          </header>

          <div className="my-8 max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold-2">Downstream · tanks · cargo · margin</p>
            <h1 className="mt-4 font-display text-[2.2rem] font-medium leading-[1.08] text-paper sm:text-5xl lg:text-[3.15rem]">
              {APP_SLOGAN}
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-mist sm:text-base">{APP_BLURB}</p>

            <div className="mt-6 flex flex-wrap gap-2">
              {GRADES.map((g) => (
                <span key={g.name} className={`rounded-sm px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${g.tone}`}>
                  {g.name}
                </span>
              ))}
            </div>

            <ol className="mt-8 space-y-3 border-l border-line pl-4">
              {LOOP.map((s) => (
                <li key={s.n}>
                  <span className="num text-[10px] text-gold">{s.n}</span>
                  <span className="ml-2 text-sm font-semibold">{s.t}</span>
                  <p className="text-sm text-mist">{s.d}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="relative h-24 w-full max-w-[220px] overflow-hidden rounded-md ring-1 ring-line">
              <img src="/landing-tanker.jpg" alt="Fuel tanker at a depot loading bay" className="h-full w-full object-cover" />
              <span className="absolute bottom-1.5 left-1.5 rounded-sm bg-ink/80 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-gold-2">
                Loading bay
              </span>
            </div>
            <div className="grid flex-1 grid-cols-3 gap-2">
              {[
                { k: "Brent", v: brent ? `$${brent.price.toFixed(2)}` : "—" },
                { k: "WTI", v: wti ? `$${wti.price.toFixed(2)}` : "—" },
                { k: "USD/GHS", v: fx ? fx.price.toFixed(2) : "—" },
              ].map((t) => (
                <div key={t.k} className="rounded-md border border-line bg-ink/70 px-2.5 py-2 backdrop-blur-sm">
                  <p className="text-[9px] uppercase tracking-wider text-mist">
                    {t.k} <span className="text-gold">Demo</span>
                  </p>
                  <p className="num mt-0.5 text-base text-gold-2">{t.v}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-end p-4 sm:p-8 lg:items-center lg:p-10">
          <div className="w-full overflow-hidden rounded-md border border-line bg-ink/80 shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-line bg-panel px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-gold-2">
              <span>Commercial desk</span>
              <span className="num font-medium tracking-normal opacity-90">Tema · Accra</span>
            </div>
            <div className="p-6 sm:p-8">
              <h2 className="font-display text-3xl font-medium">Open the book</h2>
              <p className="mt-2 text-sm text-mist">
                This is a demo company. Password for every account is <span className="num text-gold-2">demo123</span>.
              </p>

              <form className="mt-6 space-y-4" onSubmit={submit}>
                <Field label="Email">
                  <input className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
                </Field>
                <Field label="Password">
                  <input className={inputClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
                </Field>
                {error && <p className="text-sm text-loss">{error}</p>}
                <Button type="submit" variant="gold" className="w-full py-2.5">
                  Enter commercial desk
                </Button>
              </form>

              <p className="mt-7 text-[11px] font-semibold uppercase tracking-[0.16em] text-mist">Demo desks</p>
              <div className="mt-3 max-h-56 overflow-y-auto rounded-md border border-line">
                {state.users.map((u) => {
                  const co = state.companies.find((c) => c.id === u.companyId);
                  const active = email === u.email;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      className={`flex w-full items-center justify-between gap-3 border-b border-line px-4 py-3 text-left last:border-0 ${active ? "bg-panel-2" : "hover:bg-panel"}`}
                      onClick={() => {
                        setEmail(u.email);
                        setPassword(u.password);
                        setError("");
                      }}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{u.name}</span>
                        <span className="block truncate text-xs text-mist">{co?.shortName ?? "Platform"} · {u.email}</span>
                      </span>
                      <span className={`shrink-0 text-[10px] font-semibold uppercase tracking-wide ${active ? "text-gold-2" : "text-gold"}`}>
                        {ROLE_LABEL[u.role]}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-4 text-[11px] text-mist">Market prints and photos are illustrative. Not a live depot camera or live tape.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
