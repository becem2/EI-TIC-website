import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  Bookmark,
  Calendar,
  Check,
  ChevronRight,
  User,
  Users,
} from 'lucide-react';
import { ParticleCanvas } from '../Components/ParticleCanvas';

type NewsItem = {
  id: string;
  category: string;
  categoryColor: string;
  categoryTextColor: string;
  date: string;
  title: string;
  snippet: string;
  fullText: string;
  imageUrl: string;
  imageAlt: string;
  actionText: string;
  type: 'publication' | 'event' | 'innovation';
  authorOrLocation: string;
};

const stats = [
  {
    id: 'chercheurs',
    number: '150+',
    title: 'Chercheurs',
    description: 'Des esprits brillants dédiés à la recherche fondamentale.',
    icon: Users,
    detail: 'Nos 150+ chercheurs permanents, post-doctorants et doctorants travaillent dans 6 grands domaines d’innovation.',
    topics: ['Biologie Moléculaire', 'Physique Quantique', 'Nanotechnologies', 'Bio-informatique', 'Aérospatial', 'Énergies Propres'],
  },
  {
    id: 'evenements',
    number: '0',
    title: 'Événements',
    description: 'Les événements scientifiques proposés par notre communauté.',
    icon: Calendar,
    detail: 'Conférences, ateliers et rencontres scientifiques organisés par le laboratoire.',
    topics: ['Conférences', 'Ateliers', 'Symposiums'],
  },
  {
    id: 'publications',
    number: '1.2K',
    title: 'Publications',
    description: 'Articles revus par les pairs publiés annuellement.',
    icon: BookOpen,
    detail: 'Des publications régulières dans Nature, Science, PhysRev et d’autres revues scientifiques majeures.',
    topics: ['Nature & Science', 'Accès Ouvert', '350+ Brevets', 'Impact Factor Moyen > 8.5'],
  },
];

const newsData: NewsItem[] = [
  {
    id: 'nano-synth',
    category: 'Publication',
    categoryColor: 'bg-[#d8e2ff]',
    categoryTextColor: 'text-[#001a41]',
    date: '12 Oct 2023',
    title: 'Nouvelle percée dans la synthèse des nanomatériaux',
    snippet:
      "L'équipe du Dr. Laurent a publié des résultats prometteurs concernant la stabilité thermique de nouvelles structures moléculaires.",
    fullText: `
L'équipe de recherche fondamentale dirigée par le Dr. Henri Laurent vient de publier une étude majeure dans la revue internationale Nature Materials.

### Points Clés de l'Étude
- **Résistance Thermique Accrue :** Les nouveaux nanomatériaux hybrides conservent leur structure cristalline jusqu'à des températures dépassant 1 400 °C.
- **Applications Spatiales et Énergétiques :** Ces nanostructures ouvrent la voie à des puces électroniques haute température pour l'aéronautique et les réacteurs à fusion.
- **Synthèse Éco-compatible :** Le procédé de fabrication développé réduit la consommation de solvants toxiques de 85%.

> "Cette découverte remet en question les modèles thermodynamiques conventionnels à l'échelle nanométrique," précise le Dr. Laurent.

Les tests de validation en conditions extrêmes se poursuivront en partenariat avec le Centre National d'Études Spatiales.
    `,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBr5to5G4h9eYZit0xOLF4SZNm16KjvPXB_9B-hRULWDwqR9FdfxpWiDuKTDdHmgOGKpJa5A2AgDRC0Q7jOI7Bamgx0pUcPFky8f0DDcLQmdSMrnNQMmPvYsZuyUC0NwFQtXTALvPWJhBE_NuVKhZRM593HuyRSQfpZOqlB-cl2lEk7Z9gtZAQjxSOUo-D6vHr7mDvXjLpFMW8_0sOy5GWeZ7DH9uVnif9WTqDAA3xQBaO7nyggH2A8Fw',
    imageAlt: 'A macro photography shot of a glowing blue liquid in a pristine glass beaker in a sterile ultra-modern laboratory',
    actionText: "Lire l'article",
    type: 'publication',
    authorOrLocation: 'Dr. Henri Laurent & Équipe Matériaux',
  },
  {
    id: 'bio-symposium',
    category: 'Événement',
    categoryColor: 'bg-[#e3e2e7]',
    categoryTextColor: 'text-[#1a1b1f]',
    date: '28 Oct 2023',
    title: 'Symposium Annuel de Bio-informatique 2023',
    snippet:
      "Rejoignez-nous pour trois jours de conférences, d'ateliers et de présentations sur l'avenir de l'analyse des données génomiques.",
    fullText: `
Le grand rendez-vous annuel du laboratoire réunira plus de 300 experts internationaux en génomique computationnelle, intelligence artificielle et biologie des systèmes.

### Programme Officiel
- **Jour 1 :** Alignement de séquences ADN par modèles de fondation & deep learning.
- **Jour 2 :** Analyse de données de cellules uniques (Single-cell RNA-seq).
- **Jour 3 :** Ateliers pratiques & Hackathon de modélisation protéique.

**Lieu :** Grand Amphithéâtre Pasteur - Bâtiment Central
**Format :** Hybride (Présentiel et Visioconférence HD)
**Lien d'inscription :** Remplissez le formulaire ci-dessous pour réserver votre badge.
    `,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDZ4PZCx_EP6uENqTVXVu002ohf2vqnc0Qltm5PJTLXQ51z8YbD0Bs-s1kCiqYSeMJVK5vbwAykHJIAGDN__tTKefos07WZKRN4p75JHcF3CWpPkhEwiJEVuQ-wTvuILsnCzsqUPY7QHtnhlEX5wGyuUZQ-5O4RNqRRoQJGH3oEajZj_L_pYzYLP4shPJHoXRlI2KmL3ol1jE69HDRuWGc4-oBOA4HoLP80yq_k0ILyV6cRYKgPaBxXFA',
    imageAlt: 'Wide angle shot of a sleek conference hall with rows of empty white chairs facing a large screen with complex data visualizations',
    actionText: "S'inscrire",
    type: 'event',
    authorOrLocation: 'Amphithéâtre Pasteur & En Ligne',
  },
  {
    id: 'imaging-acquisition',
    category: 'Innovation',
    categoryColor: 'bg-[#e2e2e2]',
    categoryTextColor: 'text-[#646464]',
    date: '05 Nov 2023',
    title: "Acquisition de nouveaux équipements d'imagerie",
    snippet:
      "Le laboratoire central vient de s'équiper d'un microscope électronique à balayage de dernière génération pour l'analyse structurelle.",
    fullText: `
Grâce au soutien du Ministère de la Recherche et des Partenaires Industriels, le département d'imagerie s'enrichit d'un microscope électronique Cryo-TEM de résolution sub-angström.

### Capabilités Techniques Exceptionnelles
- **Résolution spatiale :** 0.07 nanomètre (analyse atomique directe).
- **Cryo-Fixation Ultra-Rapide :** Conservation des échantillons biologiques dans leur état natif sans altération.
- **Micro-analyse EDS :** Cartographie élémentaire en temps réel avec détecteur X-ray multi-canal.

Cet équipement est accessible à tous les chercheurs du consortium ainsi qu'aux entreprises partenaires sur réservation d'astreinte.
    `,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBeQNQXAZrwmOt3Zt1JJXZaQAkw4aHTDLeu-XHstCbNFvlBsqQpDwe9OaQk7VTru5P7r8hTE0l1P62ArwHeb2RUkW61eIlkfG6xDDRADLBLqNUSylM6l7DA1zsk-Zmm4oOh7F6BzJq0zsHmEbJ0nEHTsl0Raw5uJg-P-aWFzmAmRUQlWe4FEocwweThTqaJ7NZEbjakWaffHOHEoI3pAOFsJTQprh1u4iQXHVBAy-i3g7uP0tvIm6HYXw',
    imageAlt: 'Close-up of a sophisticated robotic arm handling delicate glass vials in a sterile white environment',
    actionText: 'Découvrir',
    type: 'innovation',
    authorOrLocation: 'Plateforme Centrale d’Imagerie Atomique',
  },
];

const actualiteToNewsItem = (actualite: any, index: number): NewsItem => ({
  id: actualite._id || actualite.id || `actualite-${index}`,
  category: actualite.category || 'Événement',
  categoryColor: 'bg-[#d8e2ff]',
  categoryTextColor: 'text-[#001a41]',
  date: actualite.date || 'Date à préciser',
  title: actualite.title || 'Actualité sans titre',
  snippet: actualite.excerpt || actualite.content || 'Aucune description disponible.',
  fullText: actualite.content || actualite.excerpt || 'Aucun contenu disponible.',
  imageUrl: actualite.imageUrl || newsData[index % newsData.length]?.imageUrl || '',
  imageAlt: actualite.title || 'Actualité scientifique',
  actionText: 'Lire l’article',
  type: actualite.category === 'Événement' ? 'event' : 'innovation',
  authorOrLocation: actualite.author || 'Équipe de recherche',
});

function Hero() {
  const navigate = useNavigate();
  const scrollToStats = () => {
    document.getElementById('stats-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="hero" className="relative -mt-6 flex min-h-screen items-center justify-center overflow-hidden pt-20">
      <ParticleCanvas />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,_rgba(0,93,191,0.14),_transparent_22%),linear-gradient(180deg,#f9f9fb_0%,#f3f3f5_100%)]" />
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
        <div className="h-[42rem] w-[42rem] rounded-full bg-[#dfeafd]/40 blur-3xl" />
      </div>

      <div className="relative z-20 mx-auto my-auto max-w-4xl px-5 py-16 text-center md:px-16">
        <h1 className="mb-6 text-3xl font-bold leading-[1.12] tracking-tight text-[#1a1c1d] sm:text-5xl md:text-6xl">
          Pousser les frontières de la connaissance.
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-[#414755] sm:text-lg md:text-xl">
          Une institution dédiée à l'exploration scientifique rigoureuse, à l'innovation fondamentale et à la découverte interdisciplinaire.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate('/Publications')}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1a1c1d] px-8 py-4 text-sm font-medium tracking-wide text-white shadow-md transition-all duration-300 hover:bg-[#0058bc] hover:shadow-lg sm:w-auto group"
          >
            Explorer nos travaux
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/Chercheurs')}
            className="w-full rounded-full border border-[#717786]/40 bg-transparent px-8 py-4 text-sm font-medium text-[#1a1c1d] transition-all duration-300 hover:border-[#0058bc] hover:bg-white/80 sm:w-auto backdrop-blur-sm"
          >
            Découvrir les équipes
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={scrollToStats}
        className="group absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 animate-bounce cursor-pointer flex-col items-center focus:outline-none"
        aria-label="Découvrir"
      >
        <span className="mb-2 text-xs font-medium text-[#414755] transition-colors group-hover:text-[#0058bc]">
          Découvrir
        </span>
        <ArrowDown className="h-5 w-5 text-[#414755] transition-colors group-hover:text-[#0058bc]" />
      </button>
    </section>
  );
}

function StatsSection() {
  const navigate = useNavigate();
  const [liveStats, setLiveStats] = useState(stats);

  const statRoutes: Record<string, string> = {
    chercheurs: '/Chercheurs',
    evenements: '/Actualites',
    publications: '/Publications',
  };

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [researchersResponse, publicationsResponse, actualitesResponse] = await Promise.all([
          axios.get('/api/users/researchers'),
          axios.get('/api/users/publications'),
          axios.get('/api/users/actualites'),
        ]);
        const researcherCount = Array.isArray(researchersResponse.data) ? researchersResponse.data.length : 0;
        const publicationCount = Array.isArray(publicationsResponse.data) ? publicationsResponse.data.length : 0;
        const eventCount = Array.isArray(actualitesResponse.data) ? actualitesResponse.data.length : 0;

        setLiveStats((currentStats) => currentStats.map((stat) => {
          if (stat.id === 'chercheurs') return { ...stat, number: String(researcherCount) };
          if (stat.id === 'evenements') return { ...stat, number: String(eventCount) };
          if (stat.id === 'publications') return { ...stat, number: String(publicationCount) };
          return stat;
        }));
      } catch (error) {
        console.error('Failed to load homepage statistics', error);
      }
    };

    void loadStats();
  }, []);

  return (
    <section id="stats-section" className="relative border-y border-gray-200/50 bg-[#f3f3f5] px-5 py-28 md:px-16">
      <div className="relative z-10 mx-auto max-w-[1440px]">
        <div className="mb-12 text-center">
          <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#0058bc]">
            Chiffres Clés
          </span>
          <h2 className="mt-3 text-2xl font-bold text-[#1a1c1d] md:text-3xl">
            L'Impact Scientifique en Chiffres
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {liveStats.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <div
                key={stat.id}
                onClick={() => {
                  const targetRoute = statRoutes[stat.id];
                  if (targetRoute) {
                    navigate(targetRoute);
                  }
                }}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/40 bg-white/70 p-8 text-center shadow-[0_40px_40px_-5px_rgba(0,0,0,0.05)] backdrop-blur-[20px] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_45px_45px_-5px_rgba(0,0,0,0.08)]"
              >
                <div className="absolute right-4 top-4 text-gray-300 transition-colors group-hover:text-[#0058bc]">
                  <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </div>

                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#0058bc] transition-colors duration-300 group-hover:bg-[#0058bc] group-hover:text-white">
                  <IconComponent className="h-6 w-6" />
                </div>

                <div className="mb-2 text-4xl font-bold tracking-tight text-[#0058bc] md:text-5xl">
                  {stat.number}
                </div>

                <h3 className="mb-2 text-xl font-semibold text-[#1a1c1d]">{stat.title}</h3>

                <p className="text-sm leading-relaxed text-[#414755] md:text-base">{stat.description}</p>

                <div className="mt-4 flex items-center justify-center gap-1 border-t border-gray-100 pt-4 text-xs font-medium text-[#0058bc] opacity-0 transition-opacity group-hover:opacity-100">
                  En savoir plus
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function NewsSection() {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState<string>('Tous');
  const [activeModalItem, setActiveModalItem] = useState<NewsItem | null>(null);
  const [savedArticles, setSavedArticles] = useState<Record<string, boolean>>({});
  const [recentNews, setRecentNews] = useState<NewsItem[]>([]);

  const filterCategories = ['Tous', 'Événements', 'Distinctions', 'Conférences'];

  useEffect(() => {
    const loadRecentNews = async () => {
      try {
        const response = await axios.get('/api/users/actualites');
        const actualites = Array.isArray(response.data) ? response.data : [];
        setRecentNews(actualites.slice(0, 3).map(actualiteToNewsItem));
      } catch (error) {
        console.error('Failed to load recent actualites', error);
        setRecentNews([]);
      }
    };

    void loadRecentNews();
  }, []);

  const filteredNews = recentNews.filter((item) => {
    if (selectedFilter === 'Tous') return true;
    return item.category === selectedFilter;
  });

  const toggleSave = (id: string) => {
    setSavedArticles((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section id="news-section" className="bg-[#f9f9fb] px-5 py-28 md:px-16">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-[#1a1c1d] md:text-4xl">
              Actualités et Événements Récents
            </h2>
            <p className="max-w-2xl text-base leading-relaxed text-[#414755] md:text-lg">
              Restez informé des dernières avancées, publications et symposiums de notre communauté de recherche.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/Actualites')}
            className="hidden items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0058bc] transition-colors hover:text-[#0070eb] group md:flex"
          >
            Voir tout
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        <div className="mb-10 flex flex-wrap gap-2">
          {filterCategories.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setSelectedFilter(filter)}
              className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${selectedFilter === filter
                  ? 'bg-[#1a1c1d] text-white shadow-sm'
                  : 'bg-[#eeeef0] text-[#414755] hover:bg-[#e2e2e4]'
                }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredNews.map((item) => (
            <article
              key={item.id}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#c1c6d7]/30 bg-white shadow-[0_40px_40px_-5px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#0058bc]/40 hover:shadow-[0_45px_45px_-5px_rgba(0,0,0,0.08)]"
            >
              <div className="relative h-64 w-full overflow-hidden bg-gray-100">
                <img
                  src={item.imageUrl}
                  alt={item.imageAlt}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSave(item.id);
                  }}
                  className={`absolute right-4 top-4 rounded-full p-2 backdrop-blur-md transition-colors ${savedArticles[item.id] ? 'bg-[#0058bc] text-white' : 'bg-white/80 text-gray-700 hover:bg-white'
                    }`}
                  title={savedArticles[item.id] ? 'Article sauvegardé' : 'Sauvegarder'}
                >
                  <Bookmark className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-grow flex-col p-8">
                <div className="mb-4 flex items-center gap-4">
                  <span className={`${item.categoryColor} ${item.categoryTextColor} rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-wider`}>
                    {item.category}
                  </span>
                  <time className="text-xs font-medium text-[#414755]">{item.date}</time>
                </div>

                <h3 className="mb-3 text-xl font-bold leading-snug text-[#1a1c1d] transition-colors group-hover:text-[#0058bc]">
                  {item.title}
                </h3>

                <p className="mb-8 flex-grow text-sm leading-relaxed text-[#414755] line-clamp-3">
                  {item.snippet}
                </p>

                <button
                  type="button"
                  onClick={() => setActiveModalItem(item)}
                  className="mt-auto flex items-center gap-2 text-left text-xs font-semibold uppercase tracking-wider text-[#0058bc] transition-all hover:gap-3"
                >
                  {item.actionText}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 md:hidden">
          <button
            type="button"
            onClick={() => navigate('/Actualites')}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-[#c1c6d7] bg-white py-3 text-xs font-semibold uppercase tracking-wider text-[#0058bc]"
          >
            Voir toutes les actualités
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {activeModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-md">
          <div className="relative my-8 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
            <div className="relative h-64 w-full shrink-0 sm:h-72">
              <img
                src={activeModalItem.imageUrl}
                alt={activeModalItem.imageAlt}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => setActiveModalItem(null)}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black"
                aria-label="Fermer"
              >
                ✕
              </button>
              <div className="absolute bottom-4 left-4 flex gap-2">
                <span className={`${activeModalItem.categoryColor} ${activeModalItem.categoryTextColor} rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wider shadow-sm`}>
                  {activeModalItem.category}
                </span>
              </div>
            </div>

            <div className="space-y-6 overflow-y-auto p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-4 text-xs text-[#414755]">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#0058bc]" />
                  <span>{activeModalItem.date}</span>
                </div>
                {activeModalItem.authorOrLocation && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-[#0058bc]" />
                    <span>{activeModalItem.authorOrLocation}</span>
                  </div>
                )}
              </div>

              <h2 className="text-2xl font-bold leading-tight text-[#1a1c1d] sm:text-3xl">
                {activeModalItem.title}
              </h2>

              <div className="space-y-4 whitespace-pre-line text-sm leading-relaxed text-[#414755] sm:text-base">
                {activeModalItem.fullText}
              </div>

              {activeModalItem.type === 'event' && (
                <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5">
                  <div className="mb-2 flex items-center gap-2 text-[#0058bc]">
                    <Check className="h-4 w-4" />
                    <span className="text-sm font-semibold">Inscription confirmée</span>
                  </div>
                  <p className="text-sm text-[#414755]">
                    Votre place a bien été réservée pour l'événement. Un email de confirmation vous a été envoyé.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default function Acceuil() {
  return (
    <>
      <Hero />
      <StatsSection />
      <NewsSection />
    </>
  );
}
