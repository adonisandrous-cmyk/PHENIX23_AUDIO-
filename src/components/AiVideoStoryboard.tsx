import React, { useState, useRef, useEffect, useCallback } from 'react';
import { audioEngine } from '../services/audioEngine';
import { VisualizerSettings, AudioMetrics } from '../types/visualizer';
import { 
  Clapperboard, 
  Sparkles, 
  Play, 
  Pause, 
  Video, 
  Download, 
  Film, 
  RefreshCw, 
  Clock, 
  Camera,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

interface StoryboardScene {
  id: string;
  timeStart: number;
  timeEnd: number;
  sceneTitle: string;
  visualDescription: string;
  cinematicPrompt: string;
  cameraMotion: string;
  accentColor: string;
  narrativeSubtitle: string;
  energyLevel: number;
}

interface StoryboardData {
  conceptTitle: string;
  musicalVibe: string;
  scenes: StoryboardScene[];
}

interface AiVideoStoryboardProps {
  settings: VisualizerSettings;
  metrics: AudioMetrics;
}

const STARTER_PROMPTS = [
  "A lone hovercraft pilot speeding through rain-slicked skyscrapers in Neo-Tokyo while neon holographic signs reflect on wet asphalt.",
  "An interstellar explorer passing through a shimmering crystalline event horizon as a dying star pulses in deep violet and amber.",
  "An ancient armored ronin standing on a stormy mountain peak at dawn with electrical lightning crackling across the horizon."
];

export const AiVideoStoryboard: React.FC<AiVideoStoryboardProps> = ({
  settings,
  metrics
}) => {
  const [storyPrompt, setStoryPrompt] = useState<string>(STARTER_PROMPTS[0]);
  const [selectedMood, setSelectedMood] = useState<string>('Cinematic & High Energy');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [storyboard, setStoryboard] = useState<StoryboardData | null>(null);
  const [activeSceneIdx, setActiveSceneIdx] = useState<number>(0);
  const [videoPlaybackActive, setVideoPlaybackActive] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordProgress, setRecordProgress] = useState<number>(0);

  const videoCanvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  const currentTrack = audioEngine.getCurrentTrack();

  const handleGenerateStoryboard = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyPrompt,
          mood: selectedMood,
          track: {
            title: currentTrack.title,
            artist: currentTrack.artist,
            genre: currentTrack.genre,
            bpm: currentTrack.bpm,
            duration: currentTrack.duration || 30
          },
          audioProfile: {
            bass: metrics.bass,
            mid: metrics.mid,
            treble: metrics.treble
          }
        })
      });

      const data = await res.json();
      if (data.storyboard && data.storyboard.scenes) {
        setStoryboard(data.storyboard);
        setActiveSceneIdx(0);
        setCurrentTime(0);
      }
    } catch (err) {
      console.error('Failed to generate AI storyboard:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Video Canvas procedural cinematography render loop
  useEffect(() => {
    const canvas = videoCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let startTime = performance.now();

    const renderVideoFrame = (now: number) => {
      const w = canvas.width;
      const h = canvas.height;

      if (!storyboard || storyboard.scenes.length === 0) {
        // Idle placeholder
        ctx.fillStyle = '#0a0a0c';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '13px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Enter a storyline prompt and click "Generate AI Storyboard" to begin', w / 2, h / 2);
        animationFrameRef.current = requestAnimationFrame(renderVideoFrame);
        return;
      }

      const totalDuration = storyboard.scenes[storyboard.scenes.length - 1].timeEnd || 30;
      
      // If playing or recording, advance timeline
      let elapsed = ((now - startTime) / 1000) % totalDuration;
      if (!videoPlaybackActive && !isRecording) {
        elapsed = currentTime;
      } else {
        setCurrentTime(elapsed);
      }

      // Determine active scene based on timestamp
      let currScene = storyboard.scenes[0];
      let sceneIdx = 0;
      for (let i = 0; i < storyboard.scenes.length; i++) {
        const s = storyboard.scenes[i];
        if (elapsed >= s.timeStart && elapsed <= s.timeEnd) {
          currScene = s;
          sceneIdx = i;
          break;
        }
      }
      setActiveSceneIdx(sceneIdx);

      const sceneSpan = Math.max(1, currScene.timeEnd - currScene.timeStart);
      const sceneProgress = Math.max(0, Math.min(1, (elapsed - currScene.timeStart) / sceneSpan));

      // 1. Clear background
      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, w, h);

      // 2. Camera motion transform (Ken Burns zoom / pan / bass shake)
      ctx.save();

      let zoom = 1.0;
      let panX = 0;
      let panY = 0;

      if (currScene.cameraMotion === 'slow-zoom-in') {
        zoom = 1.0 + sceneProgress * 0.22;
      } else if (currScene.cameraMotion === 'fast-dolly-pan') {
        panX = (sceneProgress - 0.5) * 80;
        zoom = 1.1;
      } else if (currScene.cameraMotion === 'bass-shake') {
        zoom = 1.15;
        if (metrics.isBeat || metrics.bass > 0.4) {
          panX = (Math.random() - 0.5) * 14 * metrics.bass;
          panY = (Math.random() - 0.5) * 14 * metrics.bass;
        }
      } else if (currScene.cameraMotion === 'orbital-spin') {
        zoom = 1.05 + Math.sin(sceneProgress * Math.PI) * 0.1;
        panX = Math.cos(sceneProgress * Math.PI * 2) * 30;
      }

      ctx.translate(w / 2 + panX, h / 2 + panY);
      ctx.scale(zoom, zoom);
      ctx.translate(-w / 2, -h / 2);

      // 3. Procedural Scene Visuals (Gradient horizon + light beams + particles)
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#09090f');
      grad.addColorStop(0.5, currScene.accentColor + '33'); // 20% alpha
      grad.addColorStop(1, '#020204');
      ctx.fillStyle = grad;
      ctx.fillRect(-50, -50, w + 100, h + 100);

      // Luminous architectural sun / core
      const sunY = h * 0.45;
      const sunGrad = ctx.createRadialGradient(w / 2, sunY, 10, w / 2, sunY, w * 0.35);
      sunGrad.addColorStop(0, currScene.accentColor);
      sunGrad.addColorStop(0.5, currScene.accentColor + '44');
      sunGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(w / 2, sunY, w * 0.35 * (1 + metrics.bass * 0.3), 0, Math.PI * 2);
      ctx.fill();

      // Atmospheric fog & light beams reacting to mid harmonics
      const numRays = 8;
      for (let r = 0; r < numRays; r++) {
        const rayAngle = (r / numRays) * Math.PI - Math.PI / 2 + (sceneProgress * 0.4);
        ctx.strokeStyle = currScene.accentColor;
        ctx.lineWidth = 2 + metrics.treble * 8;
        ctx.globalAlpha = 0.15 + metrics.mid * 0.35;
        ctx.beginPath();
        ctx.moveTo(w / 2, sunY);
        ctx.lineTo(w / 2 + Math.cos(rayAngle) * w, sunY + Math.sin(rayAngle) * h);
        ctx.stroke();
      }

      // Foreground horizon silhouette
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = '#060608';
      ctx.beginPath();
      ctx.moveTo(-50, h);
      ctx.lineTo(-50, h * 0.72);
      // Skyline silhouettes
      for (let bx = 0; bx <= w + 100; bx += 40) {
        const bh = 40 + Math.sin(bx * 0.05 + sceneIdx) * 35;
        ctx.lineTo(bx, h * 0.72 - bh);
        ctx.lineTo(bx + 35, h * 0.72 - bh);
      }
      ctx.lineTo(w + 50, h);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // 4. Cinematic Scrim and Subtitles
      const textScrim = ctx.createLinearGradient(0, h * 0.65, 0, h);
      textScrim.addColorStop(0, 'transparent');
      textScrim.addColorStop(1, 'rgba(0,0,0,0.85)');
      ctx.fillStyle = textScrim;
      ctx.fillRect(0, h * 0.65, w, h * 0.35);

      // Title & Narrative Subtitle Overlay
      ctx.textAlign = 'center';
      ctx.fillStyle = currScene.accentColor;
      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.fillText(`SCENE ${sceneIdx + 1} / ${storyboard.scenes.length} · ${currScene.sceneTitle.toUpperCase()}`, w / 2, h - 55);

      ctx.fillStyle = '#ffffff';
      ctx.font = '500 14px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(currScene.narrativeSubtitle, w / 2, h - 32);

      // Timecode
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${elapsed.toFixed(1)}s / ${totalDuration.toFixed(1)}s`, w - 20, 25);

      animationFrameRef.current = requestAnimationFrame(renderVideoFrame);
    };

    animationFrameRef.current = requestAnimationFrame(renderVideoFrame);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [storyboard, videoPlaybackActive, currentTime, metrics, isRecording]);

  // Video recording handler
  const handleRecordVideo = useCallback(() => {
    const canvas = videoCanvasRef.current;
    if (!canvas || !storyboard) return;

    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
      recordedChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `aimp-ai-music-video-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setVideoPlaybackActive(true);
      audioEngine.play();

      const totalDur = storyboard.scenes[storyboard.scenes.length - 1].timeEnd || 30;
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
          setIsRecording(false);
          setVideoPlaybackActive(false);
        }
      }, totalDur * 1000);
    } catch (err) {
      console.error('Failed to record video:', err);
      setIsRecording(false);
    }
  }, [isRecording, storyboard]);

  return (
    <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 space-y-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-400 text-neutral-950 shadow-md shadow-amber-400/20">
            <Clapperboard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
              <span>AI Music Video Storyboard & Cinematics</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Describe your storyline and mood to generate a beat-synchronized cinematic video matching the music
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Track: {currentTrack.bpm} BPM · {currentTrack.genre}</span>
        </div>
      </div>

      {/* Storyline Prompt Form */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-neutral-300">
            Storyline Concept & Narrative Vibe:
          </label>
          <span className="text-xs text-neutral-500">
            Powered by Gemini AI Engine
          </span>
        </div>

        <textarea
          value={storyPrompt}
          onChange={(e) => setStoryPrompt(e.target.value)}
          rows={3}
          placeholder="Describe your storyline, characters, environment, lighting, and action beats..."
          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs text-neutral-200 focus:outline-none focus:border-amber-500/60 leading-relaxed"
        />

        {/* Quick Starters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-neutral-500 text-[11px]">Quick Themes:</span>
          {STARTER_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => setStoryPrompt(p)}
              className="text-[11px] px-2.5 py-1 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-neutral-200 rounded-md truncate max-w-[220px] transition-colors"
            >
              Theme {idx + 1}: {p.slice(0, 24)}...
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
          {/* Mood Selector */}
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span className="shrink-0 font-medium">Musical Vibe:</span>
            <select
              value={selectedMood}
              onChange={(e) => setSelectedMood(e.target.value)}
              className="bg-neutral-950 text-neutral-200 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-500/50"
            >
              <option value="Cinematic & High Energy">Cinematic & High Energy</option>
              <option value="Cyberpunk & Neon Dystopia">Cyberpunk & Neon Dystopia</option>
              <option value="Hypnotic & Ethereal Space">Hypnotic & Ethereal Space</option>
              <option value="Dark Synth & Industrial Drive">Dark Synth & Industrial Drive</option>
              <option value="Nostalgic Lo-Fi Twilight">Nostalgic Lo-Fi Twilight</option>
            </select>
          </div>

          <button
            onClick={handleGenerateStoryboard}
            disabled={isGenerating || !storyPrompt.trim()}
            className="px-5 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-400/10"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Directing Scenes with AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Beat-Synced Video</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Video Canvas Viewport */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-neutral-200 uppercase tracking-wider">
              {storyboard ? storyboard.conceptTitle : 'Live Cinematics Preview'}
            </span>
          </div>

          {storyboard && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setVideoPlaybackActive(!videoPlaybackActive)}
                className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded flex items-center gap-1.5 transition-colors"
              >
                {videoPlaybackActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                <span>{videoPlaybackActive ? 'Pause Video' : 'Play Synced'}</span>
              </button>

              <button
                onClick={handleRecordVideo}
                className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors font-medium ${
                  isRecording 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                }`}
              >
                <Video className="w-3 h-3" />
                <span>{isRecording ? 'Recording (Click to Finish)' : 'Record Video'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Canvas Display */}
        <div className="relative w-full aspect-video max-h-[380px] bg-neutral-950 rounded-xl overflow-hidden border border-neutral-800 shadow-2xl flex items-center justify-center">
          <canvas
            ref={videoCanvasRef}
            width={854}
            height={480}
            className="w-full h-full object-contain block"
          />
        </div>
      </div>

      {/* Storyboard Timeline Cue Cards */}
      {storyboard && (
        <div className="space-y-3 pt-2 border-t border-neutral-800">
          <h4 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Timeline Cue Sequence ({storyboard.scenes.length} Scenes)</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {storyboard.scenes.map((scene, idx) => {
              const isActive = activeSceneIdx === idx;
              return (
                <div
                  key={scene.id || idx}
                  onClick={() => setCurrentTime(scene.timeStart)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isActive
                      ? 'bg-neutral-800/90 border-amber-500/80 ring-1 ring-amber-500/30 text-neutral-100 shadow-lg'
                      : 'bg-neutral-950/60 border-neutral-800/80 hover:bg-neutral-900 text-neutral-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5 font-mono text-[11px]">
                    <span className="text-amber-400 font-semibold">SCENE {idx + 1}</span>
                    <span className="text-neutral-500">{scene.timeStart}s - {scene.timeEnd}s</span>
                  </div>

                  <h5 className="font-semibold text-neutral-200 text-xs mb-1 line-clamp-1">
                    {scene.sceneTitle}
                  </h5>

                  <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed mb-2">
                    {scene.visualDescription}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-1 border-t border-neutral-800/60">
                    <span className="capitalize">{scene.cameraMotion.replace('-', ' ')}</span>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: scene.accentColor }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
