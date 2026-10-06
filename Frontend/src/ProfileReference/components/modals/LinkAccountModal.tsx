import React, { useState } from 'react';
import { LinkedAccountItem } from '../../types';
import { Check, Mail, ShieldCheck, X } from 'lucide-react';

interface LinkAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLinkAccount: (account: LinkedAccountItem) => void;
  existingAccounts: LinkedAccountItem[];
}

export const LinkAccountModal: React.FC<LinkAccountModalProps> = ({
  isOpen,
  onClose,
  onLinkAccount,
  existingAccounts,
}) => {
  const [gmailEmail, setGmailEmail] = useState('');
  const [gmailLabel, setGmailLabel] = useState('Gmail');
  const [isLinking, setIsLinking] = useState(false);

  if (!isOpen) return null;

  const hasGmailLinked = existingAccounts.some((account) => account.type === 'email');

  const handleClose = () => {
    setIsLinking(false);
    onClose();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const email = gmailEmail.trim().toLowerCase();
    if (!email || hasGmailLinked) return;

    setIsLinking(true);
    window.setTimeout(() => {
      onLinkAccount({
        id: `acc-gmail-${Date.now()}`,
        type: 'email',
        name: gmailLabel.trim() || 'Gmail',
        handle: email,
        meta: 'Google Verified',
        url: `mailto:${email}`,
      });
      handleClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200" id="link-account-modal">
      <div className="relative w-full max-w-md overflow-y-auto rounded-2xl border border-[#c1c6d7]/30 bg-white p-6 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between border-b border-[#c1c6d7]/20 pb-4">
          <div>
            <h3 className="text-lg font-bold text-[#1a1c1d]">Ajouter un compte Gmail</h3>
            <p className="mt-1 text-xs text-[#717786]">Associez une adresse e-mail à votre profil de chercheur.</p>
          </div>
          <button type="button" onClick={handleClose} aria-label="Fermer" className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#c1c6d7]/40 text-[#717786] transition-colors hover:bg-[#f3f3f5] hover:text-[#1a1c1d]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {hasGmailLinked ? (
          <div className="py-6 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><Check className="h-5 w-5" /></div>
            <p className="mt-3 text-sm font-semibold text-[#1a1c1d]">Gmail est déjà associé</p>
            <p className="mt-1 text-xs text-[#717786]">Un seul compte Gmail peut être associé à ce profil.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-5">
            <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50/60 p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-600 text-white"><Mail className="h-4 w-4" /></div>
              <div><p className="text-xs font-bold text-[#1a1c1d]">Compte Gmail</p><p className="mt-0.5 text-[11px] text-[#414755]">Votre adresse sera affichée sur votre profil.</p></div>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#717786]">Adresse e-mail</span>
              <input type="email" required value={gmailEmail} onChange={(event) => setGmailEmail(event.target.value)} placeholder="nom@gmail.com" className="w-full rounded-xl border border-[#c1c6d7] bg-white px-3.5 py-2.5 font-mono text-sm text-[#1a1c1d] outline-none focus:border-[#0058bc]" />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#717786]">Libellé affiché</span>
              <input type="text" value={gmailLabel} onChange={(event) => setGmailLabel(event.target.value)} placeholder="Gmail" className="w-full rounded-xl border border-[#c1c6d7] bg-white px-3.5 py-2.5 text-sm text-[#1a1c1d] outline-none focus:border-[#0058bc]" />
            </label>

            <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-xs text-[#0058bc]"><ShieldCheck className="h-4 w-4 shrink-0" /><span>Votre compte sera marqué comme vérifié par Google.</span></div>

            <div className="flex justify-end border-t border-[#c1c6d7]/20 pt-3">
              <button type="submit" disabled={isLinking} className="inline-flex items-center gap-1.5 rounded-xl bg-[#0058bc] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#004493] disabled:opacity-50"><Check className="h-3.5 w-3.5" /><span>{isLinking ? 'Association...' : 'Associer Gmail'}</span></button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};