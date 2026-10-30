/**
 * TimerPlus Audio Engine
 * Pure Web Audio API & Web Speech API Synthesizer
 * Zero external audio files required - works 100% offline with zero latency.
 * Supports loud acoustic boost, Korean voice countdown ("셋, 둘, 하나, 시작!"),
 * and ambient audio mixing to play concurrently with YouTube Music / Spotify.
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.compressor = null;
    this.masterGain = null;
    this.isMuted = false;
    this.volume = 1.0; // Default full volume
    this.soundMode = 'all'; // 'all' (beep + voice), 'beep', 'voice', 'mute'
    this.audioMixingMode = true; // Mix with background music apps (YouTube Music, Spotify)
    this.isUnlocked = false;

    // Load saved audio preferences
    this.loadSettings();

    // Configure ambient audio session (iOS Safari / WebKit)
    this.configureAudioSession();

    // Auto unlock on first user gesture
    this.setupUnlockListeners();

    // Warm up voices
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.getVoices();
        };
      }
    }
  }

  configureAudioSession() {
    // Tells iOS Safari / WebKit to mix web audio with other audio apps instead of pausing them
    if ('audioSession' in navigator) {
      try {
        navigator.audioSession.type = 'ambient';
      } catch (e) {
        // Fallback silently if not supported
      }
    }
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem('timerplus_audio_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.isMuted = parsed.isMuted ?? false;
        this.volume = parsed.volume ?? 1.0;
        this.soundMode = parsed.soundMode ?? 'all';
        this.audioMixingMode = parsed.audioMixingMode ?? true;
      }
    } catch (e) {
      console.warn('Failed to load audio settings', e);
    }
  }

  saveSettings() {
    try {
      localStorage.setItem('timerplus_audio_settings', JSON.stringify({
        isMuted: this.isMuted,
        volume: this.volume,
        soundMode: this.soundMode,
        audioMixingMode: this.audioMixingMode
      }));
    } catch (e) {
      console.warn('Failed to save audio settings', e);
    }
    this.updateMasterGain();
  }

  updateMasterGain() {
    if (this.masterGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : this.volume * 1.5; // 1.5x acoustic loudness boost
      this.masterGain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
    }
  }

  initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass({ latencyHint: 'interactive' });

        // Master Compressor to boost perceived loudness without clipping
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
        this.compressor.knee.setValueAtTime(10, this.ctx.currentTime);
        this.compressor.ratio.setValueAtTime(8, this.ctx.currentTime);
        this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
        this.compressor.release.setValueAtTime(0.2, this.ctx.currentTime);

        // Master Gain Node (with 1.5x boost multiplier)
        this.masterGain = this.ctx.createGain();
        this.updateMasterGain();

        this.compressor.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        this.isUnlocked = true;
      });
    } else if (this.ctx && this.ctx.state === 'running') {
      this.isUnlocked = true;
    }

    this.configureAudioSession();
  }

  setupUnlockListeners() {
    const unlock = () => {
      this.initContext();
      if (this.ctx && this.ctx.state === 'running') {
        window.removeEventListener('click', unlock);
        window.removeEventListener('touchstart', unlock);
        window.removeEventListener('keydown', unlock);
      }
    };
    window.addEventListener('click', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
  }

  /**
   * 3, 2, 1 Countdown
   * Dual-tone resonant beep + energetic Korean voice count ("셋", "둘", "하나")
   */
  playCountdownBeep(count = 3, phase = 'prepare') {
    if (this.isMuted || this.soundMode === 'mute') return;
    this.initContext();

    // 1. Play dual-tone sports buzzer beep
    if (this.ctx && this.compressor && this.soundMode !== 'voice') {
      const t = this.ctx.currentTime;
      const freq = count === 1 ? 1046.50 : 880; // C6 for 1, A5 for 3 & 2

      // Fundamental oscillator
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, t);
      gain1.gain.setValueAtTime(0.9, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

      osc1.connect(gain1);
      gain1.connect(this.compressor);
      osc1.start(t);
      osc1.stop(t + 0.17);

      // Overtone harmonic for piercing presence in noisy gyms & earphones
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 2, t);
      gain2.gain.setValueAtTime(0.4, t);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      osc2.connect(gain2);
      gain2.connect(this.compressor);
      osc2.start(t);
      osc2.stop(t + 0.15);
    }

    // 2. Speak voice countdown in Korean ("셋", "둘", "하나")
    if (this.soundMode === 'all' || this.soundMode === 'voice') {
      const koreanCounts = { 3: '셋', 2: '둘', 1: '하나' };
      const voiceText = koreanCounts[count] || String(count);
      this.speakText(voiceText, 1.25);
    }
  }

  /**
   * WORK Interval Start / Round Start ("시작!" + 링 벨)
   */
  playWorkStart() {
    if (this.isMuted || this.soundMode === 'mute') return;
    this.initContext();

    if (this.soundMode !== 'voice') {
      this.playBoxingBell();
    }

    if (this.soundMode === 'all' || this.soundMode === 'voice') {
      // Energetic voice start cue
      setTimeout(() => {
        this.speakText('시작!', 1.2);
      }, 120);
    }
  }

  /**
   * Authentic Boxing Ring Bell Synthesizer (Metallic Clang & Rich Reverb)
   */
  playBoxingBell() {
    if (!this.ctx || !this.compressor) return;
    const t = this.ctx.currentTime;

    // Harmonic frequencies resembling a metal gym ring bell
    const harmonics = [587.33, 880, 1174.66, 1760];
    const gains = [0.9, 0.65, 0.45, 0.28];

    harmonics.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(gains[idx], t);
      // Bell reverberation decay
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);

      osc.connect(gain);
      gain.connect(this.compressor);

      osc.start(t);
      osc.stop(t + 1.45);
    });
  }

  /**
   * Boxing 10-Second Warning Wood Clapper (스내피한 타격음)
   */
  playWarningClapper() {
    if (this.isMuted || this.soundMode === 'mute') return;
    this.initContext();
    if (!this.ctx || !this.compressor) return;

    const playClick = (timeOffset) => {
      const t = this.ctx.currentTime + timeOffset;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(450, t);
      osc.frequency.exponentialRampToValueAtTime(100, t + 0.06);

      gain.gain.setValueAtTime(0.85, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

      osc.connect(gain);
      gain.connect(this.compressor);

      osc.start(t);
      osc.stop(t + 0.08);
    };

    playClick(0);
    playClick(0.18);
  }

  /**
   * Round End Double Bell
   */
  playRoundEndBell() {
    if (this.isMuted || this.soundMode === 'mute') return;
    this.playBoxingBell();
    setTimeout(() => {
      this.playBoxingBell();
    }, 280);
  }

  /**
   * REST Interval Start - Descending tone + "휴식!"
   */
  playRestStart() {
    if (this.isMuted || this.soundMode === 'mute') return;
    this.initContext();

    if (this.ctx && this.compressor && this.soundMode !== 'voice') {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, t); // C5 -> G4
      osc.frequency.exponentialRampToValueAtTime(392.00, t + 0.45);

      gain.gain.setValueAtTime(0.85, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

      osc.connect(gain);
      gain.connect(this.compressor);

      osc.start(t);
      osc.stop(t + 0.52);
    }

    if (this.soundMode === 'all' || this.soundMode === 'voice') {
      setTimeout(() => {
        this.speakText('휴식', 1.15);
      }, 100);
    }
  }

  /**
   * Set Rest Start (Between sets)
   */
  playSetRestStart() {
    if (this.isMuted || this.soundMode === 'mute') return;
    this.playRestStart();
    if (this.soundMode === 'all' || this.soundMode === 'voice') {
      setTimeout(() => {
        this.speakText('세트 휴식', 1.15);
      }, 450);
    }
  }

  /**
   * Workout Complete Fanfare & Cheerful Message
   */
  playComplete() {
    if (this.isMuted || this.soundMode === 'mute') return;
    this.initContext();

    if (this.ctx && this.compressor) {
      const t = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const noteTime = t + idx * 0.16;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.8, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.55);

        osc.connect(gain);
        gain.connect(this.compressor);

        osc.start(noteTime);
        osc.stop(noteTime + 0.6);
      });
    }

    if (this.soundMode === 'all' || this.soundMode === 'voice') {
      setTimeout(() => {
        this.speakText('운동 완료! 수고하셨습니다!', 1.1);
      }, 850);
    }
  }

  /**
   * Quick tactile tick when tapping buttons
   */
  playTap() {
    if (this.isMuted || this.soundMode === 'mute') return;
    this.initContext();
    if (!this.ctx || !this.compressor) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.compressor);

    osc.start(t);
    osc.stop(t + 0.045);
  }

  /**
   * Web Speech API - loud, high-priority Korean voice synthesis
   */
  speakText(text, rate = 1.15) {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel(); // Cancel any lingering utterance
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = rate;
      utterance.pitch = 1.05;
      utterance.volume = 1.0; // Maximum volume for workout clarity

      // Select Korean voice if available
      const voices = window.speechSynthesis.getVoices();
      const koVoice = voices.find(v => v.lang === 'ko-KR' || v.lang.startsWith('ko'));
      if (koVoice) {
        utterance.voice = koVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesis error:', e);
    }
  }
}

window.soundEngine = new SoundEngine();
