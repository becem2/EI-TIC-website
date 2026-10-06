import React, { useState } from 'react';
import { ResearcherProfile } from '../../types';
import { X, Settings, User, MapPin, Sparkles, Clock, Globe } from 'lucide-react';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  profile: ResearcherProfile;
  onClose: () => void;
  onSave: (updated: Partial<ResearcherProfile>) => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  profile,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(profile.name);
  const [titleTag, setTitleTag] = useState(profile.titleTag);
  const [location, setLocation] = useState(profile.location);
  const [hoursPerWeek, setHoursPerWeek] = useState(profile.hoursPerWeek);
  const [availabilityNote, setAvailabilityNote] = useState(profile.availabilityNote);
  const [availabilityBadge, setAvailabilityBadge] = useState(profile.availabilityBadge);
  const [boostProfile, setBoostProfile] = useState(profile.boostProfile);
  const [avatar, setAvatar] = useState(profile.avatar);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: name.trim(),
      titleTag: titleTag.trim(),
      location: location.trim(),
      hoursPerWeek: hoursPerWeek.trim(),
      availabilityNote: availabilityNote.trim(),
      availabilityBadge,
      boostProfile,
      avatar: avatar.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-xl max-h-[90vh] rounded-2xl shadow-2xl border border-[#c1c6d7]/30 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#c1c6d7]/20 flex items-center justify-between bg-[#f9f9fb]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#0058bc]">
              <Settings className="w-4 h-4" />
            </div>
            <h3 className="text-xl font-bold text-[#1a1c1d]">Paramètres du profil</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#717786] hover:bg-[#eeeef0] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 overflow-y-auto space-y-4 text-sm">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1a1c1d] mb-1">
              Nom du chercheur
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#c1c6d7] focus:border-[#0058bc] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1a1c1d] mb-1">
              Accroche / titre de spécialité
            </label>
            <input
              type="text"
              required
              value={titleTag}
              onChange={(e) => setTitleTag(e.target.value)}
              placeholder="Chercheur en informatique cognitive"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#c1c6d7] focus:border-[#0058bc] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1a1c1d] mb-1">
              Localisation et fuseau horaire
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Manouba, Tunisie"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#c1c6d7] focus:border-[#0058bc] outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1a1c1d] mb-1">
                Heures par semaine
              </label>
              <input
                type="text"
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(e.target.value)}
                placeholder="Plus de 30 h/semaine"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#c1c6d7] focus:border-[#0058bc] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1a1c1d] mb-1">
                Note de disponibilité
              </label>
              <input
                type="text"
                value={availabilityNote}
                onChange={(e) => setAvailabilityNote(e.target.value)}
                placeholder="Ouvert aux collaborations"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#c1c6d7] focus:border-[#0058bc] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1a1c1d] mb-1">
                URL de l’avatar du profil
            </label>
            <input
              type="url"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#c1c6d7] focus:border-[#0058bc] outline-none text-xs"
            />
          </div>

          {/* Visibility Toggles */}
          <div className="pt-2 space-y-3 bg-[#f3f3f5] p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-[#1a1c1d] text-xs">Badge de disponibilité</p>
                <p className="text-[11px] text-[#717786]">Affiche un voyant vert de disponibilité</p>
              </div>
              <input
                type="checkbox"
                checked={availabilityBadge}
                onChange={(e) => setAvailabilityBadge(e.target.checked)}
                className="w-5 h-5 accent-[#0058bc] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between border-t border-[#c1c6d7]/30 pt-3">
              <div>
                <p className="font-semibold text-[#1a1c1d] text-xs">Mettre le profil en avant</p>
                <p className="text-[11px] text-[#717786]">Mettre en avant sur la page d'accueil du laboratoire</p>
              </div>
              <input
                type="checkbox"
                checked={boostProfile}
                onChange={(e) => setBoostProfile(e.target.checked)}
                className="w-5 h-5 accent-[#0058bc] cursor-pointer"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-[#c1c6d7]/20 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-[#c1c6d7] text-xs font-semibold uppercase tracking-wider text-[#414755] hover:bg-[#f3f3f5]"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-[#1a1c1d] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#414755] transition-all"
            >
              Enregistrer les modifications
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
