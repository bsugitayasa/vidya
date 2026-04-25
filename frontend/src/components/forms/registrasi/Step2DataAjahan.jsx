import React from 'react';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import ProgramAjahanPicker from './ProgramAjahanPicker';
import RincianPunia from './RincianPunia';
import FileDropzone from '../../upload/FileDropzone';
import { usePuniaCalculator } from '../../../hooks/usePuniaCalculator';

export default function Step2DataAjahan({ 
  register, 
  errors, 
  programs, 
  rekeningInfo,
  selectedPrograms,
  pasanganOptions,
  onProgramChange,
  onFileSelected
}) {
  const puniaCalc = usePuniaCalculator(selectedPrograms, pasanganOptions, programs);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      
      {/* Bagian Informasi Ajahan */}
      <section>
        <h3 className="text-xl font-bold font-heading text-primary border-b border-muted/30 pb-2 mb-4">Informasi Ajahan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="namaGriya">Nama Griya *</Label>
            <Input 
              id="namaGriya" 
              placeholder="Contoh: Griya Gede" 
              {...register('namaGriya')}
            />
            {errors.namaGriya && <p className="text-sm text-red-500">{errors.namaGriya.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="namaDesa">Nama Desa / Kecamatan *</Label>
            <Input 
              id="namaDesa" 
              placeholder="Contoh: Desa Sanur" 
              {...register('namaDesa')}
            />
            {errors.namaDesa && <p className="text-sm text-red-500">{errors.namaDesa.message}</p>}
          </div>
        </div>
      </section>

      {/* Bagian Pilihan Program */}
      <section>
        <div className="mb-4">
          <h3 className="text-xl font-bold font-heading text-primary inline-block">Program Ajahan</h3>
          <p className="text-sm text-muted">Pilih satu atau lebih program yang ingin diikuti.</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <ProgramAjahanPicker 
              programs={programs}
              selectedPrograms={selectedPrograms}
              pasanganOptions={pasanganOptions}
              onChange={onProgramChange}
            />
            {errors.programs && <p className="text-sm text-red-500 mt-2">{errors.programs.message}</p>}
          </div>
          <div className="lg:col-span-2">
            <div className="sticky top-4">
              <RincianPunia 
                total={puniaCalc.total} 
                items={puniaCalc.items} 
                rekeningInfo={rekeningInfo}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Bagian Upload Dokumen */}
      <section>
        <h3 className="text-xl font-bold font-heading text-primary border-b border-muted/30 pb-2 mb-4">Upload Dokumen (Opsional)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface p-4 rounded-lg border border-muted/20">
          <div>
            <FileDropzone 
              label="KTP / KK / Ijasah Terakhir"
              accept={{ 'image/*': ['.png', '.jpg', '.jpeg'], 'application/pdf': ['.pdf'] }}
              maxSize={5 * 1024 * 1024}
              helperText="Format: JPG, PNG, PDF | Maks: 5MB"
              onFileSelected={(file) => onFileSelected('fileIdentitas', file)}
            />
            <FileDropzone 
              label="Foto Latar Belakang Merah"
              accept={{ 'image/*': ['.png', '.jpg', '.jpeg'] }}
              maxSize={3 * 1024 * 1024}
              helperText="Format: JPG, PNG | Maks: 3MB"
              onFileSelected={(file) => onFileSelected('fileFoto', file)}
            />
          </div>
          <div>
            <div className="h-full flex flex-col">
              <FileDropzone 
                label="Bukti Transfer Punia"
                accept={{ 'image/*': ['.png', '.jpg', '.jpeg'], 'application/pdf': ['.pdf'] }}
                maxSize={5 * 1024 * 1024}
                helperText="Format: JPG, PNG, PDF | Maks: 5MB"
                onFileSelected={(file) => onFileSelected('filePunia', file)}
              />
              <div className="mt-auto bg-primary/10 p-4 rounded-md border border-primary/20">
                <p className="text-sm font-medium text-primary">Info:</p>
                <p className="text-xs text-text mt-1">
                  Bukti transfer dapat disusulkan nanti jika Anda belum melakukan pembayaran saat ini. Anda akan menerima nomor pendaftaran di akhir proses ini.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
