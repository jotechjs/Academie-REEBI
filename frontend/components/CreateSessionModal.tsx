'use client';

import { useState } from 'react';
import { X, Loader2, BookOpen, FileText, AlignLeft } from 'lucide-react';
import { createSession } from '@/services/api';

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateSessionModal({ isOpen, onClose, onSuccess }: CreateSessionModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await createSession(formData);
      onSuccess();
      onClose();
      setFormData({ name: '', description: '' });
    } catch (err: any) {
      console.error('Error creating session:', err);
      setError(err.response?.data?.message || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-100 sticky top-0 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <BookOpen size={18} />
            </div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900">Créer une Session</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0 p-2 hover:bg-slate-100 rounded-lg min-h-touch min-w-touch">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-3 md:space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs md:text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nom de la Session</label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 md:py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm min-h-touch"
                placeholder="Ex: Développement Web 2024"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
            <div className="relative">
              <AlignLeft className="absolute left-3 top-3 text-slate-400" size={16} />
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 md:py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm resize-none"
                placeholder="Fournissez un bref aperçu de cette session de formation..."
              />
            </div>
          </div>

          <div className="pt-2 md:pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 md:py-3 border border-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-50 transition-colors text-sm min-h-touch"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 md:py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200 flex items-center justify-center gap-2 disabled:opacity-50 text-sm min-h-touch"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : 'Créer la Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
