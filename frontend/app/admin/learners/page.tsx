'use client';

import { useState, useEffect } from 'react';
import { getLearners, deleteLearner } from '@/services/api';
import { UserPlus, Search, MoreHorizontal, Trash2, Loader2 } from 'lucide-react';
import CreateLearnerModal from '@/components/CreateLearnerModal';
import EditableCell from '@/components/EditableCell';
import { useAuth } from '@/hooks/useAuth';

export default function LearnersPage() {
  const { user, loading: authLoading } = useAuth();
  const [learners, setLearners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchLearners = async () => {
    try {
      setLoading(true);
      const { data } = await getLearners();
      setLearners(data);
    } catch (error) {
      console.error('Failed to fetch learners', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      fetchLearners();
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') return null;

  const filteredLearners = learners.filter(learner => 
    learner.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    learner.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    learner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (learner.identifiant && learner.identifiant.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = async (id: string, name: string) => {
    const confirmed = window.confirm(`Voulez-vous vraiment supprimer "${name}" ? Cette action est irréversible.`);
    if (!confirmed) return;
    
    setDeleting(id);
    try {
      await deleteLearner(id);
      setLearners(prev => prev.filter(l => l.id !== id));
    } catch (error) {
      console.error('Failed to delete learner:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Apprenants</h1>
          <p className="text-slate-500 mt-1">Gérez et suivez votre base d&apos;étudiants</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-200 hover:-translate-y-0.5 active:scale-95"
        >
          <UserPlus size={20} />
          <span className="font-bold">Ajouter un Apprenant</span>
        </button>
      </div>

      <CreateLearnerModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchLearners} 
      />

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-slate-50 flex flex-col md:flex-row items-center gap-4 bg-slate-50/30">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Rechercher par nom, email ou identifiant..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm shadow-sm"
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-widest font-bold">
              <tr>
                <th className="px-8 py-5 border-b border-slate-100">Apprenant</th>
                <th className="px-8 py-5 border-b border-slate-100">Identifiant</th>
                <th className="px-8 py-5 border-b border-slate-100">Email</th>
                <th className="px-8 py-5 border-b border-slate-100">Statut</th>
                <th className="px-8 py-5 border-b border-slate-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-500">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <span className="font-medium">Chargement des données...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLearners.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-500">
                    <div className="flex flex-col items-center opacity-40">
                      <Search size={48} className="mb-4" />
                      <p className="text-lg">
                        {searchTerm ? 'Aucun résultat trouvé.' : 'Aucun apprenant enregistré.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLearners.map((learner) => (
                  <tr key={learner.id} className="group hover:bg-blue-50/30 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-100 uppercase">
                          {learner.firstName[0]}{learner.lastName[0]}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">{learner.firstName} {learner.lastName}</div>
                          <div className="text-xs text-slate-500">{learner.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm font-medium text-slate-600">
                      {learner.identifiant || '---'}
                    </td>
                    <td className="px-8 py-5 text-sm text-slate-500">
                      {learner.email}
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        learner.status === 'ADMITTED' ? 'bg-green-50 text-green-600 border border-green-100' :
                        learner.status === 'PENDING' ? 'bg-yellow-50 text-yellow-600 border border-yellow-100' :
                        'bg-red-50 text-red-600 border border-red-100'
                      }`}>
                        {learner.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleDelete(learner.id, `${learner.firstName} ${learner.lastName}`)}
                          disabled={deleting === learner.id}
                          className="p-2.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all disabled:opacity-50 min-h-touch min-w-touch"
                          title="Supprimer l'apprenant"
                        >
                          {deleting === learner.id ? (
                            <Loader2 size={20} className="animate-spin" />
                          ) : (
                            <Trash2 size={20} />
                          )}
                        </button>
                        <button className="p-2.5 text-slate-400 hover:bg-slate-100 rounded-xl transition-all min-h-touch min-w-touch">
                          <MoreHorizontal size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden p-4">
          {loading ? (
            <div className="flex flex-col items-center py-12">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <span className="font-medium text-slate-500">Chargement des données...</span>
            </div>
          ) : filteredLearners.length === 0 ? (
            <div className="flex flex-col items-center py-12 opacity-40">
              <Search size={48} className="mb-4 text-slate-300" />
              <p className="text-slate-500 font-medium">
                {searchTerm ? 'Aucun résultat trouvé.' : 'Aucun apprenant enregistré.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLearners.map((learner) => (
                <div key={learner.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
                  <div className="flex flex-col gap-4">
                    {/* Name Section */}
                    <div className="pb-4 border-b border-slate-100">
                      <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Nom Complet</p>
                      <div className="text-sm font-bold text-slate-900">{learner.firstName} {learner.lastName}</div>
                    </div>

                    {/* Identifiant */}
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-2">Identifiant</p>
                      <div className="text-sm font-medium text-slate-600">{learner.identifiant || '---'}</div>
                    </div>

                    {/* Email */}
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-2">Email</p>
                      <div className="text-sm text-slate-500">{learner.email}</div>
                    </div>

                    {/* Status */}
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-2">Statut</p>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        learner.status === 'ADMITTED' ? 'bg-green-50 text-green-600 border border-green-100' :
                        learner.status === 'PENDING' ? 'bg-yellow-50 text-yellow-600 border border-yellow-100' :
                        'bg-red-50 text-red-600 border border-red-100'
                      }`}>
                        {learner.status}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t border-slate-100">
                      <button 
                        onClick={() => handleDelete(learner.id, `${learner.firstName} ${learner.lastName}`)}
                        disabled={deleting === learner.id}
                        className="flex-1 flex items-center justify-center gap-2 p-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-all disabled:opacity-50 min-h-touch font-medium text-sm"
                        title="Supprimer l'apprenant"
                      >
                        {deleting === learner.id ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <>
                            <Trash2 size={18} />
                            <span>Supprimer</span>
                          </>
                        )}
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-2 p-3 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl transition-all min-h-touch font-medium text-sm">
                        <MoreHorizontal size={18} />
                        <span>Voir plus</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
