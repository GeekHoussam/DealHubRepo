import { ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  children: React.ReactNode;
}

export function Button({ variant = 'primary', children, className, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'px-4 py-2 rounded-[10px] transition-all',
        {
          'bg-[#0B1F3B] text-white hover:bg-[#102A52] shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed': variant === 'primary',
          'bg-gray-100 text-gray-900 hover:bg-gray-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed': variant === 'secondary',
          'border border-[#0B1F3B] text-[#0B1F3B] hover:bg-[#E6ECF5] disabled:text-gray-400 disabled:border-gray-300 disabled:cursor-not-allowed': variant === 'outline',
        },
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}