import React from 'react';
import { LinkedAccountItem } from '../types';
import { Mail, Code2, ExternalLink, Link2, Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface LinkedAccountsCardProps {
  accounts: LinkedAccountItem[];
  isPublicView: boolean;
  isGoogleAuthenticated: boolean;
  onOpenLinkModal: () => void;
  onUnlinkAccount: (id: string) => void;
}

export const LinkedAccountsCard: React.FC<LinkedAccountsCardProps> = ({
  accounts,
  isPublicView,
  isGoogleAuthenticated,
  onOpenLinkModal,
  onUnlinkAccount,
}) => {
  return (
    <div className="bg-[#ffffff] rounded-2xl p-6 shadow-sm border border-[#c1c6d7]/25 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#0058bc]">
            <Link2 className="w-4 h-4" />
          </div>
          <h4 className="font-semibold text-lg text-[#1a1c1d]">Comptes liés</h4>
        </div>

        {!isPublicView && (
          <button
            onClick={onOpenLinkModal}
            id="add-linked-account-btn"
            title="Ajouter un compte"
            aria-label="Ajouter un compte"
            className="w-8 h-8 rounded-lg border border-[#0058bc] text-[#0058bc] flex items-center justify-center hover:bg-blue-50 transition-colors active:scale-95"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {accounts.length === 0 ? (
        <div className="py-5 px-4 bg-[#f9f9fb] rounded-xl border border-dashed border-[#c1c6d7]">
          <p className="text-sm font-semibold text-[#1a1c1d]">Aucun compte lié</p>
          <p className="mt-1 text-xs text-[#717786]">Ajoutez Gmail ou GitHub pour afficher vos comptes ici.</p>
          {!isPublicView && (
            <button
              onClick={onOpenLinkModal}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0058bc] text-white text-xs font-semibold hover:bg-[#004493] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Lier Gmail ou GitHub</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {accounts.map((acc) => {
            const isGithub = acc.type === 'github';

            return (
              <div
                key={acc.id}
                className="bg-[#f9f9fb] rounded-xl p-3 flex items-center justify-between gap-3 border border-[#c1c6d7]/30 hover:border-[#c1c6d7]/60 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {acc.avatar ? (
                    <img
                      src={acc.avatar}
                      alt={acc.name}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                      className="w-10 h-10 rounded-lg object-cover border border-white shadow-xs shrink-0"
                    />
                  ) : isGithub ? (
                    <div className="w-10 h-10 rounded-lg bg-[#1a1c1d] flex items-center justify-center text-white shrink-0 shadow-xs">
                      <Code2 className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                      <Mail className="w-4 h-4" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p className="font-bold text-xs text-[#1a1c1d] truncate">{acc.name}</p>
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                        Lié
                      </span>
                    </div>
                    <p className="text-xs text-[#414755] font-mono truncate">{acc.handle}</p>
                    {acc.meta && <p className="mt-0.5 text-[10px] text-[#717786] truncate">{acc.meta}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  {acc.url && (
                    <a
                      href={acc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 text-[#0058bc] hover:text-[#004493] rounded-lg hover:bg-white transition-colors"
                      title={`Ouvrir ${acc.name}`}
                      aria-label={`Ouvrir ${acc.name}`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {!isPublicView && !(isGoogleAuthenticated && acc.type === 'email') && (
                    <button
                      onClick={() => onUnlinkAccount(acc.id)}
                      className="p-1.5 text-[#717786] hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title={`Dissocier ce compte ${acc.name}`}
                      aria-label={`Dissocier ce compte ${acc.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
