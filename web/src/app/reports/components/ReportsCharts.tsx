'use client';

import React, { useState } from 'react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts';
import { Select } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  DocumentArrowDownIcon, 
  TableCellsIcon, 
  ArrowDownTrayIcon 
} from '@heroicons/react/24/outline';

// Données simulées
const conversionData = [
  { name: 'Jan', leads: 120, conversions: 25 },
  { name: 'Fév', leads: 135, conversions: 28 },
  { name: 'Mar', leads: 150, conversions: 32 },
  { name: 'Avr', leads: 140, conversions: 30 },
  { name: 'Mai', leads: 165, conversions: 35 },
  { name: 'Juin', leads: 180, conversions: 38 }
];

const sourceData = [
  { name: 'Site web', value: 45, color: '#8884d8' },
  { name: 'Email', value: 25, color: '#82ca9d' },
  { name: 'Téléphone', value: 15, color: '#ffc658' },
  { name: 'Réseaux sociaux', value: 10, color: '#ff7300' },
  { name: 'Recommandation', value: 5, color: '#00ff00' }
];

const performanceData = [
  { name: 'Q1', leads: 400, conversions: 80, revenue: 120000 },
  { name: 'Q2', leads: 450, conversions: 95, revenue: 140000 },
  { name: 'Q3', leads: 500, conversions: 110, revenue: 160000 },
  { name: 'Q4', leads: 550, conversions: 125, revenue: 180000 }
];

const revenueData = [
  { name: 'Jan', revenue: 30000, target: 35000 },
  { name: 'Fév', revenue: 32000, target: 35000 },
  { name: 'Mar', revenue: 35000, target: 35000 },
  { name: 'Avr', revenue: 33000, target: 35000 },
  { name: 'Mai', revenue: 38000, target: 35000 },
  { name: 'Juin', revenue: 40000, target: 35000 }
];

export default function ReportsCharts() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedView, setSelectedView] = useState('overview');

  const periodOptions = [
    { value: '7d', label: '7 derniers jours' },
    { value: '30d', label: '30 derniers jours' },
    { value: '90d', label: '90 derniers jours' },
    { value: '1y', label: '1 an' }
  ];

  const viewOptions = [
    { value: 'overview', label: 'Vue d\'ensemble' },
    { value: 'conversion', label: 'Conversion' },
    { value: 'performance', label: 'Performance' },
    { value: 'revenue', label: 'Revenus' }
  ];

  const handlePeriodChange = (value: string | string[]) => {
    if (typeof value === 'string') {
      setSelectedPeriod(value);
    }
  };

  const handleExport = (format: string) => {
    alert(`Export ${format.toUpperCase()} en cours...`);
  };

  return (
    <div className="space-y-8">
      {/* Filtres et actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Période
            </label>
            <Select
              value={selectedPeriod}
              onChange={handlePeriodChange}
              options={periodOptions}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => handleExport('pdf')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <DocumentArrowDownIcon className="h-4 w-4" />
              PDF
            </Button>
            <Button
              onClick={() => handleExport('excel')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <TableCellsIcon className="h-4 w-4" />
              Excel
            </Button>
            <Button
              onClick={() => handleExport('csv')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <Tabs value={selectedView} onValueChange={setSelectedView}>
        <TabsList className="grid w-full grid-cols-4">
          {viewOptions.map((option) => (
            <TabsTrigger key={option.value} value={option.value}>
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Évolution des leads et conversions
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={conversionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="leads" stroke="#8884d8" strokeWidth={2} name="Leads" />
                    <Line type="monotone" dataKey="conversions" stroke="#82ca9d" strokeWidth={2} name="Conversions" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Sources des leads
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {sourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="conversion" className="mt-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Funnel de conversion
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={conversionData} layout="horizontal">
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="leads" fill="#8884d8" name="Leads" />
                  <Bar dataKey="conversions" fill="#82ca9d" name="Conversions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Performance trimestrielle
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="leads" stackId="1" stroke="#8884d8" fill="#8884d8" name="Leads" />
                  <Area type="monotone" dataKey="conversions" stackId="2" stroke="#82ca9d" fill="#82ca9d" name="Conversions" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="mt-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Revenus vs Objectifs
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="revenue" fill="#8884d8" name="Revenus" />
                  <Bar dataKey="target" fill="#ffc658" name="Objectif" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
