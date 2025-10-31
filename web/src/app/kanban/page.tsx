'use client';

import React from 'react';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { useAuth } from '@/contexts/AuthContext';
import { useSignalR } from '@/hooks/useSignalR';
import Loading from '@/components/ui/loading';

export default function KanbanPage() {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Initialize SignalR connection
  useSignalR();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Accès non autorisé
          </h1>
          <p className="text-gray-600">
            Vous devez être connecté pour accéder au tableau Kanban.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <KanbanBoard />
      </div>
    </div>
  );
}
