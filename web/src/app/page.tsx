import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRightIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Accueil',
  description: 'Système de gestion de leads multi-tenant avec tableaux Kanban, gestion des tâches et analyses.',
};

const features = [
  {
    name: 'Gestion Multi-tenant',
    description: 'Isolation complète des données par organisation avec sécurité renforcée.',
    icon: '🏢',
  },
  {
    name: 'Tableaux Kanban',
    description: 'Visualisez et gérez vos leads avec des tableaux Kanban intuitifs.',
    icon: '📋',
  },
  {
    name: 'Gestion des Tâches',
    description: 'Créez, assignez et suivez les tâches avec des rappels automatiques.',
    icon: '✅',
  },
  {
    name: 'Rapports & Analytics',
    description: 'Analysez vos performances avec des rapports détaillés et des graphiques.',
    icon: '📊',
  },
  {
    name: 'Import/Export CSV',
    description: 'Importez et exportez vos données facilement avec validation avancée.',
    icon: '📁',
  },
  {
    name: 'Recherche Avancée',
    description: 'Trouvez rapidement vos leads avec des filtres puissants et la recherche texte.',
    icon: '🔍',
  },
];

const benefits = [
  'Interface moderne et intuitive',
  'Sécurité de niveau entreprise',
  'Notifications en temps réel',
  'API REST complète',
  'Support multi-langue',
  'Déploiement Docker',
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-brand-50">
      {/* Header */}
      <header className="relative overflow-hidden bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Lead Tracker</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/features" className="text-gray-600 hover:text-gray-900 transition-colors">
                Fonctionnalités
              </Link>
              <Link href="/pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
                Tarifs
              </Link>
              <Link href="/docs" className="text-gray-600 hover:text-gray-900 transition-colors">
                Documentation
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Se connecter
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">
                  Commencer
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Gérez vos leads avec
              <span className="text-brand-600"> simplicité</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
              Lead Tracker est une solution complète de gestion de leads multi-tenant 
              avec tableaux Kanban, gestion des tâches, rapports avancés et bien plus encore.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/register">
                <Button size="lg" className="px-8">
                  Démarrer gratuitement
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button variant="outline" size="lg" className="px-8">
                  Voir la démo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Fonctionnalités Principales
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              Tout ce dont vous avez besoin pour gérer efficacement vos leads et votre équipe commerciale.
            </p>
          </div>
          
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.name}
                className="group relative rounded-2xl bg-gray-50 p-8 hover:bg-white hover:shadow-lg transition-all duration-200"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.name}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Pourquoi choisir Lead Tracker ?
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Une solution moderne construite avec les dernières technologies 
                pour répondre aux besoins des équipes commerciales d'aujourd'hui.
              </p>
              
              <ul className="mt-8 space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center">
                    <CheckIcon className="h-5 w-5 text-brand-600 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-8">
                <Link href="/features">
                  <Button variant="outline" size="lg">
                    Voir toutes les fonctionnalités
                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 p-8">
                <div className="h-full w-full rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-white text-center">
                    <div className="text-6xl mb-4">📈</div>
                    <h3 className="text-xl font-semibold mb-2">
                      Augmentez vos conversions
                    </h3>
                    <p className="text-brand-100">
                      Jusqu'à 40% d'amélioration des taux de conversion
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-brand-600">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Prêt à transformer votre gestion de leads ?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-brand-100">
            Rejoignez des centaines d'équipes qui font déjà confiance à Lead Tracker 
            pour gérer leurs prospects et augmenter leurs ventes.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="px-8">
                Commencer maintenant
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact" className="text-white hover:text-brand-100 transition-colors">
              Nous contacter →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">L</span>
                </div>
                <span className="text-xl font-bold text-white">Lead Tracker</span>
              </div>
              <p className="text-gray-400 max-w-md">
                Solution complète de gestion de leads multi-tenant pour les équipes commerciales modernes.
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Produit</h3>
              <ul className="space-y-2">
                <li><Link href="/features" className="text-gray-400 hover:text-white transition-colors">Fonctionnalités</Link></li>
                <li><Link href="/pricing" className="text-gray-400 hover:text-white transition-colors">Tarifs</Link></li>
                <li><Link href="/security" className="text-gray-400 hover:text-white transition-colors">Sécurité</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link href="/docs" className="text-gray-400 hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="/help" className="text-gray-400 hover:text-white transition-colors">Centre d'aide</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 Lead Tracker. Tous droits réservés.
            </p>
            <div className="flex space-x-6 mt-4 sm:mt-0">
              <Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">
                Confidentialité
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">
                Conditions
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
