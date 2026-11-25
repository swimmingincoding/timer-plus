/**
 * TimerPlus Application Controller
 * Orchestrates Interval/Circuit Timer, Weight Set & Rest Timer, Boxing Round Timer,
 * Stopwatch, Audio Engine (with 1s Tick-Tock), Storage, WakeLock, and Landscape/PWA UX.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Core Engines
  const timer = new WorkoutTimer();
  const weightTimer = new WeightSetTimer();
  const roundsTimer = new BoxingRoundTimer();
  const stopwatch = new StopwatchEngine();
  const storage = window.storageManager;
  const sound = window.soundEngine;

  // 2. Navigation Tabs & Views
  let currentActiveTab = 'interval'; // 'interval', 'weight', 'rounds', 'stopwatch'
  const tabInterval = document.getElementById('tabInterval');
  const tabWeight = document.getElementById('tabWeight');
  const tabRounds = document.getElementById('tabRounds');
  const tabStopwatch = document.getElementById('tabStopwatch');

  const viewInterval = document.getElementById('viewInterval');
  const viewWeight = document.getElementById('viewWeight');
  const viewRounds = document.getElementById('viewRounds');
  const viewStopwatch = document.getElementById('viewStopwatch');

  // Header Elements
  const headerRoutineName = document.getElementById('headerRoutineName');
  const openPresetsBtn = document.getElementById('openPresetsBtn');
  const headerWeightBtn = document.getElementById('headerWeightBtn');
  const headerWeightName = document.getElementById('headerWeightName');
  const headerRoundsConfigBtn = document.getElementById('headerRoundsConfigBtn');
  const headerRoundsPresetName = document.getElementById('headerRoundsPresetName');
  const headerStopwatchTitle = document.getElementById('headerStopwatchTitle');
  const soundQuickBtn = document.getElementById('soundQuickBtn');
  const soundIconOn = document.getElementById('soundIconOn');
  const soundIconOff = document.getElementById('soundIconOff');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const openSettingsBtn = document.getElementById('openSettingsBtn');
  const toastMsg = document.getElementById('toastMsg');

  // Interval View Elements
  const phasePill = document.getElementById('phasePill');
  const roundDisplay = document.getElementById('roundDisplay');
  const setDisplay = document.getElementById('setDisplay');
  const setDisplayWrapper = document.getElementById('setDisplayWrapper');
  const intervalExerciseBanner = document.getElementById('intervalExerciseBanner');
  const intervalExerciseName = document.getElementById('intervalExerciseName');
  const dialProgressRing = document.getElementById('dialProgressRing');
  const mainTimeDisplay = document.getElementById('mainTimeDisplay');
  const totalRemainingDisplay = document.getElementById('totalRemainingDisplay');
  const intervalQuickAdjustRow = document.getElementById('intervalQuickAdjustRow');
  const nextUpText = document.getElementById('nextUpText');
  const overallPercentText = document.getElementById('overallPercentText');
  const overallProgressBar = document.getElementById('overallProgressBar');

  const prevBtn = document.getElementById('prevBtn');
  const playBtn = document.getElementById('playBtn');
  const playIcon = document.getElementById('playIcon');
  const pauseIcon = document.getElementById('pauseIcon');
  const nextBtn = document.getElementById('nextBtn');
  const resetBtn = document.getElementById('resetBtn');
  const editCurrentRoutineBtn = document.getElementById('editCurrentRoutineBtn');
  const wakelockStatus = document.getElementById('wakelockStatus');
  const wakelockText = document.getElementById('wakelockText');

  // Weight View Elements
  const weightPhasePill = document.getElementById('weightPhasePill');
  const weightSetsMinusBtn = document.getElementById('weightSetsMinusBtn');
  const weightSetsPlusBtn = document.getElementById('weightSetsPlusBtn');
  const weightSetDisplay = document.getElementById('weightSetDisplay');
  const weightSetDots = document.getElementById('weightSetDots');
  const weightDialProgressRing = document.getElementById('weightDialProgressRing');
  const weightMainTimeDisplay = document.getElementById('weightMainTimeDisplay');
  const weightSubHint = document.getElementById('weightSubHint');
  const weightPresetChipsRow = document.getElementById('weightPresetChipsRow');
  const weightActiveAdjustRow = document.getElementById('weightActiveAdjustRow');
  const weightSubBtn = document.getElementById('weightSubBtn');
  const weightSubBtnLabel = document.getElementById('weightSubBtnLabel');
  const weightPrimaryBtn = document.getElementById('weightPrimaryBtn');
  const weightPrimaryBtnLabel = document.getElementById('weightPrimaryBtnLabel');
  const weightResetBtn = document.getElementById('weightResetBtn');
  const weightSessionSummary = document.getElementById('weightSessionSummary');
  const weightEditLabelBtn = document.getElementById('weightEditLabelBtn');

  // Rounds View Elements
  const roundsPhasePill = document.getElementById('roundsPhasePill');
  const roundsRoundDisplay = document.getElementById('roundsRoundDisplay');
  const roundsWarningBadge = document.getElementById('roundsWarningBadge');
  const roundsDialProgressRing = document.getElementById('roundsDialProgressRing');
  const roundsMainTimeDisplay = document.getElementById('roundsMainTimeDisplay');
  const roundsSummaryHint = document.getElementById('roundsSummaryHint');
  const roundsNextUpText = document.getElementById('roundsNextUpText');

  const roundsPrevBtn = document.getElementById('roundsPrevBtn');
  const roundsPlayBtn = document.getElementById('roundsPlayBtn');
  const roundsPlayIcon = document.getElementById('roundsPlayIcon');
  const roundsPauseIcon = document.getElementById('roundsPauseIcon');
  const roundsNextBtn = document.getElementById('roundsNextBtn');
  const roundsResetBtn = document.getElementById('roundsResetBtn');
  const roundsQuickConfigBtn = document.getElementById('roundsQuickConfigBtn');

  // Stopwatch View Elements
  const stopwatchMainDisplay = document.getElementById('stopwatchMainDisplay');
  const stopwatchCurrentLapDisplay = document.getElementById('stopwatchCurrentLapDisplay');
  const stopwatchLapsList = document.getElementById('stopwatchLapsList');
  const stopwatchLapResetBtn = document.getElementById('stopwatchLapResetBtn');
  const stopwatchLapResetLabel = document.getElementById('stopwatchLapResetLabel');
  const stopwatchStartStopBtn = document.getElementById('stopwatchStartStopBtn');
  const stopwatchStartIcon = document.getElementById('stopwatchStartIcon');
  const stopwatchStopIcon = document.getElementById('stopwatchStopIcon');

  // Modals
  const presetsModal = document.getElementById('presetsModal');
  const closePresetsBtn = document.getElementById('closePresetsBtn');
  const presetsListContainer = document.getElementById('presetsListContainer');
  const createNewRoutineBtn = document.getElementById('createNewRoutineBtn');

  const editorModal = document.getElementById('editorModal');
  const editorModalTitle = document.getElementById('editorModalTitle');
  const closeEditorBtn = document.getElementById('closeEditorBtn');
  const editNameInput = document.getElementById('editNameInput');
  const circuitExercisesToggleBtn = document.getElementById('circuitExercisesToggleBtn');
  const circuitExercisesPanel = document.getElementById('circuitExercisesPanel');
  const circuitExercisesInputs = document.getElementById('circuitExercisesInputs');
  const clearCircuitExercisesBtn = document.getElementById('clearCircuitExercisesBtn');
  const saveRoutineBtn = document.getElementById('saveRoutineBtn');
  const deleteRoutineBtn = document.getElementById('deleteRoutineBtn');

  const roundsConfigModal = document.getElementById('roundsConfigModal');
  const closeRoundsConfigBtn = document.getElementById('closeRoundsConfigBtn');
  const saveRoundsConfigBtn = document.getElementById('saveRoundsConfigBtn');
  const rcWarningToggle = document.getElementById('rcWarningToggle');

  const weightLabelModal = document.getElementById('weightLabelModal');
  const closeWeightLabelBtn = document.getElementById('closeWeightLabelBtn');
  const weightLabelInput = document.getElementById('weightLabelInput');
  const saveWeightLabelBtn = document.getElementById('saveWeightLabelBtn');

  const settingsModal = document.getElementById('settingsModal');
  const closeSettingsModalBtn = document.getElementById('closeSettingsModalBtn');
  const volumeSlider = document.getElementById('volumeSlider');
  const volumePercentText = document.getElementById('volumePercentText');
  const tickSoundToggle = document.getElementById('tickSoundToggle');
  const halfwayAlertToggle = document.getElementById('halfwayAlertToggle');
  const audioMixingToggle = document.getElementById('audioMixingToggle');
  const testTickBtn = document.getElementById('testTickBtn');
  const testBellBtn = document.getElementById('testBellBtn');
  const testBeepBtn = document.getElementById('testBeepBtn');
  const resetDefaultsBtn = document.getElementById('resetDefaultsBtn');
  const openIosGuideBtn = document.getElementById('openIosGuideBtn');

  const iosGuideModal = document.getElementById('iosGuideModal');
  const closeIosGuideBtn = document.getElementById('closeIosGuideBtn');
  const confirmIosGuideBtn = document.getElementById('confirmIosGuideBtn');

  // Constants
  const DIAL_CIRCUMFERENCE = 2 * Math.PI * 115; // 722.56
  dialProgressRing.style.strokeDasharray = `${DIAL_CIRCUMFERENCE}`;
  weightDialProgressRing.style.strokeDasharray = `${DIAL_CIRCUMFERENCE}`;
  roundsDialProgressRing.style.strokeDasharray = `${DIAL_CIRCUMFERENCE}`;

  // State Variables
  let wakeLockSentinel = null;
  let editingPreset = null;
  let circuitPanelExpanded = false;
  let currentEditorConfig = {
    work: 20,
    rest: 10,
    rounds: 8,
    sets: 1,
    setRest: 60,
    prepare: 10,
    cooldown: 0,
    exercises: []
  };

  // Safe 2-tap Reset Guard State
  const resetGuardTimers = {};

  // Rounds Config State
  let currentRoundsConfig = {
    roundTime: 180,
    restTime: 60,
    totalRounds: 5,
    warningTime: 10,
    prepare: 10,
    name: '복싱 3분 5라운드'
  };

  try {
    const savedRounds = localStorage.getItem('timerplus_last_rounds_config');
    if (savedRounds) {
      currentRoundsConfig = { ...currentRoundsConfig, ...JSON.parse(savedRounds) };
    }
  } catch (e) {
    console.warn('Failed to load saved rounds config', e);
  }

  const PHASE_THEMES = {
    prepare: { label: '준비', color: '#00C2FF', glow: 'rgba(0, 194, 255, 0.35)' },
    work: { label: '운동 (WORK)', color: '#00E676', glow: 'rgba(0, 230, 118, 0.4)' },
    rest: { label: '휴식 (REST)', color: '#FF9100', glow: 'rgba(255, 145, 0, 0.35)' },
    setRest: { label: '세트 휴식', color: '#B388FF', glow: 'rgba(179, 136, 255, 0.35)' },
    cooldown: { label: '마무리 쿨다운', color: '#00B4D8', glow: 'rgba(0, 180, 216, 0.35)' },
    finished: { label: '운동 완료! 🎉', color: '#FFD600', glow: 'rgba(255, 214, 0, 0.45)' }
  };

  function isAnyTimerRunning() {
    return (
      timer.status === 'running' ||
      weightTimer.status === 'running' ||
      roundsTimer.status === 'running' ||
      stopwatch.status === 'running'
    );
  }

  // =========================================================================
  // Screen Wake Lock API
  // =========================================================================
  async function requestWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        if (wakeLockSentinel) return;
        wakeLockSentinel = await navigator.wakeLock.request('screen');
        wakelockText.textContent = '화면 유지 ON';
        wakelockStatus.style.color = 'var(--color-work)';
        wakeLockSentinel.addEventListener('release', () => {
          wakeLockSentinel = null;
          if (!isAnyTimerRunning()) {
            wakelockText.textContent = '화면 유지 대기';
            wakelockStatus.style.color = 'var(--text-muted)';
          }
        });
      } catch (err) {
        console.warn('Wake Lock error:', err);
      }
    }
  }

  function releaseWakeLockIfIdle() {
    if (isAnyTimerRunning()) return;
    if (wakeLockSentinel) {
      wakeLockSentinel.release().catch(() => {});
      wakeLockSentinel = null;
    }
    wakelockText.textContent = '화면 유지 대기';
    wakelockStatus.style.color = 'var(--text-muted)';
  }

  // =========================================================================
  // REAL-TIME WALL CLOCK SYNC & BACKGROUND WORKER TICKER
  // =========================================================================
  function syncAllTimers() {
    if (timer.status === 'running') timer.syncTime();
    if (weightTimer.status === 'running') weightTimer.syncTime();
    if (roundsTimer.status === 'running') roundsTimer.syncTime();
    if (stopwatch.status === 'running') stopwatch.syncTime();
  }

  let bgWorker = null;
  try {
    const workerBlob = new Blob([`
      let tid = null;
      self.onmessage = function(e) {
        if (e.data === 'start') {
          if (tid) clearInterval(tid);
          tid = setInterval(() => { self.postMessage('tick'); }, 100);
        } else if (e.data === 'stop') {
          if (tid) clearInterval(tid);
          tid = null;
        }
      };
    `], { type: 'application/javascript' });
    bgWorker = new Worker(URL.createObjectURL(workerBlob));
    bgWorker.onmessage = () => {
      syncAllTimers();
    };
  } catch (err) {
    console.warn('Background worker fallback to wall-clock sync', err);
  }

  function updateBackgroundWorkerState() {
    if (bgWorker) {
      bgWorker.postMessage(isAnyTimerRunning() ? 'start' : 'stop');
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      sound.resumeContext(true);
      syncAllTimers();
      if (isAnyTimerRunning()) {
        requestWakeLock();
      }
    }
  });

  window.addEventListener('focus', () => {
    sound.resumeContext(true);
    syncAllTimers();
  });
  window.addEventListener('pageshow', () => {
    sound.resumeContext(true);
    syncAllTimers();
  });

  // Haptic feedback
  function triggerHaptic(pattern = [60]) {
    if ('vibrate' in navigator) {
      try { navigator.vibrate(pattern); } catch (e) {}
    }
  }

  // Formatting Utilities
  function formatTime(totalSeconds) {
    const sec = Math.max(0, Math.round(totalSeconds));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function formatStopwatchTime(ms) {
    const totalCentis = Math.floor(ms / 10);
    const centis = totalCentis % 100;
    const totalSec = Math.floor(totalCentis / 100);
    const sec = totalSec % 60;
    const min = Math.floor(totalSec / 60);
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
  }

  let toastTimeout = null;
  function showToast(text) {
    toastMsg.textContent = text;
    toastMsg.classList.add('show');
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toastMsg.classList.remove('show');
    }, 2400);
  }

  /**
   * Prevents accidental 1-tap resets during a sweaty workout
   */
  function handleProtectedReset(key, needsProtection, doResetFn) {
    if (!needsProtection || resetGuardTimers[key]) {
      if (resetGuardTimers[key]) {
        clearTimeout(resetGuardTimers[key]);
        delete resetGuardTimers[key];
      }
      doResetFn();
      return;
    }
    resetGuardTimers[key] = setTimeout(() => {
      delete resetGuardTimers[key];
    }, 2600);
    triggerHaptic([40]);
    showToast('⚠️ 운동 중입니다. 한 번 더 누르면 초기화됩니다.');
  }

  /**
   * Binds click + hold-to-repeat acceleration on stepper buttons
   */
  function bindHoldStepper(btn, stepCallback) {
    let holdDelayTimer = null;
    let repeatTimer = null;
    let holdStart = 0;
    let handledByPointer = false;

    const clearHold = () => {
      if (holdDelayTimer) {
        clearTimeout(holdDelayTimer);
        holdDelayTimer = null;
      }
      if (repeatTimer) {
        clearTimeout(repeatTimer);
        repeatTimer = null;
      }
    };

    const scheduleRepeat = () => {
      const heldMs = Date.now() - holdStart;
      const interval = heldMs > 1600 ? 45 : 95;
      repeatTimer = setTimeout(() => {
        stepCallback(true);
        scheduleRepeat();
      }, interval);
    };

    btn.addEventListener('pointerdown', (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      handledByPointer = true;
      clearHold();
      holdStart = Date.now();
      sound.playTap();
      stepCallback(false);
      holdDelayTimer = setTimeout(() => {
        scheduleRepeat();
      }, 360);
    });

    ['pointerup', 'pointerleave', 'pointercancel'].forEach(evt => {
      btn.addEventListener(evt, clearHold);
    });

    btn.addEventListener('contextmenu', (e) => e.preventDefault());

    btn.addEventListener('click', () => {
      if (handledByPointer) {
        handledByPointer = false;
        return;
      }
      sound.playTap();
      stepCallback(false);
    });
  }

  // =========================================================================
  // BLUETOOTH / EARBUDS MEDIA SESSION & AUDIO MIXING COEXISTENCE
  // =========================================================================
  const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
  silentAudio.loop = true;

  function updateMediaSessionMetadata({ title, artist, album, state = 'playing' }) {
    if (sound.audioMixingMode) {
      if (silentAudio && !silentAudio.paused) {
        silentAudio.pause();
      }
      return;
    }

    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: title || 'Timer+ 운동 타이머',
          artist: artist || '운동 중',
          album: album || 'TimerPlus',
          artwork: [
            { src: './icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: './icons/icon-512.png', sizes: '512x512', type: 'image/png' }
          ]
        });
        navigator.mediaSession.playbackState = state;
      } catch (e) {}
    }

    if (state === 'playing') {
      silentAudio.play().catch(() => {});
    } else {
      silentAudio.pause();
    }
  }

  function toggleCurrentTimer() {
    if (currentActiveTab === 'interval') {
      playBtn.click();
    } else if (currentActiveTab === 'weight') {
      if (weightTimer.phase === 'rest') {
        weightSubBtn.click();
      } else {
        weightPrimaryBtn.click();
      }
    } else if (currentActiveTab === 'rounds') {
      roundsPlayBtn.click();
    } else if (currentActiveTab === 'stopwatch') {
      stopwatchStartStopBtn.click();
    }
  }

  function skipCurrentTimerNext() {
    if (currentActiveTab === 'interval') {
      nextBtn.click();
    } else if (currentActiveTab === 'weight') {
      weightPrimaryBtn.click();
    } else if (currentActiveTab === 'rounds') {
      roundsNextBtn.click();
    } else if (currentActiveTab === 'stopwatch') {
      stopwatchLapResetBtn.click();
    }
  }

  function skipCurrentTimerPrev() {
    if (currentActiveTab === 'interval') {
      prevBtn.click();
    } else if (currentActiveTab === 'rounds') {
      roundsPrevBtn.click();
    }
  }

  if ('mediaSession' in navigator) {
    try {
      navigator.mediaSession.setActionHandler('play', () => toggleCurrentTimer());
      navigator.mediaSession.setActionHandler('pause', () => toggleCurrentTimer());
      navigator.mediaSession.setActionHandler('nexttrack', () => skipCurrentTimerNext());
      navigator.mediaSession.setActionHandler('previoustrack', () => skipCurrentTimerPrev());
    } catch (e) {}
  }

  // =========================================================================
  // TAB NAVIGATION CONTROLLER
  // =========================================================================
  function syncWeightTheme(phase) {
    if (phase === 'rest') {
      document.documentElement.style.setProperty('--active-phase-color', '#FF9100');
      document.documentElement.style.setProperty('--active-phase-glow', 'rgba(255, 145, 0, 0.35)');
    } else if (phase === 'lifting') {
      document.documentElement.style.setProperty('--active-phase-color', '#00C2FF');
      document.documentElement.style.setProperty('--active-phase-glow', 'rgba(0, 194, 255, 0.35)');
    } else if (phase === 'finished') {
      document.documentElement.style.setProperty('--active-phase-color', '#FFD600');
      document.documentElement.style.setProperty('--active-phase-glow', 'rgba(255, 214, 0, 0.45)');
    } else {
      document.documentElement.style.setProperty('--active-phase-color', '#00E676');
      document.documentElement.style.setProperty('--active-phase-glow', 'rgba(0, 230, 118, 0.4)');
    }
  }

  function switchTab(tabName) {
    const validTabs = ['interval', 'weight', 'rounds', 'stopwatch'];
    if (!validTabs.includes(tabName)) tabName = 'interval';

    currentActiveTab = tabName;
    try {
      localStorage.setItem('timerplus_last_active_tab', tabName);
    } catch (e) {}

    [tabInterval, tabWeight, tabRounds, tabStopwatch].forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    viewInterval.classList.toggle('active', tabName === 'interval');
    viewWeight.classList.toggle('active', tabName === 'weight');
    viewRounds.classList.toggle('active', tabName === 'rounds');
    viewStopwatch.classList.toggle('active', tabName === 'stopwatch');

    openPresetsBtn.style.display = tabName === 'interval' ? 'flex' : 'none';
    headerWeightBtn.style.display = tabName === 'weight' ? 'flex' : 'none';
    headerRoundsConfigBtn.style.display = tabName === 'rounds' ? 'flex' : 'none';
    headerStopwatchTitle.style.display = tabName === 'stopwatch' ? 'block' : 'none';

    if (tabName === 'interval') {
      const theme = PHASE_THEMES[timer.currentPhase] || PHASE_THEMES.work;
      document.documentElement.style.setProperty('--active-phase-color', theme.color);
      document.documentElement.style.setProperty('--active-phase-glow', theme.glow);
      phasePill.textContent = theme.label;
      timer.notifyTick();
    } else if (tabName === 'weight') {
      syncWeightTheme(weightTimer.phase);
      weightTimer.notifyTick();
    } else if (tabName === 'rounds') {
      syncRoundsTheme(roundsTimer.phase);
      roundsTimer.notifyTick();
    } else if (tabName === 'stopwatch') {
      document.documentElement.style.setProperty('--active-phase-color', '#00E676');
      document.documentElement.style.setProperty('--active-phase-glow', 'rgba(0, 230, 118, 0.35)');
    }
  }

  [tabInterval, tabWeight, tabRounds, tabStopwatch].forEach(tab => {
    tab.addEventListener('click', () => {
      sound.playTap();
      switchTab(tab.dataset.tab);
    });
  });

  // =========================================================================
  // 1. INTERVAL / TABATA / HOME CIRCUIT CONTROLLER
  // =========================================================================
  timer.onTick = (data) => {
    if (currentActiveTab === 'interval') {
      mainTimeDisplay.textContent = formatTime(data.phaseRemaining);
      totalRemainingDisplay.textContent = formatTime(data.totalRemaining);

      const remainingFraction = data.phaseDuration > 0
        ? data.phaseRemainingPrecise / data.phaseDuration
        : 0;
      dialProgressRing.style.strokeDashoffset = `${DIAL_CIRCUMFERENCE * (1 - remainingFraction)}`;

      roundDisplay.textContent = `${data.round} / ${data.rounds}`;
      setDisplay.textContent = `${data.set} / ${data.sets}`;
      setDisplayWrapper.style.display = data.sets > 1 ? 'block' : 'none';

      if (data.exerciseName) {
        intervalExerciseBanner.style.display = 'inline-flex';
        intervalExerciseName.textContent = data.exerciseName;
      } else {
        intervalExerciseBanner.style.display = 'none';
      }

      const isActiveOrPaused = data.status === 'running' || data.status === 'paused';
      intervalQuickAdjustRow.style.display = isActiveOrPaused ? 'flex' : 'none';

      const pct = Math.min(100, Math.round(data.totalProgress * 100));
      overallPercentText.textContent = `${pct}%`;
      overallProgressBar.style.width = `${pct}%`;

      if (data.status === 'finished') {
        nextUpText.textContent = '운동 완료!';
      } else if (data.status === 'idle') {
        const firstEx = timer.getExerciseName(1);
        if (timer.config.prepare > 0) {
          nextUpText.textContent = firstEx
            ? `준비 ${formatTime(timer.config.prepare)} → ${firstEx}`
            : `시작 시 준비 ${formatTime(timer.config.prepare)}`;
        } else {
          nextUpText.textContent = firstEx
            ? `1R: ${firstEx} (${formatTime(timer.config.work)})`
            : `${data.nextInfo.label} (${formatTime(data.nextInfo.duration)})`;
        }
      } else if (data.nextInfo) {
        nextUpText.textContent = data.nextInfo.duration > 0
          ? `${data.nextInfo.label} (${formatTime(data.nextInfo.duration)})`
          : data.nextInfo.label;
      }
    }

    if (data.status === 'running') {
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'block';
      const theme = PHASE_THEMES[data.phase] || PHASE_THEMES.work;
      updateMediaSessionMetadata({
        title: `[${theme.label}] ${formatTime(data.phaseRemaining)}`,
        artist: data.exerciseName ? `${data.exerciseName} (${data.round}/${data.rounds}R)` : `라운드 ${data.round} / ${data.rounds}`,
        album: storage.getActivePreset()?.name || '타바타',
        state: 'playing'
      });
    } else {
      playIcon.style.display = 'block';
      pauseIcon.style.display = 'none';
      if (currentActiveTab === 'interval') {
        updateMediaSessionMetadata({ state: 'paused' });
      }
    }
  };

  timer.onPhaseChange = (phaseInfo) => {
    const theme = PHASE_THEMES[phaseInfo.phase] || PHASE_THEMES.work;
    if (currentActiveTab === 'interval') {
      document.documentElement.style.setProperty('--active-phase-color', theme.color);
      document.documentElement.style.setProperty('--active-phase-glow', theme.glow);
      phasePill.textContent = theme.label;
    }

    if (phaseInfo.phase === 'prepare') {
      sound.playPrepareStart(phaseInfo.nextExerciseName);
      triggerHaptic([60]);
    } else if (phaseInfo.phase === 'work') {
      sound.playWorkStart(phaseInfo.exerciseName, phaseInfo.isLastRound);
      triggerHaptic([100, 50, 100]);
    } else if (phaseInfo.phase === 'rest') {
      sound.playRestStart(phaseInfo.nextExerciseName);
      triggerHaptic([80]);
    } else if (phaseInfo.phase === 'setRest') {
      sound.playSetRestStart(phaseInfo.nextExerciseName);
      triggerHaptic([100, 100, 100]);
    } else if (phaseInfo.phase === 'cooldown') {
      sound.playRestStart('');
      triggerHaptic([60]);
    }
  };

  timer.onSecondTick = (sec) => {
    sound.playSecondTick(sec);
  };

  timer.onHalfway = () => {
    sound.playHalfway();
    triggerHaptic([50, 50]);
  };

  timer.onCountdownBeep = (sec) => {
    sound.playCountdownBeep(sec);
    triggerHaptic([40]);
  };

  timer.onComplete = () => {
    releaseWakeLockIfIdle();
    updateBackgroundWorkerState();
    sound.playComplete();
    triggerHaptic([200, 100, 200, 100, 400]);

    if (currentActiveTab === 'interval') {
      const theme = PHASE_THEMES.finished;
      document.documentElement.style.setProperty('--active-phase-color', theme.color);
      document.documentElement.style.setProperty('--active-phase-glow', theme.glow);
      phasePill.textContent = theme.label;
    }
    showToast('🎉 운동을 성공적으로 완료했습니다!');
  };

  function loadActivePreset() {
    const preset = storage.getActivePreset();
    if (!preset) return;
    headerRoutineName.textContent = preset.name;
    timer.setConfig(preset);

    if (currentActiveTab === 'interval') {
      const theme = PHASE_THEMES[timer.currentPhase] || PHASE_THEMES.work;
      document.documentElement.style.setProperty('--active-phase-color', theme.color);
      document.documentElement.style.setProperty('--active-phase-glow', theme.glow);
      phasePill.textContent = theme.label;
    }
  }

  playBtn.addEventListener('click', () => {
    sound.initContext();
    sound.playTap();
    if (timer.status === 'running') {
      timer.pause();
      releaseWakeLockIfIdle();
    } else if (timer.status === 'paused') {
      timer.resume();
      requestWakeLock();
    } else {
      storage.saveLastWorkout(storage.getActivePreset());
      timer.start();
      requestWakeLock();
    }
    updateBackgroundWorkerState();
  });

  nextBtn.addEventListener('click', () => {
    sound.playTap();
    timer.skipNext();
  });

  prevBtn.addEventListener('click', () => {
    sound.playTap();
    timer.skipPrev();
  });

  document.querySelectorAll('.interval-adj-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sound.playTap();
      const adj = parseInt(btn.dataset.adj, 10);
      timer.adjustPhaseTime(adj);
      triggerHaptic([35]);
      showToast(adj > 0 ? `+${adj}초 연장되었습니다.` : `${adj}초 단축되었습니다.`);
    });
  });

  resetBtn.addEventListener('click', () => {
    sound.playTap();
    const isBusy = timer.status === 'running' || timer.status === 'paused';
    handleProtectedReset('interval', isBusy, () => {
      timer.reset();
      releaseWakeLockIfIdle();
      updateBackgroundWorkerState();
      if (currentActiveTab === 'interval') {
        const theme = PHASE_THEMES.work;
        document.documentElement.style.setProperty('--active-phase-color', theme.color);
        document.documentElement.style.setProperty('--active-phase-glow', theme.glow);
        phasePill.textContent = theme.label;
      }
      showToast('인터벌 타이머가 초기화되었습니다.');
    });
  });

  // =========================================================================
  // 2. WEIGHT TRAINING SET & REST CONTROLLER
  // =========================================================================
  weightTimer.onTick = (data) => {
    headerWeightName.textContent = data.exerciseLabel
      ? `웨이트 · ${data.exerciseLabel}`
      : '웨이트 세트 & 휴식';

    if (currentActiveTab === 'weight') {
      syncWeightTheme(data.phase);
      weightMainTimeDisplay.textContent = formatTime(data.displaySeconds);
      weightDialProgressRing.style.strokeDashoffset = `${DIAL_CIRCUMFERENCE * (1 - data.ringFraction)}`;

      const shownSet = data.phase === 'finished' ? data.completedSets.length : data.currentSet;
      weightSetDisplay.textContent = `${shownSet} / ${data.targetSets}`;

      // Render Set Progress Pills
      const totalDots = Math.max(data.targetSets, data.completedSets.length);
      let dotsHtml = '';
      for (let i = 1; i <= totalDots; i++) {
        const isDone = i <= data.completedSets.length;
        const isCurrent = !isDone && i === data.currentSet && data.phase !== 'finished';
        dotsHtml += `<span class="set-dot ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}">${isDone ? '✓ ' : ''}${i}</span>`;
      }
      weightSetDots.innerHTML = dotsHtml;

      // Sync Rest Preset Chips highlight
      document.querySelectorAll('.weight-rest-chip').forEach(chip => {
        chip.classList.toggle('active', parseInt(chip.dataset.sec, 10) === data.restTime);
      });

      if (data.phase === 'ready') {
        weightPhasePill.textContent = `${data.currentSet}세트 준비`;
        weightSubHint.textContent = `운동 후 완료를 누르면 ${formatTime(data.restTime)} 휴식이 시작됩니다`;
        weightPresetChipsRow.style.display = 'flex';
        weightActiveAdjustRow.style.display = 'none';
        weightSubBtnLabel.textContent = '⏱ 세트 시간 측정';
        weightPrimaryBtnLabel.textContent = data.currentSet >= data.targetSets
          ? `✓ ${data.currentSet}세트 완료 · 목표 달성`
          : `✓ ${data.currentSet}세트 완료 · 휴식 시작`;
      } else if (data.phase === 'lifting') {
        weightPhasePill.textContent = data.isPaused
          ? `${data.currentSet}세트 일시정지`
          : `🔥 ${data.currentSet}세트 수행 중`;
        weightSubHint.textContent = '세트 수행 시간 (TUT) 카운트업 중';
        weightPresetChipsRow.style.display = 'flex';
        weightActiveAdjustRow.style.display = 'none';
        weightSubBtnLabel.textContent = data.isPaused ? '▶ 측정 재개' : '⏸ 일시정지';
        weightPrimaryBtnLabel.textContent = data.currentSet >= data.targetSets
          ? `✓ ${data.currentSet}세트 완료 · 목표 달성`
          : `✓ ${data.currentSet}세트 완료 · 휴식 시작`;
      } else if (data.phase === 'rest') {
        const nextSet = data.completedSets.length + 1;
        weightPhasePill.textContent = data.isPaused
          ? '휴식 일시정지'
          : `휴식 중 (다음 ${nextSet}세트)`;
        weightSubHint.textContent = `${data.completedSets.length}세트 완료! 호흡을 가다듬으세요`;
        weightPresetChipsRow.style.display = 'none';
        weightActiveAdjustRow.style.display = 'flex';
        weightSubBtnLabel.textContent = data.isPaused ? '▶ 휴식 재개' : '⏸ 일시정지';
        weightPrimaryBtnLabel.textContent = `⏭ 휴식 스킵 · ${nextSet}세트 준비`;
      } else if (data.phase === 'finished') {
        weightPhasePill.textContent = '목표 세트 완료! 🎉';
        weightSubHint.textContent = `총 ${data.completedSets.length}세트 수행 완료!`;
        weightPresetChipsRow.style.display = 'flex';
        weightActiveAdjustRow.style.display = 'none';
        weightSubBtnLabel.textContent = '+1 추가 세트 & 휴식';
        weightPrimaryBtnLabel.textContent = '🔄 새 종목 시작';
      }

      // Session summary badge
      if (data.completedSets.length === 0) {
        weightSessionSummary.textContent = '완료 0세트';
      } else {
        const last = data.completedSets[data.completedSets.length - 1];
        weightSessionSummary.textContent = last.workSec
          ? `완료 ${data.completedSets.length}세트 (최근 ${last.workSec}초)`
          : `완료 ${data.completedSets.length}세트`;
      }
    }

    if (data.status === 'running') {
      updateMediaSessionMetadata({
        title: data.phase === 'rest'
          ? `[웨이트 휴식] ${formatTime(data.displaySeconds)}`
          : `[${data.currentSet}세트 수행] ${formatTime(data.displaySeconds)}`,
        artist: `세트 ${data.currentSet} / ${data.targetSets}`,
        album: data.exerciseLabel || '웨이트 트레이닝',
        state: 'playing'
      });
    } else if (currentActiveTab === 'weight') {
      updateMediaSessionMetadata({ state: 'paused' });
    }
  };

  weightTimer.onSecondTick = (sec) => {
    sound.playSecondTick(sec);
  };

  weightTimer.onCountdownBeep = (sec) => {
    sound.playCountdownBeep(sec);
    triggerHaptic([40]);
  };

  weightTimer.onSetLogged = (finishedSet, restSec) => {
    sound.playWeightRestStart(finishedSet, restSec);
    triggerHaptic([90, 50, 90]);
    requestWakeLock();
    updateBackgroundWorkerState();
  };

  weightTimer.onRestComplete = (nextSetNum) => {
    sound.playWeightNextSetReady(nextSetNum);
    triggerHaptic([180, 80, 180]);
    releaseWakeLockIfIdle();
    updateBackgroundWorkerState();
    showToast(`🔔 휴식 종료! ${nextSetNum}세트를 시작하세요.`);
  };

  weightTimer.onAllSetsComplete = (sets) => {
    sound.playComplete();
    triggerHaptic([200, 100, 200, 100, 400]);
    releaseWakeLockIfIdle();
    updateBackgroundWorkerState();
    showToast(`🎉 목표 ${sets.length}세트를 모두 완료했습니다!`);
  };

  weightPrimaryBtn.addEventListener('click', () => {
    sound.initContext();
    sound.playTap();
    if (weightTimer.phase === 'ready' || weightTimer.phase === 'lifting') {
      weightTimer.completeSetAndRest();
    } else if (weightTimer.phase === 'rest') {
      weightTimer.skipRest();
      releaseWakeLockIfIdle();
      updateBackgroundWorkerState();
      showToast(`${weightTimer.currentSet}세트 준비 상태입니다.`);
    } else if (weightTimer.phase === 'finished') {
      weightTimer.reset();
      showToast('새 운동 종목을 위해 초기화되었습니다.');
    }
  });

  weightSubBtn.addEventListener('click', () => {
    sound.initContext();
    sound.playTap();
    if (weightTimer.phase === 'ready') {
      weightTimer.startSetTimer();
      requestWakeLock();
      updateBackgroundWorkerState();
    } else if (weightTimer.phase === 'lifting' || weightTimer.phase === 'rest') {
      weightTimer.togglePause();
      if (weightTimer.status === 'running') {
        requestWakeLock();
      } else {
        releaseWakeLockIfIdle();
      }
      updateBackgroundWorkerState();
    } else if (weightTimer.phase === 'finished') {
      weightTimer.startBonusRestAndSet();
    }
  });

  weightSetsMinusBtn.addEventListener('click', () => {
    sound.playTap();
    weightTimer.adjustTargetSets(-1);
  });

  weightSetsPlusBtn.addEventListener('click', () => {
    sound.playTap();
    weightTimer.adjustTargetSets(1);
  });

  document.querySelectorAll('.weight-rest-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      sound.playTap();
      const sec = parseInt(chip.dataset.sec, 10);
      weightTimer.setRestPreset(sec);
      showToast(`세트 간 휴식: ${formatTime(sec)}`);
    });
  });

  document.querySelectorAll('.weight-adj-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sound.playTap();
      const adj = parseInt(btn.dataset.adj, 10);
      weightTimer.adjustRest(adj);
      triggerHaptic([35]);
      showToast(adj > 0 ? `휴식 +${adj}초 연장` : `휴식 ${adj}초 단축`);
    });
  });

  weightResetBtn.addEventListener('click', () => {
    sound.playTap();
    const isBusy = weightTimer.completedSets.length > 0 || weightTimer.phase !== 'ready';
    handleProtectedReset('weight', isBusy, () => {
      weightTimer.reset();
      releaseWakeLockIfIdle();
      updateBackgroundWorkerState();
      showToast('웨이트 세트 카운터가 초기화되었습니다.');
    });
  });

  function openWeightLabelModal() {
    weightLabelInput.value = weightTimer.config.exerciseLabel || '';
    weightLabelModal.classList.add('active');
    setTimeout(() => weightLabelInput.focus(), 100);
  }

  headerWeightBtn.addEventListener('click', () => {
    sound.playTap();
    openWeightLabelModal();
  });

  weightEditLabelBtn.addEventListener('click', () => {
    sound.playTap();
    openWeightLabelModal();
  });

  closeWeightLabelBtn.addEventListener('click', () => {
    weightLabelModal.classList.remove('active');
  });

  weightLabelModal.addEventListener('click', (e) => {
    if (e.target === weightLabelModal) weightLabelModal.classList.remove('active');
  });

  document.querySelectorAll('.weight-quick-name').forEach(chip => {
    chip.addEventListener('click', () => {
      sound.playTap();
      weightLabelInput.value = chip.dataset.label || '';
    });
  });

  saveWeightLabelBtn.addEventListener('click', () => {
    sound.playTap();
    weightTimer.setExerciseLabel(weightLabelInput.value);
    weightLabelModal.classList.remove('active');
    showToast(weightTimer.config.exerciseLabel ? `'${weightTimer.config.exerciseLabel}' 설정됨` : '종목 메모가 지워졌습니다.');
  });

  // =========================================================================
  // 3. BOXING ROUNDS TIMER CONTROLLER
  // =========================================================================
  function syncRoundsTheme(phase) {
    if (phase === 'round') {
      document.documentElement.style.setProperty('--active-phase-color', '#00E676');
      document.documentElement.style.setProperty('--active-phase-glow', 'rgba(0, 230, 118, 0.4)');
      roundsPhasePill.textContent = 'FIGHT (라운드)';
    } else if (phase === 'rest') {
      document.documentElement.style.setProperty('--active-phase-color', '#FF9100');
      document.documentElement.style.setProperty('--active-phase-glow', 'rgba(255, 145, 0, 0.35)');
      roundsPhasePill.textContent = 'REST (휴식)';
    } else if (phase === 'prepare') {
      document.documentElement.style.setProperty('--active-phase-color', '#00C2FF');
      document.documentElement.style.setProperty('--active-phase-glow', 'rgba(0, 194, 255, 0.35)');
      roundsPhasePill.textContent = '준비';
    } else if (phase === 'finished') {
      document.documentElement.style.setProperty('--active-phase-color', '#FFD600');
      document.documentElement.style.setProperty('--active-phase-glow', 'rgba(255, 214, 0, 0.45)');
      roundsPhasePill.textContent = '매치 완료! 🏆';
    }
  }

  roundsTimer.onTick = (data) => {
    if (currentActiveTab === 'rounds') {
      roundsMainTimeDisplay.textContent = formatTime(data.remaining);
      roundsRoundDisplay.textContent = `${data.round} / ${data.totalRounds}`;

      const remainingFraction = data.duration > 0
        ? data.remainingPrecise / data.duration
        : 0;
      roundsDialProgressRing.style.strokeDashoffset = `${DIAL_CIRCUMFERENCE * (1 - remainingFraction)}`;

      if (data.phase === 'prepare') {
        roundsNextUpText.textContent = `1라운드 시작 (${formatTime(roundsTimer.config.roundTime)})`;
      } else if (data.phase === 'round') {
        if (data.status === 'idle' && roundsTimer.config.prepare > 0) {
          roundsNextUpText.textContent = `시작 시 준비 ${formatTime(roundsTimer.config.prepare)}`;
        } else if (data.round < data.totalRounds) {
          roundsNextUpText.textContent = `휴식 (${formatTime(roundsTimer.config.restTime)})`;
        } else {
          roundsNextUpText.textContent = '최종 라운드 종료';
        }
      } else if (data.phase === 'rest') {
        roundsNextUpText.textContent = `${data.round + 1}라운드 시작 (${formatTime(roundsTimer.config.roundTime)})`;
      } else {
        roundsNextUpText.textContent = '경기 완료';
      }
    }

    if (data.status === 'running') {
      roundsPlayIcon.style.display = 'none';
      roundsPauseIcon.style.display = 'block';
      const phaseName = data.phase === 'round' ? 'FIGHT' : (data.phase === 'rest' ? 'REST' : '준비');
      updateMediaSessionMetadata({
        title: `[${phaseName}] ${formatTime(data.remaining)}`,
        artist: `라운드 ${data.round} / ${data.totalRounds}`,
        album: currentRoundsConfig.name || '복싱 라운드',
        state: 'playing'
      });
    } else {
      roundsPlayIcon.style.display = 'block';
      roundsPauseIcon.style.display = 'none';
      if (currentActiveTab === 'rounds') {
        updateMediaSessionMetadata({ state: 'paused' });
      }
    }
  };

  roundsTimer.onPhaseChange = ({ phase, round, totalRounds }) => {
    roundsWarningBadge.style.display = 'none';

    if (currentActiveTab === 'rounds') {
      syncRoundsTheme(phase);
    }

    if (phase === 'prepare') {
      sound.playPrepareStart('');
      triggerHaptic([60]);
    } else if (phase === 'round') {
      sound.playWorkStart('', round === totalRounds);
      triggerHaptic([150, 80, 150]);
    } else if (phase === 'rest') {
      sound.playRoundEndBell();
      triggerHaptic([100]);
    }
  };

  roundsTimer.onSecondTick = (sec) => {
    sound.playSecondTick(sec);
  };

  roundsTimer.onWarning = () => {
    roundsWarningBadge.style.display = 'inline-block';
    sound.playWarningClapper();
    triggerHaptic([70, 70]);
  };

  roundsTimer.onCountdownBeep = (sec) => {
    sound.playCountdownBeep(sec);
    triggerHaptic([40]);
  };

  roundsTimer.onComplete = () => {
    releaseWakeLockIfIdle();
    updateBackgroundWorkerState();
    sound.playComplete();
    triggerHaptic([200, 100, 200, 100, 400]);
    if (currentActiveTab === 'rounds') {
      syncRoundsTheme('finished');
    }
    showToast('🏆 전 라운드가 종료되었습니다!');
  };

  roundsPlayBtn.addEventListener('click', () => {
    sound.initContext();
    sound.playTap();
    if (roundsTimer.status === 'running') {
      roundsTimer.pause();
      releaseWakeLockIfIdle();
    } else if (roundsTimer.status === 'paused') {
      roundsTimer.resume();
      requestWakeLock();
    } else {
      localStorage.setItem('timerplus_last_rounds_config', JSON.stringify(currentRoundsConfig));
      roundsTimer.start();
      requestWakeLock();
    }
    updateBackgroundWorkerState();
  });

  roundsPrevBtn.addEventListener('click', () => {
    sound.playTap();
    roundsTimer.skipPrev();
  });

  roundsNextBtn.addEventListener('click', () => {
    sound.playTap();
    roundsTimer.skipNext();
  });

  roundsResetBtn.addEventListener('click', () => {
    sound.playTap();
    const isBusy = roundsTimer.status === 'running' || roundsTimer.status === 'paused';
    handleProtectedReset('rounds', isBusy, () => {
      roundsTimer.reset();
      roundsWarningBadge.style.display = 'none';
      releaseWakeLockIfIdle();
      updateBackgroundWorkerState();
      if (currentActiveTab === 'rounds') syncRoundsTheme('round');
      showToast('라운드 타이머가 초기화되었습니다.');
    });
  });

  function updateRoundsSummaryUI() {
    const c = currentRoundsConfig;
    roundsSummaryHint.textContent = `${formatTime(c.roundTime)} 운동 / ${formatTime(c.restTime)} 휴식`;
    headerRoundsPresetName.textContent = c.name;
    document.getElementById('valRcRoundTime').textContent = formatTime(c.roundTime);
    document.getElementById('valRcRestTime').textContent = formatTime(c.restTime);
    document.getElementById('valRcRounds').textContent = c.totalRounds;
    rcWarningToggle.checked = c.warningTime > 0;
  }

  function openRoundsConfigModal() {
    updateRoundsSummaryUI();
    roundsConfigModal.classList.add('active');
  }

  roundsQuickConfigBtn.addEventListener('click', () => {
    sound.playTap();
    openRoundsConfigModal();
  });

  headerRoundsConfigBtn.addEventListener('click', () => {
    sound.playTap();
    openRoundsConfigModal();
  });

  closeRoundsConfigBtn.addEventListener('click', () => {
    roundsConfigModal.classList.remove('active');
  });

  roundsConfigModal.addEventListener('click', (e) => {
    if (e.target === roundsConfigModal) roundsConfigModal.classList.remove('active');
  });

  document.querySelectorAll('.round-quick-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sound.playTap();
      currentRoundsConfig.roundTime = parseInt(btn.dataset.rtime, 10);
      currentRoundsConfig.restTime = parseInt(btn.dataset.rest, 10);
      currentRoundsConfig.totalRounds = parseInt(btn.dataset.rounds, 10);
      currentRoundsConfig.name = btn.dataset.name;
      updateRoundsSummaryUI();
    });
  });

  document.querySelectorAll('#roundsConfigModal .step-btn').forEach(btn => {
    bindHoldStepper(btn, () => {
      const step = parseInt(btn.dataset.step, 10);
      const target = btn.dataset.target;

      if (target === 'rcRoundTime') {
        currentRoundsConfig.roundTime = Math.max(30, currentRoundsConfig.roundTime + step);
      } else if (target === 'rcRestTime') {
        currentRoundsConfig.restTime = Math.max(0, currentRoundsConfig.restTime + step);
      } else if (target === 'rcRounds') {
        currentRoundsConfig.totalRounds = Math.max(1, Math.min(25, currentRoundsConfig.totalRounds + step));
      }
      currentRoundsConfig.name = '커스텀 라운드';
      updateRoundsSummaryUI();
    });
  });

  saveRoundsConfigBtn.addEventListener('click', () => {
    sound.playTap();
    currentRoundsConfig.warningTime = rcWarningToggle.checked ? 10 : 0;
    roundsTimer.setConfig({
      roundTime: currentRoundsConfig.roundTime,
      restTime: currentRoundsConfig.restTime,
      totalRounds: currentRoundsConfig.totalRounds,
      warningTime: currentRoundsConfig.warningTime,
      prepare: 10
    });
    localStorage.setItem('timerplus_last_rounds_config', JSON.stringify(currentRoundsConfig));
    roundsConfigModal.classList.remove('active');
    updateRoundsSummaryUI();
    showToast('새 라운드 설정이 적용되었습니다.');
  });

  roundsTimer.setConfig({
    roundTime: currentRoundsConfig.roundTime,
    restTime: currentRoundsConfig.restTime,
    totalRounds: currentRoundsConfig.totalRounds,
    warningTime: currentRoundsConfig.warningTime ?? 10,
    prepare: 10
  });
  updateRoundsSummaryUI();

  // =========================================================================
  // 4. STOPWATCH CONTROLLER
  // =========================================================================
  stopwatch.onTick = (totalMs, currentLapMs, status) => {
    if (currentActiveTab === 'stopwatch') {
      stopwatchMainDisplay.textContent = formatStopwatchTime(totalMs);
      stopwatchCurrentLapDisplay.textContent = formatStopwatchTime(currentLapMs);
    }

    if (status === 'running') {
      stopwatchStartIcon.style.display = 'none';
      stopwatchStopIcon.style.display = 'block';
      stopwatchStartStopBtn.style.background = '#ff5252';
      stopwatchLapResetLabel.textContent = '랩 (Lap)';
      updateMediaSessionMetadata({
        title: `[스톱워치] ${formatStopwatchTime(totalMs)}`,
        artist: `현재 랩: ${formatStopwatchTime(currentLapMs)}`,
        album: '스톱워치',
        state: 'playing'
      });
    } else {
      stopwatchStartIcon.style.display = 'block';
      stopwatchStopIcon.style.display = 'none';
      stopwatchStartStopBtn.style.background = 'var(--color-work)';
      stopwatchLapResetLabel.textContent = '초기화';
      if (currentActiveTab === 'stopwatch') {
        updateMediaSessionMetadata({ state: 'paused' });
      }
    }
  };

  stopwatch.onLap = (newLap, laps, analysis) => {
    renderLapsList(laps, analysis);
  };

  stopwatch.onReset = () => {
    stopwatchLapsList.innerHTML = `
      <div class="lap-empty-state">
        시작 후 랩(Lap) 버튼을 누르면 구간 기록이 저장됩니다.
      </div>
    `;
  };

  function renderLapsList(laps, analysis) {
    if (laps.length === 0) {
      stopwatch.onReset();
      return;
    }

    stopwatchLapsList.innerHTML = '';
    laps.forEach((lap, idx) => {
      const isFastest = idx === analysis.fastestIndex;
      const isSlowest = idx === analysis.slowestIndex;

      const item = document.createElement('div');
      item.className = `lap-item ${isFastest ? 'lap-fastest' : ''} ${isSlowest ? 'lap-slowest' : ''}`;

      item.innerHTML = `
        <span>랩 ${lap.index}</span>
        <span style="text-align:center;">
          ${formatStopwatchTime(lap.lapTime)}
          ${isFastest ? '<small style="margin-left:4px;">(최고)</small>' : ''}
          ${isSlowest ? '<small style="margin-left:4px;">(최저)</small>' : ''}
        </span>
        <span style="text-align:right;">${formatStopwatchTime(lap.totalTime)}</span>
      `;

      stopwatchLapsList.appendChild(item);
    });
  }

  stopwatchStartStopBtn.addEventListener('click', () => {
    sound.initContext();
    sound.playTap();
    if (stopwatch.status === 'running') {
      stopwatch.pause();
      releaseWakeLockIfIdle();
    } else {
      stopwatch.start();
      requestWakeLock();
    }
    updateBackgroundWorkerState();
  });

  stopwatchLapResetBtn.addEventListener('click', () => {
    sound.playTap();
    if (stopwatch.status === 'running') {
      stopwatch.recordLap();
      triggerHaptic([40]);
    } else {
      stopwatch.reset();
      updateBackgroundWorkerState();
      showToast('스톱워치가 초기화되었습니다.');
    }
  });

  // =========================================================================
  // GENERAL CONTROLS & MODALS (Settings, Sound, Routine Presets)
  // =========================================================================
  function updateSoundIcon() {
    if (sound.isMuted || sound.soundMode === 'mute') {
      soundIconOn.style.display = 'none';
      soundIconOff.style.display = 'block';
      soundQuickBtn.classList.remove('active');
    } else {
      soundIconOn.style.display = 'block';
      soundIconOff.style.display = 'none';
      soundQuickBtn.classList.add('active');
    }
  }

  soundQuickBtn.addEventListener('click', () => {
    sound.isMuted = !sound.isMuted;
    if (!sound.isMuted && sound.soundMode === 'mute') {
      sound.soundMode = 'all';
    }
    sound.saveSettings();
    updateSoundIcon();
    showToast(sound.isMuted ? '소리 꺼짐 (무음)' : '소리 켜짐');
  });

  fullscreenBtn.addEventListener('click', () => {
    sound.playTap();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  // Presets Modal
  function renderPresetsList() {
    const presets = storage.getPresets();
    const activeId = storage.activePresetId;

    presetsListContainer.innerHTML = '';
    presets.forEach((p) => {
      const card = document.createElement('div');
      card.className = `preset-card ${p.id === activeId ? 'active' : ''}`;

      const totalSec = (p.prepare || 0) + (p.cooldown || 0) +
        (p.sets * ((p.work * p.rounds) + (p.rest * Math.max(0, p.rounds - 1)))) +
        (Math.max(0, p.sets - 1) * (p.setRest || 0));

      const exSummary = Array.isArray(p.exercises) && p.exercises.some(Boolean)
        ? `<div class="preset-exercises-hint">🏋️ ${p.exercises.filter(Boolean).join(' · ')}</div>`
        : '';

      card.innerHTML = `
        <div class="preset-info">
          <div class="preset-title-row">
            <span class="preset-name">${p.name}</span>
            <span class="preset-tag" style="${p.color ? `background:${p.color}22; color:${p.color}; border:1px solid ${p.color}44;` : ''}">${p.tag || '루틴'}</span>
          </div>
          <div class="preset-meta">
            <span>운동: ${formatTime(p.work)}</span>
            <span>휴식: ${formatTime(p.rest)}</span>
            <span>${p.rounds}R ${p.sets > 1 ? `× ${p.sets}S` : ''}</span>
            <span>총 ${formatTime(totalSec)}</span>
          </div>
          ${exSummary}
        </div>
        <div class="preset-card-actions">
          <button class="icon-btn dup-preset-btn" data-id="${p.id}" title="복사본 만들기" aria-label="루틴 복제">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
          <button class="icon-btn edit-preset-btn" data-id="${p.id}" title="편집" aria-label="루틴 편집">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </button>
        </div>
      `;

      card.addEventListener('click', (e) => {
        if (e.target.closest('.edit-preset-btn') || e.target.closest('.dup-preset-btn')) return;
        sound.playTap();
        storage.setActivePresetId(p.id);
        loadActivePreset();
        presetsModal.classList.remove('active');
        showToast(`'${p.name}' 루틴이 선택되었습니다.`);
      });

      card.querySelector('.dup-preset-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        sound.playTap();
        const duplicated = storage.duplicatePreset(p.id);
        if (duplicated) {
          loadActivePreset();
          renderPresetsList();
          showToast(`'${duplicated.name}' 생성 완료!`);
        }
      });

      card.querySelector('.edit-preset-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        sound.playTap();
        presetsModal.classList.remove('active');
        openEditorForPreset(p);
      });

      presetsListContainer.appendChild(card);
    });
  }

  openPresetsBtn.addEventListener('click', () => {
    sound.playTap();
    renderPresetsList();
    presetsModal.classList.add('active');
  });

  closePresetsBtn.addEventListener('click', () => {
    presetsModal.classList.remove('active');
  });

  presetsModal.addEventListener('click', (e) => {
    if (e.target === presetsModal) presetsModal.classList.remove('active');
  });

  // =========================================================================
  // ROUTINE EDITOR & CIRCUIT EXERCISE NAMES
  // =========================================================================
  function syncCircuitInputsFromDOM() {
    const inputs = circuitExercisesInputs.querySelectorAll('.circuit-round-input');
    inputs.forEach(inp => {
      const idx = parseInt(inp.dataset.ridx, 10);
      currentEditorConfig.exercises[idx] = inp.value;
    });
  }

  function renderCircuitExerciseInputs() {
    const count = Math.min(20, Math.max(1, currentEditorConfig.rounds));
    circuitExercisesInputs.innerHTML = '';

    for (let i = 0; i < count; i++) {
      const row = document.createElement('div');
      row.className = 'circuit-input-row';
      const val = currentEditorConfig.exercises[i] || '';
      row.innerHTML = `
        <span class="circuit-r-badge">${i + 1}R</span>
        <input type="text" class="text-input circuit-round-input" data-ridx="${i}" value="${val.replace(/"/g, '&quot;')}" placeholder="${i + 1}라운드 운동명 (예: 스쿼트)">
      `;
      row.querySelector('input').addEventListener('input', (e) => {
        currentEditorConfig.exercises[i] = e.target.value;
        updateCircuitToggleLabel();
      });
      circuitExercisesInputs.appendChild(row);
    }
    updateCircuitToggleLabel();
  }

  function updateCircuitToggleLabel() {
    const count = Math.min(20, currentEditorConfig.rounds);
    const activeCount = (currentEditorConfig.exercises || [])
      .slice(0, count)
      .filter(v => v && v.trim().length > 0).length;

    const arrow = circuitPanelExpanded ? '▴' : '▾';
    circuitExercisesToggleBtn.textContent = activeCount > 0
      ? `종목 ${activeCount}개 ${arrow}`
      : `종목 설정 ${arrow}`;
  }

  function setCircuitPanelOpen(open) {
    circuitPanelExpanded = open;
    circuitExercisesPanel.style.display = open ? 'flex' : 'none';
    updateCircuitToggleLabel();
  }

  circuitExercisesToggleBtn.addEventListener('click', () => {
    sound.playTap();
    setCircuitPanelOpen(!circuitPanelExpanded);
  });

  clearCircuitExercisesBtn.addEventListener('click', () => {
    sound.playTap();
    currentEditorConfig.exercises = [];
    renderCircuitExerciseInputs();
  });

  function updateEditorDisplay() {
    document.getElementById('valEditWork').textContent = formatTime(currentEditorConfig.work);
    document.getElementById('valEditRest').textContent = formatTime(currentEditorConfig.rest);
    document.getElementById('valEditRounds').textContent = currentEditorConfig.rounds;
    document.getElementById('valEditSets').textContent = currentEditorConfig.sets;
    document.getElementById('valEditSetRest').textContent = formatTime(currentEditorConfig.setRest);
    document.getElementById('valEditPrepare').textContent = formatTime(currentEditorConfig.prepare);
    document.getElementById('valEditCooldown').textContent = formatTime(currentEditorConfig.cooldown);
  }

  function openEditorForPreset(preset = null) {
    editingPreset = preset;
    if (preset) {
      editorModalTitle.textContent = `루틴 수정: ${preset.name}`;
      editNameInput.value = preset.name;
      currentEditorConfig = {
        work: preset.work,
        rest: preset.rest,
        rounds: preset.rounds,
        sets: preset.sets,
        setRest: preset.setRest ?? 60,
        prepare: preset.prepare ?? 10,
        cooldown: preset.cooldown ?? 0,
        exercises: Array.isArray(preset.exercises) ? [...preset.exercises] : []
      };
      deleteRoutineBtn.style.display = preset.isBuiltin ? 'none' : 'block';
    } else {
      editorModalTitle.textContent = '새로운 루틴 만들기';
      editNameInput.value = '나만의 운동 루틴';
      currentEditorConfig = {
        work: 30,
        rest: 15,
        rounds: 6,
        sets: 1,
        setRest: 60,
        prepare: 10,
        cooldown: 0,
        exercises: []
      };
      deleteRoutineBtn.style.display = 'none';
    }

    updateEditorDisplay();
    renderCircuitExerciseInputs();
    const hasExercises = currentEditorConfig.exercises.some(v => v && v.trim().length > 0);
    setCircuitPanelOpen(hasExercises);
    editorModal.classList.add('active');
  }

  document.querySelectorAll('#editorModal .step-btn').forEach(btn => {
    bindHoldStepper(btn, () => {
      const step = parseInt(btn.dataset.step, 10);
      const target = btn.dataset.target;

      if (target === 'editWork') {
        currentEditorConfig.work = Math.max(5, currentEditorConfig.work + step);
      } else if (target === 'editRest') {
        currentEditorConfig.rest = Math.max(0, currentEditorConfig.rest + step);
      } else if (target === 'editRounds') {
        syncCircuitInputsFromDOM();
        currentEditorConfig.rounds = Math.max(1, Math.min(99, currentEditorConfig.rounds + step));
        renderCircuitExerciseInputs();
      } else if (target === 'editSets') {
        currentEditorConfig.sets = Math.max(1, Math.min(20, currentEditorConfig.sets + step));
      } else if (target === 'editSetRest') {
        currentEditorConfig.setRest = Math.max(0, currentEditorConfig.setRest + step);
      } else if (target === 'editPrepare') {
        currentEditorConfig.prepare = Math.max(0, Math.min(60, currentEditorConfig.prepare + step));
      } else if (target === 'editCooldown') {
        currentEditorConfig.cooldown = Math.max(0, Math.min(600, currentEditorConfig.cooldown + step));
      }

      updateEditorDisplay();
    });
  });

  createNewRoutineBtn.addEventListener('click', () => {
    presetsModal.classList.remove('active');
    openEditorForPreset(null);
  });

  editCurrentRoutineBtn.addEventListener('click', () => {
    const active = storage.getActivePreset();
    openEditorForPreset(active);
  });

  saveRoutineBtn.addEventListener('click', () => {
    sound.playTap();
    syncCircuitInputsFromDOM();
    const trimmedExercises = (currentEditorConfig.exercises || [])
      .slice(0, Math.min(20, currentEditorConfig.rounds))
      .map(s => (s || '').trim());
    const cleanedExercises = trimmedExercises.some(Boolean) ? trimmedExercises : [];

    const name = editNameInput.value.trim() || '운동 루틴';
    const presetData = {
      ...currentEditorConfig,
      exercises: cleanedExercises,
      name,
      id: editingPreset ? editingPreset.id : undefined
    };

    const saved = storage.savePreset(presetData);
    storage.setActivePresetId(saved.id);
    loadActivePreset();
    editorModal.classList.remove('active');
    showToast(`'${name}' 루틴이 저장 및 적용되었습니다.`);
  });

  deleteRoutineBtn.addEventListener('click', () => {
    if (!editingPreset || editingPreset.isBuiltin) return;
    if (confirm(`'${editingPreset.name}' 루틴을 정말 삭제하시겠습니까?`)) {
      storage.deletePreset(editingPreset.id);
      loadActivePreset();
      editorModal.classList.remove('active');
      showToast('루틴이 삭제되었습니다.');
    }
  });

  closeEditorBtn.addEventListener('click', () => {
    editorModal.classList.remove('active');
  });

  editorModal.addEventListener('click', (e) => {
    if (e.target === editorModal) editorModal.classList.remove('active');
  });

  // =========================================================================
  // SETTINGS & AUDIO MODAL
  // =========================================================================
  openSettingsBtn.addEventListener('click', () => {
    sound.playTap();
    volumeSlider.value = Math.round(sound.volume * 100);
    volumePercentText.textContent = `${Math.round(sound.volume * 100)}%`;
    if (tickSoundToggle) tickSoundToggle.checked = sound.tickSoundEnabled;
    if (halfwayAlertToggle) halfwayAlertToggle.checked = sound.halfwayAlertEnabled;
    if (audioMixingToggle) audioMixingToggle.checked = sound.audioMixingMode;

    document.querySelectorAll('.seg-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.mode === sound.soundMode);
    });

    settingsModal.classList.add('active');
  });

  closeSettingsModalBtn.addEventListener('click', () => {
    settingsModal.classList.remove('active');
  });

  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) settingsModal.classList.remove('active');
  });

  document.querySelectorAll('.seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sound.playTap();
      document.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      sound.soundMode = btn.dataset.mode;
      sound.isMuted = (sound.soundMode === 'mute');
      sound.saveSettings();
      updateSoundIcon();
    });
  });

  volumeSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    sound.volume = val / 100;
    volumePercentText.textContent = `${val}%`;
    sound.saveSettings();
  });

  if (tickSoundToggle) {
    tickSoundToggle.addEventListener('change', () => {
      sound.tickSoundEnabled = tickSoundToggle.checked;
      sound.saveSettings();
      if (sound.tickSoundEnabled) {
        sound.playSecondTick(2);
      }
      showToast(sound.tickSoundEnabled ? '⏱️ 1초 똑딱 초침 소리 ON' : '1초 똑딱 초침 소리 OFF');
    });
  }

  if (halfwayAlertToggle) {
    halfwayAlertToggle.addEventListener('change', () => {
      sound.halfwayAlertEnabled = halfwayAlertToggle.checked;
      sound.saveSettings();
      showToast(sound.halfwayAlertEnabled ? '🔔 절반 경과 알림 ON' : '절반 경과 알림 OFF');
    });
  }

  if (audioMixingToggle) {
    audioMixingToggle.addEventListener('change', () => {
      sound.audioMixingMode = audioMixingToggle.checked;
      sound.saveSettings();
      showToast(sound.audioMixingMode ? '🎵 음악 앱 동시 재생 모드 ON' : '배경 오디오 우선 모드');
    });
  }

  let testSoundTimers = [];
  function clearTestTimers() {
    testSoundTimers.forEach(t => clearTimeout(t));
    testSoundTimers = [];
  }

  if (testTickBtn) {
    testTickBtn.addEventListener('click', () => {
      sound.initContext();
      clearTestTimers();
      const prevTick = sound.tickSoundEnabled;
      sound.tickSoundEnabled = true;
      [0, 1, 2, 3].forEach((step) => {
        testSoundTimers.push(setTimeout(() => {
          sound.playSecondTick(4 - step);
          if (step === 3) sound.tickSoundEnabled = prevTick;
        }, step * 1000));
      });
    });
  }

  testBellBtn.addEventListener('click', () => {
    sound.initContext();
    sound.playBoxingBell();
  });

  testBeepBtn.addEventListener('click', () => {
    sound.initContext();
    clearTestTimers();
    sound.playCountdownBeep(3);
    testSoundTimers.push(setTimeout(() => sound.playCountdownBeep(2), 1000));
    testSoundTimers.push(setTimeout(() => sound.playCountdownBeep(1), 2000));
    testSoundTimers.push(setTimeout(() => sound.playWorkStart('', false), 3000));
  });

  resetDefaultsBtn.addEventListener('click', () => {
    if (confirm('모든 루틴을 초기 기본 설정으로 되돌리시겠습니까?')) {
      storage.resetToDefaults();
      loadActivePreset();
      settingsModal.classList.remove('active');
      showToast('기본 루틴으로 복원되었습니다.');
    }
  });

  openIosGuideBtn.addEventListener('click', () => {
    settingsModal.classList.remove('active');
    iosGuideModal.classList.add('active');
  });

  closeIosGuideBtn.addEventListener('click', () => {
    iosGuideModal.classList.remove('active');
  });

  confirmIosGuideBtn.addEventListener('click', () => {
    iosGuideModal.classList.remove('active');
  });

  // PWA Service Worker Registration
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker error:', err);
        });
    });
  }

  // =========================================================================
  // KEYBOARD SHORTCUTS (Desktop / Tablet / Laptop support)
  // =========================================================================
  window.addEventListener('keydown', (e) => {
    if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

    if (e.code === 'Space') {
      e.preventDefault();
      toggleCurrentTimer();
      return;
    }

    if (e.code === 'ArrowRight') {
      e.preventDefault();
      skipCurrentTimerNext();
      return;
    }

    if (e.code === 'ArrowLeft') {
      e.preventDefault();
      skipCurrentTimerPrev();
      return;
    }

    if (e.code === 'Equal' || e.code === 'NumpadAdd') {
      e.preventDefault();
      if (currentActiveTab === 'interval' && (timer.status === 'running' || timer.status === 'paused')) {
        timer.adjustPhaseTime(15);
        showToast('+15초 연장되었습니다.');
      } else if (currentActiveTab === 'weight') {
        weightTimer.adjustRest(15);
        showToast('휴식 +15초');
      }
      return;
    }

    if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
      e.preventDefault();
      if (currentActiveTab === 'interval' && (timer.status === 'running' || timer.status === 'paused')) {
        timer.adjustPhaseTime(-10);
        showToast('-10초 단축되었습니다.');
      } else if (currentActiveTab === 'weight') {
        weightTimer.adjustRest(-15);
        showToast('휴식 -15초');
      }
      return;
    }

    if (e.code === 'KeyR') {
      e.preventDefault();
      if (currentActiveTab === 'interval') {
        resetBtn.click();
      } else if (currentActiveTab === 'weight') {
        weightResetBtn.click();
      } else if (currentActiveTab === 'rounds') {
        roundsResetBtn.click();
      } else if (currentActiveTab === 'stopwatch') {
        stopwatch.reset();
        showToast('스톱워치가 초기화되었습니다.');
      }
      return;
    }

    if (e.code === 'KeyM') {
      e.preventDefault();
      soundQuickBtn.click();
      return;
    }

    if (e.code === 'Digit1') {
      switchTab('interval');
      sound.playTap();
      return;
    }
    if (e.code === 'Digit2') {
      switchTab('weight');
      sound.playTap();
      return;
    }
    if (e.code === 'Digit3') {
      switchTab('rounds');
      sound.playTap();
      return;
    }
    if (e.code === 'Digit4') {
      switchTab('stopwatch');
      sound.playTap();
      return;
    }
  });

  // Initialize
  loadActivePreset();
  weightTimer.notifyTick();
  updateSoundIcon();
  const savedTab = localStorage.getItem('timerplus_last_active_tab') || 'interval';
  switchTab(savedTab);
});
