import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { ArrowLeft, BookOpen, LayoutDashboard, Newspaper, ShieldCheck, UsersRound } from 'lucide-react';
import type { PublicationType } from '../types';

interface PendingUserRequest {
  _id: string;
  name: string;
  email: string;
  role: number;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  user?: {
    _id: string;
    username: string;
    email: string;
    role: number;
    phoneNumber?: string;
    country?: string;
  };
}

interface PendingPublication {
  _id: string;
  title: string;
  author: string;
  summary: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  pdfPath?: string;
  year?: number;
  type?: string;
  details?: Record<string, string>;
  abstract?: string;
  doi?: string;
  journal?: string;
  department?: string;
  authors?: Array<{ name: string; userId?: string }>;
  keywords?: string[];
  isDisabled?: boolean;
}

interface PendingActualite {
  _id: string;
  title: string;
  category: string;
  author: string;
  excerpt: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  date?: string;
  content?: string;
  submittedBy?: {
    username: string;
    email: string;
    role: number;
  };
}

interface AdminStats {
  totalUsers: number;
  researchers: number;
  visitors: number;
  onlineUsers: number;
  pendingUsers: number;
  totalPublications: number;
  pendingPublications: number;
  approvedPublications: number;
  rejectedPublications: number;
  totalActualites: number;
  pendingActualites: number;
  approvedActualites: number;
  rejectedActualites: number;
}

interface AdminUser {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: number;
  phoneNumber?: string;
  country?: string;
  isDisabled?: boolean;
  createdAt: string;
}

interface AdminPublication {
  [key: string]: unknown;
  _id: string;
  title: string;
  author: string;
  summary: string;
  status: 'pending' | 'approved' | 'rejected' | 'deleted';
  createdAt: string;
  year?: number;
  type?: string;
  details?: Record<string, string>;
  abstract?: string;
  introduction?: string;
  methodology?: string;
  conclusion?: string;
  doi?: string;
  journal?: string;
  department?: string;
  authors?: Array<{ name: string; userId?: string }>;
  keywords?: string[];
  citationsCount?: number;
  downloadsCount?: number;
  isPrivate?: boolean;
  pdfPath?: string;
  isDisabled?: boolean;
  submittedBy?: {
    username: string;
    email: string;
    role: number;
  };
}

const publicationDetailFields: Record<PublicationType, Array<{ key: string; label: string; type?: 'text' | 'url' | 'date' }>> = {
  Communication: [
    { key: 'conferenceTitle', label: 'Titre de la conférence' },
    { key: 'conferenceLocation', label: 'Lieu de la conférence' },
    { key: 'country', label: 'Pays' },
    { key: 'pages', label: 'Pages' },
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
    { key: 'publisher', label: 'Éditeur' },
    { key: 'publisherLink', label: "Lien de l'éditeur", type: 'url' },
    { key: 'edition', label: 'Édition' },
    { key: 'isbnIssn', label: 'ISBN / ISSN' },
    { key: 'pages', label: 'Pages' },
    { key: 'publicationDate', label: 'Date de parution', type: 'date' },
  ],
  'Ouvrage scientifique': [
    { key: 'publisher', label: 'Éditeur' },
    { key: 'publisherLink', label: "Lien de l'éditeur", type: 'url' },
    { key: 'edition', label: 'Édition' },
    { key: 'isbnIssn', label: 'ISBN / ISSN' },
    { key: 'pages', label: 'Pages' },
    { key: 'publicationDate', label: 'Date de parution', type: 'date' },
  ],
};

const publicationStatusLabel = (status: AdminPublication['status']) => ({
  pending: 'En attente',
  approved: 'Approuvée',
  rejected: 'Refusée',
  deleted: 'Supprimée',
}[status]);

type TabKey = 'dashboard' | 'users' | 'publications' | 'actualites';

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [pendingUsers, setPendingUsers] = useState<PendingUserRequest[]>([]);
  const [pendingPublications, setPendingPublications] = useState<PendingPublication[]>([]);
  const [pendingActualites, setPendingActualites] = useState<PendingActualite[]>([]);
  const [editingActualiteId, setEditingActualiteId] = useState<string | null>(null);
  const [editingActualite, setEditingActualite] = useState<Partial<PendingActualite> | null>(null);
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [allPublications, setAllPublications] = useState<AdminPublication[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    researchers: 0,
    visitors: 0,
    onlineUsers: 0,
    pendingUsers: 0,
    totalPublications: 0,
    pendingPublications: 0,
    approvedPublications: 0,
    rejectedPublications: 0,
    totalActualites: 0,
    pendingActualites: 0,
    approvedActualites: 0,
    rejectedActualites: 0,
  });
  const [loading, setLoading] = useState(true);
  const [busyIds, setBusyIds] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<Partial<AdminUser> | null>(null);
  const [editingPublicationId, setEditingPublicationId] = useState<string | null>(null);
  const [editingPublication, setEditingPublication] = useState<Partial<AdminPublication> | null>(null);
  const [editingPublicationOriginalStatus, setEditingPublicationOriginalStatus] = useState<AdminPublication['status'] | null>(null);
  const [editingPublicationAuthorId, setEditingPublicationAuthorId] = useState('');
  const [selectedPublicationId, setSelectedPublicationId] = useState<string | null>(null);
  const [selectedPendingPublicationId, setSelectedPendingPublicationId] = useState<string | null>(null);
  const [userFilters, setUserFilters] = useState({ query: '', role: 'all', status: 'all' });
  const [publicationFilters, setPublicationFilters] = useState({ query: '', status: 'all', type: 'all' });
  const [actualiteFilters, setActualiteFilters] = useState({ query: '', status: 'all', category: 'all' });

  const loadDashboardData = async () => {
    try {
      const profileRes = await axios.get('/api/users/me');
      if (Number(profileRes.data?.role) !== 0) {
        setErrorMessage('Seul un compte administrateur peut accéder à ces files de validation.');
        setLoading(false);
        return;
      }

      const [statsRes, usersRes, publicationsRes, pendingUsersRes, pendingPublicationsRes, pendingActualitesRes] = await Promise.all([
        axios.get('/api/users/admin/stats'),
        axios.get('/api/users/admin/users'),
        axios.get('/api/users/admin/publications'),
        axios.get('/api/users/admin/pending-users'),
        axios.get('/api/users/admin/pending-publications'),
        axios.get('/api/users/admin/actualites'),
      ]);

      setStats(statsRes.data || {
        totalUsers: 0,
        researchers: 0,
        visitors: 0,
        onlineUsers: 0,
        pendingUsers: 0,
        totalPublications: 0,
        pendingPublications: 0,
        approvedPublications: 0,
        rejectedPublications: 0,
        totalActualites: 0,
        pendingActualites: 0,
        approvedActualites: 0,
        rejectedActualites: 0,
      });
      setAllUsers(usersRes.data || []);
      setAllPublications(publicationsRes.data || []);
      setPendingUsers(pendingUsersRes.data || []);
      setPendingPublications(pendingPublicationsRes.data || []);
      setPendingActualites(pendingActualitesRes.data || []);
      setErrorMessage(null);
    } catch (err: any) {
      console.error('Failed to load admin dashboard data', err);
      const status = err.response?.status;
      const serverMessage = err.response?.data?.message || err.message || 'Impossible de charger les données du tableau de bord.';

      if (status === 401 || status === 403) {
        localStorage.removeItem('session-active');
        setErrorMessage(status === 401 ? 'Votre session a expiré. Veuillez vous reconnecter.' : 'Seul un compte administrateur peut accéder à ces files de validation.');
        navigate('/SignIn');
      } else {
        setErrorMessage(serverMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    const handleFocus = () => loadDashboardData();
    const intervalId = window.setInterval(() => loadDashboardData(), 10000);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
  }, [navigate]);

  const handleDecision = async (type: 'user' | 'publication' | 'actualite', id: string, decision: 'approve' | 'reject') => {
    if (!localStorage.getItem('session-active')) return;

    setBusyIds((prev) => [...prev, id]);

    try {
      if (type === 'user') {
        await axios.post(`/api/users/admin/pending-users/${id}/${decision}`, {});
      } else if (type === 'publication') {
        await axios.post(`/api/users/admin/pending-publications/${id}/${decision}`, {});
      } else {
        await axios.post(`/api/users/admin/pending-actualites/${id}/${decision}`, {});
      }
      await loadDashboardData();
    } catch (err) {
      console.error('Failed to update request', err);
    } finally {
      setBusyIds((prev) => prev.filter((busyId) => busyId !== id));
    }
  };

  const viewPdf = async (id: string) => {
    try {
      const res = await axios.get(`/api/users/publications/${id}/pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      console.error('Failed to load PDF', err);
      alert('Impossible d’ouvrir le PDF.');
    }
  };

  const renderPublicationDetails = (publication: PendingPublication | AdminPublication) => {
    const detailEntries = Object.entries(publication.details || {});
    return (
      <div className="mt-3 space-y-3 rounded border border-gray-200 bg-gray-50 p-3 text-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <div><span className="font-medium text-gray-700">Résumé :</span><p className="mt-1 text-gray-900">{publication.abstract || publication.summary || 'N/D'}</p></div>
          <div><span className="font-medium text-gray-700">Journal / revue :</span><p className="mt-1 text-gray-900">{publication.journal || 'N/D'}</p></div>
          <div><span className="font-medium text-gray-700">DOI :</span><p className="mt-1 text-gray-900">{publication.doi || 'N/D'}</p></div>
          <div><span className="font-medium text-gray-700">Département :</span><p className="mt-1 text-gray-900">{publication.department || 'N/D'}</p></div>
          <div><span className="font-medium text-gray-700">Auteurs :</span><p className="mt-1 text-gray-900">{publication.authors?.map((author) => author.name).join(', ') || publication.author || 'N/D'}</p></div>
          <div><span className="font-medium text-gray-700">Mots-clés :</span><p className="mt-1 text-gray-900">{publication.keywords?.join(', ') || 'N/D'}</p></div>
        </div>
        {detailEntries.length > 0 && (
          <div className="border-t border-gray-200 pt-3">
            <h4 className="mb-2 font-medium text-gray-700">Informations spécifiques</h4>
            <dl className="grid gap-x-4 gap-y-2 md:grid-cols-2">
              {detailEntries.map(([key, value]) => (
                <div key={key}>
                  <dt className="font-medium text-gray-700">{key}</dt>
                  <dd className="break-words text-gray-900">{value || 'N/A'}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    );
  };

  const exportPublications = (type: PublicationType) => {
    const publications = Array.from(
      new Map([...pendingPublications, ...allPublications].map((publication) => [publication._id, publication])).values()
    ).filter((publication) => publication.type === type);
    const getDetails = (publication: PendingPublication | AdminPublication, key: string) => publication.details?.[key] || (publication as unknown as Record<string, string>)[key] || '';
    const getAuthors = (publication: PendingPublication | AdminPublication) => publication.authors?.map((author) => author.name).join('; ') || publication.author || '';
    const rows = publications.map((publication, index) => {
      if (type === 'Communication') {
        return [
          index + 1,
          publication.year || '',
          getAuthors(publication),
          publication.title,
          getDetails(publication, 'conferenceTitle'),
          getDetails(publication, 'conferenceLocation'),
          getDetails(publication, 'country'),
          getDetails(publication, 'pages'),
          getDetails(publication, 'dates'),
          getDetails(publication, 'conferenceSite'),
        ];
      }

      if (type === 'Article scientifique') {
        return [
          index + 1,
          publication.year || '',
          getAuthors(publication),
          publication.title,
          getDetails(publication, 'volume'),
          getDetails(publication, 'pages'),
          getDetails(publication, 'firstPublicationDate'),
          getDetails(publication, 'doi') || publication.doi || '',
          getDetails(publication, 'journalTitle') || publication.journal || '',
          getDetails(publication, 'journalIssn'),
          getDetails(publication, 'journalQuartile2025'),
          getDetails(publication, 'publicationQuartile'),
          getDetails(publication, 'impactFactor2025'),
          getDetails(publication, 'publicationImpactFactor'),
          getDetails(publication, 'indexation'),
          getDetails(publication, 'journalSite'),
          getDetails(publication, 'paperLink'),
        ];
      }

      return [
        publication.year || '',
        getAuthors(publication),
        publication.title,
        getDetails(publication, 'publisher'),
        getDetails(publication, 'publisherLink'),
        getDetails(publication, 'edition'),
        getDetails(publication, 'isbnIssn'),
        getDetails(publication, 'pages'),
        getDetails(publication, 'publicationDate'),
      ];
    });
    const headers = type === 'Communication'
      ? ['N°', 'Année', 'Auteurs (Nom1, Prénom1; Nom2, Prénom2,...)', 'Titre de la communication', 'Titre de la conférence', 'Lieu de la conférence', 'Pays', 'Pages', 'Dates', 'Site de la conférence']
      : type === 'Article scientifique'
        ? ['N°', 'Année', "Auteurs (Prénom1, Nom1; Prénom2, Nom2,...)", "Titre de l'article", 'Volume', 'Pages', 'Date de la première parution', 'DOI', 'Titre du Journal/Revue', 'ISSN du Journal/Revue', 'Quartile du Journal/Revue', "Quartile du Journal/Revue lors de l'apparition de l'article", "Facteur d'impact", "Facteur d'impact lors de l'apparition de l'article", 'Indexation', 'Site de la revue', 'Paper link']
        : ['Année', 'Auteurs (Nom1, Prénom1; Nom2, Prénom2,...)', 'Titre', 'Éditeur', "Lien de l'éditeur", 'Édition', 'ISBN/ISSN', 'Pages', 'Date de parution'];
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    worksheet['!cols'] = headers.map(() => ({ wch: 24 }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, type.slice(0, 31));
    const filename = type === 'Communication'
      ? 'communications.xlsx'
      : type === 'Article scientifique'
        ? 'articles-scientifiques.xlsx'
        : type === "Chapitre d'ouvrage"
          ? 'chapitres-d-ouvrage.xlsx'
          : 'ouvrages-scientifiques.xlsx';
    XLSX.writeFile(workbook, filename);
  };

  const startEditingPublication = (publication: AdminPublication) => {
    const detailKeys = [...new Set(Object.values(publicationDetailFields).flatMap((fields) => fields.map((field) => field.key)))];
    const details = { ...(publication.details || {}) };
    for (const key of detailKeys) {
      const value = details[key] ?? publication[key];
      details[key] = typeof value === 'string' ? value : '';
    }

    setEditingPublicationId(publication._id);
    setEditingPublicationAuthorId('');
    setEditingPublicationOriginalStatus(publication.status);
    setEditingPublication({
      _id: publication._id,
      title: publication.title,
      author: publication.author,
      summary: publication.summary || '',
      abstract: publication.abstract || '',
      introduction: publication.introduction || '',
      methodology: publication.methodology || '',
      conclusion: publication.conclusion || '',
      year: publication.year,
      type: publication.type || '',
      status: publication.status,
      journal: publication.journal || '',
      department: publication.department || '',
      doi: publication.doi || '',
      authors: publication.authors?.length ? publication.authors : publication.author ? [{ name: publication.author }] : [],
      keywords: publication.keywords || [],
      citationsCount: publication.citationsCount ?? 0,
      downloadsCount: publication.downloadsCount ?? 0,
      isPrivate: publication.isPrivate ?? false,
      details,
    });
  };

  const cancelEditingPublication = () => {
    setEditingPublicationId(null);
    setEditingPublication(null);
    setEditingPublicationOriginalStatus(null);
    setEditingPublicationAuthorId('');
  };

  const savePublicationEdits = async () => {
    if (!localStorage.getItem('session-active') || !editingPublication?._id) return;

    setBusyIds((prev) => [...prev, editingPublication._id!]);
    try {
      await axios.put(`/api/users/admin/publications/${editingPublication._id}`, {
        title: editingPublication.title,
        author: editingPublication.author,
        authors: editingPublication.authors,
        summary: editingPublication.summary,
        abstract: editingPublication.abstract,
        introduction: editingPublication.introduction,
        methodology: editingPublication.methodology,
        conclusion: editingPublication.conclusion,
        year: editingPublication.year,
        type: editingPublication.type,
        ...(editingPublication.status !== 'deleted' ? { status: editingPublication.status } : {}),
        journal: editingPublication.journal,
        department: editingPublication.department,
        doi: editingPublication.doi,
        keywords: editingPublication.keywords,
        citationsCount: editingPublication.citationsCount,
        downloadsCount: editingPublication.downloadsCount,
        isPrivate: editingPublication.isPrivate,
        details: editingPublication.details,
      });

      await loadDashboardData();
      cancelEditingPublication();
    } catch (err: any) {
      console.error('Failed to update publication', err);
      const serverMessage = err.response?.data?.message || err.message || 'Unable to update this publication right now.';
      const status = err.response?.status;
      const message = status === 401
        ? 'Votre session a expiré. Veuillez vous reconnecter.'
        : status === 403
          ? 'Only an admin account can update publications.'
          : serverMessage;
      setErrorMessage(message);
    } finally {
      setBusyIds((prev) => prev.filter((busyId) => busyId !== editingPublication._id));
    }
  };

  const renderPublicationEditForm = () => {
    if (!editingPublication) return null;
    const selectedType = typeof editingPublication.type === 'string' && Object.prototype.hasOwnProperty.call(publicationDetailFields, editingPublication.type)
      ? editingPublication.type as PublicationType
      : null;
    const updateEditingPublication = (field: keyof AdminPublication, value: unknown) => {
      setEditingPublication((current) => current ? { ...current, [field]: value } : current);
    };

    return (
      <div className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block font-medium">Titre</span>
            <input
              value={editingPublication.title || ''}
              onChange={(event) => updateEditingPublication('title', event.target.value)}
              className="w-full rounded border border-gray-300 px-2 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Auteur (affichage)</span>
            <input
              value={editingPublication.author || ''}
              onChange={(event) => updateEditingPublication('author', event.target.value)}
              className="w-full rounded border border-gray-300 px-2 py-2"
            />
          </label>
          <div className="space-y-2 text-sm md:col-span-2">
            <span className="block font-medium">Auteurs associés aux comptes</span>
            <div className="flex flex-wrap gap-2">
              {(editingPublication.authors || []).map((author, index) => (
                <span key={`${author.userId || 'external'}-${author.name}-${index}`} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
                  {author.name}{author.userId ? ' · compte lié' : ' · non lié'}
                  <button
                    type="button"
                    onClick={() => updateEditingPublication('authors', (editingPublication.authors || []).filter((_, authorIndex) => authorIndex !== index))}
                    className="font-semibold text-slate-500 hover:text-red-600"
                    aria-label={`Retirer ${author.name}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <select value={editingPublicationAuthorId} onChange={(event) => setEditingPublicationAuthorId(event.target.value)} className="min-w-0 flex-1 rounded border border-gray-300 px-2 py-2">
                <option value="">Sélectionner un chercheur</option>
                {allUsers.filter((user) => (user.role === 0 || user.role === 1) && !user.isDisabled).map((user) => (
                  <option key={user._id} value={user._id}>
                    {[user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.username} · {user.email}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!editingPublicationAuthorId || (editingPublication.authors || []).some((author) => author.userId === editingPublicationAuthorId)}
                onClick={() => {
                  const selectedUser = allUsers.find((user) => user._id === editingPublicationAuthorId);
                  if (!selectedUser) return;
                  const name = [selectedUser.firstName, selectedUser.lastName].filter(Boolean).join(' ').trim() || selectedUser.username;
                  updateEditingPublication('authors', [...(editingPublication.authors || []), { userId: selectedUser._id, name }]);
                  setEditingPublicationAuthorId('');
                }}
                className="rounded border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
              >
                Ajouter
              </button>
            </div>
            <p className="text-xs text-slate-500">Les auteurs non liés restent affichés par leur nom, mais ne sont associés à aucun profil.</p>
          </div>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Année</span>
            <input
              type="number"
              value={editingPublication.year ?? ''}
              onChange={(event) => updateEditingPublication('year', event.target.value ? Number(event.target.value) : undefined)}
              className="w-full rounded border border-gray-300 px-2 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Type</span>
            <select
              value={editingPublication.type || ''}
              onChange={(event) => {
                const type = event.target.value;
                updateEditingPublication('type', type);
                if (type && Object.prototype.hasOwnProperty.call(publicationDetailFields, type)) {
                  updateEditingPublication(
                    'details',
                    Object.fromEntries(publicationDetailFields[type as PublicationType].map((field) => [field.key, ''])),
                  );
                }
              }}
              className="w-full rounded border border-gray-300 px-2 py-2"
            >
              <option value="">Sélectionner un type</option>
              <option value="Communication">Communication</option>
              <option value="Article scientifique">Article scientifique</option>
              <option value="Chapitre d'ouvrage">Chapitre d'ouvrage</option>
              <option value="Ouvrage scientifique">Ouvrage scientifique</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Journal / revue</span>
            <input value={editingPublication.journal || ''} onChange={(event) => updateEditingPublication('journal', event.target.value)} className="w-full rounded border border-gray-300 px-2 py-2" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Département</span>
            <input value={editingPublication.department || ''} onChange={(event) => updateEditingPublication('department', event.target.value)} className="w-full rounded border border-gray-300 px-2 py-2" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">DOI</span>
            <input value={editingPublication.doi || ''} onChange={(event) => updateEditingPublication('doi', event.target.value)} className="w-full rounded border border-gray-300 px-2 py-2" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Mots-clés (séparés par des virgules)</span>
            <input
              value={editingPublication.keywords?.join(', ') || ''}
              onChange={(event) => updateEditingPublication('keywords', event.target.value.split(',').map((keyword) => keyword.trim()).filter(Boolean))}
              className="w-full rounded border border-gray-300 px-2 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Nombre de citations</span>
            <input type="number" min="0" value={editingPublication.citationsCount ?? 0} onChange={(event) => updateEditingPublication('citationsCount', Number(event.target.value))} className="w-full rounded border border-gray-300 px-2 py-2" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium">Nombre de téléchargements</span>
            <input type="number" min="0" value={editingPublication.downloadsCount ?? 0} onChange={(event) => updateEditingPublication('downloadsCount', Number(event.target.value))} className="w-full rounded border border-gray-300 px-2 py-2" />
          </label>
        </div>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Résumé</span>
          <textarea
            value={editingPublication.summary || ''}
            onChange={(event) => updateEditingPublication('summary', event.target.value)}
            className="min-h-24 w-full rounded border border-gray-300 px-2 py-2"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Résumé scientifique / abstract</span>
          <textarea value={editingPublication.abstract || ''} onChange={(event) => updateEditingPublication('abstract', event.target.value)} className="min-h-24 w-full rounded border border-gray-300 px-2 py-2" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Introduction</span>
          <textarea value={editingPublication.introduction || ''} onChange={(event) => updateEditingPublication('introduction', event.target.value)} className="min-h-24 w-full rounded border border-gray-300 px-2 py-2" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Méthodologie</span>
          <textarea value={editingPublication.methodology || ''} onChange={(event) => updateEditingPublication('methodology', event.target.value)} className="min-h-24 w-full rounded border border-gray-300 px-2 py-2" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium">Conclusion</span>
          <textarea value={editingPublication.conclusion || ''} onChange={(event) => updateEditingPublication('conclusion', event.target.value)} className="min-h-24 w-full rounded border border-gray-300 px-2 py-2" />
        </label>
        {selectedType && (
          <fieldset className="space-y-3 rounded border border-gray-200 p-3">
            <legend className="px-1 text-sm font-medium">Informations spécifiques — {selectedType}</legend>
            <div className="grid gap-3 md:grid-cols-2">
              {publicationDetailFields[selectedType].map((field) => (
                <label key={field.key} className="text-sm">
                  <span className="mb-1 block font-medium">{field.label}</span>
                  <input
                    type={field.type || 'text'}
                    value={editingPublication.details?.[field.key] || ''}
                    onChange={(event) => updateEditingPublication('details', { ...(editingPublication.details || {}), [field.key]: event.target.value })}
                    className="w-full rounded border border-gray-300 px-2 py-2"
                  />
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={Boolean(editingPublication.isPrivate)} onChange={(event) => updateEditingPublication('isPrivate', event.target.checked)} />
          Publication privée
        </label>
        {editingPublication.status === 'deleted' ? (
          <p className="text-sm text-gray-600">Statut : Supprimée</p>
        ) : (
          <label className="text-sm">
            <span className="mb-1 block font-medium">Statut</span>
            <select
              value={editingPublication.status || 'pending'}
              onChange={(event) => updateEditingPublication('status', event.target.value as AdminPublication['status'])}
              className="w-full rounded border border-gray-300 px-2 py-2"
            >
              {editingPublicationOriginalStatus === 'pending' && <option value="pending">En attente</option>}
              <option value="approved">Approuvée</option>
              <option value="rejected">Refusée</option>
            </select>
          </label>
        )}
        <div className="flex gap-2">
          <button type="button" disabled={busyIds.includes(editingPublication._id || '')} onClick={() => void savePublicationEdits()} className="rounded border border-gray-300 bg-black px-3 py-1 text-sm text-white disabled:opacity-50">Enregistrer</button>
          <button type="button" disabled={busyIds.includes(editingPublication._id || '')} onClick={cancelEditingPublication} className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-50">Annuler</button>
        </div>
      </div>
    );
  };

  const selectedUser = pendingUsers.find((request) => request._id === selectedUserId) || null;

  const startEditingUser = (user: AdminUser) => {
    setEditingUserId(user._id);
    setEditingUser({
      _id: user._id,
      username: user.username,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phoneNumber: user.phoneNumber || '',
      country: user.country || '',
      role: user.role,
    });
  };

  const cancelEditingUser = () => {
    setEditingUserId(null);
    setEditingUser(null);
  };

  const saveUserEdits = async () => {
    if (!localStorage.getItem('session-active') || !editingUser?._id) return;

    setBusyIds((prev) => [...prev, editingUser._id!]);
    try {
      await axios.put(`/api/users/admin/users/${editingUser._id}`, {
        username: editingUser.username,
        firstName: editingUser.firstName,
        lastName: editingUser.lastName,
        phoneNumber: editingUser.phoneNumber,
        country: editingUser.country,
        role: editingUser.role,
      });

      await loadDashboardData();
      cancelEditingUser();
    } catch (err) {
      console.error('Failed to update user', err);
      setErrorMessage('Unable to update this user right now.');
    } finally {
      setBusyIds((prev) => prev.filter((busyId) => busyId !== editingUser._id));
    }
  };

  const toggleUserDisabled = async (userId: string, disabled: boolean) => {
    if (!localStorage.getItem('session-active')) return;

    setBusyIds((prev) => [...prev, userId]);
    try {
      await axios.put(`/api/users/admin/users/${userId}/${disabled ? 'disable' : 'restore'}`, {});
      await loadDashboardData();
    } catch (err) {
      console.error('Failed to update user status', err);
      setErrorMessage('Unable to update this user status right now.');
    } finally {
      setBusyIds((prev) => prev.filter((busyId) => busyId !== userId));
    }
  };

  const startEditingActualite = (actualite: PendingActualite) => {
    setEditingActualiteId(actualite._id);
    setEditingActualite({ ...actualite });
  };

  const cancelEditingActualite = () => {
    setEditingActualiteId(null);
    setEditingActualite(null);
  };

  const saveActualiteEdits = async () => {
    if (!localStorage.getItem('session-active') || !editingActualite?._id) return;

    setBusyIds((prev) => [...prev, editingActualite._id!]);
    try {
      await axios.put(`/api/users/admin/actualites/${editingActualite._id}`, editingActualite);
      await loadDashboardData();
      cancelEditingActualite();
    } catch (err: any) {
      const status = err.response?.status;
      const serverMessage = err.response?.data?.message || err.message || 'Unable to update this actualité right now.';
      setErrorMessage(status === 401 ? 'Your session has expired. Please sign in again.' : serverMessage);
    } finally {
      setBusyIds((prev) => prev.filter((busyId) => busyId !== editingActualite._id));
    }
  };

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: 'dashboard', label: 'Tableau de bord' },
    { key: 'users', label: 'Utilisateurs' },
    { key: 'publications', label: 'Publications' },
    { key: 'actualites', label: 'Actualités' },
  ];
  const tabIcons: Record<TabKey, typeof LayoutDashboard> = {
    dashboard: LayoutDashboard,
    users: UsersRound,
    publications: BookOpen,
    actualites: Newspaper,
  };

  const renderActualites = () => {
    const actualiteQuery = actualiteFilters.query.trim().toLowerCase();
    const matchesActualiteFilters = (actualite: PendingActualite) => {
      const haystack = [actualite.title, actualite.author, actualite.excerpt, actualite.category].filter(Boolean).join(' ').toLowerCase();
      const matchesQuery = !actualiteQuery || haystack.includes(actualiteQuery);
      const matchesStatus = actualiteFilters.status === 'all' || actualite.status === actualiteFilters.status;
      const matchesCategory = actualiteFilters.category === 'all' || actualite.category === actualiteFilters.category;
      return matchesQuery && matchesStatus && matchesCategory;
    };

    const filteredPendingActualites = pendingActualites.filter((actualite) => actualite.status === 'pending' && matchesActualiteFilters(actualite));
    const filteredAllActualites = pendingActualites
      .filter((actualite) => actualite.status !== 'pending')
      .filter(matchesActualiteFilters);
    const categories = Array.from(new Set(pendingActualites.map((actualite) => actualite.category).filter(Boolean)));

    const renderActualiteRow = (actualite: PendingActualite) => (
      <div key={actualite._id} className="border border-gray-200 p-3">
        {editingActualiteId === actualite._id && editingActualite ? (
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm"><span className="mb-1 block font-medium">Title</span><input value={editingActualite.title || ''} onChange={(event) => setEditingActualite({ ...editingActualite, title: event.target.value })} className="w-full rounded border border-gray-300 px-2 py-2" /></label>
              <label className="text-sm"><span className="mb-1 block font-medium">Author</span><input value={editingActualite.author || ''} onChange={(event) => setEditingActualite({ ...editingActualite, author: event.target.value })} className="w-full rounded border border-gray-300 px-2 py-2" /></label>
              <label className="text-sm"><span className="mb-1 block font-medium">Date</span><input type="date" value={editingActualite.date || ''} onChange={(event) => setEditingActualite({ ...editingActualite, date: event.target.value })} className="w-full rounded border border-gray-300 px-2 py-2" /></label>
              <label className="text-sm"><span className="mb-1 block font-medium">Category</span><select value={editingActualite.category || 'Événement'} onChange={(event) => setEditingActualite({ ...editingActualite, category: event.target.value })} className="w-full rounded border border-gray-300 px-2 py-2"><option>Événement</option><option>Découverte</option><option>Distinction</option><option>Partenariat</option><option>Conférence</option></select></label>
            </div>
            <label className="text-sm"><span className="mb-1 block font-medium">Excerpt</span><textarea value={editingActualite.excerpt || ''} onChange={(event) => setEditingActualite({ ...editingActualite, excerpt: event.target.value })} className="min-h-20 w-full rounded border border-gray-300 px-2 py-2" /></label>
            <label className="text-sm"><span className="mb-1 block font-medium">Content</span><textarea value={editingActualite.content || ''} onChange={(event) => setEditingActualite({ ...editingActualite, content: event.target.value })} className="min-h-32 w-full rounded border border-gray-300 px-2 py-2" /></label>
            <label className="text-sm"><span className="mb-1 block font-medium">Statut</span><select value={editingActualite.status || 'pending'} onChange={(event) => setEditingActualite({ ...editingActualite, status: event.target.value as PendingActualite['status'] })} className="w-full rounded border border-gray-300 px-2 py-2"><option value="pending">En attente</option><option value="approved">Approuvée</option><option value="rejected">Refusée</option></select></label>
            <div className="flex gap-2">
              <button type="button" disabled={busyIds.includes(actualite._id)} onClick={() => void saveActualiteEdits()} className="rounded border border-gray-300 bg-black px-3 py-1 text-sm text-white disabled:opacity-50">Enregistrer</button>
              <button type="button" disabled={busyIds.includes(actualite._id)} onClick={cancelEditingActualite} className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-50">Annuler</button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-medium">{actualite.title}</div>
              <div className="text-sm text-gray-600">{actualite.category} • {actualite.author}</div>
              <div className="mt-1 text-xs font-semibold uppercase text-gray-500">
                Statut : {actualite.status} • Soumise le : {new Date(actualite.createdAt).toLocaleDateString()}
              </div>
              <div className="mt-1 text-sm text-gray-600">{actualite.excerpt}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {actualite.status !== 'approved' && (
                <button type="button" disabled={busyIds.includes(actualite._id)} onClick={() => void handleDecision('actualite', actualite._id, 'approve')} className="w-full rounded border border-gray-300 px-3 py-1 text-sm sm:w-auto">Approuver</button>
              )}
              {actualite.status !== 'rejected' && (
                <button type="button" disabled={busyIds.includes(actualite._id)} onClick={() => void handleDecision('actualite', actualite._id, 'reject')} className="w-full rounded border border-gray-300 px-3 py-1 text-sm sm:w-auto">Refuser</button>
              )}
              <button type="button" onClick={() => startEditingActualite(actualite)} className="w-full rounded border border-gray-300 px-3 py-1 text-sm sm:w-auto">Modifier</button>
            </div>
          </div>
        )}
      </div>
    );

    return (
      <div className="space-y-6">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total actualités" value={stats.totalActualites.toString()} />
          <StatCard label="En attente" value={stats.pendingActualites.toString()} />
          <StatCard label="Approuvées" value={stats.approvedActualites.toString()} />
          <StatCard label="Refusées" value={stats.rejectedActualites.toString()} />
        </div>

        <div className="rounded border border-gray-300 bg-white p-4">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="font-semibold">Filtrer les actualités</h2>
              <p className="text-sm text-gray-600">Rechercher par titre, auteur, extrait ou catégorie.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="search"
                value={actualiteFilters.query}
                onChange={(event) => setActualiteFilters((prev) => ({ ...prev, query: event.target.value }))}
                placeholder="Rechercher des actualités"
                className="rounded border border-gray-300 px-3 py-2 text-sm"
              />
              <select
                value={actualiteFilters.status}
                onChange={(event) => setActualiteFilters((prev) => ({ ...prev, status: event.target.value }))}
                className="rounded border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="approved">Approuvée</option>
                <option value="rejected">Refusée</option>
              </select>
              <select
                value={actualiteFilters.category}
                onChange={(event) => setActualiteFilters((prev) => ({ ...prev, category: event.target.value }))}
                className="rounded border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="all">Toutes les catégories</option>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </div>
          </div>
          <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
            Affichage de {filteredPendingActualites.length + filteredAllActualites.length} éléments sur {pendingActualites.length}
          </div>
        </div>

        <div className="rounded border border-gray-300 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Actualités en attente</h2>
            <span className="text-sm text-gray-600">{filteredPendingActualites.length} items</span>
          </div>
          {loading ? <p className="text-sm text-gray-600">Chargement…</p> : filteredPendingActualites.length === 0 ? (
            <p className="text-sm text-gray-600">Aucune actualité en attente ne correspond à ces filtres.</p>
          ) : <div className="space-y-2">{filteredPendingActualites.map(renderActualiteRow)}</div>}
        </div>

        <div className="rounded border border-gray-300 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Toutes les actualités</h2>
            <span className="text-sm text-gray-600">{filteredAllActualites.length} items</span>
          </div>
          {filteredAllActualites.length === 0 ? (
            <p className="rounded border border-dashed border-gray-300 p-4 text-sm text-gray-600">Aucune actualité ne correspond à ces filtres.</p>
          ) : <div className="space-y-2">{filteredAllActualites.map(renderActualiteRow)}</div>}
        </div>
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total des utilisateurs" value={stats.totalUsers.toString()} />
        <StatCard label="Chercheurs" value={stats.researchers.toString()} />
        <StatCard label="Visiteurs" value={stats.visitors.toString()} />
        <StatCard label="Utilisateurs en ligne" value={stats.onlineUsers.toString()} />
        <StatCard label="Utilisateurs en attente" value={stats.pendingUsers.toString()} />
        <StatCard label="Total des publications" value={stats.totalPublications.toString()} />
        <StatCard label="Publications en attente" value={stats.pendingPublications.toString()} />
        <StatCard label="Publications approuvées" value={stats.approvedPublications.toString()} />
        <StatCard label="Total actualités" value={stats.totalActualites.toString()} />
        <StatCard label="Actualités en attente" value={stats.pendingActualites.toString()} />
        <StatCard label="Actualités approuvées" value={stats.approvedActualites.toString()} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded border border-gray-300 bg-white p-4">
          <h2 className="mb-3 font-semibold">Vue d’ensemble du site</h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="rounded bg-gray-50 p-3">
              <div className="font-medium text-black">Activité de la plateforme</div>
              <p className="mt-1">Le tableau de bord regroupe les utilisateurs, les validations en attente et le cycle de vie des publications.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded border border-gray-200 p-3">
                <div className="text-gray-600">Publications approuvées</div>
                <div className="mt-1 text-2xl font-semibold">{stats.approvedPublications}</div>
              </div>
              <div className="rounded border border-gray-200 p-3">
                <div className="text-gray-600">Publications refusées</div>
                <div className="mt-1 text-2xl font-semibold">{stats.rejectedPublications}</div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded border border-gray-200 p-3">
                <div className="text-gray-600">Actualités approuvées</div>
                <div className="mt-1 text-2xl font-semibold">{stats.approvedActualites}</div>
              </div>
              <div className="rounded border border-gray-200 p-3">
                <div className="text-gray-600">Actualités refusées</div>
                <div className="mt-1 text-2xl font-semibold">{stats.rejectedActualites}</div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded border border-gray-200 p-3">
                <div className="text-gray-600">Utilisateurs en attente d’examen</div>
                <div className="mt-1 text-2xl font-semibold">{stats.pendingUsers}</div>
              </div>
              <div className="rounded border border-gray-200 p-3">
                <div className="text-gray-600">Publications en attente d’examen</div>
                <div className="mt-1 text-2xl font-semibold">{stats.pendingPublications}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded border border-gray-300 bg-white p-4">
          <h2 className="mb-3 font-semibold">Résumé des validations</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between rounded bg-gray-50 p-2">
              <span>Utilisateurs en attente</span>
              <strong>{stats.pendingUsers}</strong>
            </div>
            <div className="flex items-center justify-between rounded bg-gray-50 p-2">
              <span>Publications en attente</span>
              <strong>{stats.pendingPublications}</strong>
            </div>
            <div className="flex items-center justify-between rounded bg-gray-50 p-2">
              <span>Total des publications</span>
              <strong>{stats.totalPublications}</strong>
            </div>
            <div className="flex items-center justify-between rounded bg-gray-50 p-2">
              <span>Actualités en attente d’examen</span>
              <strong>{stats.pendingActualites}</strong>
            </div>
            <div className="flex items-center justify-between rounded bg-gray-50 p-2">
              <span>Total actualités</span>
              <strong>{stats.totalActualites}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => {
    const userQuery = userFilters.query.trim().toLowerCase();
    const filteredUsers = allUsers.filter((user) => {
      const haystack = [user.username, user.email, user.firstName, user.lastName, user.country].filter(Boolean).join(' ').toLowerCase();
      const matchesQuery = !userQuery || haystack.includes(userQuery);
      const matchesRole = userFilters.role === 'all' || String(user.role) === userFilters.role;
      const matchesStatus = userFilters.status === 'all' || (userFilters.status === 'disabled' ? Boolean(user.isDisabled) : !user.isDisabled);
      return matchesQuery && matchesRole && matchesStatus;
    });

    return (
      <div className="space-y-6">
        <div className="grid gap-3 md:grid-cols-3">
          <StatCard label="Total des utilisateurs" value={stats.totalUsers.toString()} />
          <StatCard label="Online users" value={stats.onlineUsers.toString()} />
          <StatCard label="Utilisateurs en attente" value={stats.pendingUsers.toString()} />
        </div>

        <div className="rounded border border-gray-300 bg-white p-4">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
                <h2 className="font-semibold">Filtrer les utilisateurs</h2>
                  <p className="text-sm text-gray-600">Rechercher par nom, e-mail, pays ou rôle.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="search"
                value={userFilters.query}
                onChange={(event) => setUserFilters((prev) => ({ ...prev, query: event.target.value }))}
                placeholder="Rechercher des utilisateurs"
                className="rounded border border-gray-300 px-3 py-2 text-sm"
              />
              <select
                value={userFilters.role}
                onChange={(event) => setUserFilters((prev) => ({ ...prev, role: event.target.value }))}
                className="rounded border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="all">Tous les rôles</option>
                <option value="0">Administrateur</option>
                <option value="1">Chercheur</option>
                <option value="2">Visiteur</option>
              </select>
              <select
                value={userFilters.status}
                onChange={(event) => setUserFilters((prev) => ({ ...prev, status: event.target.value }))}
                className="rounded border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actif</option>
                <option value="disabled">Désactivé</option>
              </select>
            </div>
          </div>

          <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
            Affichage de {filteredUsers.length} utilisateurs sur {allUsers.length}
          </div>
        </div>

        <div className="rounded border border-gray-300 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Validations d’utilisateurs en attente</h2>
          <span className="text-sm text-gray-600">{pendingUsers.length} requests</span>
        </div>

        {loading ? (
          <p className="text-sm text-gray-600">Chargement…</p>
        ) : pendingUsers.length === 0 ? (
          <p className="text-sm text-gray-600">Aucun utilisateur en attente.</p>
        ) : (
          <div className="space-y-2">
            {pendingUsers.map((request) => {
              const isSelected = selectedUserId === request._id;
              return (
                <div key={request._id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedUserId(isSelected ? null : request._id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedUserId(isSelected ? null : request._id);
                      }
                    }}
                    className={`flex cursor-pointer flex-col gap-2 border p-3 md:flex-row md:items-center md:justify-between ${isSelected ? 'border-black bg-gray-50' : 'border-gray-200'}`}
                  >
                    <div>
                      <div className="font-medium">{request.name}</div>
                      <div className="text-sm text-gray-600">{request.email}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" disabled={busyIds.includes(request._id)} onClick={(event) => { event.stopPropagation(); void handleDecision('user', request._id, 'approve'); }} className="w-full rounded border border-gray-300 px-3 py-1 text-sm sm:w-auto">Approuver</button>
                      <button type="button" disabled={busyIds.includes(request._id)} onClick={(event) => { event.stopPropagation(); void handleDecision('user', request._id, 'reject'); }} className="w-full rounded border border-gray-300 px-3 py-1 text-sm sm:w-auto">Refuser</button>
                    </div>
                  </div>

                  {isSelected && selectedUser && (
                    <div className="mt-2 border border-gray-300 bg-gray-50 p-3 text-sm">
                      <div className="mb-2 font-semibold">Détails de l’utilisateur</div>
                      <div className="grid gap-2 md:grid-cols-2">
                        <div><span className="font-medium">Name:</span> {selectedUser.name}</div>
                        <div><span className="font-medium">Email:</span> {selectedUser.email}</div>
                        <div><span className="font-medium">Role:</span> {selectedUser.role}</div>
                        <div><span className="font-medium">Status:</span> {selectedUser.status}</div>
                        <div><span className="font-medium">Created:</span> {new Date(selectedUser.createdAt).toLocaleString()}</div>
                        <div><span className="font-medium">Country:</span> {selectedUser.user?.country || 'N/A'}</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded border border-gray-300 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">All users</h2>
          <span className="text-sm text-gray-600">{filteredUsers.length} accounts</span>
        </div>
        <div className="space-y-2">
          {filteredUsers.length === 0 ? (
            <p className="rounded border border-dashed border-gray-300 p-4 text-sm text-gray-600">No users match these filters.</p>
          ) : filteredUsers.map((user) => {
            const isEditing = editingUserId === user._id;
            return (
              <div key={user._id} className="border border-gray-200 p-3">
                {isEditing && editingUser ? (
                  <div className="space-y-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="text-sm">
                        <span className="mb-1 block font-medium">Username</span>
                        <input
                          value={editingUser.username || ''}
                          onChange={(event) => setEditingUser({ ...editingUser, username: event.target.value })}
                          className="w-full rounded border border-gray-300 px-2 py-2"
                        />
                      </label>
                      <label className="text-sm">
                        <span className="mb-1 block font-medium">Prénom</span>
                        <input
                          value={editingUser.firstName || ''}
                          onChange={(event) => setEditingUser({ ...editingUser, firstName: event.target.value })}
                          className="w-full rounded border border-gray-300 px-2 py-2"
                        />
                      </label>
                      <label className="text-sm">
                        <span className="mb-1 block font-medium">Nom</span>
                        <input
                          value={editingUser.lastName || ''}
                          onChange={(event) => setEditingUser({ ...editingUser, lastName: event.target.value })}
                          className="w-full rounded border border-gray-300 px-2 py-2"
                        />
                      </label>
                      <label className="text-sm">
                        <span className="mb-1 block font-medium">Phone number</span>
                        <input
                          value={editingUser.phoneNumber || ''}
                          onChange={(event) => setEditingUser({ ...editingUser, phoneNumber: event.target.value })}
                          className="w-full rounded border border-gray-300 px-2 py-2"
                        />
                      </label>
                      <label className="text-sm">
                        <span className="mb-1 block font-medium">Country</span>
                        <input
                          value={editingUser.country || ''}
                          onChange={(event) => setEditingUser({ ...editingUser, country: event.target.value })}
                          className="w-full rounded border border-gray-300 px-2 py-2"
                        />
                      </label>
                      <label className="text-sm">
                        <span className="mb-1 block font-medium">Role</span>
                        <select
                          value={editingUser.role ?? 2}
                          onChange={(event) => setEditingUser({ ...editingUser, role: Number(event.target.value) })}
                          className="w-full rounded border border-gray-300 px-2 py-2"
                        >
                          <option value={0}>Admin</option>
                          <option value={1}>Researcher</option>
                          <option value={2}>Visitor</option>
                        </select>
                      </label>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                      <span>E-mail : {user.email}</span>
                      <span>•</span>
                      <span>Le mot de passe reste inchangé</span>
                    </div>

                    <div className="flex gap-2">
                      <button type="button" disabled={busyIds.includes(editingUser._id || '')} onClick={() => void saveUserEdits()} className="rounded border border-gray-300 bg-black px-3 py-1 text-sm text-white disabled:opacity-50">Enregistrer</button>
                      <button type="button" disabled={busyIds.includes(editingUser._id || '')} onClick={cancelEditingUser} className="rounded border border-gray-300 px-3 py-1 text-sm disabled:opacity-50">Annuler</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-medium">{user.username}</div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                      <div className="text-sm text-gray-600">{[user.firstName, user.lastName].filter(Boolean).join(' ') || 'Nom complet non renseigné'}</div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div>Rôle : {user.role === 0 ? 'Administrateur' : user.role === 1 ? 'Chercheur' : 'Visiteur'}</div>
                      <div>Téléphone : {user.phoneNumber || 'N/D'}</div>
                      <div>Pays : {user.country || 'N/D'}</div>
                      <div>Inscrit le : {new Date(user.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => startEditingUser(user)} className="w-full rounded border border-gray-300 px-3 py-1 text-sm sm:w-auto">Modifier</button>
                      <button
                        type="button"
                        disabled={busyIds.includes(user._id)}
                        onClick={() => void toggleUserDisabled(user._id, !user.isDisabled)}
                        className={`w-full rounded px-3 py-1 text-sm sm:w-auto ${user.isDisabled ? 'border border-green-600 text-green-700' : 'border border-red-600 text-red-700'}`}
                      >
                        {user.isDisabled ? 'Restore' : 'Disable'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
    );
  };

  const renderPublications = () => {
    const publicationQuery = publicationFilters.query.trim().toLowerCase();
    const filteredPendingPublications = pendingPublications.filter((publication) => {
      const haystack = [publication.title, publication.author, publication.summary, publication.type].filter(Boolean).join(' ').toLowerCase();
      const matchesQuery = !publicationQuery || haystack.includes(publicationQuery);
      const matchesStatus = publicationFilters.status === 'all' || publication.status === publicationFilters.status;
      const matchesType = publicationFilters.type === 'all' || (publication.type || '').toLowerCase() === publicationFilters.type.toLowerCase();
      return matchesQuery && matchesStatus && matchesType;
    });

    const filteredAllPublications = allPublications
      .filter((publication) => publication.status !== 'pending')
      .filter((publication) => {
        const haystack = [publication.title, publication.author, publication.summary, publication.type].filter(Boolean).join(' ').toLowerCase();
        const matchesQuery = !publicationQuery || haystack.includes(publicationQuery);
        const matchesStatus = publicationFilters.status === 'all' || publication.status === publicationFilters.status;
        const matchesType = publicationFilters.type === 'all' || (publication.type || '').toLowerCase() === publicationFilters.type.toLowerCase();
        return matchesQuery && matchesStatus && matchesType;
      });

    return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="Total des publications" value={stats.totalPublications.toString()} />
        <StatCard label="En attente" value={stats.pendingPublications.toString()} />
        <StatCard label="Approuvées" value={stats.approvedPublications.toString()} />
        <StatCard label="Refusées" value={stats.rejectedPublications.toString()} />
      </div>

      <div className="rounded border border-gray-300 bg-white p-4">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-semibold">Filtrer les publications</h2>
            <p className="text-sm text-gray-600">Rechercher par titre, auteur, résumé ou type.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="search"
              value={publicationFilters.query}
              onChange={(event) => setPublicationFilters((prev) => ({ ...prev, query: event.target.value }))}
              placeholder="Rechercher des publications"
              className="rounded border border-gray-300 px-3 py-2 text-sm"
            />
            <select
              value={publicationFilters.status}
              onChange={(event) => setPublicationFilters((prev) => ({ ...prev, status: event.target.value }))}
              className="rounded border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="approved">Approuvée</option>
              <option value="rejected">Refusée</option>
            </select>
            <input
              type="text"
              value={publicationFilters.type}
              onChange={(event) => setPublicationFilters((prev) => ({ ...prev, type: event.target.value }))}
              placeholder="Type de publication"
              className="rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
          Affichage de {filteredPendingPublications.length + filteredAllPublications.length} éléments sur {allPublications.length + pendingPublications.length}
        </div>
      </div>

      <div className="rounded border border-gray-300 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Publications en attente</h2>
          <span className="text-sm text-gray-600">{filteredPendingPublications.length} items</span>
        </div>

        {loading ? (
          <p className="text-sm text-gray-600">Loading…</p>
        ) : filteredPendingPublications.length === 0 ? (
          <p className="text-sm text-gray-600">Aucune publication en attente ne correspond à ces filtres.</p>
        ) : (
          <div className="space-y-2">
            {filteredPendingPublications.map((publication) => {
              const isEditing = editingPublicationId === publication._id;
              const isSelected = selectedPendingPublicationId === publication._id;
              return (
                <div key={publication._id} className="border border-gray-200 p-3">
                  {isEditing && editingPublication ? (
                    renderPublicationEditForm()
                  ) : (
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="font-medium">{publication.title}</div>
                        <div className="text-sm text-gray-600">{publication.author} {publication.year ? `• ${publication.year}` : ''}</div>
                        {publication.summary && <div className="mt-1 text-sm text-gray-600">{publication.summary}</div>}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" disabled={busyIds.includes(publication._id)} onClick={() => void handleDecision('publication', publication._id, 'approve')} className="w-full rounded border border-gray-300 px-3 py-1 text-sm sm:w-auto">Approuver</button>
                        <button type="button" disabled={busyIds.includes(publication._id)} onClick={() => void handleDecision('publication', publication._id, 'reject')} className="w-full rounded border border-gray-300 px-3 py-1 text-sm sm:w-auto">Refuser</button>
                        <button type="button" onClick={() => void viewPdf(publication._id)} className="w-full rounded border border-gray-300 px-3 py-1 text-sm sm:w-auto">Voir le PDF</button>
                        <button type="button" onClick={() => setSelectedPendingPublicationId(isSelected ? null : publication._id)} className="w-full rounded border border-gray-300 px-3 py-1 text-sm sm:w-auto">
                          {isSelected ? 'Masquer les détails' : 'Voir tous les détails'}
                        </button>
                        <button type="button" onClick={() => startEditingPublication(publication as AdminPublication)} className="w-full rounded border border-gray-300 px-3 py-1 text-sm sm:w-auto">Modifier</button>
                      </div>
                    </div>
                  )}
                  {!isEditing && isSelected && renderPublicationDetails(publication)}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded border border-gray-300 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">All publications</h2>
          <span className="text-sm text-gray-600">{filteredAllPublications.length} items</span>
        </div>
        <div className="space-y-2">
          {filteredAllPublications.length === 0 ? (
            <p className="rounded border border-dashed border-gray-300 p-4 text-sm text-gray-600">Aucune publication ne correspond à ces filtres.</p>
          ) : filteredAllPublications.map((publication) => {
            const isEditing = editingPublicationId === publication._id && editingPublication;
            const isSelected = selectedPublicationId === publication._id;
            return (
              <div key={publication._id} className="border border-gray-200 p-3">
                {isEditing ? renderPublicationEditForm() : (
                  <>
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="font-medium">{publication.title}</div>
                        <div className="text-sm text-gray-600">{publication.author} • {publicationStatusLabel(publication.status)}</div>
                        {publication.summary && <div className="mt-1 text-sm text-gray-600">{publication.summary}</div>}
                      </div>
                      <div className="flex flex-col gap-2 text-sm text-gray-600 md:items-end">
                        <div>Soumise par : {publication.submittedBy?.username || 'Inconnu'}</div>
                        <div>Créée le : {new Date(publication.createdAt).toLocaleDateString()}</div>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => startEditingPublication(publication)} className="rounded border border-gray-300 px-3 py-1 text-sm">Modifier</button>
                          <button type="button" onClick={() => setSelectedPublicationId(isSelected ? null : publication._id)} className="rounded border border-gray-300 px-3 py-1 text-sm">
                            {isSelected ? 'Masquer les détails' : 'Voir les détails'}
                          </button>
                          <button type="button" onClick={() => void viewPdf(publication._id)} className="rounded border border-gray-300 px-3 py-1 text-sm">Voir le PDF</button>
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="mt-3 border-t border-gray-200 pt-3">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="font-semibold text-gray-900">Détails de la publication</div>
                      <button
                          type="button"
                          onClick={() => setSelectedPublicationId(null)}
                          className="rounded-full p-1 text-gray-600 hover:bg-gray-200"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="space-y-3">
                        <div className="grid gap-3 md:grid-cols-2">
                          <div>
                            <span className="font-medium text-gray-700">Title:</span>
                            <p className="mt-1 text-gray-900">{publication.title}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Author:</span>
                            <p className="mt-1 text-gray-900">{publication.author}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Year:</span>
                            <p className="mt-1 text-gray-900">{publication.year || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Type:</span>
                            <p className="mt-1 text-gray-900">{publication.type || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Status:</span>
                            <p className="mt-1 text-gray-900">{publicationStatusLabel(publication.status)}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Submitted by:</span>
                            <p className="mt-1 text-gray-900">{publication.submittedBy?.username || 'Unknown'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Email:</span>
                            <p className="mt-1 text-gray-900">{publication.submittedBy?.email || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Created:</span>
                            <p className="mt-1 text-gray-900">{new Date(publication.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                        {publication.summary && (
                          <div>
                            <span className="font-medium text-gray-700">Summary:</span>
                            <p className="mt-1 text-gray-900">{publication.summary}</p>
                          </div>
                        )}
                        {renderPublicationDetails(publication)}
                      </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      <div className="rounded border border-gray-300 bg-white p-4">
        <h2 className="mb-3 font-semibold">Exporter les publications</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => exportPublications('Communication')} className="rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
            Exporter les communications
          </button>
          <button type="button" onClick={() => exportPublications('Article scientifique')} className="rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
            Exporter les articles scientifiques
          </button>
          <button type="button" onClick={() => exportPublications("Chapitre d'ouvrage")} className="rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
            Exporter les chapitres d'ouvrage
          </button>
          <button type="button" onClick={() => exportPublications('Ouvrage scientifique')} className="rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
            Exporter les ouvrages scientifiques
          </button>
        </div>
      </div>
    </div>
    );
  };

  return (
    <div className="admin-dashboard h-screen overflow-hidden text-slate-900">
      <div className="mx-auto flex h-full max-w-[1680px] flex-col lg:flex-row">
        <aside className="w-full border-b border-slate-200 bg-white p-4 lg:h-screen lg:w-[264px] lg:shrink-0 lg:overflow-y-auto lg:border-r lg:border-b-0 lg:px-5 lg:py-7">
          <div className="mb-5 flex items-center justify-between lg:mb-10 lg:block">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight text-slate-900">Administration</h1>
                <p className="mt-0.5 text-xs text-slate-500">EITIC · Espace de gestion</p>
              </div>
            </div>
            <button type="button" onClick={() => navigate('/Acceuil')} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 lg:hidden">Retour</button>
          </div>
          <p className="mb-2 hidden px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 lg:block">Menu principal</p>
          <nav className="grid grid-cols-4 gap-1.5 lg:flex lg:flex-col">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`admin-nav-link flex w-full flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-center text-[11px] font-medium transition sm:flex-row sm:justify-center sm:gap-2 sm:text-sm lg:justify-start lg:px-3 lg:py-3 ${activeTab === tab.key ? 'admin-nav-active' : 'admin-nav-idle'}`}
              >
                {(() => {
                  const Icon = tabIcons[tab.key];
                  return <Icon className="h-4 w-4 shrink-0" />;
                })()}
                <span className="truncate">{tab.label}</span>
              </button>
            ))}
          </nav>
          <div className="mt-8 hidden rounded-2xl bg-slate-50 p-4 lg:block">
            <div className="text-xs font-semibold text-slate-700">Espace sécurisé</div>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">Gérez les comptes et contenus de la plateforme depuis un seul endroit.</p>
          </div>
        </aside>

        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-7 sm:py-7 xl:px-10">
          <div className="mb-7 flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 hidden h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 sm:flex">
                {(() => {
                  const Icon = tabIcons[activeTab];
                  return <Icon className="h-5 w-5" />;
                })()}
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">Espace administrateur</p>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">{tabs.find((tab) => tab.key === activeTab)?.label}</h2>
                <p className="mt-1 text-sm text-slate-500">Suivez l’activité du site et gérez les contenus.</p>
              </div>
            </div>
            <button type="button" onClick={() => navigate('/Acceuil')} className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 lg:inline-flex">
              <ArrowLeft className="h-4 w-4" />
              Retour au site
            </button>
          </div>

          {errorMessage && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">{errorMessage}</div>
          )}

          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'publications' && renderPublications()}
          {activeTab === 'actualites' && renderActualites()}
        </main>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-gray-300 bg-white p-3">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

export default AdminDashboard;