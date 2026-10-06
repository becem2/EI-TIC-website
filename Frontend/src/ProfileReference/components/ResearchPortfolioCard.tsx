import React from 'react';
import { PublicationItem } from '../types';
import { BookOpen, FileText } from 'lucide-react';

interface ResearchPortfolioCardProps {
  publications: PublicationItem[];
  onSelectPublication: (pub: PublicationItem) => void;
}

export const ResearchPortfolioCard: React.FC<ResearchPortfolioCardProps> = ({
  publications,
  onSelectPublication,
}) => {
  const filteredPubs = publications.filter((p) => p.status === 'published');

  return (
    <section className="bg-[#ffffff] rounded-2xl p-6 sm:p-8 shadow-sm border border-[#c1c6d7]/25 flex flex-col gap-6">
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-[#c1c6d7]/20 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#0058bc]">
            <BookOpen className="w-4 h-4" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1a1c1d]">
            Portfolio de recherche
          </h2>
        </div>

      </div>

      {/* Publications Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-2">
        {filteredPubs.map((pub) => (
          <div
            key={pub.id}
            onClick={() => onSelectPublication(pub)}
            className="group cursor-pointer flex flex-col gap-3 text-left focus:outline-none"
            role="button"
            tabIndex={0}
          >
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-[#f3f3f5] relative border border-[#c1c6d7]/20 shadow-sm group-hover:shadow-md transition-all">
              {pub.image ? (
                <div
                  className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                  style={{ backgroundImage: `url('${pub.image}')` }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-[#414755] p-4 text-center">
                  <FileText className="w-8 h-8 text-[#0058bc] mb-2" />
                  <span className="text-xs font-semibold text-[#1a1c1d] line-clamp-2">{pub.title}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-[#1a1c1d]/10 group-hover:bg-transparent transition-colors" />

            </div>

            <div className="space-y-1">
              <h4 className="text-xs sm:text-sm font-semibold text-[#1a1c1d] truncate group-hover:text-[#0058bc] transition-colors">
                {pub.title}
              </h4>
              {pub.journal && (
                <p className="text-[11px] text-[#717786] truncate">
                  {pub.journal} {pub.year && `(${pub.year})`}
                </p>
              )}
            </div>
          </div>
        ))}

        {filteredPubs.length === 0 && (
          <div className="col-span-full py-8 text-center text-sm text-[#717786] italic">
            Aucune publication publiée.
          </div>
        )}
      </div>
    </section>
  );
};
