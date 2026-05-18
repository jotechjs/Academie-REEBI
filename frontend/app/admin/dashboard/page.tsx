'use client';

import { Users, MessageSquare, BookOpen, Clock, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect, useRef } from 'react';
import { getExperiencesStats } from '@/services/api';

interface Activity {
  id: string;
  learnerName: string;
  learnerInitials: string;
  createdAt: string;
}

interface StatsData {
  totalLearners: number;
  totalReceived: number;
  pending: number;
  recentActivities: Activity[];
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
  if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
  if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  return `Le ${date.toLocaleDateString('fr-FR')}`;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<StatsData | null>(null);

  // CORRECTION BUG 2 : loading démarre à false.
  // Il passe à true uniquement quand fetchStats() commence réellement.
  // Ainsi si user reste null (redirect), le spinner ne bloque jamais.
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchedRef = useRef(false);

  const fetchStats = async (isRefresh = false) => {
    setFetchError(false);
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    // Timeout de sécurité : si pas de réponse en 15s → afficher erreur + retry
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setLoading(false);
      setRefreshing(false);
      setFetchError(true);
    }, 15000);

    try {
      const response = await getExperiencesStats();
      setStats(response.data);
      setFetchError(false);
    } catch (error) {
      console.error('Failed to fetch stats', error);
      setFetchError(true);
    } finally {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch une seule fois au mount (quand user est prêt)
  useEffect(() => {
    if (user && user.role === 'ADMIN' && !fetchedRef.current) {
      fetchedRef.current = true;
      fetchStats();
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [user]);

  const handleRefresh = () => {
    fetchStats(true);
  };

  // Auth en cours → spinner léger
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  // Non autorisé
  if (!user || user.role !== 'ADMIN') return null;

  // Données en cours de chargement (première fois)
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-slate-500 text-sm font-medium">Chargement du tableau de bord...</p>
      </div>
    );
  }

  // Erreur de chargement → fallback avec retry
  if (fetchError && !stats) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center">
        <div className="p-4 bg-red-50 rounded-full">
          <AlertCircle className="text-red-500" size={32} />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Impossible de charger les données</h3>
        <p className="text-slate-500 text-sm max-w-xs">
          Le serveur met du temps à répondre. Cliquez sur Réessayer.
        </p>
        <button
          onClick={() => { fetchedRef.current = false; fetchStats(); }}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
        >
          <RefreshCw size={16} />
          Réessayer
        </button>
      </div>
    );
  }

  const statsData = [
    { name: 'Total Académiciens', value: stats?.totalLearners ?? 24, icon: Users, color: 'bg-blue-500' },
    { name: 'Sessions Actives', value: 3, icon: BookOpen, color: 'bg-purple-500' },
    { name: 'Témoignages Reçus', value: stats?.totalReceived ?? 0, icon: MessageSquare, color: 'bg-green-500' },
    { name: 'En attente', value: stats?.pending ?? 0, icon: Clock, color: 'bg-orange-500' },
  ];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Tableau de bord</h1>
          <p className="text-slate-500 mt-1">Aperçu de l'activité de la plateforme REEBI</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium text-slate-600 disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Actualisation...' : 'Actualiser'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {statsData.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
            <div className={`${stat.color} p-3 rounded-xl text-white`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{stat.name}</p>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[300px]">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Activité Récente</h2>
          <div className="space-y-4">
            {stats?.recentActivities && stats.recentActivities.length > 0 ? (
              stats.recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold uppercase">
                      {activity.learnerInitials}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{activity.learnerName}</p>
                      <p className="text-xs text-slate-500">{formatRelativeTime(activity.createdAt)}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-50 text-green-600">Nouveau</span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400">
                <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
                <p>Aucune activité récente</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[300px]">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Actions Rapides</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => router.push('/admin/learners')}
              className="p-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-center transition-colors"
            >
              <Users className="mx-auto mb-2 text-blue-500" />
              <span className="text-sm font-medium">Ajouter un élève</span>
            </button>
            <button
              onClick={() => router.push('/admin/sessions')}
              className="p-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-center transition-colors"
            >
              <BookOpen className="mx-auto mb-2 text-purple-500" />
              <span className="text-sm font-medium">Nouvelle Session</span>
            </button>
            <button
              onClick={() => router.push('/admin/experiences')}
              className="p-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-center transition-colors"
            >
              <MessageSquare className="mx-auto mb-2 text-green-500" />
              <span className="text-sm font-medium">Voir Expériences</span>
            </button>
            <button className="p-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-center transition-colors">
              <Clock className="mx-auto mb-2 text-orange-500" />
              <span className="text-sm font-medium">Voir Demandes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
