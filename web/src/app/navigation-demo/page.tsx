'use client';

import React, { useState } from 'react';
import { 
  Home, 
  Users, 
  Settings, 
  FileText, 
  BarChart,
  Mail,
  Search,
  Bell,
  User,
  Calendar,
  Archive,
  Bookmark,
  Download
} from 'lucide-react';
import { 
  Breadcrumb, 
  Sidebar, 
  Navbar, 
  NavbarNotifications, 
  NavbarUserMenu,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  DynamicTabs
} from '@/components/ui/navigation';
import { Button } from '@/components/ui/button';

export default function NavigationDemo() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showMobileMenu, setShowMobileMenu] = useState(true);
  const [dynamicTabs, setDynamicTabs] = useState([
    { value: 'tab1', label: 'Premier onglet', icon: <Home className="w-4 h-4" />, badge: '3' },
    { value: 'tab2', label: 'Deuxième onglet', icon: <Users className="w-4 h-4" />, closable: true },
    { value: 'tab3', label: 'Troisième onglet', icon: <Settings className="w-4 h-4" />, closable: true, badge: 'New' },
  ]);

  // Données pour le breadcrumb
  const breadcrumbItems = [
    { label: 'Tableau de bord', href: '/', icon: <Home className="w-4 h-4" /> },
    { label: 'Projets', href: '/projects' },
    { label: 'Lead Tracker', href: '/projects/leadtracker' },
    { label: 'Navigation Demo' }
  ];

  // Données pour la sidebar
  const sidebarItems = [
    { 
      id: 'dashboard', 
      label: 'Tableau de bord', 
      icon: <Home className="w-4 h-4" />, 
      active: true 
    },
    {
      id: 'leads',
      label: 'Prospects',
      icon: <Users className="w-4 h-4" />,
      badge: '12',
      children: [
        { id: 'all-leads', label: 'Tous les prospects', href: '/leads' },
        { id: 'new-leads', label: 'Nouveaux prospects', href: '/leads/new', badge: '5' },
        { id: 'qualified', label: 'Qualifiés', href: '/leads/qualified' }
      ]
    },
    {
      id: 'reports',
      label: 'Rapports',
      icon: <BarChart className="w-4 h-4" />,
      children: [
        { id: 'sales-report', label: 'Rapport de ventes', href: '/reports/sales' },
        { id: 'activity-report', label: 'Rapport d\'activité', href: '/reports/activity' }
      ]
    },
    { 
      id: 'settings', 
      label: 'Paramètres', 
      icon: <Settings className="w-4 h-4" />, 
      href: '/settings' 
    }
  ];

  // Données pour la navbar - version simplifiée pour la démo
  const navbarItems = [
    { id: 'dashboard', label: 'Tableau de bord', href: '/', active: true },
    { id: 'leads', label: 'Prospects', href: '/leads' },
    { id: 'settings', label: 'Paramètres', href: '/settings' }
  ];

  const handleTabClose = (tabValue: string) => {
    setDynamicTabs(tabs => tabs.filter(tab => tab.value !== tabValue));
    if (activeTab === tabValue && dynamicTabs.length > 1) {
      const remainingTabs = dynamicTabs.filter(tab => tab.value !== tabValue);
      setActiveTab(remainingTabs[0]?.value || '');
    }
  };

  const addNewTab = () => {
    const newTab = {
      value: `tab${Date.now()}`,
      label: `Nouvel onglet ${dynamicTabs.length + 1}`,
      icon: <FileText className="w-4 h-4" />,
      closable: true
    };
    setDynamicTabs(tabs => [...tabs, newTab]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar Demo */}
      <div className="mb-8">
        <div className="flex items-center justify-between px-6 pt-6">
          <h2 className="text-xl font-bold">Navbar - Barre de navigation</h2>
          <Button 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            variant="outline"
            size="sm"
          >
            {showMobileMenu ? 'Masquer' : 'Afficher'} menu mobile
          </Button>
        </div>
        <Navbar
          logo={<span className="text-xl font-bold text-blue-600">LeadTracker</span>}
          items={showMobileMenu ? navbarItems : []}
          showSearch={true}
          onSearch={(query) => console.log('Recherche:', query)}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          showMobileMenu={showMobileMenu}
          rightItems={
            <div className="flex items-center gap-2">
              <NavbarNotifications count={5} />
              <NavbarUserMenu 
                name="John Doe"
                avatar={<User className="w-5 h-5" />}
                items={[
                  { label: 'Mon profil', onClick: () => console.log('Profil') },
                  { label: 'Paramètres', onClick: () => console.log('Paramètres') },
                  { label: 'Se déconnecter', onClick: () => console.log('Déconnexion') }
                ]}
              />
            </div>
          }
          className="shadow-sm"
        />
      </div>

      <div className="px-6">
        {/* Breadcrumb Demo */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Breadcrumb - Fil d'Ariane</h2>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <Breadcrumb items={breadcrumbItems} />
          </div>
        </div>

        {/* Sidebar Demo */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Sidebar - Barre latérale</h2>
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="relative h-96">
              <Sidebar
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
                onClose={() => setSidebarOpen(false)}
                title="Navigation"
                items={sidebarItems}
                className="relative"
                overlay={false}
              />
              <div className="ml-64 p-4 h-full bg-gray-50">
                <p className="text-gray-600">
                  Contenu principal de la page. 
                  <Button 
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    variant="outline"
                    className="ml-4"
                  >
                    {sidebarOpen ? 'Masquer' : 'Afficher'} la sidebar
                  </Button>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Demo */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Tabs - Onglets (Variantes)</h2>
          
          {/* Tabs par défaut */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-4">
            <h3 className="text-lg font-semibold mb-4">Style par défaut</h3>
            <Tabs defaultValue="overview" variant="default">
              <TabsList>
                <TabsTrigger value="overview" icon={<Home className="w-4 h-4" />}>
                  Vue d'ensemble
                </TabsTrigger>
                <TabsTrigger value="analytics" icon={<BarChart className="w-4 h-4" />} badge="5">
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="reports" icon={<FileText className="w-4 h-4" />}>
                  Rapports
                </TabsTrigger>
                <TabsTrigger value="settings" icon={<Settings className="w-4 h-4" />}>
                  Paramètres
                </TabsTrigger>
              </TabsList>
              <TabsContent value="overview">
                <div className="p-4 bg-gray-50 rounded">
                  <h4 className="font-medium mb-2">Vue d'ensemble</h4>
                  <p className="text-gray-600">Contenu de la vue d'ensemble avec statistiques générales.</p>
                </div>
              </TabsContent>
              <TabsContent value="analytics">
                <div className="p-4 bg-gray-50 rounded">
                  <h4 className="font-medium mb-2">Analytics</h4>
                  <p className="text-gray-600">Graphiques et métriques détaillées (5 nouveaux rapports).</p>
                </div>
              </TabsContent>
              <TabsContent value="reports">
                <div className="p-4 bg-gray-50 rounded">
                  <h4 className="font-medium mb-2">Rapports</h4>
                  <p className="text-gray-600">Liste des rapports générés et historique.</p>
                </div>
              </TabsContent>
              <TabsContent value="settings">
                <div className="p-4 bg-gray-50 rounded">
                  <h4 className="font-medium mb-2">Paramètres</h4>
                  <p className="text-gray-600">Configuration et préférences utilisateur.</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Tabs Pills */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-4">
            <h3 className="text-lg font-semibold mb-4">Style Pills</h3>
            <Tabs defaultValue="inbox" variant="pills">
              <TabsList>
                <TabsTrigger value="inbox" icon={<Mail className="w-4 h-4" />} badge="12">
                  Boîte de réception
                </TabsTrigger>
                <TabsTrigger value="sent" icon={<Archive className="w-4 h-4" />}>
                  Envoyés
                </TabsTrigger>
                <TabsTrigger value="bookmarks" icon={<Bookmark className="w-4 h-4" />} badge="3">
                  Favoris
                </TabsTrigger>
              </TabsList>
              <TabsContent value="inbox">
                <div className="p-4 bg-gray-50 rounded">
                  <h4 className="font-medium mb-2">Boîte de réception (12)</h4>
                  <p className="text-gray-600">Messages reçus et non lus.</p>
                </div>
              </TabsContent>
              <TabsContent value="sent">
                <div className="p-4 bg-gray-50 rounded">
                  <h4 className="font-medium mb-2">Messages envoyés</h4>
                  <p className="text-gray-600">Historique des messages envoyés.</p>
                </div>
              </TabsContent>
              <TabsContent value="bookmarks">
                <div className="p-4 bg-gray-50 rounded">
                  <h4 className="font-medium mb-2">Favoris (3)</h4>
                  <p className="text-gray-600">Messages marqués comme favoris.</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Tabs Underline */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-4">
            <h3 className="text-lg font-semibold mb-4">Style Underline</h3>
            <Tabs defaultValue="today" variant="underline">
              <TabsList>
                <TabsTrigger value="today" icon={<Calendar className="w-4 h-4" />}>
                  Aujourd'hui
                </TabsTrigger>
                <TabsTrigger value="week" icon={<Calendar className="w-4 h-4" />} badge="25">
                  Cette semaine
                </TabsTrigger>
                <TabsTrigger value="month" icon={<Calendar className="w-4 h-4" />}>
                  Ce mois
                </TabsTrigger>
              </TabsList>
              <TabsContent value="today">
                <div className="p-4 bg-gray-50 rounded">
                  <h4 className="font-medium mb-2">Activités d'aujourd'hui</h4>
                  <p className="text-gray-600">Tâches et événements prévus pour aujourd'hui.</p>
                </div>
              </TabsContent>
              <TabsContent value="week">
                <div className="p-4 bg-gray-50 rounded">
                  <h4 className="font-medium mb-2">Cette semaine (25 activités)</h4>
                  <p className="text-gray-600">Planning de la semaine en cours.</p>
                </div>
              </TabsContent>
              <TabsContent value="month">
                <div className="p-4 bg-gray-50 rounded">
                  <h4 className="font-medium mb-2">Ce mois</h4>
                  <p className="text-gray-600">Vue mensuelle du planning.</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Dynamic Tabs */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Onglets dynamiques (fermables)</h3>
              <Button onClick={addNewTab} size="sm">
                Ajouter un onglet
              </Button>
            </div>
            <DynamicTabs
              items={dynamicTabs}
              defaultValue={dynamicTabs[0]?.value || ''}
              variant="default"
              onTabClose={handleTabClose}
              renderContent={(item) => (
                <div className="p-4 bg-gray-50 rounded">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    {item.icon}
                    {item.label}
                    {item.badge && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </h4>
                  <p className="text-gray-600">
                    Contenu de l'onglet "{item.label}". 
                    {item.closable && " Cet onglet peut être fermé."}
                  </p>
                </div>
              )}
            />
          </div>
        </div>

        {/* Tabs Vertical */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Tabs Vertical</h2>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <Tabs defaultValue="profile" orientation="vertical" variant="default">
              <TabsList>
                <TabsTrigger value="profile" icon={<User className="w-4 h-4" />}>
                  Profil
                </TabsTrigger>
                <TabsTrigger value="security" icon={<Settings className="w-4 h-4" />} badge="!">
                  Sécurité
                </TabsTrigger>
                <TabsTrigger value="notifications" icon={<Bell className="w-4 h-4" />} badge="3">
                  Notifications
                </TabsTrigger>
                <TabsTrigger value="exports" icon={<Download className="w-4 h-4" />}>
                  Exports
                </TabsTrigger>
              </TabsList>
              <TabsContent value="profile">
                <div className="p-4 bg-gray-50 rounded">
                  <h4 className="font-medium mb-2">Informations de profil</h4>
                  <p className="text-gray-600">Gérez vos informations personnelles et vos préférences.</p>
                </div>
              </TabsContent>
              <TabsContent value="security">
                <div className="p-4 bg-gray-50 rounded">
                  <h4 className="font-medium mb-2">Paramètres de sécurité (!)</h4>
                  <p className="text-gray-600">Configurez votre mot de passe et l'authentification à deux facteurs.</p>
                </div>
              </TabsContent>
              <TabsContent value="notifications">
                <div className="p-4 bg-gray-50 rounded">
                  <h4 className="font-medium mb-2">Notifications (3 nouvelles)</h4>
                  <p className="text-gray-600">Choisissez quand et comment recevoir des notifications.</p>
                </div>
              </TabsContent>
              <TabsContent value="exports">
                <div className="p-4 bg-gray-50 rounded">
                  <h4 className="font-medium mb-2">Exporter vos données</h4>
                  <p className="text-gray-600">Téléchargez vos données dans différents formats.</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
