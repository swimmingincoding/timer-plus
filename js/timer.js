/**
 * TimerPlus Core Timer Engine
 * High-precision timestamp delta timer supporting Intervals, Tabata, Home Circuits, and HIIT.
 * Features per-round exercise names, +15s/-10s live phase adjustments, 1-second tick cues,
 * halfway alerts, accurate skip progress recalculation, and background catch-up protection.
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
      cooldown: 0,
      exercises: []
    };

    // State
    this.status = 'idle'; // 'idle', 'running', 'paused', 'finished'
    this.currentPhase = 'work'; // 'prepare', 'work', 'rest', 'setRest', 'cooldown', 'finished'
    this.currentRound = 1;
    this.currentSet = 1;

    // Timing tracking
    this.phaseDuration = 0;
    this.phaseRemaining = 0;
    this.totalDuration = 0;
    this.totalElapsed = 0;
    this.extraAddedTime = 0;
    this.lastTimestamp = null;
    this.timerInterval = null;
    this.lastBeepSecond = null;
    this.lastTickSecond = null;
    this.halfwayFired = false;

    // Callbacks
    this.onTick = null;
    this.onPhaseChange = null;
    this.onCountdownBeep = null;
    this.onSecondTick = null;
    this.onHalfway = null;
    this.onComplete = null;
  }

  setConfig(config) {
    this.config = {
      ...this.config,
      ...config,
      exercises: Array.isArray(config.exercises) ? [...config.exercises] : []
    };
    this.reset();
  }

  getExerciseName(roundNum = this.currentRound) {
    const list = this.config.exercises;
    if (!Array.isArray(list) || list.length === 0) return '';
    const nonEmpty = list.some(item => item && String(item).trim().length > 0);
    if (!nonEmpty) return '';
    const idx = (Math.max(1, roundNum) - 1) % list.length;
    return (list[idx] || '').trim();
  }

  calculateTotalDuration() {
    const c = this.config;
    let total = (c.prepare || 0) + (c.cooldown || 0);
    for (let s = 1; s <= c.sets; s++) {
      for (let r = 1; r <= c.rounds; r++) {
        total += c.work;
        if (r < c.rounds) {
          total += c.rest;
        }
      }
      if (s < c.sets) {
        total += c.setRest;
      }
    }
    return total;
  }

  /**
   * Computes exact canonical elapsed time up to the current state
   * so skipping forward/backward keeps overall progress & remaining time accurate.
   */
  recalculateProgressFromState() {
    const c = this.config;
    const baseTotal = this.calculateTotalDuration();
    let elapsedBeforePhase = 0;

    if (this.currentPhase === 'prepare') {
      elapsedBeforePhase = 0;
    } else if (this.currentPhase === 'finished') {
      this.totalDuration = baseTotal;
      this.totalElapsed = baseTotal;
      return;
    } else {
      elapsedBeforePhase += (c.prepare || 0);

      // Add completed full sets before currentSet
      for (let s = 1; s < this.currentSet; s++) {
        elapsedBeforePhase += c.rounds * c.work + Math.max(0, c.rounds - 1) * c.rest;
        elapsedBeforePhase += c.setRest;
      }

      if (this.currentPhase === 'cooldown') {
        elapsedBeforePhase += c.rounds * c.work + Math.max(0, c.rounds - 1) * c.rest;
      } else {
        // Add completed rounds in currentSet before currentRound
        for (let r = 1; r < this.currentRound; r++) {
          elapsedBeforePhase += c.work + c.rest;
        }
        if (this.currentPhase === 'rest' || this.currentPhase === 'setRest') {
          elapsedBeforePhase += c.work;
        }
      }
    }

    const elapsedInPhase = Math.max(0, this.phaseDuration - this.phaseRemaining);
    this.extraAddedTime = 0;
    this.totalDuration = baseTotal;
    this.totalElapsed = Math.min(this.totalDuration, elapsedBeforePhase + elapsedInPhase);
  }

  reset() {
    this.pause();
    this.status = 'idle';
    this.currentRound = 1;
    this.currentSet = 1;
    this.extraAddedTime = 0;
    this.totalDuration = this.calculateTotalDuration();
    this.totalElapsed = 0;

    // In idle state, display WORK interval so user immediately sees their workout time
    this.currentPhase = 'work';
    this.phaseDuration = this.config.work;
    this.phaseRemaining = this.config.work;
    this.lastBeepSecond = null;
    this.lastTickSecond = null;
    this.halfwayFired = false;

    this.notifyTick();
  }

  start() {
    if (this.status === 'running') return;
    if (this.status === 'paused') {
      this.resume();
      return;
    }

    if (this.status === 'idle' || this.status === 'finished') {
      this.currentRound = 1;
      this.currentSet = 1;
      this.extraAddedTime = 0;
      this.totalDuration = this.calculateTotalDuration();
      this.totalElapsed = 0;
      this.lastBeepSecond = null;
      this.halfwayFired = false;

      if (this.config.prepare > 0) {
        this.currentPhase = 'prepare';
        this.phaseDuration = this.config.prepare;
        this.phaseRemaining = this.config.prepare;
      } else {
        this.currentPhase = 'work';
        this.phaseDuration = this.config.work;
        this.phaseRemaining = this.config.work;
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
      this.onPhaseChange(this.getPhaseInfo(null));
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

  /**
   * Live +15s / -10s adjustment during active or paused workout (especially helpful in Rest)
   */
  adjustPhaseTime(deltaSeconds) {
    if (this.status !== 'running' && this.status !== 'paused') return;

    const newRemaining = Math.max(1, this.phaseRemaining + deltaSeconds);
    const appliedDelta = newRemaining - this.phaseRemaining;
    if (Math.abs(appliedDelta) < 0.01) return;

    this.phaseRemaining = newRemaining;
    this.phaseDuration = Math.max(Math.ceil(newRemaining), this.phaseDuration + appliedDelta);
    this.totalDuration = Math.max(this.totalElapsed + newRemaining, this.totalDuration + appliedDelta);

    const ceilSec = Math.ceil(this.phaseRemaining);
    if (ceilSec > 3) {
      this.lastBeepSecond = null;
    }
    this.lastTickSecond = ceilSec;

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

  tick() {
    if (this.status !== 'running') return;

    const now = Date.now();
    let delta = (now - this.lastTimestamp) / 1000;
    this.lastTimestamp = now;

    if (delta <= 0) return;

    // Detect multi-second wake catch-up to avoid stacking overlapping phase bells
    const isLongBackgroundCatchup = delta > 2.5;
    const phaseBeforeCatchup = this.currentPhase;
    const roundBeforeCatchup = this.currentRound;
    const setBeforeCatchup = this.currentSet;

    while (delta > 0 && this.status === 'running') {
      if (this.phaseRemaining > delta) {
        this.phaseRemaining -= delta;
        this.totalElapsed = Math.min(this.totalDuration, this.totalElapsed + delta);

        if (!isLongBackgroundCatchup) {
          const ceilSec = Math.ceil(this.phaseRemaining);

          // 1. Halfway cue on longer work intervals (>= 30s)
          let halfwayTriggeredNow = false;
          if (
            this.currentPhase === 'work' &&
            this.phaseDuration >= 30 &&
            !this.halfwayFired &&
            this.phaseRemaining <= this.phaseDuration / 2 &&
            this.phaseRemaining > 4
          ) {
            this.halfwayFired = true;
            halfwayTriggeredNow = true;
            this.lastTickSecond = ceilSec;
            if (this.onHalfway) {
              this.onHalfway();
            }
          }

          // 2. Final 3, 2, 1 countdown beeps & voice
          if (ceilSec <= 3 && ceilSec >= 1 && ceilSec !== this.lastBeepSecond) {
            this.lastBeepSecond = ceilSec;
            this.lastTickSecond = ceilSec;
            if (this.onCountdownBeep) {
              this.onCountdownBeep(ceilSec, this.currentPhase);
            }
          } else if (
            !halfwayTriggeredNow &&
            ceilSec > 3 &&
            ceilSec < Math.ceil(this.phaseDuration) &&
            ceilSec !== this.lastTickSecond
          ) {
            // 3. 1-Second Tick-Tock sound
            this.lastTickSecond = ceilSec;
            if (this.onSecondTick) {
              this.onSecondTick(ceilSec, this.currentPhase);
            }
          }
        }
        delta = 0;
      } else {
        const consumed = this.phaseRemaining;
        delta -= consumed;
        this.totalElapsed = Math.min(this.totalDuration, this.totalElapsed + consumed);
        this.phaseRemaining = 0;

        this.advanceToNextPhase(isLongBackgroundCatchup);
        if (this.status === 'finished') {
          break;
        }
      }
    }

    // If waking from background sleep and landed on a new active phase, fire single clean notification
    if (
      isLongBackgroundCatchup &&
      this.status === 'running' &&
      (this.currentPhase !== phaseBeforeCatchup ||
        this.currentRound !== roundBeforeCatchup ||
        this.currentSet !== setBeforeCatchup)
    ) {
      if (this.onPhaseChange) {
        this.onPhaseChange(this.getPhaseInfo(phaseBeforeCatchup));
      }
    }

    this.notifyTick();
  }

  advanceToNextPhase(silent = false) {
    this.lastBeepSecond = null;
    this.halfwayFired = false;
    const prevPhase = this.currentPhase;
    const c = this.config;

    if (this.currentPhase === 'prepare') {
      this.currentPhase = 'work';
      this.phaseDuration = c.work;
    } else if (this.currentPhase === 'work') {
      const isLastRoundOfSet = this.currentRound >= c.rounds;
      const isLastSet = this.currentSet >= c.sets;

      if (!isLastRoundOfSet && c.rest > 0) {
        this.currentPhase = 'rest';
        this.phaseDuration = c.rest;
      } else if (!isLastRoundOfSet && c.rest === 0) {
        this.currentRound++;
        this.currentPhase = 'work';
        this.phaseDuration = c.work;
      } else if (!isLastSet && c.setRest > 0) {
        this.currentPhase = 'setRest';
        this.phaseDuration = c.setRest;
      } else if (!isLastSet && c.setRest === 0) {
        this.currentSet++;
        this.currentRound = 1;
        this.currentPhase = 'work';
        this.phaseDuration = c.work;
      } else if (c.cooldown > 0) {
        this.currentPhase = 'cooldown';
        this.phaseDuration = c.cooldown;
      } else {
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
    this.lastTickSecond = Math.ceil(this.phaseRemaining);

    if (!silent && this.onPhaseChange) {
      this.onPhaseChange(this.getPhaseInfo(prevPhase));
    }

    if (!silent) {
      this.notifyTick();
    }
  }

  skipNext() {
    if (this.status === 'idle' || this.status === 'finished') return;
    this.phaseRemaining = 0;
    this.advanceToNextPhase(false);
    if (this.status !== 'finished') {
      this.recalculateProgressFromState();
      this.notifyTick();
    }
  }

  skipPrev() {
    if (this.status === 'idle' || this.status === 'finished') return;

    if (this.phaseDuration - this.phaseRemaining > 3) {
      this.phaseRemaining = this.phaseDuration;
      this.lastBeepSecond = null;
      this.lastTickSecond = Math.ceil(this.phaseRemaining);
      this.halfwayFired = false;
      this.recalculateProgressFromState();
      this.notifyTick();
      return;
    }

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
        if (c.rest > 0) {
          this.currentPhase = 'rest';
          this.phaseDuration = c.rest;
        } else {
          this.currentPhase = 'work';
          this.phaseDuration = c.work;
        }
      } else if (this.currentSet > 1) {
        this.currentSet--;
        this.currentRound = c.rounds;
        if (c.setRest > 0) {
          this.currentPhase = 'setRest';
          this.phaseDuration = c.setRest;
        } else {
          this.currentPhase = 'work';
          this.phaseDuration = c.work;
        }
      } else if (c.prepare > 0) {
        this.currentPhase = 'prepare';
        this.phaseDuration = c.prepare;
      }
    }

    this.phaseRemaining = this.phaseDuration;
    this.lastBeepSecond = null;
    this.lastTickSecond = Math.ceil(this.phaseRemaining);
    this.halfwayFired = false;
    this.recalculateProgressFromState();

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
      const ex = this.getExerciseName(1);
      return {
        phase: 'work',
        label: ex ? `운동: ${ex}` : '운동 시작',
        exerciseName: ex,
        duration: c.work
      };
    }
    if (this.currentPhase === 'work') {
      if (this.currentRound < c.rounds) {
        const nextEx = this.getExerciseName(this.currentRound + 1);
        if (c.rest > 0) {
          return {
            phase: 'rest',
            label: nextEx ? `휴식 → ${nextEx}` : '휴식',
            exerciseName: nextEx,
            duration: c.rest
          };
        }
        return {
          phase: 'work',
          label: nextEx ? `다음: ${nextEx}` : '다음 라운드',
          exerciseName: nextEx,
          duration: c.work
        };
      }
      if (this.currentSet < c.sets) {
        const firstEx = this.getExerciseName(1);
        return {
          phase: 'setRest',
          label: firstEx ? `세트 휴식 → ${firstEx}` : '세트 휴식',
          exerciseName: firstEx,
          duration: c.setRest
        };
      }
      if (c.cooldown > 0) {
        return { phase: 'cooldown', label: '마무리 쿨다운', exerciseName: '', duration: c.cooldown };
      }
      return { phase: 'finished', label: '운동 완료', exerciseName: '', duration: 0 };
    }
    if (this.currentPhase === 'rest') {
      const nextEx = this.getExerciseName(this.currentRound + 1);
      return {
        phase: 'work',
        label: nextEx ? `운동: ${nextEx}` : '운동',
        exerciseName: nextEx,
        duration: c.work
      };
    }
    if (this.currentPhase === 'setRest') {
      const firstEx = this.getExerciseName(1);
      return {
        phase: 'work',
        label: firstEx ? `운동: ${firstEx}` : '운동',
        exerciseName: firstEx,
        duration: c.work
      };
    }
    return { phase: 'finished', label: '완료', exerciseName: '', duration: 0 };
  }

  getPhaseInfo(prevPhase = null) {
    const next = this.getNextPhaseInfo();
    const currentExercise = this.currentPhase === 'work' ? this.getExerciseName(this.currentRound) : '';
    const isLastRound =
      this.currentPhase === 'work' &&
      this.currentRound === this.config.rounds &&
      this.currentSet === this.config.sets;

    return {
      phase: this.currentPhase,
      prevPhase,
      round: this.currentRound,
      rounds: this.config.rounds,
      set: this.currentSet,
      sets: this.config.sets,
      duration: this.phaseDuration,
      exerciseName: currentExercise,
      isLastRound,
      nextPhase: next.phase,
      nextLabel: next.label,
      nextExerciseName: next.exerciseName || '',
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
    const currentExercise = this.currentPhase === 'work'
      ? this.getExerciseName(this.currentRound)
      : (this.status === 'idle' ? this.getExerciseName(1) : '');

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
      exerciseName: currentExercise,
      totalElapsed: Math.floor(this.totalElapsed),
      totalRemaining,
      totalDuration: Math.round(this.totalDuration),
      totalProgress,
      nextInfo
    });
  }
}

window.WorkoutTimer = WorkoutTimer;
