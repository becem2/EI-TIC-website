import React, { useState } from 'react';
import { PublicationItem } from '../../types';
import { Search, Filter, ExternalLink } from 'lucide-react';

interface PublicationsViewProps {
  publications: PublicationItem[];
  onSelectPublication: (pub: PublicationItem) => void;
  onGoToProfile: () => void;
}

export const PublicationsView: React.FC<PublicationsViewProps> = ({
  publications,
  onSelectPublication,
  onGoToProfile,
}) => {
  const [search, setSearch] = useState('');
  const [filterTopic, setFilterTopic] = useState('all');

  const allPubs: PublicationItem[] = [
    ...publications,
    {
      id: 'pub-catalog-3',
      title: 'Accélérateurs neuronaux à impulsions hétérogènes pour la navigation autonome',
      status: 'published',
      journal: 'IEEE Micro & Embedded Systems Letters',
      year: 2024,
      doi: '10.1109/LMES.2024.1049281',
      abstract: 'Coprocesseur matériel dédié au traitement des événements de réseaux neuronaux à impulsions, avec une latence inférieure à dix microsecondes.',
      authors: ['Dr. Mhamdi B.', 'Prof. K. Ben Salem'],
      keywords: ['SNN', 'Traitement des impulsions', 'Robotique'],
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'pub-catalog-4',
      title: 'Quantification de transformeurs sous contrainte énergétique sur des NPU en périphérie',
      status: 'published',
      journal: 'Journal of Systems Architecture (Elsevier)',
      year: 2023,
      doi: '10.1016/j.sysarc.2023.102891',
      abstract: 'Méthodes de quantification non uniforme après entraînement appliquées à des transformeurs visuels multimodaux pour des cartes IoT en périphérie.',
      authors: ['Dr. Mhamdi B.', 'Dr. S. Larbi'],
      keywords: ['NPU en périphérie', 'Transformeurs', 'Quantification'],
      image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
    },
  ];

  const filtered = allPubs.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.abstract?.toLowerCase().includes(search.toLowerCase()) ||
      p.keywords?.some((k) => k.toLowerCase().includes(search.toLowerCase()));

    if (filterTopic === 'all') return matchesSearch;
    return matchesSearch && p.keywords?.some((k) => k.toLowerCase().includes(filterTopic.toLowerCase()));
  });

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 md:px-12 lg:px-16 py-10 space-y-10 animate-in fade-in duration-300">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#c1c6d7]/30 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#0058bc]">
            Laboratoire de Recherche de Pointe
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1a1c1d] tracking-tight mt-1">
            Répertoire des Publications
          </h1>
          <p className="text-sm text-[#414755] mt-1.5 max-w-2xl">
            Accédez à l'ensemble des articles, preprints et contributions académiques des chercheurs de LaboRecherche en accès ouvert.
          </p>
        </div>

        <button
          onClick={onGoToProfile}
          className="self-start md:self-auto px-5 py-2.5 rounded-full border border-[#c1c6d7] text-xs font-semibold uppercase tracking-wider hover:bg-white transition-colors"
        >
          Retour au Profil du Dr. Mhamdi
        </button>
      </div>

      {/* Search & Filter bar */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#c1c6d7]/30 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#717786] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par titre, auteur, mot-clé (ex: Neural, SNN, Hardware)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#f3f3f5] border border-[#c1c6d7]/30 text-xs focus:bg-white focus:border-[#0058bc] outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#717786]" />
          <select
            value={filterTopic}
            onChange={(e) => setFilterTopic(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-[#f3f3f5] border border-[#c1c6d7]/30 text-xs focus:bg-white focus:border-[#0058bc] outline-none"
          >
            <option value="all">Tous les thèmes</option>
            <option value="cognitive">Informatique Cognitive</option>
            <option value="neural">Réseaux de Neurones</option>
            <option value="hardware">Hardware & Microélectronique</option>
            <option value="robotics">Robotique & SNN</option>
          </select>
        </div>
      </div>

      {/* Publications List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filtered.map((pub) => (
          <div
            key={pub.id}
            onClick={() => onSelectPublication(pub)}
            className="bg-white p-6 rounded-2xl border border-[#c1c6d7]/30 shadow-sm hover:shadow-md hover:border-[#0058bc]/40 transition-all cursor-pointer flex flex-col gap-3 group text-left"
          >
            <div className="flex justify-between items-start gap-3">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-[#f3f3f5] text-[#414755]">
                  {pub.type || 'Publication'}
                </span>
                <span className="shrink-0 text-xs text-[#717786]">{pub.year || 2024}</span>
            </div>
            <h3 className="font-bold text-base text-[#1a1c1d] group-hover:text-[#0058bc] transition-colors leading-snug">
              {pub.title}
            </h3>
            {pub.journal && <p className="text-xs font-medium text-[#0058bc]">{pub.journal}</p>}
            <p className="text-xs text-[#414755] line-clamp-3 leading-relaxed">
              {pub.abstract || "Aucun résumé n’est disponible pour cette publication."}
            </p>
            {pub.keywords && pub.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {pub.keywords.map((keyword, index) => (
                  <span key={`${keyword}-${index}`} className="rounded-full bg-[#f3f3f5] px-2 py-0.5 text-[10px] text-[#414755]">
                    {keyword}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-auto pt-3 border-t border-[#c1c6d7]/20 flex items-center justify-between gap-3 text-xs text-[#717786]">
              <span className="truncate">{pub.authors?.join(', ') || 'Auteur non renseigné'}</span>
              <span className="shrink-0 text-[#0058bc] font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>Lire</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-[#717786]">Aucune publication ne correspond à votre recherche.</p>
        )}
      </div>
    </div>
  );
};
