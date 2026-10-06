import { ResearcherProfile } from './types';

export const INITIAL_RESEARCHER: ResearcherProfile = {
  name: 'Dr. Mhamdi B.',
  prefix: 'Dr.',
  titleTag: 'Chercheur en informatique cognitive',
  location: 'Manouba, Tunisie',
  timezone: 'Africa/Tunis',
  avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAGH44GRrLo__c3_PUxJdzshaAKfDisJ4OQ6bhcY5XXWgQdAMGSe3f2EJIunYMDrRewI-tTUhZ1yFnVaRC_YKbXXoaNIAEaB2AjvmG_8sbGu4zUKpEZE_ymbxmgqAKv73fT-Uh50jZnMJuw8EGgoegCaIrwfxomOQz8-pw2dX3-pbVqJ4KAmHW3waHd93TwnSye6rsulyZBC39sCcZlpCjoy0Mk_Fo0p6zdVF6Lspov6f36Bak8gh_c-Q',
  isVerified: true,
  availabilityBadge: false,
  boostProfile: false,
  citationsCount: 0,
  hoursPerWeek: 'Plus de 30 h/semaine',
  availabilityNote: 'Ouvert aux collaborations',
  hasVideoIntro: false,
  videoIntroUrl: '',
  idStatus: 'unverified',
  militaryVeteran: false,
  summaryText: 'Je suis chercheur postdoctoral, passionné par la conception et le développement de systèmes informatiques intelligents pour modéliser les processus cognitifs.',
  researchAxes: [
    'Architecture des réseaux neuronaux et apprentissage profond',
    'Traitement automatique du langage et sémantique',
    'Modèles d’interaction humain-machine'
  ],
  skills: [
    'Conception de circuits électroniques',
    'Systèmes embarqués',
    'Apprentissage automatique',
    'Réseaux neuronaux',
    'Python',
    'C++',
    'Traitement du signal'
  ],
  education: [
    {
      id: 'edu-1',
      institution: "Ecole Nationale d'Ingénieurs de Carthage",
      degree: 'Diplôme d’ingénieur',
      field: 'Ingénierie des systèmes infotroniques',
      period: '2024-2027 (prévu)'
    }
  ],
  workHistory: [],
  publications: [
    {
      id: 'pub-1',
      title: 'Optimisation des architectures neuronales',
      status: 'published',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCLPe-6sAF_YHokJs8-EPVGGMXsT4anj07BVrVTWWxTKDNShvcaSD98uPIdeVH58Zzk4WX-P6oHOKYOGzPAIebJ8T_-ZFLinjZmRok5n9Wk4tzYMb8Mf-XWezB2Tr9vZsRR2bLJCBVL63MoNuQTPRmGbNNVJEuuIw8GZZK9eUzzWSWCbVuBOrc_72W27paw2SyowvgXl0CGTDte-lBw_EWZFk7NzTCMd6t6yhqsrj4CzgPS9aa3PXq0ZQ',
      journal: 'IEEE Transactions on Neural Networks and Learning Systems',
      year: 2024,
      citations: 0,
      doi: '10.1109/TNNLS.2024.3389102',
      abstract: 'Cet article présente un cadre de recherche automatisée d’architectures neuronales cognitives hétérogènes, soumis à des contraintes strictes d’énergie et de surface silicium, optimisé pour les processeurs neuromorphiques d’IA en périphérie.',
      authors: ['Dr. Mhamdi B.', 'Prof. K. Ben Salem', 'Dr. S. Larbi'],
      keywords: ['Informatique cognitive', 'Recherche d’architectures neuronales', 'IA embarquée', 'TPU en périphérie']
    },
    {
      id: 'pub-2',
      title: 'Compression d’embeddings sémantiques dans des accélérateurs basse consommation',
      status: 'draft',
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
      journal: 'ACM Transactions on Embedded Computing Systems (In Review)',
      year: 2025,
      citations: 0,
      doi: '10.1145/draft.2025.0911',
      abstract: 'Étude de méthodes de quantification vectorielle pour compresser de grands embeddings linguistiques cognitifs multilingues sur des cibles matérielles FPGA contraintes.',
      authors: ['Dr. Mhamdi B.'],
      keywords: ['Quantification vectorielle', 'Accélération des transformeurs', 'FPGA']
    }
  ],
  linkedAccounts: [
    {
      id: 'acc-1',
      type: 'github',
      name: 'GitHub',
      handle: 'NIKDO',
      meta: 'Depuis 2018',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAGH44GRrLo__c3_PUxJdzshaAKfDisJ4OQ6bhcY5XXWgQdAMGSe3f2EJIunYMDrRewI-tTUhZ1yFnVaRC_YKbXXoaNIAEaB2AjvmG_8sbGu4zUKpEZE_ymbxmgqAKv73fT-Uh50jZnMJuw8EGgoegCaIrwfxomOQz8-pw2dX3-pbVqJ4KAmHW3waHd93TwnSye6rsulyZBC39sCcZlpCjoy0Mk_Fo0p6zdVF6Lspov6f36Bak8gh_c-Q',
      url: 'https://github.com'
    },
    {
      id: 'acc-2',
      type: 'email',
      name: 'E-mail',
      handle: 'contact@laborecherche.com',
      url: 'mailto:contact@laborecherche.com'
    }
  ],
  languages: [
    { id: 'lang-1', name: 'Anglais', level: 'Courant' },
    { id: 'lang-2', name: 'Arabe', level: 'Langue maternelle ou bilingue' },
    { id: 'lang-3', name: 'Français', level: 'Conversationnel' }
  ]
};
