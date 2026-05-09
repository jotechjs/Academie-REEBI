'use client';

import { useState, useEffect, useCallback, FC } from 'react';
import { getSheetData, updateSheetValue, createColumn, deleteColumn } from '@/services/api';
import { Loader2, Save, Plus, X, Trash2 } from 'lucide-react';

interface ExcelDataGridProps {
  sheetId: string;
}

interface Column {
  id: string;
  name: string;
  dataType: string;
}

interface Learner {
  id: string;
  firstName: string;
  lastName: string;
}

interface SheetValue {
  learnerId: string;
  sessionColumnId: string;
  value: string;
}

interface SheetData {
  columns: Column[];
  learners: Learner[];
  values: SheetValue[];
}

export default function ExcelDataGrid({ sheetId }: ExcelDataGridProps) {
  const [data, setData] = useState<SheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState('TEXT');
  const [creatingColumn, setCreatingColumn] = useState(false);
  const [deletingColumnId, setDeletingColumnId] = useState<string | null>(null);

  // Local state for immediate UI updates before saving
  const [localValues, setLocalValues] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getSheetData(sheetId);
      setData(response.data);
      
      // Initialize local values map
      const valuesMap: Record<string, string> = {};
      response.data.values.forEach((v: SheetValue) => {
        valuesMap[`${v.learnerId}_${v.sessionColumnId}`] = v.value || '';
      });
      setLocalValues(valuesMap);

    } catch (err) {
      console.error('Error fetching sheet data:', err);
      setError('Erreur lors du chargement des données.');
    } finally {
      setLoading(false);
    }
  }, [sheetId]);

  useEffect(() => {
    if (sheetId) {
      fetchData();
    }
  }, [sheetId, fetchData]);

  const handleCellChange = (learnerId: string, columnId: string, value: string) => {
    setLocalValues(prev => ({
      ...prev,
      [`${learnerId}_${columnId}`]: value
    }));
  };

  const handleCellBlur = async (learnerId: string, columnId: string, value: string) => {
    if (!data) return;
    
    // Find original value to avoid unnecessary updates
    const originalValueObj = data.values.find((v) => v.learnerId === learnerId && v.sessionColumnId === columnId);
    const originalValue = originalValueObj ? originalValueObj.value : '';

    if (originalValue === value) return; // No change

    try {
      setSaving(true);
      await updateSheetValue(sheetId, { learnerId, sessionColumnId: columnId, value });
      
      // Update original data state so we know it's saved
      setData((prev) => {
        if (!prev) return null;
        const newValues = [...prev.values];
        const existingIdx = newValues.findIndex((v) => v.learnerId === learnerId && v.sessionColumnId === columnId);
        if (existingIdx >= 0) {
          newValues[existingIdx].value = value;
        } else {
          newValues.push({ learnerId, sessionColumnId: columnId, value });
        }
        return { ...prev, values: newValues };
      });
    } catch (err) {
      console.error('Error saving cell:', err);
      // Revert on error
      setLocalValues(prev => ({
        ...prev,
        [`${learnerId}_${columnId}`]: originalValue
      }));
      alert('Erreur lors de la sauvegarde de la cellule.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnName.trim()) return;
    
    setCreatingColumn(true);
    try {
      const response = await createColumn(sheetId, { name: newColumnName, dataType: newColumnType });
      setData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          columns: [...prev.columns, response.data]
        };
      });
      setShowAddColumn(false);
      setNewColumnName('');
      setNewColumnType('TEXT');
    } catch (err) {
      console.error('Error creating column:', err);
      alert('Erreur lors de la création de la colonne.');
    } finally {
      setCreatingColumn(false);
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette colonne ? Toutes les données associées seront perdues.')) {
      return;
    }

    setDeletingColumnId(columnId);
    try {
      await deleteColumn(sheetId, columnId);
      setData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          columns: prev.columns.filter((c) => c.id !== columnId),
          values: prev.values.filter((v) => v.sessionColumnId !== columnId)
        };
      });

      // Update local values
      setLocalValues(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          if (key.endsWith(`_${columnId}`)) {
            delete next[key];
          }
        });
        return next;
      });
    } catch (err) {
      console.error('Error deleting column:', err);
      alert('Erreur lors de la suppression de la colonne.');
    } finally {
      setDeletingColumnId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <Loader2 size={32} className="animate-spin mb-4 text-purple-600" />
        <p>Chargement des données de la feuille...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-xl border border-red-100 text-center">
        {error}
        <button onClick={fetchData} className="ml-4 underline font-medium">Réessayer</button>
      </div>
    );
  }

  if (!data || !data.columns || data.columns.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
        Cette feuille est vide. Les colonnes seront générées lors de l'importation d'un fichier Excel.
      </div>
    );
  }

  const learners = data.learners;

  return (
    <div className="relative">
      {saving && (
        <div className="absolute top-2 right-4 flex items-center space-x-2 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-full font-medium z-20">
          <Save size={14} className="animate-pulse" />
          <span>Sauvegarde auto...</span>
        </div>
      )}
      
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm max-h-[70vh]">
        <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
          <thead className="bg-slate-100 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-4 py-3 border-b border-r border-slate-200 font-semibold text-slate-700 bg-slate-100 sticky left-0 z-20 min-w-[250px]">
                Académicien
              </th>
              {data.columns.map((col) => (
                <th key={col.id} className="px-4 py-3 border-b border-r border-slate-200 font-semibold text-slate-700 text-center min-w-[150px] relative group/header">
                  <div className="flex items-center justify-center gap-2">
                    <span>{col.name}</span>
                    <button 
                      onClick={() => handleDeleteColumn(col.id)}
                      disabled={!!deletingColumnId}
                      className="opacity-0 group-hover/header:opacity-100 p-1 hover:bg-red-100 rounded text-red-500 transition-all disabled:opacity-50"
                      title="Supprimer la colonne"
                    >
                      {deletingColumnId === col.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    </button>
                  </div>
                </th>
              ))}
              <th className="px-2 py-3 border-b border-slate-200 font-semibold text-center bg-slate-50">
                {showAddColumn ? (
                  <button onClick={() => setShowAddColumn(false)} className="p-1 hover:bg-red-100 rounded text-red-500">
                    <X size={16} />
                  </button>
                ) : (
                  <button onClick={() => setShowAddColumn(true)} className="p-1 hover:bg-green-100 rounded text-green-600" title="Ajouter une colonne">
                    <Plus size={16} />
                  </button>
                )}
              </th>
            </tr>
            {showAddColumn && (
              <tr className="bg-green-50">
                <td className="px-4 py-2 border-b border-slate-200"></td>
                <td colSpan={data.columns.length} className="px-4 py-2 border-b border-slate-200">
                  <form onSubmit={handleCreateColumn} className="flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="text"
                      value={newColumnName}
                      onChange={(e) => setNewColumnName(e.target.value)}
                      placeholder="Nom de la colonne"
                      className="flex-1 w-full sm:w-auto px-3 py-2 text-sm border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                      autoFocus
                    />
                    <select
                      value={newColumnType}
                      onChange={(e) => setNewColumnType(e.target.value)}
                      className="w-full sm:w-auto px-2 py-2 text-sm border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="TEXT">Texte</option>
                      <option value="NUMBER">Nombre</option>
                      <option value="BOOLEAN">Oui/Non</option>
                      <option value="DATE">Date</option>
                    </select>
                    <button
                      type="submit"
                      disabled={creatingColumn || !newColumnName.trim()}
                      className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 font-medium"
                    >
                      {creatingColumn ? <Loader2 size={14} className="animate-spin inline" /> : 'Ajouter'}
                    </button>
                  </form>
                </td>
              </tr>
            )}
          </thead>
          <tbody>
            {learners.map((learner, index) => (
              <tr key={learner.id} className="hover:bg-blue-50/30 transition-colors">
                <td className="px-4 py-2 border-b border-r border-slate-200 bg-white sticky left-0 z-10 font-medium text-slate-900 flex items-center space-x-3 text-sm">
                  <span className="text-slate-400 text-xs w-5">{index + 1}.</span>
                  <span>{learner.lastName} {learner.firstName}</span>
                </td>
                {data.columns.map((col) => {
                  const cellKey = `${learner.id}_${col.id}`;
                  const value = localValues[cellKey] ?? '';
                  return (
                    <td key={col.id} className="border-b border-r border-slate-200 p-0 relative min-w-[120px]">
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleCellChange(learner.id, col.id, e.target.value)}
                        onBlur={(e) => handleCellBlur(learner.id, col.id, e.target.value)}
                        className="w-full h-full px-4 py-2.5 outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-transparent text-center text-slate-700 transition-all min-h-touch"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
            {learners.length === 0 && (
              <tr>
                <td colSpan={data.columns.length + 1} className="px-4 py-8 text-center text-slate-500 italic">
                  Aucun apprenant enregistré dans le système.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {/* Add Column Button for Mobile */}
        <div className="flex justify-end gap-2">
          {showAddColumn ? (
            <button onClick={() => setShowAddColumn(false)} className="p-2 hover:bg-red-100 rounded text-red-500">
              <X size={18} />
            </button>
          ) : (
            <button onClick={() => setShowAddColumn(true)} className="p-2 hover:bg-green-100 rounded text-green-600" title="Ajouter une colonne">
              <Plus size={18} />
            </button>
          )}
        </div>

        {showAddColumn && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <form onSubmit={handleCreateColumn} className="flex flex-col gap-3">
              <input
                type="text"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                placeholder="Nom de la colonne"
                className="w-full px-3 py-2.5 text-sm border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                autoFocus
              />
              <select
                value={newColumnType}
                onChange={(e) => setNewColumnType(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-green-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="TEXT">Texte</option>
                <option value="NUMBER">Nombre</option>
                <option value="BOOLEAN">Oui/Non</option>
                <option value="DATE">Date</option>
              </select>
              <button
                type="submit"
                disabled={creatingColumn || !newColumnName.trim()}
                className="w-full px-4 py-2.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 font-medium min-h-touch"
              >
                {creatingColumn ? <Loader2 size={14} className="animate-spin inline mr-2" /> : ''}Ajouter
              </button>
            </form>
          </div>
        )}

        {/* Learner Cards */}
        {learners.map((learner, index) => (
          <div key={learner.id} className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="font-semibold text-slate-900 mb-4 text-base pb-3 border-b border-slate-100">
              <span className="text-slate-400 text-sm">#{index + 1}</span> {learner.firstName} {learner.lastName}
            </div>
            <div className="space-y-3">
              {data.columns.map((col) => {
                const cellKey = `${learner.id}_${col.id}`;
                const value = localValues[cellKey] ?? '';
                return (
                  <div key={col.id} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex-1">
                        {col.name}
                      </label>
                      <button
                        onClick={() => handleDeleteColumn(col.id)}
                        disabled={!!deletingColumnId}
                        className="p-1 hover:bg-red-100 rounded text-red-500 transition-all disabled:opacity-50 ml-2"
                        title="Supprimer la colonne"
                      >
                        {deletingColumnId === col.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleCellChange(learner.id, col.id, e.target.value)}
                      onBlur={(e) => handleCellBlur(learner.id, col.id, e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 text-sm min-h-touch"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {learners.length === 0 && (
          <div className="p-8 text-center text-slate-500 italic bg-white rounded-lg border border-dashed border-slate-300">
            Aucun apprenant enregistré dans le système.
          </div>
        )}
      </div>
    </div>
  );
}
