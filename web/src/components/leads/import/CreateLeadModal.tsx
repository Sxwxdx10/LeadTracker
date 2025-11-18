'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  UserPlusIcon,
  DocumentTextIcon,
  TableCellsIcon,
  CameraIcon,
} from '@heroicons/react/24/outline';
import { ManualCreateForm } from './ManualCreateForm';
import { CsvImportForm } from './CsvImportForm';
import { GoogleSheetsImportForm } from './GoogleSheetsImportForm';
import { ScreenshotImportForm } from './ScreenshotImportForm';

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateLeadModal({ isOpen, onClose, onSuccess }: CreateLeadModalProps) {
  const [activeTab, setActiveTab] = useState('manual');

  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Créer des leads</DialogTitle>
          <p className="text-sm text-gray-500 mt-1">
            Choisissez la méthode de création qui vous convient
          </p>
        </DialogHeader>

        <Tabs
          defaultValue="manual"
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="w-full justify-start border-b border-gray-200 mb-4">
            <TabsTrigger
              value="manual"
              icon={<UserPlusIcon className="w-4 h-4" />}
            >
              Manuel
            </TabsTrigger>
            <TabsTrigger
              value="csv"
              icon={<DocumentTextIcon className="w-4 h-4" />}
            >
              CSV
            </TabsTrigger>
            <TabsTrigger
              value="sheets"
              icon={<TableCellsIcon className="w-4 h-4" />}
            >
              Google Sheets
            </TabsTrigger>
            <TabsTrigger
              value="screenshot"
              icon={<CameraIcon className="w-4 h-4" />}
            >
              Screenshot
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto px-6">
            <TabsContent value="manual" className="mt-0">
              <ManualCreateForm onSuccess={handleSuccess} onCancel={onClose} />
            </TabsContent>

            <TabsContent value="csv" className="mt-0">
              <CsvImportForm onSuccess={handleSuccess} onCancel={onClose} />
            </TabsContent>

            <TabsContent value="sheets" className="mt-0">
              <GoogleSheetsImportForm onSuccess={handleSuccess} onCancel={onClose} />
            </TabsContent>

            <TabsContent value="screenshot" className="mt-0">
              <ScreenshotImportForm onSuccess={handleSuccess} onCancel={onClose} />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

