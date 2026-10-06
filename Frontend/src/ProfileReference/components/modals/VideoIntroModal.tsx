import React, { useState } from 'react';
import { X, Video, Play, Sparkles, Upload, Check } from 'lucide-react';

interface VideoIntroModalProps {
  isOpen: boolean;
  hasVideo: boolean;
  videoUrl?: string;
  onClose: () => void;
  onSaveVideo: (url: string) => void;
}

export const VideoIntroModal: React.FC<VideoIntroModalProps> = ({
  isOpen,
  hasVideo,
  videoUrl: initialUrl,
  onClose,
  onSaveVideo,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [inputUrl, setInputUrl] = useState(initialUrl || 'https://assets.mixkit.co/videos/preview/mixkit-circuit-board-with-glowing-signals-41484-large.mp4');
  const [isEditingUrl, setIsEditingUrl] = useState(!hasVideo);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveVideo(inputUrl);
    setIsEditingUrl(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-[#c1c6d7]/30 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#c1c6d7]/20 flex items-center justify-between bg-[#f9f9fb]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#0058bc]">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#1a1c1d]">Vidéo de présentation du chercheur</h3>
              <p className="text-xs text-[#717786]">Dr. Mhamdi B. — Présentation de l’informatique cognitive</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#717786] hover:bg-[#eeeef0] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player Box */}
        <div className="p-6 sm:p-8 space-y-5 text-sm">
          <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 relative flex items-center justify-center shadow-lg border border-slate-800">
            {/* Custom simulated video preview */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 flex flex-col justify-between p-6 text-white pointer-events-none">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-red-600/90 text-white rounded-full text-[10px] font-bold uppercase tracking-wider">
                  LaboRecherche Spotlight
                </span>
                <span className="text-xs font-mono text-white/80">01:45 min</span>
              </div>
              <div>
                <p className="font-bold text-lg">Modelling Neuromorphic Cognitive Systems</p>
                <p className="text-xs text-white/70">Dr. Mhamdi B. presents his latest hardware architectures</p>
              </div>
            </div>

            {/* Glowing background representation */}
            <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900 via-slate-950 to-black flex items-center justify-center">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-16 h-16 rounded-full bg-[#0058bc] text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-10"
              >
                <Play className="w-7 h-7 fill-white translate-x-0.5" />
              </button>
            </div>
          </div>

          {/* Video URL Settings */}
          {isEditingUrl ? (
            <div className="space-y-3 bg-[#f3f3f5] p-4 rounded-xl">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1a1c1d]">
                Lien de la vidéo (YouTube, Vimeo, ou MP4)
              </label>
              <input
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#c1c6d7] text-xs focus:border-[#0058bc] outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsEditingUrl(false)}
                  className="px-4 py-1.5 text-xs text-[#414755]"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-1.5 bg-[#0058bc] text-white text-xs font-semibold rounded-lg"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-[#717786]">Vidéo introductive enregistrée avec succès.</span>
              <button
                onClick={() => setIsEditingUrl(true)}
                className="text-xs text-[#0058bc] font-semibold hover:underline"
              >
                Changer la vidéo
              </button>
            </div>
          )}
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
