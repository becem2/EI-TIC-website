import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { ArrowRight, Calendar, Clock, X } from 'lucide-react';
import type { NewsArticle } from '../types';

const FALLBACK_ARTICLES: NewsArticle[] = [
  {
    id: 'news-1',
    title: 'Grand Prix Scientifique 2024 attribué au Dr. Marie Martin',
    category: 'Distinction',
    date: '14 Juillet 2024',
    author: 'Direction de la Communication',
    readTime: '3 min',
    excerpt:
      'L’Académie des Sciences honore nos travaux sur les polymères biodégradables destinés à la médecine régénérative.',
    content:
      'Le Dr. Marie Martin et son équipe ont reçu la distinction annuelle pour leurs travaux majeurs sur la libération vectorisée de traitements thérapeutiques...',
    imageUrl:
      'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=600',
    isImportant: true,
  },
  {
    id: 'news-2',
    title: 'Inauguration du supercalculateur quantique de nouvelle génération',
    category: 'Événement',
    date: '28 Juin 2024',
    author: 'Équipe Infrastructure',
    readTime: '5 min',
    excerpt:
      'LaboRecherche se dote d’un nœud de calcul hybride pour accélérer les simulations multi-échelles.',
    content:
      'En présence des représentants ministériels et des partenaires industriels, la nouvelle plateforme de calcul haute performance a été mise en service...',
    imageUrl:
      'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=600',
    isImportant: true,
  },
  {
    id: 'news-3',
    title: 'Colloque international sur la résilience climatique urbaine (ICUCD)',
    category: 'Conférence',
    date: '10 Mai 2024',
    author: 'Dr. Luc Bernard',
    readTime: '4 min',
    excerpt:
      'Plus de 300 experts mondiaux réunis dans notre amphi central pour débattre de la modélisation des villes soutenables.',
    content:
      'Les échanges ont permis de poser les bases de la charte de coopération européenne pour l’échange de données climatiques ouvertes...',
    imageUrl:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'news-4',
    title: 'Une nouvelle plateforme de détection précoce des maladies cardiovasculaires',
    category: 'Découverte',
    date: '02 Mai 2024',
    author: 'Équipe de recherche biomédicale',
    readTime: '6 min',
    excerpt:
      'Nos chercheurs démontrent une précision supérieure avec un capteur portable à faible coût.',
    content:
      'La nouvelle solution combine intelligence artificielle et biométrie au service du suivi cardiaque à distance, avec un diagnostic précoce renforcé...',
    imageUrl:
      'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'news-5',
    title: 'Partenariat stratégique avec le réseau européen des villes intelligentes',
    category: 'Partenariat',
    date: '19 Avril 2024',
    author: 'Direction de l’innovation',
    readTime: '4 min',
    excerpt:
      'Un accord de collaboration pour accélérer les projets de transition énergétique et numérique.',
    content:
      'Les institutions partenaires s’engagent à co-construire des infrastructures soutenables, de nouveaux outils de simulation et des modèles open data...',
    imageUrl:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'news-6',
    title: 'Conférence de clôture des projets Horizon Europe 2024',
    category: 'Conférence',
    date: '09 Avril 2024',
    author: 'Service scientifique',
    readTime: '5 min',
    excerpt:
      'Une journée de restitution scientifique et d’échange avec les acteurs industriels et académiques.',
    content:
      'Les équipes ont présenté les premiers résultats de leurs démonstrateurs, avec un focus sur la mise en œuvre industrielle des outils développés...',
    imageUrl:
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=600',
  },
];

const categoryOptions = ['Événement', 'Découverte', 'Distinction', 'Partenariat', 'Conférence'];

const normalizeActualites = (items: any[]): NewsArticle[] =>
  items.map((item) => ({
    id: item._id || item.id || String(Math.random()),
    title: item.title || 'Actualité sans titre',
    category: categoryOptions.includes(item.category) ? item.category : 'Événement',
    date: item.date || 'Date à préciser',
    author: item.author || 'Équipe de recherche',
    readTime: item.readTime || '3 min',
    excerpt: item.excerpt || item.content || 'Aucune description disponible.',
    content: item.content || item.excerpt || 'Aucune description disponible.',
    imageUrl: item.imageUrl || '',
    isImportant: Boolean(item.isImportant),
  }));

function Actualites() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSubmissionSuccess, setShowSubmissionSuccess] = useState(false);
  const [role, setRole] = useState<number | null>(null);
  const [currentUserName, setCurrentUserName] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: '',
    category: 'Événement',
    date: '',
    author: '',
    readTime: '',
    excerpt: '',
    content: '',
    imageUrl: '',
    isImportant: false,
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await axios.get('/api/users/actualites');
        setArticles(Array.isArray(response.data) ? normalizeActualites(response.data) : []);
      } catch {
        setArticles([]);
      }
    };

    void fetchArticles();
  }, []);

  useEffect(() => {
    void axios.get('/api/users/me')
      .then((response) => {
        const user = response.data || {};
        const userName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.username || user.email || '';
        setRole(Number(user.role));
        setCurrentUserName(userName);
        setForm((previous) => ({ ...previous, author: userName }));
      })
      .catch(() => setRole(null));
  }, []);

  useEffect(() => {
    const isModalOpen = showCreateModal || Boolean(selectedArticle) || showSubmissionSuccess;
    if (!isModalOpen) {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowCreateModal(false);
        setSelectedArticle(null);
        setShowSubmissionSuccess(false);
        setError('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [showCreateModal, selectedArticle, showSubmissionSuccess]);

  const categories = Array.from(new Set(articles.map((news) => news.category)));

  const filteredNews = articles.filter((article) => {
    if (selectedCategory && article.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  const handleCreateActualite = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!localStorage.getItem('session-active')) {
      setError('Veuillez vous connecter pour ajouter une actualité.');
      return;
    }

    if (!form.title.trim() || !form.content.trim()) {
      setError('Le titre et le contenu sont obligatoires.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
        const formData = new FormData();
      formData.append('title', form.title);
      formData.append('category', form.category);
      formData.append('date', form.date || new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }));
      formData.append('author', form.author || 'Équipe de recherche');
      formData.append('readTime', form.readTime || '3 min');
      formData.append('excerpt', form.excerpt || form.content.slice(0, 170));
      formData.append('content', form.content);
      formData.append('isImportant', String(form.isImportant));
      if (form.imageUrl && !imageFile) {
        formData.append('imageUrl', form.imageUrl);
      }
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await axios.post('/api/users/actualites', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setForm({
        title: '',
        category: 'Événement',
        date: '',
        author: currentUserName,
        readTime: '',
        excerpt: '',
        content: '',
        imageUrl: '',
        isImportant: false,
      });
      setImageFile(null);
      setShowCreateModal(false);
      setShowSubmissionSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Échec de l’ajout de l’actualité.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-8 lg:px-8">
      <header className="flex flex-col gap-4 sm:gap-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#1a1c1d] sm:text-4xl md:text-5xl">
            Actualités & Événements
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-[#414755] sm:text-lg">
            Suivez l&apos;actualité de nos laboratoires, distinctions scientifiques, colloques et temps forts du campus.
          </p>
        </div>

        {(role === 0 || role === 1) && (
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex w-full items-center justify-center rounded-full bg-[#0058bc] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#00489b] sm:w-auto"
          >
            Ajouter une actualité
          </button>
        )}
      </header>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory('')}
          className={`cursor-pointer whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
            selectedCategory === ''
              ? 'bg-[#0058bc] text-white'
              : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          Toutes les actualités
        </button>

        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`cursor-pointer whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
              selectedCategory === category
                ? 'bg-[#0058bc] text-white'
                : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid gap-5 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredNews.map((article) => (
          <article
            key={article.id}
            role="button"
            tabIndex={0}
            onClick={() => setSelectedArticle(article)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setSelectedArticle(article);
              }
            }}
            className="group flex cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition-all hover:border-[#0058bc] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#0058bc] focus:ring-offset-2"
          >
            <div>
              {article.imageUrl && (
                <div className="relative h-44 overflow-hidden bg-gray-100 sm:h-48">
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold text-[#0058bc] shadow-sm backdrop-blur-sm">
                    {article.category}
                  </span>
                </div>
              )}

              <div className="space-y-3 p-4 sm:p-6">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-gray-400 sm:text-xs">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {article.date}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {article.readTime}
                  </span>
                </div>

                <h3
                  onClick={() => setSelectedArticle(article)}
                  className="cursor-pointer text-lg font-bold leading-snug text-gray-900 transition-colors group-hover:text-[#0058bc] sm:text-xl"
                >
                  {article.title}
                </h3>

                <p className="text-xs leading-relaxed text-gray-600 line-clamp-3">{article.excerpt}</p>
              </div>
            </div>

            <div className="px-4 pb-4 pt-0 sm:px-6 sm:pb-6">
              <button
                onClick={() => setSelectedArticle(article)}
                className="flex cursor-pointer items-center gap-1.5 text-xs font-bold text-[#0058bc] transition-colors group-hover:underline"
              >
                Lire l&apos;article complet
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </article>
        ))}
      </div>

      {showCreateModal && createPortal(
        <div
          className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onClick={() => {
            setShowCreateModal(false);
            setError('');
          }}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-bold text-[#1a1c1d]">Ajouter une actualité</h2>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setError('');
                }}
                className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateActualite} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium text-gray-700">
                  Titre
                  <input
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none transition focus:border-[#0058bc]"
                    placeholder="Titre de l’actualité"
                  />
                </label>

                <label className="block text-sm font-medium text-gray-700">
                  Catégorie
                  <select
                    value={form.category}
                    onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none transition focus:border-[#0058bc]"
                  >
                    {categoryOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="block text-sm font-medium text-gray-700">
                  Date
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none transition focus:border-[#0058bc]"
                  />
                </label>

                <label className="block text-sm font-medium text-gray-700">
                  Auteur
                  <input
                    value={form.author}
                    readOnly
                    className="mt-1 w-full rounded-xl border border-gray-300 bg-gray-100 px-3 py-2.5 text-gray-600 outline-none"
                    placeholder="Nom de l’utilisateur connecté"
                  />
                </label>

                <label className="block text-sm font-medium text-gray-700">
                  Temps de lecture
                  <input
                    value={form.readTime}
                    onChange={(e) => setForm((prev) => ({ ...prev, readTime: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none transition focus:border-[#0058bc]"
                    placeholder="5 min"
                  />
                </label>
              </div>

              <label className="block text-sm font-medium text-gray-700">
                Extrait
                <textarea
                  value={form.excerpt}
                  onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none transition focus:border-[#0058bc]"
                  placeholder="Résumé court de l’actualité"
                />
              </label>

              <label className="block text-sm font-medium text-gray-700">
                Contenu
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                  rows={5}
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none transition focus:border-[#0058bc]"
                  placeholder="Détails complets de l’actualité"
                />
              </label>

              <label className="block text-sm font-medium text-gray-700">
                Image locale
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setImageFile(file);
                    if (file) {
                      setForm((prev) => ({ ...prev, imageUrl: URL.createObjectURL(file) }));
                    } else {
                      setForm((prev) => ({ ...prev, imageUrl: '' }));
                    }
                  }}
                  className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-[#0058bc] file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[#00489b] focus:border-[#0058bc]"
                />
              </label>

              {form.imageUrl && (
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <img src={form.imageUrl} alt="Aperçu de l’image" className="h-40 w-full object-cover" />
                </div>
              )}

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isImportant}
                  onChange={(e) => setForm((prev) => ({ ...prev, isImportant: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-[#0058bc]"
                />
                Actualité importante
              </label>

              {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setError('');
                  }}
                  className="rounded-full border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-full bg-[#0058bc] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#00489b] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {selectedArticle && createPortal(
        <div
          className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onClick={() => setSelectedArticle(null)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between bg-gray-900 p-6 text-white">
              <div>
                <span className="rounded bg-[#0058bc] px-2.5 py-0.5 text-[11px] font-bold uppercase text-white">
                  {selectedArticle.category}
                </span>
                <h2 className="mt-2 text-xl font-bold leading-snug text-white">{selectedArticle.title}</h2>
                <div className="mt-1 text-xs text-gray-400">
                  {selectedArticle.date} • {selectedArticle.author}
                </div>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="rounded-full p-2 text-gray-400 transition-colors hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto p-6 text-sm leading-relaxed text-gray-800">
              {selectedArticle.imageUrl && (
                <img
                  src={selectedArticle.imageUrl}
                  alt={selectedArticle.title}
                  className="h-56 w-full rounded-xl border border-gray-200 object-cover"
                />
              )}
              <p className="text-base font-semibold text-gray-900">{selectedArticle.excerpt}</p>
              <p>{selectedArticle.content}</p>
              <p>
                Pour toute question ou demande d&apos;interview en lien avec cette actualité, veuillez contacter le service de presse de LaboRecherche à{' '}
                <span className="font-mono text-[#0058bc]">presse@laborecherche.fr</span>.
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showSubmissionSuccess && createPortal(
        <div className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-emerald-200 bg-white p-6 text-center shadow-2xl">
            <h2 className="text-xl font-semibold text-[#1a1c1d]">Actualité envoyée</h2>
            <p className="mt-2 text-sm text-[#414755]">Votre actualité a été envoyée à l’administrateur pour approbation.</p>
            <button
              type="button"
              onClick={() => setShowSubmissionSuccess(false)}
              className="mt-5 rounded-full bg-[#0058bc] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#00489b]"
            >
              OK
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default Actualites;