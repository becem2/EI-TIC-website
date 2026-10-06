import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Check, ArrowLeft, Plus, X } from 'lucide-react';
import type { Publication } from '../types';

interface PdfViewerModalProps {
  publication: Publication;
  onClose: () => void;
  editable?: boolean;
  onSubmit?: (publication: Publication) => void;
  onBack?: () => void;
  onDownloadCountChange?: (count: number) => void;
  canDownloadPrivate?: boolean;
  onRequestAccess?: () => Promise<void>;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({ publication, onClose, editable = false, onSubmit, onBack, onDownloadCountChange, canDownloadPrivate = false, onRequestAccess }) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [draftPublication, setDraftPublication] = useState(publication);
  const [keywordDraft, setKeywordDraft] = useState('');
  const [requestingAccess, setRequestingAccess] = useState(false);
  const [accessRequested, setAccessRequested] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [privateAccessStatus, setPrivateAccessStatus] = useState<{ hasAccess: boolean; requestStatus: string | null } | null>(null);
  useEffect(() => {
    setDraftPublication(publication);
    setKeywordDraft('');
    setAccessRequested(false);
    setAccessError(null);
  }, [publication]);

  useEffect(() => {
    if (!publication.isPrivate || editable) {
      setPrivateAccessStatus(null);
      return;
    }

    if (!localStorage.getItem('session-active')) {
      setPrivateAccessStatus({ hasAccess: false, requestStatus: null });
      return;
    }

    void fetch(`/api/users/publications/${publication.id}/access-status`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Impossible de vérifier l’accès au PDF.');
        return response.json();
      })
      .then((status) => setPrivateAccessStatus(status))
      .catch((error) => setAccessError(error instanceof Error ? error.message : 'Impossible de vérifier l’accès au PDF.'));
  }, [publication.id, publication.isPrivate, editable]);

  const updateDraft = (changes: Partial<Publication>) => {
    setDraftPublication((current) => ({ ...current, ...changes }));
  };

  const getResearcherProfileUrl = (userId?: string) => userId
    ? `/Profile?researcherId=${encodeURIComponent(userId)}`
    : null;

  const addKeyword = () => {
    const keyword = keywordDraft.trim();
    if (!keyword || draftPublication.keywords.includes(keyword)) return;
    updateDraft({ keywords: [...draftPublication.keywords, keyword] });
    setKeywordDraft('');
  };

  const removeKeyword = (keywordToRemove: string) => {
    updateDraft({ keywords: draftPublication.keywords.filter((keyword) => keyword !== keywordToRemove) });
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleDownload = async () => {
    setDownloading(true);
    setAccessError(null);
    try {
      const response = await fetch(`/api/users/publications/${publication.id}/pdf`);
      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        throw new Error(errorPayload?.message || 'PDF download failed');
      }

      const blobUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${publication.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
      const nextDownloadCount = (draftPublication.downloadsCount || 0) + 1;
      updateDraft({ downloadsCount: nextDownloadCount });
      onDownloadCountChange?.(nextDownloadCount);
      setDownloadComplete(true);
      setTimeout(() => setDownloadComplete(false), 3000);
    } catch (error) {
      console.error('Failed to download publication PDF', error);
      setAccessError(error instanceof Error ? error.message : 'Téléchargement du PDF impossible.');
    } finally {
      setDownloading(false);
    }
  };

  const handleRequestAccess = async () => {
    if (!onRequestAccess) return;
    setRequestingAccess(true);
    setAccessError(null);
    try {
      await onRequestAccess();
      setAccessRequested(true);
      setPrivateAccessStatus((current) => ({ hasAccess: current?.hasAccess || false, requestStatus: 'pending' }));
    } catch (error) {
      console.error('Failed to request private PDF access', error);
      setAccessError(error instanceof Error ? error.message : 'Demande d’accès impossible.');
    } finally {
      setRequestingAccess(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[2147483647] flex h-screen w-screen items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm animate-in fade-in duration-200 sm:p-6"
      onClick={onClose}
    >
      <div
        className="flex h-[92dvh] max-h-[920px] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-[#c1c6d7]/40 bg-[#f8fafc] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#c1c6d7]/30 bg-white p-4 sm:p-6">
          <div className="grow pr-4">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#0058bc]">{draftPublication.type}</span>
              <span className="text-xs text-[#717786]">
                {editable ? (
                  draftPublication.year
                ) : `${draftPublication.year}${draftPublication.doi ? ` • DOI: ${draftPublication.doi}` : ''}`}
              </span>
            </div>
            <h2 className="text-lg font-bold leading-tight text-[#1a1c1d] sm:text-xl">{draftPublication.title}</h2>
            <p className="mt-1 text-xs text-[#717786]">{draftPublication.authors.map((author) => author.name).join(', ')}</p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {editable && onBack && (
              <button onClick={onBack} className="flex items-center gap-1.5 rounded-full border border-[#c1c6d7] px-3.5 py-2 text-xs font-semibold text-[#414755] transition-colors hover:bg-[#f3f3f5]">
                <ArrowLeft className="h-3.5 w-3.5" />
                Retour
              </button>
            )}
            {editable && onSubmit && (
              <button onClick={() => onSubmit(draftPublication)} className="rounded-full bg-[#0058bc] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#004493]">
                Soumettre
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-full p-2 text-[#717786] transition-colors hover:bg-[#f3f3f5] hover:text-[#1a1c1d]"
              title="Fermer"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-b border-[#c1c6d7]/30 bg-white px-4 py-3 text-xs sm:px-6">
          <div className="flex items-center gap-2">
            {!editable && (publication.isPrivate && !canDownloadPrivate && !privateAccessStatus?.hasAccess ? (
              <button
                onClick={() => void handleRequestAccess()}
                disabled={requestingAccess || accessRequested}
                className="flex items-center gap-1.5 rounded-full bg-amber-600 px-4 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-amber-700 disabled:opacity-60"
              >
                {requestingAccess
                  ? 'Envoi...'
                  : accessRequested || privateAccessStatus?.requestStatus === 'pending'
                    ? 'Demande envoyée'
                    : 'Demander l’accès au PDF'}
              </button>
            ) : (
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-1.5 rounded-full bg-[#0058bc] px-4 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-[#004493]"
              >
                {downloading ? (
                  <span className="animate-spin">⏳</span>
                ) : downloadComplete ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    Téléchargé !
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Télécharger PDF
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        {accessError && (
          <div className="border-b border-red-200 bg-red-50 px-6 py-2 text-xs font-medium text-red-700">
            {accessError}
          </div>
        )}

        <div className="grow overflow-y-auto bg-[#f3f3f5] p-4 sm:p-7">
          <div className="mx-auto max-w-3xl space-y-6 rounded-2xl border border-[#c1c6d7]/30 bg-white p-6 shadow-sm sm:p-10">
            <div className="border-b border-gray-200 pb-6 text-center space-y-3">
              {editable ? (
                <input value={draftPublication.journal} onChange={(event) => updateDraft({ journal: event.target.value })} placeholder="Revue / conférence" className="w-full rounded border border-gray-200 px-2 py-1 text-center text-xs font-semibold uppercase tracking-widest text-[#0058bc] outline-none" />
              ) : <div className="text-xs font-semibold text-[#0058bc] uppercase tracking-widest">{draftPublication.journal}</div>}
              <h1 className="text-2xl font-bold leading-snug text-gray-900">{draftPublication.title}</h1>
              <div className="text-sm text-gray-600 flex flex-wrap justify-center gap-x-4 gap-y-1">
                {draftPublication.authors.map((author) => (
                  <React.Fragment key={author.id}>
                    {getResearcherProfileUrl(author.userId) && !editable ? (
                      <a href={getResearcherProfileUrl(author.userId)!} target="_blank" rel="noreferrer" className="font-medium text-gray-800 hover:text-[#0058bc] hover:underline">
                        {author.name}
                      </a>
                    ) : (
                      <span className="font-medium text-gray-800">{author.name}</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className="text-xs text-gray-400 font-mono">
                LaboRecherche{draftPublication.doi ? ` • DOI: ${draftPublication.doi}` : ''}
              </div>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-5 text-sm leading-relaxed text-[#414755]">
              <h3 className="font-bold mb-2 uppercase text-xs tracking-wider text-[#0058bc]">Résumé (Abstract)</h3>
              {editable ? (
                <textarea value={draftPublication.abstract} onChange={(event) => updateDraft({ abstract: event.target.value })} className="min-h-24 w-full rounded border border-blue-100 bg-white px-2 py-1 text-sm outline-none" />
              ) : <p>{draftPublication.abstract}</p>}
            </div>

            <div className="space-y-4 text-sm text-gray-800 leading-relaxed text-justify">
              <h3 className="font-bold text-base text-gray-900 border-b border-gray-100 pb-1 pt-2">1. Introduction & Contexte scientifique</h3>
              {editable ? (
                <textarea value={draftPublication.introduction || ''} onChange={(event) => updateDraft({ introduction: event.target.value })} placeholder="Saisissez l’introduction..." className="min-h-28 w-full rounded border border-gray-200 px-2 py-1 text-sm outline-none" />
              ) : <p>{draftPublication.introduction || 'Aucune introduction renseignée.'}</p>}

              <h3 className="font-bold text-base text-gray-900 border-b border-gray-100 pb-1 pt-2">2. Méthodologie & Expérimentation</h3>
              {editable ? (
                <textarea value={draftPublication.methodology || ''} onChange={(event) => updateDraft({ methodology: event.target.value })} placeholder="Saisissez la méthodologie..." className="min-h-28 w-full rounded border border-gray-200 px-2 py-1 text-sm outline-none" />
              ) : <p>{draftPublication.methodology || 'Aucune méthodologie renseignée.'}</p>}

              <h3 className="font-bold text-base text-gray-900 border-b border-gray-100 pb-1 pt-2">3. Conclusion & Perspectives</h3>
              {editable ? (
                <textarea value={draftPublication.conclusion || ''} onChange={(event) => updateDraft({ conclusion: event.target.value })} placeholder="Saisissez la conclusion et les perspectives..." className="min-h-28 w-full rounded border border-gray-200 px-2 py-1 text-sm outline-none" />
              ) : <p>{draftPublication.conclusion || 'Aucune conclusion renseignée.'}</p>}
            </div>

            <div className="pt-4 border-t border-gray-200 flex flex-wrap gap-2 items-center">
              <span className="text-xs font-semibold text-gray-500">Mots-clés :</span>
              {editable ? (
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                  {draftPublication.keywords.map((keyword) => (
                    <span key={keyword} className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
                      {keyword}
                      <button type="button" onClick={() => removeKeyword(keyword)} className="text-gray-500 hover:text-gray-900" title="Supprimer ce mot-clé">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <div className="flex min-w-[180px] flex-1 gap-2">
                    <input value={keywordDraft} onChange={(event) => setKeywordDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addKeyword(); } }} placeholder="Ajouter un mot-clé" className="min-w-0 flex-1 rounded border border-gray-200 px-2 py-1 text-sm outline-none" />
                    <button type="button" onClick={addKeyword} className="inline-flex items-center gap-1 rounded bg-[#0058bc] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#004493]"><Plus className="h-3.5 w-3.5" />Ajouter</button>
                  </div>
                </div>
              ) : draftPublication.keywords.map((keyword, index) => (
                <span key={index} className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full border border-gray-200">{keyword}</span>
              ))}
            </div>

            <div className="space-y-2 border-t border-gray-100 pt-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Auteurs et affiliations</h3>
              <div className="space-y-2">
                {draftPublication.authors.map((author) => (
                  <div key={author.id} className="flex items-center justify-between gap-3 rounded-lg bg-[#f8fafc] p-3 text-xs">
                    {getResearcherProfileUrl(author.userId) && !editable ? (
                      <a href={getResearcherProfileUrl(author.userId)!} target="_blank" rel="noreferrer" className="font-semibold text-gray-800 hover:text-[#0058bc] hover:underline">
                        {author.name}
                      </a>
                    ) : (
                      <span className="font-semibold text-gray-800">{author.name}</span>
                    )}
                    <span className="text-right text-gray-500">{author.role || 'Chercheur'} · EI&amp;TIC Laboratoire</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
