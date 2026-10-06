import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ActiveNavTab, EducationItem, LanguageItem, LinkedAccountItem, PublicationItem, ResearcherProfile, WorkHistoryItem } from './types';
import type { Publication } from '../types';
import { INITIAL_RESEARCHER } from './data/initialData';
import { Header } from './components/Header';
import { ProfileHeader } from './components/ProfileHeader';
import { LanguagesCard } from './components/LanguagesCard';
import { EducationCard } from './components/EducationCard';
import { LinkedAccountsCard } from './components/LinkedAccountsCard';
import { SummaryCard } from './components/SummaryCard';
import { SkillsCard } from './components/SkillsCard';
import { ResearchPortfolioCard } from './components/ResearchPortfolioCard';
import { WorkHistoryCard } from './components/WorkHistoryCard';

// Modals
import { ProfileSettingsModal } from './components/modals/ProfileSettingsModal';
import { PdfViewerModal } from '../Components/PdfViewerModal';
import { NewsletterModal } from './components/modals/NewsletterModal';
import { LinkAccountModal } from './components/modals/LinkAccountModal';

// Views
import { PublicationsView } from './components/views/PublicationsView';
import { AboutView } from './components/views/AboutView';
import { NewsView } from './components/views/NewsView';
import { CollaborationsView } from './components/views/CollaborationsView';

interface ProfileExperienceProps {
  user: any;
  setUser: (user: any) => void;
  initialPublicView?: boolean;
}

const profileFromUser = (user: any): ResearcherProfile => ({
  ...INITIAL_RESEARCHER,
  ...user,
  name: user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.username || INITIAL_RESEARCHER.name,
  phoneNumber: undefined,
  publications: user?.publications || INITIAL_RESEARCHER.publications,
  education: user?.education || [],
  workHistory: user?.workHistory || [],
  linkedAccounts: user?.linkedAccounts || [],
  languages: user?.languages || [],
  researchAxes: user?.researchAxes || [],
  skills: user?.skills || [],
});

const toPublication = (publication: PublicationItem): Publication => ({
  id: publication.id,
  _id: publication.id,
  title: publication.title,
  year: publication.year || new Date().getFullYear(),
  type: publication.type || 'Article scientifique',
  authors: publication.linkedAuthors?.length
    ? publication.linkedAuthors.map((author, index) => ({
      id: `${publication.id}-author-${index}`,
      userId: author.userId,
      name: author.name,
      role: 'Chercheur',
    }))
    : (publication.authors || []).map((name, index) => ({
      id: `${publication.id}-author-${index}`,
      name,
      role: 'Chercheur',
    })),
  journal: publication.journal || '',
  abstract: publication.abstract || 'Aucun résumé n’est encore disponible pour cette publication.',
  introduction: publication.introduction || '',
  methodology: publication.methodology || '',
  conclusion: publication.conclusion || '',
  keywords: publication.keywords || [],
  citationsCount: publication.citations || 0,
  downloadsCount: publication.downloadsCount || 0,
  doi: publication.doi || '',
  department: 'Recherche',
});

export default function App({ user, setUser, initialPublicView = false }: ProfileExperienceProps) {
  const [profile, setProfile] = useState<ResearcherProfile>(() => profileFromUser(user));
  const [isPublicView, setIsPublicView] = useState<boolean>(initialPublicView);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('chercheurs');

  // Modal States for non-inline complex operations (video, identity cert, publications, full settings)
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedPublication, setSelectedPublication] = useState<PublicationItem | null>(null);
  const [showNewsletterModal, setShowNewsletterModal] = useState(false);
  const [showLinkAccountModal, setShowLinkAccountModal] = useState(false);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadProfilePublications = async () => {
      try {
        const response = await axios.get('/api/users/publications');
        const userId = String(user?._id || user?.id || '');

        const publications = (response.data || [])
          .filter((publication: any) => {
            const submittedBy = publication.submittedBy?._id || publication.submittedBy;
            const isLinkedAuthor = Array.isArray(publication.authors)
              && publication.authors.some((author: any) => String(author?.userId?._id || author?.userId || '') === userId);
            return isLinkedAuthor || String(submittedBy || '') === userId;
          })
          .map((publication: any): PublicationItem => ({
            id: publication._id,
            title: publication.title,
            status: 'published',
            journal: publication.journal,
            year: publication.year,
            citations: publication.citationsCount,
            downloadsCount: publication.downloadsCount || 0,
            doi: publication.doi,
            abstract: publication.abstract || publication.summary,
            introduction: publication.introduction || '',
            methodology: publication.methodology || '',
            conclusion: publication.conclusion || '',
            authors: (publication.authors || []).map((author: any) => author.name || author),
            linkedAuthors: (publication.authors || [])
              .filter((author: any) => author?.userId)
              .map((author: any) => ({
                userId: String(author.userId?._id || author.userId),
                name: author.name,
              })),
            keywords: publication.keywords || [],
            pdfUrl: publication.pdfPath,
          }));

        setProfile((current) => ({ ...current, publications }));
      } catch (error) {
        console.error('Failed to load profile publications', error);
        setProfile((current) => ({ ...current, publications: [] }));
      }
    };

    void loadProfilePublications();
  }, [profile.name, user]);

  const saveProfile = async (profileOverride?: ResearcherProfile) => {
    const profileToSave = profileOverride || profile;
    if (!localStorage.getItem('session-active') || isSaving || (!isDirty && !profileOverride)) return;

    const profilePayload = {
      name: profileToSave.name,
      firstName: user?.firstName,
      lastName: user?.lastName,
      prefix: profileToSave.prefix,
      titleTag: profileToSave.titleTag,
      location: profileToSave.location,
      timezone: profileToSave.timezone,
      avatar: profileToSave.avatar,
      researchImage: profileToSave.researchImage || '',
      availabilityBadge: profileToSave.availabilityBadge,
      boostProfile: profileToSave.boostProfile,
      citationsCount: profileToSave.citationsCount,
      hoursPerWeek: profileToSave.hoursPerWeek,
      availabilityNote: profileToSave.availabilityNote,
      hasVideoIntro: profileToSave.hasVideoIntro,
      videoIntroUrl: profileToSave.videoIntroUrl,
      idStatus: profileToSave.idStatus,
      militaryVeteran: profileToSave.militaryVeteran,
      summaryText: profileToSave.summaryText,
      researchAxes: profileToSave.researchAxes,
      skills: profileToSave.skills,
      education: profileToSave.education,
      workHistory: profileToSave.workHistory,
      publications: profileToSave.publications,
      linkedAccounts: profileToSave.linkedAccounts,
      languages: profileToSave.languages,
    };

    setIsSaving(true);
    try {
      const response = await axios.put('/api/users/me', profilePayload);
      setUser(response.data);
      setProfile((current) => ({ ...current, ...response.data }));
      setIsDirty(false);
      showToast('Profil sauvegardé');
    } catch (error) {
      console.error('Failed to save profile', error);
      const message = axios.isAxiosError(error) && typeof error.response?.data?.message === 'string'
        ? error.response.data.message
        : 'Erreur lors de la sauvegarde';
      showToast(message);
    } finally {
      setIsSaving(false);
    }
  };

  const updateProfile = (updater: (current: ResearcherProfile) => ResearcherProfile) => {
    setProfile((current) => {
      setIsDirty(true);
      return updater(current);
    });
  };

  useEffect(() => {
    const email = String(user?.email || '').trim().toLowerCase();
    if (user?.authProvider !== 'google' || !email) return;

    setProfile((current) => {
      if (current.linkedAccounts.some((account) => account.type === 'email')) return current;

      const googleAccount = {
        id: `acc-google-${user?._id || user?.id || email}`,
        type: 'email' as const,
        name: 'Gmail',
        handle: email,
        meta: 'Google Verified',
        avatar: user?.avatar || undefined,
        url: `mailto:${email}`,
      };
      setIsDirty(true);
      return { ...current, linkedAccounts: [...current.linkedAccounts, googleAccount] };
    });
  }, [user?.authProvider, user?.email, user?._id, user?.id, user?.avatar]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Direct Field-Specific Real-Time Update Handlers
  const handleUpdateName = (name: string) => {
    updateProfile((prev) => ({ ...prev, name }));
    showToast('Nom mis à jour');
  };

  const handleUpdateLocation = (location: string) => {
    updateProfile((prev) => ({ ...prev, location }));
    showToast('Localisation mise à jour');
  };

  const handleUpdateAvatar = (avatar: string) => {
    updateProfile((prev) => ({ ...prev, avatar }));
    showToast('Photo de profil mise à jour');
  };

  const handleUpdateResearchImage = (researchImage: string) => {
    updateProfile((prev) => ({ ...prev, researchImage }));
    showToast('Image de la carte chercheur mise à jour');
  };

  const handleUpdateTitleTag = (titleTag: string) => {
    updateProfile((prev) => ({ ...prev, titleTag }));
    showToast('Titre de spécialité mis à jour');
  };

  const handleUpdateSummaryText = (summaryText: string) => {
    updateProfile((prev) => ({ ...prev, summaryText }));
    showToast('Résumé professionnel mis à jour');
  };

  const handleUpdateResearchAxes = (researchAxes: string[]) => {
    updateProfile((prev) => ({ ...prev, researchAxes }));
    showToast('Axes de recherche mis à jour');
  };

  const handleUpdateSkills = (skills: string[]) => {
    updateProfile((prev) => ({ ...prev, skills }));
    showToast('Compétences mises à jour');
  };

  const handleSaveSkills = (skills: string[]) => {
    void saveProfile({ ...profile, skills });
  };

  const handleUpdateLanguages = (languages: LanguageItem[]) => {
    updateProfile((prev) => ({ ...prev, languages }));
    showToast('Langues mises à jour');
  };

  const handleSaveEducation = (item: EducationItem) => {
    updateProfile((prev) => {
      const exists = prev.education.some((e) => e.id === item.id);
      const education = exists
        ? prev.education.map((e) => (e.id === item.id ? item : e))
        : [item, ...prev.education];
      return { ...prev, education };
    });
    showToast('Formation enregistrée');
  };

  const handleDeleteEducation = (id: string) => {
    updateProfile((prev) => ({
      ...prev,
      education: prev.education.filter((e) => e.id !== id),
    }));
    showToast('Formation supprimée');
  };

  const handleSaveWork = (item: WorkHistoryItem) => {
    updateProfile((prev) => {
      const exists = prev.workHistory.some((w) => w.id === item.id);
      const workHistory = exists
        ? prev.workHistory.map((w) => (w.id === item.id ? item : w))
        : [item, ...prev.workHistory];
      return { ...prev, workHistory };
    });
    showToast('Expérience enregistrée');
  };

  const handleDeleteWork = (id: string) => {
    updateProfile((prev) => ({
      ...prev,
      workHistory: prev.workHistory.filter((w) => w.id !== id),
    }));
    showToast('Expérience supprimée');
  };

  const handleLinkAccount = (account: LinkedAccountItem) => {
    updateProfile((prev) => {
      // Replace existing account of same type or add new
      const filtered = prev.linkedAccounts.filter((a) => a.type !== account.type);
      return {
        ...prev,
        linkedAccounts: [...filtered, account],
      };
    });
    showToast(`Compte ${account.name} lié avec succès`);
  };

  const handleUnlinkAccount = (id: string) => {
    updateProfile((prev) => ({
      ...prev,
      linkedAccounts: prev.linkedAccounts.filter((a) => a.id !== id),
    }));
    showToast('Compte dissocié');
  };

  const handleUpdateFullProfile = (updated: Partial<ResearcherProfile>) => {
    updateProfile((prev) => ({ ...prev, ...updated }));
    showToast('Profil mis à jour');
  };

  return (
    <div className="min-h-screen bg-[#f9f9fb] text-[#1a1c1d] flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1a1c1d] text-white px-5 py-3 rounded-full text-xs font-semibold shadow-2xl animate-in slide-in-from-bottom-3 duration-200 flex items-center gap-2 border border-white/10">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <Header
        activeTab={activeTab}
        isPublicView={isPublicView}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenNewsletter={() => setShowNewsletterModal(true)}
        onOpenProfileSettings={() => setShowSettingsModal(true)}
      />

      {/* Main Content Body */}
      <main className="pt-4 flex-1">
        {activeTab === 'accueil' || activeTab === 'chercheurs' ? (
          <div className="flex flex-col w-full max-w-[1440px] mx-auto px-4 md:px-12 lg:px-16 py-6 sm:py-8 gap-8 sm:gap-10">
            {/* Top Profile Header Section with Inline Field Edits */}
            <ProfileHeader
              profile={profile}
              isPublicView={isPublicView}
              onTogglePublicView={() => setIsPublicView(!isPublicView)}
              onSave={() => void saveProfile()}
              isSaving={isSaving}
              isDirty={isDirty}
              onUpdateName={handleUpdateName}
              onUpdateLocation={handleUpdateLocation}
              onUpdateAvatar={handleUpdateAvatar}
              onUpdateResearchImage={handleUpdateResearchImage}
              canTogglePublicView={!initialPublicView}
              showPublicViewBadge={!initialPublicView}
            />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              {/* Left Sidebar (4 Columns) */}
              <aside className="lg:col-span-4 flex flex-col gap-6">
                {/* Languages Card with Inline Real-Time Edit */}
                <LanguagesCard
                  languages={profile.languages}
                  isPublicView={isPublicView}
                  onUpdateLanguages={handleUpdateLanguages}
                />

                {/* Education Card with Inline Edit */}
                <EducationCard
                  education={profile.education}
                  isPublicView={isPublicView}
                  onSaveEducation={handleSaveEducation}
                  onDeleteEducation={handleDeleteEducation}
                />

                {/* Linked Accounts */}
                <LinkedAccountsCard
                  accounts={profile.linkedAccounts}
                  isPublicView={isPublicView}
                  isGoogleAuthenticated={user?.authProvider === 'google'}
                  onOpenLinkModal={() => setShowLinkAccountModal(true)}
                  onUnlinkAccount={handleUnlinkAccount}
                />
              </aside>

              {/* Right Main Content Area (8 Columns) */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                {/* Professional Summary Card with Inline Field Edits */}
                <SummaryCard
                  titleTag={profile.titleTag}
                  summaryText={profile.summaryText}
                  researchAxes={profile.researchAxes}
                  isPublicView={isPublicView}
                  onUpdateTitleTag={handleUpdateTitleTag}
                  onUpdateSummaryText={handleUpdateSummaryText}
                  onUpdateResearchAxes={handleUpdateResearchAxes}
                />

                {/* Skills Card with Inline Tag Management */}
                <SkillsCard
                  skills={profile.skills}
                  isPublicView={isPublicView}
                  onUpdateSkills={handleUpdateSkills}
                  onSaveSkills={handleSaveSkills}
                />

                {/* Research Portfolio Card */}
                <ResearchPortfolioCard
                  publications={profile.publications}
                  onSelectPublication={(pub) => setSelectedPublication(pub)}
                />

                {/* Work History Card with Inline Edit */}
                <WorkHistoryCard
                  workHistory={profile.workHistory}
                  isPublicView={isPublicView}
                  onSaveWork={handleSaveWork}
                  onDeleteWork={handleDeleteWork}
                />
              </div>
            </div>
          </div>
        ) : activeTab === 'a-propos' ? (
          <AboutView onGoToProfile={() => setActiveTab('chercheurs')} />
        ) : activeTab === 'publications' ? (
          <PublicationsView
            publications={profile.publications}
            onSelectPublication={(pub) => setSelectedPublication(pub)}
            onGoToProfile={() => setActiveTab('chercheurs')}
          />
        ) : activeTab === 'actualites' ? (
          <NewsView onGoToProfile={() => setActiveTab('chercheurs')} />
        ) : (
          <CollaborationsView
            onContact={() => setShowNewsletterModal(true)}
            onGoToProfile={() => setActiveTab('chercheurs')}
          />
        )}
      </main>

      {/* Profile Settings Modal (Accessible via Settings button) */}
      <ProfileSettingsModal
        isOpen={showSettingsModal}
        profile={profile}
        onClose={() => setShowSettingsModal(false)}
        onSave={handleUpdateFullProfile}
      />

      {/* Publication Reader / Detail Modal */}
      {selectedPublication && (
        <PdfViewerModal
          publication={toPublication(selectedPublication)}
          onClose={() => {
            setSelectedPublication(null);
          }}
        />
      )}

      {/* Newsletter Modal */}
      <NewsletterModal
        isOpen={showNewsletterModal}
        onClose={() => setShowNewsletterModal(false)}
      />

      {/* Link Account Prompt Modal (Gmail & GitHub) */}
      <LinkAccountModal
        isOpen={showLinkAccountModal}
        onClose={() => setShowLinkAccountModal(false)}
        onLinkAccount={handleLinkAccount}
        existingAccounts={profile.linkedAccounts}
      />
    </div>
  );
}
