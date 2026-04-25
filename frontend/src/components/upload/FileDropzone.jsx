import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File, X } from 'lucide-react';

export default function FileDropzone({ label, accept, maxSize, onFileSelected, helperText }) {
  const [selectedFile, setSelectedFile] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      onFileSelected(file);
    }
  }, [onFileSelected]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles: 1
  });

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    onFileSelected(null);
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2 text-text">{label}</label>
      
      {selectedFile ? (
        <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/30 rounded-md">
          <div className="flex items-center space-x-3 overflow-hidden">
            <File className="text-primary flex-shrink-0" size={24} />
            <div className="truncate">
              <p className="text-sm font-medium text-text truncate">{selectedFile.name}</p>
              <p className="text-xs text-muted">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={handleRemoveFile}
            className="p-2 hover:bg-bg rounded-full text-muted hover:text-red-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      ) : (
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/50 hover:bg-bg/50'}
            ${isDragReject ? 'border-red-500 bg-red-50' : ''}
          `}
        >
          <input {...getInputProps()} />
          <UploadCloud className={`mb-2 ${isDragActive ? 'text-primary' : 'text-muted'}`} size={32} />
          {isDragActive ? (
            <p className="text-sm font-medium text-primary">Lepaskan file di sini...</p>
          ) : (
            <p className="text-sm text-text">Drag & drop file di sini, atau klik untuk memilih file</p>
          )}
          {helperText && <p className="text-xs text-muted mt-2">{helperText}</p>}
        </div>
      )}
    </div>
  );
}
