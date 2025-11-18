'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ChartBarIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  ArrowTrendingUpIcon,
  ShieldCheckIcon,
  ClockIcon,
  FunnelIcon,
  DocumentArrowUpIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Si l'utilisateur est déjà connecté, rediriger vers /leads
    if (!isLoading && isAuthenticated) {
      router.push('/leads');
    }
  }, [isAuthenticated, isLoading, router]);

  const features = [
    {
      icon: FunnelIcon,
      title: 'Pipeline Kanban',
      description: 'Visualisez et gérez vos leads avec un tableau Kanban intuitif et personnalisable.',
      color: 'brand',
    },
    {
      icon: UserGroupIcon,
      title: 'Gestion Multi-tenant',
      description: 'Séparation complète des données par organisation pour une sécurité maximale.',
      color: 'secondary',
    },
    {
      icon: ClipboardDocumentCheckIcon,
      title: 'Tâches & Rappels',
      description: 'Organisez vos actions avec des tâches assignées et des rappels automatiques.',
      color: 'brand',
    },
    {
      icon: ChartBarIcon,
      title: 'Analyses & Statistiques',
      description: 'Suivez vos performances avec des tableaux de bord et des métriques en temps réel.',
      color: 'secondary',
    },
    {
      icon: DocumentArrowUpIcon,
      title: 'Import de Leads',
      description: 'Importez vos leads en masse depuis des fichiers CSV avec validation automatique.',
      color: 'brand',
    },
    {
      icon: ArrowTrendingUpIcon,
      title: 'Conversion Optimisée',
      description: 'Augmentez votre taux de conversion avec un suivi intelligent des opportunités.',
      color: 'secondary',
    },
  ];

  const benefits = [
    {
      icon: ClockIcon,
      title: 'Gain de temps',
      description: 'Automatisez vos processus et concentrez-vous sur ce qui compte vraiment.',
    },
    {
      icon: ShieldCheckIcon,
      title: 'Sécurité renforcée',
      description: 'Architecture multi-tenant avec isolation complète des données par organisation.',
    },
    {
      icon: ArrowTrendingUpIcon,
      title: 'Croissance mesurable',
      description: 'Suivez vos KPIs et optimisez vos stratégies commerciales avec des données précises.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-600 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">LT</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-brand-600 to-brand-700 bg-clip-text text-transparent">
                Lead Tracker
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-gray-700 hover:text-brand-600 font-medium transition-colors"
              >
                Connexion
              </Link>
              <Button
                onClick={() => router.push('/login')}
                className="bg-brand-500 hover:bg-brand-600 text-white shadow-md hover:shadow-lg transition-all"
              >
                Commencer
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-secondary-50">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-brand-100 text-brand-700 rounded-full text-sm font-semibold">
              <SparklesIcon className="w-4 h-4" />
              <span>Solution CRM Moderne</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-tight">
              Gérez vos leads avec
              <span className="block bg-gradient-to-r from-brand-600 to-brand-700 bg-clip-text text-transparent">
                intelligence et simplicité
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              La plateforme de gestion de leads multi-tenant qui transforme vos prospects en clients.
              Automatisez, suivez et convertissez avec des outils puissants et intuitifs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={() => router.push('/login')}
                size="lg"
                className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                Se connecter
              </Button>
              <Button
                onClick={() => router.push('/register')}
                size="lg"
                variant="outline"
                className="border-2 border-brand-500 text-brand-600 hover:bg-brand-50 px-8 py-6 text-lg font-semibold transition-all"
              >
                Créer un compte
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Fonctionnalités puissantes
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tout ce dont vous avez besoin pour gérer efficacement vos leads et développer votre activité
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isBrand = feature.color === 'brand';
              return (
                <div
                  key={index}
                  className="group p-8 rounded-2xl bg-gradient-to-br from-white to-gray-50 border border-gray-200 hover:border-brand-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${
                      isBrand
                        ? 'bg-brand-100 text-brand-600 group-hover:bg-brand-500 group-hover:text-white'
                        : 'bg-secondary-100 text-secondary-600 group-hover:bg-secondary-500 group-hover:text-white'
                    } transition-all duration-300`}
                  >
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-gradient-to-br from-brand-50 to-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Pourquoi choisir Lead Tracker ?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Une solution conçue pour les équipes qui veulent exceller dans la gestion de leurs leads
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={index}
                  className="text-center p-8 bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300"
                >
                  <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{benefit.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-brand-600 to-brand-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Prêt à transformer votre gestion de leads ?
          </h2>
          <p className="text-xl text-brand-100 mb-10 max-w-2xl mx-auto">
            Rejoignez les équipes qui utilisent Lead Tracker pour optimiser leur pipeline commercial
            et augmenter leurs conversions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push('/register')}
              size="lg"
              className="bg-white text-brand-600 hover:bg-gray-100 px-8 py-6 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
            >
              Créer un compte gratuit
            </Button>
            <Button
              onClick={() => router.push('/login')}
              size="lg"
              variant="outline"
              className="border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg font-semibold transition-all"
            >
              Se connecter
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">LT</span>
              </div>
              <span className="text-lg font-semibold text-white">Lead Tracker</span>
            </div>
            <div className="text-sm">
              © {new Date().getFullYear()} Lead Tracker. Tous droits réservés.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
