import { format } from 'date-fns';
import { AgreementStatusBadge } from '../AgreementStatusBadge';
import { AgreementSummary, UserRole } from '../../types';
import { ActionsCell } from './ActionsCell';

interface AgreementsTableProps {
  data: AgreementSummary[];
  onView: (id: string) => void;
  onEdit?: (id: string) => void;
  onValidate?: (id: string) => void;
  onReextract?: (id: string) => void;
  onManageParticipants?: (id: string) => void;
  role: UserRole;
  isLoading?: boolean;
  emptyMessage?: string;
  showCommitment?: boolean;
}

export function AgreementsTable({
  data,
  onView,
  onEdit,
  onValidate,
  onReextract,
  onManageParticipants,
  role,
  isLoading,
  emptyMessage,
  showCommitment,
}: AgreementsTableProps) {
  return (
     <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-white">
            <tr>
              <HeaderCell label="Agreement name" />
              <HeaderCell label="Borrower" />
              <HeaderCell label="Agent" />
              <HeaderCell label="Facilities" />
              <HeaderCell label="Total amount" />
              {showCommitment && <HeaderCell label="My commitment" />}
              <HeaderCell label="Status" />
              <HeaderCell label="Last updated" />
              <HeaderCell label="Actions" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr>
                <td colSpan={showCommitment ? 9 : 8} className="p-6 text-center text-gray-500">
                  Loading agreements...
                </td>
              </tr>
            )}
            {!isLoading && data.length === 0 && (
              <tr>
                <td colSpan={showCommitment ? 9 : 8} className="p-6 text-center text-gray-500">
                  {emptyMessage || 'No agreements found'}
                </td>
              </tr>
            )}
            {!isLoading &&
              data.map((agreement) => (
                <tr key={agreement.id} className="hover:bg-gray-50 transition">
                  <Cell>{agreement.name}</Cell>
                  <Cell>{agreement.borrower}</Cell>
                  <Cell>{agreement.agent}</Cell>
                  <Cell>{agreement.facilitiesCount}</Cell>
                  <Cell>${agreement.totalAmount.toLocaleString()}</Cell>
                  {showCommitment && <Cell>{agreement.myCommitment ? `$${agreement.myCommitment.toLocaleString()}` : '—'}</Cell>}
                  <Cell>
                    <AgreementStatusBadge status={agreement.status} />
                  </Cell>
                  <Cell>{agreement.updatedAt ? format(new Date(agreement.updatedAt), 'MMM d, yyyy') : '—'}</Cell>
                  <Cell>
                    <ActionsCell
                      agreement={agreement}
                      onView={() => onView(agreement.id)}
                      onEdit={onEdit ? () => onEdit(agreement.id) : undefined}
                      onValidate={onValidate ? () => onValidate(agreement.id) : undefined}
                      onReextract={onReextract ? () => onReextract(agreement.id) : undefined}
                      onManageParticipants={onManageParticipants ? () => onManageParticipants(agreement.id) : undefined}
                      role={role}
                    />
                  </Cell>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HeaderCell({ label }: { label: string }) {
  return (
     <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
      {label}
    </th>
  );
}

function Cell({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 text-sm text-gray-800">{children}</td>;
  
}