import React, { useState } from 'react';
import { LanguageItem } from '../types';
import { Plus, Edit3, Globe, Check, Trash2 } from 'lucide-react';

const fluencyLevels = [
  'Débutant',
  'Conversationnel',
  'Maîtrise professionnelle',
  'Courant',
  'Langue maternelle ou bilingue',
] as const;

const getFluencyScore = (level: string) => {
  const score = fluencyLevels.indexOf(level as (typeof fluencyLevels)[number]);
  return score >= 0 ? score + 1 : 3;
};

interface LanguagesCardProps {
  languages: LanguageItem[];
  isPublicView: boolean;
  onUpdateLanguages: (languages: LanguageItem[]) => void;
}

export const LanguagesCard: React.FC<LanguagesCardProps> = ({
  languages,
  isPublicView,
  onUpdateLanguages,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentLanguages, setCurrentLanguages] = useState<LanguageItem[]>(languages);
  const [newLangName, setNewLangName] = useState('');
  const [newLangScore, setNewLangScore] = useState(3);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleToggleEdit = () => {
    if (isEditing) {
      onUpdateLanguages(currentLanguages);
      setIsEditing(false);
      setShowAddForm(false);
    } else {
      setCurrentLanguages(languages);
      setIsEditing(true);
    }
  };

  const handleUpdateItem = (id: string, name: string, level: string) => {
    const updated = currentLanguages.map((l) =>
      l.id === id ? { ...l, name, level } : l
    );
    setCurrentLanguages(updated);
    onUpdateLanguages(updated);
  };

  const handleUpdateScore = (id: string, score: number) => {
    handleUpdateItem(id, currentLanguages.find((language) => language.id === id)?.name || '', fluencyLevels[score - 1]);
  };

  const handleRemove = (id: string) => {
    const updated = currentLanguages.filter((l) => l.id !== id);
    setCurrentLanguages(updated);
    onUpdateLanguages(updated);
  };

  const handleAdd = () => {
    if (!newLangName.trim()) return;
    const newItem: LanguageItem = {
      id: `lang-${Date.now()}`,
      name: `${newLangName.trim().charAt(0).toUpperCase()}${newLangName.trim().slice(1)}`,
      level: fluencyLevels[newLangScore - 1],
    };
    const updated = [...currentLanguages, newItem];
    setCurrentLanguages(updated);
    onUpdateLanguages(updated);
    setNewLangName('');
    setShowAddForm(false);
  };

  return (
    <div className="bg-[#ffffff] rounded-2xl p-6 shadow-sm border border-[#c1c6d7]/25 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#0058bc]">
            <Globe className="w-4 h-4" />
          </div>
          <h4 className="font-semibold text-lg text-[#1a1c1d]">Langues</h4>
        </div>

        {!isPublicView && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToggleEdit}
              id="edit-languages-btn"
              title={isEditing ? 'Terminer' : 'Modifier les langues'}
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all active:scale-95 ${
                isEditing
                  ? 'bg-[#0058bc] text-white border-[#0058bc]'
                  : 'border-[#c1c6d7] text-[#414755] hover:bg-[#f3f3f5] hover:text-[#0058bc] hover:border-[#0058bc]'
              }`}
            >
              {isEditing ? <Check className="w-4 h-4" /> : <Edit3 className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {isEditing ? (
          <div className="space-y-3 animate-in fade-in duration-200">
            {currentLanguages.map((lang) => (
              <div key={lang.id} className="p-2.5 bg-[#f9f9fb] rounded-xl border border-[#c1c6d7]/30 flex items-center gap-2">
                  <input
                    type="text"
                    value={lang.name}
                    onChange={(e) => handleUpdateItem(lang.id, e.target.value, lang.level)}
                    className="min-w-0 flex-1 px-2 py-1 bg-white rounded border border-[#c1c6d7] text-xs font-semibold text-[#1a1c1d] outline-none focus:border-[#0058bc]"
                  />
                  <div className="flex shrink-0 items-center gap-1" aria-label={`Niveau de langue: ${lang.level}`}>
                    {fluencyLevels.map((_, index) => {
                      const point = index + 1;
                      return (
                        <button
                          key={point}
                          type="button"
                          onClick={() => handleUpdateScore(lang.id, point)}
                          aria-label={`${point} sur 5`}
                          className={`h-2.5 w-2.5 rounded-full border transition-colors ${
                            point <= getFluencyScore(lang.level)
                              ? 'border-[#0058bc] bg-[#0058bc]'
                              : 'border-[#c1c6d7] bg-white hover:border-[#0058bc]'
                          }`}
                        />
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(lang.id)}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
              </div>
            ))}

            {showAddForm ? (
              <div className="p-2.5 bg-blue-50/50 rounded-xl border border-[#0058bc]/30 space-y-2">
                <input
                  type="text"
                  value={newLangName}
                  onChange={(e) => setNewLangName(e.target.value)}
                  placeholder="Langue (ex: Allemand)..."
                  className="w-full px-2 py-1 bg-white rounded border border-[#c1c6d7] text-xs text-[#1a1c1d] outline-none focus:border-[#0058bc]"
                />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] text-[#717786]">Niveau de maîtrise</span>
                  <div className="flex items-center gap-1" aria-label={`Niveau de langue: ${newLangScore} sur 5`}>
                    {fluencyLevels.map((_, index) => {
                      const point = index + 1;
                      return (
                        <button
                          key={point}
                          type="button"
                          onClick={() => setNewLangScore(point)}
                          aria-label={`${point} sur 5`}
                          className={`h-2.5 w-2.5 rounded-full border transition-colors ${
                            point <= newLangScore
                              ? 'border-[#0058bc] bg-[#0058bc]'
                              : 'border-[#c1c6d7] bg-white hover:border-[#0058bc]'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
                <div className="flex justify-end gap-1 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-2 py-1 text-[11px] text-[#717786]"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleAdd}
                    className="px-3 py-1 bg-[#0058bc] text-white text-[11px] font-bold rounded-lg"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="w-full py-2 border border-dashed border-[#c1c6d7] rounded-xl text-xs text-[#0058bc] font-semibold flex items-center justify-center gap-1 hover:bg-blue-50/40 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter une langue</span>
              </button>
            )}
          </div>
        ) : (
          languages.map((lang) => (
            <div key={lang.id} className="flex items-center gap-3 text-sm">
              <span className="min-w-0 flex-1 font-semibold text-[#1a1c1d]">{lang.name}</span>
              <div className="flex shrink-0 items-center gap-1" aria-label={`${lang.name}: ${lang.level}`}>
                {fluencyLevels.map((_, index) => (
                  <span
                    key={index}
                    className={`h-2.5 w-2.5 rounded-full border ${
                      index + 1 <= getFluencyScore(lang.level)
                        ? 'border-[#0058bc] bg-[#0058bc]'
                        : 'border-[#c1c6d7] bg-white'
                    }`}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
