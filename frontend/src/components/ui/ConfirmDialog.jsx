import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './button';

/**
 * Reusable confirmation dialog modal.
 * 
 * Props:
 * - open: boolean
 * - title: string
 * - message: string
 * - confirmLabel: string (default: "Ya, Lanjutkan")
 * - cancelLabel: string (default: "Batal")
 * - variant: 'danger' | 'warning' | 'info' (default: 'warning')
 * - isLoading: boolean
 * - onConfirm: () => void
 * - onCancel: () => void
 */
export default function ConfirmDialog({
  open,
  title = 'Konfirmasi',
  message = 'Apakah Anda yakin?',
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  variant = 'warning',
  isLoading = false,
  onConfirm,
  onCancel
}) {
  if (!open) return null;

  const variantStyles = {
    danger: {
      icon: 'bg-red-100 text-red-600',
      button: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      icon: 'bg-amber-100 text-amber-600',
      button: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
    info: {
      icon: 'bg-blue-100 text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
    }
  };

  const style = variantStyles[variant] || variantStyles.warning;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface w-full max-w-sm rounded-xl shadow-2xl overflow-hidden border border-muted/20 animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center">
          <div className={`w-12 h-12 rounded-full ${style.icon} flex items-center justify-center mx-auto mb-4`}>
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-lg font-bold text-text mb-2">{title}</h3>
          <p className="text-sm text-muted leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3 p-4 pt-0 justify-center">
          <Button 
            variant="outline" 
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            {cancelLabel}
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 ${style.button}`}
          >
            {isLoading ? 'Memproses...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
