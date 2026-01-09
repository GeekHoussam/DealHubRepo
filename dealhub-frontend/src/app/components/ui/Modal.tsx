// src/app/ui/Modal.tsx
import React from "react";

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  right,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-start justify-between gap-3">
          <div>
            <div className="font-semibold text-[#0B1F3B] text-lg">{title}</div>
            {subtitle && <div className="text-xs text-gray-600 mt-0.5">{subtitle}</div>}
          </div>

          <div className="flex items-center gap-2">
            {right}
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>

        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
