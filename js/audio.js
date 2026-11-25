/**
 * TimerPlus Audio Engine
 * Pure Web Audio API & Web Speech API Synthesizer
 * Zero external audio files required - works 100% offline with zero latency.
 * Supports loud acoustic boost, 1-second tick-tock escapement cues,
 * Korean voice cues ("준비", "3초, 2초, 1초, 시작!", circuit exercise names, weight set cues),
 * self-healing AudioContext recovery on app resume / background return,
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
    this.tickSoundEnabled = true; // 1-second tick-tock sound while timer is running
    this.halfwayAlertEnabled = true; // Halfway alert on >= 30s work intervals
    this.isUnlocked = false;

    // Load saved audio preferences
    this.loadSettings();

    // Configure ambient audio session (iOS Safari / WebKit)
    this.configureAudioSession();

    // Auto unlock on first user gesture
    this.setupUnlockListeners();

    // Automatic resume and recovery when returning from background / home screen
    this.setupVisibilityListeners();

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
        this.tickSoundEnabled = parsed.tickSoundEnabled ?? true;
        this.halfwayAlertEnabled = parsed.halfwayAlertEnabled ?? true;
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
        audioMixingMode: this.audioMixingMode,
        tickSoundEnabled: this.tickSoundEnabled,
        halfwayAlertEnabled: this.halfwayAlertEnabled
      }));
    } catch (e) {
      console.warn('Failed to save audio settings', e);
    }
    this.updateMasterGain();
  }

  updateMasterGain() {
    if (this.masterGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : this.volume * 1.5; // 1.5x acoustic loudness boost
      try {
        this.masterGain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
      } catch (e) {}
    }
  }

  initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        try {
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
        } catch (err) {
          console.warn('Failed to create AudioContext:', err);
        }
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        this.isUnlocked = true;
      }).catch(() => {});
    } else if (this.ctx && this.ctx.state === 'running') {
      this.isUnlocked = true;
    }

    this.configureAudioSession();
  }

  /**
   * Rebuilds AudioContext from scratch if it was interrupted or closed by mobile OS
   */
  rebuildContext() {
    try {
      if (this.ctx) {
        this.ctx.close().catch(() => {});
      }
    } catch (e) {}
    this.ctx = null;
    this.compressor = null;
    this.masterGain = null;
    this.initContext();
    this.playSilentPulse();
  }

  /**
   * Ensures Web Audio context is running WITHOUT interrupting ongoing speechSynthesis.
   * Safe to call on 1-second ticks and button taps.
   */
  ensureAudioRunning() {
    if (!this.ctx) {
      this.initContext();
      return;
    }
    if (this.ctx.state === 'interrupted' || this.ctx.state === 'closed') {
      this.rebuildContext();
      return;
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        this.isUnlocked = true;
      }).catch(() => {
        this.rebuildContext();
      });
    }
  }

  /**
   * Seamlessly un-suspends AudioContext when returning from background / lock screen.
   */
  async resumeContext(resetSpeech = false) {
    this.configureAudioSession();

    if (!this.ctx) {
      this.initContext();
    } else if (this.ctx.state === 'interrupted' || this.ctx.state === 'closed') {
      this.rebuildContext();
      return;
    } else if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
        this.isUnlocked = true;
      } catch (err) {
        console.warn('Failed to resume AudioContext, rebuilding:', err);
        this.rebuildContext();
        return;
      }
    }

    if (resetSpeech && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.resume();
      } catch (e) {}
    }

    // Emit micro silent pulse to instantly reactivate mobile hardware audio buffer
    this.playSilentPulse();
  }

  /**
   * Plays a 1ms micro silent oscillator to immediately wake up hardware audio codecs
   */
  playSilentPulse() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.00001, this.ctx.currentTime);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.001);
    } catch (e) {}
  }

  setupUnlockListeners() {
    const unlock = () => {
      this.resumeContext();
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

  setupVisibilityListeners() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.resumeContext(true);
      }
    });

    window.addEventListener('pageshow', () => this.resumeContext(true));
    window.addEventListener('focus', () => this.resumeContext(true));

    window.addEventListener('touchstart', () => this.ensureAudioRunning(), { passive: true });
    window.addEventListener('pointerdown', () => this.ensureAudioRunning(), { passive: true });
  }

  /**
   * 1-Second Tick-Tock Cue ("똑-딱")
   * Gentle, crisp mechanical watch / woodblock tick alternating pitch on even/odd seconds
   * so users clearly feel time flowing without ear fatigue or clashing with background music.
   */
  playSecondTick(secValue = 0) {
    if (this.isMuted || this.soundMode === 'mute' || !this.tickSoundEnabled) return;
    this.ensureAudioRunning();
    if (!this.ctx || !this.compressor) return;

    try {
      const t = this.ctx.currentTime;
      const isTick = Math.round(secValue) % 2 === 0; // Alternating Tick (똑) / Tock (딱)

      // Primary crisp woody click
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isTick ? 1180 : 920, t);
      osc.frequency.exponentialRampToValueAtTime(isTick ? 340 : 260, t + 0.026);

      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.032);

      osc.connect(gain);
      gain.connect(this.compressor);
      osc.start(t);
      osc.stop(t + 0.035);

      // Subtle high transient for clarity on mobile speakers
      const clickOsc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      clickOsc.type = 'sine';
      clickOsc.frequency.setValueAtTime(isTick ? 2350 : 1850, t);
      clickGain.gain.setValueAtTime(0.09, t);
      clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.014);

      clickOsc.connect(clickGain);
      clickGain.connect(this.compressor);
      clickOsc.start(t);
      clickOsc.stop(t + 0.016);
    } catch (e) {}
  }

  /**
   * Prepare Countdown Start ("준비")
   */
  playPrepareStart(firstExerciseName = '') {
    if (this.isMuted || this.soundMode === 'mute') return;
    this.ensureAudioRunning();

    if (this.ctx && this.compressor && this.soundMode !== 'voice') {
      try {
        const t = this.ctx.currentTime;
        [659.25, 880].forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const startAt = t + idx * 0.11;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, startAt);
          gain.gain.setValueAtTime(0.55, startAt);
          gain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.18);
          osc.connect(gain);
          gain.connect(this.compressor);
          osc.start(startAt);
          osc.stop(startAt + 0.2);
        });
      } catch (e) {}
    }

    if (this.soundMode === 'all' || this.soundMode === 'voice') {
      const msg = firstExerciseName ? `준비. 첫 동작, ${firstExerciseName}` : '준비';
      setTimeout(() => this.speakText(msg, 1.25), 60);
    }
  }

  /**
   * 3, 2, 1 Countdown
   * Dual-tone resonant beep + clear Korean voice count ("3초", "2초", "1초")
   */
  playCountdownBeep(count = 3) {
    if (this.isMuted || this.soundMode === 'mute') return;
    this.ensureAudioRunning();

    // 1. Play dual-tone sports buzzer beep
    if (this.ctx && this.compressor && this.soundMode !== 'voice') {
      try {
        const t = this.ctx.currentTime;
        const freq = count === 1 ? 1046.50 : 880; // C6 for 1, A5 for 3 & 2

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
      } catch (err) {
        console.warn('Countdown beep audio error:', err);
      }
    }

    // 2. Speak voice countdown in Korean ("3초", "2초", "1초")
    if (this.soundMode === 'all' || this.soundMode === 'voice') {
      const koreanCounts = { 3: '3초', 2: '2초', 1: '1초' };
      const voiceText = koreanCounts[count] || `${count}초`;
      this.speakText(voiceText, 1.35);
    }
  }

  /**
   * WORK Interval Start / Round Start ("시작!" + optional exercise name + 링 벨)
   */
  playWorkStart(exerciseName = '', isLastRound = false) {
    if (this.isMuted || this.soundMode === 'mute') return;
    this.ensureAudioRunning();

    if (this.soundMode !== 'voice') {
      this.playBoxingBell();
    }

    if (this.soundMode === 'all' || this.soundMode === 'voice') {
      let text = '시작';
      if (isLastRound && exerciseName) {
        text = `마지막 라운드, ${exerciseName}`;
      } else if (isLastRound) {
        text = '마지막 라운드, 시작';
      } else if (exerciseName) {
        text = `시작, ${exerciseName}`;
      }
      setTimeout(() => {
        this.speakText(text, 1.28);
      }, 50);
    }
  }

  /**
   * Halfway Point Cue ("절반 경과")
   */
  playHalfway() {
    if (this.isMuted || this.soundMode === 'mute' || !this.halfwayAlertEnabled) return;
    this.ensureAudioRunning();

    if (this.ctx && this.compressor && this.soundMode !== 'voice') {
      try {
        const t = this.ctx.currentTime;
        [0, 0.1].forEach((offset) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(783.99, t + offset); // G5 double pip
          gain.gain.setValueAtTime(0.5, t + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.08);
          osc.connect(gain);
          gain.connect(this.compressor);
          osc.start(t + offset);
          osc.stop(t + offset + 0.09);
        });
      } catch (e) {}
    }

    if (this.soundMode === 'all' || this.soundMode === 'voice') {
      setTimeout(() => this.speakText('절반 경과', 1.3), 80);
    }
  }

  /**
   * Authentic Boxing Ring Bell Synthesizer (Metallic Clang & Rich Reverb)
   */
  playBoxingBell() {
    this.ensureAudioRunning();
    if (!this.ctx || !this.compressor) return;
    try {
      const t = this.ctx.currentTime;
      const harmonics = [587.33, 880, 1174.66, 1760];
      const gains = [0.9, 0.65, 0.45, 0.28];

      harmonics.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(gains[idx], t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);

        osc.connect(gain);
        gain.connect(this.compressor);

        osc.start(t);
        osc.stop(t + 1.45);
      });
    } catch (err) {
      console.warn('Boxing bell audio error:', err);
    }
  }

  /**
   * Boxing 10-Second Warning Wood Clapper (스내피한 타격음)
   */
  playWarningClapper() {
    if (this.isMuted || this.soundMode === 'mute') return;
    this.ensureAudioRunning();
    if (!this.ctx || !this.compressor) return;

    try {
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
    } catch (err) {
      console.warn('Warning clapper audio error:', err);
    }
  }

  /**
   * Round End Double Bell + "휴식"
   */
  playRoundEndBell() {
    if (this.isMuted || this.soundMode === 'mute') return;
    this.ensureAudioRunning();
    if (this.soundMode !== 'voice') {
      this.playBoxingBell();
      setTimeout(() => {
        this.playBoxingBell();
      }, 280);
    }

    if (this.soundMode === 'all' || this.soundMode === 'voice') {
      setTimeout(() => {
        this.speakText('휴식', 1.25);
      }, 350);
    }
  }

  /**
   * REST Interval Start - Descending tone + "휴식!" (+ next exercise preview)
   */
  playRestStart(nextExerciseName = '') {
    if (this.isMuted || this.soundMode === 'mute') return;
    this.ensureAudioRunning();

    if (this.ctx && this.compressor && this.soundMode !== 'voice') {
      try {
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
      } catch (err) {
        console.warn('Rest start tone error:', err);
      }
    }

    if (this.soundMode === 'all' || this.soundMode === 'voice') {
      const msg = nextExerciseName ? `휴식. 다음 동작, ${nextExerciseName}` : '휴식';
      setTimeout(() => {
        this.speakText(msg, 1.22);
      }, 80);
    }
  }

  /**
   * Set Rest Start (Between sets)
   */
  playSetRestStart(nextExerciseName = '') {
    if (this.isMuted || this.soundMode === 'mute') return;
    this.ensureAudioRunning();

    if (this.soundMode !== 'voice') {
      // Play descending tone without duplicate speech
      if (this.ctx && this.compressor) {
        try {
          const t = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(523.25, t);
          osc.frequency.exponentialRampToValueAtTime(349.23, t + 0.5);
          gain.gain.setValueAtTime(0.85, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
          osc.connect(gain);
          gain.connect(this.compressor);
          osc.start(t);
          osc.stop(t + 0.56);
        } catch (e) {}
      }
    }

    if (this.soundMode === 'all' || this.soundMode === 'voice') {
      const msg = nextExerciseName ? `세트 휴식. 다음 동작, ${nextExerciseName}` : '세트 휴식';
      setTimeout(() => {
        this.speakText(msg, 1.22);
      }, 100);
    }
  }

  /**
   * Weight Mode: Set Completed -> Rest Started
   */
  playWeightRestStart(completedSet, restSec) {
    if (this.isMuted || this.soundMode === 'mute') return;
    this.ensureAudioRunning();

    if (this.ctx && this.compressor && this.soundMode !== 'voice') {
      try {
        const t = this.ctx.currentTime;
        [523.25, 659.25].forEach((freq, i) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const st = t + i * 0.09;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, st);
          gain.gain.setValueAtTime(0.65, st);
          gain.gain.exponentialRampToValueAtTime(0.001, st + 0.22);
          osc.connect(gain);
          gain.connect(this.compressor);
          osc.start(st);
          osc.stop(st + 0.24);
        });
      } catch (e) {}
    }

    if (this.soundMode === 'all' || this.soundMode === 'voice') {
      const m = Math.floor(restSec / 60);
      const s = restSec % 60;
      const durText = m > 0 ? (s > 0 ? `${m}분 ${s}초` : `${m}분`) : `${s}초`;
      setTimeout(() => {
        this.speakText(`${completedSet}세트 완료. ${durText} 휴식`, 1.25);
      }, 80);
    }
  }

  /**
   * Weight Mode: Rest Finished -> Ready for Next Set
   */
  playWeightNextSetReady(nextSetNum) {
    if (this.isMuted || this.soundMode === 'mute') return;
    this.ensureAudioRunning();

    if (this.soundMode !== 'voice') {
      this.playBoxingBell();
    }

    if (this.soundMode === 'all' || this.soundMode === 'voice') {
      setTimeout(() => {
        this.speakText(`휴식 종료! ${nextSetNum}세트 시작하세요`, 1.25);
      }, 90);
    }
  }

  /**
   * Workout Complete Fanfare & Cheerful Message
   */
  playComplete() {
    if (this.isMuted || this.soundMode === 'mute') return;
    this.ensureAudioRunning();

    if (this.ctx && this.compressor && this.soundMode !== 'voice') {
      try {
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
      } catch (err) {
        console.warn('Complete fanfare audio error:', err);
      }
    }

    if (this.soundMode === 'all' || this.soundMode === 'voice') {
      setTimeout(() => {
        this.speakText('운동 완료! 수고하셨습니다!', 1.15);
      }, 750);
    }
  }

  /**
   * Quick tactile tick when tapping buttons
   */
  playTap() {
    if (this.isMuted || this.soundMode === 'mute') return;
    this.ensureAudioRunning();
    if (!this.ctx || !this.compressor) return;

    try {
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
    } catch (e) {}
  }

  /**
   * Web Speech API - loud, high-priority Korean voice synthesis
   */
  speakText(text, rate = 1.3) {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.resume();
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = rate;
      utterance.pitch = 1.05;
      utterance.volume = 1.0;

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
