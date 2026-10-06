import React, { useState } from 'react';
import { EducationItem } from '../types';
import { Plus, Edit3, Trash2, GraduationCap, Check, X } from 'lucide-react';

interface EducationCardProps {
  education: EducationItem[];
  isPublicView: boolean;
  onSaveEducation: (item: EducationItem) => void;
  onDeleteEducation: (id: string) => void;
}

export const EducationCard: React.FC<EducationCardProps> = ({
  education,
  isPublicView,
  onSaveEducation,
  onDeleteEducation,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form states
  const [institution, setInstitution] = useState('');
  const [degree, setDegree] = useState('');
  const [field, setField] = useState('');
  const [period, setPeriod] = useState('');

  const startEdit = (item: EducationItem) => {
    setIsAddingNew(false);
    setEditingId(item.id);
    setInstitution(item.institution);
    setDegree(item.degree);
    setField(item.field);
    setPeriod(item.period);
  };

  const startAddNew = () => {
    setEditingId(null);
    setIsAddingNew(true);
    setInstitution("Ecole Nationale d'Ingénieurs de Carthage");
    setDegree('Diplôme d’ingénieur');
    setField('Ingénierie des systèmes infotroniques');
    setPeriod('2024-2027 (prévisionnel)');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAddingNew(false);
  };

  const handleSave = (id?: string) => {
    if (!institution.trim() || !degree.trim()) return;

    onSaveEducation({
      id: id || `edu-${Date.now()}`,
      institution: institution.trim(),
      degree: degree.trim(),
      field: field.trim(),
      period: period.trim(),
    });

    cancelEdit();
  };

  return (
    <div className="bg-[#ffffff] rounded-2xl p-6 shadow-sm border border-[#c1c6d7]/25 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#0058bc]">
            <GraduationCap className="w-4 h-4" />
          </div>
          <h4 className="font-semibold text-lg text-[#1a1c1d]">Formation</h4>
        </div>

        {!isPublicView && !isAddingNew && (
          <button
            onClick={startAddNew}
            id="add-education-btn"
            title="Ajouter une formation directement ici"
            className="w-8 h-8 rounded-full border border-[#0058bc] text-[#0058bc] flex items-center justify-center hover:bg-blue-50 transition-colors active:scale-95"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="space-y-5">
        {/* Inline Add New Form */}
        {isAddingNew && (
          <div className="p-4 bg-blue-50/40 rounded-xl border border-[#0058bc]/30 space-y-3 animate-in fade-in duration-200">
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#0058bc]">
              Nouvelle Formation
            </h5>
            <div className="space-y-2">
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="Institution / Université *"
                className="w-full px-3 py-1.5 bg-white rounded-lg border border-[#c1c6d7] text-xs font-semibold text-[#1a1c1d] outline-none focus:border-[#0058bc]"
              />
              <input
                type="text"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                placeholder="Diplôme / Grade (ex: Master de Recherche) *"
                className="w-full px-3 py-1.5 bg-white rounded-lg border border-[#c1c6d7] text-xs text-[#1a1c1d] outline-none focus:border-[#0058bc]"
              />
              <input
                type="text"
                value={field}
                onChange={(e) => setField(e.target.value)}
                placeholder="Spécialité / Domaine"
                className="w-full px-3 py-1.5 bg-white rounded-lg border border-[#c1c6d7] text-xs text-[#1a1c1d] outline-none focus:border-[#0058bc]"
              />
              <input
                type="text"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="Période (ex: 2024-2027)"
                className="w-full px-3 py-1.5 bg-white rounded-lg border border-[#c1c6d7] text-xs text-[#717786] outline-none focus:border-[#0058bc]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={cancelEdit}
                className="px-3 py-1.5 text-xs text-[#717786] hover:bg-white rounded-lg"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => handleSave()}
                className="px-4 py-1.5 bg-[#0058bc] text-white text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-1 shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Enregistrer</span>
              </button>
            </div>
          </div>
        )}

        {education.length === 0 && !isAddingNew ? (
          <p className="text-sm text-[#414755] italic">Aucune formation renseignée</p>
        ) : (
          education.map((item) => (
            <div key={item.id}>
              {editingId === item.id ? (
                /* Inline Edit Row */
                <div className="p-4 bg-[#f9f9fb] rounded-xl border border-[#0058bc]/40 space-y-3 animate-in fade-in duration-200">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-[#1a1c1d]">
                    Modifier la Formation
                  </h5>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      placeholder="Institution"
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-[#c1c6d7] text-xs font-semibold text-[#1a1c1d] outline-none focus:border-[#0058bc]"
                    />
                    <input
                      type="text"
                      value={degree}
                      onChange={(e) => setDegree(e.target.value)}
                      placeholder="Diplôme"
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-[#c1c6d7] text-xs text-[#1a1c1d] outline-none focus:border-[#0058bc]"
                    />
                    <input
                      type="text"
                      value={field}
                      onChange={(e) => setField(e.target.value)}
                      placeholder="Spécialité"
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-[#c1c6d7] text-xs text-[#1a1c1d] outline-none focus:border-[#0058bc]"
                    />
                    <input
                      type="text"
                      value={period}
                      onChange={(e) => setPeriod(e.target.value)}
                      placeholder="Période"
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-[#c1c6d7] text-xs text-[#717786] outline-none focus:border-[#0058bc]"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-3 py-1.5 text-xs text-[#717786] hover:bg-white rounded-lg"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSave(item.id)}
                      className="px-4 py-1.5 bg-[#0058bc] text-white text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-1 shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Enregistrer</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Normal Display Row */
                <div className="flex justify-between items-start gap-3">
                  <div className="space-y-0.5">
                    <h5 className="font-bold text-sm text-[#1a1c1d] leading-snug">{item.institution}</h5>
                    <p className="text-xs text-[#414755]">
                      {item.degree}, {item.field}
                    </p>
                    <p className="text-xs text-[#717786]">{item.period}</p>
                  </div>

                  {!isPublicView && (
                    <div className="flex items-center gap-1 shrink-0 pt-0.5">
                      <button
                        onClick={() => startEdit(item)}
                        className="p-1 text-[#414755] hover:text-[#0058bc] transition-colors rounded hover:bg-[#f3f3f5]"
                        title="Modifier ce diplôme"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteEducation(item.id)}
                        className="p-1 text-[#414755] hover:text-red-600 transition-colors rounded hover:bg-red-50"
                        title="Supprimer ce diplôme"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
