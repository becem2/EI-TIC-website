import React from 'react';
import { Cpu, Microchip, Layers, Award, Target, Compass, Sparkles } from 'lucide-react';

interface AboutViewProps {
  onGoToProfile: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onGoToProfile }) => {
  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 md:px-12 lg:px-16 py-10 space-y-12 animate-in fade-in duration-300">
      {/* Hero presentation */}
      <div className="bg-white rounded-3xl p-8 md:p-14 border border-[#c1c6d7]/30 shadow-sm relative overflow-hidden">
        <div className="max-w-3xl space-y-4 relative z-10">
          <span className="text-xs font-bold uppercase tracking-widest text-[#0058bc]">
            Laboratoire d'Excellence
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold text-[#1a1c1d] tracking-tight leading-tight">
            LaboRecherche : Pionnier en Informatique Cognitive & Architectures Matérielles
          </h1>
          <p className="text-base sm:text-lg text-[#414755] leading-relaxed">
            Fondé avec la mission de rapprocher les neurosciences computationnelles et le génie microélectronique, LaboRecherche conçoit les processeurs intelligents et algorithmes économes en énergie de prochaine génération.
          </p>
          <div className="pt-2">
            <button
              onClick={onGoToProfile}
              className="px-6 py-3 rounded-full bg-[#0058bc] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#004493] transition-all shadow-md"
            >
              Découvrir les Travaux du Dr. Mhamdi B.
            </button>
          </div>
        </div>
      </div>

      {/* 3 Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-2xl border border-[#c1c6d7]/30 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0058bc] flex items-center justify-center">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-[#1a1c1d]">Puces Neuromorphiques</h3>
          <p className="text-sm text-[#414755] leading-relaxed">
            Conception de circuits intégrés asynchrones imitant la dynamique synaptique des neurones biologiques pour une consommation pico-joule par opération.
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-[#c1c6d7]/30 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0058bc] flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-[#1a1c1d]">Modélisation Cognitive</h3>
          <p className="text-sm text-[#414755] leading-relaxed">
            Développement de modèles sémantiques et de représentations vectorielles denses pour la compréhension multimodale du langage et du raisonnement.
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-[#c1c6d7]/30 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0058bc] flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-[#1a1c1d]">IA Embarquée & Edge</h3>
          <p className="text-sm text-[#414755] leading-relaxed">
            Quantification agressive et déploiement de modèles de fondation sur microcontrôleurs et architectures FPGA sous contrainte temps réel.
          </p>
        </div>
      </div>

      {/* Infrastructure & Research Platform */}
      <div className="bg-[#001a41] text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
            Plateforme Technologique
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold">Plateforme de Prototypage Silicium & Cluster IA</h2>
          <p className="text-sm text-white/80 leading-relaxed">
            LaboRecherche dispose d'un banc de caractérisation haute fréquence, d'une ferme de bancs de test FPGA Xilinx UltraScale+, ainsi que d'un cluster GPU haute densité dédié à l'entraînement de modèles d'architecture neuronale automatique (NAS).
          </p>
        </div>
      </div>
    </div>
  );
};
