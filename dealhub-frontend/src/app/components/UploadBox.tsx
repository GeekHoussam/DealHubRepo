import { Upload } from 'lucide-react';
import { useRef } from 'react';

interface UploadBoxProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function UploadBox({ onFileSelect, disabled }: UploadBoxProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      onFileSelect(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#0B1F3B] hover:bg-[#F9FAFB] transition-colors"
    >
      <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
      <p className="text-sm text-gray-600 mb-1">Drag & drop PDF here</p>
      <p className="text-sm text-gray-500 mb-3">or</p>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className="px-4 py-2 bg-[#E6ECF5] text-[#0B1F3B] rounded-lg hover:bg-[#d8e2f0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Browse PDF
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileInput}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}