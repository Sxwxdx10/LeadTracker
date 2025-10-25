'use client';

import React from 'react';
import { 
  ClockIcon,
  CheckCircleIcon,
  PencilIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  DocumentTextIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { Activity } from '@/types/task';
import { formatDateTime } from '@/lib/utils';

interface ActivityTimelineProps {
  activities: Activity[];
  isLoading?: boolean;
}

// Function to get icon for activity type
const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'task_completed':
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    case 'task_created':
      return <CalendarIcon className="h-5 w-5 text-blue-500" />;
    case 'lead_status_changed':
      return <PencilIcon className="h-5 w-5 text-purple-500" />;
    case 'lead_updated':
      return <PencilIcon className="h-5 w-5 text-orange-500" />;
    case 'note_added':
      return <DocumentTextIcon className="h-5 w-5 text-gray-500" />;
    case 'call_made':
      return <PhoneIcon className="h-5 w-5 text-green-600" />;
    case 'email_sent':
      return <EnvelopeIcon className="h-5 w-5 text-blue-600" />;
    case 'meeting_scheduled':
      return <CalendarIcon className="h-5 w-5 text-indigo-500" />;
    default:
      return <ClockIcon className="h-5 w-5 text-gray-400" />;
  }
};

// Function to get activity color
const getActivityColor = (type: Activity['type']) => {
  switch (type) {
    case 'task_completed':
      return 'bg-green-100 border-green-200';
    case 'task_created':
      return 'bg-blue-100 border-blue-200';
    case 'lead_status_changed':
      return 'bg-purple-100 border-purple-200';
    case 'lead_updated':
      return 'bg-orange-100 border-orange-200';
    case 'note_added':
      return 'bg-gray-100 border-gray-200';
    case 'call_made':
      return 'bg-green-100 border-green-200';
    case 'email_sent':
      return 'bg-blue-100 border-blue-200';
    case 'meeting_scheduled':
      return 'bg-indigo-100 border-indigo-200';
    default:
      return 'bg-gray-100 border-gray-200';
  }
};

// Function to translate activity type
const translateActivityType = (type: Activity['type']) => {
  const translations = {
    'task_completed': 'Tâche terminée',
    'task_created': 'Tâche créée',
    'lead_status_changed': 'Statut modifié',
    'lead_updated': 'Lead mis à jour',
    'note_added': 'Note ajoutée',
    'call_made': 'Appel effectué',
    'email_sent': 'Email envoyé',
    'meeting_scheduled': 'Réunion programmée'
  };
  return translations[type] || type;
};

export function ActivityTimeline({ activities, isLoading }: ActivityTimelineProps) {
  // Ensure activities is always an array
  const safeActivities = Array.isArray(activities) ? activities : [];
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex space-x-3 animate-pulse">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (safeActivities.length === 0) {
    return (
      <div className="text-center py-8">
        <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">
          Aucune activité
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Les activités liées à ce lead apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {safeActivities.map((activity, activityIdx) => (
          <li key={activity.id}>
            <div className="relative pb-8">
              {activityIdx !== safeActivities.length - 1 ? (
                <span
                  className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex space-x-3">
                <div className={`flex-shrink-0 relative ${getActivityColor(activity.type)} rounded-full border-2 p-1`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="font-medium text-gray-900">
                        {activity.title}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        {translateActivityType(activity.type)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDateTime(activity.timestamp)}
                    </div>
                  </div>
                  
                  {activity.description && (
                    <div className="mt-1 text-sm text-gray-600">
                      {activity.description}
                    </div>
                  )}
                  
                  {activity.userName && (
                    <div className="mt-1 flex items-center text-xs text-gray-500">
                      <UserIcon className="h-3 w-3 mr-1" />
                      {activity.userName}
                    </div>
                  )}
                  
                  {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      {activity.metadata.taskTitle && (
                        <div>Tâche: {activity.metadata.taskTitle}</div>
                      )}
                      {activity.metadata.oldStatus && activity.metadata.newStatus && (
                        <div>
                          Statut: {activity.metadata.oldStatus} → {activity.metadata.newStatus}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
