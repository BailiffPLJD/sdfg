/**
 * Procedural Web Audio Engine for 500cc Methanol Speedway Bikes
 * No external audio files needed - 100% generated in real-time.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;

  // Player engine nodes
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private subOsc: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;
  private distortion: WaveShaperNode | null = null;

  // Dirt Roost / Gravel sliding noise
  private roostNode: AudioBufferSourceNode | null = null;
  private roostFilter: BiquadFilterNode | null = null;
  private roostGain: GainNode | null = null;

  // Ambient crowd roar
  private crowdGain: GainNode | null = null;

  private isStarted: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.setupEngineSynth();
      this.setupRoostNoise();
      this.setupCrowdNoise();
      this.isStarted = true;
    } catch {
      // Audio not permitted yet
    }
  }

  private makeDistortionCurve(amount = 20) {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  private setupEngineSynth() {
    if (!this.ctx || !this.masterGain) return;

    // 500cc single cylinder produces deep fundamental + rich odd & even harmonics
    this.osc1 = this.ctx.createOscillator();
    this.osc1.type = 'sawtooth';
    this.osc1.frequency.setValueAtTime(55, this.ctx.currentTime); // ~3300 RPM idle base

    this.osc2 = this.ctx.createOscillator();
    this.osc2.type = 'triangle';
    this.osc2.frequency.setValueAtTime(110, this.ctx.currentTime);

    this.subOsc = this.ctx.createOscillator();
    this.subOsc.type = 'square';
    this.subOsc.frequency.setValueAtTime(27.5, this.ctx.currentTime);

    this.distortion = this.ctx.createWaveShaper();
    this.distortion.curve = this.makeDistortionCurve(25);
    this.distortion.oversample = '4x';

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(450, this.ctx.currentTime);
    this.engineFilter.Q.setValueAtTime(4.5, this.ctx.currentTime);

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

    this.osc1.connect(this.distortion);
    this.osc2.connect(this.distortion);
    this.subOsc.connect(this.distortion);
    this.distortion.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);

    this.osc1.start();
    this.osc2.start();
    this.subOsc.start();
  }

  private setupRoostNoise() {
    if (!this.ctx || !this.masterGain) return;

    // Procedural white/brown noise for dirt roost spraying
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.04 * white) / 1.04; // Brownish grit
      lastOut = output[i];
    }

    this.roostNode = this.ctx.createBufferSource();
    this.roostNode.buffer = noiseBuffer;
    this.roostNode.loop = true;

    this.roostFilter = this.ctx.createBiquadFilter();
    this.roostFilter.type = 'bandpass';
    this.roostFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);
    this.roostFilter.Q.setValueAtTime(2.0, this.ctx.currentTime);

    this.roostGain = this.ctx.createGain();
    this.roostGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.roostNode.connect(this.roostFilter);
    this.roostFilter.connect(this.roostGain);
    this.roostGain.connect(this.masterGain);

    this.roostNode.start();
  }

  private setupCrowdNoise() {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * 3;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const crowdNode = this.ctx.createBufferSource();
    crowdNode.buffer = noiseBuffer;
    crowdNode.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    this.crowdGain = this.ctx.createGain();
    this.crowdGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    crowdNode.connect(filter);
    filter.connect(this.crowdGain);
    this.crowdGain.connect(this.masterGain);

    crowdNode.start();
  }

  /**
   * Update engine sound based on throttle, speed and clutch
   */
  public updateEngine(throttle: number, speedKmH: number, isClutchHeld: boolean, slipAngle: number) {
    if (!this.ctx || !this.engineGain || !this.osc1 || !this.osc2 || !this.subOsc || !this.engineFilter || this.isMuted) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const time = this.ctx.currentTime;

    // RPM calculations
    let targetRpm = 3500; // Idle
    if (isClutchHeld && throttle > 0.1) {
      // Screaming rev limiter at gate with clutch pulled
      targetRpm = 8200 + throttle * 2800 + Math.sin(time * 30) * 350;
    } else {
      // Normal acceleration linked to speed & throttle
      targetRpm = 3500 + (speedKmH / 115) * 6500 + throttle * 1200;
    }

    // Single cylinder 4-stroke firing frequency: RPM / 120
    const freq = targetRpm / 60; // Fundamental firing rate
    this.osc1.frequency.setTargetAtTime(freq, time, 0.05);
    this.osc2.frequency.setTargetAtTime(freq * 2, time, 0.05);
    this.subOsc.frequency.setTargetAtTime(freq * 0.5, time, 0.05);

    // Filter opens up as throttle and RPM increase
    const filterFreq = 300 + (targetRpm / 11000) * 3800 + throttle * 1200;
    this.engineFilter.frequency.setTargetAtTime(Math.min(filterFreq, 7500), time, 0.04);

    // Engine volume
    const targetGain = 0.08 + throttle * 0.22 + (isClutchHeld ? 0.15 : 0.05);
    this.engineGain.gain.setTargetAtTime(targetGain, time, 0.03);

    // Roost / Gravel sound intensity (high when drifting and on throttle)
    if (this.roostGain && this.roostFilter) {
      const driftIntensity = Math.abs(slipAngle) * (speedKmH / 70) * (throttle * 0.8 + 0.2);
      const roostVol = Math.min(Math.max(driftIntensity * 0.35, 0), 0.4);
      this.roostGain.gain.setTargetAtTime(roostVol, time, 0.05);
      this.roostFilter.frequency.setTargetAtTime(900 + driftIntensity * 1200, time, 0.05);
    }
  }

  /**
   * Sound of referee green light or start tape firing
   */
  public playTapesUp() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const time = this.ctx.currentTime;

    // Snapping sound of the pneumatic spring release
    const snapOsc = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();

    snapOsc.type = 'triangle';
    snapOsc.frequency.setValueAtTime(320, time);
    snapOsc.frequency.exponentialRampToValueAtTime(80, time + 0.08);

    snapGain.gain.setValueAtTime(0.5, time);
    snapGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

    snapOsc.connect(snapGain);
    snapGain.connect(this.masterGain);

    snapOsc.start(time);
    snapOsc.stop(time + 0.1);

    // Buzzer tone
    const buzz = this.ctx.createOscillator();
    const buzzGain = this.ctx.createGain();
    buzz.type = 'sawtooth';
    buzz.frequency.setValueAtTime(440, time);
    buzzGain.gain.setValueAtTime(0.2, time);
    buzzGain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

    buzz.connect(buzzGain);
    buzzGain.connect(this.masterGain);
    buzz.start(time);
    buzz.stop(time + 0.25);
  }

  /**
   * Two-minute buzzer warning
   */
  public playTwoMinuteHorn() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const time = this.ctx.currentTime;
    const horn = this.ctx.createOscillator();
    const hornGain = this.ctx.createGain();

    horn.type = 'sawtooth';
    horn.frequency.setValueAtTime(220, time);
    hornGain.gain.setValueAtTime(0.3, time);
    hornGain.gain.linearRampToValueAtTime(0.3, time + 0.4);
    hornGain.gain.exponentialRampToValueAtTime(0.001, time + 0.6);

    horn.connect(hornGain);
    hornGain.connect(this.masterGain);

    horn.start(time);
    horn.stop(time + 0.6);
  }

  /**
   * Checkered flag trumpet / victory fanfare
   */
  public playCheerRoar() {
    if (!this.ctx || !this.crowdGain || this.isMuted) return;
    const time = this.ctx.currentTime;
    this.crowdGain.gain.cancelScheduledValues(time);
    this.crowdGain.gain.setValueAtTime(0.25, time);
    this.crowdGain.gain.exponentialRampToValueAtTime(0.08, time + 4.0);
  }

  /**
   * Steel shoe grinding on shale stones in corner
   */
  public playSteelShoeScrape(intensity: number = 0.5) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const time = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.12);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2400, time);

    const gain = this.ctx.createGain();
    const vol = Math.min(0.28, Math.max(0.02, intensity * 0.25));
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(time);
  }

  /**
   * Methanol engine exhaust backfire pop
   */
  public playBackfirePop() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, time);
    osc.frequency.exponentialRampToValueAtTime(35, time + 0.08);

    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.09);
  }

  /**
   * Visor tear-off plastic snap sound
   */
  public playTearOff() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    const time = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1400, time);
    osc.frequency.exponentialRampToValueAtTime(320, time + 0.06);

    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.07);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.07);
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.7, this.ctx.currentTime);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }
}

export const soundEngine = new SoundEngine();
