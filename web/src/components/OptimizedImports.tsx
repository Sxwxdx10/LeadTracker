'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Optimisation des imports de Recharts - chargement dynamique
// Note: Using type assertion due to Recharts dynamic import type incompatibility with Next.js
export const LazyRecharts: any = {
  LineChart: dynamic(() => import('recharts').then(mod => ({ default: mod.LineChart })) as any, { ssr: false }),
  Line: dynamic(() => import('recharts').then(mod => ({ default: mod.Line })) as any, { ssr: false }),
  AreaChart: dynamic(() => import('recharts').then(mod => ({ default: mod.AreaChart })) as any, { ssr: false }),
  Area: dynamic(() => import('recharts').then(mod => ({ default: mod.Area })) as any, { ssr: false }),
  BarChart: dynamic(() => import('recharts').then(mod => ({ default: mod.BarChart })) as any, { ssr: false }),
  Bar: dynamic(() => import('recharts').then(mod => ({ default: mod.Bar })) as any, { ssr: false }),
  PieChart: dynamic(() => import('recharts').then(mod => ({ default: mod.PieChart })) as any, { ssr: false }),
  Pie: dynamic(() => import('recharts').then(mod => ({ default: mod.Pie })) as any, { ssr: false }),
  Cell: dynamic(() => import('recharts').then(mod => ({ default: mod.Cell })) as any, { ssr: false }),
  XAxis: dynamic(() => import('recharts').then(mod => ({ default: mod.XAxis })) as any, { ssr: false }),
  YAxis: dynamic(() => import('recharts').then(mod => ({ default: mod.YAxis })) as any, { ssr: false }),
  CartesianGrid: dynamic(() => import('recharts').then(mod => ({ default: mod.CartesianGrid })) as any, { ssr: false }),
  Tooltip: dynamic(() => import('recharts').then(mod => ({ default: mod.Tooltip })) as any, { ssr: false }),
  Legend: dynamic(() => import('recharts').then(mod => ({ default: mod.Legend })) as any, { ssr: false }),
  ResponsiveContainer: dynamic(() => import('recharts').then(mod => ({ default: mod.ResponsiveContainer })) as any, { ssr: false }),
};

// Optimisation des imports d'icônes - chargement dynamique
export const LazyIcons = {
  // Icons de base
  CheckCircleIcon: dynamic(() => import('@heroicons/react/24/outline').then(mod => ({ default: mod.CheckCircleIcon })), { ssr: false }),
  ExclamationTriangleIcon: dynamic(() => import('@heroicons/react/24/outline').then(mod => ({ default: mod.ExclamationTriangleIcon })), { ssr: false }),
  InformationCircleIcon: dynamic(() => import('@heroicons/react/24/outline').then(mod => ({ default: mod.InformationCircleIcon })), { ssr: false }),
  
  // Icons de navigation
  PlusIcon: dynamic(() => import('@heroicons/react/24/outline').then(mod => ({ default: mod.PlusIcon })), { ssr: false }),
  XMarkIcon: dynamic(() => import('@heroicons/react/24/outline').then(mod => ({ default: mod.XMarkIcon })), { ssr: false }),
  MagnifyingGlassIcon: dynamic(() => import('@heroicons/react/24/outline').then(mod => ({ default: mod.MagnifyingGlassIcon })), { ssr: false }),
  
  // Icons de fichiers
  DocumentArrowDownIcon: dynamic(() => import('@heroicons/react/24/outline').then(mod => ({ default: mod.DocumentArrowDownIcon })), { ssr: false }),
  TableCellsIcon: dynamic(() => import('@heroicons/react/24/outline').then(mod => ({ default: mod.TableCellsIcon })), { ssr: false }),
  ArrowDownTrayIcon: dynamic(() => import('@heroicons/react/24/outline').then(mod => ({ default: mod.ArrowDownTrayIcon })), { ssr: false }),
  CloudArrowUpIcon: dynamic(() => import('@heroicons/react/24/outline').then(mod => ({ default: mod.CloudArrowUpIcon })), { ssr: false }),
  
  // Icons de temps
  ClockIcon: dynamic(() => import('@heroicons/react/24/outline').then(mod => ({ default: mod.ClockIcon })), { ssr: false }),
  CalendarDaysIcon: dynamic(() => import('@heroicons/react/24/outline').then(mod => ({ default: mod.CalendarDaysIcon })), { ssr: false }),
  
  // Icons de statut
  UserIcon: dynamic(() => import('@heroicons/react/24/outline').then(mod => ({ default: mod.UserIcon })), { ssr: false }),
  TagIcon: dynamic(() => import('@heroicons/react/24/outline').then(mod => ({ default: mod.TagIcon })), { ssr: false }),
  PencilIcon: dynamic(() => import('@heroicons/react/24/outline').then(mod => ({ default: mod.PencilIcon })), { ssr: false }),
  TrashIcon: dynamic(() => import('@heroicons/react/24/outline').then(mod => ({ default: mod.TrashIcon })), { ssr: false }),
  BellAlertIcon: dynamic(() => import('@heroicons/react/24/outline').then(mod => ({ default: mod.BellAlertIcon })), { ssr: false }),
  
  // Icons de graphiques
  ChartBarIcon: dynamic(() => import('@heroicons/react/24/outline').then(mod => ({ default: mod.ChartBarIcon })), { ssr: false }),
  CurrencyEuroIcon: dynamic(() => import('@heroicons/react/24/outline').then(mod => ({ default: mod.CurrencyEuroIcon })), { ssr: false }),
  UserGroupIcon: dynamic(() => import('@heroicons/react/24/outline').then(mod => ({ default: mod.UserGroupIcon })), { ssr: false }),
  
  // Icons de filtres
  FunnelIcon: dynamic(() => import('@heroicons/react/24/outline').then(mod => ({ default: mod.FunnelIcon })), { ssr: false }),
  ListBulletIcon: dynamic(() => import('@heroicons/react/24/outline').then(mod => ({ default: mod.ListBulletIcon })), { ssr: false }),
  
  // Icons d'actions
  EyeIcon: dynamic(() => import('@heroicons/react/24/outline').then(mod => ({ default: mod.EyeIcon })), { ssr: false }),
  ArrowPathIcon: dynamic(() => import('@heroicons/react/24/outline').then(mod => ({ default: mod.ArrowPathIcon })), { ssr: false }),
};

// Composant de chargement optimisé pour les graphiques
export const ChartLoadingSkeleton = ({ height = 300 }: { height?: number }) => (
  <div 
    className="animate-pulse bg-gray-200 rounded-lg flex items-center justify-center"
    style={{ height: `${height}px` }}
  >
    <div className="text-center">
      <div className="w-8 h-8 bg-gray-300 rounded-full mx-auto mb-2"></div>
      <p className="text-gray-500 text-sm">Chargement du graphique...</p>
    </div>
  </div>
);

// Hook pour le lazy loading avec intersection observer
export const useLazyLoad = (threshold = 0.1) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
};

// Composant wrapper pour le lazy loading
export const LazyLoadWrapper = ({ 
  children, 
  fallback, 
  threshold = 0.1 
}: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode; 
  threshold?: number;
}) => {
  const { ref, isVisible } = useLazyLoad(threshold);

  return (
    <div ref={ref}>
      {isVisible ? children : (fallback || <ChartLoadingSkeleton />)}
    </div>
  );
};

export default LazyRecharts;
