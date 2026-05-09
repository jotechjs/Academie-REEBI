'use client';

import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Calendar,
  Search,
  Quote,
  FileText,
  Trash2,
  Loader2
} from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

export default function ExperiencesPage() {
  const { user, loading: authLoading } = useAuth();
  const [experiences, setExperiences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchExperiences = async () => {
    try {
      setLoading(true);
      const response = await api.get('/experiences');
      setExperiences(response.data);
    } catch (error) {
      console.error('Failed to fetch experiences', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      fetchExperiences();
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

  const handleDelete = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce témoignage ?')) {
      return;
    }

    try {
      await api.delete(`/experiences/${id}`);
      setExperiences(experiences.filter(exp => exp.id !== id));
    } catch (error) {
      console.error('Failed to delete experience', error);
      alert('Erreur lors de la suppression du témoignage');
    }
  };

  const filteredExperiences = experiences.filter(exp =>
    `${exp.learner.firstName} ${exp.learner.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.learner.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const downloadExperiencesPDF = async (experiencesToExport: any[]) => {
    if (!experiencesToExport || experiencesToExport.length === 0) {
      alert('Aucune expérience à exporter');
      return;
    }

    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Rapport des Expériences & Témoignages', 14, 22);
    doc.setFontSize(10);
    doc.text(`Généré le: ${new Date().toLocaleString()}`, 14, 30);

    let startY = 40;
    experiencesToExport.forEach((exp, index) => {
      if (startY > 250) {
        doc.addPage();
        startY = 40;
      }

      doc.setFontSize(12);
      doc.text(`${index + 1}. ${exp.learner.firstName} ${exp.learner.lastName}`, 14, startY);
      doc.setFontSize(10);
      doc.text(`Email: ${exp.learner.email}`, 14, startY + 8);
      doc.text(`Date: ${new Date(exp.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`, 14, startY + 16);

      startY += 28;

      doc.setFontSize(10);
      doc.text('1. Témoignage & Pratique:', 14, startY);
      doc.text(`"${exp.answer1}"`, 20, startY + 6, { maxWidth: 170 });

      startY += 12;

      doc.text('2. Connexion Encadreur:', 14, startY);
      doc.text(`"${exp.answer2}"`, 20, startY + 6, { maxWidth: 170 });

      startY += 12;

      doc.text('3. Suggestions REEBI Family:', 14, startY);
      doc.text(`"${exp.answer3}"`, 20, startY + 6, { maxWidth: 170 });

      startY += 20;

      if (index < experiencesToExport.length - 1) {
        doc.setDrawColor(200);
        doc.line(14, startY, 190, startY);
        startY += 10;
      }
    });

    doc.save(`experiences-${new Date().toISOString().slice(0,10)}.pdf`);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 border border-blue-100">
            <MessageSquare size={12} />
            Feedback Apprenants
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2">Expériences & Témoignages</h1>
          <p className="text-slate-500 font-medium text-base md:text-lg">Consultez les retours des académiciens sur leur parcours.</p>
        </div>
        
        <div className="relative w-full md:w-[450px] group">
          <div className="flex flex-col sm:flex-row w-full gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
              <input
                type="text"
                placeholder="Rechercher un apprenant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm font-medium text-sm"
              />
            </div>
            <button
              onClick={() => downloadExperiencesPDF(filteredExperiences)}
              className="px-4 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 text-sm font-bold shadow-lg shadow-blue-200 min-h-touch active:scale-95"
              disabled={loading || filteredExperiences.length === 0}
            >
              <FileText size={18} />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-blue-600" size={48} />
          <p className="text-slate-500 font-bold">Chargement des expériences...</p>
        </div>
      ) : filteredExperiences.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 border-dashed p-10 md:p-20 text-center">
          <div className="w-16 md:w-20 h-16 md:h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-6">
            <MessageSquare size={32} className="md:w-10 md:h-10" />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">Aucune expérience trouvée</h3>
          <p className="text-slate-500 font-medium">Les témoignages s'afficheront ici dès qu'ils seront soumis.</p>
        </div>
      ) : (
        <div className="space-y-6 md:space-y-8">
          {filteredExperiences.map((exp) => (
            <div key={exp.id} className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-100 hover:border-blue-200 transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                <Quote size={120} />
              </div>

              <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start relative z-10">
                <div className="flex-none">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl md:rounded-3xl flex items-center justify-center text-white text-xl md:text-2xl font-black shadow-lg shadow-blue-200 uppercase">
                    {exp.learner.firstName[0]}{exp.learner.lastName[0]}
                  </div>
                </div>

                <div className="flex-1 w-full">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6 md:mb-8">
                    <div>
                      <h3 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">
                        {exp.learner.firstName} {exp.learner.lastName}
                      </h3>
                      <p className="text-blue-600 font-bold text-xs md:text-sm">{exp.learner.email}</p>
                    </div>
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="flex items-center gap-2 md:gap-3 bg-slate-50 px-3 md:px-4 py-1.5 md:py-2 rounded-xl border border-slate-100">
                        <Calendar size={14} className="text-slate-400" />
                        <span className="text-[10px] md:text-xs font-bold text-slate-500">
                          {new Date(exp.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="p-2 md:p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100 shadow-sm min-h-touch"
                        title="Supprimer ce témoignage"
                      >
                        <Trash2 size={18} className="md:w-5 md:h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:gap-8">
                    <div className="space-y-2 md:space-y-3">
                      <h4 className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">1. Témoignage & Pratique</h4>
                      <div className="bg-slate-50/50 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 group-hover:bg-white transition-colors">
                        <p className="text-slate-700 font-medium leading-relaxed italic text-sm md:text-base">"{exp.answer1}"</p>
                      </div>
                    </div>

                    <div className="space-y-2 md:space-y-3">
                      <h4 className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">2. Connexion Encadreur</h4>
                      <div className="bg-slate-50/50 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 group-hover:bg-white transition-colors">
                        <p className="text-slate-700 font-medium leading-relaxed italic text-sm md:text-base">"{exp.answer2}"</p>
                      </div>
                    </div>

                    <div className="space-y-2 md:space-y-3">
                      <h4 className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">3. Suggestions REEBI Family</h4>
                      <div className="bg-slate-50/50 p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 group-hover:bg-white transition-colors">
                        <p className="text-slate-700 font-medium leading-relaxed italic text-sm md:text-base">"{exp.answer3}"</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
