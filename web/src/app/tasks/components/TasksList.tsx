'use client';

import React, { useState } from 'react';
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ListBulletIcon,
  UserIcon,
  TagIcon,
  PencilIcon,
  TrashIcon,
  BellAlertIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

// Données simulées des tâches
const tasks = [
  {
    id: 1,
    title: 'Appeler prospect ABC',
    description: 'Suivre le devis envoyé la semaine dernière',
    dueDate: '2024-01-15',
    status: 'pending',
    priority: 'high',
    tags: ['commercial', 'suivi'],
    assignedTo: 'Jean Dupont',
    estimatedTime: '30 min',
    actualTime: null
  },
  {
    id: 2,
    title: 'Préparer présentation Q1',
    description: 'Créer les slides pour la réunion de direction',
    dueDate: '2024-01-20',
    status: 'in_progress',
    priority: 'medium',
    tags: ['présentation', 'direction'],
    assignedTo: 'Marie Martin',
    estimatedTime: '2h',
    actualTime: '1h30'
  },
  {
    id: 3,
    title: 'Mettre à jour CRM',
    description: 'Saisir les nouvelles données clients',
    dueDate: '2024-01-10',
    status: 'overdue',
    priority: 'low',
    tags: ['admin', 'crm'],
    assignedTo: 'Pierre Durand',
    estimatedTime: '1h',
    actualTime: null
  },
  {
    id: 4,
    title: 'Envoyer newsletter',
    description: 'Préparer et envoyer la newsletter mensuelle',
    dueDate: '2024-01-25',
    status: 'pending',
    priority: 'medium',
    tags: ['marketing', 'newsletter'],
    assignedTo: 'Sophie Leroy',
    estimatedTime: '1h30',
    actualTime: null
  },
  {
    id: 5,
    title: 'Formation équipe',
    description: 'Organiser la formation sur le nouveau produit',
    dueDate: '2024-01-18',
    status: 'completed',
    priority: 'high',
    tags: ['formation', 'équipe'],
    assignedTo: 'Alex Moreau',
    estimatedTime: '3h',
    actualTime: '2h45'
  }
];

const filterOptions = [
  { value: 'today', label: "Aujourd'hui" },
  { value: 'overdue', label: 'En retard' },
  { value: 'upcoming', label: 'À venir' },
  { value: 'completed', label: 'Terminées' }
];

const priorityColors = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800'
};

const statusColors = {
  pending: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  overdue: 'bg-red-100 text-red-800',
  completed: 'bg-green-100 text-green-800'
};

export default function TasksList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('today');
  const [activeTab, setActiveTab] = useState('today');

  const handleFilterChange = (value: string | string[]) => {
    if (typeof value === 'string') {
      setFilterStatus(value);
      setActiveTab(value);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterStatus === 'today') {
      return matchesSearch && task.status === 'pending';
    } else if (filterStatus === 'overdue') {
      return matchesSearch && task.status === 'overdue';
    } else if (filterStatus === 'upcoming') {
      return matchesSearch && task.status === 'in_progress';
    } else if (filterStatus === 'completed') {
      return matchesSearch && task.status === 'completed';
    }
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Filtres et recherche */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher une tâche..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={filterStatus}
              onChange={handleFilterChange}
              options={filterOptions}
            />
          </div>
          <Button className="flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />
            Nouvelle tâche
          </Button>
        </div>
      </div>

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="today">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="today" className="flex items-center gap-2">
            <CalendarDaysIcon className="h-4 w-4" />
            Aujourd'hui
          </TabsTrigger>
          <TabsTrigger value="overdue" className="flex items-center gap-2">
            <ExclamationTriangleIcon className="h-4 w-4" />
            En retard
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4" />
            À venir
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircleIcon className="h-4 w-4" />
            Terminées
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-6">
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <div key={task.id} className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
                      <Badge className={priorityColors[task.priority as keyof typeof priorityColors]}>
                        {task.priority}
                      </Badge>
                      <Badge className={statusColors[task.status as keyof typeof statusColors]}>
                        {task.status}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-3">{task.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <CalendarDaysIcon className="h-4 w-4" />
                        {new Date(task.dueDate).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="flex items-center gap-1">
                        <UserIcon className="h-4 w-4" />
                        {task.assignedTo}
                      </div>
                      <div className="flex items-center gap-1">
                        <ClockIcon className="h-4 w-4" />
                        {task.estimatedTime}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      {task.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          <TagIcon className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button size="sm" variant="outline">
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <BellAlertIcon className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="overdue" className="mt-6">
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <div key={task.id} className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
                      <Badge className={priorityColors[task.priority as keyof typeof priorityColors]}>
                        {task.priority}
                      </Badge>
                      <Badge className="bg-red-100 text-red-800">
                        En retard
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-3">{task.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <CalendarDaysIcon className="h-4 w-4" />
                        {new Date(task.dueDate).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="flex items-center gap-1">
                        <UserIcon className="h-4 w-4" />
                        {task.assignedTo}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button size="sm" variant="outline">
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <BellAlertIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="upcoming" className="mt-6">
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <div key={task.id} className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
                      <Badge className={priorityColors[task.priority as keyof typeof priorityColors]}>
                        {task.priority}
                      </Badge>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        En cours
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-3">{task.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <CalendarDaysIcon className="h-4 w-4" />
                        {new Date(task.dueDate).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="flex items-center gap-1">
                        <UserIcon className="h-4 w-4" />
                        {task.assignedTo}
                      </div>
                      <div className="flex items-center gap-1">
                        <ClockIcon className="h-4 w-4" />
                        {task.actualTime || task.estimatedTime}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button size="sm" variant="outline">
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <BellAlertIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <div key={task.id} className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900 line-through">{task.title}</h3>
                      <Badge className="bg-green-100 text-green-800">
                        Terminée
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-3">{task.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <CalendarDaysIcon className="h-4 w-4" />
                        {new Date(task.dueDate).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="flex items-center gap-1">
                        <UserIcon className="h-4 w-4" />
                        {task.assignedTo}
                      </div>
                      <div className="flex items-center gap-1">
                        <ClockIcon className="h-4 w-4" />
                        {task.actualTime} / {task.estimatedTime}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button size="sm" variant="outline">
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
