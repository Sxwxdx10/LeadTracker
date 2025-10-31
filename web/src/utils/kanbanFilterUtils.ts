import { Lead } from '@/types/lead';
import { Stage } from '@/types/lead';

// Fonction pour mapper les filtres d'étapes selon la logique du Kanban
export const mapStageFilterToKanbanLogic = (
  stageIds: string[], 
  stages: Stage[], 
  leads: Lead[]
): Lead[] => {
  if (stageIds.length === 0) return leads;
  
  return leads.filter(lead => {
    // Vérifier si ce lead correspond à au moins un des stages sélectionnés
    return stageIds.some(stageId => {
      const stage = stages.find(s => s.id === stageId);
      if (!stage) return false;
      
      // RÈGLE IMPORTANTE : Un lead fermé ne peut PAS conserver son stage d'origine
      // Il doit automatiquement passer au stage "Fermé - Gagné" ou "Fermé - Perdu"
      
      // Logique spéciale pour les colonnes Won et Lost
      if (stage.isWonStage) {
        // Pour les colonnes Won, montrer TOUS les leads avec status 'Won'
        // Peu importe leur stageId d'origine, ils sont maintenant dans le stage Won
        return lead.status === 'Won';
      } else if (stage.isLostStage) {
        // Pour les colonnes Lost, montrer TOUS les leads avec status 'Lost'
        // Peu importe leur stageId d'origine, ils sont maintenant dans le stage Lost
        return lead.status === 'Lost';
      } else {
        // Pour les colonnes normales (Nouveau → Négociation), vérifier stageId ET status approprié
        // Seuls les leads avec des statuts "ouverts" peuvent rester dans leur stage d'origine
        const isInThisStage = lead.stageId === stageId;
        const hasOpenStatus = lead.status === 'Open' || 
                             lead.status === 'InProgress' || 
                             lead.status === 'Qualified';
        
        // Un lead fermé (Won/Lost) ne peut PAS être dans un stage normal
        // Il doit être dans le stage Won ou Lost correspondant
        return isInThisStage && hasOpenStatus;
      }
    });
  });
};

// Fonction pour obtenir les options de filtres d'étapes avec la logique Kanban
export const getStageFilterOptions = (stages: Stage[], leads: Lead[]) => {
  return stages.map(stage => {
    let count = 0;
    
    if (stage.isWonStage) {
      // Pour les colonnes Won, compter TOUS les leads avec status 'Won'
      // Peu importe leur stageId d'origine, ils sont maintenant dans le stage Won
      count = leads.filter(lead => lead.status === 'Won').length;
    } else if (stage.isLostStage) {
      // Pour les colonnes Lost, compter TOUS les leads avec status 'Lost'
      // Peu importe leur stageId d'origine, ils sont maintenant dans le stage Lost
      count = leads.filter(lead => lead.status === 'Lost').length;
    } else {
      // Pour les colonnes normales (Nouveau → Négociation), compter les leads avec stageId correspondant ET status approprié
      // Seuls les leads avec des statuts "ouverts" peuvent rester dans leur stage d'origine
      // Un lead fermé (Won/Lost) ne peut PAS être dans un stage normal
      count = leads.filter(lead => 
        lead.stageId === stage.id && 
        (lead.status === 'Open' || lead.status === 'InProgress' || lead.status === 'Qualified')
      ).length;
    }
    
    return {
      value: stage.id,
      label: `${stage.name} (${count})`,
      count,
    };
  });
};
