import React from 'react';
import { X, TrendingUp, Award, Globe, BookOpen, BarChart3 } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  citationsCount: number;
}

const CITATION_TIMELINE = [
  { year: '2020', citations: 12, reads: 140 },
  { year: '2021', citations: 28, reads: 320 },
  { year: '2022', citations: 45, reads: 580 },
  { year: '2023', citations: 78, reads: 940 },
  { year: '2024', citations: 114, reads: 1450 },
  { year: '2025 (prévision)', citations: 160, reads: 2100 },
];

const TOP_SUBJECTS = [
  { subject: 'Cognitive Computing', value: 45 },
  { subject: 'Neuromorphic Hardware', value: 30 },
  { subject: 'NLP & Semantics', value: 15 },
  { subject: 'Embedded AI', value: 10 },
];

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({
  isOpen,
  onClose,
  citationsCount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl border border-[#c1c6d7]/30 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#c1c6d7]/20 flex items-center justify-between bg-[#f9f9fb]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#0058bc] text-white flex items-center justify-center shadow-sm">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#1a1c1d]">Citations et analyse scientifique</h3>
              <p className="text-xs text-[#717786]">Bibliometric impact metrics for Dr. Mhamdi B.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#717786] hover:bg-[#eeeef0] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-sm">
          {/* Key KPI Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#f3f3f5] rounded-xl p-4 text-center border border-[#c1c6d7]/20">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#717786]">
                Citations
              </span>
              <p className="text-2xl font-black text-[#0058bc] mt-1">{citationsCount || 277}</p>
              <span className="text-[10px] text-emerald-600 font-semibold">+28 % cette année</span>
            </div>

            <div className="bg-[#f3f3f5] rounded-xl p-4 text-center border border-[#c1c6d7]/20">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#717786]">
                h-index
              </span>
              <p className="text-2xl font-black text-[#1a1c1d] mt-1">8</p>
              <span className="text-[10px] text-[#717786]">Scopus / IEEE</span>
            </div>

            <div className="bg-[#f3f3f5] rounded-xl p-4 text-center border border-[#c1c6d7]/20">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#717786]">
                i10-index
              </span>
              <p className="text-2xl font-black text-[#1a1c1d] mt-1">6</p>
              <span className="text-[10px] text-[#717786]">&gt; 10 citations</span>
            </div>

            <div className="bg-[#f3f3f5] rounded-xl p-4 text-center border border-[#c1c6d7]/20">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#717786]">
                Lectures et vues
              </span>
              <p className="text-2xl font-black text-purple-700 mt-1">5.4k</p>
              <span className="text-[10px] text-purple-600 font-semibold">Portée mondiale</span>
            </div>
          </div>

          {/* Citation Trend Chart */}
          <div className="bg-[#ffffff] border border-[#c1c6d7]/30 rounded-xl p-5 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1a1c1d] mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#0058bc]" />
              <span>Evolution des Citations & Lectures (2020 - 2025)</span>
            </h4>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={CITATION_TIMELINE} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="citationGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0058bc" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0058bc" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eeeef0" />
                  <XAxis dataKey="year" stroke="#717786" fontSize={11} />
                  <YAxis stroke="#717786" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1c1d',
                      color: '#ffffff',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="citations"
                    name="Citations"
                    stroke="#0058bc"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#citationGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Research Distribution */}
          <div className="bg-[#f9f9fb] border border-[#c1c6d7]/20 rounded-xl p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1a1c1d] mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              <span>Domaines de Recherche Principaux</span>
            </h4>
            <div className="space-y-2.5">
              {TOP_SUBJECTS.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-[#1a1c1d]">
                    <span>{item.subject}</span>
                    <span className="font-bold text-[#0058bc]">{item.value}%</span>
                  </div>
                  <div className="w-full bg-[#e2e2e4] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#0058bc] h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#c1c6d7]/20 bg-[#f9f9fb] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full bg-[#1a1c1d] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#414755]"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
