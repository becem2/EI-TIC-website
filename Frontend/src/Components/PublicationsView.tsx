import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Publication, FilterState } from '../types';
import { Search, ChevronDown, Filter, AlertCircle } from 'lucide-react';
import { PublicationCard } from './PublicationCard';

interface PublicationsViewProps {
  publications?: Publication[];
  onOpenPdfModal: (pub: Publication) => void;
  externalSearchQuery?: string;
  canUploadPaper?: boolean;
  onUploadPaper?: () => void;
  researcherOptions?: Array<{ _id?: string; username?: string; firstName?: string; lastName?: string; email?: string }>;
}

export const PublicationsView: React.FC<PublicationsViewProps> = ({
  publications = [],
  onOpenPdfModal,
  externalSearchQuery = '',
  canUploadPaper = false,
  onUploadPaper,
  researcherOptions = [],
}) => {
  const [filters, setFilters] = useState<FilterState>({
    year: '',
    type: '',
    researcher: '',
    keyword: externalSearchQuery,
    department: '',
    sortBy: 'recent',
  });

  const [visibleCount, setVisibleCount] = useState<number>(3);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (externalSearchQuery !== undefined) {
      setFilters((prev) => ({ ...prev, keyword: externalSearchQuery }));
    }
  }, [externalSearchQuery]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setVisibleCount(3);
  };

  const clearFilters = () => {
    setFilters({
      year: '',
      type: '',
      researcher: '',
      keyword: '',
      department: '',
      sortBy: 'recent',
    });
    setVisibleCount(3);
  };

  const filteredPublications = useMemo(() => {
    return publications
      .filter((pub) => {
        if (filters.year && pub.year.toString() !== filters.year) {
          return false;
        }

        if (filters.type) {
          if (pub.type !== filters.type) return false;
        }

        if (filters.researcher) {
          const matchesResearcher = pub.authors.some((author) => author.userId === filters.researcher)
            || pub.submittedBy === filters.researcher;
          if (!matchesResearcher) return false;
        }

        if (filters.keyword.trim()) {
          const q = filters.keyword.toLowerCase().trim();
          const inTitle = pub.title.toLowerCase().includes(q);
          const inAbstract = pub.abstract.toLowerCase().includes(q);
          const inJournal = pub.journal.toLowerCase().includes(q);
          const inAuthors = pub.authors.some((author) => author.name.toLowerCase().includes(q));
          const inKeywords = pub.keywords.some((keyword) => keyword.toLowerCase().includes(q));

          if (!inTitle && !inAbstract && !inJournal && !inAuthors && !inKeywords) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'citations') {
          return b.citationsCount - a.citationsCount;
        }
        if (filters.sortBy === 'alphabetical') {
          return a.title.localeCompare(b.title);
        }
        return b.year - a.year;
      });
  }, [publications, filters]);

  const displayedList = filteredPublications.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPublications.length;

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setVisibleCount((current) => Math.min(current + 3, filteredPublications.length));
      }
    }, { rootMargin: '300px' });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filteredPublications.length, hasMore, visibleCount]);

  const handleShare = async (pub: Publication) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: pub.title,
          text: `Découvrez la publication "${pub.title}" de LaboRecherche`,
          url: window.location.href,
        });
      } catch {
        // noop
      }
      return;
    }

    const shareText = `${pub.title} - DOI: ${pub.doi}`;
    await navigator.clipboard.writeText(shareText);
    setCopiedId(pub.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const availableYears = useMemo(() => {
    const years = publications
      .map((pub) => Number(pub.year))
      .filter((year) => Number.isFinite(year) && year > 0)
      .sort((a, b) => b - a);

    return Array.from(new Set(years));
  }, [publications]);

  const activeFilterCount = [filters.year, filters.type, filters.researcher, filters.keyword].filter(Boolean).length;

  return (
    <div className="w-full">
      <header className="relative z-20 mb-8 flex flex-col gap-5 sm:mb-12 md:flex-row md:items-start md:justify-between">
        <div className="max-w-3xl">
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-[#1a1c1d] sm:text-4xl md:text-5xl">Publications</h1>
          <p className="max-w-2xl text-base leading-relaxed text-[#414755] md:text-lg md:text-xl">
            Explorez les travaux de recherche, articles scientifiques et communications de conférence issus de nos équipes.
          </p>
        </div>

        {canUploadPaper && onUploadPaper && (
          <button
            type="button"
            onClick={onUploadPaper}
            className="relative z-30 inline-flex w-full items-center justify-center rounded-full bg-[#0058bc] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#00489b] sm:w-auto"
          >
            Ajouter une publication
          </button>
        )}
      </header>

      <section className="relative z-10 mb-8 flex flex-col gap-4 rounded-2xl border border-gray-200/80 bg-white/75 p-4 shadow-xs backdrop-blur-xl sm:p-6 md:flex-row md:items-end md:gap-6">
        <div className="w-full md:w-1/4">
          <label className="block text-[11px] font-semibold text-[#414755] mb-2 uppercase tracking-widest">Année</label>
          <div className="relative">
            <select
              value={filters.year}
              onChange={(e) => handleFilterChange('year', e.target.value)}
              className="w-full appearance-none bg-white border border-[#c1c6d7]/50 rounded-lg px-4 py-3 text-base text-[#1a1c1d] focus:outline-none focus:border-[#0058bc] focus:ring-1 focus:ring-[#0058bc] transition-colors cursor-pointer pr-10"
            >
              <option value="">Toutes les années</option>
              {availableYears.map((year) => (
                <option key={year} value={String(year)}>
                  {year}
                </option>
              ))}
            </select>
            <ChevronDown className="w-5 h-5 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#414755]" />
          </div>
        </div>

        <div className="w-full md:w-1/4">
          <label className="block text-[11px] font-semibold text-[#414755] mb-2 uppercase tracking-widest">Type</label>
          <div className="relative">
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full appearance-none bg-white border border-[#c1c6d7]/50 rounded-lg px-4 py-3 text-base text-[#1a1c1d] focus:outline-none focus:border-[#0058bc] focus:ring-1 focus:ring-[#0058bc] transition-colors cursor-pointer pr-10"
            >
              <option value="">Tous les types</option>
              <option value="Communication">Communication</option>
              <option value="Article scientifique">Article scientifique</option>
              <option value="Chapitre d'ouvrage">Chapitre d'ouvrage</option>
              <option value="Ouvrage scientifique">Ouvrage scientifique</option>
            </select>
            <ChevronDown className="w-5 h-5 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#414755]" />
          </div>
        </div>

        <div className="w-full md:w-1/4">
          <label className="block text-[11px] font-semibold text-[#414755] mb-2 uppercase tracking-widest">Chercheur</label>
          <div className="relative">
            <select
              value={filters.researcher}
              onChange={(e) => handleFilterChange('researcher', e.target.value)}
              className="w-full appearance-none bg-white border border-[#c1c6d7]/50 rounded-lg px-4 py-3 text-base text-[#1a1c1d] focus:outline-none focus:border-[#0058bc] focus:ring-1 focus:ring-[#0058bc] transition-colors cursor-pointer pr-10"
            >
              <option value="">Tous les chercheurs</option>
              {researcherOptions.map((researcher) => {
                const fullName = [researcher.firstName, researcher.lastName].filter(Boolean).join(' ').trim() || researcher.username || researcher.email || 'Chercheur';
                return (
                  <option key={researcher._id || researcher.email || fullName} value={researcher._id || ''} disabled={!researcher._id}>
                    {fullName}
                  </option>
                );
              })}
            </select>
            <ChevronDown className="w-5 h-5 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#414755]" />
          </div>
        </div>

        <div className="w-full md:w-1/4">
          <label className="block text-[11px] font-semibold text-[#414755] mb-2 uppercase tracking-widest">Mots clés</label>
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#414755]" />
            <input
              type="text"
              value={filters.keyword}
              onChange={(e) => handleFilterChange('keyword', e.target.value)}
              placeholder="Rechercher..."
              className="w-full bg-white border border-[#c1c6d7]/50 rounded-lg pl-11 pr-4 py-3 text-base text-[#1a1c1d] focus:outline-none focus:border-[#0058bc] focus:ring-1 focus:ring-[#0058bc] transition-colors"
            />
          </div>
        </div>
      </section>

      {activeFilterCount > 0 && (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#0058bc]">
              <Filter className="h-4 w-4" />
            <span>{filteredPublications.length} résultat(s) trouvé(s)</span>
            <span className="text-gray-400">•</span>
              <span className="rounded-full bg-[#0058bc] px-2 py-0.5 text-[10px] font-bold text-white">{activeFilterCount} filtre(s) actif(s)</span>
          </div>
            <button onClick={clearFilters} className="cursor-pointer text-left text-xs font-semibold text-[#0058bc] hover:underline">
            Réinitialiser les filtres
          </button>
        </div>
      )}

      <section className="space-y-6">
        {displayedList.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-gray-200/80 p-8 my-6">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-800 mb-1">Aucune publication ne correspond</h3>
            <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
              Essayez de modifier vos critères de recherche ou de réinitialiser les filtres pour afficher l'ensemble de nos articles scientifiques.
            </p>
            <button onClick={clearFilters} className="bg-[#0058bc] text-white px-6 py-2.5 rounded-full text-xs font-semibold hover:bg-[#004493] transition-colors cursor-pointer">
              Afficher toutes les publications
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {displayedList.map((publication) => (
              <PublicationCard
                key={publication.id}
                publication={publication}
                onOpen={onOpenPdfModal}
                onShare={handleShare}
                isCopied={copiedId === publication.id}
              />
            ))}
          </div>
        )}

        {hasMore && <div ref={loadMoreRef} className="h-1" aria-hidden="true" />}
      </section>
    </div>
  );
};
