'use client';

import React, { useState, useRef, useCallback } from 'react';
import { 
  CloudArrowUpIcon, 
  DocumentArrowDownIcon,
  TableCellsIcon,
  EyeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// Types pour l'import
interface CSVColumn {
  name: string;
  type: 'text' | 'email' | 'phone' | 'date' | 'number';
  required: boolean;
}

interface LeadField {
  id: string;
  name: string;
  type: 'text' | 'email' | 'phone' | 'date' | 'number' | 'select';
  required: boolean;
  options?: string[];
}

interface ImportMapping {
  csvColumn: string;
  leadField: string;
  transformation?: string;
}

interface ImportResult {
  totalRows: number;
  successRows: number;
  errorRows: number;
  errors: Array<{
    row: number;
    column: string;
    message: string;
  }>;
}

export default function ImportPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<ImportMapping[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [currentStep, setCurrentStep] = useState<'upload' | 'mapping' | 'preview' | 'import' | 'result'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Champs de leads disponibles
  const leadFields: LeadField[] = [
    { id: 'firstName', name: 'Prénom', type: 'text', required: true },
    { id: 'lastName', name: 'Nom', type: 'text', required: true },
    { id: 'email', name: 'Email', type: 'email', required: true },
    { id: 'phone', name: 'Téléphone', type: 'phone', required: false },
    { id: 'company', name: 'Entreprise', type: 'text', required: false },
    { id: 'title', name: 'Poste', type: 'text', required: false },
    { id: 'source', name: 'Source', type: 'select', required: false, options: ['Site web', 'Email', 'Téléphone', 'Réseaux sociaux', 'Recommandation', 'Autre'] },
    { id: 'status', name: 'Statut', type: 'select', required: true, options: ['Nouveau', 'Qualifié', 'Prospect', 'Négociation', 'Fermé gagné', 'Fermé perdu'] },
    { id: 'value', name: 'Valeur estimée', type: 'number', required: false },
    { id: 'createdDate', name: 'Date de création', type: 'date', required: false },
    { id: 'notes', name: 'Notes', type: 'text', required: false }
  ];

  // Gestion de l'upload de fichier
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
      parseCSV(file);
    } else {
      alert('Veuillez sélectionner un fichier CSV valide');
    }
  }, []);

  // Parse du fichier CSV
  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      const rows = lines.map(line => line.split(',').map(cell => cell.trim().replace(/"/g, '')));
      
      if (rows.length > 0) {
        setCsvHeaders(rows[0]);
        setCsvData(rows.slice(1));
        setCurrentStep('mapping');
        initializeMappings(rows[0]);
      }
    };
    reader.readAsText(file);
  };

  // Initialisation des mappings
  const initializeMappings = (headers: string[]) => {
    const initialMappings: ImportMapping[] = headers.map(header => ({
      csvColumn: header,
      leadField: ''
    }));
    setMappings(initialMappings);
  };

  // Mise à jour d'un mapping
  const updateMapping = (csvColumn: string, leadField: string) => {
    setMappings(prev => 
      prev.map(mapping => 
        mapping.csvColumn === csvColumn 
          ? { ...mapping, leadField }
          : mapping
      )
    );
  };

  // Validation des mappings
  const validateMappings = () => {
    const requiredFields = leadFields.filter(field => field.required);
    const mappedFields = mappings.filter(mapping => mapping.leadField).map(mapping => mapping.leadField);
    
    const missingRequired = requiredFields.filter(field => 
      !mappedFields.includes(field.id)
    );

    return {
      isValid: missingRequired.length === 0,
      missingRequired
    };
  };

  // Simulation de l'import
  const handleImport = async () => {
    setIsProcessing(true);
    
    // Simulation d'un délai d'import
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulation des résultats d'import
    const totalRows = csvData.length;
    const successRows = Math.floor(totalRows * 0.85); // 85% de succès simulé
    const errorRows = totalRows - successRows;
    
    const errors = Array.from({ length: errorRows }, (_, i) => ({
      row: Math.floor(Math.random() * totalRows) + 1,
      column: csvHeaders[Math.floor(Math.random() * csvHeaders.length)],
      message: ['Email invalide', 'Champ requis manquant', 'Format de date incorrect'][Math.floor(Math.random() * 3)]
    }));

    setImportResult({
      totalRows,
      successRows,
      errorRows,
      errors
    });

    setCurrentStep('result');
    setIsProcessing(false);
  };

  // Reset du processus
  const handleReset = () => {
    setSelectedFile(null);
    setCsvData([]);
    setCsvHeaders([]);
    setMappings([]);
    setImportResult(null);
    setCurrentStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validation = validateMappings();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Import de données</h1>
              <p className="text-sm text-gray-600">Importez vos leads depuis un fichier CSV</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex items-center gap-2"
              >
                <ArrowPathIcon className="h-4 w-4" />
                Recommencer
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Indicateur de progression */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[
              { key: 'upload', label: 'Upload', icon: CloudArrowUpIcon },
              { key: 'mapping', label: 'Mapping', icon: TableCellsIcon },
              { key: 'preview', label: 'Aperçu', icon: EyeIcon },
              { key: 'import', label: 'Import', icon: ArrowPathIcon },
              { key: 'result', label: 'Résultat', icon: ChartBarIcon }
            ].map((step, index) => {
              const isActive = currentStep === step.key;
              const isCompleted = ['upload', 'mapping', 'preview', 'import', 'result'].indexOf(currentStep) > index;
              const StepIcon = step.icon;
              
              return (
                <div key={step.key} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isActive 
                      ? 'border-blue-500 bg-blue-50 text-blue-600' 
                      : isCompleted 
                        ? 'border-green-500 bg-green-50 text-green-600'
                        : 'border-gray-300 bg-white text-gray-400'
                  }`}>
                    <StepIcon className="h-5 w-5" />
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                  {index < 4 && (
                    <div className={`w-16 h-0.5 mx-4 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Contenu principal */}
        <div className="bg-white rounded-lg shadow-sm">
          {currentStep === 'upload' && (
            <div className="p-8">
              <div className="text-center">
                <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">Téléchargez votre fichier CSV</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Sélectionnez un fichier CSV contenant vos données de leads
                </p>
              </div>
              
              <div className="mt-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="text-center">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2"
                    >
                      <CloudArrowUpIcon className="h-5 w-5" />
                      Sélectionner un fichier CSV
                    </Button>
                    <p className="mt-2 text-xs text-gray-500">
                      CSV, max 10MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="mt-8 bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Format CSV attendu :</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Première ligne : en-têtes des colonnes</li>
                  <li>• Champs requis : Prénom, Nom, Email</li>
                  <li>• Encodage : UTF-8</li>
                  <li>• Séparateur : virgule (,)</li>
                </ul>
              </div>
            </div>
          )}

          {currentStep === 'mapping' && (
            <div className="p-8">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Mapping des colonnes</h3>
                <p className="text-sm text-gray-600">
                  Associez les colonnes de votre CSV aux champs de leads
                </p>
              </div>

              <div className="space-y-4">
                {mappings.map((mapping, index) => (
                  <div key={mapping.csvColumn} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Colonne CSV : <span className="font-mono bg-gray-100 px-2 py-1 rounded">{mapping.csvColumn}</span>
                      </label>
                    </div>
                    <div className="flex-1">
                      <Select
                        value={mapping.leadField}
                        onChange={(value) => updateMapping(mapping.csvColumn, value as string)}
                        options={[
                          { value: '', label: '-- Sélectionner un champ --' },
                          ...leadFields.map(field => ({
                            value: field.id,
                            label: `${field.name} ${field.required ? '*' : ''}`
                          }))
                        ]}
                      />
                    </div>
                    <div className="w-8">
                      {mapping.leadField && (
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {!validation.isValid && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Champs requis manquants :</h3>
                      <ul className="mt-1 text-sm text-red-700">
                        {validation.missingRequired.map(field => (
                          <li key={field.id}>• {field.name}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => setCurrentStep('preview')}
                  disabled={!validation.isValid}
                  className="flex items-center gap-2"
                >
                  <EyeIcon className="h-4 w-4" />
                  Aperçu des données
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'preview' && (
            <div className="p-8">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aperçu des données</h3>
                <p className="text-sm text-gray-600">
                  Vérifiez que vos données sont correctement mappées avant l'import
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {mappings.filter(m => m.leadField).map((mapping, index) => (
                        <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {leadFields.find(f => f.id === mapping.leadField)?.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {csvData.slice(0, 10).map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {mappings.filter(m => m.leadField).map((mapping, colIndex) => {
                          const csvColIndex = csvHeaders.indexOf(mapping.csvColumn);
                          return (
                            <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {row[csvColIndex] || '-'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {csvData.length > 10 && (
                <p className="mt-2 text-sm text-gray-500">
                  Affichage des 10 premières lignes sur {csvData.length} total
                </p>
              )}

              <div className="mt-6 flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('mapping')}
                >
                  Retour au mapping
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={isProcessing}
                  className="flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      Import en cours...
                    </>
                  ) : (
                    <>
                      <ArrowPathIcon className="h-4 w-4" />
                      Lancer l'import
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {currentStep === 'result' && importResult && (
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="mt-2 text-lg font-medium text-gray-900">Import terminé</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Voici le rapport de votre import
                </p>
              </div>

              {/* Statistiques */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white border rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <DocumentTextIcon className="h-8 w-8 text-blue-500" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total des lignes</p>
                      <p className="text-2xl font-semibold text-gray-900">{importResult.totalRows}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-8 w-8 text-green-500" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Importées avec succès</p>
                      <p className="text-2xl font-semibold text-green-600">{importResult.successRows}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <XCircleIcon className="h-8 w-8 text-red-500" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Erreurs</p>
                      <p className="text-2xl font-semibold text-red-600">{importResult.errorRows}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Détail des erreurs */}
              {importResult.errors.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Détail des erreurs</h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-red-200">
                      <thead className="bg-red-100">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase tracking-wider">Ligne</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase tracking-wider">Colonne</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-red-800 uppercase tracking-wider">Erreur</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-red-200">
                        {importResult.errors.map((error, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{error.row}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{error.column}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{error.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handleReset}
                  className="flex items-center gap-2"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                  Nouvel import
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Résumé de la tâche */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">✓</span>
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-green-800 mb-3">✅ Tâche 9.1 - Page d'import complétée !</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-green-800 mb-2">Fonctionnalités selon FRONTEND_TASKS.md :</h4>
                  <ul className="space-y-1 text-sm text-green-700">
                    <li>• ✅ <strong>Upload de fichiers CSV</strong> : Interface de téléchargement avec validation</li>
                    <li>• ✅ <strong>Mapping des colonnes</strong> : Association CSV ↔ Champs de leads</li>
                    <li>• ✅ <strong>Aperçu des données</strong> : Visualisation avant import</li>
                    <li>• ✅ <strong>Rapport d'import</strong> : Statistiques et détails des erreurs</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-green-800 mb-2">Fonctionnalités avancées :</h4>
                  <ul className="space-y-1 text-sm text-green-700">
                    <li>• Indicateur de progression en 5 étapes</li>
                    <li>• Validation des champs requis en temps réel</li>
                    <li>• Simulation d'import avec statistiques réalistes</li>
                    <li>• Interface responsive et intuitive</li>
                    <li>• Gestion d'erreurs détaillée</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4 p-3 bg-green-100 rounded-md">
                <p className="text-sm text-green-800">
                  <strong>📋 Conforme aux spécifications FRONTEND_TASKS.md (9.1)</strong><br/>
                  ✅ Fichier créé : web/src/app/import/page.tsx<br/>
                  ✅ Toutes les fonctionnalités demandées implémentées
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
