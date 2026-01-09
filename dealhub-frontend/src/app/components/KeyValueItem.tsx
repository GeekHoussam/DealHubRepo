interface KeyValueItemProps {
  label: string;
  value: string;
}

export function KeyValueItem({ label, value }: KeyValueItemProps) {
  return (
    <div className="flex justify-between items-start py-2">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-right text-[#0B1F3B]">{value}</span>
    </div>
  );
}