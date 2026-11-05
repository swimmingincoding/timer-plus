/**
 * TimerPlus Application Controller
 * Orchestrates Interval Timer, Boxing Round Timer, Stopwatch,
 * Audio Engine, Storage, Screen WakeLock, and PWA Installation.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Core Engines
  const timer = new WorkoutTimer();
  const roundsTimer = new BoxingRoundTimer();
  const stopwatch = new StopwatchEngine();
  const storage = window.storageManager;
  const sound = window.soundEngine;

  // 2. Navigation Tabs & Views
  let currentActiveTab = 'interval'; // 'interval', 'rounds', 'stopwatch'
  const tabInterval = document.getElementById('tabInterval');
  const tabRounds = document.getElementById('tabRounds');
  const tabStopwatch = document.getElementById('tabStopwatch');

  const viewInterval = document.getElementById('viewInterval');
  const viewRounds = document.getElementById('viewRounds');
  const viewStopwatch = document.getElementById('viewStopwatch');

  // Header Elements
  const headerRoutineName = document.getElementById('headerRoutineName');
  const openPresetsBtn = document.getElementById('openPresetsBtn');
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
  const dialProgressRing = document.getElementById('dialProgressRing');
  const mainTimeDisplay = document.getElementById('mainTimeDisplay');
  const totalRemainingDisplay = document.getElementById('totalRemainingDisplay');
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
  const saveRoutineBtn = document.getElementById('saveRoutineBtn');
  const deleteRoutineBtn = document.getElementById('deleteRoutineBtn');

  const roundsConfigModal = document.getElementById('roundsConfigModal');
  const closeRoundsConfigBtn = document.getElementById('closeRoundsConfigBtn');
  const saveRoundsConfigBtn = document.getElementById('saveRoundsConfigBtn');
  const rcWarningToggle = document.getElementById('rcWarningToggle');

  const settingsModal = document.getElementById('settingsModal');
  const closeSettingsModalBtn = document.getElementById('closeSettingsModalBtn');
  const volumeSlider = document.getElementById('volumeSlider');
  const volumePercentText = document.getElementById('volumePercentText');
  const testBellBtn = document.getElementById('testBellBtn');
  const testBeepBtn = document.getElementById('testBeepBtn');
  const audioMixingToggle = document.getElementById('audioMixingToggle');
  const resetDefaultsBtn = document.getElementById('resetDefaultsBtn');
  const openIosGuideBtn = document.getElementById('openIosGuideBtn');

  const iosGuideModal = document.getElementById('iosGuideModal');
  const closeIosGuideBtn = document.getElementById('closeIosGuideBtn');
  const confirmIosGuideBtn = document.getElementById('confirmIosGuideBtn');



  // Constants
  const DIAL_CIRCUMFERENCE = 2 * Math.PI * 115; // 722.56
  dialProgressRing.style.strokeDasharray = `${DIAL_CIRCUMFERENCE}`;
  roundsDialProgressRing.style.strokeDasharray = `${DIAL_CIRCUMFERENCE}`;

  // State Variables
  let wakeLockSentinel = null;
  let deferredInstallPrompt = null;
  let editingPreset = null;
  let currentEditorConfig = {
    work: 20,
    rest: 10,
    rounds: 8,
    sets: 1,
    setRest: 60,
    prepare: 10,
    cooldown: 0
  };

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

  // =========================================================================
  // Screen Wake Lock API
  // =========================================================================
  async function requestWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        wakeLockSentinel = await navigator.wakeLock.request('screen');
        wakelockText.textContent = '화면 유지 ON';
        wakelockStatus.style.color = 'var(--color-work)';
        wakeLockSentinel.addEventListener('release', () => {
          if (timer.status !== 'running' && roundsTimer.status !== 'running' && stopwatch.status !== 'running') {
            wakelockText.textContent = '화면 유지 대기';
            wakelockStatus.style.color = 'var(--text-muted)';
          }
        });
      } catch (err) {
        console.warn('Wake Lock error:', err);
      }
    }
  }

  function releaseWakeLock() {
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
    if (roundsTimer.status === 'running') roundsTimer.syncTime();
    if (stopwatch.status === 'running') stopwatch.syncTime();
  }

  // Background Web Worker: stays alive in background without main-thread tab throttling
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
    const isAnyRunning = timer.status === 'running' || roundsTimer.status === 'running' || stopwatch.status === 'running';
    if (bgWorker) {
      bgWorker.postMessage(isAnyRunning ? 'start' : 'stop');
    }
  }

  // Immediate catch-up & audio engine self-healing when tab wakes up, app re-opens, or window regains focus
  document.addEventListener('visibilitychange', () => {
    const isAnyRunning = timer.status === 'running' || roundsTimer.status === 'running' || stopwatch.status === 'running';
    if (document.visibilityState === 'visible') {
      sound.resumeContext();
      syncAllTimers();
      if (isAnyRunning) {
        requestWakeLock();
      }
    }
  });

  window.addEventListener('focus', () => {
    sound.resumeContext();
    syncAllTimers();
  });
  window.addEventListener('pageshow', () => {
    sound.resumeContext();
    syncAllTimers();
  });
  window.addEventListener('touchstart', () => sound.resumeContext(), { passive: true });
  window.addEventListener('pointerdown', () => sound.resumeContext(), { passive: true });

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

  function showToast(text) {
    toastMsg.textContent = text;
    toastMsg.classList.add('show');
    setTimeout(() => {
      toastMsg.classList.remove('show');
    }, 2400);
  }

  // =========================================================================
  // BLUETOOTH / EARBUDS MEDIA SESSION & AUDIO MIXING COEXISTENCE
  // =========================================================================
  // Silent audio is ONLY used when audio mixing mode is OFF (to prevent hijacking YouTube Music / Spotify)
  const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
  silentAudio.loop = true;

  function updateMediaSessionMetadata({ title, artist, album, state = 'playing' }) {
    // If audioMixingMode is active, keep background music playing and never hijack audio focus!
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
      } catch (e) {
        // Ignore media session errors
      }
    }

    if (state === 'playing') {
      silentAudio.play().catch(() => {});
    } else {
      silentAudio.pause();
    }
  }

  // Central Control Actions (Used by Media Session and Keyboard Shortcuts)
  function toggleCurrentTimer() {
    if (currentActiveTab === 'interval') {
      playBtn.click();
    } else if (currentActiveTab === 'rounds') {
      roundsPlayBtn.click();
    } else if (currentActiveTab === 'stopwatch') {
      stopwatchStartStopBtn.click();
    }
  }

  function skipCurrentTimerNext() {
    if (currentActiveTab === 'interval') {
      nextBtn.click();
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

  // Bind Media Session hardware buttons (AirPods / Earbuds click)
  if ('mediaSession' in navigator) {
    try {
      navigator.mediaSession.setActionHandler('play', () => toggleCurrentTimer());
      navigator.mediaSession.setActionHandler('pause', () => toggleCurrentTimer());
      navigator.mediaSession.setActionHandler('nexttrack', () => skipCurrentTimerNext());
      navigator.mediaSession.setActionHandler('previoustrack', () => skipCurrentTimerPrev());
    } catch (e) {
      console.warn('MediaSession handler registration failed', e);
    }
  }

  // =========================================================================
  // TAB NAVIGATION CONTROLLER
  // =========================================================================
  function switchTab(tabName) {
    currentActiveTab = tabName;
    try {
      localStorage.setItem('timerplus_last_active_tab', tabName);
    } catch (e) {}

    // Update bottom tabs
    [tabInterval, tabRounds, tabStopwatch].forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Update views
    viewInterval.classList.toggle('active', tabName === 'interval');
    viewRounds.classList.toggle('active', tabName === 'rounds');
    viewStopwatch.classList.toggle('active', tabName === 'stopwatch');

    // Update Header
    if (tabName === 'interval') {
      openPresetsBtn.style.display = 'flex';
      headerRoundsConfigBtn.style.display = 'none';
      headerStopwatchTitle.style.display = 'none';
      // Sync Interval theme
      const theme = PHASE_THEMES[timer.currentPhase] || PHASE_THEMES.work;
      document.documentElement.style.setProperty('--active-phase-color', theme.color);
      document.documentElement.style.setProperty('--active-phase-glow', theme.glow);
      phasePill.textContent = theme.label;
    } else if (tabName === 'rounds') {
      openPresetsBtn.style.display = 'none';
      headerRoundsConfigBtn.style.display = 'flex';
      headerStopwatchTitle.style.display = 'none';
      // Sync Rounds theme
      syncRoundsTheme(roundsTimer.phase);
    } else if (tabName === 'stopwatch') {
      openPresetsBtn.style.display = 'none';
      headerRoundsConfigBtn.style.display = 'none';
      headerStopwatchTitle.style.display = 'block';
      document.documentElement.style.setProperty('--active-phase-color', '#00E676');
      document.documentElement.style.setProperty('--active-phase-glow', 'rgba(0, 230, 118, 0.35)');
    }
  }

  tabInterval.addEventListener('click', () => {
    sound.playTap();
    switchTab('interval');
  });

  tabRounds.addEventListener('click', () => {
    sound.playTap();
    switchTab('rounds');
  });

  tabStopwatch.addEventListener('click', () => {
    sound.playTap();
    switchTab('stopwatch');
  });

  // =========================================================================
  // 1. INTERVAL TIMER CONTROLLER
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

      const pct = Math.min(100, Math.round(data.totalProgress * 100));
      overallPercentText.textContent = `${pct}%`;
      overallProgressBar.style.width = `${pct}%`;

      if (data.status === 'finished') {
        nextUpText.textContent = '운동 완료!';
      } else if (data.status === 'idle' && timer.config.prepare > 0) {
        nextUpText.textContent = `시작 시 준비 ${formatTime(timer.config.prepare)}`;
      } else if (data.nextInfo) {
        nextUpText.textContent = `${data.nextInfo.label} (${formatTime(data.nextInfo.duration)})`;
      }
    }

    if (data.status === 'running') {
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'block';
      const theme = PHASE_THEMES[data.phase] || PHASE_THEMES.work;
      updateMediaSessionMetadata({
        title: `[${theme.label}] ${formatTime(data.phaseRemaining)}`,
        artist: `라운드 ${data.round} / ${data.rounds}`,
        album: storage.getActivePreset()?.name || '타바타 4분',
        state: 'playing'
      });
    } else {
      playIcon.style.display = 'block';
      pauseIcon.style.display = 'none';
      updateMediaSessionMetadata({ state: 'paused' });
    }
  };

  timer.onPhaseChange = (phaseInfo) => {
    const theme = PHASE_THEMES[phaseInfo.phase] || PHASE_THEMES.work;
    if (currentActiveTab === 'interval') {
      document.documentElement.style.setProperty('--active-phase-color', theme.color);
      document.documentElement.style.setProperty('--active-phase-glow', theme.glow);
      phasePill.textContent = theme.label;
    }

    if (phaseInfo.phase === 'work') {
      sound.playWorkStart();
      triggerHaptic([100, 50, 100]);
    } else if (phaseInfo.phase === 'rest') {
      sound.playRestStart();
      triggerHaptic([80]);
    } else if (phaseInfo.phase === 'setRest') {
      sound.playSetRestStart();
      triggerHaptic([100, 100, 100]);
    } else if (phaseInfo.phase === 'cooldown') {
      sound.playRestStart();
      triggerHaptic([60]);
    }
  };

  timer.onCountdownBeep = (sec) => {
    sound.playCountdownBeep(sec, timer.currentPhase);
    triggerHaptic([40]);
  };

  timer.onComplete = () => {
    releaseWakeLock();
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
      releaseWakeLock();
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

  resetBtn.addEventListener('click', () => {
    sound.playTap();
    timer.reset();
    releaseWakeLock();
    updateBackgroundWorkerState();
    showToast('인터벌 타이머가 초기화되었습니다.');
  });

  // =========================================================================
  // 2. BOXING ROUNDS TIMER CONTROLLER
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
      updateMediaSessionMetadata({ state: 'paused' });
    }
  };

  roundsTimer.onPhaseChange = ({ phase, round, totalRounds }) => {
    roundsWarningBadge.style.display = 'none';

    if (currentActiveTab === 'rounds') {
      syncRoundsTheme(phase);
    }

    if (phase === 'round') {
      sound.playWorkStart();
      triggerHaptic([150, 80, 150]);
    } else if (phase === 'rest') {
      sound.playRoundEndBell();
      triggerHaptic([100]);
    }
  };

  roundsTimer.onWarning = () => {
    roundsWarningBadge.style.display = 'inline-block';
    sound.playWarningClapper();
    triggerHaptic([70, 70]);
  };

  roundsTimer.onCountdownBeep = (sec) => {
    sound.playCountdownBeep(sec, roundsTimer.phase);
    triggerHaptic([40]);
  };

  roundsTimer.onComplete = () => {
    releaseWakeLock();
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
      releaseWakeLock();
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
    roundsTimer.reset();
    roundsWarningBadge.style.display = 'none';
    releaseWakeLock();
    updateBackgroundWorkerState();
    showToast('라운드 타이머가 초기화되었습니다.');
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

  // Quick preset buttons for boxing
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

  // Steppers for rounds config
  document.querySelectorAll('#roundsConfigModal .step-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sound.playTap();
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

  // Initialize Rounds timer
  roundsTimer.setConfig({
    roundTime: currentRoundsConfig.roundTime,
    restTime: currentRoundsConfig.restTime,
    totalRounds: currentRoundsConfig.totalRounds,
    warningTime: 10,
    prepare: 10
  });
  updateRoundsSummaryUI();

  // =========================================================================
  // 3. STOPWATCH CONTROLLER
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
      updateMediaSessionMetadata({ state: 'paused' });
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
      releaseWakeLock();
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
        (p.sets * ((p.work * p.rounds) + (p.rest * (p.rounds - 1)))) +
        ((p.sets - 1) * (p.setRest || 0));

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
        </div>
        <div class="preset-card-actions">
          <button class="icon-btn edit-preset-btn" data-id="${p.id}" title="편집">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </button>
        </div>
      `;

      card.addEventListener('click', (e) => {
        if (e.target.closest('.edit-preset-btn')) return;
        sound.playTap();
        storage.setActivePresetId(p.id);
        loadActivePreset();
        presetsModal.classList.remove('active');
        showToast(`'${p.name}' 루틴이 선택되었습니다.`);
      });

      const editBtn = card.querySelector('.edit-preset-btn');
      editBtn.addEventListener('click', (e) => {
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

  // Routine Editor Logic
  function updateEditorDisplay() {
    document.getElementById('valEditWork').textContent = formatTime(currentEditorConfig.work);
    document.getElementById('valEditRest').textContent = formatTime(currentEditorConfig.rest);
    document.getElementById('valEditRounds').textContent = currentEditorConfig.rounds;
    document.getElementById('valEditSets').textContent = currentEditorConfig.sets;
    document.getElementById('valEditSetRest').textContent = formatTime(currentEditorConfig.setRest);
    document.getElementById('valEditPrepare').textContent = formatTime(currentEditorConfig.prepare);
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
        cooldown: preset.cooldown ?? 0
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
        cooldown: 0
      };
      deleteRoutineBtn.style.display = 'none';
    }

    updateEditorDisplay();
    editorModal.classList.add('active');
  }

  document.querySelectorAll('#editorModal .step-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sound.playTap();
      const step = parseInt(btn.dataset.step, 10);
      const target = btn.dataset.target;

      if (target === 'editWork') {
        currentEditorConfig.work = Math.max(5, currentEditorConfig.work + step);
      } else if (target === 'editRest') {
        currentEditorConfig.rest = Math.max(0, currentEditorConfig.rest + step);
      } else if (target === 'editRounds') {
        currentEditorConfig.rounds = Math.max(1, Math.min(99, currentEditorConfig.rounds + step));
      } else if (target === 'editSets') {
        currentEditorConfig.sets = Math.max(1, Math.min(20, currentEditorConfig.sets + step));
      } else if (target === 'editSetRest') {
        currentEditorConfig.setRest = Math.max(0, currentEditorConfig.setRest + step);
      } else if (target === 'editPrepare') {
        currentEditorConfig.prepare = Math.max(0, Math.min(60, currentEditorConfig.prepare + step));
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
    const name = editNameInput.value.trim() || '운동 루틴';
    const presetData = {
      ...currentEditorConfig,
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

  // Settings Modal
  openSettingsBtn.addEventListener('click', () => {
    sound.playTap();
    volumeSlider.value = Math.round(sound.volume * 100);
    volumePercentText.textContent = `${Math.round(sound.volume * 100)}%`;
    if (audioMixingToggle) {
      audioMixingToggle.checked = sound.audioMixingMode;
    }

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

  if (audioMixingToggle) {
    audioMixingToggle.addEventListener('change', () => {
      sound.audioMixingMode = audioMixingToggle.checked;
      sound.saveSettings();
      showToast(sound.audioMixingMode ? '🎵 음악 앱 동시 재생 모드 ON' : '배경 오디오 우선 모드');
    });
  }

  testBellBtn.addEventListener('click', () => {
    sound.playBoxingBell();
  });

  let testCountdownTimeout = null;
  testBeepBtn.addEventListener('click', () => {
    sound.initContext();
    if (testCountdownTimeout) clearTimeout(testCountdownTimeout);
    sound.playCountdownBeep(3, 'work');
    testCountdownTimeout = setTimeout(() => {
      sound.playCountdownBeep(2, 'work');
      testCountdownTimeout = setTimeout(() => {
        sound.playCountdownBeep(1, 'work');
        testCountdownTimeout = setTimeout(() => {
          sound.playWorkStart();
        }, 1000);
      }, 1000);
    }, 1000);
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

  // PWA Service Worker & Installation
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
    // Ignore keystrokes when typing inside text inputs
    if (e.target && ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

    // Spacebar: Play / Pause active timer
    if (e.code === 'Space') {
      e.preventDefault();
      toggleCurrentTimer();
      return;
    }

    // Right Arrow: Next interval / round / lap
    if (e.code === 'ArrowRight') {
      e.preventDefault();
      skipCurrentTimerNext();
      return;
    }

    // Left Arrow: Previous interval / round
    if (e.code === 'ArrowLeft') {
      e.preventDefault();
      skipCurrentTimerPrev();
      return;
    }

    // R: Reset active timer
    if (e.code === 'KeyR') {
      e.preventDefault();
      if (currentActiveTab === 'interval') {
        resetBtn.click();
      } else if (currentActiveTab === 'rounds') {
        roundsResetBtn.click();
      } else if (currentActiveTab === 'stopwatch') {
        stopwatch.reset();
        showToast('스톱워치가 초기화되었습니다.');
      }
      return;
    }

    // M: Toggle Sound (Mute)
    if (e.code === 'KeyM') {
      e.preventDefault();
      soundQuickBtn.click();
      return;
    }

    // 1, 2, 3: Fast Tab Switching
    if (e.code === 'Digit1') {
      switchTab('interval');
      sound.playTap();
      return;
    }
    if (e.code === 'Digit2') {
      switchTab('rounds');
      sound.playTap();
      return;
    }
    if (e.code === 'Digit3') {
      switchTab('stopwatch');
      sound.playTap();
      return;
    }
  });

  // Initialize
  loadActivePreset();
  updateSoundIcon();
  const savedTab = localStorage.getItem('timerplus_last_active_tab') || 'interval';
  switchTab(savedTab);
});
