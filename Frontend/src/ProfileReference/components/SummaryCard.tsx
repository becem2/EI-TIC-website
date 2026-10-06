import React, { useState } from 'react';
import { Edit3, Check, X, Plus, Trash2 } from 'lucide-react';

const MAX_SUMMARY_WORDS = 100;

const limitWords = (value: string) => value.trimStart().split(/\s+/).slice(0, MAX_SUMMARY_WORDS).join(' ');

interface SummaryCardProps {
  titleTag: string;
  summaryText: string;
  researchAxes: string[];
  isPublicView: boolean;
  onUpdateTitleTag: (newTitle: string) => void;
  onUpdateSummaryText: (newSummary: string) => void;
  onUpdateResearchAxes: (newAxes: string[]) => void;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  titleTag,
  summaryText,
  researchAxes,
  isPublicView,
  onUpdateTitleTag,
  onUpdateSummaryText,
  onUpdateResearchAxes,
}) => {
  // Field-specific inline edit states
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(titleTag);

  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [tempSummary, setTempSummary] = useState(summaryText);

  const [isEditingPoints, setIsEditingPoints] = useState(false);
  const [tempPoints, setTempPoints] = useState<string[]>(researchAxes);
  const [newPointInput, setNewPointInput] = useState('');

  // Save handlers
  const handleSaveTitle = () => {
    if (tempTitle.trim()) {
      onUpdateTitleTag(tempTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleCancelTitle = () => {
    setTempTitle(titleTag);
    setIsEditingTitle(false);
  };

  const handleSaveSummary = () => {
    if (tempSummary.trim()) {
      onUpdateSummaryText(tempSummary.trim());
    }
    setIsEditingSummary(false);
  };

  const handleCancelSummary = () => {
    setTempSummary(summaryText);
    setIsEditingSummary(false);
  };

  const handleSavePoints = () => {
    onUpdateResearchAxes(tempPoints.filter((p) => p.trim().length > 0));
    setIsEditingPoints(false);
  };

  const handleCancelPoints = () => {
    setTempPoints(researchAxes);
    setIsEditingPoints(false);
  };

  const handleAddPoint = () => {
    if (newPointInput.trim()) {
      setTempPoints([...tempPoints, newPointInput.trim()]);
      setNewPointInput('');
    }
  };

  const handleRemovePoint = (index: number) => {
    setTempPoints(tempPoints.filter((_, i) => i !== index));
  };

  const handleUpdatePointText = (index: number, val: string) => {
    const updated = [...tempPoints];
    updated[index] = val;
    setTempPoints(updated);
  };

  return (
    <section className="bg-[#ffffff] rounded-2xl p-6 sm:p-8 shadow-sm border border-[#c1c6d7]/25 flex flex-col gap-6 relative transition-all">
      {/* Title Header with inline editing */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#c1c6d7]/20 pb-5">
        <div className="flex items-center gap-3 w-full">
          {isEditingTitle ? (
            <div className="flex items-center gap-2 w-full max-w-xl animate-in fade-in duration-200">
              <span className="text-xl font-bold text-[#717786]">[</span>
              <input
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') handleCancelTitle();
                }}
                autoFocus
                placeholder="Titre de spécialité (ex. chercheur en informatique cognitive)"
                className="flex-1 px-3 py-1.5 rounded-lg border-2 border-[#0058bc] text-lg sm:text-xl font-bold text-[#1a1c1d] outline-none bg-blue-50/30"
              />
              <span className="text-xl font-bold text-[#717786]">]</span>

              <button
                onClick={handleSaveTitle}
                className="p-2 rounded-full bg-[#0058bc] text-white hover:bg-[#004493] transition-colors shadow-sm"
                title="Enregistrer le titre"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancelTitle}
                className="p-2 rounded-full border border-[#c1c6d7] text-[#717786] hover:bg-[#f3f3f5] transition-colors"
                title="Annuler"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1a1c1d]" id="summary-title-tag">
                [ {titleTag} ]
              </h2>
              {!isPublicView && (
                <button
                  onClick={() => {
                    setTempTitle(titleTag);
                    setIsEditingTitle(true);
                  }}
                  id="edit-summary-title-btn"
                  title="Modifier ce titre"
                  className="w-8 h-8 rounded-full border border-[#c1c6d7] text-[#414755] flex items-center justify-center hover:bg-[#f3f3f5] hover:text-[#0058bc] hover:border-[#0058bc] transition-all active:scale-95"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Narrative & Strong Points with Inline Editing */}
      <div className="relative space-y-6">
        {/* Narrative Paragraph */}
        <div className="relative group/narrative">
          {isEditingSummary ? (
            <div className="space-y-3 animate-in fade-in duration-200">
              <textarea
                value={tempSummary}
                onChange={(e) => setTempSummary(limitWords(e.target.value))}
                rows={4}
                autoFocus
                className="w-full p-3.5 rounded-xl border-2 border-[#0058bc] text-sm sm:text-base text-[#1a1c1d] outline-none bg-blue-50/20 leading-relaxed"
                placeholder="Rédigez votre biographie professionnelle..."
              />
              <p className="text-right text-[11px] text-[#717786]">{tempSummary.trim() ? tempSummary.trim().split(/\s+/).length : 0}/{MAX_SUMMARY_WORDS} mots</p>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={handleCancelSummary}
                  className="px-3.5 py-1.5 rounded-lg border border-[#c1c6d7] text-xs font-semibold text-[#717786] hover:bg-[#f3f3f5] transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveSummary}
                  className="px-4 py-1.5 rounded-lg bg-[#0058bc] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#004493] flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Enregistrer</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <p className="text-base text-[#1a1c1d] leading-relaxed flex-1 font-normal">
                {summaryText}
              </p>
              {!isPublicView && (
                <button
                  onClick={() => {
                    setTempSummary(summaryText);
                    setIsEditingSummary(true);
                  }}
                  title="Modifier ce texte en direct"
                  className="w-7 h-7 rounded-full border border-[#c1c6d7] text-[#717786] flex items-center justify-center hover:bg-[#f3f3f5] hover:text-[#0058bc] hover:border-[#0058bc] transition-all opacity-70 hover:opacity-100 shrink-0"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Strong Points Section */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-[#1a1c1d] text-sm sm:text-base">Axes de recherche :</p>
            {!isPublicView && !isEditingPoints && (
              <button
                onClick={() => {
                  setTempPoints([...researchAxes]);
                  setIsEditingPoints(true);
                }}
                title="Modifier les axes de recherche"
                className="w-7 h-7 rounded-full border border-[#c1c6d7] text-[#717786] flex items-center justify-center hover:bg-[#f3f3f5] hover:text-[#0058bc] hover:border-[#0058bc] transition-all opacity-70 hover:opacity-100"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {isEditingPoints ? (
            <div className="space-y-3 bg-[#f9f9fb] p-4 rounded-xl border border-[#c1c6d7]/30 animate-in fade-in duration-200">
              <div className="space-y-2">
                {tempPoints.map((point, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0058bc] shrink-0" />
                    <input
                      type="text"
                      value={point}
                      onChange={(e) => handleUpdatePointText(index, e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-[#c1c6d7] text-sm text-[#1a1c1d] outline-none focus:border-[#0058bc] bg-white"
                    />
                    <button
                      onClick={() => handleRemovePoint(index)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer ce point"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Point Row */}
              <div className="flex items-center gap-2 pt-2 border-t border-[#c1c6d7]/20">
                <input
                  type="text"
                  value={newPointInput}
                  onChange={(e) => setNewPointInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPoint();
                    }
                  }}
                  placeholder="Ajouter un point fort (ex: Edge AI deployment)..."
                  className="flex-1 px-3 py-1.5 rounded-lg border border-[#c1c6d7] text-xs focus:border-[#0058bc] outline-none bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddPoint}
                  className="px-3 py-1.5 bg-[#1a1c1d] text-white rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-[#414755]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter</span>
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={handleCancelPoints}
                  className="px-3.5 py-1.5 rounded-lg border border-[#c1c6d7] text-xs font-semibold text-[#717786] hover:bg-[#f3f3f5]"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSavePoints}
                  className="px-4 py-1.5 rounded-lg bg-[#0058bc] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#004493] flex items-center gap-1 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Enregistrer</span>
                </button>
              </div>
            </div>
          ) : (
            <ul className="list-none pl-0 space-y-2.5">
              {researchAxes.map((point, index) => (
                <li key={index} className="flex items-center gap-2.5 text-sm sm:text-base text-[#414755]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0058bc] shrink-0" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          )}

        </div>
      </div>
    </section>
  );
};
