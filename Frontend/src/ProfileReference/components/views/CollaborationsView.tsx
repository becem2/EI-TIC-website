import React from 'react';
import { Handshake, Building2, Globe2, Mail, Users, ArrowUpRight } from 'lucide-react';

interface CollaborationsViewProps {
  onContact: () => void;
  onGoToProfile: () => void;
}

export const CollaborationsView: React.FC<CollaborationsViewProps> = ({ onContact, onGoToProfile }) => {
  const partners = [
    {
      name: "Ecole Nationale d'Ingénieurs de Carthage",
      country: 'Tunisie',
      focus: 'Génie Infotronique & Systèmes Embarqués',
      type: 'Institution Académique',
    },
    {
      name: 'Laboratoire Européen de Recherche en Nanoélectronique',
      country: 'France / Suisse',
      focus: 'Circuits Intégrés Asynchrones',
      type: 'Centre de Recherche',
    },
    {
      name: 'Consortium Méditerranéen de Calcul Haute Performance',
      country: 'Région MENA',
      focus: 'Infrastructures Distribuées pour IA',
      type: 'Alliance Scientifique',
    },
  ];

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 md:px-12 lg:px-16 py-10 space-y-12 animate-in fade-in duration-300">
      <div className="border-b border-[#c1c6d7]/30 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#0058bc]">
            Partenariats & Réseaux
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1a1c1d] tracking-tight mt-1">
            Collaborations Internationales & Projets Industriels
          </h1>
          <p className="text-sm text-[#414755] mt-1.5 max-w-2xl">
            LaboRecherche et le Dr. Mhamdi B. collaborent activement avec des universités prestigieuses, instituts technologiques et acteurs industriels du semiconducteur.
          </p>
        </div>

        <button
          onClick={onGoToProfile}
          className="px-5 py-2.5 rounded-full border border-[#c1c6d7] text-xs font-semibold uppercase tracking-wider hover:bg-white transition-colors self-start md:self-auto"
        >
          Retour au Profil
        </button>
      </div>

      {/* Call to Collaboration Banner */}
      <div className="bg-gradient-to-br from-[#001a41] to-[#004493] text-white p-8 sm:p-12 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-blue-200">
            Appel à Projets Ouvert
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold">Vous souhaitez collaborer sur une recherche ?</h2>
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
            Le Dr. Mhamdi B. est ouvert aux co-supervisions de thèses, projets de recherche conjoints H2020 / Horizon Europe, et missions d'expertise en conception d'accélérateurs IA.
          </p>
        </div>

        <a
          href="mailto:contact@laborecherche.com?subject=Proposition de collaboration de recherche"
          className="px-8 py-3 bg-white text-[#001a41] hover:bg-blue-50 text-xs font-bold uppercase tracking-wider rounded-full shadow-lg transition-all active:scale-95 shrink-0 flex items-center gap-2"
        >
          <Mail className="w-4 h-4 text-[#0058bc]" />
          <span>Contacter le Laboratoire</span>
        </a>
      </div>

      {/* Partners List */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-[#1a1c1d] flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#0058bc]" />
          <span>Partenaires Académiques & Industriels</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {partners.map((p, idx) => (
            <div
              key={idx}
              className="bg-white p-6 rounded-2xl border border-[#c1c6d7]/30 shadow-sm space-y-3"
            >
              <div className="flex justify-between items-start">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-[#f3f3f5] text-[#414755]">
                  {p.type}
                </span>
                <span className="text-xs text-[#717786]">{p.country}</span>
              </div>
              <h4 className="font-bold text-base text-[#1a1c1d]">{p.name}</h4>
              <p className="text-xs text-[#414755]">
                <strong className="text-[#1a1c1d]">Axe : </strong>
                {p.focus}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
