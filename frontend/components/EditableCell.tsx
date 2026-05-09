'use client';

import { useState, useRef, useEffect } from 'react';
import { updateLearner } from '@/services/api';

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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      await updateLearner(learnerId, { [field]: editValue });
      if (onUpdate) {
        onUpdate(field, editValue);
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update:', error);
      setEditValue(value);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    if (type === 'select') {
      return (
        <select
          ref={inputRef as any}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={saving}
          className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="PENDING">En attente</option>
          <option value="ADMITTED">Admis</option>
          <option value="REJECTED">Refusé</option>
        </select>
      );
    }
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        disabled={saving}
        className="w-full px-2 py-1 text-sm border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    );
  }

  return (
    <div
      onClick={() => !saving && setIsEditing(true)}
      className="cursor-pointer hover:bg-blue-50 px-2 py-1 -mx-2 rounded transition-colors"
      title="Cliquez pour modifier"
    >
      {field === 'identifiant' ? (
        <code className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-mono text-xs font-bold border border-slate-200">
          {value || 'NON DÉFINI'}
        </code>
      ) : field === 'status' ? (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
          value === 'ADMITTED' ? 'bg-green-100 text-green-700 border border-green-200' : 
          value === 'PENDING' ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
        }`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current mr-2"></span>
          {value === 'ADMITTED' ? 'Admis' : value === 'PENDING' ? 'En attente' : 'Refusé'}
        </span>
      ) : (
        <span className="text-sm">{value}</span>
      )}
    </div>
  );
}