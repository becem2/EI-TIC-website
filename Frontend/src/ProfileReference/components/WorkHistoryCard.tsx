import React, { useState } from 'react';
import { WorkHistoryItem } from '../types';
import { Briefcase, Plus, Edit3, Trash2, Check, X } from 'lucide-react';

interface WorkHistoryCardProps {
  workHistory: WorkHistoryItem[];
  isPublicView: boolean;
  onSaveWork: (item: WorkHistoryItem) => void;
  onDeleteWork: (id: string) => void;
}

export const WorkHistoryCard: React.FC<WorkHistoryCardProps> = ({
  workHistory,
  isPublicView,
  onSaveWork,
  onDeleteWork,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const [role, setRole] = useState('');
  const [organization, setOrganization] = useState('');
  const [period, setPeriod] = useState('');
  const [description, setDescription] = useState('');

  const startEdit = (item: WorkHistoryItem) => {
    setIsAddingNew(false);
    setEditingId(item.id);
    setRole(item.role);
    setOrganization(item.organization);
    setPeriod(item.period);
    setDescription(item.description || '');
  };

  const startAddNew = () => {
    setEditingId(null);
    setIsAddingNew(true);
    setRole('Chercheur Associé en IA');
    setOrganization('Institut des Sciences & Technologies');
    setPeriod('2024 - Présent');
    setDescription('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAddingNew(false);
  };

  const handleSave = (id?: string) => {
    if (!role.trim() || !organization.trim()) return;

    onSaveWork({
      id: id || `work-${Date.now()}`,
      role: role.trim(),
      organization: organization.trim(),
      period: period.trim(),
      description: description.trim() || undefined,
    });

    cancelEdit();
  };

  return (
    <section className="bg-[#ffffff] rounded-2xl p-6 sm:p-8 shadow-sm border border-[#c1c6d7]/25 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#0058bc]">
            <Briefcase className="w-4 h-4" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1a1c1d]">Expérience professionnelle</h2>
        </div>

        {!isPublicView && !isAddingNew && (
          <button
            onClick={startAddNew}
            title="Ajouter une expérience directement ici"
            className="w-8 h-8 rounded-full border border-[#0058bc] text-[#0058bc] flex items-center justify-center hover:bg-blue-50 transition-colors active:scale-95"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Add New Work Form Inline */}
      {isAddingNew && (
        <div className="p-4 bg-blue-50/40 rounded-xl border border-[#0058bc]/30 space-y-3 animate-in fade-in duration-200">
          <h5 className="text-xs font-bold uppercase tracking-wider text-[#0058bc]">
            Nouvelle Expérience Professionnelle
          </h5>
          <div className="space-y-2">
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Poste / Rôle (ex: Chercheur Postdoctoral) *"
              className="w-full px-3 py-1.5 bg-white rounded-lg border border-[#c1c6d7] text-xs font-semibold text-[#1a1c1d] outline-none focus:border-[#0058bc]"
            />
            <input
              type="text"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="Organisme / Laboratoire *"
              className="w-full px-3 py-1.5 bg-white rounded-lg border border-[#c1c6d7] text-xs text-[#1a1c1d] outline-none focus:border-[#0058bc]"
            />
            <input
              type="text"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="Période (ex: 2023 - Présent)"
              className="w-full px-3 py-1.5 bg-white rounded-lg border border-[#c1c6d7] text-xs text-[#717786] outline-none focus:border-[#0058bc]"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description des projets ou responsabilités (optionnel)..."
              rows={2}
              className="w-full px-3 py-1.5 bg-white rounded-lg border border-[#c1c6d7] text-xs text-[#414755] outline-none focus:border-[#0058bc]"
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

      {workHistory.length === 0 && !isAddingNew ? (
        <p className="text-sm text-[#414755] font-normal" id="work-history-empty">
          Aucune expérience enregistrée.
        </p>
      ) : (
        <div className="space-y-4">
          {workHistory.map((item) => (
            <div
              key={item.id}
              className="border-b border-[#c1c6d7]/15 pb-4 last:border-0 last:pb-0"
            >
              {editingId === item.id ? (
                /* Inline Edit Row */
                <div className="p-4 bg-[#f9f9fb] rounded-xl border border-[#0058bc]/40 space-y-3 animate-in fade-in duration-200">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-[#1a1c1d]">
                    Modifier l'expérience
                  </h5>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="Poste / Rôle"
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-[#c1c6d7] text-xs font-semibold text-[#1a1c1d] outline-none focus:border-[#0058bc]"
                    />
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="Organisme"
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-[#c1c6d7] text-xs text-[#1a1c1d] outline-none focus:border-[#0058bc]"
                    />
                    <input
                      type="text"
                      value={period}
                      onChange={(e) => setPeriod(e.target.value)}
                      placeholder="Période"
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-[#c1c6d7] text-xs text-[#717786] outline-none focus:border-[#0058bc]"
                    />
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Description de l’expérience"
                      rows={2}
                      className="w-full px-3 py-1.5 bg-white rounded-lg border border-[#c1c6d7] text-xs text-[#414755] outline-none focus:border-[#0058bc]"
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
                /* Display Row */
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-[#1a1c1d]">{item.role}</h4>
                    <p className="text-xs text-[#0058bc] font-medium">{item.organization}</p>
                    <p className="text-xs text-[#717786] mt-0.5">{item.period}</p>
                    {item.description && (
                      <p className="text-xs text-[#414755] mt-1 leading-relaxed">{item.description}</p>
                    )}
                  </div>

                  {!isPublicView && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(item)}
                        className="p-1 text-[#414755] hover:text-[#0058bc] transition-colors rounded hover:bg-[#f3f3f5]"
                        title="Modifier cette expérience"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteWork(item.id)}
                        className="p-1 text-[#414755] hover:text-red-600 transition-colors rounded hover:bg-red-50"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
