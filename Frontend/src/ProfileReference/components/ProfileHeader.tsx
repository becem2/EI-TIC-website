import React, { useEffect, useState, useRef } from 'react';
import { ResearcherProfile } from '../types';
import { MapPin, Edit3, Eye, Sparkles, Check, X, Camera, Image as ImageIcon, Save } from 'lucide-react';

interface ProfileHeaderProps {
  profile: ResearcherProfile;
  isPublicView: boolean;
  onTogglePublicView: () => void;
  onSave: () => void;
  isSaving: boolean;
  isDirty: boolean;
  onUpdateName: (newName: string) => void;
  onUpdateLocation: (newLocation: string) => void;
  onUpdateAvatar: (newAvatar: string) => void;
  onUpdateResearchImage: (newImage: string) => void;
  canTogglePublicView?: boolean;
  showPublicViewBadge?: boolean;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  isPublicView,
  onTogglePublicView,
  onSave,
  isSaving,
  isDirty,
  onUpdateName,
  onUpdateLocation,
  onUpdateAvatar,
  onUpdateResearchImage,
  canTogglePublicView = true,
  showPublicViewBadge = true,
}) => {
  const [localTime, setLocalTime] = useState<string>('1:45 am');
  const [detectedCity, setDetectedCity] = useState<string | null>(null);

  // Inline edit states for specific fields
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(profile.name);

  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [tempLocation, setTempLocation] = useState(profile.location);

  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const avatarPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const timeString = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Africa/Tunis',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }).format(now);
        setLocalTime(timeString.toLowerCase());
      } catch {
        setLocalTime('1:45 am');
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        void fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
        )
          .then((response) => (response.ok ? response.json() : null))
          .then((data: { address?: Record<string, string> } | null) => {
            const address = data?.address;
            const city = address?.city || address?.town || address?.village || address?.municipality || address?.county;
            if (city) setDetectedCity(city);
          })
          .catch(() => undefined);
      },
      () => undefined,
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 10000 },
    );
  }, []);

  // Close avatar popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (avatarPickerRef.current && !avatarPickerRef.current.contains(e.target as Node)) {
        setShowAvatarPicker(false);
      }
    };
    if (showAvatarPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAvatarPicker]);

  useEffect(() => {
    if (!showAvatarPicker) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowAvatarPicker(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showAvatarPicker]);

  const handleSaveName = () => {
    if (tempName.trim()) {
      onUpdateName(tempName.trim());
    }
    setIsEditingName(false);
  };

  const handleCancelName = () => {
    setTempName(profile.name);
    setIsEditingName(false);
  };

  const handleSaveLocation = () => {
    if (tempLocation.trim()) {
      onUpdateLocation(tempLocation.trim());
    }
    setIsEditingLocation(false);
  };

  const handleCancelLocation = () => {
    setTempLocation(profile.location);
    setIsEditingLocation(false);
  };

  const handleSelectImageFile = (
    event: React.ChangeEvent<HTMLInputElement>,
    onImageReady: (image: string) => void,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const source = new Image();
      source.onload = () => {
        const maxSize = 512;
        const scale = Math.min(1, maxSize / Math.max(source.width, source.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(source.width * scale));
        canvas.height = Math.max(1, Math.round(source.height * scale));
        const context = canvas.getContext('2d');
        if (!context) return;

        context.drawImage(source, 0, 0, canvas.width, canvas.height);
        onImageReady(canvas.toDataURL('image/jpeg', 0.82));
        setShowAvatarPicker(false);
      };
      source.src = String(reader.result);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  return (
    <section className="w-full bg-[#ffffff] rounded-2xl p-6 sm:p-8 md:p-10 lg:p-12 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.04)] border border-[#c1c6d7]/20 relative overflow-visible group transition-all duration-300">
      {/* Subtle radial background accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0058bc]/5 via-transparent to-transparent pointer-events-none rounded-2xl" />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-8 relative z-10">
        {/* Left: Avatar + Details */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
          {/* Avatar Container with inline picker */}
          <div className={`relative shrink-0 ${showAvatarPicker ? 'z-[300]' : ''}`} ref={avatarPickerRef}>
            <img
              src={profile.avatar}
              alt={`${profile.name} - Chercheur en Informatique`}
              className="!h-24 !w-24 sm:!h-28 sm:!w-28 rounded-full object-cover border-4 border-white shadow-md transition-transform duration-300 group-hover:scale-[1.01]"
            />
            {/* Status dot */}
            <div
              className={`absolute top-1 right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                profile.availabilityBadge ? 'bg-emerald-500' : 'bg-[#0058bc]'
              }`}
              title={profile.availabilityBadge ? 'Disponible pour collaborations' : 'En ligne'}
            />
            {/* Edit Avatar button -> Opens compact inline picker */}
            {!isPublicView && (
              <button
                onClick={() => {
                  setShowAvatarPicker(!showAvatarPicker);
                }}
                id="edit-profile-avatar-btn"
                title="Changer la photo de profil en direct"
                className="absolute bottom-0 right-0 w-8 h-8 bg-[#e2e2e4] rounded-full flex items-center justify-center hover:bg-[#d9dadc] transition-all border border-[#c1c6d7]/40 text-[#1a1c1d] shadow-sm active:scale-95"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}

            {/* Inline Avatar Popover */}
            {showAvatarPicker && (
              <div className="absolute top-full left-0 z-[200] mt-2 w-72 rounded-2xl border border-[#c1c6d7]/40 bg-white p-4 shadow-xl animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-2 border-b border-[#c1c6d7]/20 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1a1c1d] flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-[#0058bc]" />
                    Changer la Photo
                  </span>
                  <button
                    onClick={() => setShowAvatarPicker(false)}
                    className="text-[#717786] hover:text-[#1a1c1d]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2 text-center">
                    <span className="block text-[10px] font-bold uppercase tracking-wide text-[#717786]">Photo de profil</span>
                    <img src={profile.avatar} alt="Photo de profil actuelle" className="aspect-square w-full rounded-xl object-cover" />
                    <label
                      htmlFor="profile-avatar-file"
                      onClick={(event) => event.stopPropagation()}
                      className="flex cursor-pointer items-center justify-center gap-1 rounded-lg border border-dashed border-[#0058bc]/50 bg-blue-50/50 px-2 py-2 text-[10px] font-semibold text-[#0058bc] transition-colors hover:bg-blue-50"
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      Changer la photo
                    </label>
                    <input
                      id="profile-avatar-file"
                      type="file"
                      accept="image/*"
                      onChange={(event) => handleSelectImageFile(event, onUpdateAvatar)}
                      className="sr-only"
                    />
                  </div>

                  <div className="space-y-2 text-center">
                    <span className="block text-[10px] font-bold uppercase tracking-wide text-[#717786]">Image de la carte</span>
                    {profile.researchImage ? (
                      <img src={profile.researchImage} alt="Image de la carte chercheur" className="aspect-square w-full rounded-xl object-cover" />
                    ) : (
                      <div className="flex aspect-square items-center justify-center rounded-xl bg-slate-100 text-[10px] text-[#717786]">Aucune image</div>
                    )}
                    <label
                      htmlFor="research-card-image-file"
                      onClick={(event) => event.stopPropagation()}
                      className="flex cursor-pointer items-center justify-center gap-1 rounded-lg border border-dashed border-[#0058bc]/50 bg-blue-50/50 px-2 py-2 text-[10px] font-semibold text-[#0058bc] transition-colors hover:bg-blue-50"
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      Choisir l’image
                    </label>
                    <input
                      id="research-card-image-file"
                      type="file"
                      accept="image/*"
                      onChange={(event) => handleSelectImageFile(event, onUpdateResearchImage)}
                      className="sr-only"
                    />
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Name & Identity with Inline Edit */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {isEditingName ? (
                <div className="flex items-center gap-2 animate-in fade-in duration-200">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName();
                      if (e.key === 'Escape') handleCancelName();
                    }}
                    autoFocus
                    placeholder="Nom du chercheur"
                    className="px-3 py-1 text-xl sm:text-2xl font-bold rounded-lg border-2 border-[#0058bc] text-[#1a1c1d] outline-none bg-blue-50/30"
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-1.5 rounded-lg bg-[#0058bc] text-white hover:bg-[#004493] transition-colors"
                    title="Enregistrer le nom"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCancelName}
                    className="p-1.5 rounded-lg border border-[#c1c6d7] text-[#717786] hover:bg-[#f3f3f5]"
                    title="Annuler"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1a1c1d]" id="profile-name">
                    {profile.name}
                  </h1>
                  {!isPublicView && (
                    <button
                      onClick={() => {
                        setTempName(profile.name);
                        setIsEditingName(true);
                      }}
                      title="Modifier le nom en direct"
                      className="w-7 h-7 rounded-full border border-[#c1c6d7] text-[#717786] flex items-center justify-center hover:bg-[#f3f3f5] hover:text-[#0058bc] hover:border-[#0058bc] transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

            </div>

            {/* Location & Timezone with Inline Edit */}
            {isEditingLocation ? (
              <div className="flex items-center gap-2 animate-in fade-in duration-200">
                <MapPin className="w-4 h-4 text-[#0058bc] shrink-0" />
                <input
                  type="text"
                  value={tempLocation}
                  onChange={(e) => setTempLocation(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveLocation();
                    if (e.key === 'Escape') handleCancelLocation();
                  }}
                  autoFocus
                  placeholder="Ville, Pays (ex: Manouba, Tunisia)"
                  className="px-2.5 py-0.5 text-xs sm:text-sm rounded-lg border-2 border-[#0058bc] text-[#1a1c1d] outline-none bg-blue-50/30"
                />
                <button
                  onClick={handleSaveLocation}
                  className="p-1 rounded bg-[#0058bc] text-white hover:bg-[#004493]"
                  title="Enregistrer"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleCancelLocation}
                  className="p-1 rounded border border-[#c1c6d7] text-[#717786] hover:bg-[#f3f3f5]"
                  title="Annuler"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-[#414755] font-normal">
                <MapPin className="w-4 h-4 text-[#717786] shrink-0" />
                <span id="profile-location">
                  {detectedCity || profile.location} — {localTime} local time
                </span>
                {!isPublicView && (
                  <button
                    onClick={() => {
                      setTempLocation(profile.location);
                      setIsEditingLocation(true);
                    }}
                    title="Modifier la localisation en direct"
                    className="w-6 h-6 rounded-full border border-transparent hover:border-[#c1c6d7] text-[#717786] hover:text-[#0058bc] flex items-center justify-center transition-all opacity-60 hover:opacity-100"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            {profile.boostProfile && (
              <div className="inline-flex items-center gap-1.5 text-xs text-[#0058bc] font-medium bg-blue-50/80 px-2.5 py-0.5 rounded-full mt-1">
                <Sparkles className="w-3 h-3" />
                <span>Profil mis en avant</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Profile Actions */}
        <div className="flex items-center gap-3 w-full md:w-auto self-stretch md:self-auto pt-2 md:pt-0">
          {isPublicView && showPublicViewBadge && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200/60 rounded-full text-xs font-medium">
              <Eye className="w-3.5 h-3.5 text-amber-600" />
              <span>Aperçu public — Mode lecture seule</span>
            </div>
          )}

          {canTogglePublicView && (
            <button
              onClick={onTogglePublicView}
              id="toggle-public-view-btn"
              className="flex-1 md:flex-none px-6 py-2.5 rounded-full border border-[#1a1c1d] bg-[#1a1c1d] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#414755] active:scale-95 transition-all shadow-sm"
            >
              {isPublicView ? 'Mode Éditeur' : 'Public View'}
            </button>
          )}

          {!isPublicView && (
            <button
              onClick={onSave}
              id="profile-save-btn"
              disabled={isSaving || !isDirty}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#0058bc] px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-[#004493] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 md:flex-none"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          )}

        </div>
      </div>
    </section>
  );
};
