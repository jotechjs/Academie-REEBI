'use client';

import { useState } from 'react';
import { X, Upload, Loader2, FileSpreadsheet } from 'lucide-react';
import { importExcelToSession } from '@/services/api';

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sessionId: string;
}

export default function ImportExcelModal({ isOpen, onClose, onSuccess, sessionId }: ImportExcelModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Veuillez sélectionner un fichier Excel.');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      await importExcelToSession(sessionId, formData);
      onSuccess();
      onClose();
      setFile(null);
    } catch (err: any) {
      console.error('Error importing Excel:', err);
      setError(err.response?.data?.message || 'Erreur lors de l\'importation du fichier.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-100 sticky top-0 bg-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg flex-shrink-0">
              <FileSpreadsheet size={18} />
            </div>
            <h2 className="text-lg md:text-lg font-bold text-slate-900">Importer page Excel</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-md hover:bg-slate-100 flex-shrink-0 min-h-touch min-w-touch"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-xs md:text-sm border border-red-100">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-xs md:text-sm font-medium text-slate-700 mb-3">
              Fichier Excel (.xlsx, .xls)
            </label>
            <div className="flex items-center justify-center w-full">
              <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full min-h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors p-4">
                <div className="flex flex-col items-center justify-center py-4">
                  <Upload className="w-7 md:w-8 h-7 md:h-8 mb-2 text-slate-400" />
                  <p className="mb-1 text-xs md:text-sm text-slate-500">
                    <span className="font-semibold">Cliquez pour téléverser</span> ou glissez-déposez
                  </p>
                  <p className="text-xs text-slate-400">XLSX ou XLS</p>
                </div>
                <input id="dropzone-file" type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileChange} />
              </label>
            </div>
            {file && (
              <p className="mt-2 text-xs md:text-sm text-green-600 font-medium truncate">
                ✓ {file.name}
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse md:flex-row justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 md:py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors disabled:opacity-50 text-sm min-h-touch"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !file}
              className="px-4 md:px-6 py-2.5 md:py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm min-h-touch"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              Importer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
