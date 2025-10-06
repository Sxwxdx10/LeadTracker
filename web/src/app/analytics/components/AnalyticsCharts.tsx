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

// Données simulées pour les graphiques
const conversionFunnelData = [
  { name: 'Visiteurs', value: 1000, fill: '#8884d8' },
  { name: 'Leads', value: 375, fill: '#82ca9d' },
  { name: 'Qualifiés', value: 150, fill: '#ffc658' },
  { name: 'Prospects', value: 75, fill: '#ff7300' },
  { name: 'Clients', value: 25, fill: '#00ff00' }
];

const sourceData = [
  { name: 'Site web', value: 45, color: '#8884d8' },
  { name: 'Email', value: 25, color: '#82ca9d' },
  { name: 'Téléphone', value: 15, color: '#ffc658' },
  { name: 'Réseaux sociaux', value: 10, color: '#ff7300' },
  { name: 'Recommandation', value: 5, color: '#00ff00' }
];

const performanceData = [
  { name: 'Jean Dupont', leads: 45, conversions: 12, revenue: 15000 },
  { name: 'Marie Martin', leads: 38, conversions: 8, revenue: 12000 },
  { name: 'Pierre Durand', leads: 32, conversions: 6, revenue: 9000 },
  { name: 'Sophie Leroy', leads: 28, conversions: 5, revenue: 7500 },
  { name: 'Alex Moreau', leads: 25, conversions: 4, revenue: 6000 }
];

const trendsData = [
  { month: 'Jan', leads: 120, conversions: 25, revenue: 30000 },
  { month: 'Fév', leads: 135, conversions: 28, revenue: 32000 },
  { month: 'Mar', leads: 150, conversions: 32, revenue: 35000 },
  { month: 'Avr', leads: 140, conversions: 30, revenue: 33000 },
  { month: 'Mai', leads: 165, conversions: 35, revenue: 38000 },
  { month: 'Juin', leads: 180, conversions: 38, revenue: 40000 }
];

export default function AnalyticsCharts() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedView, setSelectedView] = useState('funnel');

  const periodOptions = [
    { value: '7d', label: '7 derniers jours' },
    { value: '30d', label: '30 derniers jours' },
    { value: '90d', label: '90 derniers jours' },
    { value: '1y', label: '1 an' }
  ];

  const userOptions = [
    { value: 'all', label: 'Tous les utilisateurs' },
    { value: 'jean', label: 'Jean Dupont' },
    { value: 'marie', label: 'Marie Martin' },
    { value: 'pierre', label: 'Pierre Durand' }
  ];

  const viewOptions = [
    { value: 'funnel', label: 'Funnel de conversion' },
    { value: 'sources', label: 'Analyse des sources' },
    { value: 'users', label: 'Performance utilisateurs' },
    { value: 'trends', label: 'Tendances temporelles' }
  ];

  const handlePeriodChange = (value: string | string[]) => {
    if (typeof value === 'string') {
      setSelectedPeriod(value);
    }
  };

  const handleUserChange = (value: string | string[]) => {
    if (typeof value === 'string') {
      setSelectedUser(value);
    }
  };

  return (
    <div className="space-y-8">
      {/* Filtres */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-4">
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
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Utilisateur
            </label>
            <Select
              value={selectedUser}
              onChange={handleUserChange}
              options={userOptions}
            />
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <Tabs value={selectedView} onValueChange={setSelectedView} defaultValue="overview">
        <TabsList className="grid w-full grid-cols-4">
          {viewOptions.map((option) => (
            <TabsTrigger key={option.value} value={option.value}>
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="funnel" className="mt-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Funnel de conversion détaillé
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={conversionFunnelData} layout="horizontal">
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sources" className="mt-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Analyse des sources de leads
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
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Performance par utilisateur
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="leads" fill="#8884d8" name="Leads" />
                  <Bar dataKey="conversions" fill="#82ca9d" name="Conversions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="mt-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Tendances temporelles
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="leads" stroke="#8884d8" strokeWidth={2} name="Leads" />
                  <Line type="monotone" dataKey="conversions" stroke="#82ca9d" strokeWidth={2} name="Conversions" />
                  <Line type="monotone" dataKey="revenue" stroke="#ffc658" strokeWidth={2} name="Revenus" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
