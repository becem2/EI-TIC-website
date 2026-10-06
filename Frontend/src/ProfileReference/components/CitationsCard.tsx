import React from 'react';
import { TrendingUp, BarChart2 } from 'lucide-react';

interface CitationsCardProps {
  citationsCount: number;
  onViewDetails: () => void;
  onOpenAnalytics: () => void;
}

export const CitationsCard: React.FC<CitationsCardProps> = ({
  citationsCount,
  onViewDetails,
  onOpenAnalytics,
}) => {
  return (
    <div className="bg-[#ffffff] rounded-2xl p-6 shadow-sm border border-[#c1c6d7]/25 transition-all hover:border-[#c1c6d7]/40">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg sm:text-xl text-[#1a1c1d]" id="citations-count-heading">
            Citations : {citationsCount}
          </h3>
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#0058bc]">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[#c1c6d7]/20 pt-4">
          <button
            onClick={onViewDetails}
            id="view-citation-details-btn"
            className="text-xs font-semibold text-[#414755] hover:text-[#0058bc] uppercase tracking-wider transition-colors flex items-center gap-1"
          >
            <span>Voir les détails</span>
          </button>
          <button
            onClick={onOpenAnalytics}
            id="view-citation-analytics-btn"
            className="text-xs font-semibold text-[#414755] hover:text-[#0058bc] uppercase tracking-wider transition-colors flex items-center gap-1"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Analyses</span>
          </button>
        </div>
      </div>
    </div>
  );
};
