import React, { useState } from 'react';
import { Plus, Edit3, Video, Clock, Check, X } from 'lucide-react';

interface QuickDetailsCardProps {
  hoursPerWeek: string;
  availabilityNote: string;
  hasVideoIntro: boolean;
  isPublicView: boolean;
  onOpenVideoModal: () => void;
  onUpdateHours: (hours: string, note: string) => void;
}

export const QuickDetailsCard: React.FC<QuickDetailsCardProps> = ({
  hoursPerWeek,
  availabilityNote,
  hasVideoIntro,
  isPublicView,
  onOpenVideoModal,
  onUpdateHours,
}) => {
  const [isEditingHours, setIsEditingHours] = useState(false);
  const [tempHours, setTempHours] = useState(hoursPerWeek);
  const [tempNote, setTempNote] = useState(availabilityNote);

  const handleSave = () => {
    if (tempHours.trim()) {
      onUpdateHours(tempHours.trim(), tempNote.trim());
    }
    setIsEditingHours(false);
  };

  const handleCancel = () => {
    setTempHours(hoursPerWeek);
    setTempNote(availabilityNote);
    setIsEditingHours(false);
  };

  return (
    <div className="bg-[#ffffff] rounded-2xl p-6 shadow-sm border border-[#c1c6d7]/25 flex flex-col gap-6">
      {/* Video Intro Section */}
      <div className="flex items-center justify-between group">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#0058bc]">
            <Video className="w-4 h-4" />
          </div>
          <h4 className="font-semibold text-lg text-[#1a1c1d]">Vidéo de présentation</h4>
        </div>

        <button
          onClick={onOpenVideoModal}
          id="video-intro-action-btn"
          title={hasVideoIntro ? 'Regarder la vidéo introductive' : 'Ajouter une vidéo introductive'}
          className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all active:scale-95 ${
            hasVideoIntro
              ? 'border-emerald-500 text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
              : 'border-[#0058bc] text-[#0058bc] hover:bg-blue-50'
          }`}
        >
          {hasVideoIntro ? <Video className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>

      {/* Hours per week Section with Inline Editing */}
      <div className="border-t border-[#c1c6d7]/20 pt-4">
        {isEditingHours ? (
          <div className="space-y-3 bg-[#f9f9fb] p-3.5 rounded-xl border border-[#c1c6d7]/30 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#1a1c1d] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#0058bc]" />
                Modifier le temps de travail
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#717786] mb-1">
                Volume horaire
              </label>
              <select
                value={tempHours}
                onChange={(e) => setTempHours(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#c1c6d7] text-xs focus:border-[#0058bc] outline-none bg-white font-medium text-[#1a1c1d]"
              >
                <option value="More than 30 hrs/week">Plus de 30 h/semaine</option>
                <option value="Less than 30 hrs/week">Moins de 30 h/semaine</option>
                <option value="As needed - open to offers">Selon les besoins, ouvert aux offres</option>
                <option value="Full-time Research">Recherche à temps plein</option>
                <option value="Part-time Consultant">Consultant à temps partiel</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#717786] mb-1">
                Note de disponibilité
              </label>
              <input
                type="text"
                value={tempNote}
                onChange={(e) => setTempNote(e.target.value)}
                placeholder="Ex: Ouvert aux collaborations de recherche"
                className="w-full px-3 py-2 rounded-lg border border-[#c1c6d7] text-xs focus:border-[#0058bc] outline-none bg-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-1.5 rounded-lg border border-[#c1c6d7] text-xs font-semibold text-[#717786] hover:bg-[#eeeef0]"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-1.5 rounded-lg bg-[#0058bc] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#004493] flex items-center gap-1 shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Enregistrer</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between group">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#717786]" />
                <h4 className="font-semibold text-lg text-[#1a1c1d]">Heures par semaine</h4>
              </div>
              <p className="text-sm text-[#414755] mt-1 leading-relaxed">
                <span className="font-medium text-[#1a1c1d]">{hoursPerWeek}</span>
                <br />
                <span className="text-[#414755]">{availabilityNote}</span>
              </p>
            </div>

            {!isPublicView && (
              <button
                onClick={() => {
                  setTempHours(hoursPerWeek);
                  setTempNote(availabilityNote);
                  setIsEditingHours(true);
                }}
                id="edit-hours-per-week-btn"
                title="Modifier directement dans ce champ"
                className="w-8 h-8 rounded-full border border-[#c1c6d7] text-[#414755] flex items-center justify-center hover:bg-[#f3f3f5] hover:text-[#0058bc] hover:border-[#0058bc] transition-colors self-start mt-0.5 active:scale-95"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
