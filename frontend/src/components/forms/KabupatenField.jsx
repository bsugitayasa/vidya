import { useState } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { KABUPATEN_BALI, KABUPATEN_OTHER } from '../../lib/kabupatenBali';

export default function KabupatenField({ value = '', onChange, error }) {
  const isPresetValue = KABUPATEN_BALI.includes(value);
  const [isOther, setIsOther] = useState(Boolean(value) && !isPresetValue);

  const handleSelectionChange = (event) => {
    const selectedValue = event.target.value;
    if (selectedValue === KABUPATEN_OTHER) {
      setIsOther(true);
      onChange('');
      return;
    }

    setIsOther(false);
    onChange(selectedValue);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="kabupatenSelection">Kabupaten / Kota *</Label>
      <select
        id="kabupatenSelection"
        value={isOther ? KABUPATEN_OTHER : value}
        onChange={handleSelectionChange}
        className="flex h-10 w-full rounded-md border border-muted/30 bg-surface px-3 py-2 text-sm text-text shadow-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">Pilih Kabupaten / Kota</option>
        {KABUPATEN_BALI.map((kabupaten) => (
          <option key={kabupaten} value={kabupaten}>{kabupaten}</option>
        ))}
        <option value={KABUPATEN_OTHER}>Other / Lainnya</option>
      </select>

      {isOther && (
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Masukkan nama Kabupaten / Kota"
          aria-label="Nama Kabupaten atau Kota lainnya"
          autoFocus
        />
      )}

      {error && <p className="text-sm text-red-500">{error.message}</p>}
    </div>
  );
}
