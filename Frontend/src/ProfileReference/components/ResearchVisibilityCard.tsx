import React from 'react';
import { Edit3, Radio, Sparkles } from 'lucide-react';

interface ResearchVisibilityCardProps {
  availabilityBadge: boolean;
  boostProfile: boolean;
  isPublicView: boolean;
  onToggleAvailability: () => void;
  onToggleBoost: () => void;
}

export const ResearchVisibilityCard: React.FC<ResearchVisibilityCardProps> = ({
  availabilityBadge,
  boostProfile,
  isPublicView,
  onToggleAvailability,
  onToggleBoost,
}) => {
  return (
    <div className="bg-[#001a41] text-white rounded-2xl p-6 relative overflow-hidden shadow-lg border border-blue-900/50">
      {/* Radial glow accent */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#0058bc]/40 via-transparent to-transparent opacity-60 pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg sm:text-xl tracking-tight">Visibilité scientifique</h3>
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Radio className="w-4 h-4 text-blue-300 animate-pulse" />
          </div>
        </div>

        <div className="space-y-4">
          {/* Availability Badge Row */}
          <div
            onClick={!isPublicView ? onToggleAvailability : undefined}
            className={`flex items-center justify-between border-b border-white/10 pb-4 ${
              !isPublicView ? 'cursor-pointer group hover:bg-white/[0.03] p-1.5 -mx-1.5 rounded-lg transition-colors' : ''
            }`}
          >
            <div>
              <h4 className="text-[11px] font-medium text-white/75 uppercase tracking-wider mb-0.5">
                Badge de disponibilité
              </h4>
              <p className={`text-base font-medium flex items-center gap-2 ${availabilityBadge ? 'text-emerald-400' : 'text-white'}`}>
                {availabilityBadge ? 'Activé (Disponible)' : 'Désactivé'}
                {availabilityBadge && <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" />}
              </p>
            </div>
            {!isPublicView && (
              <button
                type="button"
                className="w-7 h-7 rounded-full flex items-center justify-center text-white/50 group-hover:text-white group-hover:bg-white/10 transition-all"
                title="Basculer le badge de disponibilité"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Boost Profile Row */}
          <div
            onClick={!isPublicView ? onToggleBoost : undefined}
            className={`flex items-center justify-between pb-1 ${
              !isPublicView ? 'cursor-pointer group hover:bg-white/[0.03] p-1.5 -mx-1.5 rounded-lg transition-colors' : ''
            }`}
          >
            <div>
              <h4 className="text-[11px] font-medium text-white/75 uppercase tracking-wider mb-0.5">
                Mettre le profil en avant
              </h4>
              <p className={`text-base font-medium flex items-center gap-2 ${boostProfile ? 'text-amber-300' : 'text-white'}`}>
                {boostProfile ? 'Activé (Mis en avant)' : 'Désactivé'}
                {boostProfile && <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
              </p>
            </div>
            {!isPublicView && (
              <button
                type="button"
                className="w-7 h-7 rounded-full flex items-center justify-center text-white/50 group-hover:text-white group-hover:bg-white/10 transition-all"
                title="Activer la mise en avant"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
