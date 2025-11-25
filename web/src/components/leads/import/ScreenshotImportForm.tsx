'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/useToast';
import { useStages } from '@/hooks/useLeads';
import { extractLeadFromImage, validateExtractedLead, normalizePhoneNumber } from '@/lib/ocrService';
import type { ExtractedLead } from '@/lib/leadImportApi';
import { leadsApi } from '@/lib/api';
import type { CreateLeadDto } from '@/types/lead';
import {
  CameraIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';

interface ScreenshotImportFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function ScreenshotImportForm({ onSuccess, onCancel }: ScreenshotImportFormProps) {
  const router = useRouter();
  const showToast = useToast();
  const { data: stages } = useStages();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [extractedData, setExtractedData] = useState<ExtractedLead | null>(null);
  const [loading, setLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [step, setStep] = useState<'upload' | 'review' | 'creating'>('upload');
  const [editedData, setEditedData] = useState<Partial<ExtractedLead>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset form
  const handleReset = useCallback(() => {
    setFile(null);
    setPreview('');
    setExtractedData(null);
    setEditedData({});
    setStep('upload');
    setOcrProgress(0);
  }, []);

  // Determine a sensible default stage for new leads
  const defaultStageId = useMemo(() => {
    if (!stages || stages.length === 0) return undefined;
    // Try to find a stage named "Nouveau" (FR) or "New"
    const preferred = stages.find(
      (s) =>
        s.name.toLowerCase().includes('nouveau') ||
        s.name.toLowerCase().includes('new')
    );
    return (preferred || stages[0])?.id;
  }, [stages]);

  // Process image file (shared logic for drop and paste)
  const processImageFile = useCallback(async (imageFile: File) => {
    if (!imageFile) return;

    setFile(imageFile);
    setPreview(URL.createObjectURL(imageFile));
    setLoading(true);
    setOcrProgress(0);

    try {
      // Extract text using OCR
      const extracted = await extractLeadFromImage(imageFile, (progress) => {
        setOcrProgress(Math.round(progress * 100));
      });

      setExtractedData(extracted);
      setEditedData(extracted);
      setStep('review');
    } catch (error: any) {
      console.error('Error extracting text:', error);
      showToast.error('Erreur', error?.message || "Erreur lors de l'extraction du texte");
      handleReset();
    } finally {
      setLoading(false);
      setOcrProgress(0);
    }
  }, [showToast, handleReset]);

  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const imageFile = acceptedFiles[0];
    if (!imageFile) return;
    await processImageFile(imageFile);
  }, [processImageFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    maxFiles: 1,
    disabled: loading || step !== 'upload',
  });

  // Handle paste from clipboard (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      // Only handle paste when in upload step and not loading
      if (step !== 'upload' || loading) return;

      // Don't interfere if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      // Look for image in clipboard
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item) continue;
        
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          
          const blob = item.getAsFile();
          if (!blob) return;

          // Convert blob to File
          const file = new File([blob], `pasted-image-${Date.now()}.png`, {
            type: blob.type || 'image/png',
          });

          await processImageFile(file);
          showToast.success('Image collée', "L'image a été collée depuis le presse-papiers");
          break;
        }
      }
    };

    // Add paste event listener
    window.addEventListener('paste', handlePaste);

    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [step, loading, processImageFile, showToast]);

  // Handle field edit
  const handleFieldChange = (field: keyof ExtractedLead, value: string) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle create
  const handleCreate = async () => {
    if (!editedData) return;

    if (!defaultStageId) {
      showToast.error(
        'Configuration requise',
        "Aucune étape de pipeline n'est disponible pour créer un lead. Veuillez vérifier la configuration des étapes."
      );
      return;
    }

    // Normalize phone number if provided
    const normalizedData = { ...editedData };
    if (normalizedData.phoneNumber) {
      const normalized = normalizePhoneNumber(normalizedData.phoneNumber);
      // Always use normalized value if available, otherwise keep original
      // (validation will handle format checking)
      if (normalized) {
        normalizedData.phoneNumber = normalized;
      }
    }

    // Validate
    const validation = validateExtractedLead(normalizedData as ExtractedLead);
    if (!validation.isValid) {
      const errorMessage = validation.errors.length > 0 
        ? validation.errors.join('. ') 
        : 'Erreur de validation inconnue';
      console.error('Validation errors:', validation.errors, 'Data:', normalizedData);
      showToast.error('Validation échouée', errorMessage);
      return;
    }

    setLoading(true);
    setStep('creating');

    try {
      // Generate title from available data
      const title = normalizedData.firstName && normalizedData.lastName
        ? `${normalizedData.firstName} ${normalizedData.lastName}`
        : normalizedData.company || normalizedData.firstName || normalizedData.lastName || 'Lead sans nom';

      // Build lead data object, only including fields that have values
      const leadData: CreateLeadDto = {
        title,
        source: 'Screenshot OCR',
        stageId: defaultStageId,
      };

      // Add optional fields only if they have values
      if (normalizedData.firstName) {
        leadData.firstName = normalizedData.firstName;
      }
      if (normalizedData.lastName) {
        leadData.lastName = normalizedData.lastName;
      }
      if (normalizedData.email) {
        leadData.email = normalizedData.email;
      }
      if (normalizedData.phoneNumber) {
        leadData.phoneNumber = normalizedData.phoneNumber;
      }
      if (normalizedData.website) {
        leadData.website = normalizedData.website;
      }
      if (normalizedData.company) {
        leadData.company = normalizedData.company;
      }
      if (normalizedData.jobTitle) {
        leadData.jobTitle = normalizedData.jobTitle;
      }

      await leadsApi.createLead(leadData);

      showToast.success('Succès', 'Le lead a été créé avec succès');

      onSuccess();
      router.refresh();
    } catch (error: any) {
      console.error('Error creating lead:', error);
      showToast.error('Erreur', error?.response?.data?.message || 'Erreur lors de la création du lead');
      setStep('review');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'upload') {
    return (
      <div ref={containerRef} className="space-y-6">
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
          <PhotoIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          {isDragActive ? (
            <p className="text-lg font-medium text-brand-600">
              Déposez l'image ici...
            </p>
          ) : (
            <>
              <p className="text-lg font-medium text-gray-900 mb-2">
                Glissez-déposez une image ici
              </p>
              <p className="text-sm text-gray-500 mb-4">
                ou cliquez pour sélectionner une image
              </p>
              <p className="text-xs text-gray-400 mb-3">
                Vous pouvez aussi coller une image avec Ctrl+V (ou Cmd+V sur Mac)
              </p>
              <Button type="button" variant="outline" size="sm">
                Sélectionner une image
              </Button>
            </>
          )}
        </div>

        {loading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700">Extraction en cours...</span>
              <span className="text-gray-900 font-medium">{ocrProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-brand-600 h-2 transition-all duration-300"
                style={{ width: `${ocrProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="bg-brand-50 border border-brand-200 rounded-lg p-4">
          <h4 className="font-medium text-brand-900 mb-2 flex items-center gap-2">
            <CameraIcon className="w-5 h-5" />
            Comment ça marche ?
          </h4>
          <ol className="text-sm text-brand-800 space-y-2 list-decimal list-inside">
            <li>Prenez une capture d'écran ou photo d'une carte de visite</li>
            <li>Téléchargez l'image ci-dessus</li>
            <li>L'OCR extrait automatiquement les informations</li>
            <li>Vérifiez et corrigez les données si nécessaire</li>
            <li>Créez le lead en un clic</li>
          </ol>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-900 mb-2">
            ⚠️ Recommandations
          </h4>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Utilisez des images claires et bien éclairées</li>
            <li>• Le texte doit être lisible et bien contrasté</li>
            <li>• Formats supportés : PNG, JPG, JPEG, GIF, WEBP</li>
            <li>• Taille maximale recommandée : 5 MB</li>
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

  if (step === 'review' && extractedData) {
    const validation = validateExtractedLead(editedData as ExtractedLead);
    const confidenceColor =
      extractedData.confidence > 0.7
        ? 'text-green-600'
        : extractedData.confidence > 0.4
        ? 'text-yellow-600'
        : 'text-red-600';

    return (
      <div className="space-y-6">
        {/* Image Preview & Confidence */}
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {preview && (
              <img
                src={preview}
                alt="Preview"
                className="w-full h-48 object-contain bg-gray-50"
              />
            )}
          </div>
          <div className="space-y-2">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Confiance globale</div>
              <div className={`text-3xl font-bold ${confidenceColor}`}>
                {Math.round(extractedData.confidence * 100)}%
              </div>
            </div>
            {extractedData.confidence < 0.5 && (
              <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-800">
                  Confiance faible. Veuillez vérifier attentivement les données extraites.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Validation Errors */}
        {!validation.isValid && (
          <div className="space-y-2">
            {validation.errors.map((error, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3"
              >
                <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            ))}
          </div>
        )}

        {/* Extracted Fields */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Données extraites - Vérifiez et corrigez si nécessaire</h4>

          <div className="bg-brand-50 border border-brand-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-brand-800">
              <span className="font-medium">⚠️ Requis:</span> Au moins un email <span className="font-medium">ou</span> un numéro de téléphone doit être fourni.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                id="firstName"
                value={editedData.firstName || ''}
                onChange={(e) => handleFieldChange('firstName', e.target.value)}
                placeholder="Ex: Jean"
              />
              {extractedData.fieldConfidence?.firstName !== undefined && (
                <p className="text-xs text-gray-500 mt-1">
                  Confiance: {Math.round(extractedData.fieldConfidence.firstName * 100)}%
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="lastName">Nom</Label>
              <Input
                id="lastName"
                value={editedData.lastName || ''}
                onChange={(e) => handleFieldChange('lastName', e.target.value)}
                placeholder="Ex: Dupont"
              />
              {extractedData.fieldConfidence?.lastName !== undefined && (
                <p className="text-xs text-gray-500 mt-1">
                  Confiance: {Math.round(extractedData.fieldConfidence.lastName * 100)}%
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="email">
                Email {!editedData.phoneNumber && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="email"
                type="email"
                value={editedData.email || ''}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                placeholder="Ex: jean.dupont@example.com"
              />
              {extractedData.fieldConfidence?.email !== undefined && (
                <p className="text-xs text-gray-500 mt-1">
                  Confiance: {Math.round(extractedData.fieldConfidence.email * 100)}%
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="phoneNumber">
                Téléphone {!editedData.email && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={editedData.phoneNumber || ''}
                onChange={(e) => handleFieldChange('phoneNumber', e.target.value)}
                placeholder="Ex: (514) 388-3819 ou +15143883819"
              />
              {extractedData.fieldConfidence?.phoneNumber !== undefined && (
                <p className="text-xs text-gray-500 mt-1">
                  Confiance: {Math.round(extractedData.fieldConfidence.phoneNumber * 100)}%
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="website">Site web</Label>
              <Input
                id="website"
                type="url"
                value={editedData.website || ''}
                onChange={(e) => handleFieldChange('website', e.target.value)}
                placeholder="Ex: https://example.com"
              />
              {extractedData.fieldConfidence?.website !== undefined && (
                <p className="text-xs text-gray-500 mt-1">
                  Confiance: {Math.round(extractedData.fieldConfidence.website * 100)}%
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="company">Société</Label>
              <Input
                id="company"
                value={editedData.company || ''}
                onChange={(e) => handleFieldChange('company', e.target.value)}
                placeholder="Ex: Acme Corp"
              />
              {extractedData.fieldConfidence?.company !== undefined && (
                <p className="text-xs text-gray-500 mt-1">
                  Confiance: {Math.round(extractedData.fieldConfidence.company * 100)}%
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="jobTitle">Poste</Label>
              <Input
                id="jobTitle"
                value={editedData.jobTitle || ''}
                onChange={(e) => handleFieldChange('jobTitle', e.target.value)}
                placeholder="Ex: Directeur Commercial"
              />
              {extractedData.fieldConfidence?.jobTitle !== undefined && (
                <p className="text-xs text-gray-500 mt-1">
                  Confiance: {Math.round(extractedData.fieldConfidence.jobTitle * 100)}%
                </p>
              )}
            </div>
          </div>

          {/* Raw Text */}
          {extractedData.rawText && (
            <div>
              <Label htmlFor="rawText">Texte brut extrait</Label>
              <Textarea
                id="rawText"
                value={extractedData.rawText}
                readOnly
                rows={4}
                className="bg-gray-50 font-mono text-xs"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={handleReset}>
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Autre image
          </Button>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleCreate}
              disabled={!validation.isValid}
            >
              <CheckCircleIcon className="w-4 h-4 mr-2" />
              Créer le lead
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'creating') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-600 mb-4" />
        <p className="text-lg font-medium text-gray-900">Création en cours...</p>
        <p className="text-sm text-gray-500">Veuillez patienter</p>
      </div>
    );
  }

  return null;
}

