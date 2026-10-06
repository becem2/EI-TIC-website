import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X } from 'lucide-react';
import axios from 'axios';
import { PublicationsView } from '../Components/PublicationsView';
import { PublicationCard } from '../Components/PublicationCard';
import { PdfViewerModal } from '../Components/PdfViewerModal';
import type { Publication, PublicationDetails, PublicationType } from '../types';

type DetailField = { key: string; label: string; type?: 'text' | 'url' | 'date'; placeholder?: string };

const publicationDetailFields: Record<PublicationType, DetailField[]> = {
  Communication: [
    { key: 'conferenceTitle', label: 'Titre de la conférence' },
    { key: 'conferenceLocation', label: 'Lieu de la conférence' },
    { key: 'country', label: 'Pays' },
    { key: 'pages', label: 'Pages', placeholder: 'pp. 1-5' },
    { key: 'dates', label: 'Dates', type: 'date' },
    { key: 'conferenceSite', label: 'Site de la conférence', type: 'url' },
  ],
  'Article scientifique': [
    { key: 'volume', label: 'Volume' },
    { key: 'pages', label: 'Pages' },
    { key: 'firstPublicationDate', label: 'Date de la première parution', type: 'date' },
    { key: 'doi', label: 'DOI' },
    { key: 'journalTitle', label: 'Titre complet du journal / revue' },
    { key: 'journalIssn', label: 'ISSN du journal / revue' },
    { key: 'journalQuartile2025', label: 'Quartile du journal / revue' },
    { key: 'publicationQuartile', label: "Quartile lors de l'apparition de l'article" },
    { key: 'impactFactor2025', label: "Facteur d'impact" },
    { key: 'publicationImpactFactor', label: "Facteur d'impact lors de l'apparition" },
    { key: 'indexation', label: 'Indexation' },
    { key: 'journalSite', label: 'Site de la revue', type: 'url' },
    { key: 'paperLink', label: 'Lien vers le papier', type: 'url' },
  ],
  "Chapitre d'ouvrage": [
    { key: 'publisher', label: "Éditeur" },
    { key: 'publisherLink', label: "Lien de l'éditeur", type: 'url' },
    { key: 'edition', label: 'Édition' },
    { key: 'isbnIssn', label: 'ISBN / ISSN' },
    { key: 'pages', label: 'Pages' },
    { key: 'publicationDate', label: 'Date de parution', type: 'date' },
  ],
  'Ouvrage scientifique': [
    { key: 'publisher', label: "Éditeur" },
    { key: 'publisherLink', label: "Lien de l'éditeur", type: 'url' },
    { key: 'edition', label: 'Édition' },
    { key: 'isbnIssn', label: 'ISBN / ISSN' },
    { key: 'pages', label: 'Pages' },
    { key: 'publicationDate', label: 'Date de parution', type: 'date' },
  ],
};

function Publications() {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [activePublication, setActivePublication] = useState<Publication | null>(null);
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDraftPreview, setShowDraftPreview] = useState(false);
  const [role, setRole] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [typeField, setTypeField] = useState<PublicationType | ''>('');
  const [details, setDetails] = useState<PublicationDetails>({});
  const [year, setYear] = useState('');
  const [summary, setSummary] = useState('');
  const [department, setDepartment] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [keywordsText, setKeywordsText] = useState('');
  const [selectedAuthors, setSelectedAuthors] = useState<Array<{ userId: string; name: string }>>([]);
  const [authorDraft, setAuthorDraft] = useState('');
  const [currentUserFullName, setCurrentUserFullName] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [researcherOptions, setResearcherOptions] = useState<Array<{ _id?: string; username?: string; firstName?: string; lastName?: string; email?: string }>>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const normalizePublication = (item: any): Publication => ({
    id: item._id || item.id,
    _id: item._id || item.id,
    title: item.title || 'Publication sans titre',
    year: Number(item.year || new Date().getFullYear()),
    type: item.type || 'Article scientifique',
    details: item.details || {},
    authors: Array.isArray(item.authors)
      ? item.authors.map((author: any, index: number) => ({
        id: author.id || `${item._id || item.id}-${index}`,
        userId: author.userId?._id || author.userId,
        name: author.name || author || 'Auteur inconnu',
        role: author.role || 'Chercheur',
      }))
      : [{ id: `${item._id || item.id}-author`, name: item.author || 'Auteur inconnu', role: 'Chercheur' }],
    journal: item.journal || item.source || '',
    abstract: item.abstract || item.summary || 'Aucun résumé n’est encore disponible pour cette publication.',
    introduction: item.introduction || '',
    methodology: item.methodology || '',
    conclusion: item.conclusion || '',
    keywords: Array.isArray(item.keywords) ? item.keywords : [item.keywords || 'recherche'],
    citationsCount: Number(item.citationsCount || 0),
    downloadsCount: Number(item.downloadsCount || 0),
    isPrivate: Boolean(item.isPrivate),
    submittedBy: item.submittedBy?._id || item.submittedBy,
    pdfUrl: item.hasPdf ? `/api/users/publications/${item._id || item.id}/pdf` : undefined,
    doi: item.doi || '',
    department: item.department || 'Recherche',
  });

  const fetchPublications = async () => {
    try {
      const res = await axios.get('/api/users/publications');
      const nextPublications = (res.data || []).map(normalizePublication);
      setPublications(nextPublications);
    } catch (err) {
      console.error('Failed to load publications', err);
      setPublications([]);
    }
  };

  const fetchProfile = async () => {
    if (!localStorage.getItem('session-active')) return setRole(null);

    try {
      const res = await axios.get('/api/users/me');
      const user = res.data || {};
      const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.username || '';

      setRole(Number(user.role));
      setCurrentUserId(String(user._id || user.id || ''));
      setCurrentUserFullName(fullName);
    } catch {
      setRole(null);
      setCurrentUserFullName('');
    }
  };

  const fetchResearchers = async () => {
    try {
      const res = await axios.get('/api/users/researchers');
      setResearcherOptions(res.data || []);
    } catch {
      setResearcherOptions([]);
    }
  };

  useEffect(() => {
    void fetchProfile();
    void fetchPublications();
    void fetchResearchers();
  }, []);

  useEffect(() => {
    const shouldBlurPage = isPdfOpen || showUploadModal;
    document.body.classList.toggle('publication-modal-open', shouldBlurPage);

    if (shouldBlurPage) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }

    return () => {
      document.body.classList.remove('publication-modal-open');
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isPdfOpen, showUploadModal]);

  const handleOpenPdfModal = (pub: Publication) => {
    setActivePublication(pub);
    setIsPdfOpen(true);
  };

  const ensureCurrentUserAuthor = (authors: Array<{ userId: string; name: string }>) => {
    if (!currentUserId || !currentUserFullName.trim()) return authors;
    return authors.some((author) => author.userId === currentUserId)
      ? authors
      : [{ userId: currentUserId, name: currentUserFullName }, ...authors];
  };

  const addSelectedAuthor = () => {
    if (!authorDraft) return;
    const researcher = researcherOptions.find((item) => item._id === authorDraft);
    if (!researcher?._id) return;
    const authorName = [researcher.firstName, researcher.lastName].filter(Boolean).join(' ').trim() || researcher.username || researcher.email || 'Chercheur';

    setSelectedAuthors((prev) => prev.some((author) => author.userId === researcher._id)
      ? prev
      : [...prev, { userId: researcher._id!, name: authorName }]);
    setAuthorDraft('');
  };

  const removeSelectedAuthor = (authorIdToRemove: string) => {
    if (authorIdToRemove === currentUserId) return;
    setSelectedAuthors((prev) => prev.filter((item) => item.userId !== authorIdToRemove));
  };

  useEffect(() => {
    if (!showUploadModal) return;
    setSelectedAuthors((prev) => {
      if (!currentUserId || !currentUserFullName.trim() || prev.some((author) => author.userId === currentUserId)) return prev;
      return [{ userId: currentUserId, name: currentUserFullName }, ...prev];
    });
  }, [showUploadModal, currentUserFullName, currentUserId]);

  const handleSubmitPaper = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!localStorage.getItem('session-active')) {
      setUploadMessage({ type: 'error', text: 'Veuillez vous connecter pour téléverser une publication.' });
      return;
    }

    if (!title.trim()) {
      setUploadMessage({ type: 'error', text: 'Le titre de la publication est requis.' });
      return;
    }

    if (!typeField.trim()) {
      setUploadMessage({ type: 'error', text: 'Le type de la publication est requis.' });
      return;
    }

    if (!year.trim()) {
      setUploadMessage({ type: 'error', text: 'L’année de la publication est requise.' });
      return;
    }

    if (!pdfFile) {
      setUploadMessage({ type: 'error', text: 'Veuillez joindre un fichier PDF.' });
      return;
    }

    setUploadMessage(null);

    const keywords = keywordsText
      .split(',')
      .map((keyword) => keyword.trim())
      .filter(Boolean);

    const authorsPayload = selectedAuthors.length > 0
      ? selectedAuthors
      : [{ ...(currentUserId ? { userId: currentUserId } : {}), name: currentUserFullName || 'Auteur inconnu' }];
    const combinedAuthorDisplay = authorsPayload.map((author) => author.name).join(', ');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('type', typeField);
    formData.append('year', year);
    formData.append('author', combinedAuthorDisplay);
    formData.append('authors', JSON.stringify(authorsPayload));
    formData.append('abstract', summary);
    formData.append('summary', summary);
    formData.append('department', department);
    formData.append('isPrivate', String(isPrivate));
    formData.append('keywords', JSON.stringify(keywords));
    formData.append('details', JSON.stringify(details));
    formData.append('pdf', pdfFile);

    try {
      await axios.post('/api/users/publications', formData);

      setTitle('');
      setTypeField('');
      setDetails({});
      setYear('');
      setSummary('');
      setDepartment('');
      setIsPrivate(false);
      setKeywordsText('');
      setSelectedAuthors([]);
      setAuthorDraft('');
      setPdfFile(null);
      setUploadMessage({ type: 'success', text: 'Publication soumise avec succès. Elle attend maintenant la validation admin.' });
      setShowSuccessPopup(true);
      setShowUploadModal(false);
      await fetchPublications();
    } catch (err: any) {
      console.error('Failed to submit publication', err);
      const message = err?.response?.data?.message || err.message || 'Échec de la soumission de la publication.';
      setUploadMessage({ type: 'error', text: message });
    }
  };

  const handleNextToPreview = () => {
    if (!title.trim() || !typeField.trim() || !year.trim() || !pdfFile) {
      setUploadMessage({ type: 'error', text: 'Veuillez renseigner le titre, le type, l’année et le fichier PDF avant de continuer.' });
      return;
    }

    const selectedType = typeField as PublicationType;
    const missingDetail = publicationDetailFields[selectedType].find((field) => !details[field.key]?.trim());
    if (missingDetail) {
      setUploadMessage({ type: 'error', text: `Le champ « ${missingDetail.label} » est requis pour ce type de publication.` });
      return;
    }

    setUploadMessage(null);
    setShowUploadModal(false);
    setShowDraftPreview(true);
  };

  const handleSubmitEditedPublication = async (editedPublication: Publication) => {
    if (!localStorage.getItem('session-active') || !pdfFile) return;

    const formData = new FormData();
    formData.append('title', editedPublication.title.trim());
    formData.append('type', editedPublication.type.trim());
    formData.append('year', String(editedPublication.year));
    formData.append('author', editedPublication.authors.map((author) => author.name).join(', '));
    formData.append('authors', JSON.stringify(editedPublication.authors.map((author) => ({ name: author.name, userId: author.userId }))));
    formData.append('abstract', editedPublication.abstract.trim());
    formData.append('summary', editedPublication.abstract.trim());
    formData.append('introduction', editedPublication.introduction?.trim() || '');
    formData.append('methodology', editedPublication.methodology?.trim() || '');
    formData.append('conclusion', editedPublication.conclusion?.trim() || '');
    formData.append('department', editedPublication.department.trim());
    formData.append('isPrivate', String(Boolean(editedPublication.isPrivate)));
    formData.append('keywords', JSON.stringify(editedPublication.keywords));
    formData.append('doi', editedPublication.doi.trim());
    formData.append('details', JSON.stringify(editedPublication.details || {}));
    formData.append('pdf', pdfFile);

    try {
      const response = await axios.post('/api/users/publications', formData);
      if (editedPublication.introduction?.trim() && response.data?.introduction !== editedPublication.introduction.trim()) {
        throw new Error('Le serveur n’a pas confirmé l’enregistrement du contenu scientifique. Redémarrez le backend puis réessayez.');
      }
      setShowDraftPreview(false);
      setPdfFile(null);
      setSelectedAuthors([]);
      setTitle('');
      setTypeField('');
      setDetails({});
      setYear('');
      setSummary('');
      setDepartment('');
      setIsPrivate(false);
      setKeywordsText('');
      setUploadMessage({ type: 'success', text: 'Publication soumise avec succès. Elle attend maintenant la validation admin.' });
      setShowSuccessPopup(true);
      await fetchPublications();
    } catch (err: any) {
      setUploadMessage({ type: 'error', text: err?.response?.data?.message || 'Échec de la soumission de la publication.' });
    }
  };

  const draftPreviewPublication: Publication = {
    id: 'draft-preview',
    _id: 'draft-preview',
    title: title.trim() || 'Titre de la publication',
    year: Number(year || new Date().getFullYear()),
    type: typeField || 'Article scientifique',
    authors: selectedAuthors.length > 0
      ? selectedAuthors.map((author, index) => ({ id: `${author.userId}-${index}`, userId: author.userId, name: author.name, role: 'Chercheur' }))
      : [{ id: 'draft-author', name: 'Nom du chercheur', role: 'Chercheur' }],
    journal: '',
    abstract: summary.trim() || '',
    introduction: '',
    methodology: '',
    conclusion: '',
    keywords: keywordsText
      .split(',')
      .map((keyword) => keyword.trim())
      .filter(Boolean).length > 0
      ? keywordsText
        .split(',')
        .map((keyword) => keyword.trim())
        .filter(Boolean)
      : [],
    citationsCount: 0,
    downloadsCount: 0,
    isPrivate,
    doi: '',
    department: department.trim() || 'Département',
    details,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PublicationsView
        publications={publications}
        onOpenPdfModal={handleOpenPdfModal}
        canUploadPaper={role === 0 || role === 1}
        onUploadPaper={() => {
          setUploadMessage(null);
          setSelectedAuthors((prev) => ensureCurrentUserAuthor(prev));
          setShowUploadModal(true);
        }}
        researcherOptions={researcherOptions}
      />

      {showUploadModal && (role === 0 || role === 1) && createPortal(
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/50 p-4"
          onClick={() => setShowUploadModal(false)}
        >
          <div
            className="w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-semibold text-[#1a1c1d]">Téléverser une publication</h3>
                <p className="mt-1 text-sm text-[#414755]">Renseignez les informations et visualisez en direct la carte qui apparaîtra dans l’onglet Publications.</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => {
                  setUploadMessage(null);
                  setShowUploadModal(false);
                }} className="rounded-full border border-[#c1c6d7] px-4 py-2 text-sm font-medium text-[#1a1c1d]">
                  Annuler
                </button>
                <button type="button" onClick={handleNextToPreview} className="rounded-full bg-[#0058bc] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#00489b]">
                  Suivant
                </button>
              </div>
            </div>

            <form id="publication-upload-form" onSubmit={handleSubmitPaper} className="flex max-h-[calc(90vh-7rem)] flex-col gap-4">
              <div className="grid flex-1 gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="max-h-[calc(90vh-10rem)] overflow-y-auto pr-1">
                  <div className="flex flex-col gap-4">
                    {uploadMessage && (
                      <div
                        className={`rounded-xl border px-4 py-3 text-sm ${uploadMessage.type === 'error'
                          ? 'border-red-200 bg-red-50 text-red-700'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          }`}
                      >
                        {uploadMessage.text}
                      </div>
                    )}

                    <input
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="Titre de la publication"
                      className="w-full rounded-xl border border-[#c1c6d7] px-4 py-3 text-sm outline-none focus:border-[#0058bc]"
                    />

                    <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                      <select
                        value={authorDraft}
                        onChange={(event) => setAuthorDraft(event.target.value)}
                        className="w-full rounded-xl border border-[#c1c6d7] px-4 py-3 text-sm outline-none focus:border-[#0058bc]"
                      >
                        <option value="">Sélectionner un auteur</option>
                        {researcherOptions.map((researcher) => {
                          const fullName = [researcher.firstName, researcher.lastName].filter(Boolean).join(' ').trim() || researcher.username || researcher.email || 'Chercheur';
                          return (
                            <option key={researcher._id || researcher.email || fullName} value={researcher._id || ''} disabled={!researcher._id}>
                              {fullName}{researcher.email ? ` · ${researcher.email}` : ''}
                            </option>
                          );
                        })}
                      </select>

                      <button
                        type="button"
                        onClick={addSelectedAuthor}
                        className="inline-flex items-center justify-center rounded-xl bg-[#0058bc] px-4 py-3 text-white shadow-sm transition hover:bg-[#00489b]"
                        title="Ajouter un auteur"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {selectedAuthors.map((author) => {
                        const isCurrentUser = author.userId === currentUserId;
                        return (
                          <span key={author.userId} className="inline-flex items-center gap-2 rounded-full border border-[#c1c6d7] bg-slate-50 px-3 py-1 text-xs font-medium text-[#1a1c1d]">
                            {author.name}
                            {!isCurrentUser && (
                              <button type="button" onClick={() => removeSelectedAuthor(author.userId)} className="rounded-full p-0.5 text-slate-500 hover:bg-slate-200 hover:text-slate-700">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </span>
                        );
                      })}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <select
                        value={typeField}
                        onChange={(event) => {
                          setTypeField(event.target.value as PublicationType | '');
                          setDetails({});
                        }}
                        className="w-full rounded-xl border border-[#c1c6d7] px-4 py-3 text-sm outline-none focus:border-[#0058bc]"
                      >
                        <option value="">Type</option>
                        <option value="Communication">Communication</option>
                        <option value="Article scientifique">Article scientifique</option>
                        <option value="Chapitre d'ouvrage">Chapitre d'ouvrage</option>
                        <option value="Ouvrage scientifique">Ouvrage scientifique</option>
                      </select>

                      <select
                        value={year}
                        onChange={(event) => setYear(event.target.value)}
                        className="w-full rounded-xl border border-[#c1c6d7] px-4 py-3 text-sm outline-none focus:border-[#0058bc]"
                      >
                        <option value="">Année</option>
                        {Array.from({ length: 8 }, (_, index) => 2026 - index).map((value) => (
                          <option key={value} value={value}>{value}</option>
                        ))}
                      </select>
                    </div>

                    {typeField && (
                      <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
                        <h4 className="mb-3 text-sm font-semibold text-[#1a1c1d]">Informations spécifiques</h4>
                        <div className="grid gap-4 md:grid-cols-2">
                          {publicationDetailFields[typeField].map((field) => (
                            <label key={field.key} className="text-sm">
                              <span className="mb-1 block font-medium text-[#414755]">{field.label} *</span>
                              <input
                                required
                                type={field.type || 'text'}
                                value={details[field.key] || ''}
                                onChange={(event) => setDetails((current) => ({ ...current, [field.key]: event.target.value }))}
                                placeholder={field.placeholder}
                                className="w-full rounded-xl border border-[#c1c6d7] bg-white px-4 py-3 text-sm outline-none focus:border-[#0058bc]"
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf"
                      onChange={(event: ChangeEvent<HTMLInputElement>) => setPdfFile(event.target.files?.[0] ?? null)}
                      className="hidden"
                    />

                    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-[#c1c6d7] bg-slate-50 px-4 py-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-full border border-[#c1c6d7] bg-white px-4 py-2 text-sm font-medium text-[#1a1c1d]"
                      >
                        Choisir PDF
                      </button>
                      <span className="text-sm text-[#414755]">{pdfFile ? pdfFile.name : 'Aucun fichier sélectionné'}</span>
                    </div>

                    <label className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm text-amber-900">
                      <input
                        type="checkbox"
                        checked={isPrivate}
                        onChange={(event) => setIsPrivate(event.target.checked)}
                        className="mt-0.5 h-4 w-4 accent-[#0058bc]"
                      />
                      <span>
                        <span className="block font-semibold">PDF privé</span>
                        <span className="block text-xs text-amber-800">Le résumé restera visible, mais le téléchargement nécessitera votre autorisation.</span>
                      </span>
                    </label>

                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 self-start">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#414755]">Aperçu</h4>
                    <span className="rounded-full bg-[#0058bc]/10 px-3 py-1 text-[10px] font-semibold text-[#0058bc]">Carte de publication</span>
                  </div>

                  <PublicationCard publication={draftPreviewPublication} />
                </div>
              </div>

            </form>
          </div>
        </div>,
        document.body
      )}

      {showDraftPreview && (
        <PdfViewerModal
          publication={draftPreviewPublication}
          editable
          onClose={() => {
            setShowDraftPreview(false);
            setShowUploadModal(true);
          }}
          onBack={() => {
            setShowDraftPreview(false);
            setShowUploadModal(true);
          }}
          onSubmit={handleSubmitEditedPublication}
        />
      )}

      {showSuccessPopup && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-emerald-200 bg-white p-6 text-center shadow-2xl">
            <h3 className="text-xl font-semibold text-[#1a1c1d]">Publication soumise avec succès</h3>
            <p className="mt-2 text-sm text-[#414755]">Votre papier a été transmis avec succès.</p>
            <button
              type="button"
              onClick={() => setShowSuccessPopup(false)}
              className="mt-5 rounded-full bg-[#0058bc] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#00489b]"
            >
              OK
            </button>
          </div>
        </div>,
        document.body
      )}

      {isPdfOpen && activePublication && (
        <PdfViewerModal
          publication={activePublication}
          onClose={() => setIsPdfOpen(false)}
          canDownloadPrivate={Boolean(activePublication.submittedBy && activePublication.submittedBy === currentUserId)}
          onRequestAccess={async () => {
            if (!localStorage.getItem('session-active')) throw new Error('Veuillez vous connecter pour demander l’accès au PDF.');
            await axios.post(`/api/users/publications/${activePublication.id}/access-request`);
          }}
          onDownloadCountChange={(count) => {
            setActivePublication((current) => current ? { ...current, downloadsCount: count } : current);
            setPublications((current) => current.map((item) => item.id === activePublication.id ? { ...item, downloadsCount: count } : item));
          }}
        />
      )}

    </div>
  );
}

export default Publications;