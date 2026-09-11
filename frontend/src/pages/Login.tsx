import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Field, inputClass } from "../components/ui/Button";
import { APP_MARK, APP_NAME, APP_SLOGAN, APP_BLURB } from "../brand";
import { useEnergy } from "../store/EnergyFlowContext";
import { ROLE_LABEL } from "../types";

export default function Login() {
  const { state, dispatch } = useEnergy();
  const navigate = useNavigate();
  const [email, setEmail] = useState("oscar.d@example.net");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState("");

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
    <div className="min-h-screen bg-ink text-paper">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="relative hidden overflow-hidden lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#1a3a28_0%,_#07111c_55%)]" />
          <div className="relative flex h-full flex-col justify-between p-12">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-gold font-bold text-ink">{APP_MARK}</div>
              <span className="max-w-xs text-sm font-semibold leading-snug">{APP_NAME}</span>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">For OMCs, BDCs and fuel distributors</p>
              <h1 className="mt-4 max-w-lg text-4xl font-semibold leading-tight">{APP_SLOGAN}</h1>
              <p className="mt-4 max-w-md text-mist">{APP_BLURB}</p>
            </div>
            <p className="text-xs text-mist">Demo environment · prices and books are labelled demo · JWT is local-only until the Django API is connected.</p>
          </div>
        </section>
        <section className="flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <h2 className="text-2xl font-semibold">Sign in</h2>
            <p className="mt-1 text-sm text-mist">Use a demo tenant below. Password for all accounts: demo123</p>
            <form className="mt-8 space-y-4" onSubmit={submit}>
              <Field label="Email">
                <input className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
              </Field>
              <Field label="Password">
                <input className={inputClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
              </Field>
              {error && <p className="text-sm text-loss">{error}</p>}
              <Button type="submit" variant="gold" className="w-full">
                Continue
              </Button>
            </form>
            <div className="mt-8 rounded-2xl border border-line">
              {state.users.map((u) => (
                <button
                  key={u.id}
                  className="flex w-full items-center justify-between border-b border-line px-4 py-3 text-left last:border-0 hover:bg-panel"
                  onClick={() => {
                    setEmail(u.email);
                    setPassword(u.password);
                    setError("");
                  }}
                >
                  <span>
                    <span className="block text-sm font-medium">{u.name}</span>
                    <span className="text-xs text-mist">{u.email}</span>
                  </span>
                  <span className="text-[11px] uppercase tracking-wide text-gold">{ROLE_LABEL[u.role]}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
