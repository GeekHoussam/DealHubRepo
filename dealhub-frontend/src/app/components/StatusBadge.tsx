import { clsx } from 'clsx';

interface StatusBadgeProps {
  status: 'ready' | 'extracting' | 'extracted';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig = {
    ready: {
      text: 'Ready',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700',
    },
    extracting: {
      text: 'Extracting…',
      bgColor: 'bg-amber-100',
      textColor: 'text-amber-700',
    },
    extracted: {
      text: 'Extracted',
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
    },
  };

  const config = statusConfig[status];

  return (
    <span className={clsx('px-3 py-1 rounded-full text-sm', config.bgColor, config.textColor)}>
      {config.text}
    </span>
  );
}