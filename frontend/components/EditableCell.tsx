'use client';

import { useState, useRef, useEffect } from 'react';
import { updateLearner } from '@/services/api';
import { Loader2 } from 'lucide-react';

interface EditableCellProps {
  learnerId: string;
  field: 'firstName' | 'lastName' | 'identifiant' | 'email' | 'status';
  value: string;
  type?: 'text' | 'select';
  onUpdate?: (field: string, newValue: string) => void;
}

export default function EditableCell({ learnerId, field, value, type = 'text', onUpdate }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing) {
      if (type === 'select' && selectRef.current) {
        selectRef.current.focus();
      } else if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }
  }, [isEditing, type]);

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      setError(null);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await updateLearner(learnerId, { [field]: editValue });
      
      if (onUpdate) {
        onUpdate(field, editValue);
      }
      
      setIsEditing(false);
    } catch (err: any) {
      console.error(`Failed to update ${field}:`, err);
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde');
      setEditValue(value);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (type === 'select') {
        handleSave();
      } else {
        handleSave();
      }
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (saving) {
    return (
      <div className="flex items-center gap-2 px-2 py-1">
        <Loader2 className="animate-spin" size={16} />
        <span className="text-xs text-slate-500">Sauvegarde...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 px-2 py-1 text-red-500 text-xs">
        <span>{error}</span>
        <button onClick={handleCancel} className="underline">Annuler</button>
      </div>
    );
  }

  if (isEditing && type === 'select') {
    return (
      <div className="flex items-center gap-2">
        <select
          ref={selectRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="px-2 py-1.5 text-xs font-bold border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[100px]"
        >
          <option value="PENDING">En attente</option>
          <option value="ADMITTED">Admis</option>
          <option value="REJECTED">Refusé</option>
        </select>
        <button 
          onClick={handleCancel}
          className="text-slate-400 hover:text-slate-600 p-1"
          title="Annuler"
        >
          ✕
        </button>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type={field === 'email' ? 'email' : 'text'}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="w-full px-2 py-1 text-sm border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={field === 'identifiant' ? 'REEBI-2024-001' : undefined}
        />
        <button 
          onClick={handleCancel}
          className="text-slate-400 hover:text-slate-600 p-1"
          title="Annuler"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="cursor-pointer hover:bg-blue-50 px-2 py-1 -mx-2 rounded transition-colors inline-block"
      title="Cliquez pour modifier"
    >
      {field === 'identifiant' ? (
        <code className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-mono text-xs font-bold border border-slate-200">
          {value || 'NON DÉFINI'}
        </code>
      ) : field === 'status' ? (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest cursor-pointer ${
          value === 'ADMITTED' ? 'bg-green-100 text-green-700 border border-green-200' : 
          value === 'PENDING' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : 'bg-red-100 text-red-700 border border-red-200'
        }`}>
          {value === 'ADMITTED' ? 'Admis' : value === 'PENDING' ? 'En attente' : 'Refusé'}
        </span>
      ) : (
        <span className="text-sm">{value}</span>
      )}
    </div>
  );
}