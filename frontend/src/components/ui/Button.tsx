import type { ReactNode } from "react";

export function Button({
  children,
  onClick,
  variant = "primary",
  type = "button",
  disabled,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger" | "gold";
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  const styles = {
    primary: "bg-[#16324a] text-paper border border-line hover:bg-[#1c3d59]",
    gold: "bg-gold text-ink hover:bg-gold-2",
    ghost: "bg-transparent text-paper border border-line hover:bg-panel-2",
    danger: "bg-[#3a1b1b] text-loss border border-[#5a2a2a] hover:bg-[#4a2222]",
  }[variant];
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`rounded-lg px-3.5 py-2 text-sm font-semibold disabled:opacity-40 ${styles} ${className}`}>
      {children}
    </button>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1.5 block text-mist">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-gold";
