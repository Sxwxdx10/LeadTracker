import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon, 
  FunnelIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  UserIcon,
  TagIcon,
  StarIcon,
  BookmarkIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SimpleSelect } from '@/components/ui/SimpleSelect';
import { FilterPill } from '@/components/ui/FilterPill';
import { useFocusTrap, useEscapeKey } from '@/hooks/useKeyboardNavigation';
import { FilterState } from '@/hooks/useFilterPanel';
import { SavedFilter } from '@/hooks/useSavedFilters';
import { useDynamicFilterOptions } from '@/hooks/useDynamicFilterOptions';
import { Lead, Stage } from '@/types/lead';
import { cn } from '@/lib/utils';

export interface LeadFiltersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onApply: () => void;
  onReset: () => void;
  savedFilters?: SavedFilter[];
  onLoadSavedFilter?: (filter: SavedFilter) => void;
  onSaveFilter?: (name: string, isFavorite: boolean) => void;
  leads?: Lead[]; // Ajouter les leads pour extraire les options dynamiques
  stages?: Stage[]; // Ajouter les stages pour la logique Kanban
  className?: string;
}

// Les données sont maintenant récupérées via useFilterOptions hook

export function LeadFiltersPanel({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onApply,
  onReset,
  savedFilters = [],
  onLoadSavedFilter,
  onSaveFilter,
  leads = [],
  stages = [],
  className,
}: LeadFiltersPanelProps) {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveFilterName, setSaveFilterName] = useState('');
  const [saveAsFavorite, setSaveAsFavorite] = useState(false);
  
  // Extraire les options de filtres dynamiquement depuis les données des leads
  const filterOptions = useDynamicFilterOptions(leads, stages);
  
  const containerRef = useFocusTrap(isOpen);
  useEscapeKey(onClose, isOpen);

  // Animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const panelVariants = {
    hidden: { 
      x: '100%',
      opacity: 0,
    },
    visible: { 
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 200,
      },
    },
    exit: {
      x: '100%',
      opacity: 0,
      transition: {
        duration: 0.2,
      },
    },
  };

  const handleFilterChange = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleMultiSelectChange = (key: keyof FilterState, values: string | string[]) => {
    const arrayValues = Array.isArray(values) ? values : [values];
    handleFilterChange(key, arrayValues as any);
  };

  const handleSaveFilter = () => {
    if (saveFilterName.trim() && onSaveFilter) {
      onSaveFilter(saveFilterName.trim(), saveAsFavorite);
      setSaveFilterName('');
      setSaveAsFavorite(false);
      setShowSaveModal(false);
    }
  };

  const hasActiveFilters = Object.values(filters).some(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(v => v !== undefined && v !== '');
    }
    return value !== '' && value !== undefined;
  });

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={onClose}
            />

            {/* Panel */}
            <motion.div
              ref={containerRef}
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={cn(
                'fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50',
                'rounded-l-3xl border-l border-gray-200',
                className
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-100 rounded-xl">
                    <FunnelIcon className="h-5 w-5 text-brand-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Filtres avancés
                    </h2>
                    <p className="text-sm text-gray-500">
                      Affinez votre recherche
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
                >
                  <XMarkIcon className="h-4 w-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Saved Filters */}
                {savedFilters.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      <BookmarkIcon className="h-4 w-4" />
                      Filtres sauvegardés
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {savedFilters.map((filter) => (
                        <FilterPill
                          key={filter.id}
                          label={filter.name}
                          variant="secondary"
                          size="sm"
                          icon={filter.isFavorite ? <StarIcon className="h-3 w-3 text-yellow-500" /> : undefined}
                          onClick={() => onLoadSavedFilter?.(filter)}
                          className="cursor-pointer"
                        />
                      ))}
                    </div>
                  </div>
                )}


                {/* Quick Filters */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-900">
                    Filtres rapides
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <FilterPill
                      label="Mes leads"
                      variant="outline"
                      size="sm"
                      onClick={() => handleMultiSelectChange('ownerIds', ['user-current'])}
                      className="cursor-pointer"
                    />
                    <FilterPill
                      label="Qualifiés"
                      variant="outline"
                      size="sm"
                      onClick={() => handleMultiSelectChange('statuses', ['Qualified'])}
                      className="cursor-pointer"
                    />
                    <FilterPill
                      label="Fort potentiel"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleFilterChange('valueRange', { min: 50000 });
                        handleFilterChange('probabilityRange', { min: 75 });
                      }}
                      className="cursor-pointer"
                    />
                  </div>
                </div>

                {/* Advanced Filters */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-900">
                    Filtres avancés
                  </h3>

                  {/* Stages */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <TagIcon className="h-4 w-4" />
                      Étapes
                    </label>
                    <SimpleSelect
                      value={filters.stageIds}
                      onChange={(values) => handleMultiSelectChange('stageIds', values)}
                      options={filterOptions.stages}
                      placeholder="Sélectionner les étapes..."
                      multiple
                      className="rounded-xl"
                    />
                  </div>

                  {/* Owners */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <UserIcon className="h-4 w-4" />
                      Propriétaires
                    </label>
                    <SimpleSelect
                      value={filters.ownerIds}
                      onChange={(values) => handleMultiSelectChange('ownerIds', values)}
                      options={filterOptions.users}
                      placeholder="Sélectionner les propriétaires..."
                      multiple
                      className="rounded-xl"
                    />
                  </div>

                  {/* Statuses */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Statuts
                    </label>
                    <SimpleSelect
                      value={filters.statuses}
                      onChange={(values) => handleMultiSelectChange('statuses', values)}
                      options={filterOptions.statuses}
                      placeholder="Sélectionner les statuts..."
                      multiple
                      className="rounded-xl"
                    />
                  </div>

                  {/* Companies */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <BuildingOfficeIcon className="h-4 w-4" />
                      Entreprises
                    </label>
                    <SimpleSelect
                      value={filters.companies}
                      onChange={(values) => handleMultiSelectChange('companies', values)}
                      options={filterOptions.companies}
                      placeholder="Sélectionner les entreprises..."
                      multiple
                      className="rounded-xl"
                    />
                  </div>

                  {/* Date Range */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      Période de création
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        type="date"
                        value={filters.dateRange.from || ''}
                        onChange={(e) => handleFilterChange('dateRange', { 
                          ...filters.dateRange, 
                          from: e.target.value 
                        })}
                        className="rounded-xl"
                      />
                      <Input
                        type="date"
                        value={filters.dateRange.to || ''}
                        onChange={(e) => handleFilterChange('dateRange', { 
                          ...filters.dateRange, 
                          to: e.target.value 
                        })}
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Value Range */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <CurrencyDollarIcon className="h-4 w-4" />
                      Valeur estimée
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.valueRange.min || ''}
                        onChange={(e) => handleFilterChange('valueRange', { 
                          ...filters.valueRange, 
                          min: e.target.value ? Number(e.target.value) : undefined 
                        } as any)}
                        className="rounded-xl"
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.valueRange.max || ''}
                        onChange={(e) => handleFilterChange('valueRange', { 
                          ...filters.valueRange, 
                          max: e.target.value ? Number(e.target.value) : undefined 
                        } as any)}
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Probability Range */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <ChartBarIcon className="h-4 w-4" />
                      Probabilité
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        type="number"
                        placeholder="Min %"
                        min="0"
                        max="100"
                        value={filters.probabilityRange.min || ''}
                        onChange={(e) => handleFilterChange('probabilityRange', { 
                          ...filters.probabilityRange, 
                          min: e.target.value ? Number(e.target.value) : undefined 
                        } as any)}
                        className="rounded-xl"
                      />
                      <Input
                        type="number"
                        placeholder="Max %"
                        min="0"
                        max="100"
                        value={filters.probabilityRange.max || ''}
                        onChange={(e) => handleFilterChange('probabilityRange', { 
                          ...filters.probabilityRange, 
                          max: e.target.value ? Number(e.target.value) : undefined 
                        } as any)}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-bl-3xl">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onReset}
                      className="rounded-xl"
                    >
                      Réinitialiser
                    </Button>
                    {hasActiveFilters && onSaveFilter && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSaveModal(true)}
                        className="rounded-xl"
                      >
                        Sauvegarder
                      </Button>
                    )}
                  </div>
                  <Button
                    onClick={onApply}
                    className="rounded-xl bg-brand-500 hover:bg-brand-600"
                  >
                    Appliquer
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Save Filter Modal */}
      <AnimatePresence>
        {showSaveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 flex items-center justify-center p-4"
            onClick={() => setShowSaveModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Sauvegarder le filtre
              </h3>
              
              <div className="space-y-4">
                <Input
                  placeholder="Nom du filtre..."
                  value={saveFilterName}
                  onChange={(e) => setSaveFilterName(e.target.value)}
                  className="rounded-xl"
                />
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveAsFavorite}
                    onChange={(e) => setSaveAsFavorite(e.target.checked)}
                    className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm text-gray-700">
                    Définir comme favori
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowSaveModal(false)}
                  className="rounded-xl"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSaveFilter}
                  disabled={!saveFilterName.trim()}
                  className="rounded-xl bg-brand-600 hover:bg-brand-700"
                >
                  Sauvegarder
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
