/**
 * TimerPlus Dedicated Boxing & Combat Round Timer Engine
 * Includes authentic 10-second warning clapper and round bells.
 */
class BoxingRoundTimer {
  constructor() {
    this.config = {
      roundTime: 180, // 3:00
      restTime: 60,   // 1:00
      totalRounds: 5,
      warningTime: 10,
      prepare: 10
    };

    this.status = 'idle'; // 'idle', 'running', 'paused', 'finished'
    this.phase = 'prepare'; // 'prepare', 'round', 'rest', 'finished'
    this.currentRound = 1;
    this.phaseDuration = 10;
    this.phaseRemaining = 10;
    
    this.warningFired = false;
    this.lastBeepSecond = null;
    this.timerInterval = null;
    this.lastTimestamp = null;

    this.onTick = null;
    this.onPhaseChange = null;
    this.onWarning = null;
    this.onComplete = null;
  }

  setConfig(cfg) {
    this.config = { ...this.config, ...cfg };
    this.reset();
  }

  reset() {
    this.pause();
    this.status = 'idle';
    this.currentRound = 1;
    this.warningFired = false;
    this.lastBeepSecond = null;

    if (this.config.prepare > 0) {
      this.phase = 'prepare';
      this.phaseDuration = this.config.prepare;
    } else {
      this.phase = 'round';
      this.phaseDuration = this.config.roundTime;
    }
    this.phaseRemaining = this.phaseDuration;

    this.notifyTick();
  }

  start() {
    if (this.status === 'running') return;
    if (this.status === 'finished' || this.status === 'idle') {
      this.reset();
    }

    this.status = 'running';
    this.lastTimestamp = performance.now();

    this.timerInterval = setInterval(() => {
      this.tick();
    }, 50);

    if (this.onPhaseChange) {
      this.onPhaseChange({
        phase: this.phase,
        round: this.currentRound,
        totalRounds: this.config.totalRounds
      });
    }

    this.notifyTick();
  }

  pause() {
    if (this.status !== 'running') return;
    this.status = 'paused';
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.notifyTick();
  }

  togglePlay() {
    if (this.status === 'running') {
      this.pause();
    } else {
      this.start();
    }
  }

  skipNext() {
    if (this.status === 'idle' || this.status === 'finished') return;
    this.advance();
  }

  skipPrev() {
    if (this.status === 'idle' || this.status === 'finished') return;

    if (this.phaseDuration - this.phaseRemaining > 3) {
      this.phaseRemaining = this.phaseDuration;
      this.warningFired = false;
      this.notifyTick();
      return;
    }

    if (this.phase === 'rest') {
      this.phase = 'round';
      this.phaseDuration = this.config.roundTime;
    } else if (this.phase === 'round') {
      if (this.currentRound > 1) {
        this.currentRound--;
        this.phase = 'rest';
        this.phaseDuration = this.config.restTime;
      } else if (this.config.prepare > 0) {
        this.phase = 'prepare';
        this.phaseDuration = this.config.prepare;
      }
    }
    this.phaseRemaining = this.phaseDuration;
    this.warningFired = false;

    if (this.onPhaseChange) {
      this.onPhaseChange({
        phase: this.phase,
        round: this.currentRound,
        totalRounds: this.config.totalRounds
      });
    }
    this.notifyTick();
  }

  tick() {
    if (this.status !== 'running') return;

    const now = performance.now();
    const delta = (now - this.lastTimestamp) / 1000;
    this.lastTimestamp = now;

    this.phaseRemaining -= delta;

    // 10s Warning Clapper during round
    if (this.phase === 'round' && this.config.warningTime > 0) {
      if (this.phaseRemaining <= this.config.warningTime && !this.warningFired) {
        this.warningFired = true;
        if (this.onWarning) {
          this.onWarning(Math.round(this.phaseRemaining));
        }
      }
    }

    // 3, 2, 1 Countdown Beeps in prepare or rest
    const ceilSec = Math.ceil(this.phaseRemaining);
    if ((this.phase === 'prepare' || this.phase === 'rest') && ceilSec <= 3 && ceilSec >= 1 && ceilSec !== this.lastBeepSecond) {
      this.lastBeepSecond = ceilSec;
      if (this.onCountdownBeep) {
        this.onCountdownBeep(ceilSec);
      }
    }

    if (this.phaseRemaining <= 0) {
      this.advance();
      return;
    }

    this.notifyTick();
  }

  advance() {
    this.warningFired = false;
    this.lastBeepSecond = null;

    if (this.phase === 'prepare') {
      this.phase = 'round';
      this.phaseDuration = this.config.roundTime;
    } else if (this.phase === 'round') {
      if (this.currentRound < this.config.totalRounds) {
        this.phase = 'rest';
        this.phaseDuration = this.config.restTime;
      } else {
        this.finish();
        return;
      }
    } else if (this.phase === 'rest') {
      this.currentRound++;
      this.phase = 'round';
      this.phaseDuration = this.config.roundTime;
    }

    this.phaseRemaining = this.phaseDuration;

    if (this.onPhaseChange) {
      this.onPhaseChange({
        phase: this.phase,
        round: this.currentRound,
        totalRounds: this.config.totalRounds
      });
    }

    this.notifyTick();
  }

  finish() {
    this.status = 'finished';
    this.phase = 'finished';
    this.phaseRemaining = 0;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    if (this.onComplete) {
      this.onComplete();
    }
    this.notifyTick();
  }

  notifyTick() {
    if (!this.onTick) return;

    const remainingCeil = Math.max(0, Math.ceil(this.phaseRemaining));
    const progress = this.phaseDuration > 0
      ? (this.phaseDuration - Math.max(0, this.phaseRemaining)) / this.phaseDuration
      : 1;

    this.onTick({
      status: this.status,
      phase: this.phase,
      round: this.currentRound,
      totalRounds: this.config.totalRounds,
      remaining: remainingCeil,
      remainingPrecise: Math.max(0, this.phaseRemaining),
      duration: this.phaseDuration,
      progress
    });
  }
}

window.BoxingRoundTimer = BoxingRoundTimer;
