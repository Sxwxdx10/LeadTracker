import { useEffect, useRef } from 'react';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { kanbanKeys } from './useKanban';
import { KanbanLead, KanbanColumn, KanbanMetrics, KanbanSignalREvents } from '@/types/kanban';
import toast from 'react-hot-toast';

export const useSignalR = () => {
  const connectionRef = useRef<HubConnection | null>(null);
  const queryClient = useQueryClient();
  const { user, organization, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !organization?.id) {
      return;
    }

    const startConnection = async () => {
      try {
        const connection = new HubConnectionBuilder()
          .withUrl(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/kanbanhub`, {
            accessTokenFactory: () => {
              // Get token from localStorage (same key as used in api.ts)
              const token = localStorage.getItem('accessToken');
              return token || '';
            },
          })
          .withAutomaticReconnect()
          .configureLogging(LogLevel.Information)
          .build();

        // Event handlers
        connection.on('LeadMoved', (lead: KanbanLead) => {
          console.log('Lead moved:', lead);
          toast.success(`Lead "${lead.title}" déplacé vers ${lead.status}`);
          
          // Update the cache optimistically
          queryClient.setQueryData(kanbanKeys.board(), (oldData: any) => {
            if (!oldData) return oldData;
            
            const updatedLeads = oldData.leads.map((l: KanbanLead) => 
              l.id === lead.id ? lead : l
            );
            
            return {
              ...oldData,
              leads: updatedLeads,
            };
          });
          
          // Invalidate metrics to recalculate
          queryClient.invalidateQueries({ queryKey: kanbanKeys.metrics() });
        });

        connection.on('LeadUpdated', (lead: KanbanLead) => {
          console.log('Lead updated:', lead);
          toast.success(`Lead "${lead.title}" mis à jour`);
          
          // Update the cache optimistically
          queryClient.setQueryData(kanbanKeys.board(), (oldData: any) => {
            if (!oldData) return oldData;
            
            const updatedLeads = oldData.leads.map((l: KanbanLead) => 
              l.id === lead.id ? lead : l
            );
            
            return {
              ...oldData,
              leads: updatedLeads,
            };
          });
          
          // Invalidate metrics to recalculate
          queryClient.invalidateQueries({ queryKey: kanbanKeys.metrics() });
        });

        connection.on('StageCreated', (stage: KanbanColumn) => {
          console.log('Stage created:', stage);
          toast.success(`Étape "${stage.name}" créée`);
          
          // Invalidate stages and board data
          queryClient.invalidateQueries({ queryKey: kanbanKeys.stages() });
          queryClient.invalidateQueries({ queryKey: kanbanKeys.board() });
        });

        connection.on('StageUpdated', (stage: KanbanColumn) => {
          console.log('Stage updated:', stage);
          toast.success(`Étape "${stage.name}" mise à jour`);
          
          // Invalidate stages and board data
          queryClient.invalidateQueries({ queryKey: kanbanKeys.stages() });
          queryClient.invalidateQueries({ queryKey: kanbanKeys.board() });
        });

        connection.on('StageDeleted', (stageId: string) => {
          console.log('Stage deleted:', stageId);
          toast.success('Étape supprimée');
          
          // Invalidate stages and board data
          queryClient.invalidateQueries({ queryKey: kanbanKeys.stages() });
          queryClient.invalidateQueries({ queryKey: kanbanKeys.board() });
        });

        connection.on('StagesReordered', (stages: KanbanColumn[]) => {
          console.log('Stages reordered:', stages);
          
          // Update stages in cache
          queryClient.setQueryData(kanbanKeys.stages(), stages);
          queryClient.invalidateQueries({ queryKey: kanbanKeys.board() });
        });

        connection.on('MetricsUpdated', (metrics: KanbanMetrics) => {
          console.log('Metrics updated:', metrics);
          
          // Update metrics in cache
          queryClient.setQueryData(kanbanKeys.metrics(), metrics);
        });

        // Start connection
        await connection.start();
        console.log('SignalR Connected');

        // Join tenant room
        await connection.invoke('JoinKanbanRoom', organization.id);

        connectionRef.current = connection;
      } catch (error) {
        console.error('SignalR connection failed:', error);
        toast.error('Erreur de connexion temps réel');
      }
    };

    startConnection();

    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop();
        console.log('SignalR Disconnected');
      }
    };
  }, [isAuthenticated, organization?.id, queryClient]);

  return {
    connection: connectionRef.current,
    isConnected: connectionRef.current?.state === 'Connected',
  };
};
