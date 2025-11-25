'use client';

import React, { useState, useEffect } from 'react';
import { KanbanCustomization as KanbanCustomizationType } from '@/types/kanban';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useKanbanStore } from '@/stores/kanbanStore';
import { 
  AdjustmentsHorizontalIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface KanbanCustomizationProps {
  onCustomizationChange?: (customization: KanbanCustomizationType) => void;
}

export function KanbanCustomization({ onCustomizationChange }: KanbanCustomizationProps) {
  const { customization, setCustomization } = useKanbanStore();
  const [isExpanded, setIsExpanded] = useState(false);

  // Initialize with defaults if not set
  const currentCustomization = {
    showMetrics: customization.showMetrics ?? true,
    showTaskCount: customization.showTaskCount ?? true,
    showOverdue: customization.showOverdue ?? true,
    showAssignedUser: customization.showAssignedUser ?? true,
    cardSize: customization.cardSize ?? 'medium',
    colorScheme: customization.colorScheme ?? 'default',
    columnWidth: customization.columnWidth ?? 320,
    maxLeadsPerColumn: customization.maxLeadsPerColumn ?? 50,
  };

  const handleCustomizationChange = (key: keyof KanbanCustomizationType, value: any) => {
    const newCustomization = { ...currentCustomization, [key]: value };
    setCustomization(newCustomization);
    if (onCustomizationChange) {
      onCustomizationChange(newCustomization as KanbanCustomizationType);
    }
  };

  const resetCustomization = () => {
    const defaultCustomization: Partial<KanbanCustomizationType> = {
      showMetrics: true,
      showTaskCount: true,
      showOverdue: true,
      showAssignedUser: true,
      cardSize: 'medium',
      colorScheme: 'default',
      columnWidth: 320,
      maxLeadsPerColumn: 50,
    };
    setCustomization(defaultCustomization);
    if (onCustomizationChange) {
      onCustomizationChange(defaultCustomization as KanbanCustomizationType);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-900">
            Personnalisation
          </h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetCustomization}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-4 w-4 mr-1" />
            Réinitialiser
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Réduire' : 'Étendre'}
          </Button>
        </div>
      </div>

      {/* Basic Customization */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card Size */}
        <div>
          <Label className="text-xs text-gray-600 mb-2 block">
            Taille des cartes
          </Label>
          <select
            value={currentCustomization.cardSize}
            onChange={(e) => handleCustomizationChange('cardSize', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="small">Petite</option>
            <option value="medium">Moyenne</option>
            <option value="large">Grande</option>
          </select>
        </div>

        {/* Color Scheme */}
        <div>
          <Label className="text-xs text-gray-600 mb-2 block">
            Thème de couleur
          </Label>
          <select
            value={currentCustomization.colorScheme}
            onChange={(e) => handleCustomizationChange('colorScheme', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="default">Par défaut</option>
            <option value="colorful">Coloré</option>
            <option value="minimal">Minimal</option>
          </select>
        </div>

        {/* Column Width */}
        <div>
          <Label className="text-xs text-gray-600 mb-2 block">
            Largeur colonnes (px)
          </Label>
          <input
            type="number"
            min="250"
            max="500"
            step="10"
            value={currentCustomization.columnWidth}
            onChange={(e) => handleCustomizationChange('columnWidth', Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Max Leads per Column */}
        <div>
          <Label className="text-xs text-gray-600 mb-2 block">
            Max leads/colonne
          </Label>
          <input
            type="number"
            min="10"
            max="100"
            step="10"
            value={currentCustomization.maxLeadsPerColumn}
            onChange={(e) => handleCustomizationChange('maxLeadsPerColumn', Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Advanced Customization */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Éléments à afficher
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Show Metrics */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="show-metrics"
                checked={currentCustomization.showMetrics}
                onChange={(e) => handleCustomizationChange('showMetrics', e.target.checked)}
                className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <Label htmlFor="show-metrics" className="text-sm text-gray-700">
                Métriques
              </Label>
            </div>

            {/* Show Task Count */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="show-task-count"
                checked={currentCustomization.showTaskCount}
                onChange={(e) => handleCustomizationChange('showTaskCount', e.target.checked)}
                className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <Label htmlFor="show-task-count" className="text-sm text-gray-700">
                Compteur tâches
              </Label>
            </div>

            {/* Show Overdue */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="show-overdue"
                checked={currentCustomization.showOverdue}
                onChange={(e) => handleCustomizationChange('showOverdue', e.target.checked)}
                className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <Label htmlFor="show-overdue" className="text-sm text-gray-700">
                Indicateurs retard
              </Label>
            </div>

            {/* Show Assigned User */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="show-assigned-user"
                checked={currentCustomization.showAssignedUser}
                onChange={(e) => handleCustomizationChange('showAssignedUser', e.target.checked)}
                className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <Label htmlFor="show-assigned-user" className="text-sm text-gray-700">
                Utilisateur assigné
              </Label>
            </div>
          </div>

          {/* Preview */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h5 className="text-xs font-medium text-gray-700 mb-2">Aperçu des modifications</h5>
            <div className="text-xs text-gray-600 space-y-1">
              <div>• Taille des cartes: {currentCustomization.cardSize}</div>
              <div>• Thème: {currentCustomization.colorScheme}</div>
              <div>• Largeur colonnes: {currentCustomization.columnWidth}px</div>
              <div>• Métriques: {currentCustomization.showMetrics ? 'Affichées' : 'Masquées'}</div>
              <div>• Tâches: {currentCustomization.showTaskCount ? 'Affichées' : 'Masquées'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
