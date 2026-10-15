import { AudioMetrics, AudioTrackInfo } from '../types/visualizer';

export type AudioSourceType = 'synth' | 'file' | 'mic';

export const DEMO_TRACKS: AudioTrackInfo[] = [
  {
    id: 'synthwave',
    title: 'Neon Drift 1984',
    artist: 'AIMP Studio Synth',
    genre: 'Synthwave / Outrun',
    duration: 180,
    bpm: 118,
    isSynthetic: true
  },
  {
    id: 'cyberpunk',
    title: 'Neuro Core Overdrive',
    artist: 'AIMP Studio Synth',
    genre: 'Cyberpunk / Midtempo',
    duration: 180,
    bpm: 132,
    isSynthetic: true
  },
  {
    id: 'ambient',
    title: 'Deep Void Radiance',
    artist: 'AIMP Studio Synth',
    genre: 'Dark Ambient / Space',
    duration: 240,
    bpm: 78,
    isSynthetic: true
  },
  {
    id: 'dnb',
    title: 'Velocity Vector 174',
    artist: 'AIMP Studio Synth',
    genre: 'Drum & Bass',
    duration: 180,
    bpm: 174,
    isSynthetic: true
  }
];

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private preAmpGain: GainNode | null = null;
  
  // Analysers
  private masterAnalyser: AnalyserNode | null = null;
  private leftAnalyser: AnalyserNode | null = null;
  private rightAnalyser: AnalyserNode | null = null;
  private splitter: ChannelSplitterNode | null = null;

  // Source state
  private sourceType: AudioSourceType = 'synth';
  private isPlaying = false;
  private micStream: MediaStream | null = null;
  private micSourceNode: MediaStreamAudioSourceNode | null = null;
  
  // File state
  private audioElement: HTMLAudioElement | null = null;
  private fileSourceNode: MediaElementAudioSourceNode | null = null;
  private currentTrack: AudioTrackInfo = DEMO_TRACKS[0];

  // Synth state
  private synthInterval: number | null = null;
  private synthStep = 0;
  private synthGain: GainNode | null = null;
  
  // Analysis buffers
  private freqData: Uint8Array<ArrayBuffer> | null = null;
  private timeData: Uint8Array<ArrayBuffer> | null = null;
  private leftFreqData: Uint8Array<ArrayBuffer> | null = null;
  private rightFreqData: Uint8Array<ArrayBuffer> | null = null;
  private leftTimeData: Uint8Array<ArrayBuffer> | null = null;
  private rightTimeData: Uint8Array<ArrayBuffer> | null = null;

  // Metrics cache
  private previousEnergy = 0;
  private peakHoldValue = 0;
  private peakHoldTime = 0;

  // Listeners
  private stateChangeListeners: Set<() => void> = new Set();

  public subscribe(cb: () => void): () => void {
    this.stateChangeListeners.add(cb);
    return () => this.stateChangeListeners.delete(cb);
  }

  private notify() {
    this.stateChangeListeners.forEach(cb => cb());
  }

  public async initContext(): Promise<AudioContext> {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      this.preAmpGain = this.ctx.createGain();
      this.preAmpGain.gain.value = 1.0;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.8;

      this.masterAnalyser = this.ctx.createAnalyser();
      this.masterAnalyser.fftSize = 1024;
      this.masterAnalyser.smoothingTimeConstant = 0.8;

      this.leftAnalyser = this.ctx.createAnalyser();
      this.leftAnalyser.fftSize = 1024;
      this.leftAnalyser.smoothingTimeConstant = 0.8;

      this.rightAnalyser = this.ctx.createAnalyser();
      this.rightAnalyser.fftSize = 1024;
      this.rightAnalyser.smoothingTimeConstant = 0.8;

      this.splitter = this.ctx.createChannelSplitter(2);

      // Routing: source -> preAmpGain -> masterGain -> destination
      // Also preAmpGain -> masterAnalyser
      // Also preAmpGain -> splitter -> (leftAnalyser, rightAnalyser)
      this.preAmpGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.preAmpGain.connect(this.masterAnalyser);
      this.preAmpGain.connect(this.splitter);
      this.splitter.connect(this.leftAnalyser, 0);
      this.splitter.connect(this.rightAnalyser, 1);

      this.updateBuffers();
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    return this.ctx;
  }

  public setFftSize(size: 256 | 512 | 1024 | 2048) {
    if (this.masterAnalyser) {
      this.masterAnalyser.fftSize = size;
      if (this.leftAnalyser) this.leftAnalyser.fftSize = size;
      if (this.rightAnalyser) this.rightAnalyser.fftSize = size;
      this.updateBuffers();
    }
  }

  public setSmoothing(smoothing: number) {
    const val = Math.max(0, Math.min(0.98, smoothing));
    if (this.masterAnalyser) this.masterAnalyser.smoothingTimeConstant = val;
    if (this.leftAnalyser) this.leftAnalyser.smoothingTimeConstant = val;
    if (this.rightAnalyser) this.rightAnalyser.smoothingTimeConstant = val;
  }

  public setSensitivity(gainMultiplier: number) {
    if (this.preAmpGain && this.ctx) {
      this.preAmpGain.gain.setTargetAtTime(gainMultiplier, this.ctx.currentTime, 0.05);
    }
  }

  public setVolume(volume: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime, 0.05);
    }
  }

  private updateBuffers() {
    if (!this.masterAnalyser) return;
    const binCount = this.masterAnalyser.frequencyBinCount;
    this.freqData = new Uint8Array(binCount);
    this.timeData = new Uint8Array(binCount);
    this.leftFreqData = new Uint8Array(binCount);
    this.rightFreqData = new Uint8Array(binCount);
    this.leftTimeData = new Uint8Array(binCount);
    this.rightTimeData = new Uint8Array(binCount);
  }

  // --- AUDIO SOURCE CONTROLS ---

  public async play(): Promise<void> {
    await this.initContext();
    if (this.sourceType === 'synth') {
      this.startSynth();
    } else if (this.sourceType === 'file' && this.audioElement) {
      await this.audioElement.play();
    } else if (this.sourceType === 'mic') {
      await this.startMic();
    }
    this.isPlaying = true;
    this.notify();
  }

  public pause(): void {
    if (this.sourceType === 'synth') {
      this.stopSynth();
    } else if (this.sourceType === 'file' && this.audioElement) {
      this.audioElement.pause();
    } else if (this.sourceType === 'mic') {
      this.stopMic();
    }
    this.isPlaying = false;
    this.notify();
  }

  public togglePlay(): void {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public async setSourceType(type: AudioSourceType): Promise<void> {
    if (this.sourceType === type) return;
    this.pause();
    this.sourceType = type;
    this.notify();
  }

  public selectTrack(trackId: string): void {
    const track = DEMO_TRACKS.find(t => t.id === trackId);
    if (track) {
      this.currentTrack = track;
      this.sourceType = 'synth';
      if (this.isPlaying) {
        this.stopSynth();
        this.startSynth();
      }
      this.notify();
    }
  }

  public async loadAudioFile(file: File): Promise<void> {
    await this.initContext();
    if (!this.ctx || !this.preAmpGain) return;

    this.stopSynth();
    this.stopMic();

    const objectUrl = URL.createObjectURL(file);
    if (!this.audioElement) {
      this.audioElement = new Audio();
      this.audioElement.crossOrigin = 'anonymous';
      this.audioElement.loop = true;
      this.fileSourceNode = this.ctx.createMediaElementSource(this.audioElement);
      this.fileSourceNode.connect(this.preAmpGain);
    }

    this.audioElement.src = objectUrl;
    this.sourceType = 'file';
    this.currentTrack = {
      id: 'local-file-' + Date.now(),
      title: file.name.replace(/\.[^/.]+$/, ''),
      artist: 'Local Audio File',
      genre: 'User Audio',
      duration: 0,
      bpm: 120,
      isSynthetic: false
    };

    this.audioElement.onloadedmetadata = () => {
      if (this.audioElement) {
        this.currentTrack.duration = this.audioElement.duration;
        this.notify();
      }
    };

    await this.play();
    this.notify();
  }

  public async startMic(): Promise<void> {
    await this.initContext();
    if (!this.ctx || !this.preAmpGain) return;

    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });
      this.micSourceNode = this.ctx.createMediaStreamSource(this.micStream);
      // Connect mic ONLY to analysers, not to master output speakers to prevent feedback squeal!
      if (this.masterAnalyser && this.splitter) {
        this.micSourceNode.connect(this.masterAnalyser);
        this.micSourceNode.connect(this.splitter);
      }
      this.sourceType = 'mic';
      this.isPlaying = true;
      this.currentTrack = {
        id: 'mic-in',
        title: 'Windows System / Mic Input',
        artist: 'Live Audio Stream',
        genre: 'Line-In / Stereo Mix',
        duration: 0,
        bpm: 120,
        isSynthetic: false
      };
      this.notify();
    } catch (err) {
      console.error('Failed to access microphone or system audio input:', err);
      this.isPlaying = false;
      this.notify();
    }
  }

  public stopMic(): void {
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
      this.micStream = null;
    }
    if (this.micSourceNode) {
      this.micSourceNode.disconnect();
      this.micSourceNode = null;
    }
  }

  // --- REAL-TIME SYNTHESIZER BEAT GENERATOR ---
  // Provides rich, punchy, high-harmonic multi-band audio so visualizers dance smoothly
  private startSynth(): void {
    if (!this.ctx || !this.preAmpGain) return;
    this.stopSynth();

    const bpm = this.currentTrack.bpm;
    const stepDuration = (60 / bpm) / 4; // 16th notes
    this.synthStep = 0;

    this.synthGain = this.ctx.createGain();
    this.synthGain.gain.value = 0.85;
    this.synthGain.connect(this.preAmpGain);

    const schedulePattern = () => {
      if (!this.isPlaying || !this.ctx || !this.synthGain) return;
      this.triggerSynthBeat(this.ctx.currentTime, this.synthStep);
      this.synthStep = (this.synthStep + 1) % 64;
    };

    schedulePattern();
    this.synthInterval = window.setInterval(schedulePattern, stepDuration * 1000);
  }

  private stopSynth(): void {
    if (this.synthInterval !== null) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
    if (this.synthGain) {
      this.synthGain.disconnect();
      this.synthGain = null;
    }
  }

  private triggerSynthBeat(time: number, step: number): void {
    if (!this.ctx || !this.synthGain) return;
    const mode = this.currentTrack.id;

    // 1. Kick Drum
    const isKick = mode === 'dnb' 
      ? (step % 32 === 0 || step % 32 === 10 || step % 32 === 22)
      : (step % 16 === 0 || step % 16 === 8 || (mode === 'cyberpunk' && step % 16 === 14));

    if (isKick) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, time);
      osc.frequency.exponentialRampToValueAtTime(32, time + 0.12);
      gain.gain.setValueAtTime(1.0, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);
      osc.connect(gain);
      gain.connect(this.synthGain);
      osc.start(time);
      osc.stop(time + 0.28);
    }

    // 2. Snare / Clap
    const isSnare = mode === 'dnb'
      ? (step % 32 === 8 || step % 32 === 24)
      : (step % 16 === 4 || step % 16 === 12);

    if (isSnare) {
      // Noise burst for snare
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.15);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1200, time);

      const snareGain = this.ctx.createGain();
      snareGain.gain.setValueAtTime(0.45, time);
      snareGain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

      noise.connect(filter);
      filter.connect(snareGain);
      snareGain.connect(this.synthGain);
      noise.start(time);
      noise.stop(time + 0.15);
    }

    // 3. Hi-hats
    if (step % 2 === 0 || (mode === 'dnb' && step % 1 === 0)) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(8000 + Math.random() * 2000, time);
      const vel = (step % 4 === 2) ? 0.18 : 0.09;
      gain.gain.setValueAtTime(vel, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
      osc.connect(gain);
      gain.connect(this.synthGain);
      osc.start(time);
      osc.stop(time + 0.04);
    }

    // 4. Bassline / Arpeggiator (Rich harmonics for spectrum analyzers)
    if (step % 2 === 0 || mode === 'cyberpunk') {
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      const panner = this.ctx.createStereoPanner();

      osc.type = mode === 'cyberpunk' ? 'sawtooth' : mode === 'synthwave' ? 'sawtooth' : 'triangle';

      // Bass scale notes (in Hz)
      const root = mode === 'ambient' ? 48.99 : 55.0; // A1
      const scales: Record<string, number[]> = {
        synthwave: [root, root * 1.189, root * 1.334, root * 1.498, root * 2.0],
        cyberpunk: [root, root * 1.059, root * 1.334, root * 1.414, root * 0.89],
        ambient: [root * 2, root * 2.5, root * 3, root * 4],
        dnb: [root, root * 1.189, root * 0.75, root * 1.5]
      };
      const scale = scales[mode] || scales.synthwave;
      const noteFreq = scale[Math.floor((step / 2) % scale.length)];

      osc.frequency.setValueAtTime(noteFreq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(noteFreq * 2.5, time);
      filter.frequency.exponentialRampToValueAtTime(noteFreq * 8.0, time + 0.05);
      filter.frequency.exponentialRampToValueAtTime(noteFreq * 1.5, time + 0.15);
      filter.Q.value = 5.0;

      // Stereo pan oscillation
      panner.pan.value = Math.sin(step * 0.35) * 0.45;

      gain.gain.setValueAtTime(0.22, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

      osc.connect(filter);
      filter.connect(panner);
      panner.connect(gain);
      gain.connect(this.synthGain);

      osc.start(time);
      osc.stop(time + 0.18);
    }

    // 5. High Lead / Pad Chords every 8/16 steps
    if (step % 8 === 0) {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const padGain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sine';

      const padFreqs = [220, 261.63, 329.63, 392.0, 440];
      const baseF = padFreqs[Math.floor((step / 16) % padFreqs.length)];

      osc1.frequency.setValueAtTime(baseF, time);
      osc2.frequency.setValueAtTime(baseF * 1.5, time);

      padGain.gain.setValueAtTime(0.08, time);
      padGain.gain.exponentialRampToValueAtTime(0.001, time + 0.45);

      osc1.connect(padGain);
      osc2.connect(padGain);
      padGain.connect(this.synthGain);

      osc1.start(time);
      osc2.start(time);
      osc1.stop(time + 0.45);
      osc2.stop(time + 0.45);
    }
  }

  // --- REAL-TIME FRAME DATA RETRIEVAL FOR VISUALIZERS ---

  public getVisualizerData(): {
    freqData: Uint8Array<ArrayBuffer>;
    timeData: Uint8Array<ArrayBuffer>;
    leftFreqData: Uint8Array<ArrayBuffer>;
    rightFreqData: Uint8Array<ArrayBuffer>;
    leftTimeData: Uint8Array<ArrayBuffer>;
    rightTimeData: Uint8Array<ArrayBuffer>;
    metrics: AudioMetrics;
  } {
    if (
      !this.masterAnalyser ||
      !this.freqData ||
      !this.timeData ||
      !this.leftFreqData ||
      !this.rightFreqData ||
      !this.leftTimeData ||
      !this.rightTimeData ||
      !this.leftAnalyser ||
      !this.rightAnalyser
    ) {
      const empty = new Uint8Array(512);
      return {
        freqData: empty,
        timeData: empty,
        leftFreqData: empty,
        rightFreqData: empty,
        leftTimeData: empty,
        rightTimeData: empty,
        metrics: { bass: 0, mid: 0, treble: 0, rms: 0, peak: 0, isBeat: false, instantBpm: 120 }
      };
    }

    this.masterAnalyser.getByteFrequencyData(this.freqData);
    this.masterAnalyser.getByteTimeDomainData(this.timeData);
    this.leftAnalyser.getByteFrequencyData(this.leftFreqData);
    this.rightAnalyser.getByteFrequencyData(this.rightFreqData);
    this.leftAnalyser.getByteTimeDomainData(this.leftTimeData);
    this.rightAnalyser.getByteTimeDomainData(this.rightTimeData);

    const metrics = this.calculateMetrics(this.freqData, this.timeData);

    return {
      freqData: this.freqData,
      timeData: this.timeData,
      leftFreqData: this.leftFreqData,
      rightFreqData: this.rightFreqData,
      leftTimeData: this.leftTimeData,
      rightTimeData: this.rightTimeData,
      metrics
    };
  }

  private calculateMetrics(freq: Uint8Array, time: Uint8Array): AudioMetrics {
    const len = freq.length;
    // Frequency bands:
    // Bass: 0 to ~12% of bins (20Hz to ~250Hz with 1024 FFT at 44.1kHz)
    // Mid: ~12% to ~50% (250Hz to 4kHz)
    // Treble: ~50% to 100% (4kHz to 20kHz)
    const bassEnd = Math.floor(len * 0.12);
    const midEnd = Math.floor(len * 0.5);

    let bassSum = 0;
    for (let i = 0; i < bassEnd; i++) bassSum += freq[i];
    const bass = bassEnd > 0 ? bassSum / (bassEnd * 255) : 0;

    let midSum = 0;
    for (let i = bassEnd; i < midEnd; i++) midSum += freq[i];
    const mid = (midEnd - bassEnd) > 0 ? midSum / ((midEnd - bassEnd) * 255) : 0;

    let trebleSum = 0;
    for (let i = midEnd; i < len; i++) trebleSum += freq[i];
    const treble = (len - midEnd) > 0 ? trebleSum / ((len - midEnd) * 255) : 0;

    // RMS Calculation from time domain
    let rmsSum = 0;
    for (let i = 0; i < time.length; i++) {
      const sample = (time[i] - 128) / 128;
      rmsSum += sample * sample;
    }
    const rms = Math.sqrt(rmsSum / time.length);

    // Peak holding
    let currentPeak = 0;
    for (let i = 0; i < time.length; i++) {
      const absVal = Math.abs((time[i] - 128) / 128);
      if (absVal > currentPeak) currentPeak = absVal;
    }

    const now = performance.now();
    if (currentPeak > this.peakHoldValue) {
      this.peakHoldValue = currentPeak;
      this.peakHoldTime = now;
    } else if (now - this.peakHoldTime > 300) {
      this.peakHoldValue = Math.max(0, this.peakHoldValue - 0.02);
    }

    // Beat Detection: energy transient
    const currentEnergy = bass * 1.5 + mid * 0.5;
    const isBeat = currentEnergy > 0.35 && (currentEnergy - this.previousEnergy) > 0.15;
    this.previousEnergy = currentEnergy;

    return {
      bass,
      mid,
      treble,
      rms,
      peak: this.peakHoldValue,
      isBeat,
      instantBpm: this.currentTrack.bpm
    };
  }

  // Getters
  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getSourceType(): AudioSourceType {
    return this.sourceType;
  }

  public getCurrentTrack(): AudioTrackInfo {
    return this.currentTrack;
  }

  public seek(timeInSeconds: number) {
    if (this.audioElement && this.sourceType === 'file') {
      this.audioElement.currentTime = timeInSeconds;
    }
  }

  public getCurrentPlaybackTime(): number {
    if (this.audioElement && this.sourceType === 'file') {
      return this.audioElement.currentTime;
    }
    return 0;
  }
}

export const audioEngine = new AudioEngine();
