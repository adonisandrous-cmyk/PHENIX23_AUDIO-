import React from 'react';
import { Download } from 'lucide-react';

export type NavSection = 'studio' | 'presets' | 'palettes' | 'modes' | 'ai-video' | 'streaming' | 'plugin-hub';

interface TopNavigationProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  onExportPlugin: () => void;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  activeSection,
  onSelectSection,
  onExportPlugin
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Brand Wordmark (Single text element) */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-7 h-7 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xs tracking-wider">
          A
        </div>
        <span className="text-base font-semibold tracking-tight text-neutral-100 whitespace-nowrap">
          AIMP Visualizer Studio
        </span>
      </div>

      {/* Zone 2: Single-line Text Navigation Links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-400">
        <button
          onClick={() => onSelectSection('studio')}
          className={`hover:text-neutral-100 transition-colors whitespace-nowrap shrink-0 ${
            activeSection === 'studio' ? 'text-amber-400 font-semibold' : ''
          }`}
        >
          Studio
        </button>
        <button
          onClick={() => onSelectSection('presets')}
          className={`hover:text-neutral-100 transition-colors whitespace-nowrap shrink-0 ${
            activeSection === 'presets' ? 'text-amber-400 font-semibold' : ''
          }`}
        >
          Presets
        </button>
        <button
          onClick={() => onSelectSection('palettes')}
          className={`hover:text-neutral-100 transition-colors whitespace-nowrap shrink-0 ${
            activeSection === 'palettes' ? 'text-amber-400 font-semibold' : ''
          }`}
        >
          Palettes & FX
        </button>
        <button
          onClick={() => onSelectSection('ai-video')}
          className={`hover:text-neutral-100 transition-colors whitespace-nowrap shrink-0 ${
            activeSection === 'ai-video' ? 'text-amber-400 font-semibold' : ''
          }`}
        >
          AI Video Sync
        </button>
        <button
          onClick={() => onSelectSection('streaming')}
          className={`hover:text-neutral-100 transition-colors whitespace-nowrap shrink-0 ${
            activeSection === 'streaming' ? 'text-amber-400 font-semibold' : ''
          }`}
        >
          Streaming Hub
        </button>
        <button
          onClick={() => onSelectSection('plugin-hub')}
          className={`hover:text-neutral-100 transition-colors whitespace-nowrap shrink-0 ${
            activeSection === 'plugin-hub' ? 'text-amber-400 font-semibold' : ''
          }`}
        >
          C++ & Delphi SDK
        </button>
      </nav>

      {/* Zone 3: Single Primary Action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onExportPlugin}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 active:scale-98 rounded-md transition-all whitespace-nowrap shadow-sm shadow-amber-500/20"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Plugin</span>
        </button>
      </div>
    </header>
  );
};
