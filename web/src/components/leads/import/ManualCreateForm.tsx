'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/useToast';
import { leadsApi } from '@/lib/api';
import { useStages } from '@/hooks/useLeads';

interface ManualCreateFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  company: string;
  jobTitle: string;
  estimatedValue: string;
  probability: string;
  source: string;
  notes: string;
}

export function ManualCreateForm({ onSuccess, onCancel }: ManualCreateFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const { data: stages } = useStages();

  // Determine a sensible default stage for new leads
  const defaultStageId = useMemo(() => {
    if (!stages || stages.length === 0) return undefined;
    // Try to find a stage named "Nouveau" (FR) or "New"
    const preferred = stages.find(
      (s) =>
        s.name.toLowerCase().includes('nouveau') ||
        s.name.toLowerCase().includes('new')
    );
    return (preferred || stages[0]).id;
  }, [stages]);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    company: '',
    jobTitle: '',
    estimatedValue: '',
    probability: '',
    source: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    // Required fields validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom est requis';
    }
    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    // Numeric validations
    if (formData.estimatedValue && isNaN(Number(formData.estimatedValue))) {
      newErrors.estimatedValue = 'Valeur numérique invalide';
    }
    if (formData.probability) {
      const prob = Number(formData.probability);
      if (isNaN(prob) || prob < 0 || prob > 100) {
        newErrors.probability = 'La probabilité doit être entre 0 et 100';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!defaultStageId) {
      // Back-end requires a StageId, so we block creation if none is available
      toast.error(
        'Configuration requise',
        "Aucune étape de pipeline n'est disponible pour créer un lead. Veuillez vérifier la configuration des étapes."
      );
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const leadData = {
        title: formData.title || `${formData.firstName} ${formData.lastName}`,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber || undefined,
        company: formData.company || undefined,
        jobTitle: formData.jobTitle || undefined,
        estimatedValue: formData.estimatedValue ? Number(formData.estimatedValue) : undefined,
        probability: formData.probability ? Number(formData.probability) : undefined,
        source: formData.source || undefined,
        notes: formData.notes || undefined,
        stageId: defaultStageId,
      };

      // Use leads API to create a single lead (same base path as the rest of the app)
      await leadsApi.createLead(leadData as any);
      
      toast.success('Succès', 'Le lead a été créé avec succès');

      onSuccess();
      router.refresh();
    } catch (error: any) {
      console.error('Error creating lead:', error);
      toast.error(
        'Erreur',
        error?.response?.data?.message ||
          error?.message ||
          'Erreur lors de la création du lead'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {/* Title */}
        <div className="col-span-2">
          <Label htmlFor="title">
            Titre <span className="text-gray-500 text-xs">(optionnel)</span>
          </Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Ex: Lead Conference Tech 2024"
          />
        </div>

        {/* First Name */}
        <div>
          <Label htmlFor="firstName">
            Prénom <span className="text-red-500">*</span>
          </Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            placeholder="Jean"
            className={errors.firstName ? 'border-red-500' : ''}
          />
          {errors.firstName && (
            <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <Label htmlFor="lastName">
            Nom <span className="text-red-500">*</span>
          </Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            placeholder="Dupont"
            className={errors.lastName ? 'border-red-500' : ''}
          />
          {errors.lastName && (
            <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <Label htmlFor="email">
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="jean.dupont@example.com"
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <Label htmlFor="phoneNumber">Téléphone</Label>
          <Input
            id="phoneNumber"
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => handleChange('phoneNumber', e.target.value)}
            placeholder="+33 6 12 34 56 78"
          />
        </div>

        {/* Company */}
        <div>
          <Label htmlFor="company">Société</Label>
          <Input
            id="company"
            value={formData.company}
            onChange={(e) => handleChange('company', e.target.value)}
            placeholder="Acme Corp"
          />
        </div>

        {/* Job Title */}
        <div>
          <Label htmlFor="jobTitle">Poste</Label>
          <Input
            id="jobTitle"
            value={formData.jobTitle}
            onChange={(e) => handleChange('jobTitle', e.target.value)}
            placeholder="Directeur Commercial"
          />
        </div>

        {/* Estimated Value */}
        <div>
          <Label htmlFor="estimatedValue">Valeur estimée (€)</Label>
          <Input
            id="estimatedValue"
            type="number"
            step="0.01"
            value={formData.estimatedValue}
            onChange={(e) => handleChange('estimatedValue', e.target.value)}
            placeholder="10000"
            className={errors.estimatedValue ? 'border-red-500' : ''}
          />
          {errors.estimatedValue && (
            <p className="text-red-500 text-sm mt-1">{errors.estimatedValue}</p>
          )}
        </div>

        {/* Probability */}
        <div>
          <Label htmlFor="probability">Probabilité (%)</Label>
          <Input
            id="probability"
            type="number"
            min="0"
            max="100"
            value={formData.probability}
            onChange={(e) => handleChange('probability', e.target.value)}
            placeholder="50"
            className={errors.probability ? 'border-red-500' : ''}
          />
          {errors.probability && (
            <p className="text-red-500 text-sm mt-1">{errors.probability}</p>
          )}
        </div>

        {/* Source */}
        <div className="col-span-2">
          <Label htmlFor="source">Source</Label>
          <Input
            id="source"
            value={formData.source}
            onChange={(e) => handleChange('source', e.target.value)}
            placeholder="Ex: LinkedIn, Conférence, Site web..."
          />
        </div>

        {/* Notes */}
        <div className="col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Informations supplémentaires..."
            rows={4}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" loading={loading}>
          Créer le lead
        </Button>
      </div>
    </form>
  );
}

