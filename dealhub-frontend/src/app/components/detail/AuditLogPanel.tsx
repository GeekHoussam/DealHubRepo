import { format } from 'date-fns';
import { AuditLogEntry } from '../../types';

export function AuditLogPanel({ entries }: { entries: AuditLogEntry[] }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
      <h4 className="text-lg font-semibold text-gray-800">Audit log</h4>
      {entries.length === 0 ? (
        <p className="text-sm text-gray-500">No audit activity yet</p>
      ) : (
        <ul className="space-y-2">
          {entries.map((entry, idx) => (
            <li key={`${entry.ts}-${idx}`} className="border border-gray-100 rounded-lg p-3">
              <p className="text-sm text-gray-800">
                <span className="font-semibold">{entry.actorName}</span> — {entry.action}
              </p>
              {entry.details && <p className="text-xs text-gray-600">{entry.details}</p>}
              <p className="text-xs text-gray-500 mt-1">{format(new Date(entry.ts), 'PPpp')}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}