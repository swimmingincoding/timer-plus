/**
 * TimerPlus Core Timer Engine
 * High-precision timestamp delta timer supporting Intervals, Tabata, Boxing rounds, and HIIT.
 */
class WorkoutTimer {
  constructor() {
    this.config = {
      id: 'default',
      name: '타바타 (기본)',
      prepare: 10,
      work: 20,
      rest: 10,
      rounds: 8,
      sets: 1,
      setRest: 60,
      cooldown: 0
    };

    // State
    this.status = 'idle'; // 'idle', 'running', 'paused', 'finished'
    this.currentPhase = 'prepare'; // 'prepare', 'work', 'rest', 'setRest', 'cooldown'
    this.currentRound = 1;
    this.currentSet = 1;

    // Timing tracking
    this.phaseDuration = 0;
    this.phaseRemaining = 0;
    this.phaseStartTime = 0;
    this.totalDuration = 0;
    this.totalElapsed = 0;
    this.lastTimestamp = null;
    this.timerInterval = null;
    this.lastBeepSecond = null;

    // Callbacks
    this.onTick = null;
    this.onPhaseChange = null;
    this.onCountdownBeep = null;
    this.onComplete = null;
  }

  setConfig(config) {
    this.config = { ...this.config, ...config };
    this.reset();
  }

  calculateTotalDuration() {
    const c = this.config;
    let total = c.prepare + c.cooldown;
    for (let s = 1; s <= c.sets; s++) {
      for (let r = 1; r <= c.rounds; r++) {
        total += c.work;
        // Rest between rounds, except the last round of the set
        if (r < c.rounds) {
          total += c.rest;
        }
      }
      // Set rest between sets, except after the last set
      if (s < c.sets) {
        total += c.setRest;
      }
    }
    return total;
  }

  reset() {
    this.pause();
    this.status = 'idle';
    this.currentRound = 1;
    this.currentSet = 1;
    this.totalDuration = this.calculateTotalDuration();
    this.totalElapsed = 0;

    // Start with prepare if > 0, else work
    if (this.config.prepare > 0) {
      this.currentPhase = 'prepare';
      this.phaseDuration = this.config.prepare;
    } else {
      this.currentPhase = 'work';
      this.phaseDuration = this.config.work;
    }

    this.phaseRemaining = this.phaseDuration;
    this.lastBeepSecond = null;

    this.notifyTick();
  }

  start() {
    if (this.status === 'running') return;

    if (this.status === 'idle' || this.status === 'finished') {
      this.reset();
    }

    this.status = 'running';
    this.lastTimestamp = performance.now();

    this.timerInterval = setInterval(() => {
      this.tick();
    }, 50);

    if (this.onPhaseChange) {
      this.onPhaseChange(this.getPhaseInfo());
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
    this.lastTimestamp = performance.now();

    this.timerInterval = setInterval(() => {
      this.tick();
    }, 50);

    this.notifyTick();
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

  tick() {
    if (this.status !== 'running') return;

    const now = performance.now();
    const delta = (now - this.lastTimestamp) / 1000;
    this.lastTimestamp = now;

    this.phaseRemaining -= delta;
    this.totalElapsed += delta;

    if (this.totalElapsed > this.totalDuration) {
      this.totalElapsed = this.totalDuration;
    }

    // Check countdown beeps (3, 2, 1)
    const ceilSec = Math.ceil(this.phaseRemaining);
    if (ceilSec <= 3 && ceilSec >= 1 && ceilSec !== this.lastBeepSecond) {
      this.lastBeepSecond = ceilSec;
      if (this.onCountdownBeep) {
        this.onCountdownBeep(ceilSec);
      }
    }

    // Transition to next phase when current phase completes
    if (this.phaseRemaining <= 0) {
      this.advanceToNextPhase();
      return;
    }

    this.notifyTick();
  }

  advanceToNextPhase() {
    this.lastBeepSecond = null;
    const prevPhase = this.currentPhase;
    const c = this.config;

    if (this.currentPhase === 'prepare') {
      this.currentPhase = 'work';
      this.phaseDuration = c.work;
    } else if (this.currentPhase === 'work') {
      const isLastRoundOfSet = this.currentRound >= c.rounds;
      const isLastSet = this.currentSet >= c.sets;

      if (!isLastRoundOfSet) {
        // Normal rest between rounds
        this.currentPhase = 'rest';
        this.phaseDuration = c.rest;
      } else if (!isLastSet) {
        // Set break
        this.currentPhase = 'setRest';
        this.phaseDuration = c.setRest;
      } else if (c.cooldown > 0) {
        // Final cooldown
        this.currentPhase = 'cooldown';
        this.phaseDuration = c.cooldown;
      } else {
        // Workout complete
        this.finishWorkout();
        return;
      }
    } else if (this.currentPhase === 'rest') {
      this.currentRound++;
      this.currentPhase = 'work';
      this.phaseDuration = c.work;
    } else if (this.currentPhase === 'setRest') {
      this.currentSet++;
      this.currentRound = 1;
      this.currentPhase = 'work';
      this.phaseDuration = c.work;
    } else if (this.currentPhase === 'cooldown') {
      this.finishWorkout();
      return;
    }

    this.phaseRemaining = this.phaseDuration;

    if (this.onPhaseChange) {
      this.onPhaseChange(this.getPhaseInfo(prevPhase));
    }

    this.notifyTick();
  }

  skipNext() {
    if (this.status === 'idle' || this.status === 'finished') return;
    this.phaseRemaining = 0;
    this.advanceToNextPhase();
  }

  skipPrev() {
    if (this.status === 'idle' || this.status === 'finished') return;

    // If more than 3 seconds elapsed in current phase, restart current phase
    if (this.phaseDuration - this.phaseRemaining > 3) {
      this.phaseRemaining = this.phaseDuration;
      this.notifyTick();
      return;
    }

    // Otherwise go to previous phase
    this.revertToPreviousPhase();
  }

  revertToPreviousPhase() {
    const c = this.config;

    if (this.currentPhase === 'cooldown') {
      this.currentPhase = 'work';
      this.currentSet = c.sets;
      this.currentRound = c.rounds;
      this.phaseDuration = c.work;
    } else if (this.currentPhase === 'setRest') {
      this.currentPhase = 'work';
      this.currentRound = c.rounds;
      this.phaseDuration = c.work;
    } else if (this.currentPhase === 'rest') {
      this.currentPhase = 'work';
      this.phaseDuration = c.work;
    } else if (this.currentPhase === 'work') {
      if (this.currentRound > 1) {
        this.currentRound--;
        this.currentPhase = 'rest';
        this.phaseDuration = c.rest;
      } else if (this.currentSet > 1) {
        this.currentSet--;
        this.currentRound = c.rounds;
        this.currentPhase = 'setRest';
        this.phaseDuration = c.setRest;
      } else if (c.prepare > 0) {
        this.currentPhase = 'prepare';
        this.phaseDuration = c.prepare;
      }
    }

    this.phaseRemaining = this.phaseDuration;
    this.lastBeepSecond = null;
    if (this.onPhaseChange) {
      this.onPhaseChange(this.getPhaseInfo());
    }
    this.notifyTick();
  }

  finishWorkout() {
    this.status = 'finished';
    this.currentPhase = 'finished';
    this.phaseRemaining = 0;
    this.totalElapsed = this.totalDuration;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    if (this.onComplete) {
      this.onComplete({
        totalElapsed: Math.round(this.totalDuration)
      });
    }

    this.notifyTick();
  }

  getNextPhaseInfo() {
    const c = this.config;
    if (this.currentPhase === 'prepare') {
      return { phase: 'work', label: '운동 시작', duration: c.work };
    }
    if (this.currentPhase === 'work') {
      if (this.currentRound < c.rounds) {
        return { phase: 'rest', label: '휴식', duration: c.rest };
      }
      if (this.currentSet < c.sets) {
        return { phase: 'setRest', label: '세트 휴식', duration: c.setRest };
      }
      if (c.cooldown > 0) {
        return { phase: 'cooldown', label: '쿨다운', duration: c.cooldown };
      }
      return { phase: 'finished', label: '운동 완료', duration: 0 };
    }
    if (this.currentPhase === 'rest' || this.currentPhase === 'setRest') {
      return { phase: 'work', label: '운동', duration: c.work };
    }
    return { phase: 'finished', label: '완료', duration: 0 };
  }

  getPhaseInfo(prevPhase = null) {
    const next = this.getNextPhaseInfo();
    return {
      phase: this.currentPhase,
      prevPhase,
      round: this.currentRound,
      rounds: this.config.rounds,
      set: this.currentSet,
      sets: this.config.sets,
      duration: this.phaseDuration,
      nextPhase: next.phase,
      nextLabel: next.label,
      nextDuration: next.duration
    };
  }

  notifyTick() {
    if (!this.onTick) return;

    const remainingCeil = Math.max(0, Math.ceil(this.phaseRemaining));
    const totalRemaining = Math.max(0, Math.ceil(this.totalDuration - this.totalElapsed));
    const phaseProgress = this.phaseDuration > 0
      ? (this.phaseDuration - Math.max(0, this.phaseRemaining)) / this.phaseDuration
      : 1;

    const totalProgress = this.totalDuration > 0
      ? this.totalElapsed / this.totalDuration
      : 1;

    const nextInfo = this.getNextPhaseInfo();

    this.onTick({
      status: this.status,
      phase: this.currentPhase,
      phaseRemaining: remainingCeil,
      phaseRemainingPrecise: Math.max(0, this.phaseRemaining),
      phaseDuration: this.phaseDuration,
      phaseProgress,
      round: this.currentRound,
      rounds: this.config.rounds,
      set: this.currentSet,
      sets: this.config.sets,
      totalElapsed: Math.floor(this.totalElapsed),
      totalRemaining,
      totalDuration: Math.round(this.totalDuration),
      totalProgress,
      nextInfo
    });
  }
}

window.WorkoutTimer = WorkoutTimer;
