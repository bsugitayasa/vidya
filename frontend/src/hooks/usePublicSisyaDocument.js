import { useEffect, useState } from 'react';
import api from '../lib/axios';

export default function usePublicSisyaDocument(nomorPendaftaran, jenis, hasFile) {
  const requestKey = hasFile && nomorPendaftaran ? `${nomorPendaftaran}:${jenis}` : null;
  const [preview, setPreview] = useState({
    key: null,
    url: null,
    mimeType: '',
    loading: false,
    error: false
  });

  useEffect(() => {
    if (!requestKey) return undefined;

    let objectUrl;
    let isActive = true;
    setPreview({ key: requestKey, url: null, mimeType: '', loading: true, error: false });

    api.get('/sisya/cari/file', {
      params: { nomor: nomorPendaftaran, jenis },
      responseType: 'blob'
    }).then((response) => {
      if (!isActive) return;

      objectUrl = URL.createObjectURL(response.data);
      setPreview({
        key: requestKey,
        url: objectUrl,
        mimeType: response.data.type || response.headers['content-type'] || '',
        loading: false,
        error: false
      });
    }).catch(() => {
      if (isActive) {
        setPreview({ key: requestKey, url: null, mimeType: '', loading: false, error: true });
      }
    });

    return () => {
      isActive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [requestKey, nomorPendaftaran, jenis]);

  if (!requestKey) {
    return { url: null, mimeType: '', loading: false, error: false };
  }

  return preview.key === requestKey
    ? preview
    : { url: null, mimeType: '', loading: true, error: false };
}
