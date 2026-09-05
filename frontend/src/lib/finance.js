export const formatRupiah = (value) => new Intl.NumberFormat('id-ID', {
  style: 'currency', currency: 'IDR', maximumFractionDigits: 0
}).format(Number(value || 0));

export const formatDate = (value) => value ? new Intl.DateTimeFormat('id-ID', {
  day: '2-digit', month: 'short', year: 'numeric'
}).format(new Date(value)) : '-';

export const RAB_STATUS = {
  DRAFT: { label: 'Draft', className: 'bg-slate-100 text-slate-700' },
  DIAJUKAN: { label: 'Menunggu Persetujuan', className: 'bg-amber-100 text-amber-700' },
  DISETUJUI: { label: 'Disetujui', className: 'bg-blue-100 text-blue-700' },
  DITOLAK: { label: 'Ditolak', className: 'bg-red-100 text-red-700' },
  DICAIRKAN_SEBAGIAN: { label: 'Dicairkan Sebagian', className: 'bg-cyan-100 text-cyan-700' },
  DICAIRKAN_PENUH: { label: 'Dicairkan Penuh', className: 'bg-teal-100 text-teal-700' },
  REALISASI: { label: 'Realisasi', className: 'bg-violet-100 text-violet-700' },
  MENUNGGU_VERIFIKASI_LPJ: { label: 'Verifikasi LPJ', className: 'bg-orange-100 text-orange-700' },
  PERLU_REVISI: { label: 'Perlu Revisi', className: 'bg-rose-100 text-rose-700' },
  DALAM_PENYESUAIAN: { label: 'Dalam Penyesuaian', className: 'bg-amber-100 text-amber-800' },
  SELESAI: { label: 'Selesai', className: 'bg-emerald-100 text-emerald-700' },
  DIBATALKAN: { label: 'Dibatalkan', className: 'bg-slate-200 text-slate-500' }
};

export function StatusRabBadge({ status }) {
  const config = RAB_STATUS[status] || { label: status, className: 'bg-slate-100 text-slate-700' };
  return React.createElement('span', { className: `inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${config.className}` }, config.label);
}
import React from 'react';
