export type PluginLanguage = 'cpp-aimp' | 'cpp-winamp' | 'delphi-aimp' | 'cmake' | 'ini-config';

export interface PluginExportOptions {
  pluginName: string;
  author: string;
  description: string;
  includePalette: boolean;
  targetBitness: 'x64' | 'x86' | 'both';
  fftSize: number;
  glowEnabled: boolean;
  smoothingConstant: number;
}
