/**
 * TimerPlus Stopwatch Engine
 * High-precision count-up stopwatch with lap tracking and split time analysis.
 */
class StopwatchEngine {
  constructor() {
    this.status = 'stopped'; // 'stopped', 'running', 'paused'
    this.startTime = 0;
    this.pausedAt = 0;
    this.totalElapsed = 0;
    
    this.currentLapStart = 0;
    this.currentLapElapsed = 0;
    this.laps = [];

    this.timerId = null;
    this.onTick = null;
    this.onLap = null;
    this.onReset = null;
  }

  start() {
    if (this.status === 'running') return;

    const now = Date.now();
    if (this.status === 'stopped') {
      this.startTime = now;
      this.currentLapStart = now;
      this.totalElapsed = 0;
      this.currentLapElapsed = 0;
      this.laps = [];
    } else if (this.status === 'paused') {
      // Resume from paused offset
      const pauseDuration = now - this.pausedAt;
      this.startTime += pauseDuration;
      this.currentLapStart += pauseDuration;
    }

    this.status = 'running';

    this.timerId = setInterval(() => {
      this.tick();
    }, 25);

    this.tick();
  }

  pause() {
    if (this.status !== 'running') return;
    this.status = 'paused';
    this.pausedAt = Date.now();
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.tick();
  }

  syncTime() {
    if (this.status === 'running') {
      this.tick();
    }
  }

  reset() {
    this.status = 'stopped';
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.totalElapsed = 0;
    this.currentLapElapsed = 0;
    this.laps = [];

    if (this.onReset) {
      this.onReset();
    }
    if (this.onTick) {
      this.onTick(0, 0);
    }
  }

  recordLap() {
    if (this.status !== 'running') return null;

    const now = Date.now();
    const lapTime = now - this.currentLapStart;
    const totalTime = now - this.startTime;

    const lapItem = {
      index: this.laps.length + 1,
      lapTime,
      totalTime
    };

    // Newest lap goes to the beginning of the list
    this.laps.unshift(lapItem);
    this.currentLapStart = now;
    this.currentLapElapsed = 0;

    const analysis = this.getLapAnalysis();

    if (this.onLap) {
      this.onLap(lapItem, this.laps, analysis);
    }

    return lapItem;
  }

  getLapAnalysis() {
    if (this.laps.length < 2) {
      return { fastestIndex: -1, slowestIndex: -1 };
    }

    let fastestIndex = 0;
    let slowestIndex = 0;
    let minTime = this.laps[0].lapTime;
    let maxTime = this.laps[0].lapTime;

    this.laps.forEach((lap, idx) => {
      if (lap.lapTime < minTime) {
        minTime = lap.lapTime;
        fastestIndex = idx;
      }
      if (lap.lapTime > maxTime) {
        maxTime = lap.lapTime;
        slowestIndex = idx;
      }
    });

    return { fastestIndex, slowestIndex };
  }

  tick() {
    if (this.status === 'running') {
      const now = Date.now();
      this.totalElapsed = now - this.startTime;
      this.currentLapElapsed = now - this.currentLapStart;
    }

    if (this.onTick) {
      this.onTick(this.totalElapsed, this.currentLapElapsed, this.status);
    }
  }
}

window.StopwatchEngine = StopwatchEngine;
