'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Lead } from '@/types/lead';
import { 
  XMarkIcon,
  CurrencyEuroIcon,
  CalendarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface QuickEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  onSave: (updates: Partial<Lead>) => Promise<void>;
}

export function QuickEditModal({ isOpen, onClose, lead, onSave }: QuickEditModalProps) {
  const [formData, setFormData] = useState<Partial<Lead>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (lead) {
      setFormData({
        title: lead.title,
        ...(lead.estimatedValue !== undefined && { estimatedValue: lead.estimatedValue }),
        probability: lead.probability || 0,
        ...(lead.expectedCloseDate && { expectedCloseDate: lead.expectedCloseDate }),
        ...(lead.notes && { notes: lead.notes })
      });
    }
  }, [lead, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving lead:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setFormData({});
    onClose();
  };

  if (!lead) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Édition rapide</span>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Fermer"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Lead Title */}
          <div>
            <Label htmlFor="title">Titre du lead</Label>
            <Input
              id="title"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="mt-1"
            />
          </div>

          {/* Value and Probability */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="estimatedValue">Valeur estimée (€)</Label>
              <div className="relative mt-1">
                <CurrencyEuroIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="estimatedValue"
                  type="number"
                  value={formData.estimatedValue || ''}
                  onChange={(e) => setFormData({ ...formData, estimatedValue: Number(e.target.value) })}
                  className="pl-10"
                  min="0"
                  step="1000"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="probability">Probabilité (%)</Label>
              <div className="relative mt-1">
                <ChartBarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="probability"
                  type="number"
                  value={formData.probability || ''}
                  onChange={(e) => setFormData({ ...formData, probability: Number(e.target.value) })}
                  className="pl-10"
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </div>

          {/* Expected Close Date */}
          <div>
            <Label htmlFor="expectedCloseDate">Date de clôture prévue</Label>
            <div className="relative mt-1">
              <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="expectedCloseDate"
                type="date"
                value={formData.expectedCloseDate || ''}
                onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Ajoutez des notes sur ce lead..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSaving}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
            >
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

