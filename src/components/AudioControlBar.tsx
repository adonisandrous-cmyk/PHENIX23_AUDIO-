import React, { useRef } from 'react';
import { audioEngine, DEMO_TRACKS, AudioSourceType } from '../services/audioEngine';
import { AudioMetrics } from '../types/visualizer';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Upload, 
  Mic, 
  Sliders, 
  Disc3 
} from 'lucide-react';

interface AudioControlBarProps {
  isPlaying: boolean;
  sourceType: AudioSourceType;
  volume: number;
  sensitivity: number;
  metrics: AudioMetrics;
  onVolumeChange: (vol: number) => void;
  onSensitivityChange: (sens: number) => void;
}

export const AudioControlBar: React.FC<AudioControlBarProps> = ({
  isPlaying,
  sourceType,
  volume,
  sensitivity,
  metrics,
  onVolumeChange,
  onSensitivityChange
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentTrack = audioEngine.getCurrentTrack();

  const handleTogglePlay = () => {
    audioEngine.togglePlay();
  };

  const handleSourceSelect = async (type: AudioSourceType) => {
    if (type === 'file') {
      fileInputRef.current?.click();
    } else {
      await audioEngine.setSourceType(type);
      if (type === 'mic') {
        await audioEngine.startMic();
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await audioEngine.loadAudioFile(file);
    }
  };

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Left: Source switcher & Playback control */}
      <div className="flex items-center gap-3 w-full md:w-auto">
        <button
          onClick={handleTogglePlay}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            isPlaying 
              ? 'bg-amber-400 text-neutral-950 hover:bg-amber-300' 
              : 'bg-neutral-800 text-neutral-100 hover:bg-neutral-700'
          }`}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>

        {/* Source Mode Segmented Control */}
        <div className="flex items-center p-1 bg-neutral-950/80 rounded-lg border border-neutral-800 text-xs font-medium">
          <button
            onClick={() => handleSourceSelect('synth')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              sourceType === 'synth'
                ? 'bg-neutral-800 text-amber-400 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Disc3 className="w-3.5 h-3.5" />
            <span>Synth Beats</span>
          </button>

          <button
            onClick={() => handleSourceSelect('file')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              sourceType === 'file'
                ? 'bg-neutral-800 text-amber-400 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Load Audio File</span>
          </button>

          <button
            onClick={() => handleSourceSelect('mic')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              sourceType === 'mic'
                ? 'bg-neutral-800 text-amber-400 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Mic / AIMP Loopback</span>
          </button>
        </div>

        {/* Demo Track Select (if synth active) */}
        {sourceType === 'synth' && (
          <select
            value={currentTrack.id}
            onChange={(e) => audioEngine.selectTrack(e.target.value)}
            className="bg-neutral-950 text-neutral-300 text-xs px-2.5 py-1.5 rounded-lg border border-neutral-800 focus:outline-none focus:border-amber-500/50"
          >
            {DEMO_TRACKS.map(t => (
              <option key={t.id} value={t.id}>
                {t.title} ({t.bpm} BPM)
              </option>
            ))}
          </select>
        )}

        {/* Track Title Display (if file or mic) */}
        {sourceType !== 'synth' && (
          <div className="text-xs text-neutral-300 truncate max-w-[180px]">
            {currentTrack.title}
          </div>
        )}
      </div>

      {/* Center: Audio Sliders (Pre-amp sensitivity & Master Volume) */}
      <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
        {/* Pre-Amp Gain / Sensitivity */}
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <Sliders className="w-3.5 h-3.5 text-neutral-500" />
          <span className="whitespace-nowrap">Gain:</span>
          <input
            type="range"
            min="0.5"
            max="2.5"
            step="0.05"
            value={sensitivity}
            onChange={(e) => onSensitivityChange(parseFloat(e.target.value))}
            className="w-20 accent-amber-400 h-1 bg-neutral-800 rounded-lg cursor-pointer"
          />
          <span className="font-mono tabular-nums text-neutral-200 w-8">
            {sensitivity.toFixed(1)}x
          </span>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <button
            onClick={() => onVolumeChange(volume === 0 ? 0.8 : 0)}
            className="hover:text-neutral-200"
          >
            {volume === 0 ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-20 accent-amber-400 h-1 bg-neutral-800 rounded-lg cursor-pointer"
          />
          <span className="font-mono tabular-nums text-neutral-200 w-8">
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>

      {/* Right: Live Band Telemetry */}
      <div className="flex items-center gap-4 text-xs font-mono tabular-nums text-neutral-400 border-t md:border-t-0 md:border-l border-neutral-800 pt-2 md:pt-0 md:pl-4 w-full md:w-auto justify-between md:justify-end">
        <div className="flex items-center gap-1.5">
          <span className="text-neutral-500 text-[10px]">BASS</span>
          <span className="text-amber-400">{Math.round(metrics.bass * 100)}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-neutral-500 text-[10px]">MID</span>
          <span className="text-cyan-400">{Math.round(metrics.mid * 100)}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-neutral-500 text-[10px]">TREBLE</span>
          <span className="text-pink-400">{Math.round(metrics.treble * 100)}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-neutral-500 text-[10px]">PEAK</span>
          <span className="text-neutral-200">{Math.round(metrics.peak * 100)}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-neutral-500 text-[10px]">BPM</span>
          <span className="text-neutral-200">{metrics.instantBpm}</span>
        </div>
      </div>
    </div>
  );
};
