import type { ResearchAxis, StrategicChallenge, TeamMember } from './types';

export const researchAxes: ResearchAxis[] = [
  {
    id: 'smart_grid',
    title: 'Smart Grid',
    icon: 'grid_view',
    description: 'Réseaux électriques intelligents et gestion d’énergie.',
    fullDescription: 'Recherche sur l’optimisation des flux d’énergie, l’intégration des sources renouvelables et la gestion intelligente de la demande d’énergie à l’aide d’algorithmes prédictifs et d’électronique de puissance avancée.',
    projects: [
      'Optimisation de l’injection photovoltaïque dans les micro-réseaux universitaires',
      'Système intelligent d’équilibrage de charge pour micro-grids isolés',
      'Développement de convertisseurs bidirectionnels à haut rendement',
    ],
    publications: [
      'Adaptive Control of Photovoltaic Inverters in Islanded Microgrids (IEEE, 2024)',
      'State-of-Charge Estimation using Machine Learning for Micro-Grid Batteries (MDPI, 2025)',
    ],
    keywords: ['Microgrids', 'Énergies renouvelables', 'Électronique de puissance', 'Optimisation'],
  },
  {
    id: 'vehicule',
    title: 'Véhicule',
    icon: 'directions_car',
    description: 'Systèmes de transport intelligents et mobilité propre.',
    fullDescription: 'Développement de systèmes de contrôle embarqués pour véhicules électriques et hybrides, incluant la gestion thermique des batteries et les communications Vehicle-to-Grid (V2G).',
    projects: [
      'Algorithmes de charge rapide respectant la durée de vie des batteries Li-ion',
      'Architecture de communication V2G pour la régulation des réseaux de distribution',
      'Modélisation de la dynamique des véhicules électriques en conditions réelles',
    ],
    publications: [
      'Cooperative Adaptive Cruise Control in Intelligent Transportation Systems (Elsevier, 2023)',
      'Battery Thermal Management Systems for Next-Generation EVs (SAE, 2024)',
    ],
    keywords: ['Véhicule Électrique', 'V2G', 'Gestion de Batterie', 'Transport Intelligent'],
  },
  {
    id: 'systemes_hf',
    title: 'Systèmes HF',
    icon: 'waves',
    description: 'Électronique haute fréquence et télécoms.',
    fullDescription: 'Conception de circuits intégrés RF, de filtres hyperfréquences et d’antennes compactes pour les futurs réseaux 5G/6G et les communications spatiales.',
    projects: [
      'Antennes MIMO ultra-compactes pour objets connectés (IoT)',
      'Filtres micro-ondes reconfigurables pour stations de base cellulaires',
      'Amplificateurs de puissance HF à haute efficacité énergétique',
    ],
    publications: [
      'Design of Compact Dual-Band MIMO Antenna for IoT Applications (Microwave Journal, 2024)',
      'High-Efficiency RF Power Amplifiers for 5G Base Stations (IEEE Trans., 2025)',
    ],
    keywords: ['MIMO Antenna', 'Radiofréquence', 'Hyperfréquences', 'IoT', '5G/6G'],
  },
  {
    id: 'biometrie',
    title: 'Biométrie & Sécurité',
    icon: 'fingerprint',
    description: 'Protection des données et identification sécurisée.',
    fullDescription: 'Recherche sur l’authentification biométrique robuste (reconnaissance faciale, empreinte, iris) dans des conditions complexes et conception d’architectures cryptographiques matérielles légères pour l’IoT.',
    projects: [
      'Reconnaissance faciale multi-spectrale robuste aux variations d’éclairage',
      'Générateurs de nombres aléatoires matériels (TRNG) pour puces sécurisées',
      'Cryptographie légère pour réseaux de capteurs sans fil à ressources limitées',
    ],
    publications: [
      'Deep Metric Learning for Multi-Spectral Face Identification (IEEE, 2023)',
      'Ultralightweight Security Protocols for Smart City IoT Nodes (Springer, 2024)',
    ],
    keywords: ['Biométrie', 'Sécurité', 'Cryptographie matérielle', 'Deep Learning'],
  },
  {
    id: 'ehealth',
    title: 'E-Health & Cloud',
    icon: 'medical_services',
    description: 'Santé connectée et architecture mobile cloud.',
    fullDescription: 'Intégration de capteurs biomédicaux connectés avec des plateformes cloud pour le suivi médical à distance en temps réel, s’appuyant sur l’intelligence artificielle pour la détection d’anomalies.',
    projects: [
      'Télésurveillance cardiaque portative avec analyse d’ECG par IA embarquée',
      'Plateforme cloud sécurisée pour le suivi à distance des patients chroniques',
      'Algorithmes d’apprentissage fédéré pour la classification confidentielle d’imagerie médicale',
    ],
    publications: [
      'Edge-assisted Mobile Cloud Architecture for Cardio-monitoring (IEEE Cloud, 2024)',
      'AI-driven Decision Support System for Rural Telehealth Clinics (Minds & Machines, 2025)',
    ],
    keywords: ['Télémédecine', 'Capteurs biomédicaux', 'Mobile Cloud', 'Edge Computing'],
  },
];

export const strategicChallenges: StrategicChallenge[] = [
  {
    id: 1,
    title: 'Économie verte',
    description: 'Soutenir la création de valeur durable à faible empreinte carbone en développant des technologies de fabrication électronique sobres et recyclables.',
    projects: ['Projet Eco-Chip pour la réduction des métaux lourds', 'Optimisation des circuits à base de substrats organiques'],
  },
  {
    id: 2,
    title: 'Transport durable',
    description: 'Accompagner la transition vers des mobilités zéro émission par la recherche sur l’électrification et l’optimisation des flottes de transport.',
    projects: ['Plateforme de gestion de recharge intelligente', 'Projet V2G intelligent d’ENICarthage'],
  },
  {
    id: 3,
    title: 'Modes de production',
    description: 'Promouvoir des systèmes de production industriels flexibles et énergétiquement optimisés grâce aux jumeaux numériques et aux capteurs HF.',
    projects: ['Jumeau numérique de micro-ligne d’assemblage', 'Optimisation thermique des convertisseurs de puissance'],
  },
  {
    id: 4,
    title: 'Gestion des ressources',
    description: 'Créer des systèmes de supervision intelligents (Smart Water / Smart Grid) pour rationaliser la consommation d’eau et d’électricité dans les villes intelligentes.',
    projects: ['Capteurs autonomes de débit d’eau', 'Compteurs électriques communicants sécurisés'],
  },
  {
    id: 5,
    title: 'Équité sociale',
    description: 'Garantir un accès universel aux technologies avancées, notamment à travers le développement d’outils médicaux connectés abordables.',
    projects: ['Kits de télémédecine bas coût', 'Systèmes d’alertes d’urgence pour zones rurales'],
  },
  {
    id: 6,
    title: 'Santé publique',
    description: 'Améliorer le diagnostic précoce et le suivi à distance des maladies chroniques par des biocapteurs non-invasifs et l’intelligence artificielle.',
    projects: ['ECG portatif intelligent de précision', 'Algorithmes de détection d’apnée du sommeil'],
  },
];

export const teamMembers: TeamMember[] = [
  {
    name: 'Prof. Kaïs OUNI',
    role: 'Directeur de Laboratoire',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200',
    bio: 'Professeur de l’Enseignement Supérieur, spécialiste en traitement numérique du signal, systèmes embarqués intelligents, et biométrie.',
    specialties: ['Traitement de Signal', 'Systèmes Embarqués', 'Biométrie', 'Reconnaissance de Formes'],
  },
  {
    name: 'Prof. Lilia EL AMRAOUI',
    role: 'Fondatrice / Directrice Adjointe',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200',
    bio: 'Spécialiste de renommée en électronique de puissance, micro-réseaux (Smart Grids), et gestion de l’énergie.',
    specialties: ['Électronique de Puissance', 'Smart Grid', 'Énergies Renouvelables', 'Régulation Multi-physique'],
  },
  {
    name: 'Dr. Mourad Ben Ali',
    role: 'Maître de Conférences',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200&h=200',
    bio: 'Enseignant-chercheur menant des travaux de pointe sur les systèmes de transport intelligents et la recharge sans fil pour véhicules électriques.',
    specialties: ['Mobilité Propre', 'Véhicule Électrique', 'Induction électromagnétique', 'Supercondensateurs'],
  },
  {
    name: 'Dr. Salma Mezghani',
    role: 'Chercheuse Senior',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200',
    bio: 'Experte en architectures Cloud pour l’E-Health et le deep learning décentralisé pour la protection des données médicales.',
    specialties: ['E-Health', 'Apprentissage Fédéré', 'Architectures Cloud', 'Sécurité des Données'],
  },
];
