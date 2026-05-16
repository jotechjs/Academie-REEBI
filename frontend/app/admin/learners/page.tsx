'use client';

import { useState, useEffect, useCallback } from 'react';
import { getLearners, deleteLearner } from '@/services/api';
import { UserPlus, Search, Trash2, Loader2, Edit } from 'lucide-react';
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

  const fetchLearners = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getLearners();
      setLearners(data);
    } catch (error) {
      console.error('Failed to fetch learners', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      fetchLearners();
    }
  }, [fetchLearners, user]);

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

  const handleFieldUpdate = (learnerId: string, field: string, newValue: string) => {
    setLearners(prev => prev.map(l => 
      l.id === learnerId ? { ...l, [field]: newValue } : l
    ));
  };

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Académiciens</h1>
          <p className="text-slate-500 mt-1">Gérez et suivez votre base d&apos;étudiants</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-200 hover:-translate-y-0.5 active:scale-95"
        >
          <UserPlus size={20} />
          <span className="font-bold">Ajouter un Académicien</span>
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
                <th className="px-8 py-5 border-b border-slate-100">Academicien</th>
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
                        {searchTerm ? 'Aucun résultat trouvé.' : 'Aucun académicien enregistré.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLearners.map((learner) => (
                  <tr key={learner.id} className="group hover:bg-blue-50/30 transition-colors">
                    {/* Nom et Prénom */}
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-100 uppercase">
                          {learner.firstName?.[0]}{learner.lastName?.[0]}
                        </div>
                        <div className="space-y-1">
                          <EditableCell
                            learnerId={learner.id}
                            field="firstName"
                            value={learner.firstName}
                            onUpdate={(field, val) => handleFieldUpdate(learner.id, field, val)}
                          />
                          <EditableCell
                            learnerId={learner.id}
                            field="lastName"
                            value={learner.lastName}
                            onUpdate={(field, val) => handleFieldUpdate(learner.id, field, val)}
                          />
                        </div>
                      </div>
                    </td>
                    
                    {/* Identifiant */}
                    <td className="px-8 py-5">
                      <EditableCell
                        learnerId={learner.id}
                        field="identifiant"
                        value={learner.identifiant || ''}
                        onUpdate={(field, val) => handleFieldUpdate(learner.id, field, val)}
                      />
                    </td>
                    
                    {/* Email */}
                    <td className="px-8 py-5">
                      <EditableCell
                        learnerId={learner.id}
                        field="email"
                        value={learner.email}
                        onUpdate={(field, val) => handleFieldUpdate(learner.id, field, val)}
                      />
                    </td>
                    
                    {/* Statut */}
                    <td className="px-8 py-5">
                      <EditableCell
                        learnerId={learner.id}
                        field="status"
                        value={learner.status}
                        type="select"
                        onUpdate={(field, val) => handleFieldUpdate(learner.id, field, val)}
                      />
                    </td>
                    
                    {/* Actions */}
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => handleDelete(learner.id, `${learner.firstName} ${learner.lastName}`)}
                        disabled={deleting === learner.id}
                        className="p-2.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all disabled:opacity-50 min-h-touch min-w-touch"
                        title="Supprimer l'académicien"
                      >
                        {deleting === learner.id ? (
                          <Loader2 size={20} className="animate-spin" />
                        ) : (
                          <Trash2 size={20} />
                        )}
                      </button>
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
                {searchTerm ? 'Aucun résultat trouvé.' : 'Aucun académicien enregistré.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLearners.map((learner) => (
                <div key={learner.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
                  <div className="flex flex-col gap-4">
                    {/* Nom Complet */}
                    <div className="pb-4 border-b border-slate-100">
                      <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Nom Complet</p>
                      <div className="flex flex-col gap-2">
                        <EditableCell
                          learnerId={learner.id}
                          field="firstName"
                          value={learner.firstName}
                          onUpdate={(field, val) => handleFieldUpdate(learner.id, field, val)}
                        />
                        <EditableCell
                          learnerId={learner.id}
                          field="lastName"
                          value={learner.lastName}
                          onUpdate={(field, val) => handleFieldUpdate(learner.id, field, val)}
                        />
                      </div>
                    </div>

                    {/* Identifiant */}
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-2">Identifiant</p>
                      <EditableCell
                        learnerId={learner.id}
                        field="identifiant"
                        value={learner.identifiant || ''}
                        onUpdate={(field, val) => handleFieldUpdate(learner.id, field, val)}
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-2">Email</p>
                      <EditableCell
                        learnerId={learner.id}
                        field="email"
                        value={learner.email}
                        onUpdate={(field, val) => handleFieldUpdate(learner.id, field, val)}
                      />
                    </div>

                    {/* Statut */}
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-2">Statut</p>
                      <EditableCell
                        learnerId={learner.id}
                        field="status"
                        value={learner.status}
                        type="select"
                        onUpdate={(field, val) => handleFieldUpdate(learner.id, field, val)}
                      />
                    </div>

                    {/* Supprimer */}
                    <div className="pt-4 border-t border-slate-100">
                      <button 
                        onClick={() => handleDelete(learner.id, `${learner.firstName} ${learner.lastName}`)}
                        disabled={deleting === learner.id}
                        className="w-full flex items-center justify-center gap-2 p-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-all disabled:opacity-50 min-h-touch font-medium text-sm"
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