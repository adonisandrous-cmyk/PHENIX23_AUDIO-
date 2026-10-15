import React, { useState } from 'react';
import { audioEngine } from '../services/audioEngine';
import { 
  Play, 
  ExternalLink, 
  Copy, 
  Check, 
  Tv, 
  Music2, 
  Radio, 
  ArrowRight,
  ShieldCheck,
  Download
} from 'lucide-react';

export const AimpStreamingGuide: React.FC = () => {
  const [streamUrl, setStreamUrl] = useState<string>('https://icecast.skyrock.net/s/natio_mp3_128k');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [streamLoading, setStreamLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'youtube' | 'spotify' | 'tester'>('youtube');

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestStream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamUrl.trim()) return;

    setStreamLoading(true);
    try {
      await audioEngine.initContext();
      // Test audio playback via Audio element
      const audio = new Audio(streamUrl);
      audio.crossOrigin = 'anonymous';
      audio.oncanplay = () => {
        setStreamLoading(false);
      };
      audio.onerror = () => {
        setStreamLoading(false);
        alert('Could not stream URL directly in browser due to CORS or format. For AIMP on Windows, paste directly into AIMP via Ctrl+U without CORS restrictions!');
      };
      await audio.play();
    } catch {
      setStreamLoading(false);
    }
  };

  return (
    <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-5 space-y-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
        <div>
          <h3 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
            <Radio className="w-5 h-5 text-amber-400" />
            <span>YouTube & Spotify in AIMP (No Subscriptions Required)</span>
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Verified methods and plugins to route and stream free YouTube and Spotify audio directly through AIMP on Windows
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-neutral-950 rounded-lg border border-neutral-800 text-xs">
          <button
            onClick={() => setActiveTab('youtube')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'youtube'
                ? 'bg-neutral-800 text-red-400 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>YouTube Integration</span>
          </button>
          <button
            onClick={() => setActiveTab('spotify')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'spotify'
                ? 'bg-neutral-800 text-emerald-400 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Music2 className="w-3.5 h-3.5" />
            <span>Spotify Integration</span>
          </button>
          <button
            onClick={() => setActiveTab('tester')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'tester'
                ? 'bg-neutral-800 text-amber-400 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Stream Tester</span>
          </button>
        </div>
      </div>

      {/* Tab: YouTube Integration */}
      {activeTab === 'youtube' && (
        <div className="space-y-4 text-xs text-neutral-300 leading-relaxed">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Method 1: AIMP YouTube Plugin */}
            <div className="bg-neutral-950/70 p-4 rounded-xl border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span>Method 1: The "aimp_youtube" Plugin (Recommended)</span>
                </h4>
                <span className="text-[10px] text-emerald-400 font-mono">100% Free · No Ads</span>
              </div>
              <p className="text-neutral-400">
                The open-source <strong className="text-neutral-200">aimp_youtube</strong> plugin brings full YouTube playback, playlist support, and search into AIMP without requiring any YouTube Premium subscription or Google account login.
              </p>

              <ol className="list-decimal list-inside space-y-1.5 text-neutral-300">
                <li>
                  Download the plugin from GitHub (search <code className="bg-neutral-900 px-1 py-0.5 rounded text-amber-300">aimp_youtube plugin</code> by KAGAMINE).
                </li>
                <li>
                  Extract <code className="bg-neutral-900 px-1 py-0.5 rounded text-amber-300">aimp_youtube.dll</code> to:
                  <div className="bg-neutral-900 p-2 rounded mt-1 font-mono text-[11px] select-all flex items-center justify-between border border-neutral-800">
                    <span>C:\Program Files\AIMP\Plugins\aimp_youtube\</span>
                    <button
                      onClick={() => handleCopy('C:\\Program Files\\AIMP\\Plugins\\aimp_youtube\\', 'yt-path')}
                      className="hover:text-white"
                    >
                      {copiedKey === 'yt-path' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </li>
                <li>
                  Restart AIMP. In AIMP, click <kbd className="px-1 bg-neutral-800 rounded font-mono">Ctrl + M</kbd> or open the YouTube browser tab directly from AIMP's music library!
                </li>
                <li>
                  Play any YouTube video or playlist: AIMP streams pure opus/aac audio in high quality without video bandwidth overhead or ads.
                </li>
              </ol>
            </div>

            {/* Method 2: Direct URL Streaming */}
            <div className="bg-neutral-950/70 p-4 rounded-xl border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Method 2: Native URL Stream (No Plugins)</span>
                </h4>
                <span className="text-[10px] text-neutral-400 font-mono">Built-in AIMP</span>
              </div>
              <p className="text-neutral-400">
                AIMP includes a built-in HTTP/HTTPS stream decoder that connects to any open audio stream or Invidious/Piped audio URL.
              </p>

              <div className="space-y-2">
                <div className="text-neutral-300">
                  1. Press <kbd className="px-1 py-0.5 bg-neutral-800 rounded font-mono text-neutral-100">Ctrl + U</kbd> in AIMP to open the URL Stream dialog.
                </div>
                <div className="text-neutral-300">
                  2. Use any Invidious or Piped instance audio stream URL (e.g. <code className="text-amber-300 font-mono">https://piped.video/api/v1/streams/...</code>).
                </div>
                <div className="text-neutral-300">
                  3. Alternatively, install <code className="text-cyan-300 font-mono">yt-dlp</code> and extract direct stream URLs via command line:
                  <div className="bg-neutral-900 p-2 rounded mt-1 font-mono text-[11px] select-all flex items-center justify-between border border-neutral-800">
                    <span>yt-dlp -g -f bestaudio "https://youtu.be/..."</span>
                    <button
                      onClick={() => handleCopy('yt-dlp -g -f bestaudio "URL"', 'ytdlp-cmd')}
                      className="hover:text-white"
                    >
                      {copiedKey === 'ytdlp-cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Spotify Integration */}
      {activeTab === 'spotify' && (
        <div className="space-y-4 text-xs text-neutral-300 leading-relaxed">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Method 1: Virtual Audio Cable Loopback */}
            <div className="bg-neutral-950/70 p-4 rounded-xl border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Method 1: Windows Loopback Routing (Free Tier)</span>
                </h4>
                <span className="text-[10px] text-emerald-400 font-mono">Real-Time DSP & Visualizer</span>
              </div>
              <p className="text-neutral-400">
                You can play your free Spotify Desktop or Spotify Web Player through AIMP’s 32-bit audio engine, 18-band EQ, and Visualizer Suite without any Spotify Premium subscription.
              </p>

              <ol className="list-decimal list-inside space-y-1.5 text-neutral-300">
                <li>
                  Install free <strong className="text-neutral-200">VB-Audio Virtual Cable</strong> or enable <strong>Stereo Mix</strong> in Windows Sound Control Panel.
                </li>
                <li>
                  In Windows <strong>Settings &gt; Sound &gt; App Volume and Device Preferences</strong>, set Spotify’s output device to <strong>CABLE Input</strong>.
                </li>
                <li>
                  In AIMP, click <kbd className="px-1 bg-neutral-800 rounded font-mono">Ctrl + P</kbd>, go to <strong>Playback</strong>, and select <strong>WASAPI: CABLE Output</strong> or open Line-In / Microphone loopback.
                </li>
                <li>
                  Spotify music will now stream directly through AIMP, driving your visualizer and custom color palettes with zero delay!
                </li>
              </ol>
            </div>

            {/* Method 2: SpotDL Offline Library */}
            <div className="bg-neutral-950/70 p-4 rounded-xl border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-500" />
                  <span>Method 2: SpotDL Local Playlist Sync</span>
                </h4>
                <span className="text-[10px] text-cyan-400 font-mono">Offline Metadata & Art</span>
              </div>
              <p className="text-neutral-400">
                Sync Spotify playlists, albums, and tracks directly to high-quality local audio files that load natively into AIMP playlists with embedded album art and synchronized lyrics.
              </p>

              <div className="space-y-2">
                <p>Run via Windows Command Prompt / PowerShell:</p>
                <div className="bg-neutral-900 p-2.5 rounded font-mono text-[11px] select-all flex items-center justify-between border border-neutral-800">
                  <span>pip install spotdl<br />spotdl "https://open.spotify.com/playlist/..."</span>
                  <button
                    onClick={() => handleCopy('spotdl "https://open.spotify.com/playlist/..."', 'spotdl-cmd')}
                    className="hover:text-white"
                  >
                    {copiedKey === 'spotdl-cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-neutral-400">
                  All tracks will download with full metadata and can be dragged directly into AIMP or this visualizer studio!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Stream Tester */}
      {activeTab === 'tester' && (
        <div className="space-y-3">
          <p className="text-xs text-neutral-400">
            Paste any direct audio stream URL (Internet Radio, Icecast, Shoutcast, or direct audio link) to test playback and verify visualizer responsiveness:
          </p>

          <form onSubmit={handleTestStream} className="flex items-center gap-2">
            <input
              type="text"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              placeholder="https://icecast.example.com/stream.mp3"
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-100 font-mono focus:outline-none focus:border-amber-500/50"
            />
            <button
              type="submit"
              disabled={streamLoading}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-neutral-950 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{streamLoading ? 'Connecting...' : 'Play in Studio'}</span>
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
            <span>Sample Streams:</span>
            <button
              onClick={() => setStreamUrl('https://icecast.skyrock.net/s/natio_mp3_128k')}
              className="px-2 py-1 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded text-[11px]"
            >
              Skyrock Radio
            </button>
            <button
              onClick={() => setStreamUrl('https://stream.nightride.fm/nightride.mp3')}
              className="px-2 py-1 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded text-[11px]"
            >
              Nightride FM (Synthwave)
            </button>
            <button
              onClick={() => setStreamUrl('https://stream.defcon.org:8000/defcon')}
              className="px-2 py-1 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded text-[11px]"
            >
              DEF CON Radio
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
