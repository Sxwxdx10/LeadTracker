'use client';

import React, { useState } from 'react';
import { Select, Textarea, Checkbox, Radio, DatePicker, FileUpload } from '@/components/ui/forms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function FormComponentsDemo() {
  const [formData, setFormData] = useState({
    selectValue: '',
    textareaValue: '',
    checkboxValue: false,
    radioValue: '',
    dateValue: null as Date | null,
    files: [] as File[]
  });

  const selectOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3 (disabled)', disabled: true },
  ];

  const radioOptions = [
    { value: 'radio1', label: 'Radio Option 1', description: 'Description pour l\'option 1' },
    { value: 'radio2', label: 'Radio Option 2', description: 'Description pour l\'option 2' },
    { value: 'radio3', label: 'Radio Option 3 (disabled)', disabled: true },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form data:', formData);
    alert('Données du formulaire dans la console !');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Démonstration des Composants de Formulaire
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Select Component */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sélecteur (Select)
              </label>
              <Select
                options={selectOptions}
                placeholder="Choisissez une option"
                value={formData.selectValue}
                onChange={(value) => setFormData(prev => ({ ...prev, selectValue: value as string }))}
              />
            </div>

            {/* Textarea Component */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zone de texte (Textarea)
              </label>
              <Textarea
                placeholder="Saisissez votre message ici..."
                value={formData.textareaValue}
                onChange={(e) => setFormData(prev => ({ ...prev, textareaValue: e.target.value }))}
                rows={4}
              />
            </div>

            {/* Checkbox Component */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Case à cocher (Checkbox)
              </label>
              <Checkbox
                label="J'accepte les conditions d'utilisation"
                description="En cochant cette case, vous acceptez nos conditions d'utilisation."
                checked={formData.checkboxValue}
                onChange={(checked) => setFormData(prev => ({ ...prev, checkboxValue: checked }))}
              />
            </div>

            {/* Radio Component */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Boutons radio (Radio)
              </label>
              <Radio
                name="radioGroup"
                options={radioOptions}
                value={formData.radioValue}
                onChange={(value) => setFormData(prev => ({ ...prev, radioValue: value }))}
              />
            </div>

            {/* DatePicker Component */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sélecteur de date (DatePicker)
              </label>
              <DatePicker
                value={formData.dateValue}
                onChange={(date) => setFormData(prev => ({ ...prev, dateValue: date }))}
                placeholder="Sélectionnez une date"
              />
            </div>

            {/* FileUpload Component */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload de fichiers (FileUpload)
              </label>
              <FileUpload
                onFilesChange={(files) => setFormData(prev => ({ ...prev, files }))}
                maxFiles={3}
                maxSize={5}
                acceptedTypes={['image/*', '.pdf', '.doc', '.docx']}
                multiple={true}
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button type="submit" className="w-full">
                Tester les Composants
              </Button>
            </div>
          </form>

          {/* Display current form data */}
          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Données actuelles du formulaire :
            </h3>
            <pre className="text-xs text-gray-600 overflow-auto">
              {JSON.stringify(formData, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
