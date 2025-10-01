'use client';

import React, { useState } from 'react';
import {
  CloudArrowUpIcon,
  TableCellsIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const steps = [
  { id: 1, name: 'Upload', description: 'Sélectionner le fichier' },
  { id: 2, name: 'Mapping', description: 'Mapper les colonnes' },
  { id: 3, name: 'Aperçu', description: 'Vérifier les données' },
  { id: 4, name: 'Import', description: 'Importer les données' },
  { id: 5, name: 'Rapport', description: 'Consulter le rapport' }
];

const csvHeaders = ['nom', 'email', 'telephone', 'entreprise', 'poste', 'source'];
const leadFields = [
  { id: 'firstName', name: 'Prénom', required: true },
  { id: 'lastName', name: 'Nom', required: true },
  { id: 'email', name: 'Email', required: true },
  { id: 'phone', name: 'Téléphone', required: false },
  { id: 'company', name: 'Entreprise', required: false },
  { id: 'position', name: 'Poste', required: false },
  { id: 'source', name: 'Source', required: false }
];

export default function ImportWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<any[]>([]);
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'completed'>('idle');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFile(file);
      setCurrentStep(2);
    }
  };

  const handleMappingChange = (csvHeader: string, leadField: string) => {
    setMapping(prev => ({
      ...prev,
      [csvHeader]: leadField
    }));
  };

  const handlePreview = () => {
    // Simuler l'aperçu des données
    setPreview([
      { nom: 'Jean', email: 'jean@example.com', telephone: '0123456789', entreprise: 'ABC Corp', poste: 'Directeur', source: 'Site web' },
      { nom: 'Marie', email: 'marie@example.com', telephone: '0987654321', entreprise: 'XYZ Ltd', poste: 'Manager', source: 'Email' }
    ]);
    setCurrentStep(3);
  };

  const handleImport = () => {
    setImportStatus('importing');
    // Simuler l'import
    setTimeout(() => {
      setImportStatus('completed');
      setCurrentStep(5);
    }, 2000);
  };

  return (
    <div className="space-y-8">
      {/* Progress */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= step.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {currentStep > step.id ? (
                  <CheckCircleIcon className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-medium">{step.id}</span>
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.name}
                </p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className={`ml-8 w-16 h-0.5 ${
                  currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Upload */}
      {currentStep === 1 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">1. Sélectionner le fichier CSV</h3>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Cliquez pour sélectionner un fichier
                </span>
                <span className="mt-1 block text-sm text-gray-500">
                  ou glissez-déposez votre fichier CSV ici
                </span>
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="sr-only"
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Formats supportés: CSV (max 10MB)
            </p>
          </div>
        </div>
      )}

      {/* Step 2: Mapping */}
      {currentStep === 2 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">2. Mapper les colonnes</h3>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Associez chaque colonne de votre fichier CSV aux champs correspondants.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Colonnes du fichier CSV</h4>
                <div className="space-y-2">
                  {csvHeaders.map((header) => (
                    <div key={header} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <TableCellsIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">{header}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Champs de destination</h4>
                <div className="space-y-2">
                  {leadFields.map((field) => (
                    <div key={field.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">{field.name}</span>
                        {field.required && (
                          <Badge className="ml-2 bg-red-100 text-red-800 text-xs">Requis</Badge>
                        )}
                      </div>
                      <Select
                        value={mapping[field.id] || ''}
                        onChange={(value) => {
                          if (typeof value === 'string') {
                            handleMappingChange(value, field.id);
                          }
                        }}
                        options={[
                          { value: '', label: 'Sélectionner...' },
                          ...csvHeaders.map(header => ({ value: header, label: header }))
                        ]}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handlePreview} className="flex items-center gap-2">
                <EyeIcon className="h-4 w-4" />
                Générer l'aperçu
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {currentStep === 3 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">3. Aperçu des données</h3>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Vérifiez que les données sont correctement mappées avant l'import.
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prénom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Téléphone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entreprise
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {preview.map((row, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.nom}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.telephone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row.entreprise}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleImport} className="flex items-center gap-2">
                <ArrowDownTrayIcon className="h-4 w-4" />
                Importer les données
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Import */}
      {currentStep === 4 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">4. Import en cours</h3>
          <div className="text-center">
            <ArrowPathIcon className="mx-auto h-12 w-12 text-blue-600 animate-spin" />
            <p className="mt-4 text-gray-600">Import des données en cours...</p>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Report */}
      {currentStep === 5 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">5. Import terminé</h3>
          <div className="text-center">
            <CheckCircleIcon className="mx-auto h-12 w-12 text-green-600" />
            <p className="mt-4 text-lg font-medium text-gray-900">Import réussi !</p>
            <p className="mt-2 text-gray-600">2 enregistrements importés avec succès</p>
            <div className="mt-6 flex justify-center gap-4">
              <Button variant="outline">
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Télécharger le rapport
              </Button>
              <Button onClick={() => setCurrentStep(1)}>
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Nouvel import
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
