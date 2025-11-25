'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/useToast';
import { leadImportApi } from '@/lib/leadImportApi';
import type { ImportPreview, CsvMapping } from '@/lib/leadImportApi';
import { parseCsvFile, autoDetectColumnMapping } from '@/lib/googleSheetsService';
import { 
  DocumentArrowUpIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface CsvImportFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function CsvImportForm({ onSuccess, onCancel }: CsvImportFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'upload' | 'preview' | 'importing'>('upload');

  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const csvFile = acceptedFiles[0];
    if (!csvFile) return;

    setFile(csvFile);
    setLoading(true);

    try {
      // Parse CSV locally first
      const localData = await parseCsvFile(csvFile);
      const autoMapping = autoDetectColumnMapping(localData.headers);
      setMapping(autoMapping);

      // Normalize field names to match backend expectations (lowercase)
      const normalizedMapping: Record<string, string> = {};
      for (const [csvColumn, leadField] of Object.entries(autoMapping)) {
        normalizedMapping[csvColumn] = leadField.toLowerCase();
      }
      
      // Get preview from backend with mapping
      const csvMapping: CsvMapping = {
        columnMapping: normalizedMapping,
        skipFirstRow: true,
        delimiter: ',',
        skipDuplicates: true,
      };
      const previewData = await leadImportApi.previewCsv(csvFile, csvMapping);
      setPreview(previewData);
      setStep('preview');
    } catch (error: any) {
      console.error('Error previewing CSV:', error);
      toast.error(
        'Erreur',
        error?.response?.data?.title ||
          error?.response?.data?.message ||
          error?.message ||
          'Erreur lors de la prévisualisation du CSV'
      );
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
    disabled: loading || step !== 'upload',
  });

  // Handle import
  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    setStep('importing');

    try {
      // Normalize field names to match backend expectations (lowercase)
      const normalizedMapping: Record<string, string> = {};
      for (const [csvColumn, leadField] of Object.entries(mapping)) {
        normalizedMapping[csvColumn] = leadField.toLowerCase();
      }
      
      const csvMapping: CsvMapping = {
        columnMapping: normalizedMapping,
        skipFirstRow: true,
        delimiter: ',',
        skipDuplicates: true,
      };

      const result = await leadImportApi.importCsv(file, csvMapping);

      toast.success(
        'Import réussi',
        `${result.successCount} leads créés avec succès${
          result.duplicateCount > 0 ? ` (${result.duplicateCount} doublons ignorés)` : ''
        }`
      );

      onSuccess();
      router.refresh();
    } catch (error: any) {
      console.error('Error importing CSV:', error);
      toast.error(
        'Erreur',
        error?.response?.data?.title ||
          error?.response?.data?.message ||
          error?.message ||
          "Erreur lors de l'import"
      );
      setStep('preview');
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setMapping({});
    setStep('upload');
  };

  // Update column mapping
  const handleMappingChange = (csvColumn: string, leadField: string) => {
    setMapping((prev) => ({
      ...prev,
      [csvColumn]: leadField,
    }));
  };

  if (step === 'upload') {
    return (
      <div className="space-y-6">
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
            transition-colors duration-200
            ${isDragActive ? 'border-brand-500 bg-brand-50' : 'border-gray-300 hover:border-gray-400'}
            ${loading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          <DocumentArrowUpIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          {isDragActive ? (
            <p className="text-lg font-medium text-brand-600">
              Déposez le fichier CSV ici...
            </p>
          ) : (
            <>
              <p className="text-lg font-medium text-gray-900 mb-2">
                Glissez-déposez un fichier CSV ici
              </p>
              <p className="text-sm text-gray-500 mb-4">
                ou cliquez pour sélectionner un fichier
              </p>
              <Button type="button" variant="outline" size="sm">
                Sélectionner un fichier
              </Button>
            </>
          )}
        </div>

        <div className="bg-brand-50 border border-brand-200 rounded-lg p-4">
          <h4 className="font-medium text-brand-900 mb-2">
            💡 Format attendu
          </h4>
          <ul className="text-sm text-brand-800 space-y-1">
            <li>• Fichier au format CSV avec séparateur virgule</li>
            <li>• Première ligne = en-têtes de colonnes</li>
            <li>• Colonnes recommandées : Email, Prénom, Nom, Société, Téléphone</li>
            <li>• Les doublons (email existant) seront automatiquement ignorés</li>
          </ul>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'preview' && preview) {
    return (
      <div className="space-y-6">
        {/* Preview Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">
              {preview.totalRows}
            </div>
            <div className="text-sm text-gray-600">Lignes totales</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="text-2xl font-bold text-green-600">
              {preview.validRows}
            </div>
            <div className="text-sm text-green-700">Lignes valides</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="text-2xl font-bold text-red-600">
              {preview.totalRows - preview.validRows}
            </div>
            <div className="text-sm text-red-700">Lignes avec erreurs</div>
          </div>
        </div>

        {/* Errors & Warnings */}
        {(preview.errors.length > 0 || preview.warnings.length > 0) && (
          <div className="space-y-2">
            {preview.errors.map((error, idx) => (
              <div
                key={`error-${idx}`}
                className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3"
              >
                <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            ))}
            {preview.warnings.map((warning, idx) => (
              <div
                key={`warning-${idx}`}
                className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3"
              >
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-800">{warning}</p>
              </div>
            ))}
          </div>
        )}

        {/* Preview Table */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <h4 className="font-medium text-gray-900">
              Aperçu (premières {preview.previewRows.length} lignes)
            </h4>
          </div>
          <div className="overflow-x-auto max-h-64">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    #
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Prénom
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Nom
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Société
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {preview.previewRows.map((row) => (
                  <tr
                    key={row.rowNumber}
                    className={row.isValid ? 'bg-white' : 'bg-red-50'}
                  >
                    <td className="px-4 py-2 text-gray-900">{row.rowNumber}</td>
                    <td className="px-4 py-2 text-gray-900">{row.firstName}</td>
                    <td className="px-4 py-2 text-gray-900">{row.lastName}</td>
                    <td className="px-4 py-2 text-gray-900">{row.email}</td>
                    <td className="px-4 py-2 text-gray-900">{row.company}</td>
                    <td className="px-4 py-2">
                      {row.isValid ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                      ) : (
                        <span className="text-xs text-red-600">
                          {row.validationErrors[0]}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={handleReset}>
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Changer de fichier
          </Button>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleImport}
              disabled={preview.validRows === 0}
            >
              Importer {preview.validRows} lead{preview.validRows > 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'importing') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-600 mb-4" />
        <p className="text-lg font-medium text-gray-900">Import en cours...</p>
        <p className="text-sm text-gray-500">Veuillez patienter</p>
      </div>
    );
  }

  return null;
}

