'use client';

import { Users, MessageSquare, BookOpen, Clock, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') return null;

  const stats = [
    { name: 'Total Apprenants', value: '128', icon: Users, color: 'bg-blue-500' },
    { name: 'Sessions Actives', value: '12', icon: BookOpen, color: 'bg-purple-500' },
    { name: 'Témoignages Reçus', value: '24', icon: MessageSquare, color: 'bg-green-500' },
    { name: 'En attente', value: '8', icon: Clock, color: 'bg-orange-500' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Tableau de bord</h1>
        <p className="text-slate-500 mt-1">Aperçu de l'activité de la plateforme REEBI</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat) => (
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
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold uppercase">
                    {String.fromCharCode(64 + i)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Nouveau Témoignage Reçu</p>
                    <p className="text-xs text-slate-500">Il y a {i} heure(s)</p>
                  </div>
                </div>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-50 text-green-600">Nouveau</span>
              </div>
            ))}
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
