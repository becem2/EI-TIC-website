import React, { useState } from 'react';
import { X, Mail, CheckCircle2, Send, Sparkles } from 'lucide-react';

interface NewsletterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewsletterModal: React.FC<NewsletterModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [topics, setTopics] = useState<string[]>([
    'Informatique Cognitive & Neuromorphisme',
    'Publications Scientifiques & Preprints',
    'Opportunités de Collaborations & Postdocs',
  ]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#c1c6d7]/30 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#c1c6d7]/20 flex items-center justify-between bg-[#f9f9fb]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#1a1c1d] text-white flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-[#1a1c1d]">Newsletter Scientifique</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#717786] hover:bg-[#eeeef0] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 text-sm">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-[#414755] leading-relaxed text-xs sm:text-sm">
                Recevez chaque mois les découvertes de pointe, les articles parus dans les revues internationales et les avancées de l'Institut <strong>LaboRecherche</strong>.
              </p>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1a1c1d] mb-1">
                  Votre Adresse Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom.chercheur@universite.fr"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#c1c6d7] text-xs focus:border-[#0058bc] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#717786] mb-2">
                  Thématiques d'intérêt
                </label>
                <div className="space-y-2">
                  {topics.map((t, idx) => (
                    <label key={idx} className="flex items-center gap-2.5 text-xs text-[#414755] cursor-pointer">
                      <input type="checkbox" defaultChecked className="accent-[#0058bc] rounded" />
                      <span>{t}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-[#c1c6d7]/20 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-[#414755]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#1a1c1d] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#414755] flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>S'abonner</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center space-y-4 py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-[#1a1c1d]">Inscription Confirmée !</h4>
              <p className="text-xs text-[#414755]">
                Un email de bienvenue a été envoyé à <strong>{email}</strong>. Merci de suivre nos travaux de recherche.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-full bg-[#0058bc] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#004493]"
              >
                Fermer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
