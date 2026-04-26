import { useState, useEffect } from 'react';
import api from '../lib/axios';

/**
 * Hook untuk mengambil file yang terproteksi (JWT) dan mengonversinya
 * menjadi Blob URL yang bisa digunakan di tag <img /> atau <a />.
 * 
 * @param {string} filePath Path file dari database (contoh: /uploads/abc.jpg)
 * @returns {string|null} Blob URL atau null jika sedang loading/error
 */
export default function useFileUrl(filePath) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!filePath) {
      setUrl(null);
      return;
    }

    const fetchFile = async () => {
      try {
        // Ambil nama file saja dari path
        const filename = filePath.split('/').pop();
        
        const response = await api.get(`/sisya/files/${filename}`, {
          responseType: 'blob'
        });

        const blobUrl = URL.createObjectURL(response.data);
        setUrl(blobUrl);

        // Cleanup function
        return () => URL.revokeObjectURL(blobUrl);
      } catch (error) {
        console.error('Failed to fetch protected file:', error);
        setUrl(null);
      }
    };

    const cleanup = fetchFile();
    
    return () => {
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [filePath]);

  return url;
}
