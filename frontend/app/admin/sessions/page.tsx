'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSessions } from '@/services/api';
import { Plus, Download, FileSpreadsheet, ChevronDown, Loader2 } from 'lucide-react';
import CreateSessionModal from '@/components/CreateSessionModal';
import ImportExcelModal from '@/components/ImportExcelModal';
import ExcelDataGrid from '@/components/ExcelDataGrid';
import { useAuth } from '@/hooks/useAuth';

export default function SessionsPage() {
  const { user, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getSessions();
      setSessions(data);

      // Auto-select first session if none selected and data exists
      if (data.length > 0 && !activeSessionId) {
        const firstSession = data[0];
        setActiveSessionId(firstSession.id);
        if (firstSession.sheets && firstSession.sheets.length > 0) {
          setActiveSheetId(firstSession.sheets[0].id);
        }
      } else if (data.length > 0 && activeSessionId) {
        // Refresh active session and sheet
        const currentSession = data.find((s: any) => s.id === activeSessionId);
        if (currentSession && currentSession.sheets && currentSession.sheets.length > 0) {
          // Keep active sheet if it still exists, else pick first
          const sheetExists = currentSession.sheets.find((s: any) => s.id === activeSheetId);
          if (!sheetExists) {
            setActiveSheetId(currentSession.sheets[0].id);
          }
        } else {
          setActiveSheetId(null);
        }
      }
    } catch (error) {
      console.error('Failed to fetch sessions', error);
    } finally {
      setLoading(false);
    }
  }, [activeSessionId, activeSheetId]);

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      fetchSessions();
    }
  }, [fetchSessions, user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') return null;

  const handleSessionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sessionId = e.target.value;
    setActiveSessionId(sessionId);
    const session = sessions.find(s => s.id === sessionId);
    if (session && session.sheets && session.sheets.length > 0) {
      setActiveSheetId(session.sheets[0].id);
    } else {
      setActiveSheetId(null);
    }
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Sessions</h1>
          <p className="text-sm md:text-base text-slate-500 mt-1">Gérez les promotions et listes de présences (Type Excel)</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-3 md:px-4 py-2 rounded-lg transition-colors shadow-sm text-sm md:text-base min-h-touch min-w-touch"
        >
          <Plus size={18} />
          <span className="font-medium hidden sm:inline">Créer une Session</span>
          <span className="font-medium sm:hidden">Créer</span>
        </button>
      </div>

      <CreateSessionModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={fetchSessions} 
      />

      {activeSessionId && (
        <ImportExcelModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={fetchSessions}
          sessionId={activeSessionId}
        />
      )}

      {loading && sessions.length === 0 ? (
        <div className="flex space-x-4 animate-pulse">
          <div className="h-10 w-64 bg-slate-200 rounded"></div>
        </div>
      ) : sessions.length === 0 ? (
        <div className="py-12 text-center text-slate-500 bg-white rounded-2xl border border-dashed border-slate-300">
          Aucune session (promotion) disponible. Créez votre première session pour commencer.
        </div>
      ) : (
        <>
          {/* Header Controls */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 md:gap-4 bg-white p-3 md:p-4 rounded-xl shadow-sm border border-slate-100 mb-4 md:mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full lg:w-auto">
              <span className="text-sm text-slate-500 font-medium whitespace-nowrap">Sélectionner :</span>
              <div className="relative w-full sm:w-56 md:w-64">
                <select 
                  value={activeSessionId || ''} 
                  onChange={handleSessionChange}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-900 font-semibold py-2 px-3 md:px-4 pr-8 md:pr-10 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 transition-colors text-sm"
                >
                  {sessions.map(session => (
                    <option key={session.id} value={session.id}>{session.name}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3 w-full lg:w-auto">
              <button 
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center justify-center space-x-1.5 md:space-x-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-3 md:px-4 py-2 rounded-lg transition-colors font-medium text-xs md:text-sm flex-1 lg:flex-none min-h-touch min-w-touch"
              >
                <FileSpreadsheet size={16} />
                <span className="hidden xs:inline">Importer Excel</span>
                <span className="xs:hidden">Importer</span>
              </button>
            </div>
          </div>

          {/* Sheets / Tabs */}
          {activeSession && (
            <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col min-h-[400px] md:min-h-[500px] lg:h-[calc(100vh-250px)]">
              {/* Tab Navigation */}
              <div className="flex border-b border-slate-200 overflow-x-auto hide-scrollbar bg-slate-50 px-2 pt-2 gap-1 md:gap-0">
                {activeSession.sheets && activeSession.sheets.length > 0 ? (
                  activeSession.sheets.map((sheet: any) => (
                    <button
                      key={sheet.id}
                      onClick={() => setActiveSheetId(sheet.id)}
                      className={`px-3 md:px-6 py-2 md:py-3 font-medium text-xs md:text-sm rounded-t-lg border-b-2 transition-all whitespace-nowrap ${
                        activeSheetId === sheet.id
                          ? 'border-purple-600 text-purple-700 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.02)]'
                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {sheet.name}
                    </button>
                  ))
                ) : (
                  <div className="px-3 md:px-6 py-2 md:py-3 text-xs md:text-sm text-slate-500 italic">
                    Aucune section (feuille) n'a été importée.
                  </div>
                )}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-hidden p-3 md:p-6 bg-slate-50/50">
                {activeSheetId ? (
                  <ExcelDataGrid sheetId={activeSheetId} />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 md:p-8 border-2 border-dashed border-slate-200 rounded-xl bg-white">
                    <div className="p-3 md:p-4 bg-slate-50 rounded-full mb-3 md:mb-4">
                      <FileSpreadsheet size={24} className="text-slate-400 md:w-8 md:h-8" />
                    </div>
                    <h3 className="text-base md:text-lg font-bold text-slate-900 mb-2">Aucune donnée à afficher</h3>
                    <p className="text-sm text-slate-500 max-w-xs md:max-w-md">
                      Cette session ne contient encore aucune feuille Excel. Cliquez sur "Importer page Excel" en haut à droite pour télécharger un fichier XLSX et générer les sections.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
