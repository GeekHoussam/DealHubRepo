interface RawTextPreviewProps {
  text: string;
}

export function RawTextPreview({ text }: RawTextPreviewProps) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <textarea
        readOnly
        value={text}
        className="w-full h-64 bg-transparent font-mono text-sm text-gray-700 resize-none focus:outline-none"
        placeholder="No raw text available"
      />
    </div>
  );
}
