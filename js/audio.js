/**
 * TimerPlus Audio Engine
 * Pure Web Audio API & Web Speech API Synthesizer
 * Zero external audio files required - works 100% offline with zero latency.
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.volume = 0.8;
    this.soundMode = 'all'; // 'all' (beep + voice), 'beep', 'voice', 'mute'
    this.isUnlocked = false;

    // Load saved audio preferences
    this.loadSettings();

    // Auto unlock on first user gesture
    this.setupUnlockListeners();
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem('timerplus_audio_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.isMuted = parsed.isMuted ?? false;
        this.volume = parsed.volume ?? 0.8;
        this.soundMode = parsed.soundMode ?? 'all';
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
        soundMode: this.soundMode
      }));
    } catch (e) {
      console.warn('Failed to save audio settings', e);
    }
  }

  initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        this.isUnlocked = true;
      });
    } else if (this.ctx && this.ctx.state === 'running') {
      this.isUnlocked = true;
    }
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

  // 3, 2, 1 Countdown Beep
  playCountdownBeep(count = 3) {
    if (this.isMuted || this.soundMode === 'mute') return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // High pitch beep for 3, 2, 1
    const freq = count === 1 ? 987.77 : 880; // B5 for 1, A5 for 3 & 2
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    const actualVol = this.volume * 0.7;
    gain.gain.setValueAtTime(actualVol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.15);

    // Speak countdown if voice enabled
    if (this.soundMode === 'all' || this.soundMode === 'voice') {
      this.speakText(String(count), 1.2);
    }
  }

  // WORK Interval Start - Energetic Whistle / Boxing Bell
  playWorkStart() {
    if (this.isMuted || this.soundMode === 'mute') return;
    this.initContext();
    if (!this.ctx) return;

    if (this.soundMode !== 'voice') {
      this.playBoxingBell();
    }

    if (this.soundMode === 'all' || this.soundMode === 'voice') {
      setTimeout(() => {
        this.speakText('시작!', 1.1);
      }, 150);
    }
  }

  // Authentic Boxing Bell Synthesizer
  playBoxingBell() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Harmonic frequencies resembling a metal gym ring bell
    const harmonics = [587.33, 880, 1174.66, 1760];
    const gains = [0.6, 0.4, 0.25, 0.15];

    harmonics.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      const amp = this.volume * gains[idx];
      gain.gain.setValueAtTime(amp, t);
      // Bell reverberation decay
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 1.25);
    });
  }

  // REST Interval Start - Softer descending tone
  playRestStart() {
    if (this.isMuted || this.soundMode === 'mute') return;
    this.initContext();
    if (!this.ctx) return;

    if (this.soundMode !== 'voice') {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.exponentialRampToValueAtTime(220, t + 0.45);

      gain.gain.setValueAtTime(this.volume * 0.7, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.52);
    }

    if (this.soundMode === 'all' || this.soundMode === 'voice') {
      setTimeout(() => {
        this.speakText('휴식', 1.0);
      }, 120);
    }
  }

  // Set Rest Start (Between sets)
  playSetRestStart() {
    if (this.isMuted || this.soundMode === 'mute') return;
    this.playRestStart();
    if (this.soundMode === 'all' || this.soundMode === 'voice') {
      setTimeout(() => {
        this.speakText('세트 휴식', 1.0);
      }, 500);
    }
  }

  // Workout Complete Fanfare
  playComplete() {
    if (this.isMuted || this.soundMode === 'mute') return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = t + idx * 0.16;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(this.volume * 0.6, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.55);
    });

    if (this.soundMode === 'all' || this.soundMode === 'voice') {
      setTimeout(() => {
        this.speakText('운동 완료! 수고하셨습니다.', 1.0);
      }, 900);
    }
  }

  // Quick tactile tick when tapping buttons
  playTap() {
    if (this.isMuted || this.soundMode === 'mute') return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    gain.gain.setValueAtTime(this.volume * 0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.045);
  }

  // Web Speech API for voice cues
  speakText(text, rate = 1.0) {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel(); // Stop any pending speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = rate;
      utterance.pitch = 1.05;
      utterance.volume = this.volume;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesis error:', e);
    }
  }
}

window.soundEngine = new SoundEngine();
