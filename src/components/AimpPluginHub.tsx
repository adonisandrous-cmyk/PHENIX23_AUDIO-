import React, { useState } from 'react';
import { VisualizerSettings } from '../types/visualizer';
import { PRESET_PALETTES } from '../services/paletteService';
import { 
  generateAimpCppSource, 
  generateWinampVisSource, 
  generateDelphiSource, 
  generateCMakeLists, 
  generateAimpIniConfig,
  generateBuildBatchScript
} from '../services/pluginCodeGenerator';
import { 
  Copy, 
  Check, 
  Download, 
  FileCode2, 
  Terminal, 
  FolderCheck, 
  HelpCircle,
  ExternalLink,
  PlaySquare
} from 'lucide-react';

interface AimpPluginHubProps {
  settings: VisualizerSettings;
}

type TabKey = 'bat' | 'cpp' | 'winamp' | 'delphi' | 'cmake' | 'ini' | 'guide';

export const AimpPluginHub: React.FC<AimpPluginHubProps> = ({ settings }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('bat');
  const [copied, setCopied] = useState<boolean>(false);

  const activePalette = PRESET_PALETTES.find(p => p.id === settings.paletteId)?.name || 'Custom Palette';

  const batchCode = generateBuildBatchScript();
  const cppCode = generateAimpCppSource(settings, activePalette);
  const winampCode = generateWinampVisSource(settings, activePalette);
  const delphiCode = generateDelphiSource(settings, activePalette);
  const cmakeCode = generateCMakeLists();
  const iniCode = generateAimpIniConfig(settings, activePalette);

  const getCurrentContent = (): { code: string; filename: string; mime: string } => {
    switch (activeTab) {
      case 'bat':
        return { code: batchCode, filename: 'build_aimp_plugin.bat', mime: 'application/x-bat' };
      case 'cpp':
        return { code: cppCode, filename: 'aimp_vis_studio.cpp', mime: 'text/x-c++src' };
      case 'winamp':
        return { code: winampCode, filename: 'vis_aimp_studio.c', mime: 'text/x-csrc' };
      case 'delphi':
        return { code: delphiCode, filename: 'aimp_vis_studio.dpr', mime: 'text/plain' };
      case 'cmake':
        return { code: cmakeCode, filename: 'CMakeLists.txt', mime: 'text/plain' };
      case 'ini':
        return { code: iniCode, filename: 'aimp_vis_studio.ini', mime: 'text/plain' };
      default:
        return { code: batchCode, filename: 'build_aimp_plugin.bat', mime: 'application/x-bat' };
    }
  };

  const handleCopy = () => {
    const { code } = getCurrentContent();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const { code, filename, mime } = getCurrentContent();
    const blob = new Blob([code], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    const files = [
      { name: 'build_aimp_plugin.bat', content: batchCode },
      { name: 'aimp_vis_studio.cpp', content: cppCode },
      { name: 'CMakeLists.txt', content: cmakeCode },
      { name: 'vis_aimp_studio.c', content: winampCode },
      { name: 'aimp_vis_studio.dpr', content: delphiCode },
      { name: 'aimp_vis_studio.ini', content: iniCode },
      { 
        name: 'README_INSTALL_AIMP.txt', 
        content: `AIMP Music Player Visualizer Plugin
Custom Palette: ${activePalette}
Visualizer Mode: ${settings.mode}

AUTOMATED 1-CLICK BUILD INSTRUCTIONS:
1. Put all downloaded files into an empty folder on Windows (e.g. C:\\AimpVis\\)
2. Double-click "build_aimp_plugin.bat"
3. The script will automatically:
   - Detect your CMake installation
   - Configure Visual Studio x64 build
   - Compile aimp_vis_studio.dll in Release mode
   - Offer to install aimp_vis_studio.dll directly into C:\\Program Files\\AIMP\\Plugins\\

HOW TO ACTIVATE IN AIMP:
1. Open AIMP on Windows
2. Press Ctrl + P to open Preferences
3. Go to "Plugins" -> "Visualizations"
4. Enable the plugin checkbox
5. Start music and open the Visualizer window!
` 
      }
    ];

    files.forEach((f, idx) => {
      setTimeout(() => {
        const blob = new Blob([f.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = f.name;
        a.click();
        URL.revokeObjectURL(url);
      }, idx * 150);
    });
  };

  return (
    <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl overflow-hidden shadow-xl">
      {/* Header Bar */}
      <div className="p-4 border-b border-neutral-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-amber-400" />
            <span>AIMP Windows Plugin Generator & CMake Build Hub</span>
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            1-Click Automated Batch Script, CMake configuration, and production C++/Delphi SDK code
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 text-xs text-neutral-200 bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="px-3 py-1.5 text-xs text-neutral-200 bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download {activeTab === 'bat' ? '.bat' : 'File'}</span>
          </button>

          <button
            onClick={handleDownloadAll}
            className="px-3.5 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
          >
            <FolderCheck className="w-3.5 h-3.5" />
            <span>Download Complete Package</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 pt-3 border-b border-neutral-800/80 bg-neutral-950/60 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => setActiveTab('bat')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'bat'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <PlaySquare className="w-3.5 h-3.5 text-amber-400" />
          <span>Build Script (build_aimp_plugin.bat)</span>
        </button>

        <button
          onClick={() => setActiveTab('cpp')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'cpp'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          AIMP Native C++ (.cpp)
        </button>

        <button
          onClick={() => setActiveTab('cmake')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'cmake'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          CMakeLists.txt
        </button>

        <button
          onClick={() => setActiveTab('winamp')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'winamp'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Winamp Vis Module (.c)
        </button>

        <button
          onClick={() => setActiveTab('delphi')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'delphi'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Delphi Pascal (.dpr)
        </button>

        <button
          onClick={() => setActiveTab('ini')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'ini'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Preset Config (.ini)
        </button>

        <button
          onClick={() => setActiveTab('guide')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'guide'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>AIMP Setup Guide</span>
        </button>
      </div>

      {/* Tab Body */}
      {activeTab === 'guide' ? (
        <div className="p-6 space-y-6 text-xs text-neutral-300 max-h-[460px] overflow-y-auto leading-relaxed">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Native DLL Installation */}
            <div className="bg-neutral-950/70 p-4 rounded-xl border border-neutral-800 space-y-3">
              <h4 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-400" />
                <span>Option 1: Compile Native AIMP DLL</span>
              </h4>
              <p className="text-neutral-400">
                AIMP supports native plugins written against the AIMP Visual Plugin SDK or Winamp Visualizer standard.
              </p>
              
              <ol className="list-decimal list-inside space-y-2 text-neutral-300">
                <li>
                  Download <span className="font-mono text-amber-300">build_aimp_plugin.bat</span>, <span className="font-mono text-amber-300">aimp_vis_studio.cpp</span>, and <span className="font-mono text-amber-300">CMakeLists.txt</span> into any folder.
                </li>
                <li>
                  Double click <span className="font-mono text-amber-300">build_aimp_plugin.bat</span> to automatically configure CMake, invoke MSVC, and build the 64-bit DLL.
                </li>
                <li>
                  The script will automatically detect your AIMP installation and install the DLL to:
                  <div className="bg-neutral-900 p-2 rounded mt-1 font-mono text-[11px] text-neutral-200 select-all border border-neutral-800">
                    C:\Program Files\AIMP\Plugins\aimp_vis_studio\aimp_vis_studio.dll
                  </div>
                </li>
                <li>
                  Launch AIMP, press <kbd className="px-1 py-0.5 bg-neutral-800 rounded font-mono text-neutral-200">Ctrl + P</kbd>, navigate to <strong>Plugins &gt; Visualizations</strong>, and check the box next to your new plugin.
                </li>
              </ol>
            </div>

            {/* Zero-Compilation Desktop Companion Mode */}
            <div className="bg-neutral-950/70 p-4 rounded-xl border border-neutral-800 space-y-3">
              <h4 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-cyan-400" />
                <span>Option 2: Instant Desktop Companion & PiP Mode</span>
              </h4>
              <p className="text-neutral-400">
                Want to enjoy these visualizers immediately alongside AIMP without compiling C++? You can stream audio from Windows directly:
              </p>
              
              <ol className="list-decimal list-inside space-y-2 text-neutral-300">
                <li>
                  Enable <strong>Stereo Mix</strong> in Windows Sound Settings (or install free <span className="text-cyan-300 font-medium">VB-Audio Virtual Cable</span>).
                </li>
                <li>
                  In AIMP Preferences (<kbd className="px-1 py-0.5 bg-neutral-800 rounded font-mono text-neutral-200">Ctrl + P</kbd>), set Sound Output to your normal speakers or virtual cable.
                </li>
                <li>
                  Click <strong>Mic / AIMP Loopback</strong> in this studio's top bar and allow microphone/line access.
                </li>
                <li>
                  Click the <strong>Picture-in-Picture</strong> button on the canvas to float the visualizer permanently on top of AIMP while you work, or press <kbd className="px-1 py-0.5 bg-neutral-800 rounded font-mono text-neutral-200">F</kbd> for Fullscreen on a second monitor.
                </li>
              </ol>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative">
          {activeTab === 'bat' && (
            <div className="p-3 bg-amber-500/10 border-b border-neutral-800 text-xs text-amber-300 flex items-center justify-between">
              <span>This batch script automatically detects CMake & Visual Studio, compiles the DLL, and installs it into AIMP!</span>
              <button
                onClick={handleDownload}
                className="px-2.5 py-1 bg-amber-400 text-neutral-950 rounded font-semibold text-[11px] hover:bg-amber-300 transition-colors"
              >
                Download .BAT File
              </button>
            </div>
          )}
          <pre className="p-4 bg-neutral-950 text-neutral-200 font-mono text-xs leading-relaxed max-h-[460px] overflow-y-auto selection:bg-amber-500/30">
            <code>{getCurrentContent().code}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
