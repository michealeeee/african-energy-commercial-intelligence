import { useMemo, useState, type ReactNode } from "react";
import { EmptyState } from "./EmptyState";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sort?: (row: T) => string | number;
}

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  searchPlaceholder = "Search",
  filter,
  pageSize = 8,
  empty = "No records yet.",
}: {
  rows: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  filter?: (row: T, q: string) => boolean;
  pageSize?: number;
  empty?: string;
}) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return rows;
    if (filter) return rows.filter((r) => filter(r, query));
    return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(query));
  }, [rows, q, filter]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const slice = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-panel">
      <div className="flex flex-col gap-3 border-b border-line p-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          placeholder={searchPlaceholder}
          className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-gold sm:max-w-xs"
        />
        <p className="text-xs text-mist">{filtered.length} records</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-panel-2 text-xs uppercase tracking-wider text-mist">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="whitespace-nowrap px-4 py-3 font-medium">
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((row) => (
              <tr key={row.id} className="border-t border-line/80 hover:bg-panel-2/60">
                {columns.map((c) => (
                  <td key={c.key} className="whitespace-nowrap px-4 py-3">
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {slice.length === 0 && <EmptyState title={empty} />}
      <div className="flex items-center justify-between border-t border-line px-4 py-3 text-xs text-mist">
        <span>
          Page {safePage + 1} / {pages}
        </span>
        <div className="flex gap-2">
          <button disabled={safePage === 0} className="rounded border border-line px-2 py-1 disabled:opacity-30" onClick={() => setPage((p) => p - 1)}>
            Prev
          </button>
          <button disabled={safePage >= pages - 1} className="rounded border border-line px-2 py-1 disabled:opacity-30" onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
