import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building,
  Briefcase,
  ExternalLink,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
  X,
} from 'lucide-react';

interface ResearcherProfile {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  titleTag?: string;
  location?: string;
  avatar?: string;
  researchImage?: string;
  summaryText?: string;
  researchAxes?: string[];
  skills?: string[];
  education?: Array<{ institution?: string; degree?: string; field?: string }>;
  workHistory?: Array<{ role?: string; organization?: string }>;
  publications?: Array<{ title?: string; journal?: string; year?: number; keywords?: string[] }>;
  languages?: Array<{ name?: string; level?: string } | string>;
  email: string;
  phoneNumber?: string;
  country?: string;
  role?: number;
  createdAt?: string;
}

function Chercheurs() {
  const navigate = useNavigate();
  const [researchers, setResearchers] = useState<ResearcherProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResearcher, setSelectedResearcher] = useState<ResearcherProfile | null>(null);
  const [flippedIds, setFlippedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isActive = true;
    const fetchResearchers = async () => {
      try {
        const res = await axios.get('/api/users/researchers');
        if (isActive) setResearchers(res.data || []);
      } catch (err) {
        console.error('Failed to load researchers', err);
        if (isActive) setResearchers([]);
      } finally {
        if (isActive) setLoading(false);
      }
    };

    void fetchResearchers();
    const intervalId = window.setInterval(() => void fetchResearchers(), 30000);
    window.addEventListener('focus', fetchResearchers);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', fetchResearchers);
    };
  }, []);

  const toggleFlip = (id: string) => {
    setFlippedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getResearcherDetails = (researcher: ResearcherProfile) => {
    const fullName = researcher.name?.trim() || [researcher.firstName, researcher.lastName].filter(Boolean).join(' ').trim() || researcher.username;
    const location = researcher.country?.trim() || 'Non renseigné';
    const publications = researcher.publications || [];
    const researchAreas = [...(researcher.researchAxes || [])].filter(Boolean);
    const currentProjects = researchAreas.slice(0, 4);
    return {
      fullName,
      initials: fullName
        .split(' ')
        .map((word) => word[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'CH',
      bio: researcher.summaryText?.trim() || `${fullName} est membre de l'équipe de recherche du laboratoire.`,
      detailedDescription: researcher.summaryText?.trim() || 'Aucun résumé professionnel renseigné.',
      currentProjects: currentProjects.length ? currentProjects : ['Aucune information renseignée'],
      researchAreas: researchAreas.length ? researchAreas.slice(0, 6) : ['Aucun axe de recherche renseigné'],
      publishedPapers: publications.length
        ? publications.map((publication) => publication.title).filter(Boolean)
        : ['Aucune publication renseignée'],
      publicationKeywords: [...new Set(publications.flatMap((publication) => publication.keywords || []))].slice(0, 8),
      awards: researcher.education?.map((item) => [item.degree, item.field].filter(Boolean).join(' - ')).filter(Boolean).slice(0, 3) || [],
      teaching: researcher.workHistory?.map((item) => [item.role, item.organization].filter(Boolean).join(' • ')).filter(Boolean).join(', ') || 'Aucune expérience renseignée.',
      roleLabel: 'Chercheur',
      department: location,
      office: location,
    };
  };

  const researcherDetails = useMemo(
    () => new Map(researchers.map((researcher) => [researcher._id, getResearcherDetails(researcher)])),
    [researchers],
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-8 lg:px-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#1a1c1d] sm:text-4xl md:text-5xl">Annuaire des Chercheurs</h1>
        <p className="max-w-2xl text-base leading-relaxed text-[#414755] sm:text-lg">
          Découvrez nos équipes de recherche, responsables de laboratoires et enseignants-chercheurs. Cliquez sur une carte pour la retourner.
        </p>
      </header>

      {loading ? (
        <div className="grid gap-6 sm:gap-8 md:grid-cols-2">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-[350px] animate-pulse rounded-2xl border border-gray-200 bg-white sm:h-[440px]" />
          ))}
        </div>
      ) : researchers.length === 0 ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 text-center text-slate-600 shadow-sm sm:p-10">
          Aucun profil de chercheur n’est disponible pour le moment.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 xl:grid-cols-3">
          {researchers.map((researcher) => {
            const details = researcherDetails.get(researcher._id)!;
            const isFlipped = !!flippedIds[researcher._id];

            return (
              <div key={researcher._id} className="h-[360px] w-full [perspective:1200px] sm:h-[440px]">
                <div className={`relative h-full w-full will-change-transform transition-transform duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                  <div
                    onClick={() => toggleFlip(researcher._id)}
                    className="absolute inset-0 flex h-full w-full cursor-pointer flex-col justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-[0_15px_35px_rgba(15,23,42,0.05)] transition-all duration-300 hover:border-[#0058bc] hover:shadow-xl [backface-visibility:hidden] sm:p-6"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-gray-100 bg-gradient-to-br from-blue-100 to-indigo-100 text-base font-semibold text-[#0058bc] sm:h-20 sm:w-20 sm:text-lg">
                            {researcher.avatar ? (
                              <img src={researcher.avatar} alt={details.fullName} className="h-full w-full rounded-full object-cover" />
                            ) : details.initials}
                          </div>

                          <div>
                            <span className="rounded-md bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#0058bc]">
                              {details.department}
                            </span>
                            <h3 className="mt-1 text-xl font-bold text-gray-900">{details.fullName}</h3>
                            <p className="text-xs font-medium text-gray-500">{researcher.titleTag || details.roleLabel}</p>
                          </div>
                        </div>
                      </div>

                      <div className="scrollbar-hide max-h-28 overflow-y-auto pr-1">
                        <p className="text-xs leading-relaxed text-gray-600">{details.bio}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1.5 truncate">
                          <Mail className="h-3.5 w-3.5 shrink-0 text-[#0058bc]" />
                          <span className="truncate">{researcher.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <Phone className="h-3.5 w-3.5 shrink-0 text-[#0058bc]" />
                          <span>{researcher.phoneNumber || '—'}</span>
                        </div>
                      </div>

                      <div className="border-t border-gray-100 pt-2">
                        <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-gray-500">Langues parlées</span>
                        <div className="grid grid-cols-3 gap-x-3 gap-y-1.5">
                          {researcher.languages?.length ? researcher.languages.map((language, index) => {
                            const languageName = typeof language === 'string' ? language : language.name;
                            return (
                              <span key={`${languageName || 'langue'}-${index}`} className="truncate text-[11px] text-gray-700">
                                {languageName || 'Langue non renseignée'}
                              </span>
                            );
                          }) : (
                            <span className="text-[11px] text-gray-500">Aucune langue renseignée</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end border-t border-gray-100 pt-4">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/Profile?researcherId=${encodeURIComponent(researcher._id)}`);
                        }}
                        className="cursor-pointer rounded-lg bg-gray-100 px-3.5 py-2 text-xs font-semibold text-gray-800 transition-colors hover:bg-[#0058bc] hover:text-white"
                      >
                        Détails
                      </button>
                    </div>
                  </div>

                  <div
                    onClick={() => toggleFlip(researcher._id)}
                    className="absolute inset-0 h-full w-full overflow-hidden rounded-2xl border-2 border-[#0058bc] bg-white shadow-xl [backface-visibility:hidden] [transform:rotateY(180deg)]"
                  >
                    <div className="grid h-full w-full divide-y divide-gray-200 bg-gray-50 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                      <div className="relative flex flex-col justify-between overflow-hidden bg-gray-900 p-4 text-white">
                        {researcher.researchImage && (
                          <img src={researcher.researchImage} alt={`${details.fullName} - recherche`} className="absolute inset-0 !h-full w-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/30 to-transparent" />
                        <div className="relative flex h-full flex-col justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-blue-100 to-indigo-100 text-[10px] font-bold text-[#0058bc]">
                                {details.initials}
                              </div>
                              <div>
                                <h4 className="text-xs font-bold leading-tight">{details.fullName}</h4>
                                <p className="text-[10px] text-gray-300">{details.office}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col justify-between space-y-3 overflow-y-auto bg-gray-50/70 p-5 text-xs text-gray-700">
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <span className="block text-xs font-bold text-gray-900">Publications :</span>
                            <ul className="scrollbar-hide max-h-[72px] space-y-1 overflow-y-auto overscroll-contain">
                              {details.publishedPapers.map((paper, index) => (
                                <li key={`${paper}-back-${index}`} className="flex items-center gap-1.5 text-[11px] text-gray-600">
                                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#0058bc]" />
                                  <span className="truncate" title={paper}>{paper}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="space-y-1">
                            <span className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                              <GraduationCap className="h-3.5 w-3.5 text-[#0058bc]" />
                              Formation
                            </span>
                            <div className="space-y-1">
                              {researcher.education?.length ? researcher.education.map((education, index) => (
                                <p key={`${education.institution}-${index}`} className="text-[11px] text-gray-600">
                                  <span className="block font-semibold text-gray-700">{education.institution || 'Établissement non renseigné'}</span>
                                  <span className="block">{education.field || 'Spécialité non renseignée'}</span>
                                  <span className="block">{education.degree || 'Diplôme non renseigné'}</span>
                                </p>
                              )) : <span className="text-[11px] text-gray-500">Aucune formation renseignée.</span>}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                              <Briefcase className="h-3.5 w-3.5 text-[#0058bc]" />
                              Expérience professionnelle
                            </span>
                            <div className="space-y-1">
                              {researcher.workHistory?.length ? researcher.workHistory.map((work, index) => (
                                <p key={`${work.role}-${index}`} className="text-[11px] text-gray-600">
                                  {[work.role, work.organization].filter(Boolean).join(' - ')}
                                </p>
                              )) : <span className="text-[11px] text-gray-500">Aucune expérience renseignée.</span>}
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-gray-200 pt-3" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedResearcher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#0058bc] bg-gradient-to-br from-blue-100 to-indigo-100 text-sm font-bold text-[#0058bc]">
                  {getResearcherDetails(selectedResearcher).initials}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{getResearcherDetails(selectedResearcher).fullName}</h2>
                  <p className="text-xs text-gray-500">{selectedResearcher.titleTag || getResearcherDetails(selectedResearcher).roleLabel}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedResearcher(null)}
                className="cursor-pointer rounded-full p-2 text-gray-400 transition-colors hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-grow space-y-4 overflow-y-auto py-4">
              <h3 className="text-sm font-bold text-gray-800">Informations du profil :</h3>

              <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[#0058bc]" />
                  <span>{selectedResearcher.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[#0058bc]" />
                  <span>{selectedResearcher.phoneNumber || 'Téléphone non renseigné'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#0058bc]" />
                  <span>{selectedResearcher.country || 'Pays non renseigné'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-[#0058bc]" />
                  <span>{getResearcherDetails(selectedResearcher).office}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-bold text-gray-800">Résumé</h4>
                <p className="text-sm leading-relaxed text-gray-600">{getResearcherDetails(selectedResearcher).detailedDescription}</p>
              </div>

              {selectedResearcher.skills?.length ? (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-gray-800">Compétences</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedResearcher.skills.map((skill) => (
                      <span key={skill} className="rounded-md bg-blue-50 px-2.5 py-1 text-xs text-[#0058bc]">{skill}</span>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <h4 className="text-sm font-bold text-gray-800">Projets</h4>
                <div className="flex flex-wrap gap-2">
                  {getResearcherDetails(selectedResearcher).currentProjects.map((project, index) => (
                    <span key={`${project}-modal-${index}`} className="rounded-md bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
                      {project}
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedResearcher(null)}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#0058bc] hover:underline"
              >
                Fermer <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chercheurs;