'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/useToast';
import { leadImportApi } from '@/lib/leadImportApi';
import type { ImportPreview, SheetMapping } from '@/lib/leadImportApi';
import {
  isValidGoogleSheetsUrl,
  fetchGoogleSheetData,
  autoDetectColumnMapping,
} from '@/lib/googleSheetsService';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';

interface GoogleSheetsImportFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function GoogleSheetsImportForm({ onSuccess, onCancel }: GoogleSheetsImportFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [sheetUrl, setSheetUrl] = useState('');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'input' | 'preview' | 'importing'>('input');
  const [urlError, setUrlError] = useState('');

  // Handle URL validation
  const validateUrl = (url: string): boolean => {
    if (!url.trim()) {
      setUrlError('URL requise');
      return false;
    }
    if (!isValidGoogleSheetsUrl(url)) {
      setUrlError('URL Google Sheets invalide');
      return false;
    }
    setUrlError('');
    return true;
  };

  // Handle preview
  const handlePreview = async () => {
    if (!validateUrl(sheetUrl)) return;

    setLoading(true);
    try {
      // Fetch data locally first
      const localData = await fetchGoogleSheetData(sheetUrl);
      const autoMapping = autoDetectColumnMapping(localData.headers);
      setMapping(autoMapping);

      // Get preview from backend
      const sheetMapping: SheetMapping = {
        sheetUrl,
        columnMapping: autoMapping,
        skipFirstRow: true,
        skipDuplicates: true,
      };

      const previewData = await leadImportApi.previewGoogleSheets(sheetUrl, sheetMapping);
      setPreview(previewData);
      setStep('preview');
    } catch (error: any) {
      console.error('Error previewing Google Sheets:', error);
      toast.error(
        'Erreur',
        error?.response?.data?.title ||
          error?.response?.data?.message ||
          error?.message ||
          'Erreur lors de la prévisualisation de la feuille'
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle import
  const handleImport = async () => {
    if (!preview) return;

    setLoading(true);
    setStep('importing');

    try {
      const sheetMapping: SheetMapping = {
        sheetUrl,
        columnMapping: mapping,
        skipFirstRow: true,
        skipDuplicates: true,
      };

      const result = await leadImportApi.importGoogleSheets(sheetUrl, sheetMapping);

      toast.success(
        'Import réussi',
        `${result.successCount} leads créés avec succès${
          result.duplicateCount > 0 ? ` (${result.duplicateCount} doublons ignorés)` : ''
        }`
      );

      onSuccess();
      router.refresh();
    } catch (error: any) {
      console.error('Error importing Google Sheets:', error);
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
    setSheetUrl('');
    setPreview(null);
    setMapping({});
    setStep('input');
    setUrlError('');
  };

  if (step === 'input') {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="sheetUrl">
              URL de la feuille Google Sheets <span className="text-red-500">*</span>
            </Label>
            <Input
              id="sheetUrl"
              type="url"
              value={sheetUrl}
              onChange={(e) => {
                setSheetUrl(e.target.value);
                if (urlError) setUrlError('');
              }}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className={urlError ? 'border-red-500' : ''}
            />
            {urlError && (
              <p className="text-red-500 text-sm mt-1">{urlError}</p>
            )}
            <p className="text-sm text-gray-500 mt-2">
              La feuille doit être publique ou accessible via le lien
            </p>
          </div>
        </div>

        <div className="bg-brand-50 border border-brand-200 rounded-lg p-4">
          <h4 className="font-medium text-brand-900 mb-2 flex items-center gap-2">
            <TableCellsIcon className="w-5 h-5" />
            Comment obtenir l'URL ?
          </h4>
          <ol className="text-sm text-brand-800 space-y-2 list-decimal list-inside">
            <li>Ouvrez votre feuille Google Sheets</li>
            <li>Cliquez sur "Partager" en haut à droite</li>
            <li>Choisissez "Toute personne disposant du lien"</li>
            <li>Copiez le lien et collez-le ci-dessus</li>
          </ol>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">
            📋 Format attendu
          </h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Première ligne = en-têtes de colonnes</li>
            <li>• Colonnes recommandées : Email, Prénom, Nom, Société, Téléphone</li>
            <li>• Les cellules vides sont ignorées</li>
            <li>• Les doublons (email existant) seront automatiquement ignorés</li>
          </ul>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handlePreview}
            loading={loading}
            disabled={!sheetUrl.trim()}
          >
            Prévisualiser
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
            Changer de feuille
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

