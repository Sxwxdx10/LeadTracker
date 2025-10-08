'use client';

import React, { useState } from 'react';
import {
  DocumentArrowDownIcon,
  TableCellsIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const exportFields = [
  { id: 'firstName', name: 'Prénom', selected: true },
  { id: 'lastName', name: 'Nom', selected: true },
  { id: 'email', name: 'Email', selected: true },
  { id: 'phone', name: 'Téléphone', selected: false },
  { id: 'company', name: 'Entreprise', selected: false },
  { id: 'position', name: 'Poste', selected: false },
  { id: 'source', name: 'Source', selected: false },
  { id: 'status', name: 'Statut', selected: true },
  { id: 'createdAt', name: 'Date de création', selected: false },
  { id: 'lastContact', name: 'Dernier contact', selected: false }
];

const filterOptions = [
  { value: 'all', label: 'Tous les leads' },
  { value: 'active', label: 'Leads actifs' },
  { value: 'converted', label: 'Leads convertis' },
  { value: 'lost', label: 'Leads perdus' },
  { value: 'custom', label: 'Filtre personnalisé' }
];

const formatOptions = [
  { value: 'csv', label: 'CSV' },
  { value: 'excel', label: 'Excel' },
  { value: 'pdf', label: 'PDF' }
];

export default function ExportConfiguration() {
  const [selectedFields, setSelectedFields] = useState(exportFields);
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [customFilters, setCustomFilters] = useState<Array<{field: string, operator: string, value: string}>>([]);
  const [activeTab, setActiveTab] = useState('fields');

  const handleFieldToggle = (fieldId: string) => {
    setSelectedFields(prev => 
      prev.map(field => 
        field.id === fieldId ? { ...field, selected: !field.selected } : field
      )
    );
  };

  const handleFormatChange = (value: string | string[]) => {
    if (typeof value === 'string') {
      setSelectedFormat(value);
    }
  };

  const handleFilterChange = (value: string | string[]) => {
    if (typeof value === 'string') {
      setSelectedFilter(value);
    }
  };

  const addCustomFilter = () => {
    setCustomFilters(prev => [...prev, { field: '', operator: 'equals', value: '' }]);
  };

  const removeCustomFilter = (index: number) => {
    setCustomFilters(prev => prev.filter((_, i) => i !== index));
  };

  const updateCustomFilter = (index: number, field: string, value: string) => {
    setCustomFilters(prev => 
      prev.map((filter, i) => 
        i === index ? { ...filter, [field]: value } : filter
      )
    );
  };

  const handleExport = () => {
    alert(`Export ${selectedFormat.toUpperCase()} en cours...`);
  };

  return (
    <div className="space-y-6">
      {/* Format et filtres */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Configuration</h3>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">Format d'export</Label>
            <Select
              value={selectedFormat}
              onChange={handleFormatChange}
              options={formatOptions}
            />
          </div>
          
          <div>
            <Label className="text-sm font-medium text-gray-700">Filtres</Label>
            <Select
              value={selectedFilter}
              onChange={handleFilterChange}
              options={filterOptions}
            />
          </div>
        </div>
      </div>

      {/* Onglets de configuration */}
      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="fields">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="fields">Champs</TabsTrigger>
          <TabsTrigger value="filters">Filtres</TabsTrigger>
        </TabsList>

        <TabsContent value="fields" className="mt-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">Sélectionner les champs</h4>
            <div className="space-y-3">
              {selectedFields.map((field) => (
                <div key={field.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Checkbox
                      checked={field.selected}
                      onChange={() => handleFieldToggle(field.id)}
                    />
                    <span className="ml-3 text-sm font-medium text-gray-900">{field.name}</span>
                  </div>
                  {field.selected && (
                    <Badge variant="outline" className="text-xs">
                      Inclus
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="filters" className="mt-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">Filtres personnalisés</h4>
            
            {selectedFilter === 'custom' && (
              <div className="space-y-4">
                {customFilters.map((filter, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <Select
                      value={filter.field}
                      onChange={(value) => {
                        if (typeof value === 'string') {
                          updateCustomFilter(index, 'field', value);
                        }
                      }}
                      options={[
                        { value: '', label: 'Champ...' },
                        ...exportFields.map(field => ({ value: field.id, label: field.name }))
                      ]}
                    />
                    <Select
                      value={filter.operator}
                      onChange={(value) => {
                        if (typeof value === 'string') {
                          updateCustomFilter(index, 'operator', value);
                        }
                      }}
                      options={[
                        { value: 'equals', label: 'Égal à' },
                        { value: 'contains', label: 'Contient' },
                        { value: 'startsWith', label: 'Commence par' },
                        { value: 'endsWith', label: 'Finit par' }
                      ]}
                    />
                    <Input
                      value={filter.value}
                      onChange={(e) => updateCustomFilter(index, 'value', e.target.value)}
                      placeholder="Valeur..."
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeCustomFilter(index)}
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <Button
                  onClick={addCustomFilter}
                  variant="outline"
                  className="w-full flex items-center gap-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  Ajouter un filtre
                </Button>
              </div>
            )}
            
            {selectedFilter !== 'custom' && (
              <div className="text-center py-8">
                <p className="text-gray-500">Sélectionnez "Filtre personnalisé" pour ajouter des filtres avancés</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Champs sélectionnés</span>
            <Badge variant="outline">
              {selectedFields.filter(f => f.selected).length} / {selectedFields.length}
            </Badge>
          </div>
          
          <Button
            onClick={handleExport}
            className="w-full flex items-center gap-2"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Exporter les données
          </Button>
        </div>
      </div>
    </div>
  );
}
