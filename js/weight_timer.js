/**
 * TimerPlus Dedicated Weight Training Set & Rest Engine
 * Solves "What set am I on?" + One-Tap Rest Countdown + Optional TUT Set Timer.
 *
 * Phases:
 * - 'ready'    : Waiting for user to finish currentSet (1-tap "세트 완료 · 휴식 시작" or optional "세트 시간 측정")
 * - 'lifting'  : Counting UP set execution duration (Time Under Tension) with 1s tempo ticks
 * - 'rest'     : Counting DOWN rest timer between sets (+15s / -15s / +30s / skip supported)
 * - 'finished' : Target sets achieved (with option to start a bonus rest/set or reset for next exercise)
 */
class WeightSetTimer {
  constructor() {
    this.STORAGE_KEY = 'timerplus_weight_config_v1';
    this.config = {
      restTime: 90, // Default 1:30 hypertrophy rest
      targetSets: 4,
      exerciseLabel: ''
    };

    this.loadConfig();

    this.phase = 'ready'; // 'ready', 'lifting', 'rest', 'finished'
    this.isPaused = false;
    this.currentSet = 1;
    this.completedSets = []; // [{ set, workSec, restSec }]

    this.liftingElapsed = 0; // seconds (float)
    this.restDuration = this.config.restTime;
    this.restRemaining = this.config.restTime;

    this.lastTimestamp = null;
    this.timerInterval = null;
    this.lastBeepSecond = null;
    this.lastTickSecond = null;

    // Callbacks
    this.onTick = null;
    this.onSetLogged = null;       // (completedSet, restDuration, isFinalSet) => {}
    this.onRestComplete = null;    // (nextSetNum) => {}
    this.onCountdownBeep = null;   // (sec) => {}
    this.onSecondTick = null;      // (sec) => {}
    this.onAllSetsComplete = null; // (completedSets) => {}
  }

  loadConfig() {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.config = {
          restTime: parsed.restTime ?? 90,
          targetSets: parsed.targetSets ?? 4,
          exerciseLabel: parsed.exerciseLabel ?? ''
        };
      }
    } catch (e) {
      console.warn('Failed to load weight config', e);
    }
  }

  saveConfig() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.config));
    } catch (e) {}
  }

  get status() {
    if ((this.phase === 'lifting' || this.phase === 'rest') && !this.isPaused) {
      return 'running';
    }
    if (this.isPaused) return 'paused';
    if (this.phase === 'finished') return 'finished';
    return 'idle';
  }

  setRestPreset(seconds) {
    const sec = Math.max(15, Math.min(600, seconds));
    this.config.restTime = sec;
    this.saveConfig();

    if (this.phase === 'ready' || this.phase === 'finished') {
      this.restDuration = sec;
      this.restRemaining = sec;
    } else if (this.phase === 'rest') {
      // Immediately apply new preset duration if user taps a rest preset chip during rest
      this.restDuration = sec;
      this.restRemaining = sec;
      this.lastBeepSecond = null;
      this.lastTickSecond = Math.ceil(sec);
    }
    this.notifyTick();
  }

  setExerciseLabel(label) {
    this.config.exerciseLabel = (label || '').trim();
    this.saveConfig();
    this.notifyTick();
  }

  adjustTargetSets(delta) {
    const nextTarget = Math.max(1, Math.min(20, this.config.targetSets + delta));
    this.config.targetSets = nextTarget;
    this.saveConfig();

    // If previously finished and user added more sets, unlock next set!
    if (this.phase === 'finished' && this.completedSets.length < nextTarget) {
      this.currentSet = this.completedSets.length + 1;
      this.phase = 'ready';
      this.isPaused = false;
      this.restDuration = this.config.restTime;
      this.restRemaining = this.config.restTime;
    }
    this.notifyTick();
  }

  /**
   * Optional: Measure active set execution duration (TUT count-up)
   */
  startSetTimer() {
    if (this.phase !== 'ready' && this.phase !== 'finished') return;
    if (this.phase === 'finished') {
      this.config.targetSets = Math.max(this.config.targetSets, this.completedSets.length + 1);
      this.currentSet = this.completedSets.length + 1;
      this.saveConfig();
    }

    this.phase = 'lifting';
    this.isPaused = false;
    this.liftingElapsed = 0;
    this.lastTickSecond = 0;
    this.startTicker();
    this.notifyTick();
  }

  /**
   * Core Gym Action: User finished their set -> Log it & Start Rest Countdown (or Finish if final set)
   */
  completeSetAndRest(forceRestEvenOnFinal = false) {
    const workSec = this.phase === 'lifting' ? Math.max(1, Math.round(this.liftingElapsed)) : null;
    const finishedSetNum = this.currentSet;

    this.completedSets.push({
      set: finishedSetNum,
      workSec,
      restSec: this.config.restTime
    });

    this.liftingElapsed = 0;
    this.isPaused = false;

    const reachedTarget = finishedSetNum >= this.config.targetSets && !forceRestEvenOnFinal;

    if (reachedTarget) {
      this.stopTicker();
      this.phase = 'finished';
      this.restDuration = this.config.restTime;
      this.restRemaining = 0;
      if (this.onAllSetsComplete) {
        this.onAllSetsComplete(this.completedSets);
      }
      this.notifyTick();
      return;
    }

    // Start Rest Countdown for next set
    this.phase = 'rest';
    this.restDuration = this.config.restTime;
    this.restRemaining = this.config.restTime;
    this.lastBeepSecond = null;
    this.lastTickSecond = Math.ceil(this.restRemaining);

    this.startTicker();

    if (this.onSetLogged) {
      this.onSetLogged(finishedSetNum, this.config.restTime);
    }

    this.notifyTick();
  }

  /**
   * Start rest timer after final set (e.g. resting before next machine or adding +1 bonus set)
   */
  startBonusRestAndSet() {
    this.config.targetSets = Math.max(this.config.targetSets, this.completedSets.length + 1);
    this.saveConfig();
    this.currentSet = this.completedSets.length; // Will increment to +1 when rest finishes
    this.phase = 'rest';
    this.isPaused = false;
    this.restDuration = this.config.restTime;
    this.restRemaining = this.config.restTime;
    this.lastBeepSecond = null;
    this.lastTickSecond = Math.ceil(this.restRemaining);

    this.startTicker();
    if (this.onSetLogged) {
      this.onSetLogged(this.currentSet, this.config.restTime);
    }
    this.notifyTick();
  }

  togglePause() {
    if (this.phase !== 'lifting' && this.phase !== 'rest') return;
    if (this.isPaused) {
      this.isPaused = false;
      this.lastTimestamp = Date.now();
      this.startTicker();
    } else {
      this.isPaused = true;
      this.stopTicker();
    }
    this.notifyTick();
  }

  adjustRest(deltaSeconds) {
    if (this.phase === 'rest') {
      const nextRem = Math.max(1, this.restRemaining + deltaSeconds);
      const applied = nextRem - this.restRemaining;
      this.restRemaining = nextRem;
      this.restDuration = Math.max(Math.ceil(nextRem), this.restDuration + applied);
      const ceilSec = Math.ceil(this.restRemaining);
      if (ceilSec > 3) this.lastBeepSecond = null;
      this.lastTickSecond = ceilSec;
      this.notifyTick();
    } else {
      this.setRestPreset(this.config.restTime + deltaSeconds);
    }
  }

  skipRest() {
    if (this.phase !== 'rest') return;
    this.finishRestPhase();
  }

  finishRestPhase() {
    this.stopTicker();
    this.isPaused = false;
    this.currentSet = this.completedSets.length + 1;
    this.phase = 'ready';
    this.restDuration = this.config.restTime;
    this.restRemaining = this.config.restTime;
    this.lastBeepSecond = null;
    this.lastTickSecond = null;

    if (this.onRestComplete) {
      this.onRestComplete(this.currentSet);
    }
    this.notifyTick();
  }

  reset() {
    this.stopTicker();
    this.phase = 'ready';
    this.isPaused = false;
    this.currentSet = 1;
    this.completedSets = [];
    this.liftingElapsed = 0;
    this.restDuration = this.config.restTime;
    this.restRemaining = this.config.restTime;
    this.lastBeepSecond = null;
    this.lastTickSecond = null;
    this.notifyTick();
  }

  startTicker() {
    this.lastTimestamp = Date.now();
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.tick();
    }, 50);
  }

  stopTicker() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  syncTime() {
    if (this.status === 'running') {
      this.tick();
    }
  }

  tick() {
    if (this.isPaused || (this.phase !== 'lifting' && this.phase !== 'rest')) return;

    const now = Date.now();
    const delta = (now - this.lastTimestamp) / 1000;
    this.lastTimestamp = now;

    if (delta <= 0) return;

    if (this.phase === 'lifting') {
      this.liftingElapsed += delta;
      const wholeSec = Math.floor(this.liftingElapsed);
      if (delta <= 2.5 && wholeSec >= 1 && wholeSec !== this.lastTickSecond) {
        this.lastTickSecond = wholeSec;
        if (this.onSecondTick) {
          this.onSecondTick(wholeSec, 'lifting');
        }
      }
      this.notifyTick();
      return;
    }

    if (this.phase === 'rest') {
      if (this.restRemaining > delta) {
        this.restRemaining -= delta;
        if (delta <= 2.5) {
          const ceilSec = Math.ceil(this.restRemaining);
          if (ceilSec <= 3 && ceilSec >= 1 && ceilSec !== this.lastBeepSecond) {
            this.lastBeepSecond = ceilSec;
            this.lastTickSecond = ceilSec;
            if (this.onCountdownBeep) {
              this.onCountdownBeep(ceilSec);
            }
          } else if (
            ceilSec > 3 &&
            ceilSec < Math.ceil(this.restDuration) &&
            ceilSec !== this.lastTickSecond
          ) {
            this.lastTickSecond = ceilSec;
            if (this.onSecondTick) {
              this.onSecondTick(ceilSec, 'rest');
            }
          }
        }
        this.notifyTick();
      } else {
        this.restRemaining = 0;
        this.finishRestPhase();
      }
    }
  }

  notifyTick() {
    if (!this.onTick) return;

    let displaySeconds = this.config.restTime;
    let ringFraction = 1;

    if (this.phase === 'lifting') {
      displaySeconds = Math.floor(this.liftingElapsed);
      // Smooth 60-second sweeping ring during count-up TUT
      ringFraction = (this.liftingElapsed % 60) / 60;
    } else if (this.phase === 'rest') {
      displaySeconds = Math.max(0, Math.ceil(this.restRemaining));
      ringFraction = this.restDuration > 0
        ? Math.max(0, this.restRemaining) / this.restDuration
        : 0;
    } else if (this.phase === 'finished') {
      displaySeconds = 0;
      ringFraction = 1;
    } else {
      displaySeconds = this.config.restTime;
      ringFraction = 1;
    }

    this.onTick({
      status: this.status,
      phase: this.phase,
      isPaused: this.isPaused,
      currentSet: this.currentSet,
      targetSets: this.config.targetSets,
      restTime: this.config.restTime,
      exerciseLabel: this.config.exerciseLabel,
      displaySeconds,
      ringFraction,
      completedSets: this.completedSets
    });
  }
}

window.WeightSetTimer = WeightSetTimer;

