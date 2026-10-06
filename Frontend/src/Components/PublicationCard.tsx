import type { Publication } from '../types';
import { Share2 } from 'lucide-react';

interface PublicationCardProps {
  publication: Publication;
  onOpen?: (publication: Publication) => void;
  onShare?: (publication: Publication) => void;
  isCopied?: boolean;
}

const formatPublicationType = (rawType?: string) => {
  const type = (rawType || '').trim();
  if (!type) return 'Autre';

  const normalized = type.toLowerCase();
  if (normalized.includes('communication')) return 'Communication';
  if (normalized.includes('article scientifique')) return 'Article scientifique';
  if (normalized.includes("chapitre d'ouvrage")) return "Chapitre d'ouvrage";
  if (normalized.includes('ouvrage scientifique')) return 'Ouvrage scientifique';
  return type;
};

const getPublicationTypeStyles = (rawType?: string) => {
  const type = (rawType || '').trim().toLowerCase();
  if (type.includes('article scientifique')) return 'border-blue-200 bg-blue-50 text-blue-700';
  if (type.includes('communication')) return 'border-violet-200 bg-violet-50 text-violet-700';
  if (type.includes("chapitre d'ouvrage")) return 'border-amber-200 bg-amber-50 text-amber-700';
  if (type.includes('ouvrage scientifique')) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  return 'border-slate-200 bg-slate-100 text-slate-700';
};

export const PublicationCard: React.FC<PublicationCardProps> = ({
  publication,
  onOpen,
  onShare,
  isCopied = false,
}) => {
  const openPublication = () => onOpen?.(publication);

  return (
  <article
    onClick={openPublication}
    onKeyDown={(event) => {
      if (event.target !== event.currentTarget) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openPublication();
      }
    }}
    role={onOpen ? 'button' : undefined}
    tabIndex={onOpen ? 0 : undefined}
    aria-label={onOpen ? `Ouvrir la publication : ${publication.title}` : undefined}
    className={`group flex flex-col gap-3 rounded-2xl border border-[#c1c6d7]/30 bg-white p-4 shadow-sm transition-all hover:border-[#0058bc]/40 hover:shadow-md sm:p-5 ${onOpen ? 'cursor-pointer' : ''}`}
  >
    <div className="flex items-start justify-between gap-3">
      <span className={`inline-flex rounded border px-2.5 py-0.5 text-[10px] font-bold uppercase ${getPublicationTypeStyles(publication.type)}`}>
        {formatPublicationType(publication.type)}
      </span>
      <span className="shrink-0 text-xs text-[#717786]">{publication.year}</span>
    </div>

    <h3 className="text-base font-bold leading-snug text-[#1a1c1d] transition-colors group-hover:text-[#0058bc] sm:text-[1.05rem]">
      {publication.title}
    </h3>
    {publication.journal && <p className="text-xs font-medium text-[#0058bc]">{publication.journal}</p>}
    <p className="line-clamp-3 text-xs leading-relaxed text-[#414755]">
      {publication.abstract || 'Aucun résumé n’est disponible pour cette publication.'}
    </p>
    {publication.keywords.length > 0 && (
      <div className="flex flex-wrap gap-1.5">
        {publication.keywords.map((keyword, index) => (
          <span key={`${keyword}-${index}`} className="rounded-full bg-[#f3f3f5] px-2 py-0.5 text-[10px] text-[#414755]">
            {keyword}
          </span>
        ))}
      </div>
    )}

    <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#c1c6d7]/20 pt-3 text-xs text-[#717786]">
      <span className="min-w-0 truncate">{publication.authors.map((author) => author.name).join(', ')}</span>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onShare?.(publication);
        }}
        className="rounded-md p-1.5 text-[#5e5e5e] transition-colors hover:bg-gray-100 hover:text-[#0058bc]"
        title="Partager cette publication"
        aria-label="Partager cette publication"
      >
        <Share2 className="h-4 w-4" />
      </button>
    </div>
    {isCopied && <span className="text-right text-[11px] font-semibold text-emerald-600">Lien copié !</span>}
  </article>
  );
};
