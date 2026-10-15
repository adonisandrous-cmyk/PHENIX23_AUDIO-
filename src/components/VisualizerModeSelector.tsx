import React from 'react';
import { VisualizerMode } from '../types/visualizer';
import { BarChart3, Disc, Mountain, Activity, Waves, Rocket } from 'lucide-react';

interface VisualizerModeSelectorProps {
  currentMode: VisualizerMode;
  onSelectMode: (mode: VisualizerMode) => void;
}

interface ModeMeta {
  id: VisualizerMode;
  name: string;
  badge: string;
  description: string;
  icon: React.ElementType;
}

const MODES: ModeMeta[] = [
  {
    id: 'classic-spectrum',
    name: 'AIMP Peak Spectrum',
    badge: 'Native AIMP Style',
    description: 'Logarithmic EQ bars with gravity-decay peak hold caps and mirror floor reflections.',
    icon: BarChart3
  },
  {
    id: 'radial-nebula',
    name: 'Radial Nebula Iris',
    badge: 'Circular Particle',
    description: '360° rotational frequency iris with reactive particle bursts and pulsating core.',
    icon: Disc
  },
  {
    id: 'horizon-3d',
    name: '3D Retro Terrain',
    badge: 'Synthwave Wireframe',
    description: 'Infinite perspective landscape mesh with rolling audio mountain ridges traveling forward.',
    icon: Mountain
  },
  {
    id: 'lissajous-phase',
    name: 'Stereo Phase Goniometer',
    badge: 'Mastering Vector Scope',
    description: 'XY stereo correlation scope and Lissajous curves with CRT phosphor persistence.',
    icon: Activity
  },
  {
    id: 'liquid-plasma',
    name: 'Liquid Frequency Bloom',
    badge: 'Organic Fluid Shader',
    description: 'Dynamic harmonic fluid contours and transient shockwave ripples.',
    icon: Waves
  },
  {
    id: 'warp-tunnel',
    name: 'Hyperspace Warp Tunnel',
    badge: '3D Polygonal Speed',
    description: 'Concentric audio rings and accelerating hyperspace starfield reacting to bass energy.',
    icon: Rocket
  }
];

export const VisualizerModeSelector: React.FC<VisualizerModeSelectorProps> = ({
  currentMode,
  onSelectMode
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {MODES.map((m) => {
        const Icon = m.icon;
        const isSelected = currentMode === m.id;

        return (
          <button
            key={m.id}
            onClick={() => onSelectMode(m.id)}
            className={`text-left p-3.5 rounded-xl border transition-all relative group ${
              isSelected
                ? 'bg-neutral-900 border-amber-500/60 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/30'
                : 'bg-neutral-900/50 border-neutral-800/80 hover:bg-neutral-900/80 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className={`p-2 rounded-lg ${isSelected ? 'bg-amber-400 text-neutral-950' : 'bg-neutral-800 text-neutral-400 group-hover:text-neutral-200'}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[11px] text-neutral-400 font-medium">
                {m.badge}
              </span>
            </div>

            <h4 className={`text-sm font-semibold mb-1 ${isSelected ? 'text-amber-400' : 'text-neutral-100'}`}>
              {m.name}
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {m.description}
            </p>
          </button>
        );
      })}
    </div>
  );
};
