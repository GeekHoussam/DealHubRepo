import { useEffect, useState } from 'react';
import { Button } from '../Button';
import { EditableFields, FacilityDetails } from '../../types';

interface FieldEditorFormProps {
  data: Record<string, any>;
  onSave: (payload: EditableFields) => Promise<void>;
  onValidate: () => Promise<void>;
  saving: boolean;
  validating: boolean;
}

export function FieldEditorForm({ data, onSave, onValidate, saving, validating }: FieldEditorFormProps) {
  const [formData, setFormData] = useState<EditableFields>({
    dealName: '',
    borrower: '',
    agent: '',
    pricing: { baseRate: '', marginBps: '' },
    facilities: [{ type: '', currency: '', amount: '' }],
  });

  useEffect(() => {
    setFormData({
      dealName: (data as any).dealName || '',
      borrower: (data as any).borrower || '',
      agent: (data as any).agent || '',
      pricing: {
        baseRate: (data as any).pricing?.baseRate || '',
        marginBps: (data as any).pricing?.marginBps || '',
      },
      facilities: Array.isArray((data as any).facilities)
        ? ((data as any).facilities as FacilityDetails[])
        : [{ type: '', currency: '', amount: '' }],
    });
  }, [data]);

  const updateFacility = (idx: number, key: keyof FacilityDetails, value: string) => {
    setFormData((prev) => {
      const facilities = [...(prev.facilities || [])];
      facilities[idx] = { ...facilities[idx], [key]: value };
      return { ...prev, facilities };
    });
  };

  const addFacility = () => {
    setFormData((prev) => ({
      ...prev,
      facilities: [...(prev.facilities || []), { type: '', currency: '', amount: '' }],
    }));
  };

  const handleSave = async () => {
    await onSave(formData);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <TextField label="Deal name" value={formData.dealName || ''} onChange={(value) => setFormData((prev) => ({ ...prev, dealName: value }))} />
        <TextField label="Borrower" value={formData.borrower || ''} onChange={(value) => setFormData((prev) => ({ ...prev, borrower: value }))} />
        <TextField label="Agent" value={formData.agent || ''} onChange={(value) => setFormData((prev) => ({ ...prev, agent: value }))} />
        <TextField
          label="Base rate"
          value={formData.pricing?.baseRate || ''}
          onChange={(value) => setFormData((prev) => ({ ...prev, pricing: { ...prev.pricing, baseRate: value } }))}
        />
        <TextField
          label="Margin (bps)"
          value={String(formData.pricing?.marginBps ?? '')}
          onChange={(value) => setFormData((prev) => ({ ...prev, pricing: { ...prev.pricing, marginBps: value } }))}
        />
      </div>

      <div className="space-y-2">
        <p className="text-xs uppercase text-gray-500">Facilities</p>
        <div className="space-y-3">
          {(formData.facilities || []).map((facility, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3 border border-gray-200 rounded-lg p-3">
              <TextField label="Type" value={facility.type || ''} onChange={(value) => updateFacility(idx, 'type', value)} />
              <TextField label="Currency" value={facility.currency || ''} onChange={(value) => updateFacility(idx, 'currency', value)} />
              <TextField
                label="Amount"
                value={facility.amount ? String(facility.amount) : ''}
                onChange={(value) => updateFacility(idx, 'amount', value)}
              />
            </div>
          ))}
          <Button variant="secondary" className="text-sm" onClick={addFacility}>
            + Add facility
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
          {saving ? 'Saving...' : 'Save changes'}
        </Button>
        <Button variant="outline" onClick={onValidate} disabled={validating} className="min-w-[120px]">
          {validating ? 'Validating...' : 'Validate'}
        </Button>
      </div>
    </div>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-xs uppercase text-gray-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0B1F3B]"
      />
    </label>
  );
}