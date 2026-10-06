import React, { useState } from 'react';
import { ActiveNavTab } from '../types';
import { User, Menu, X, Bell } from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveNavTab;
  isPublicView: boolean;
  onSelectTab: (tab: ActiveNavTab) => void;
  onOpenNewsletter: () => void;
  onOpenProfileSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  isPublicView,
  onSelectTab,
  onOpenNewsletter,
  onOpenProfileSettings,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: ActiveNavTab; label: string }[] = [
    { id: 'accueil', label: 'Accueil' },
    { id: 'a-propos', label: 'À propos' },
    { id: 'chercheurs', label: 'Chercheurs' },
    { id: 'publications', label: 'Publications' },
    { id: 'actualites', label: 'Actualités' },
    { id: 'collaborations', label: 'Collaborations' },
  ];

  return (
    <header className="fixed top-0 w-full z-40 bg-[#f9f9fb]/80 backdrop-blur-xl border-b border-[#c1c6d7]/20 shadow-[0_1px_12px_rgba(0,0,0,0.03)]">
      <div className="max-w-[1440px] mx-auto px-4 md:px-12 lg:px-16 h-16 flex items-center justify-between">
        {/* Left: Brand & Desktop Navigation */}
        <div className="flex items-center gap-8 lg:gap-12">
          <button
            onClick={() => onSelectTab('chercheurs')}
            className="text-left font-bold text-xl lg:text-2xl tracking-tight text-[#1a1c1d] hover:opacity-85 transition-opacity"
            id="brand-logo-btn"
          >
            LaboRecherche
          </button>

          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-xs font-semibold uppercase tracking-wider">
            {navItems.map((item) => {
              const isActive = activeTab === item.id || (item.id === 'accueil' && activeTab === 'chercheurs');
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                  }}
                  id={`nav-item-${item.id}`}
                  className={`transition-colors py-1 relative ${
                    isActive
                      ? 'text-[#0058bc] font-bold'
                      : 'text-[#414755] hover:text-[#1a1c1d]'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0058bc] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={onOpenNewsletter}
            id="header-newsletter-btn"
            className="hidden sm:inline-flex items-center gap-2 bg-[#1a1c1d] text-white text-xs font-medium uppercase tracking-wider px-5 py-2.5 rounded-full hover:bg-[#414755] active:scale-95 transition-all shadow-sm"
          >
            <Bell className="w-3.5 h-3.5 text-blue-300" />
            <span>Newsletter</span>
          </button>

          {!isPublicView && (
            <button
              onClick={onOpenProfileSettings}
              id="header-user-avatar-btn"
              title="Mon Profil / Paramètres"
              className="w-9 h-9 rounded-full bg-[#0058bc] text-white flex items-center justify-center hover:bg-[#004493] active:scale-95 transition-all shadow-sm ring-2 ring-blue-100"
            >
              <User className="w-4 h-4" />
            </button>
          )}

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            id="header-mobile-menu-toggle"
            className="lg:hidden p-2 rounded-lg text-[#414755] hover:bg-[#eeeef0] transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#c1c6d7]/30 bg-[#f9f9fb] px-6 py-4 space-y-2 shadow-lg animate-in slide-in-from-top-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`block w-full text-left py-2.5 px-3 rounded-lg text-sm font-semibold uppercase tracking-wider transition-colors ${
                activeTab === item.id
                  ? 'bg-blue-50 text-[#0058bc]'
                  : 'text-[#414755] hover:bg-[#eeeef0]'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="pt-3 border-t border-[#c1c6d7]/20 sm:hidden">
            <button
              onClick={() => {
                onOpenNewsletter();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 bg-[#1a1c1d] text-white text-xs font-semibold uppercase tracking-wider py-3 rounded-full"
            >
              <Bell className="w-3.5 h-3.5 text-blue-300" />
              S'inscrire à la Newsletter
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
