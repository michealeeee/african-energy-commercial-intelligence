import { APP_NAME } from "../brand";

export function ghs(n: number, digits = 0) {
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString("en-GH", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  return `${n < 0 ? "-" : ""}GH₵${formatted}`;
}

export function usd(n: number, digits = 2) {
  return `$${n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

export function litres(n: number) {
  return `${n.toLocaleString("en-GH")} L`;
}

export function pct(n: number, digits = 1) {
  return `${n.toFixed(digits)}%`;
}

export function money(n: number, currency: "GHS" | "USD", digits = 2) {
  return currency === "USD" ? usd(n, digits) : ghs(n, digits);
}

export function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function daysAgo(n: number, from = new Date("2026-09-11T08:00:00Z")) {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() - n);
  return isoDate(d);
}

export function formatDate(iso: string) {
  return new Date(iso + (iso.length === 10 ? "T00:00:00Z" : "")).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function changePct(current: number, previous: number) {
  if (!previous) return 0;
  return ((current - previous) / previous) * 100;
}

export function exportCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v).replaceAll('"', '""')}"`;
  const csv = [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function exportPdf(title: string, htmlTable: string) {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(`<!doctype html><html><head><title>${title}</title>
    <style>
      body { font-family: Georgia, serif; padding: 32px; color: #102030; }
      h1 { font-size: 18px; }
      p { color: #667; font-size: 12px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #ccd; padding: 6px 8px; text-align: left; }
      th { background: #102030; color: #fff; }
    </style></head><body>
    <h1>${title}</h1>
    <p>${APP_NAME} · Ghana commercial book · Generated ${new Date().toUTCString()}</p>
    ${htmlTable}
    </body></html>`);
  w.document.close();
  w.focus();
  w.print();
}
