/**
 * AEROSCULPT Synthesizer Engine
 * Programmatic Web Audio API sound effects synthesizer.
 * No external file dependencies required.
 */

class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private masterVolume: GainNode | null = null;
  private windVolume: GainNode | null = null;
  private windOsc: BiquadFilterNode | null = null;
  private bgmGain: GainNode | null = null;
  private bgmInterval: any = null;
  private musicPlaying = false;
  private muted = false;

  constructor() {
    // Sound is lazy-initialized on first user interaction to comply with browser autoplay policies
  }

  private init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();

      // Master gain
      this.masterVolume = this.ctx.createGain();
      this.masterVolume.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.masterVolume.connect(this.ctx.destination);

      // Start static wind aerodynamic ambiance sound
      this.startWindPhysicsAmbiance();
    } catch (e) {
      console.warn("Web Audio API not supported in this browser:", e);
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterVolume && this.ctx) {
      this.masterVolume.gain.setValueAtTime(this.muted ? 0 : 0.35, this.ctx.currentTime);
    }
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  // Generate continuous aerodynamic glide wind noise
  private startWindPhysicsAmbiance() {
    if (!this.ctx || !this.masterVolume) return;

    // Generate white/brown noise for wind
    const bufferSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Brown noise approximation filter
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 4.5; // boost amplitude
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // Lowpass filter to make it sound like a deep wind current
    this.windOsc = this.ctx.createBiquadFilter();
    this.windOsc.type = "lowpass";
    this.windOsc.frequency.setValueAtTime(400, this.ctx.currentTime);
    this.windOsc.Q.setValueAtTime(2.0, this.ctx.currentTime);

    this.windVolume = this.ctx.createGain();
    this.windVolume.gain.setValueAtTime(0.04, this.ctx.currentTime);

    noiseSource.connect(this.windOsc);
    this.windOsc.connect(this.windVolume);
    this.windVolume.connect(this.masterVolume);

    noiseSource.start();
  }

  // Modulate wind tone dynamically based on glider velocity & altitude
  updateGliderSound(speed: number, isStalling: boolean) {
    this.init();
    if (!this.ctx || this.muted) return;

    if (this.windOsc && this.windVolume) {
      const frequencyValue = Math.min(1800, 250 + speed * 12);
      const targetVolume = isStalling ? 0.02 : Math.min(0.2, 0.03 + (speed * 0.003));

      this.windOsc.frequency.setTargetAtTime(frequencyValue, this.ctx.currentTime, 0.15);
      this.windVolume.gain.setTargetAtTime(targetVolume, this.ctx.currentTime, 0.1);
    }
  }

  // Trigger high-velocity boost action sound (Rocket exhaust flare)
  playBoost() {
    this.init();
    if (!this.ctx || this.muted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gainNode = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(750, now + 0.35);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(2000, now + 0.3);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.28, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterVolume!);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  // Strike vacuum wave slash sound
  playSlash() {
    this.init();
    if (!this.ctx || this.muted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.18);

    gainNode.gain.setValueAtTime(0.18, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gainNode);
    gainNode.connect(this.masterVolume!);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  // Chaining Electric Shock electrocution sound
  playElectroShock() {
    this.init();
    if (!this.ctx || this.muted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = "sawtooth";
    // Quick trembling pitch vibration for sparks
    osc.frequency.setValueAtTime(60, now);
    for (let i = 1; i <= 6; i++) {
      osc.frequency.setValueAtTime(100 + Math.random() * 800, now + i * 0.025);
    }

    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gainNode);
    gainNode.connect(this.masterVolume!);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Frozen crystalline shatter effect sound
  playIceShatter() {
    this.init();
    if (!this.ctx || this.muted) return;

    const now = this.ctx.currentTime;

    // We cascade 3 tiny crystal bell-like tones and a crackle noise burst
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1200 + i * 400 + Math.random() * 200, now + i * 0.03);

      gainNode.gain.setValueAtTime(0.08, now + i * 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + i * 0.03 + 0.15);

      osc.connect(gainNode);
      gainNode.connect(this.masterVolume!);
      osc.start(now + i * 0.03);
      osc.stop(now + i * 0.03 + 0.2);
    }
  }

  // Dampened hot steam evaporation noise (Pyro burn)
  playSizzleSteam() {
    this.init();
    if (!this.ctx || this.muted) return;

    const now = this.ctx.currentTime;
    const bufferSize = 0.25 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(3500, now);
    filter.frequency.exponentialRampToValueAtTime(800, now + 0.25);

    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(0.12, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterVolume!);

    source.start(now);
    source.stop(now + 0.3);
  }

  // Hit impact explosive response audio
  playExplosion(isLarge = false) {
    this.init();
    if (!this.ctx || this.muted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(isLarge ? 90 : 150, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + (isLarge ? 0.4 : 0.2));

    gainNode.gain.setValueAtTime(isLarge ? 0.35 : 0.22, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + (isLarge ? 0.45 : 0.25));

    osc.connect(gainNode);
    gainNode.connect(this.masterVolume!);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  // Dynamic low-bass pulse (Trampoline bouncy action)
  playBounce() {
    this.init();
    if (!this.ctx || this.muted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.22);

    gainNode.gain.setValueAtTime(0.24, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gainNode);
    gainNode.connect(this.masterVolume!);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  // Standard short chime note
  playChime() {
    this.init();
    if (!this.ctx || this.muted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
    osc.frequency.setValueAtTime(783.99, now + 0.16); // G5

    gainNode.gain.setValueAtTime(0.12, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gainNode);
    gainNode.connect(this.masterVolume!);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  // Play melodic game over jingle
  playGameOver() {
    this.init();
    if (!this.ctx || this.muted) return;

    const now = this.ctx.currentTime;
    const notes = [392.00, 349.23, 311.13, 261.63]; // G4, F4, Eb4, C4
    
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, now + idx * 0.15);

      gainNode.gain.setValueAtTime(0.08, now + idx * 0.15);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.25);

      osc.connect(gainNode);
      gainNode.connect(this.masterVolume!);
      
      osc.start(now + idx * 0.15);
      osc.stop(now + idx * 0.15 + 0.3);
    });
  }

  // Starts the interactive procedural soundtrack
  startBgm() {
    this.init();
    if (!this.ctx || this.musicPlaying || this.muted) return;
    this.musicPlaying = true;

    const baseNotes = [65.41, 73.42, 87.31, 98.00, 110.00, 130.81]; // C2, D2, F2, G2, A2, C3
    let step = 0;

    // Create a rhythmic sequencer
    this.bgmGain = this.ctx!.createGain();
    this.bgmGain.gain.setValueAtTime(0.04, this.ctx!.currentTime);
    this.bgmGain.connect(this.masterVolume!);

    const triggerNote = () => {
      if (!this.ctx || !this.musicPlaying) return;
      const now = this.ctx.currentTime;

      // Bass note
      const bassIndex = Math.floor(step / 4) % baseNotes.length;
      const bassFreq = baseNotes[bassIndex];

      const oscBass = this.ctx.createOscillator();
      const gainBass = this.ctx.createGain();
      oscBass.type = "triangle";
      oscBass.frequency.value = bassFreq;
      
      gainBass.gain.setValueAtTime(0.2, now);
      gainBass.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      oscBass.connect(gainBass);
      gainBass.connect(this.bgmGain!);
      oscBass.start(now);
      oscBass.stop(now + 0.5);

      // Treble arpeggiator on alternating steps
      if (step % 2 === 0) {
        const trebleFreq = bassFreq * 4 * (step % 4 === 0 ? 1.5 : step % 3 === 0 ? 1.25 : 1.2);
        const oscTreble = this.ctx.createOscillator();
        const gainTreble = this.ctx.createGain();
        oscTreble.type = "sine";
        oscTreble.frequency.value = trebleFreq;

        gainTreble.gain.setValueAtTime(0.08, now);
        gainTreble.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        oscTreble.connect(gainTreble);
        gainTreble.connect(this.bgmGain!);
        oscTreble.start(now);
        oscTreble.stop(now + 0.3);
      }

      step++;
    };

    this.bgmInterval = setInterval(triggerNote, 300);
  }

  stopBgm() {
    this.musicPlaying = false;
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  toggleBgm() {
    if (this.musicPlaying) {
      this.stopBgm();
      return false;
    } else {
      this.startBgm();
      return true;
    }
  }

  isBgmPlaying() {
    return this.musicPlaying;
  }
}

export const synAndAmbiance = new AudioSynthesizer();
