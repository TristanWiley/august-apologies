import React from "react";
import { Nav } from "../nav";
import { Link } from "react-router";

export const ApologiesPage: React.FC = () => {
  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<
    Array<{ id: string; username: string; subject: string; excerpt: string }>
  >([]);
  const [error, setError] = React.useState<string | null>(null);

  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [total, setTotal] = React.useState(0);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/apologies?page=${page}&pageSize=${pageSize}`
        );
        if (!res.ok) throw new Error("Failed to load apologies");
        const data = await res.json();
        if (!mounted) return;
        setItems(data.items || []);
        setTotal(data.total || 0);
      } catch (err: unknown) {
        console.error(err);
        if (!mounted) return;
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg || "Error");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="h-full flex flex-col items-center gap-6 px-4">
      <Nav />

      <main className="w-full max-w-4xl mt-4">
        <h1 className="text-2xl font-bold">Public Apologies</h1>

        {loading ? (
          <div className="mt-6">
            <p className="text-xl">Loading…</p>
          </div>
        ) : error ? (
          <div className="mt-6 text-red-500">{error}</div>
        ) : items.length === 0 ? (
          <div className="mt-6">No public apologies yet.</div>
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            {items.map((it) => (
              <div key={it.id} className="p-4 border rounded bg-slate-900/40">
                <div className="flex justify-between items-center">
                  <div>
                    <Link
                      to={`/view/${it.id}`}
                      className="text-lg font-semibold text-[#DCC7FF]"
                    >
                      {it.subject}
                    </Link>
                    <div className="text-sm text-slate-400">
                      by {it.username}
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-slate-300">
                  {it.excerpt}
                  {it.excerpt.length >= 240 ? "…" : ""}
                </p>
              </div>
            ))}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1 rounded-md bg-slate-800 text-sm text-slate-200 hover:bg-slate-700 disabled:opacity-50"
                >
                  Prev
                </button>
                <div className="text-sm">
                  Page {page} / {totalPages}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1 rounded-md bg-slate-800 text-sm text-slate-200 hover:bg-slate-700 disabled:opacity-50"
                >
                  Next
                </button>
              </div>

              <div>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="bg-slate-800 text-sm text-slate-200 px-2 py-1 rounded-md"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
