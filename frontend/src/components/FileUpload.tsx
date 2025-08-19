import React, { useState, useRef } from 'react';
import './FileUpload.css';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  acceptedTypes?: string[];
  maxSize?: number; // in MB
  multiple?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  acceptedTypes = ['image/*', 'audio/*', 'video/*', '.pdf', '.doc', '.docx', '.txt'],
  maxSize = 10,
  multiple = false
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  };

  const handleDragOut = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    if (!multiple && files.length > 1) {
      setError('Only one file can be selected');
      return;
    }

    files.forEach(file => {
      if (!validateFile(file)) {
        return;
      }
      onFileSelect(file);
    });
  };

  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      return false;
    }

    // Check file type
    const isValidType = acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }
      if (type.endsWith('/*')) {
        const category = type.slice(0, -2);
        return file.type.startsWith(category);
      }
      return file.type === type;
    });

    if (!isValidType) {
      setError('File type not supported');
      return false;
    }

    return true;
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const formatAcceptedTypes = () => {
    return acceptedTypes
      .map(type => {
        if (type.startsWith('.')) return type.toUpperCase();
        if (type.endsWith('/*')) return type.slice(0, -2) + ' files';
        return type;
      })
      .join(', ');
  };

  return (
    <div className="file-upload">
      <div
        className={`upload-area ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <div className="upload-content">
          <div className="upload-icon">📁</div>
          <h3>Drop files here or click to browse</h3>
          <p>Supported formats: {formatAcceptedTypes()}</p>
          <p>Max size: {maxSize}MB</p>
        </div>
      </div>

      {error && (
        <div className="upload-error">
          {error}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileInput}
        accept={acceptedTypes.join(',')}
        multiple={multiple}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default FileUpload;
