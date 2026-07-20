import React, { useState, useRef, useEffect } from 'react';
import { Upload, Trash2, Loader2, FileVideo, FileImage, File, RefreshCw } from 'lucide-react';
import api from '../../lib/axios';

const KATEGORI_MAP = {
  dokSisya: 'sisya',
  dokNarawak: 'narawak',
  dokPanitia: 'panitia'
};

export default function DokumentasiUpload({
  label,
  icon: Icon,
  fieldName,
  existingPath,
  sesiId,
  onUploadSuccess,
  onDeleteSuccess,
  isSuperAdmin = false,
  uploadEndpoint = null,
  previewEndpointBase = '/sisya/files'
}) {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileType, setFileType] = useState(null); // 'image' | 'video' | 'other'
  const [error, setError] = useState('');

  useEffect(() => {
    if (!existingPath) {
      setPreviewUrl(null);
      setFileType(null);
      return;
    }

    const ext = existingPath.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png'].includes(ext)) {
      setFileType('image');
    } else if (['mp4', 'mov', 'webm', 'avi'].includes(ext)) {
      setFileType('video');
    } else {
      setFileType('other');
    }

    // Fetch protected file as blob for preview
    const fetchPreview = async () => {
      try {
        const filename = existingPath.split('/').pop();
        const response = await api.get(`${previewEndpointBase}/${filename}`, {
          responseType: 'blob'
        });
        const blobUrl = URL.createObjectURL(response.data);
        setPreviewUrl(blobUrl);
      } catch (err) {
        console.error('Failed to load preview:', err);
        setPreviewUrl(null);
      }
    };

    fetchPreview();

    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [existingPath, previewEndpointBase]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (20MB)
    if (file.size > 20 * 1024 * 1024) {
      setError('Ukuran file maksimal 20MB');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append(fieldName, file);

      const endpoint = uploadEndpoint || `/absensi/sesi/${sesiId}/upload-dokumentasi`;
      const res = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        onUploadSuccess?.(res.data.data);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal mengunggah file';
      setError(msg);
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Hapus dokumentasi ${label}?`)) return;

    setIsDeleting(true);
    setError('');

    try {
      const kategori = KATEGORI_MAP[fieldName];
      const res = await api.delete(`/absensi/sesi/${sesiId}/dokumentasi/${kategori}`);
      if (res.data.success) {
        setPreviewUrl(null);
        setFileType(null);
        onDeleteSuccess?.(fieldName);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal menghapus file';
      setError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const hasFile = !!existingPath;

  return (
    <div className={`relative rounded-xl border-2 transition-all duration-200 ${
      hasFile
        ? 'border-green-200 bg-green-50/30'
        : 'border-dashed border-muted/30 bg-surface hover:border-primary/40'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          hasFile ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'
        }`}>
          <Icon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-text truncate">{label}</h4>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
            hasFile
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-500'
          }`}>
            {hasFile ? '✅ Sudah ada' : '⬜ Belum ada'}
          </span>
        </div>
      </div>

      {/* Preview Area */}
      <div className="px-4 pb-3">
        {hasFile && previewUrl ? (
          <div className="relative rounded-lg overflow-hidden bg-black/5 mb-3">
            {fileType === 'image' ? (
              <img
                src={previewUrl}
                alt={label}
                className="w-full h-32 object-cover rounded-lg"
              />
            ) : fileType === 'video' ? (
              <video
                src={previewUrl}
                controls
                className="w-full h-32 object-cover rounded-lg"
                preload="metadata"
              />
            ) : (
              <div className="flex items-center justify-center h-32 bg-gray-100 rounded-lg">
                <File size={32} className="text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">
                  {existingPath?.split('/').pop()}
                </span>
              </div>
            )}
          </div>
        ) : !hasFile ? (
          <div className="flex flex-col items-center justify-center h-28 text-muted/50 mb-3">
            {fileType === 'video' ? (
              <FileVideo size={32} className="mb-1" />
            ) : (
              <FileImage size={32} className="mb-1" />
            )}
            <span className="text-xs">Belum ada dokumentasi</span>
          </div>
        ) : null}

        {/* Error */}
        {error && (
          <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded mb-2">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,.pdf"
            onChange={handleUpload}
            className="hidden"
            id={`upload-${fieldName}`}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              hasFile
                ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                : 'bg-primary text-white hover:bg-primary/90 shadow-sm'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isUploading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : hasFile ? (
              <RefreshCw size={14} />
            ) : (
              <Upload size={14} />
            )}
            {isUploading ? 'Mengunggah...' : hasFile ? 'Ganti' : 'Upload'}
          </button>

          {hasFile && isSuperAdmin && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
              Hapus
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
