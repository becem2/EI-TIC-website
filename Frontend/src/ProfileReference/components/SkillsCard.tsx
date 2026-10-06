import React, { useState } from 'react';
import { Edit3, Cpu, Plus, X, Check, Sparkles } from 'lucide-react';

const skillSuggestions = [
  // Computing and software
  'C',
  'C++',
  'C#',
  'Python',
  'Java',
  'JavaScript',
  'TypeScript',
  'Go',
  'Rust',
  'PHP',
  'SQL',
  'HTML',
  'CSS',
  'React',
  'Node.js',
  'Angular',
  'Vue.js',
  'Django',
  'Spring Boot',
  'REST APIs',
  'Git',
  'Machine Learning',
  'Deep Learning',
  'Artificial Intelligence',
  'Computer Vision',
  'Natural Language Processing',
  'Data Science',
  'Data Analysis',
  'Data Visualization',
  'Database Design',
  'DevOps',
  'Docker',
  'Kubernetes',
  'Cloud Computing',
  'Cybersecurity',
  'Blockchain',
  'Human-Computer Interaction',
  'Software Testing',
  'Robotics',
  'Embedded Systems',
  'Neural Networks',
  'Internet of Things',

  // Electrical and electronics engineering
  'Circuit Design',
  'Analog Electronics',
  'Digital Electronics',
  'Power Electronics',
  'Microelectronics',
  'VLSI Design',
  'PCB Design',
  'Signal Processing',
  'Digital Signal Processing',
  'Control Systems',
  'Electrical Machines',
  'Power Systems',
  'Renewable Energy',
  'Solar Energy',
  'Wind Energy',
  'Smart Grids',
  'High Voltage Engineering',
  'Telecommunications',
  'Wireless Communications',
  'RF Engineering',
  'Optical Communications',
  'Instrumentation',
  'Sensors',
  'PLC Programming',
  'SCADA',
  'MATLAB',
  'Simulink',
  'Arduino',
  'Raspberry Pi',

  // Mechanical and manufacturing engineering
  'Mechanical Design',
  'CAD',
  'SolidWorks',
  'AutoCAD',
  'CATIA',
  'Finite Element Analysis',
  'Computational Fluid Dynamics',
  'Thermodynamics',
  'Fluid Mechanics',
  'Heat Transfer',
  'Materials Science',
  'Mechanics of Materials',
  'Machine Design',
  'Dynamics',
  'Kinematics',
  'Mechatronics',
  'Manufacturing Engineering',
  'Additive Manufacturing',
  '3D Printing',
  'CNC Machining',
  'Industrial Automation',
  'Quality Control',
  'Lean Manufacturing',
  'Product Development',
  'Technical Drawing',

  // Civil, construction, and environmental engineering
  'Civil Engineering',
  'Structural Engineering',
  'Structural Analysis',
  'Geotechnical Engineering',
  'Transportation Engineering',
  'Hydraulic Engineering',
  'Water Resources',
  'Construction Management',
  'Building Information Modeling',
  'Revit',
  'Surveying',
  'Urban Planning',
  'Environmental Engineering',
  'Wastewater Treatment',
  'Water Treatment',
  'Sustainability',
  'Environmental Impact Assessment',

  // Chemical, materials, and process engineering
  'Chemical Engineering',
  'Process Engineering',
  'Process Control',
  'Reaction Engineering',
  'Chemical Process Design',
  'Petrochemical Engineering',
  'Biochemical Engineering',
  'Polymer Science',
  'Nanotechnology',
  'Corrosion Engineering',
  'Materials Engineering',
  'Laboratory Research',

  // Biomedical, aerospace, and life sciences
  'Biomedical Engineering',
  'Biotechnology',
  'Bioinformatics',
  'Medical Imaging',
  'Biomechanics',
  'Aerospace Engineering',
  'Aerodynamics',
  'Aircraft Design',
  'Space Systems',
  'Satellite Engineering',
  'Astronomy',
  'Physics',
  'Mathematics',
  'Statistics',
  'Biology',
  'Chemistry',

  // Business and professional skills
  'Project Management',
  'Research Methods',
  'Technical Writing',
  'Scientific Communication',
  'Public Speaking',
  'Leadership',
  'Team Management',
  'Entrepreneurship',
  'Business Analysis',
  'Operations Management',
  'Supply Chain Management',
  'Financial Analysis',
  'Marketing',
];

interface SkillsCardProps {
  skills: string[];
  isPublicView: boolean;
  onUpdateSkills: (skills: string[]) => void;
  onSaveSkills?: (skills: string[]) => void;
}

export const SkillsCard: React.FC<SkillsCardProps> = ({
  skills,
  isPublicView,
  onUpdateSkills,
  onSaveSkills,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentSkills, setCurrentSkills] = useState<string[]>(skills);
  const [newSkillInput, setNewSkillInput] = useState('');

  const suggestions = newSkillInput.trim()
    ? skillSuggestions
        .filter((suggestion) => suggestion.toLowerCase().startsWith(newSkillInput.trim().toLowerCase()))
        .filter((suggestion) => !currentSkills.some((skill) => skill.toLowerCase() === suggestion.toLowerCase()))
        .slice(0, 6)
    : [];

  const addSkill = (skill: string) => {
    if (currentSkills.some((currentSkill) => currentSkill.toLowerCase() === skill.toLowerCase())) return;

    const updated = [...currentSkills, skill];
    setCurrentSkills(updated);
    onUpdateSkills(updated);
    setNewSkillInput('');
  };

  const handleAddSkill = () => {
    const trimmed = newSkillInput.trim();
    if (trimmed) addSkill(trimmed);
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const updated = currentSkills.filter((s) => s !== skillToRemove);
    setCurrentSkills(updated);
    onUpdateSkills(updated);
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      onUpdateSkills(currentSkills);
      onSaveSkills?.(currentSkills);
      setIsEditing(false);
    } else {
      setCurrentSkills(skills);
      setIsEditing(true);
    }
  };

  return (
    <section className="bg-[#ffffff] rounded-2xl p-6 sm:p-8 shadow-sm border border-[#c1c6d7]/25 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#0058bc]">
            <Cpu className="w-4 h-4" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1a1c1d]">Skills</h2>
        </div>

        {!isPublicView && (
          <button
            onClick={handleToggleEdit}
            id="edit-skills-btn"
            title={isEditing ? 'Terminer la modification' : 'Modifier les compétences en direct'}
            className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${
              isEditing
                ? 'bg-[#0058bc] text-white border-[#0058bc] shadow-sm'
                : 'border-[#c1c6d7] text-[#414755] hover:bg-[#f3f3f5] hover:text-[#0058bc] hover:border-[#0058bc]'
            }`}
          >
            {isEditing ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Terminé</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5" />
                <span>Modifier</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Inline Adding bar when editing */}
      {isEditing && (
        <div className="relative p-3 bg-blue-50/40 rounded-xl border border-[#0058bc]/20 animate-in fade-in duration-200">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#0058bc]">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <input
                type="text"
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                placeholder="Saisissez une compétence"
                className="w-full px-3 py-1.5 pl-9 rounded-lg border border-[#c1c6d7] text-xs focus:border-[#0058bc] outline-none bg-white"
              />
            </div>
            <button
              type="button"
              onClick={handleAddSkill}
              className="px-3.5 py-1.5 bg-[#0058bc] text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#004493] flex items-center gap-1 shrink-0 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter</span>
            </button>
          </div>

          {suggestions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Suggested skills">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => addSkill(suggestion)}
                  className="rounded-full border border-[#0058bc]/25 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#0058bc] transition-colors hover:bg-[#0058bc] hover:text-white"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Skills list with inline delete badges when editing */}
      <div className="flex flex-wrap gap-2.5">
        {(isEditing ? currentSkills : skills).map((skill, index) => (
          <span
            key={index}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide flex items-center gap-1.5 transition-all ${
              isEditing
                ? 'bg-blue-50 text-[#0058bc] border border-[#0058bc]/30 shadow-xs'
                : 'bg-[#0058bc]/10 text-[#0058bc] hover:bg-[#0058bc]/15 cursor-default'
            }`}
          >
            <span>{skill}</span>
            {isEditing && (
              <button
                type="button"
                onClick={() => handleRemoveSkill(skill)}
                className="w-4 h-4 rounded-full bg-[#0058bc]/20 hover:bg-red-500 hover:text-white text-[#0058bc] flex items-center justify-center transition-colors ml-0.5"
                title={`Supprimer ${skill}`}
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </span>
        ))}
      </div>
    </section>
  );
};
