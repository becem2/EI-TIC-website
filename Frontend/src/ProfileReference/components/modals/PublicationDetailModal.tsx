import React, { useState } from 'react';
import { PublicationItem } from '../../types';
import { X, ExternalLink, Download, Copy, Check, FileText, Share2, BookOpen, Quote } from 'lucide-react';

interface PublicationDetailModalProps {
  publication: PublicationItem | null;
  onClose: () => void;
  onDelete?: (id: string) => void;
  isPublicView?: boolean;
}

export const PublicationDetailModal: React.FC<PublicationDetailModalProps> = ({
  publication,
  onClose,
  onDelete,
  isPublicView,
}) => {
  const [copiedBibtex, setCopiedBibtex] = useState(false);

  if (!publication) return null;

  const bibtex = `@article{mhamdi${publication.year || 2024}${publication.title.substring(0, 5).toLowerCase()},
  title = {${publication.title}},
  author = {${publication.authors?.join(' and ') || 'Dr. Mhamdi B.'}},
  journal = {${publication.journal || 'LaboRecherche Journal of Cognitive Systems'}},
  year = {${publication.year || 2024}},
  doi = {${publication.doi || '10.1109/TNNLS.2024.3389102'}}
}`;

  const copyBibtex = () => {
    navigator.clipboard.writeText(bibtex);
    setCopiedBibtex(true);
    setTimeout(() => setCopiedBibtex(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl border border-[#c1c6d7]/30 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#c1c6d7]/20 flex items-start justify-between gap-4 bg-[#f9f9fb]">
          <div className="space-y-1">
            <span
              className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                publication.status === 'published'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {publication.status === 'published' ? 'Publication Validée' : 'Brouillon en cours'}
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-[#1a1c1d] leading-snug">
              {publication.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#717786] hover:bg-[#eeeef0] hover:text-[#1a1c1d] transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          {/* Cover image if any */}
          {publication.image && (
            <div className="aspect-video w-full rounded-xl overflow-hidden shadow-sm bg-slate-100 relative">
              <img
                src={publication.image}
                alt={publication.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Authors & Journal Meta */}
          <div className="bg-[#f3f3f5] rounded-xl p-4 sm:p-5 space-y-2 text-sm">
            <div>
              <span className="font-semibold text-[#1a1c1d]">Auteurs : </span>
              <span className="text-[#414755]">
                {publication.authors?.join(', ') || 'Dr. Mhamdi B.'}
              </span>
            </div>
            {publication.journal && (
              <div>
                <span className="font-semibold text-[#1a1c1d]">Revue / Conférence : </span>
                <span className="text-[#0058bc] font-medium">{publication.journal}</span>
                {publication.year && <span className="text-[#717786]"> ({publication.year})</span>}
              </div>
            )}
            {publication.doi && (
              <div>
                <span className="font-semibold text-[#1a1c1d]">DOI : </span>
                <span className="font-mono text-xs text-[#414755] bg-white px-2 py-0.5 rounded border border-[#c1c6d7]/30">
                  {publication.doi}
                </span>
              </div>
            )}
          </div>

          {/* Abstract */}
          <div className="space-y-2">
            <h4 className="text-base font-bold text-[#1a1c1d] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#0058bc]" />
              <span>Résumé (Abstract)</span>
            </h4>
            <p className="text-sm sm:text-base text-[#414755] leading-relaxed">
              {publication.abstract ||
                "Cette étude explore les architectures neuronales cognitives optimisées pour les environnements embarqués. Elle intègre des approches de quantification avancées pour réduire l'empreinte énergétique sans dégradation des performances prédictives."}
            </p>
          </div>

          {/* Keywords */}
          {publication.keywords && publication.keywords.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-[#717786]">Mots-clés</h5>
              <div className="flex flex-wrap gap-2">
                {publication.keywords.map((kw, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-[#eeeef0] text-[#1a1c1d] text-xs font-medium rounded-full"
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* BibTeX Citation Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#717786] flex items-center gap-1.5">
                <Quote className="w-3.5 h-3.5" />
                <span>Citation BibTeX</span>
              </h4>
              <button
                onClick={copyBibtex}
                className="text-xs text-[#0058bc] hover:underline font-semibold flex items-center gap-1"
              >
                {copiedBibtex ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedBibtex ? 'Copié !' : 'Copier BibTeX'}</span>
              </button>
            </div>
            <pre className="p-3.5 bg-slate-900 text-slate-200 text-xs rounded-xl overflow-x-auto font-mono">
              {bibtex}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-[#c1c6d7]/20 bg-[#f9f9fb] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                alert(`Téléchargement de l'article "${publication.title}" au format PDF démarré.`);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0058bc] text-white text-xs font-bold uppercase tracking-wider rounded-full hover:bg-[#004493] transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Télécharger PDF (2.4 MB)</span>
            </button>

            {publication.doi && (
              <a
                href={`https://doi.org/${publication.doi}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#c1c6d7] text-[#1a1c1d] text-xs font-semibold uppercase tracking-wider rounded-full hover:bg-[#eeeef0] transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#0058bc]" />
                <span>Consulter DOI</span>
              </a>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-[#414755] hover:text-[#1a1c1d] transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
