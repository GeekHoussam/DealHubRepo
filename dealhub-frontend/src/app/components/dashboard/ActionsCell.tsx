import { Eye, Edit3, ShieldCheck, RefreshCw, UsersRound } from 'lucide-react';
import { AgreementSummary, UserRole } from '../../types';
import { Button } from '../Button';

interface ActionsCellProps {
  agreement: AgreementSummary;
  onView: () => void;
  onEdit?: () => void;
  onValidate?: () => void;
  onReextract?: () => void;
  onManageParticipants?: () => void;
  role: UserRole;
}

export function ActionsCell({
  agreement,
  onEdit,
  onValidate,
  onReextract,
  onManageParticipants,
  onView,
  role,
}: ActionsCellProps) {
  const isDraft = agreement.status === 'DRAFT';

  if (role === 'LENDER') {
    return <ActionButton icon={<Eye className="w-4 h-4" />} label="View" onClick={onView} />;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <ActionButton icon={<Eye className="w-4 h-4" />} label="View" onClick={onView} />
      {isDraft && <ActionButton icon={<Edit3 className="w-4 h-4" />} label="Edit" onClick={onEdit} disabled={!onEdit} />}
      {isDraft && (
        <ActionButton icon={<ShieldCheck className="w-4 h-4" />} label="Validate" onClick={onValidate} disabled={!onValidate} />
      )}
      <ActionButton
        icon={<RefreshCw className="w-4 h-4" />}
        label="Re-extract"
        onClick={onReextract}
        disabled={!onReextract}
      />
      <ActionButton
        icon={<UsersRound className="w-4 h-4" />}
        label="Participants"
        onClick={onManageParticipants}
        disabled={!onManageParticipants}
      />
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      variant="outline"
      className="flex items-center gap-1 text-xs px-3 py-1 rounded-full"
      onClick={onClick}
      disabled={disabled || !onClick}
    >
      {icon}
      {label}
    </Button>
  );
}