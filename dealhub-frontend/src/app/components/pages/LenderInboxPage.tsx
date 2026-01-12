import { useEffect, useMemo, useState } from "react";
import {
  getLenderInbox,
  type LenderInboxMessageDto,
} from "../../api/agreementsApi";

function formatDate(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function prettyJson(value: unknown): string {
  if (value === null || value === undefined) return "(empty payload)";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function LenderInboxPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<LenderInboxMessageDto[]>([]);
  const [open, setOpen] = useState<LenderInboxMessageDto | null>(null);

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });
  }, [rows]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getLenderInbox();
      setRows(data ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load inbox");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-white">My Inbox</h2>
          <p className="text-white/80 mt-1 text-sm">
            Latest payloads routed to your lender account.
          </p>
        </div>

        <button
          onClick={load}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-white text-[#0B1F3B] text-sm font-medium shadow hover:bg-gray-100 disabled:opacity-60"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800">
          <div className="font-semibold">Error</div>
          <div className="mt-1">{error}</div>
        </div>
      )}

      {!loading && !error && sorted.length === 0 && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="font-semibold text-[#0B1F3B]">
            No payloads received yet
          </div>
          <div className="text-sm text-gray-600 mt-1">
            When a deal is distributed to your lender, it will appear here.
          </div>
        </div>
      )}

      {sorted.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">Created At</th>
                  <th className="px-4 py-3 font-medium">Deal Name</th>
                  <th className="px-4 py-3 font-medium">Recipient Email</th>
                  <th className="px-4 py-3 font-medium w-32">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {sorted.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">
                      {formatDate(r.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-[#0B1F3B] font-medium">
                      {r.dealName || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {r.recipientEmail || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setOpen(r)}
                        className="px-3 py-1.5 rounded-lg bg-[#E6ECF5] text-[#0B1F3B] text-xs font-semibold hover:bg-gray-100"
                      >
                        View JSON
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div>
                <div className="font-semibold text-[#0B1F3B]">Payload JSON</div>
                <div className="text-xs text-gray-600 mt-0.5">
                  {open.dealName || "—"} • {formatDate(open.createdAt)}
                </div>
              </div>

              <button
                onClick={() => setOpen(null)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            <div className="p-4">
              <pre className="max-h-[70vh] overflow-auto text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 whitespace-pre-wrap break-words">
                {prettyJson(open.payload)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
