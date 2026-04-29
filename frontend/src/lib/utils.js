import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function getProgramBadgeStyle(programName = '') {
  const name = programName.toUpperCase();
  if (name.includes('KAWIKON')) {
    return 'bg-amber-100 text-amber-800 border-amber-200';
  }
  if (name.includes('KAWELAKAAN')) {
    return 'bg-indigo-100 text-indigo-800 border-indigo-200';
  }
  if (name.includes('USADHA')) {
    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  }
  if (name.includes('SERATI')) {
    return 'bg-rose-100 text-rose-800 border-rose-200';
  }
  return 'bg-slate-100 text-slate-800 border-slate-200';
}
