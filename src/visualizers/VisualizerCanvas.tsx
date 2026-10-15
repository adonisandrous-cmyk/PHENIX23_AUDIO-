import React, { useEffect, useRef, useState, useCallback } from 'react';
import { VisualizerSettings, AudioMetrics } from '../types/visualizer';
import { audioEngine } from '../services/audioEngine';
import { generateColorLut } from '../services/paletteService';
import { renderClassicSpectrum } from './renderers/classicSpectrum';
import { renderRadialNebula } from './renderers/radialNebula';
import { renderHorizon3D } from './renderers/horizon3D';
import { renderLissajousPhase } from './renderers/lissajousPhase';
import { renderLiquidPlasma } from './renderers/liquidPlasma';
import { renderWarpTunnel } from './renderers/warpTunnel';
import { renderDynamicBackground } from './renderers/backgroundRenderer';
import { generateAutoPaletteFromAudio } from '../services/autoPaletteService';
import { Maximize2, Minimize2, Camera, PictureInPicture2 } from 'lucide-react';

interface VisualizerCanvasProps {
  settings: VisualizerSettings;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onMetricsUpdate?: (metrics: AudioMetrics) => void;
  onAutoPaletteStops?: (stops: any[]) => void;
}

export const VisualizerCanvas: React.FC<VisualizerCanvasProps> = ({
  settings,
  isFullscreen,
  onToggleFullscreen,
  onMetricsUpdate,
  onAutoPaletteStops
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoPipRef = useRef<HTMLVideoElement>(null);
  
  const [fps, setFps] = useState<number>(60);
  const [isPipActive, setIsPipActive] = useState<boolean>(false);
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  const lutRef = useRef<string[]>([]);
  const lastTimeRef = useRef<number>(performance.now());
  const frameCountRef = useRef<number>(0);
  const fpsTimerRef = useRef<number>(performance.now());
  const animationFrameIdRef = useRef<number | null>(null);
  const autoPaletteThrottleRef = useRef<number>(0);

  // Update LUT when stops change
  useEffect(() => {
    lutRef.current = generateColorLut(settings.customStops, 256);
  }, [settings.customStops]);

  // Snapshot functionality
  const handleTakeSnapshot = useCallback(() => {
    if (!canvasRef.current) return;
    try {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `aimp-visualizer-${settings.mode}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      setCopiedToast('Snapshot saved as PNG');
      setTimeout(() => setCopiedToast(null), 2500);
    } catch (err) {
      console.error('Snapshot failed', err);
    }
  }, [settings.mode]);

  // Picture in Picture functionality
  const handleTogglePip = useCallback(async () => {
    if (!canvasRef.current || !videoPipRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPipActive(false);
      } else {
        const stream = canvasRef.current.captureStream(60);
        videoPipRef.current.srcObject = stream;
        await videoPipRef.current.play();
        await videoPipRef.current.requestPictureInPicture();
        setIsPipActive(true);
      }
    } catch (err) {
      console.error('Picture-in-picture error:', err);
    }
  }, []);

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const renderFrame = (now: number) => {
      const deltaTime = Math.min(0.1, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      // FPS tracking
      frameCountRef.current++;
      if (now - fpsTimerRef.current >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / (now - fpsTimerRef.current)));
        frameCountRef.current = 0;
        fpsTimerRef.current = now;
      }

      const width = canvas.width;
      const height = canvas.height;

      // Audio analysis data
      const data = audioEngine.getVisualizerData();
      if (onMetricsUpdate) {
        onMetricsUpdate(data.metrics);
      }

      // Real-time audio-reactive palette generation (throttled to ~20fps for silky smooth interpolation)
      if (settings.autoPaletteEnabled && settings.autoPaletteSource === 'audio') {
        if (now - autoPaletteThrottleRef.current > 45) {
          autoPaletteThrottleRef.current = now;
          const dynamicStops = generateAutoPaletteFromAudio(
            data.freqData,
            data.metrics,
            settings.autoPaletteMood || 'neon'
          );
          lutRef.current = generateColorLut(dynamicStops, 256);
          if (onAutoPaletteStops) {
            onAutoPaletteStops(dynamicStops);
          }
        }
      }

      // Motion persistence / phosphor trail decay
      if (settings.decayRate > 0) {
        ctx.fillStyle = `rgba(10, 10, 12, ${Math.max(0.05, 1 - settings.decayRate)})`;
        ctx.fillRect(0, 0, width, height);
      } else {
        ctx.fillStyle = '#0a0a0c';
        ctx.fillRect(0, 0, width, height);
      }

      const colorLut = lutRef.current.length > 0 ? lutRef.current : ['#f59e0b'];

      // Render Dynamic Reactive Background
      renderDynamicBackground(
        ctx,
        width,
        height,
        data.freqData,
        data.metrics,
        settings,
        colorLut,
        deltaTime
      );

      // Route to active visualizer renderer
      switch (settings.mode) {
        case 'classic-spectrum':
          renderClassicSpectrum(
            ctx,
            width,
            height,
            data.freqData,
            data.leftFreqData,
            data.rightFreqData,
            data.metrics,
            settings,
            colorLut,
            now,
            deltaTime
          );
          break;
        case 'radial-nebula':
          renderRadialNebula(
            ctx,
            width,
            height,
            data.freqData,
            data.metrics,
            settings,
            colorLut,
            deltaTime
          );
          break;
        case 'horizon-3d':
          renderHorizon3D(
            ctx,
            width,
            height,
            data.freqData,
            data.metrics,
            settings,
            colorLut,
            deltaTime
          );
          break;
        case 'lissajous-phase':
          renderLissajousPhase(
            ctx,
            width,
            height,
            data.leftTimeData,
            data.rightTimeData,
            data.metrics,
            settings,
            colorLut
          );
          break;
        case 'liquid-plasma':
          renderLiquidPlasma(
            ctx,
            width,
            height,
            data.freqData,
            data.metrics,
            settings,
            colorLut,
            deltaTime
          );
          break;
        case 'warp-tunnel':
          renderWarpTunnel(
            ctx,
            width,
            height,
            data.freqData,
            data.metrics,
            settings,
            colorLut,
            deltaTime
          );
          break;
      }

      animationFrameIdRef.current = requestAnimationFrame(renderFrame);
    };

    animationFrameIdRef.current = requestAnimationFrame(renderFrame);

    return () => {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [settings, onMetricsUpdate, onAutoPaletteStops]);

  // Handle Resize & Canvas Pixel Density
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      
      const targetW = Math.max(320, Math.floor(rect.width));
      const targetH = Math.max(240, Math.floor(rect.height));

      canvasRef.current.width = targetW * dpr;
      canvasRef.current.height = targetH * dpr;
      canvasRef.current.style.width = `${targetW}px`;
      canvasRef.current.style.height = `${targetH}px`;

      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    window.addEventListener('resize', handleResize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [isFullscreen]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-neutral-950 overflow-hidden select-none flex items-center justify-center ${
        isFullscreen ? 'fixed inset-0 z-50' : 'rounded-xl border border-neutral-800/80 shadow-2xl'
      }`}
    >
      <canvas ref={canvasRef} className="block w-full h-full cursor-pointer" />
      
      {/* Hidden video element for Picture-in-Picture canvas streaming */}
      <video ref={videoPipRef} className="hidden" muted playsInline />

      {/* Floating HUD Controls */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-neutral-900/80 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-neutral-700/60 shadow-lg text-xs text-neutral-300">
        <span className="font-mono tabular-nums text-neutral-400 mr-2">
          {fps} FPS
        </span>
        
        <button
          onClick={handleTakeSnapshot}
          title="Take PNG Screenshot"
          className="p-1 hover:text-white hover:bg-neutral-800 rounded transition-colors"
        >
          <Camera className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleTogglePip}
          title="Picture in Picture (Float over AIMP)"
          className={`p-1 hover:text-white hover:bg-neutral-800 rounded transition-colors ${
            isPipActive ? 'text-amber-400' : ''
          }`}
        >
          <PictureInPicture2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen Theater (F)'}
          className="p-1 hover:text-white hover:bg-neutral-800 rounded transition-colors"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Toast Notification */}
      {copiedToast && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-neutral-900/95 border border-neutral-700 text-neutral-100 text-xs px-3.5 py-2 rounded-md shadow-xl animate-fade-in pointer-events-none">
          {copiedToast}
        </div>
      )}
    </div>
  );
};
