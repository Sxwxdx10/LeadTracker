'use client';

import React from 'react';

// Données simulées pour le tableau
const tableData = [
  { id: 1, name: 'Jean Dupont', leads: 45, conversions: 12, rate: '26.7%', revenue: 15000 },
  { id: 2, name: 'Marie Martin', leads: 38, conversions: 8, rate: '21.1%', revenue: 12000 },
  { id: 3, name: 'Pierre Durand', leads: 32, conversions: 6, rate: '18.8%', revenue: 9000 },
  { id: 4, name: 'Sophie Leroy', leads: 28, conversions: 5, rate: '17.9%', revenue: 7500 },
  { id: 5, name: 'Alex Moreau', leads: 25, conversions: 4, rate: '16.0%', revenue: 6000 }
];

export default function AnalyticsTable() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Tableau de performance détaillé
      </h3>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Utilisateur
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Leads
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Conversions
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Taux
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Revenus
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tableData.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {row.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {row.leads}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {row.conversions}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    parseFloat(row.rate) >= 25 ? 'bg-green-100 text-green-800' :
                    parseFloat(row.rate) >= 20 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {row.rate}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {row.revenue.toLocaleString('fr-FR')} €
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
