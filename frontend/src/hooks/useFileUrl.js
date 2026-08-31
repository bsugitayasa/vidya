import { useState, useEffect } from 'react';
import api from '../lib/axios';

/**
 * Hook untuk mengambil file yang terproteksi (JWT) dan mengonversinya
 * menjadi Blob URL yang bisa digunakan di tag <img /> atau <a />.
 * 
 * @param {string} filePath Path file dari database (contoh: /uploads/abc.jpg)
 * @returns {string|null} Blob URL atau null jika sedang loading/error
 */
export default function useFileUrl(filePath, endpoint = '/sisya/files') {
  const [fileState, setFileState] = useState({ filePath: null, url: null });

  useEffect(() => {
    if (!filePath) return;

    let blobUrl = null;
    let cancelled = false;

    const fetchFile = async () => {
      try {
        // Ambil nama file saja dari path
        const filename = filePath.split('/').pop();
        
        const response = await api.get(`${endpoint}/${filename}`, {
          responseType: 'blob'
        });

        blobUrl = URL.createObjectURL(response.data);
        if (cancelled) {
          URL.revokeObjectURL(blobUrl);
          blobUrl = null;
          return;
        }

        setFileState({ filePath, url: blobUrl });
      } catch (error) {
        if (error.response && error.response.status !== 404) {
          console.error('Failed to fetch protected file:', error);
        }
        if (!cancelled) setFileState({ filePath, url: null });
      }
    };

    fetchFile();
    
    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [filePath, endpoint]);

  return fileState.filePath === filePath ? fileState.url : null;
}
