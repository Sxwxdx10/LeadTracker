import * as React from 'react';
import { Upload, X, File, Image, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FileUploadProps {
  onFilesChange?: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  multiple?: boolean;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  placeholder?: string;
}

interface UploadedFile {
  file: File;
  id: string;
  preview?: string | undefined;
}

const FileUpload = React.forwardRef<HTMLInputElement, FileUploadProps>(
  ({ 
    onFilesChange,
    maxFiles = 5,
    maxSize = 10,
    acceptedTypes = ['image/*', '.pdf', '.doc', '.docx'],
    multiple = true,
    disabled = false,
    error = false,
    className,
    placeholder = "Glissez-déposez vos fichiers ici ou cliquez pour sélectionner"
  }, ref) => {
    const [files, setFiles] = React.useState<UploadedFile[]>([]);
    const [dragActive, setDragActive] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const getFileIcon = (file: File) => {
      if (file.type.startsWith('image/')) {
        return <Image className="h-4 w-4" />;
      }
      if (file.type.includes('pdf') || file.name.endsWith('.pdf')) {
        return <FileText className="h-4 w-4" />;
      }
      return <File className="h-4 w-4" />;
    };

    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const validateFile = (file: File): string | null => {
      if (file.size > maxSize * 1024 * 1024) {
        return `Le fichier ${file.name} dépasse la taille maximale de ${maxSize}MB`;
      }
      
      const isValidType = acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -1));
        }
        return file.name.toLowerCase().endsWith(type.toLowerCase()) || 
               file.type === type;
      });
      
      if (!isValidType) {
        return `Le type de fichier ${file.name} n'est pas autorisé`;
      }
      
      return null;
    };

    const handleFiles = (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles);
      const validFiles: UploadedFile[] = [];
      const errors: string[] = [];

      fileArray.forEach(file => {
        const error = validateFile(file);
        if (error) {
          errors.push(error);
        } else {
          const uploadedFile: UploadedFile = {
            file,
            id: Math.random().toString(36).substr(2, 9),
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
          };
          validFiles.push(uploadedFile);
        }
      });

      if (errors.length > 0) {
        console.warn('Erreurs de validation:', errors);
        // Vous pourriez vouloir afficher ces erreurs à l'utilisateur
      }

      const updatedFiles = multiple 
        ? [...files, ...validFiles].slice(0, maxFiles)
        : validFiles.slice(0, 1);

      setFiles(updatedFiles);
      onFilesChange?.(updatedFiles.map(f => f.file));
    };

    const removeFile = (fileId: string) => {
      const updatedFiles = files.filter(f => f.id !== fileId);
      setFiles(updatedFiles);
      onFilesChange?.(updatedFiles.map(f => f.file));
    };

    const handleDrag = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === 'dragenter' || e.type === 'dragover') {
        setDragActive(true);
      } else if (e.type === 'dragleave') {
        setDragActive(false);
      }
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      
      if (disabled) return;
      
      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles && droppedFiles.length > 0) {
        handleFiles(droppedFiles);
      }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
      }
    };

    const openFileDialog = () => {
      if (!disabled) {
        fileInputRef.current?.click();
      }
    };

    return (
      <div className={cn('w-full', className)}>
        <div
          className={cn(
            'relative border-2 border-dashed rounded-lg p-6 transition-colors',
            dragActive && !disabled && 'border-brand-500 bg-brand-50',
            error && 'border-red-500',
            disabled && 'opacity-50 cursor-not-allowed',
            !dragActive && !error && 'border-gray-300 hover:border-gray-400'
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple={multiple}
            accept={acceptedTypes.join(',')}
            onChange={handleFileInput}
            className="hidden"
            disabled={disabled}
          />
          
          <div className="text-center">
            <Upload className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              {placeholder}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Types acceptés: {acceptedTypes.join(', ')}
            </p>
            <p className="text-xs text-gray-500">
              Taille max: {maxSize}MB • Max {maxFiles} fichier{maxFiles > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium text-gray-900">
              Fichiers sélectionnés ({files.length})
            </h4>
            {files.map((uploadedFile) => (
              <div
                key={uploadedFile.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {uploadedFile.preview ? (
                    <img
                      src={uploadedFile.preview}
                      alt={uploadedFile.file.name}
                      className="h-8 w-8 object-cover rounded"
                    />
                  ) : (
                    <div className="h-8 w-8 bg-gray-200 rounded flex items-center justify-center">
                      {getFileIcon(uploadedFile.file)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {uploadedFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(uploadedFile.file.size)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(uploadedFile.id);
                  }}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);
FileUpload.displayName = 'FileUpload';

export { FileUpload };
