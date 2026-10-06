import React, { useState } from 'react';
import { PublicationItem } from '../../types';
import type { PublicationType } from '../../../types';
import { X, Image, BookOpen, Tag } from 'lucide-react';

interface AddPublicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pub: PublicationItem) => void;
}

export const AddPublicationModal: React.FC<AddPublicationModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<'published' | 'draft'>('published');
  const [type, setType] = useState<PublicationType>('Article scientifique');
  const [journal, setJournal] = useState('');
  const [year, setYear] = useState(2024);
  const [doi, setDoi] = useState('');
  const [abstract, setAbstract] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [keywords, setKeywords] = useState('Cognitive Computing, Deep Learning');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newPub: PublicationItem = {
      id: `pub-${Date.now()}`,
      title: title.trim(),
      status,
      type,
      journal: journal.trim() || undefined,
      year: Number(year) || 2024,
      doi: doi.trim() || undefined,
      abstract: abstract.trim() || undefined,
      image: imageUrl.trim() || 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=800&q=80',
      authors: ['Dr. Mhamdi B.'],
      keywords: keywords.split(',').map((k) => k.trim()).filter(Boolean),
    };

    onSave(newPub);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-xl max-h-[90vh] rounded-2xl shadow-2xl border border-[#c1c6d7]/30 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#c1c6d7]/20 flex items-center justify-between bg-[#f9f9fb]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#0058bc]">
              <BookOpen className="w-4 h-4" />
            </div>
            <h3 className="text-xl font-bold text-[#1a1c1d]">Ajouter une publication</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#717786] hover:bg-[#eeeef0] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 overflow-y-auto space-y-4 text-sm">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1a1c1d] mb-1">
              Titre de la publication *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex. Architecture neuromorphique écoénergétique pour tâches cognitives"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#c1c6d7] focus:border-[#0058bc] focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1a1c1d] mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'published' | 'draft')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#c1c6d7] focus:border-[#0058bc] outline-none"
              >
                <option value="published">Publiée</option>
                <option value="draft">Brouillon</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1a1c1d] mb-1">
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as PublicationType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#c1c6d7] focus:border-[#0058bc] outline-none"
              >
                <option value="Communication">Communication</option>
                <option value="Article scientifique">Article scientifique</option>
                <option value="Chapitre d'ouvrage">Chapitre d'ouvrage</option>
                <option value="Ouvrage scientifique">Ouvrage scientifique</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1a1c1d] mb-1">
                Année
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#c1c6d7] focus:border-[#0058bc] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1a1c1d] mb-1">
              Revue ou conférence
            </label>
            <input
              type="text"
              value={journal}
              onChange={(e) => setJournal(e.target.value)}
              placeholder="ex. IEEE Transactions on Neural Networks, NeurIPS"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#c1c6d7] focus:border-[#0058bc] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1a1c1d] mb-1">
              DOI (identifiant numérique d’objet)
            </label>
            <input
              type="text"
              value={doi}
              onChange={(e) => setDoi(e.target.value)}
              placeholder="10.1109/TNNLS.2024.xxxxxxx"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#c1c6d7] focus:border-[#0058bc] outline-none font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1a1c1d] mb-1">
              URL de l’image de couverture (facultatif)
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#c1c6d7] focus:border-[#0058bc] outline-none text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1a1c1d] mb-1">
              Résumé
            </label>
            <textarea
              rows={3}
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              placeholder="Brève description de la méthodologie et des principaux résultats scientifiques..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#c1c6d7] focus:border-[#0058bc] outline-none leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1a1c1d] mb-1">
              Mots-clés (séparés par des virgules)
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="IA, matériel, réseaux neuronaux"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#c1c6d7] focus:border-[#0058bc] outline-none"
            />
          </div>

          <div className="pt-4 border-t border-[#c1c6d7]/20 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-[#c1c6d7] text-xs font-semibold uppercase tracking-wider text-[#414755] hover:bg-[#f3f3f5]"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full bg-[#0058bc] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#004493] shadow-sm transition-all"
            >
              Ajouter la publication
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
