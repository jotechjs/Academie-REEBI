'use client';

import { useEffect, useState, useCallback, FC } from 'react';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import api from '@/services/api';
import { 
  User, 
  LogOut, 
  Shield, 
  CheckCircle, 
  Clock, 
  XCircle,
  Award,
  Loader2,
  MessageSquare,
  LucideIcon
} from 'lucide-react';

interface FullUserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: 'ADMITTED' | 'PENDING' | 'REJECTED';
  moyenneCours?: number;
  moyenne_ecrit?: number;
  eval_oral?: number;
  moyenneGenerale?: number;
  decisionJury?: 'ADMIS' | 'NON_ADMIS';
}

interface StatusConfig {
  icon: LucideIcon;
  color: string;
  bg: string;
  label: string;
}

interface DecisionConfig {
  color: string;
  bg: string;
  label: string;
}

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const [fullUserData, setFullUserData] = useState<FullUserData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  const statusConfig: Record<string, StatusConfig> = {
    ADMITTED: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Admis' },
    PENDING: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'En attente' },
    REJECTED: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Refusé' },
  };

  const decisionConfig: Record<string, DecisionConfig> = {
    ADMIS: { color: 'text-green-600', bg: 'bg-green-50', label: 'Admis' },
    NON_ADMIS: { color: 'text-red-600', bg: 'bg-red-50', label: 'Non Admis' },
  };

  const fetchUserData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await api.get(`/learners/${user.id}`);
      setFullUserData(response.data);
    } catch (err) {
      console.error('Erreur lors de la récupération des données', err);
    } finally {
      setDataLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchUserData();
    }
  }, [user, fetchUserData]);

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const currentStatus = fullUserData?.status || 'PENDING';
  const statusInfo = statusConfig[currentStatus];
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 md:gap-3">
            <Image 
              src="/logo-REEBI.png" 
              alt="REEBI Logo" 
              width={120}
              height={120}
              className="h-14 md:h-22 w-auto object-contain" 
              priority
            />
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors font-medium text-sm min-h-touch min-w-touch p-2 md:p-0"
          >
            <LogOut size={18} />
            <span className="hidden md:inline">Déconnexion</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-blue-600 h-24"></div>
              <div className="px-6 pb-6">
                <div className="relative flex justify-center -mt-12 mb-4">
                  <div className="w-24 h-24 bg-white rounded-full p-1 shadow-lg">
                    <div className="w-full h-full bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                      <User size={40} />
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-bold text-gray-900">{fullUserData?.firstName} {fullUserData?.lastName}</h2>
                  <p className="text-gray-500 text-sm">{fullUserData?.email}</p>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Shield size={18} />
                      <span className="text-sm font-medium">Rôle</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900 bg-white px-2 py-1 rounded border border-gray-200">
                      {fullUserData?.role}
                    </span>
                  </div>

                  <div className={`flex items-center justify-between p-3 rounded-xl ${statusInfo.bg}`}>
                    <div className="flex items-center gap-2 text-gray-600">
                      <StatusIcon className={statusInfo.color} size={18} />
                      <span className="text-sm font-medium">Statut</span>
                    </div>
                    <span className={`text-sm font-bold ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Résultats Globaux</h3>
                  <p className="text-gray-500 text-sm mt-1">Vos performances académiques</p>
                </div>
                <Award className="text-purple-600" size={28} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Moyenne Cours</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {fullUserData?.moyenneCours ?? '--'}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Moyenne Écrit</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {fullUserData?.moyenne_ecrit ?? '--'}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Éval. Orale</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {fullUserData?.eval_oral ?? '--'}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Moyenne Gén.</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">
                    {fullUserData?.moyenneGenerale ?? '--'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className={`p-4 rounded-xl ${fullUserData?.decisionJury ? decisionConfig[fullUserData.decisionJury].bg : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Décision Jury</span>
                    <span className={`text-sm font-bold ${fullUserData?.decisionJury ? decisionConfig[fullUserData.decisionJury].color : 'text-gray-500'}`}>
                      {fullUserData?.decisionJury === 'ADMIS' ? 'Admis' : fullUserData?.decisionJury === 'NON_ADMIS' ? 'Non Admis' : 'En attente'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Expérience Académique</h3>
                  <p className="text-gray-500 text-sm mt-1">Partagez votre parcours avec nous</p>
                </div>
                <MessageSquare className="text-blue-600" size={32} />
              </div>

              <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900">Votre témoignage est précieux</p>
                  <p className="text-sm text-gray-600 mt-1">Prenez un moment pour remplir le formulaire d'expérience.</p>
                </div>
                <button 
                  onClick={() => window.location.href = '/learner/dashboard'}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                >
                  Accéder au formulaire
                </button>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                <p className="text-xs font-bold text-blue-600 uppercase mb-1">Aide</p>
                <p className="text-sm text-gray-600">Besoin d'aide ? Contactez l'administration.</p>
              </div>
              <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                <p className="text-xs font-bold text-blue-600 uppercase mb-1">Feedback</p>
                <p className="text-sm text-gray-600">Nous apprécions vos suggestions d'amélioration.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
