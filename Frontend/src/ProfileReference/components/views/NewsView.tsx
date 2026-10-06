import React from 'react';
import { Calendar, Award, Newspaper, ArrowRight, ExternalLink } from 'lucide-react';

interface NewsViewProps {
  onGoToProfile: () => void;
}

export const NewsView: React.FC<NewsViewProps> = ({ onGoToProfile }) => {
  const news = [
    {
      id: 'news-1',
      date: '14 Août 2024',
      category: 'Acceptation de Papier',
      title: 'Publication acceptée dans IEEE Transactions on Neural Networks',
      description: 'L’article du Dr. Mhamdi B. intitulé "Neural Architecture Optimization" a été formellement accepté pour publication dans la prochaine édition.',
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'news-2',
      date: '02 Juillet 2024',
      category: 'Conférence Internationale',
      title: 'Keynote au Workshop Méditerranéen sur l’IA Neuromorphique',
      description: 'Présentation des résultats de recherche sur la compression d’embeddings vectoriels sur circuits FPGA de faible puissance.',
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'news-3',
      date: '18 Mai 2024',
      category: 'Bourse & Financement',
      title: 'Attribution du programme de soutien à la recherche postdoctorale',
      description: 'Soutien aux projets novateurs en infotronique et circuits intégrés pour le laboratoire d’ingénierie de Carthage.',
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
    },
  ];

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 md:px-12 lg:px-16 py-10 space-y-10 animate-in fade-in duration-300">
      <div className="border-b border-[#c1c6d7]/30 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#0058bc]">
            Actualités Scientifiques
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1a1c1d] tracking-tight mt-1">
            Dernières Nouvelles & Événements
          </h1>
        </div>

        <button
          onClick={onGoToProfile}
          className="px-5 py-2.5 rounded-full border border-[#c1c6d7] text-xs font-semibold uppercase tracking-wider hover:bg-white transition-colors self-start md:self-auto"
        >
          Retour au Profil
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {news.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl overflow-hidden border border-[#c1c6d7]/30 shadow-sm hover:shadow-md transition-all flex flex-col group"
          >
            <div className="aspect-video w-full overflow-hidden bg-slate-100 relative">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute top-3 left-3 px-2.5 py-0.5 bg-white/90 backdrop-blur-md rounded text-[10px] font-bold uppercase text-[#0058bc]">
                {item.category}
              </span>
            </div>

            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-[#717786]">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{item.date}</span>
                </div>
                <h3 className="text-base font-bold text-[#1a1c1d] group-hover:text-[#0058bc] transition-colors leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-[#414755] leading-relaxed line-clamp-3">
                  {item.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[#c1c6d7]/20 flex items-center justify-between text-xs text-[#0058bc] font-semibold">
                <span>Lire le communiqué</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
