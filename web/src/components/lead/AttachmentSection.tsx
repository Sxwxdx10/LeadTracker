'use client';

import React, { useState, useRef } from 'react';
import { 
  PaperClipIcon,
  DocumentIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  CloudArrowUpIcon,
  UserIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Attachment } from '@/types/task';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';

interface AttachmentSectionProps {
  attachments: Attachment[];
  leadId: string;
  isLoading?: boolean;
  onUploadAttachment?: (file: File) => void;
  onDeleteAttachment?: (id: string) => void;
}

// Function to format file size
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Function to get file icon based on mime type
const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) {
    return '🖼️';
  } else if (mimeType.includes('pdf')) {
    return '📄';
  } else if (mimeType.includes('word') || mimeType.includes('document')) {
    return '📝';
  } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
    return '📊';
  } else if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) {
    return '📈';
  } else if (mimeType.includes('zip') || mimeType.includes('rar')) {
    return '🗜️';
  } else {
    return '📎';
  }
};

// Function to get file type color
const getFileTypeColor = (mimeType: string) => {
  if (mimeType.startsWith('image/')) {
    return 'bg-green-100 text-green-700';
  } else if (mimeType.includes('pdf')) {
    return 'bg-red-100 text-red-700';
  } else if (mimeType.includes('word') || mimeType.includes('document')) {
    return 'bg-brand-100 text-brand-700';
  } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
    return 'bg-green-100 text-green-700';
  } else if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) {
    return 'bg-orange-100 text-orange-700';
  } else if (mimeType.includes('zip') || mimeType.includes('rar')) {
    return 'bg-purple-100 text-purple-700';
  } else {
    return 'bg-gray-100 text-gray-700';
  }
};

export function AttachmentSection({ 
  attachments, 
  leadId, 
  isLoading, 
  onUploadAttachment, 
  onDeleteAttachment 
}: AttachmentSectionProps) {
  // Ensure attachments is always an array
  const safeAttachments = Array.isArray(attachments) ? attachments : [];
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (files && files.length > 0 && onUploadAttachment) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file) {
          onUploadAttachment(file);
        }
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  const handleDownload = (attachment: Attachment) => {
    // Mock download functionality
    const link = document.createElement('a');
    link.href = attachment.filePath;
    link.download = attachment.originalFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteAttachment = (attachment: Attachment) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le fichier "${attachment.originalFileName}" ?`)) {
      if (onDeleteAttachment) {
        onDeleteAttachment(attachment.id);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Upload area skeleton */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 animate-pulse">
          <div className="text-center">
            <div className="h-12 w-12 bg-gray-200 rounded mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-48 mx-auto mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-32 mx-auto"></div>
          </div>
        </div>
        
        {/* Attachments skeleton */}
        {[...Array(2)].map((_, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gray-200 rounded"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <PaperClipIcon className="h-5 w-5 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900">
          Pièces jointes ({attachments.length})
        </h3>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
          isDragging
            ? 'border-brand-500 bg-brand-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-900">
              Glissez-déposez vos fichiers ici
            </p>
            <p className="text-sm text-gray-500">
              ou cliquez pour sélectionner des fichiers
            </p>
          </div>
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <DocumentIcon className="h-4 w-4" />
              Sélectionner des fichiers
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileInputChange}
            accept="*/*"
          />
        </div>
      </div>

      {/* Attachments List */}
      {attachments.length === 0 ? (
        <div className="text-center py-8">
          <PaperClipIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">
            Aucune pièce jointe
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Ajoutez des documents, images ou autres fichiers liés à ce lead.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {safeAttachments.map((attachment) => (
            <div
              key={attachment.id}
              className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">
                      {getFileIcon(attachment.mimeType)}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {attachment.originalFileName}
                      </p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getFileTypeColor(attachment.mimeType)}`}>
                        {attachment.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
                      </span>
                    </div>
                    
                    <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                      <span>{formatFileSize(attachment.fileSize)}</span>
                      <div className="flex items-center">
                        <UserIcon className="h-3 w-3 mr-1" />
                        {attachment.uploadedByUserName || 'Utilisateur inconnu'}
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        {formatDateTime(attachment.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDownload(attachment)}
                    className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteAttachment(attachment)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
