import React from 'react';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';

export default function Step1DataPribadi({ register, errors }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h3 className="text-xl font-bold font-heading text-primary border-b border-muted/30 pb-2 mb-4">Data Pribadi</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="namaLengkap">Nama Lengkap *</Label>
          <Input 
            id="namaLengkap" 
            placeholder="Masukkan nama lengkap sesuai identitas" 
            {...register('namaLengkap')}
          />
          {errors.namaLengkap && <p className="text-sm text-red-500">{errors.namaLengkap.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tempatLahir">Tempat Lahir *</Label>
          <Input 
            id="tempatLahir" 
            placeholder="Contoh: Denpasar" 
            {...register('tempatLahir')}
          />
          {errors.tempatLahir && <p className="text-sm text-red-500">{errors.tempatLahir.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tanggalLahir">Tanggal Lahir *</Label>
          <Input 
            id="tanggalLahir" 
            type="date"
            {...register('tanggalLahir')}
          />
          {errors.tanggalLahir && <p className="text-sm text-red-500">{errors.tanggalLahir.message}</p>}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Jenis Kelamin *</Label>
          <div className="flex space-x-6 mt-2">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="radio" value="LAKI_LAKI" {...register('jenisKelamin')} className="text-primary focus:ring-primary h-4 w-4" />
              <span>Laki-Laki</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="radio" value="PEREMPUAN" {...register('jenisKelamin')} className="text-primary focus:ring-primary h-4 w-4" />
              <span>Perempuan</span>
            </label>
          </div>
          {errors.jenisKelamin && <p className="text-sm text-red-500">{errors.jenisKelamin.message}</p>}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="alamat">Alamat Lengkap *</Label>
          <textarea 
            id="alamat" 
            className="flex min-h-[80px] w-full rounded-md border border-muted bg-surface px-3 py-2 text-sm placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            placeholder="Alamat tempat tinggal saat ini"
            {...register('alamat')}
          ></textarea>
          {errors.alamat && <p className="text-sm text-red-500">{errors.alamat.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="noHp">No. HP / WhatsApp *</Label>
          <Input 
            id="noHp" 
            placeholder="081234567890" 
            {...register('noHp')}
          />
          {errors.noHp && <p className="text-sm text-red-500">{errors.noHp.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email (Opsional)</Label>
          <Input 
            id="email" 
            type="email"
            placeholder="nama@email.com" 
            {...register('email')}
          />
          {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
        </div>
      </div>
    </div>
  );
}
