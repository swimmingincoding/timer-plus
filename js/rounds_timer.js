/**
 * TimerPlus Dedicated Boxing & Combat Round Timer Engine
 * Includes authentic 10-second warning clapper, round bells, and 1-second tick cues.
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
    this.phase = 'round'; // 'prepare', 'round', 'rest', 'finished'
    this.currentRound = 1;
    this.phaseDuration = 180;
    this.phaseRemaining = 180;

    this.warningFired = false;
    this.lastBeepSecond = null;
    this.lastTickSecond = null;
    this.timerInterval = null;
    this.lastTimestamp = null;

    this.onTick = null;
    this.onPhaseChange = null;
    this.onWarning = null;
    this.onCountdownBeep = null;
    this.onSecondTick = null;
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
    this.lastTickSecond = null;

    this.phase = 'round';
    this.phaseDuration = this.config.roundTime;
    this.phaseRemaining = this.config.roundTime;

    this.notifyTick();
  }

  start() {
    if (this.status === 'running') return;
    if (this.status === 'paused') {
      this.resume();
      return;
    }

    if (this.status === 'finished' || this.status === 'idle') {
      this.currentRound = 1;
      this.warningFired = false;
      this.lastBeepSecond = null;

      if (this.config.prepare > 0) {
        this.phase = 'prepare';
        this.phaseDuration = this.config.prepare;
        this.phaseRemaining = this.config.prepare;
      } else {
        this.phase = 'round';
        this.phaseDuration = this.config.roundTime;
        this.phaseRemaining = this.config.roundTime;
      }
      this.lastTickSecond = Math.ceil(this.phaseRemaining);
    }

    this.status = 'running';
    this.lastTimestamp = Date.now();

    if (this.timerInterval) clearInterval(this.timerInterval);
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

  resume() {
    if (this.status !== 'paused') return;
    this.status = 'running';
    this.lastTimestamp = Date.now();

    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.tick();
    }, 50);

    this.notifyTick();
  }

  syncTime() {
    if (this.status === 'running') {
      this.tick();
    }
  }

  togglePlay() {
    if (this.status === 'running') {
      this.pause();
    } else if (this.status === 'paused') {
      this.resume();
    } else {
      this.start();
    }
  }

  skipNext() {
    if (this.status === 'idle' || this.status === 'finished') return;
    this.advance(false);
  }

  skipPrev() {
    if (this.status === 'idle' || this.status === 'finished') return;

    if (this.phaseDuration - this.phaseRemaining > 3) {
      this.phaseRemaining = this.phaseDuration;
      this.warningFired = false;
      this.lastBeepSecond = null;
      this.lastTickSecond = Math.ceil(this.phaseRemaining);
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
    this.lastBeepSecond = null;
    this.lastTickSecond = Math.ceil(this.phaseRemaining);

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

    const now = Date.now();
    let delta = (now - this.lastTimestamp) / 1000;
    this.lastTimestamp = now;

    if (delta <= 0) return;

    const isLongBackgroundCatchup = delta > 2.5;
    const prevPhase = this.phase;
    const prevRound = this.currentRound;

    while (delta > 0 && this.status === 'running') {
      if (this.phaseRemaining > delta) {
        this.phaseRemaining -= delta;

        if (!isLongBackgroundCatchup) {
          const ceilSec = Math.ceil(this.phaseRemaining);
          let warningJustFired = false;

          // 10s Warning Clapper during round
          if (this.phase === 'round' && this.config.warningTime > 0) {
            if (this.phaseRemaining <= this.config.warningTime && !this.warningFired) {
              this.warningFired = true;
              warningJustFired = true;
              this.lastTickSecond = ceilSec;
              if (this.onWarning) {
                this.onWarning(Math.round(this.phaseRemaining));
              }
            }
          }

          // 3, 2, 1 Countdown Beeps & Voice
          if (ceilSec <= 3 && ceilSec >= 1 && ceilSec !== this.lastBeepSecond) {
            this.lastBeepSecond = ceilSec;
            this.lastTickSecond = ceilSec;
            if (this.onCountdownBeep) {
              this.onCountdownBeep(ceilSec, this.phase);
            }
          } else if (
            !warningJustFired &&
            ceilSec > 3 &&
            ceilSec < Math.ceil(this.phaseDuration) &&
            ceilSec !== this.lastTickSecond
          ) {
            this.lastTickSecond = ceilSec;
            if (this.onSecondTick) {
              this.onSecondTick(ceilSec, this.phase);
            }
          }
        }
        delta = 0;
      } else {
        delta -= this.phaseRemaining;
        this.phaseRemaining = 0;
        this.advance(isLongBackgroundCatchup);
        if (this.status === 'finished') {
          break;
        }
      }
    }

    if (
      isLongBackgroundCatchup &&
      this.status === 'running' &&
      (this.phase !== prevPhase || this.currentRound !== prevRound)
    ) {
      if (this.onPhaseChange) {
        this.onPhaseChange({
          phase: this.phase,
          round: this.currentRound,
          totalRounds: this.config.totalRounds
        });
      }
    }

    this.notifyTick();
  }

  advance(silent = false) {
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
    this.lastTickSecond = Math.ceil(this.phaseRemaining);

    if (!silent && this.onPhaseChange) {
      this.onPhaseChange({
        phase: this.phase,
        round: this.currentRound,
        totalRounds: this.config.totalRounds
      });
    }

    if (!silent) {
      this.notifyTick();
    }
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
