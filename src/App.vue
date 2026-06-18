<script setup>
import { ref, computed, onMounted, watch, nextTick, reactive } from 'vue';
import { courseData } from './courseData.js';
import { getProject, types } from '@theatre/core';

const theatreState = {
  "revisionHistory": [],
  "definitionVersion": "0.4.0",
  "sheetsById": {
    "QuizSheet": {
      "sequence": {
        "type": "PositionalSequence",
        "length": 1,
        "tracksByObject": {
          "QuizOverlay": {
            "trackDataByPropertyPath": {
              "y": {
                "type": "BasicKeyframedTrack",
                "keyframes": [
                  { "id": "k1", "position": 0, "value": 80, "connectedRight": true, "handles": [ 0.5, 1, 0.5, 0 ] },
                  { "id": "k1b", "position": 0.3, "value": -15, "connectedRight": true, "handles": [ 0.5, 1, 0.5, 0 ] },
                  { "id": "k2", "position": 0.45, "value": 0, "connectedRight": true, "handles": [ 0.5, 1, 0.5, 0 ] }
                ]
              },
              "opacity": {
                "type": "BasicKeyframedTrack",
                "keyframes": [
                  { "id": "k3", "position": 0, "value": 0, "connectedRight": true, "handles": [ 0.5, 1, 0.5, 0 ] },
                  { "id": "k4", "position": 0.25, "value": 1, "connectedRight": true, "handles": [ 0.5, 1, 0.5, 0 ] }
                ]
              },
              "scale": {
                "type": "BasicKeyframedTrack",
                "keyframes": [
                  { "id": "k5", "position": 0, "value": 0.8, "connectedRight": true, "handles": [ 0.5, 1, 0.5, 0 ] },
                  { "id": "k5b", "position": 0.3, "value": 1.05, "connectedRight": true, "handles": [ 0.5, 1, 0.5, 0 ] },
                  { "id": "k6", "position": 0.45, "value": 1, "connectedRight": true, "handles": [ 0.5, 1, 0.5, 0 ] }
                ]
              }
            }
          }
        }
      }
    }
  }
};
const proj = getProject('LMSProject', { state: theatreState });
const sheet = proj.sheet('QuizSheet');
const quizObj = sheet.object('QuizOverlay', { y: 50, opacity: 0, scale: 0.95 });
const quizModalStyles = ref({ transform: 'translateY(50px) scale(0.95)', opacity: 0, display: 'none' });


// Reactive App States
const currentStep = ref(1);
const totalSteps = Object.keys(courseData).length;
const APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz58EffczfpcNL0bvbD6VZvrY3mrVNtmpWasSwJT0baOowD2yGu_KNM0YNul9EtxxKVpg/exec';
const isLoggedIn = ref(false);
const loginEmail = ref('');
const isLoggingIn = ref(false);
const showLoginError = ref(false);
const showProfileMenu = ref(false);
const studentData = ref({ name: '', school: '', email: '' });
const studentProgress = ref({}); // Menyimpan progress jawaban & attempts

// Tambahkan auto-ID ke semua soal agar gampang ditrack
Object.keys(courseData).forEach(stepId => {
  let qCounter = 1;
  courseData[stepId].quizzes?.forEach(quiz => {
    quiz.questions.forEach(q => {
      q.qid = `V${stepId}_Q${qCounter}`;
      qCounter++;
    });
  });
});

const saveProgress = (key, value) => {
  studentProgress.value[key] = value;
  localStorage.setItem('mds_student_progress', JSON.stringify(studentProgress.value));
  syncToSheets();
};

const syncToSheets = async () => {
  if (!isLoggedIn.value) return;
  const payload = {
    Students_Email: studentData.value.email,
    Students_Name: studentData.value.name,
    Students_School: studentData.value.school,
    ...studentProgress.value
  };
  try {
    await fetch(APP_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'text/plain;charset=utf-8' } // text/plain untuk bypass CORS AppScript
    });
  } catch(err) {
    console.error("Sync error", err);
  }
};

const handleLogin = async () => {
  if (!loginEmail.value.trim()) return;
  
  isLoggingIn.value = true;
  showLoginError.value = false;

  try {
    const res = await fetch(`${APP_SCRIPT_URL}?action=login&email=${encodeURIComponent(loginEmail.value)}`);
    const data = await res.json();
    if (data.success) {
      studentData.value = { name: data.name, school: data.school, email: data.email };
      isLoggedIn.value = true;
      localStorage.setItem('mds_student_login', JSON.stringify(studentData.value));
    } else {
      showLoginError.value = true;
    }
  } catch (err) {
    console.error("Login error", err);
    showLoginError.value = true;
  } finally {
    isLoggingIn.value = false;
  }
};

const handleLogout = () => {
  localStorage.removeItem('mds_student_login');
  isLoggedIn.value = false;
  loginEmail.value = '';
  studentData.value = { email: '', name: '', school: '' };
};

onMounted(() => {
  const savedLogin = localStorage.getItem('mds_student_login');
  if (savedLogin) {
    studentData.value = JSON.parse(savedLogin);
    isLoggedIn.value = true;
  }
  const savedProgress = localStorage.getItem('mds_student_progress');
  if (savedProgress) {
    studentProgress.value = JSON.parse(savedProgress);
  }
});

const videoWatchedStatus = ref({
  1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false
});

const youtubeReady = ref(false);
const players = {};
const timeCheckers = {};

const playerStates = ref({
  1: { isPlaying: false, currentTime: 0, duration: 0, isMuted: false, isReady: false, isError: false, hasStarted: false },
  2: { isPlaying: false, currentTime: 0, duration: 0, isMuted: false, isReady: false, isError: false, hasStarted: false },
  3: { isPlaying: false, currentTime: 0, duration: 0, isMuted: false, isReady: false, isError: false, hasStarted: false },
  4: { isPlaying: false, currentTime: 0, duration: 0, isMuted: false, isReady: false, isError: false, hasStarted: false },
  5: { isPlaying: false, currentTime: 0, duration: 0, isMuted: false, isReady: false, isError: false, hasStarted: false },
  6: { isPlaying: false, currentTime: 0, duration: 0, isMuted: false, isReady: false, isError: false, hasStarted: false },
  7: { isPlaying: false, currentTime: 0, duration: 0, isMuted: false, isReady: false, isError: false, hasStarted: false },
});

const isFullscreen = ref(false);
const videoContainers = ref({});

// Quiz Overlay States
const quizState = ref({
  isOpen: false,
  shuffledQuestions: [],
  currentQuestionIdx: 0,
  resumeVideoAfterQuiz: false,
  resumeVideoTime: null,
  quizFeedback: '',
  quizFeedbackType: '',
  isNextBtnVisible: false,
  nextBtnText: 'Soal berikutnya →',
  activeQuizConfig: null,
  activeQuizStep: null,
  replayingQuizVideo: false,
  replayCheckpointArmed: false,
  choicesDisabled: false
});

const quizReturn = ref({
  isVisible: false
});

const showCompletionToast = ref(false);
const failedAttempts = ref({});

// Time formatting helper
const formatVideoTime = (value) => {
  const totalSeconds = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return minutes + ":" + seconds;
};

const getBookmarks = (stepId) => {
  return courseData[stepId]?.bookmarks || [];
};

const getVideoStartBoundary = (stepId) => {
  return courseData[stepId]?.startSeconds || 0;
};

// Seek boundary enforcement
const enforceVideoStartBoundary = (stepId) => {
  const player = players[stepId];
  if (!player || typeof player.getCurrentTime !== "function" || typeof player.seekTo !== "function") return;
  const startBoundary = getVideoStartBoundary(stepId);
  if (startBoundary > 0 && player.getCurrentTime() < startBoundary - 0.5) {
    player.seekTo(startBoundary, true);
  }
};

const updateVideoControls = (stepId) => {
  const player = players[stepId];
  if (!player || typeof player.getCurrentTime !== "function") return;

  const duration = player.getDuration() || 0;
  const currentTime = player.getCurrentTime() || 0;
  const startBoundary = getVideoStartBoundary(stepId);

  playerStates.value[stepId].duration = duration;
  playerStates.value[stepId].currentTime = Math.max(currentTime, startBoundary);
  playerStates.value[stepId].progress = getSeekValue(stepId);
  playerStates.value[stepId].durationFormatted = formatVideoTime(duration);
  playerStates.value[stepId].currentTimeFormatted = formatVideoTime(playerStates.value[stepId].currentTime);
};

const getSeekMin = (stepId) => {
  const duration = playerStates.value[stepId].duration || 0;
  const startBoundary = getVideoStartBoundary(stepId);
  return duration && startBoundary ? (startBoundary / duration * 100) : 0;
};

const getSeekValue = (stepId) => {
  const duration = playerStates.value[stepId].duration || 0;
  const currentTime = playerStates.value[stepId].currentTime || 0;
  return duration ? (currentTime / duration * 100) : 0;
};

// Video actions
const playVideo = (stepId) => {
  playerStates.value[stepId].hasStarted = true;
  const player = players[stepId];
  if (!player || typeof player.getPlayerState !== "function") {
    initializeYouTubePlayer(stepId);
    // YouTube player onReady will not autoplay unless we tell it to,
    // but the player itself is now visible so the user can click it or we can play it if ready.
    setTimeout(() => {
      if (players[stepId] && typeof players[stepId].playVideo === 'function') {
         players[stepId].playVideo();
      }
    }, 500);
    return;
  }
  player.playVideo();
};
const togglePlay = (stepId) => {
  const player = players[stepId];
  if (!player || typeof player.getPlayerState !== "function") {
    initializeYouTubePlayer(stepId);
    return;
  }
  if (playerStates.value[stepId].isPlaying) {
    player.pauseVideo();
  } else {
    player.playVideo();
  }
};

const toggleMute = (stepId) => {
  const player = players[stepId];
  if (!player || typeof player.isMuted !== "function") return;
  if (player.isMuted()) {
    player.unMute();
    playerStates.value[stepId].isMuted = false;
  } else {
    player.mute();
    playerStates.value[stepId].isMuted = true;
  }
};

const onSeekInput = (stepId, event) => {
  const player = players[stepId];
  if (!player || typeof player.seekTo !== "function") return;
  const duration = playerStates.value[stepId].duration || 0;
  const startBoundary = getVideoStartBoundary(stepId);
  const requestedTime = (duration * Number(event.target.value)) / 100;
  player.seekTo(Math.max(requestedTime, startBoundary), true);
};

const toggleFullscreen = (stepId) => {
  const el = document.querySelector(`.video-frame[data-video-step="${stepId}"]`);
  if (!el) return;
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    el.requestFullscreen();
  }
};

const seekToBookmark = (stepId, time) => {
  const player = players[stepId];
  if (player && typeof player.seekTo === "function") {
    player.seekTo(time, true);
    if (typeof player.playVideo === "function") player.playVideo();
    
    const container = videoContainers.value[stepId];
    if (container) {
      container.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
};

// YouTube player setup
const initializeYouTubePlayer = (stepId) => {
  const normalizedStepId = String(stepId);
  if (!youtubeReady.value || players[normalizedStepId] || !courseData[normalizedStepId]) return;

  const playerId = "youtube-player-" + normalizedStepId;
  const domEl = document.getElementById(playerId);
  if (!domEl) return;

  playerStates.value[normalizedStepId].isError = false;

  players[normalizedStepId] = new window.YT.Player(playerId, {
    videoId: courseData[normalizedStepId].videoId,
    playerVars: {
      playsinline: 1,
      rel: 0,
      controls: 0,
      disablekb: 1,
      fs: 0,
      iv_load_policy: 3,
      start: courseData[normalizedStepId].startSeconds || 0,
      origin: window.location.origin
    },
    events: {
      onReady: (event) => {
        const iframe = event.target.getIframe();
        iframe.removeAttribute("allowfullscreen");
        iframe.setAttribute("tabindex", "-1");
        iframe.setAttribute("aria-hidden", "true");
        
        playerStates.value[normalizedStepId].isReady = true;
        playerStates.value[normalizedStepId].duration = event.target.getDuration() || 0;
        
        enforceVideoStartBoundary(normalizedStepId);
        updateVideoControls(normalizedStepId);
      },
      onError: () => {
        playerStates.value[normalizedStepId].isError = true;
      },
      onStateChange: (event) => handlePlayerStateChange(normalizedStepId, event)
    }
  });
};

const handlePlayerStateChange = (stepId, event) => {
  const isPlaying = event.data === window.YT.PlayerState.PLAYING;
  playerStates.value[stepId].isPlaying = isPlaying;

  if (isPlaying) {
    playerStates.value[stepId].hasStarted = true;
    enforceVideoStartBoundary(stepId);
  }

  if (event.data === window.YT.PlayerState.ENDED) {
    videoWatchedStatus.value[stepId] = true;
  }

  updateVideoControls(stepId);

  window.clearInterval(timeCheckers[stepId]);
  if (isPlaying) {
    timeCheckers[stepId] = window.setInterval(() => {
      updateVideoControls(stepId);
      checkVideoQuizzes(stepId);
    }, 300);
  }
};

const checkVideoQuizzes = (stepId) => {
  const player = players[stepId];
  if (!player || typeof player.getCurrentTime !== 'function') return;

  const currentTime = player.getCurrentTime();
  const stepConfig = courseData[stepId];
  if (!stepConfig || !stepConfig.quizzes) return;

  for (let quiz of stepConfig.quizzes) {
    if (quizState.value.replayingQuizVideo && quiz === quizState.value.activeQuizConfig) {
      if (currentTime < quiz.time - 0.5) {
        quizState.value.replayCheckpointArmed = true;
      }
      if (!quizState.value.replayCheckpointArmed) continue;
    }

    if (!quiz.shown && currentTime >= quiz.time) {
      quiz.shown = true;
      player.pauseVideo();
      window.clearInterval(timeCheckers[stepId]);

      const shouldResume = quiz.resume !== undefined ? quiz.resume : true;
      openQuiz(quiz.questions, shouldResume, quiz.resumeTime, quiz, stepId);
      break;
    }
  }
};

// Quiz Functions
const shuffle = (items) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [result[i], result[randomIndex]] = [result[randomIndex], result[i]];
  }
  return result;
};

const openQuiz = (questionsArray, shouldResume = false, seekTime = null, quizConfig = null, stepId = currentStep.value) => {
  try {
    if (document.fullscreenElement) {
      const exitPromise = document.exitFullscreen();
      if (exitPromise !== undefined) exitPromise.catch(e => console.log(e));
    } else if (document.webkitFullscreenElement && document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
  } catch (err) {
    console.log('Exit fullscreen error:', err);
  }

  if (quizConfig) {
    quizState.value.activeQuizConfig = quizConfig;
    quizState.value.activeQuizStep = Number(stepId);
  } else {
    quizState.value.activeQuizConfig = null;
    quizState.value.activeQuizStep = null;
  }

  quizState.value.replayingQuizVideo = false;
  quizState.value.replayCheckpointArmed = false;
  quizReturn.value.isVisible = false;

  quizState.value.resumeVideoAfterQuiz = shouldResume;
  quizState.value.resumeVideoTime = seekTime;

  quizState.value.shuffledQuestions = shuffle([...questionsArray]);
  quizState.value.currentQuestionIdx = 0;
  quizState.value.isOpen = true;
  sheet.sequence.play({ direction: 'normal', range: [0, 0.4] });
  quizState.value.choicesDisabled = false;
  quizState.value.quizFeedback = '';
  quizState.value.quizFeedbackType = '';
  quizState.value.isNextBtnVisible = false;
  quizState.value.nextBtnText = 'Soal berikutnya →';

  nextTick(() => {
    renderQuestion();
  });
};

const closeQuiz = (resumeVideo = false, seekTime = null) => {
  sheet.sequence.play({ direction: 'reverse', range: [0, 0.4] }).then(() => {
    quizState.value.isOpen = false;
  });
  if (resumeVideo && players[currentStep.value]) {
    const player = players[currentStep.value];
    if (seekTime !== null && typeof player.seekTo === "function") {
      player.seekTo(seekTime, true);
    }
    if (typeof player.playVideo === "function") {
      player.playVideo();
    }
  }
};

const currentQuestion = computed(() => {
  const questions = quizState.value.shuffledQuestions;
  const idx = quizState.value.currentQuestionIdx;
  if (questions && questions.length > 0 && idx < questions.length) {
    return questions[idx];
  }
  return null;
});

const isQuizFinished = computed(() => {
  return quizState.value.shuffledQuestions.length > 0 && 
         quizState.value.currentQuestionIdx >= quizState.value.shuffledQuestions.length;
});

const attachCustomHtmlListeners = () => {
  setTimeout(() => { // ensure DOM is fully updated
    document.querySelectorAll('.answer-opt-btn').forEach(btn => {
      btn.onclick = function() {
        this.innerHTML = "Memeriksa...";
        const isCorrect = this.getAttribute('data-correct') === 'true';
        const expl = this.getAttribute('data-explanation');
        if (window.checkGuess) window.checkGuess(this, isCorrect, expl);
      };
    });

    const wrapHandler = (btnId, handlerFn) => {
      const btn = document.getElementById(btnId);
      if (btn) {
        btn.onclick = function() {
          const originalText = this.innerHTML;
          this.innerHTML = "Memeriksa...";
          handlerFn(this);
          // Restore text after 1 second if still enabled
          setTimeout(() => { if (!this.disabled) this.innerHTML = originalText; }, 1000);
        };
      }
    };

    wrapHandler('mb1-check-btn', (btn) => {
      const kw = document.getElementById('mb1-kw');
      const cond = document.getElementById('mb1-cond');
      if (window.checkMB1QGuess) window.checkMB1QGuess(kw ? kw.value : '', cond ? cond.value : '', btn, 'Syarat yang benar adalah elif dan age < 18.');
    });
    wrapHandler('mb2-check-btn', (btn) => {
      const v1 = document.getElementById('mb2-val1');
      const v2 = document.getElementById('mb2-val2');
      if (window.checkMB2QGuess) window.checkMB2QGuess(v1 ? v1.value : '', v2 ? v2.value : '', btn, 'Kondisi yang lebih ketat harus ditaruh di atas!');
    });
    wrapHandler('paren-check-btn', (btn) => {
      const input = document.getElementById('paren-input');
      if (window.checkParenGuess) window.checkParenGuess(input ? input.value : '', btn, 'Kita harus mengevaluasi or di dalam kurung terlebih dahulu.');
    });
    wrapHandler('and-check-btn', (btn) => {
      const input = document.getElementById('and-input');
      if (window.checkAndGuess) window.checkAndGuess(input ? input.value : '', btn, 'Kedua syarat harus terpenuhi untuk mendapatkan beasiswa.');
    });
    wrapHandler('or-check-btn', (btn) => {
      const input = document.getElementById('or-input');
      if (window.checkOrGuess) window.checkOrGuess(input ? input.value : '', btn, 'Salah satu syarat harus terpenuhi.');
    });
    wrapHandler('logical-check-btn', (btn) => {
      const input = document.getElementById('logical-input');
      if (window.checkNestedToLogicalGuess) window.checkNestedToLogicalGuess(input ? input.value : '', btn, 'Dengan operator and kita bisa menggabungkan dua if bersarang.');
    });
    wrapHandler('needs-check-btn', (btn) => {
      if (window.checkNeedsWantsGuess) window.checkNeedsWantsGuess('needs-input', btn);
    });
    wrapHandler('wants-check-btn', (btn) => {
      if (window.checkNeedsWantsGuess) window.checkNeedsWantsGuess('wants-input', btn);
    });
    wrapHandler('ide6-run-btn', (btn) => {
      if (window.runPyodideCode) window.runPyodideCode('python-ide-6', 'ide-output-6');
    });
    wrapHandler('ide6-submit-btn', (btn) => {
      if (window.checkIde6Guess) window.checkIde6Guess(btn);
    });
  }, 100);
};

const renderQuestion = () => {
  if (currentQuestion.value && !currentQuestion.value.html) {
    nextTick(() => {
      const trueBtn = document.querySelector('.choice-btn.true-btn');
      if (trueBtn) trueBtn.focus();
    });
  } else if (currentQuestion.value && currentQuestion.value.html) {
    nextTick(() => {
      attachCustomHtmlListeners();
    });
  }
};

const revealQuizNext = (label = "Soal berikutnya →") => {
  quizState.value.nextBtnText = label;
  quizState.value.isNextBtnVisible = true;
  
  nextTick(() => {
    const nextBtn = document.querySelector('.quiz-next-btn');
    if (nextBtn) {
      nextBtn.scrollIntoView({ behavior: "smooth", block: "nearest" });
      nextBtn.focus({ preventScroll: true });
    }
  });
};

const registerFailedInputAttempt = (btn, feedbackEl) => {
  const key = btn.id || btn.className || 'default-btn';
  const attempts = (failedAttempts.value[key] || 0) + 1;
  failedAttempts.value[key] = attempts;
  quizState.value.isNextBtnVisible = false;

  const attemptStatus = document.createElement("div");
  attemptStatus.className = "attempt-status";

  if (attempts >= 3) {
    attemptStatus.classList.add("limit-reached");
    attemptStatus.innerHTML = "<strong>Sudah 3 kali mencoba.</strong><br>Jawabanmu masih belum tepat. Perhatikan lagi videonya, ya. Untuk sekarang kamu boleh lanjut dulu.";
    btn.disabled = true;
    btn.style.opacity = "0.55";
    revealQuizNext("Lanjut dulu →");
  } else {
    attemptStatus.textContent = `Percobaan ${attempts} dari 3. Periksa kembali kode atau jawabanmu sebelum mencoba lagi.`;
  }

  feedbackEl.appendChild(attemptStatus);
};

const handleStandardAnswer = (answer) => {
  const item = currentQuestion.value;
  if (!item) return;

  const isCorrect = answer === item.answer;
  quizState.value.choicesDisabled = true;

  quizState.value.quizFeedbackType = isCorrect ? 'correct' : 'wrong';
  quizState.value.quizFeedback = (isCorrect ? "Tepat. " : "Belum tepat. ") + item.explanation;
  
  revealQuizNext();
};

const goToNextQuestion = () => {
  if (quizState.value.currentQuestionIdx + 1 >= quizState.value.shuffledQuestions.length) {
    closeQuiz(quizState.value.resumeVideoAfterQuiz, quizState.value.resumeVideoTime);
    return;
  }
  quizState.value.currentQuestionIdx += 1;
  quizState.value.choicesDisabled = false;
  quizState.value.quizFeedback = '';
  quizState.value.quizFeedbackType = '';
  quizState.value.isNextBtnVisible = false;
  
  nextTick(() => {
    renderQuestion();
  });
};

const replayActiveQuizVideo = () => {
  if (!quizState.value.activeQuizConfig || quizState.value.activeQuizStep === null) return;

  const player = players[quizState.value.activeQuizStep];
  if (!player || typeof player.seekTo !== "function") return;

  const replayStart = Math.max(0, quizState.value.activeQuizConfig.time - 30);
  if (currentStep.value !== quizState.value.activeQuizStep) {
    currentStep.value = quizState.value.activeQuizStep;
  }

  quizState.value.activeQuizConfig.shown = false;
  quizState.value.replayingQuizVideo = true;
  quizState.value.replayCheckpointArmed = false;
  
  closeQuiz(false);
  quizReturn.value.isVisible = true;

  nextTick(() => {
    player.seekTo(replayStart, true);
    if (typeof player.playVideo === "function") {
      player.playVideo();
    }
    setTimeout(() => {
      if (!quizState.value.replayingQuizVideo || typeof player.getCurrentTime !== "function") return;
      if (Math.abs(player.getCurrentTime() - replayStart) > 2) {
        player.seekTo(replayStart, true);
      }
    }, 300);
  });
};

const returnToActiveQuiz = () => {
  if (!quizState.value.activeQuizConfig || quizState.value.activeQuizStep === null) return;

  const player = players[quizState.value.activeQuizStep];
  if (player && typeof player.pauseVideo === "function") {
    player.pauseVideo();
  }
  quizState.value.activeQuizConfig.shown = true;
  openQuiz(
    quizState.value.activeQuizConfig.questions,
    quizState.value.activeQuizConfig.resume !== undefined ? quizState.value.activeQuizConfig.resume : true,
    quizState.value.activeQuizConfig.resumeTime,
    quizState.value.activeQuizConfig,
    quizState.value.activeQuizStep
  );
};

// Pyodide Integration
const pyodideBaseUrl = "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/";
let pyodideReadyPromise = null;

function ensurePyodideScript() {
  if (typeof window.loadPyodide === "function") return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-pyodide-loader]');
    if (existingScript) {
      existingScript.addEventListener("load", resolve, { once: true });
      existingScript.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = pyodideBaseUrl + "pyodide.js";
    script.dataset.pyodideLoader = "true";
    script.addEventListener("load", resolve, { once: true });
    script.addEventListener("error", () => reject(new Error("Pyodide gagal dimuat.")), { once: true });
    document.head.appendChild(script);
  });
}

function initPyodide() {
  if (!pyodideReadyPromise) {
    pyodideReadyPromise = ensurePyodideScript()
      .then(() => window.loadPyodide({ indexURL: pyodideBaseUrl }));
  }
  return pyodideReadyPromise;
}

const runPyodideCode = async (inputId, outputId) => {
  const codeEl = document.getElementById(inputId);
  const outputEl = document.getElementById(outputId);
  if (!codeEl || !outputEl) return;
  outputEl.innerHTML = "Menjalankan...";
  outputEl.style.color = "white";

  try {
    let pyodide = await initPyodide();
    pyodide.setStdout({ batched: (msg) => {
      if (outputEl.innerHTML === "Menjalankan...") outputEl.innerHTML = "";
      outputEl.innerHTML += msg + "\n";
    }});
    
    await pyodide.runPythonAsync(codeEl.value);
    if (outputEl.innerHTML === "Menjalankan...") {
      outputEl.innerHTML = "Program selesai tanpa output teks.";
    }
  } catch (err) {
    outputEl.innerHTML = err;
    outputEl.style.color = "#FF4444";
  }
};

const exposeGlobalMethods = () => {
  const trackAttempt = (qid, answerStr, isCorrect) => {
    if(!qid) return;
    const attKey = qid + "_Att";
    const ansKey = qid + "_Ans";
    let att = (studentProgress.value[attKey] || 0) + 1;
    studentProgress.value[attKey] = att;
    
    // Mapping spesifik Video 6
    let finalAnsKey = ansKey;
    if (qid === 'V6_Q1') finalAnsKey = 'V6_Needs_Ans';
    if (qid === 'V6_Q2') finalAnsKey = 'V6_Wants_Ans';
    if (qid === 'V6_Q3') { finalAnsKey = 'V6_IDE_Code'; studentProgress.value['V6_IDE_Att'] = att; }
    
    if (isCorrect || att >= 3) {
      studentProgress.value[finalAnsKey] = isCorrect ? answerStr : '-';
    }
    saveProgress(attKey, att); 
  };

  window.checkGuess = function(btn, isCorrect, explanation) {
    const qid = currentQuestion.value?.qid;
    trackAttempt(qid, btn.innerText, isCorrect);
    
    const container = btn.parentElement;
    const feedback = container.nextElementSibling;
    const buttons = container.querySelectorAll('button');
    buttons.forEach(b => {
      b.disabled = true;
      b.style.opacity = '0.5';
    });
    btn.style.opacity = '1';
    
    feedback.style.display = 'block';
    // NEW: Auto-scroll on mobile
    setTimeout(() => {
      if (window.innerWidth <= 650) {
        feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
    if (isCorrect) {
      feedback.innerHTML = `✅ <strong>TEPAT SEKALI!</strong><br>${explanation}`;
      feedback.style.backgroundColor = "#27c881";
      feedback.style.color = "var(--black)";
      revealQuizNext();
    } else {
      feedback.innerHTML = `❌ <strong>SALAH!</strong><br>${explanation}`;
      feedback.style.backgroundColor = "#ff5c8a";
      feedback.style.color = "white";
      registerFailedInputAttempt(btn, feedback);
    }
  };

  window.checkMB1QGuess = function(kwVal, condVal, btn, explanation) {
    const qid = currentQuestion.value?.qid;
    let kw = kwVal.replace(/\s+/g, '').toLowerCase();
    let cond = condVal.replace(/\s+/g, '').toLowerCase();
    const isCorrect = (kw === 'elif' && (cond === 'age<18' || cond === 'age<=17'));
    trackAttempt(qid, `${kwVal} ${condVal}`, isCorrect);

    const container = btn.parentElement;
    const feedback = container.nextElementSibling;
    const isCorrectCondition = isCorrect;
    feedback.style.display = 'block';
    // NEW: Auto-scroll on mobile
    setTimeout(() => {
      if (window.innerWidth <= 650) {
        feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
    if (isCorrectCondition) {
      feedback.innerHTML = `✅ <strong>TEPAT SEKALI!</strong><br>${explanation}`;
      feedback.style.backgroundColor = "#27c881";
      feedback.style.color = "var(--black)";
      btn.disabled = true;
      btn.style.opacity = '0.5';
      const kwInput = document.getElementById('mb1-kw');
      const condInput = document.getElementById('mb1-cond');
      if (kwInput) kwInput.disabled = true;
      if (condInput) condInput.disabled = true;
      revealQuizNext();
    } else {
      feedback.innerHTML = `❌ <strong>KODE BELUM TEPAT!</strong><br>Coba lagi! Kata kunci percabangan yang dipakai adalah <code>elif</code> dan kondisinya mengecek apakah usia di bawah 18 tahun (<code>age &lt; 18</code>).`;
      feedback.style.backgroundColor = "#ff5c8a";
      feedback.style.color = "white";
      registerFailedInputAttempt(btn, feedback);
    }
  };

  window.checkMB2QGuess = function(val1, val2, btn, explanation) {
    const qid = currentQuestion.value?.qid;
    let v1 = val1.replace(/\s+/g, '');
    let v2 = val2.replace(/\s+/g, '');
    const isCorrect = (v1 === '90' && v2 === '80');
    trackAttempt(qid, `${val1} ${val2}`, isCorrect);

    const container = btn.parentElement;
    const feedback = container.nextElementSibling;
    feedback.style.display = 'block';
    // NEW: Auto-scroll on mobile
    setTimeout(() => {
      if (window.innerWidth <= 650) {
        feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
    if (isCorrect) {
      feedback.innerHTML = `✅ <strong>TEPAT SEKALI!</strong><br>${explanation}`;
      feedback.style.backgroundColor = "#27c881";
      feedback.style.color = "var(--black)";
      btn.disabled = true;
      btn.style.opacity = '0.5';
      const val1Input = document.getElementById('mb2-val1');
      const val2Input = document.getElementById('mb2-val2');
      if (val1Input) val1Input.disabled = true;
      if (val2Input) val2Input.disabled = true;
      revealQuizNext();
    } else {
      feedback.innerHTML = `❌ <strong>URUTAN MASIH SALAH!</strong><br>Ingat, kondisi paling ketat/sulit (nilai &gt;= 90 untuk A) harus dicek paling atas!`;
      feedback.style.backgroundColor = "#ff5c8a";
      feedback.style.color = "white";
      registerFailedInputAttempt(btn, feedback);
    }
  };

  window.checkParenGuess = function(userVal, btn, explanation) {
    const qid = currentQuestion.value?.qid;
    let normalizedUser = userVal.replace(/\s+/g, '').toLowerCase();
    const isCorrect = (normalizedUser === 'password_okand(is_adminoris_premium)' || normalizedUser === '(is_adminoris_premium)andpassword_ok' || normalizedUser === 'password_ok==trueand(is_admin==trueoris_premium==true)');
    trackAttempt(qid, userVal, isCorrect);

    const container = btn.parentElement;
    const feedback = container.nextElementSibling;
    feedback.style.display = 'block';
    // NEW: Auto-scroll on mobile
    setTimeout(() => {
      if (window.innerWidth <= 650) {
        feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
    if (isCorrect) {
      feedback.innerHTML = `✅ <strong>TEPAT SEKALI!</strong><br>${explanation}`;
      feedback.style.backgroundColor = "#27c881";
      feedback.style.color = "#1A1A1A";
      btn.disabled = true;
      btn.style.opacity = '0.5';
      const parenInput = document.getElementById('paren-input');
      if (parenInput) parenInput.disabled = true;
      revealQuizNext();
    } else {
      feedback.innerHTML = `❌ <strong>KODE BELUM TEPAT!</strong><br>Pastikan kamu menggabungkan 'is_admin or is_premium' di dalam tanda kurung (), lalu gunakan 'and password_ok'.`;
      feedback.style.backgroundColor = "#ff5c8a";
      feedback.style.color = "white";
      registerFailedInputAttempt(btn, feedback);
    }
  };

  window.checkAndGuess = function(userVal, btn, explanation) {
    const qid = currentQuestion.value?.qid;
    let normalizedUser = userVal.replace(/\s+/g, '').toLowerCase();
    const isCorrect = (normalizedUser === 'andaktif_organisasi==true' || normalizedUser === 'andaktif_organisasi' || normalizedUser === 'and(aktif_organisasi==true)');
    trackAttempt(qid, userVal, isCorrect);

    const container = btn.parentElement;
    const feedback = container.nextElementSibling;
    feedback.style.display = 'block';
    // NEW: Auto-scroll on mobile
    setTimeout(() => {
      if (window.innerWidth <= 650) {
        feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
    if (isCorrect) {
      feedback.innerHTML = `✅ <strong>TEPAT SEKALI!</strong><br>${explanation}`;
      feedback.style.backgroundColor = "#27c881";
      feedback.style.color = "#1A1A1A";
      btn.disabled = true;
      btn.style.opacity = '0.5';
      const andInput = document.getElementById('and-input');
      if (andInput) andInput.disabled = true;
      revealQuizNext();
    } else {
      feedback.innerHTML = `❌ <strong>KODE BELUM TEPAT!</strong><br>Coba lagi! Kamu butuh operator logika 'and' diikuti dengan kondisi pengecekan variabel aktif_organisasi.`;
      feedback.style.backgroundColor = "#ff5c8a";
      feedback.style.color = "white";
      registerFailedInputAttempt(btn, feedback);
    }
  };

  window.checkOrGuess = function(userVal, btn, explanation) {
    const qid = currentQuestion.value?.qid;
    let normalizedUser = userVal.replace(/\s+/g, '').toLowerCase();
    const isCorrect = (normalizedUser === 'orada_kupon==true' || normalizedUser === 'orada_kupon' || normalizedUser === 'or(ada_kupon==true)');
    trackAttempt(qid, userVal, isCorrect);

    const container = btn.parentElement;
    const feedback = container.nextElementSibling;
    feedback.style.display = 'block';
    // NEW: Auto-scroll on mobile
    setTimeout(() => {
      if (window.innerWidth <= 650) {
        feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
    if (isCorrect) {
      feedback.innerHTML = `✅ <strong>TEPAT SEKALI!</strong><br>${explanation}`;
      feedback.style.backgroundColor = "#27c881";
      feedback.style.color = "#1A1A1A";
      btn.disabled = true;
      btn.style.opacity = '0.5';
      const orInput = document.getElementById('or-input');
      if (orInput) orInput.disabled = true;
      revealQuizNext();
    } else {
      feedback.innerHTML = `❌ <strong>KODE BELUM TEPAT!</strong><br>Coba lagi! Kamu butuh operator logika 'or' diikuti dengan kondisi pengecekan variabel ada_kupon.`;
      feedback.style.backgroundColor = "#ff5c8a";
      feedback.style.color = "white";
      registerFailedInputAttempt(btn, feedback);
    }
  };

  window.checkNestedToLogicalGuess = function(userVal, btn, explanation) {
    const qid = currentQuestion.value?.qid;
    let normalizedUser = userVal.replace(/\s+/g, '').toLowerCase();
    const isCorrect = (normalizedUser === 'andcuaca=="cerah"' || normalizedUser === 'and(cuaca=="cerah")' || normalizedUser === 'andcuaca==\'cerah\'');
    trackAttempt(qid, userVal, isCorrect);

    const container = btn.parentElement;
    const feedback = container.nextElementSibling;
    
    feedback.style.display = 'block';
    // NEW: Auto-scroll on mobile
    setTimeout(() => {
      if (window.innerWidth <= 650) {
        feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
    if (isCorrect) {
      feedback.innerHTML = `✅ <strong>TEPAT SEKALI!</strong><br>${explanation}`;
      feedback.style.backgroundColor = "#27c881";
      feedback.style.color = "#1A1A1A";
      btn.disabled = true;
      btn.style.opacity = '0.5';
      const logicalInput = document.getElementById('logical-input');
      if (logicalInput) logicalInput.disabled = true;
      revealQuizNext();
    } else {
      feedback.innerHTML = `❌ <strong>KODE BELUM TEPAT!</strong><br>Pastikan kamu menggunakan operator 'and' lalu cek apakah 'cuaca == "cerah"'.`;
      feedback.style.backgroundColor = "#ff5c8a";
      feedback.style.color = "white";
      registerFailedInputAttempt(btn, feedback);
    }
  };

  window.checkNeedsWantsGuess = function(inputClass, btn) {
    const qid = currentQuestion.value?.qid;
    const inputs = document.querySelectorAll('.' + inputClass);
    let allFilled = true;
    let vals = [];
    inputs.forEach(input => {
      if (!input.value.trim()) allFilled = false;
      else vals.push(input.value.trim());
    });
    
    const container = btn.parentElement;
    const feedback = container.nextElementSibling;
    
    if (!allFilled) {
      feedback.style.display = 'block';
      setTimeout(() => {
        if (window.innerWidth <= 650) {
          feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
      feedback.innerHTML = `❌ Lengkapi kelima contohnya terlebih dahulu ya!`;
      feedback.style.backgroundColor = "#ff5c8a";
      feedback.style.color = "white";
      registerFailedInputAttempt(btn, feedback);
      return;
    }
    
    trackAttempt(qid, vals.join(', '), true);

    btn.disabled = true;
    btn.style.opacity = '0.5';
    
    feedback.style.display = 'block';
    // NEW: Auto-scroll on mobile
    setTimeout(() => {
      if (window.innerWidth <= 650) {
        feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
    feedback.innerHTML = `✅ <strong>Tersimpan!</strong><br>Terima kasih sudah membagikan pemikiranmu.`;
    feedback.style.backgroundColor = "#27c881";
    feedback.style.color = "var(--black)";
    revealQuizNext();
  };

  window.checkIde6Guess = function(btn) {
    const qid = currentQuestion.value?.qid;
    const codeEl = document.getElementById('python-ide-6');
    const code = codeEl ? codeEl.value.toLowerCase() : '';
    trackAttempt(qid, code, true);
    const keywords = ['buku tulis', 'air minum', 'skin game', 'snack tambahan', 'pulsa', 'gantungan kunci'];
    let matchCount = 0;
    
    keywords.forEach(kw => {
      if (code.includes(kw)) matchCount++;
    });

    const container = btn.parentElement;
    const feedback = container.nextElementSibling.nextElementSibling;
    
    feedback.style.display = 'block';
    // NEW: Auto-scroll on mobile
    setTimeout(() => {
      if (window.innerWidth <= 650) {
        feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
    if (matchCount >= 3) {
      feedback.innerHTML = `✅ <strong>Bagus!</strong> Kamu sudah memakai setidaknya 3 barang dari tabel.`;
      feedback.style.backgroundColor = "#27c881";
      feedback.style.color = "var(--black)";
      btn.disabled = true;
      btn.style.opacity = '0.5';
      revealQuizNext();
    } else {
      feedback.innerHTML = `❌ Kamu baru memasukkan ${matchCount} barang dari tabel di kodemu. Minimal butuh 3 barang (misal: "Buku tulis", "Skin game", dsb).`;
      feedback.style.backgroundColor = "#ff5c8a";
      feedback.style.color = "white";
      registerFailedInputAttempt(btn, feedback);
    }
  };

  window.runPyodideCode = runPyodideCode;
  let finalProjectAttempts = 0;
  window.runAssignmentCode = function() {
    finalProjectAttempts++;
    studentProgress.value['Final_Project_Attempts'] = finalProjectAttempts;
    saveProgress('Final_Project_Attempts', finalProjectAttempts);
    runPyodideCode('python-ide-7', 'ide-output-7');
  };
  window.submitAssignmentCode = function() {
    const codeEl = document.getElementById('python-ide-7');
    const code = codeEl ? codeEl.value : '';
    let score = 'Submit';
    if (code.includes('if ') && code.includes('else:')) score = 'Bagus';
    
    studentProgress.value['Final_Project_Code'] = code;
    studentProgress.value['Final_Project_Score'] = score;
    saveProgress('Final_Project_Code', code);
    saveProgress('Final_Project_Score', score);

    alert("✅ Tugas berhasil dikumpulkan! Progress kamu otomatis tersimpan di server. Selamat kamu telah menyelesaikan Misi Conditional!");
  };
};

onMounted(() => {
  quizObj.onValuesChange((values) => {
    quizModalStyles.value = {
      transform: `translateY(${values.y}px) scale(${values.scale})`,
      opacity: values.opacity
    };
  });

  if (window.YT && typeof window.YT.Player === "function") {
    youtubeReady.value = true;
    initializeYouTubePlayer(currentStep.value);
  } else {
    const oldReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (oldReady) oldReady();
      youtubeReady.value = true;
      initializeYouTubePlayer(currentStep.value);
    };
  }
  exposeGlobalMethods();
});

watch(currentStep, (newStep) => {
  Object.keys(players).forEach(id => {
    if (Number(id) !== newStep && players[id] && typeof players[id].pauseVideo === 'function') {
      players[id].pauseVideo();
    }
  });

  if (quizState.value.activeQuizStep !== null && quizState.value.activeQuizStep !== newStep) {
    quizState.value.replayingQuizVideo = false;
    quizState.value.replayCheckpointArmed = false;
    quizReturn.value.isVisible = false;
  }

  nextTick(() => {
    initializeYouTubePlayer(newStep);
  });
});

const openQuizButtonHandler = () => {
  if (players[currentStep.value] && typeof players[currentStep.value].pauseVideo === "function") {
    players[currentStep.value].pauseVideo();
  }
  openQuiz(courseData[2].quizzes[0].questions, false);
};

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value -= 1;
  }
};

const nextStep = () => {
  if (currentStep.value < totalSteps) {
    currentStep.value += 1;
    return;
  }

  showCompletionToast.value = true;
  setTimeout(() => {
    showCompletionToast.value = false;
  }, 3800);
};

const getStepConfig = (stepId) => {
  return courseData[stepId];
};
</script>

<template>
  <img class="planet planet-one" src="https://cdn-web-2.ruangguru.com/landing-pages/assets/e49806a2-dcc4-4858-a261-c4e33b798180.png" alt="">
  <img class="planet planet-two" src="https://cdn-web-2.ruangguru.com/landing-pages/assets/eaa66ac5-e69c-46f2-b942-909bcaad579a.png" alt="">

  <transition name="fade">
    <div v-if="!isLoggedIn" class="login-overlay">
      <div class="login-card">
        <div class="brand-group-login">
          <img class="rg-logo" src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Ruangguru_logo.svg/3840px-Ruangguru_logo.svg.png" alt="Ruangguru">
          <img class="uob-logo" src="https://cdn-web-2.ruangguru.com/landing-pages/assets/37185db7-24a8-467d-aabb-1d5df48f9bc0.png" alt="UOB">
        </div>
        <h2>Selamat Datang!</h2>
        <p>Masuk dengan Email Akademi Ruangguru (Kalananti).</p>
        <div class="input-group">
          <input type="email" v-model="loginEmail" placeholder="nama@email.com" @keyup.enter="handleLogin" :disabled="isLoggingIn">
          <button @click="handleLogin" :disabled="isLoggingIn" class="login-btn">
            {{ isLoggingIn ? 'Memuat...' : 'Mulai Belajar 🚀' }}
          </button>
        </div>
        
        <transition name="pop">
          <div v-if="showLoginError" class="login-error-msg">
            <span class="icon">❌</span>
            <div>
              <strong>Oops! Email kamu belum terdaftar.</strong>
              <p>Yuk hubungi guru PIC MDS untuk mendaftarkan datamu ke sistem ya!</p>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </transition>

  <div class="site-shell" v-show="isLoggedIn">
    <header class="topbar">
      <div class="brand-group">
        <img class="rg-logo" src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Ruangguru_logo.svg/3840px-Ruangguru_logo.svg.png" alt="Ruangguru">
        <img class="uob-logo" src="https://cdn-web-2.ruangguru.com/landing-pages/assets/37185db7-24a8-467d-aabb-1d5df48f9bc0.png" alt="UOB">
      </div>
      <div class="student-chip" aria-label="Profil siswa" @click="showProfileMenu = !showProfileMenu">
        <div class="avatar" aria-hidden="true"></div>
        <div class="student-info">
          <strong>
            {{ studentData.name || 'Siswa Kalananti' }}
            <span class="dropdown-icon">▼</span>
          </strong>
          <span v-if="studentData.school">{{ studentData.school }}</span>
          <span v-else>Siap lanjut belajar</span>
        </div>
        
        <transition name="fade">
          <div v-if="showProfileMenu" class="profile-dropdown">
            <button @click.stop="handleLogout" class="dropdown-item">⏏ Keluar</button>
          </div>
        </transition>
      </div>
    </header>

    <main class="dashboard">
      <aside class="sidebar">
        <div class="eyebrow">Asynchronous Learning</div>
        <h1>Misi: Kuasai Conditional</h1>
        <p class="sidebar-intro">
          Pelajari cara program mengambil keputusan dengan <strong>if</strong>, <strong>else</strong>, dan <strong>elif</strong>.
        </p>

        <div class="mission-progress" aria-label="Progres pembelajaran">
          <div class="progress-copy">
            <span>Progres misi</span>
            <span id="progressText">{{ currentStep }} dari 7</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" :style="{ width: (currentStep / 7 * 100) + '%' }"></div>
          </div>
        </div>

        <nav class="mobile-nav">
          <label for="mobile-lesson-select">Pilih Modul</label>
          <div class="select-wrapper">
            <select id="mobile-lesson-select" v-model="currentStep">
              <option :value="1">01 Kenalan dengan Conditional</option>
              <option :value="2">02 Conditional di Python</option>
              <option :value="3">03 Multi Branch Conditionals</option>
              <option :value="4">04 Nested Conditionals</option>
              <option :value="5">05 Logical Operator</option>
              <option :value="6">06 Financial Literacy</option>
              <option :value="7">07 Mandatory Assignment</option>
            </select>
          </div>
        </nav>

        <nav class="lesson-nav" aria-label="Daftar video">
          <button class="lesson-tab" :class="{ active: currentStep === 1 }" type="button" @click="currentStep = 1">

            <span class="tab-number">01</span>
            <span class="tab-copy">
              <strong>Kenalan dengan Conditional</strong>
              <span>Konsep dasar</span>
            </span>
            <span class="tab-arrow" aria-hidden="true">›</span>
          </button>
          <button class="lesson-tab" :class="{ active: currentStep === 2 }" type="button" @click="currentStep = 2">

            <span class="tab-number">02</span>
            <span class="tab-copy">
              <strong>Conditional di Python</strong>
              <span>Praktik kode</span>
            </span>
            <span class="tab-arrow" aria-hidden="true">›</span>
          </button>
          <button class="lesson-tab" :class="{ active: currentStep === 3 }" type="button" @click="currentStep = 3">

            <span class="tab-number">03</span>
            <span class="tab-copy">
              <strong>Multi Branch Conditionals</strong>
              <span>Cabang & Operator</span>
            </span>
            <span class="tab-arrow" aria-hidden="true">›</span>
          </button>
          <button class="lesson-tab" :class="{ active: currentStep === 4 }" type="button" @click="currentStep = 4">

            <span class="tab-number">04</span>
            <span class="tab-copy">
              <strong>Nested Conditionals</strong>
              <span>Kondisi dalam kondisi</span>
            </span>
            <span class="tab-arrow" aria-hidden="true">›</span>
          </button>
          <button class="lesson-tab" :class="{ active: currentStep === 5 }" type="button" @click="currentStep = 5">

            <span class="tab-number">05</span>
            <span class="tab-copy">
              <strong>Logical Operator</strong>
              <span>Menggabungkan kondisi</span>
            </span>
            <span class="tab-arrow" aria-hidden="true">›</span>
          </button>
          <button class="lesson-tab" :class="{ active: currentStep === 6 }" type="button" @click="currentStep = 6">

            <span class="tab-number">06</span>
            <span class="tab-copy">
              <strong>Financial Literacy</strong>
              <span>Needs vs Wants</span>
            </span>
            <span class="tab-arrow" aria-hidden="true">›</span>
          </button>
          <button class="lesson-tab" :class="{ active: currentStep === 7 }" type="button" @click="currentStep = 7">

            <span class="tab-number">07</span>
            <span class="tab-copy">
              <strong>Mandatory Assignment</strong>
              <span>Smart Budget & Risk Planner</span>
            </span>
            <span class="tab-arrow" aria-hidden="true">›</span>
          </button>
        </nav>

        <div class="help-card">
          Ada bagian yang masih membingungkan?
          <a href="mailto:fasilitator@kalananti.id">Tanya fasilitator</a>
        </div>
      </aside>

      <section class="content">
        <div class="content-top">
          <div>
            <p class="lesson-kicker">{{ courseData[currentStep].kicker }}</p>
            <h2 class="lesson-title">{{ courseData[currentStep].title }}</h2>
          </div>
          <span class="duration-pill">{{ courseData[currentStep].duration }}</span>
        </div>

        <section class="step-panel" id="step-1" v-show="currentStep === 1">
          <div class="video-frame" :class="{ 'player-ready': playerStates[1]?.isReady }" data-video-step="1">
            <div id="youtube-player-1"></div>
            <div class="custom-thumbnail" v-show="!playerStates[1]?.hasStarted" @click="togglePlay(1)">
              <img src="https://cdn-web-2.ruangguru.com/landing-pages/assets/fec32e8d-d711-48a2-bd22-59581f0594c1.jpg" alt="Thumbnail" />
            </div>
            <button class="video-center-play" type="button" v-show="!playerStates[1]?.isPlaying" @click="togglePlay(1)">▶</button>
            <div class="video-controls" aria-label="Kontrol video 1">
              <button class="video-control-button video-play" type="button" @click="togglePlay(1)">{{ playerStates[1]?.isPlaying ? "⏸" : "▶" }}</button>
              <input class="video-seek" type="range" min="0" max="100" step="0.1" :value="playerStates[1]?.progress || 0" @input="onSeekInput(1, $event)" aria-label="Posisi video">
              <span class="video-time">{{ playerStates[1]?.currentTimeFormatted || "0:00" }} / {{ playerStates[1]?.durationFormatted || "0:00" }}</span>
              <button class="video-control-button video-mute" type="button" @click="toggleMute(1)">{{ playerStates[1]?.isMuted ? "🔇" : "🔊" }}</button>
              <button class="video-control-button video-fullscreen" type="button" @click="toggleFullscreen(1)">⛶</button>
            </div>
          </div>

          <div class="bookmarks-container" v-if="courseData[1].bookmarks?.length > 0">
            <button class="bookmark-btn" v-for="bm in courseData[1].bookmarks" :key="bm.label" @click="seekToBookmark(1, bm.time)">
              <span class="bookmark-time">{{ formatVideoTime(bm.time) }}</span> {{ bm.label }}
            </button>
          </div>
          <div class="below-video">
            <article class="summary-card">
              <h3 class="card-heading">
                <span class="heading-icon" aria-hidden="true">01</span>
                Loot Box Hari Ini 🎁
              </h3>
              <ul class="takeaway-list">
                <li><strong>Program itu pintar!</strong> Nggak cuma jalan lurus, dia bisa mikir dan milih aksinya sendiri.</li>
                <li><strong>Kayak di dunia nyata.</strong> Kalau HP lowbat, ya di-charge. Komputer juga mikir pake cara yang sama!</li>
                <li><strong>Jawabannya cuma dua.</strong> Bener (True) atau Salah (False). Nggak ada opsi 'Mungkin' di sini!</li>
                <li><strong>Satpam Mall.</strong> Kondisi itu ibarat satpam. Kalau nggak bawa syaratnya, pintu nggak bakal dibuka!</li>
              </ul>
            </article>

            <aside class="focus-card">
              <div>
                <p class="label">Cheat Sheet 📝</p>
                <h3>Kalo bener, gaskeun!</h3>
                <p>Coba pikirin, apa aja sih keputusan 'if' yang udah kamu buat hari ini?</p>
              </div>
              <div class="mini-code">
                <span class="keyword">if</span> hujan:<br>
                &nbsp;&nbsp;bawa(<span class="string">"payung"</span>)
              </div>
            </aside>
          </div>
          <details class="lesson-reading-accordion">
            <summary>Buka Materi Bacaan</summary>
          <div class="lesson-reading">
            <header class="reading-header">
              <div>
                <p class="label">Materi Bacaan 01</p>
                <h3>Conditional: Gimana Kode Bikin Keputusan</h3>
                <p>Biar makin GG, baca rangkuman ini setelah nonton video ya!</p>
              </div>
              <span class="reading-badge">Dasar konsep</span>
            </header>

            <div class="concept-grid">
              <article class="concept-card">
                <span class="concept-number">A</span>
                <h4>Kode itu Nggak Kaku</h4>
                <p>Bikin program kamu bisa milih apa yang mau dilakuin.</p>
              </article>
              <article class="concept-card">
                <span class="concept-number">B</span>
                <h4>Kondisi = Ngasih Pertanyaan</h4>
                <p>Misalnya: 'Uangnya cukup nggak?', 'Darahnya sisa berapa?'</p>
              </article>
              <article class="concept-card">
                <span class="concept-number">C</span>
                <h4>Cuma Ada Dua Jawaban</h4>
                <p>True kalau bener, False kalau salah.</p>
              </article>
            </div>

            <article class="reading-section">
              <h4>Dari Dunia Nyata ke Dunia Kode</h4>
              <ul>
                <li>Kalau lapar, makan.</li>
                <li>Kalau musuh keliatan, tembak!</li>
                <li>Jika pemain mendapat apel, tambah nyawa.</li>
              </ul>
              <div class="reading-code"><span class="code-comment"># Komputer mengecek syarat sebelum menjalankan aksi</span>
hujan = <span class="code-keyword">True</span>

<span class="code-keyword">if</span> hujan:
    print(<span class="code-string">"Bawa payung"</span>)</div>
              <p class="reading-note"><strong>Intinya:</strong> Kondisi itu satpam pintu. Kalo bawa kunci (True), pintu dibuka. Kalo nggak (False), mending pulang!</p>
            </article>

            <article class="reading-section">
              <h4>Satpam Mall 👮‍♂️</h4>
              <p>Bayangin <code>if</code> itu satpam di depan pintu masuk:</p>
              <ul>
                <li><strong>Syarat / Kondisi</strong> = Bawa tiket nggak?</li>
                <li><code>True</code> = Bawa! Pintu dibuka.</li>
                <li><code>False</code> = Nggak bawa! Disuruh pulang deh.</li>
              </ul>
            </article>
          </div>
          </details>
        </section>

        <section class="step-panel" id="step-2" v-show="currentStep === 2">
          <div class="video-frame" :class="{ 'player-ready': playerStates[2]?.isReady }" data-video-step="2">
            <div id="youtube-player-2"></div>
            <div class="custom-thumbnail" v-show="!playerStates[2]?.hasStarted" @click="togglePlay(2)">
              <img src="https://cdn-web-2.ruangguru.com/landing-pages/assets/2925ebc7-89c3-4010-a057-9807aacc6a32.jpg" alt="Thumbnail" />
            </div>
            <button class="video-center-play" type="button" v-show="!playerStates[2]?.isPlaying" @click="togglePlay(2)">▶</button>
            <div class="video-controls" aria-label="Kontrol video 2">
              <button class="video-control-button video-play" type="button" @click="togglePlay(2)">{{ playerStates[2]?.isPlaying ? "⏸" : "▶" }}</button>
              <input class="video-seek" type="range" min="0" max="100" step="0.1" :value="playerStates[2]?.progress || 0" @input="onSeekInput(2, $event)" aria-label="Posisi video">
              <span class="video-time">{{ playerStates[2]?.currentTimeFormatted || "0:00" }} / {{ playerStates[2]?.durationFormatted || "0:00" }}</span>
              <button class="video-control-button video-mute" type="button" @click="toggleMute(2)">{{ playerStates[2]?.isMuted ? "🔇" : "🔊" }}</button>
              <button class="video-control-button video-fullscreen" type="button" @click="toggleFullscreen(2)">⛶</button>
            </div>
          </div>

          <div class="bookmarks-container" v-if="courseData[2].bookmarks?.length > 0">
            <button class="bookmark-btn" v-for="bm in courseData[2].bookmarks" :key="bm.label" @click="seekToBookmark(2, bm.time)">
              <span class="bookmark-time">{{ formatVideoTime(bm.time) }}</span> {{ bm.label }}
            </button>
          </div>
          <div class="below-video">
            <article class="summary-card">
              <h3 class="card-heading">
                <span class="heading-icon" aria-hidden="true">02</span>
                Loot Box Hari Ini 🎁
              </h3>
              <ul class="takeaway-list">
                <li><strong><code>if</code> untuk kondisi utama.</strong> Isi blok dijalankan hanya ketika kondisi bernilai <em>True</em>.</li>
                <li><strong><code>else</code> untuk pilihan lainnya.</strong> Bagian ini berjalan ketika kondisi pada <code>if</code> tidak terpenuhi.</li>
                <li><strong>Indentasi menandai isi cabang.</strong> Perintah yang menjorok berada di dalam blok <code>if</code> atau <code>else</code>.</li>
                <li><strong>Operator perbandingan membentuk kondisi.</strong> Gunakan <code>==</code>, <code>!=</code>, <code>&gt;</code>, <code>&lt;</code>, <code>&gt;=</code>, atau <code>&lt;=</code>.</li>
              </ul>
            </article>

            <aside class="focus-card">
              <div>
                <p class="label">Peringatan Kuis Kejutan! 🤫</p>
                <h3>Perhatikan videonya baik-baik!</h3>
                <p>Di tengah-tengah video nanti, akan muncul kuis kejutan untuk mengecek pemahamanmu. Tonton sampai selesai ya!</p>
              </div>
            </aside>
          </div>
          <details class="lesson-reading-accordion">
            <summary>Buka Materi Bacaan</summary>
          <div class="lesson-reading">
            <header class="reading-header">
              <div>
                <p class="label">Catatan Rahasia 02</p>
                <h3>Menulis <code>if</code> dan <code>else</code> di Python</h3>
                <p>Pelajari bentuk kode, cara membaca kondisi, fungsi indentasi, dan bagaimana Python memilih satu dari dua jalan.</p>
              </div>
              <span class="reading-badge">Sintaks Python</span>
            </header>

            <div class="concept-grid">
              <article class="concept-card">
                <span class="concept-number">1</span>
                <h4><code>if</code></h4>
                <p>Memeriksa kondisi utama. Blok di bawahnya hanya dijalankan jika kondisi bernilai <code>True</code>.</p>
              </article>
              <article class="concept-card">
                <span class="concept-number">2</span>
                <h4><code>else</code></h4>
                <p>Menjadi pilihan lain saat kondisi pada <code>if</code> bernilai <code>False</code>.</p>
              </article>
              <article class="concept-card">
                <span class="concept-number">3</span>
                <h4>Indentasi</h4>
                <p>Spasi menjorok menandai perintah yang termasuk di dalam cabang <code>if</code> atau <code>else</code>.</p>
              </article>
            </div>

            <article class="reading-section">
              <h4>Analogi Dua Jalan 🛣️</h4>
              <p>Jika <code>if</code> hanya punya satu pintu yang bisa terbuka atau tertutup, maka <code>if-else</code> adalah seperti persimpangan jalan.</p>
              <ul>
                <li><strong>Jalan pertama (<code>if</code>)</strong> diambil jika syarat terpenuhi.</li>
                <li><strong>Jalan kedua (<code>else</code>)</strong> otomatis diambil jika syarat pertama gagal. Kamu tidak akan pernah berjalan di kedua jalan tersebut sekaligus!</li>
              </ul>
            </article>

            <article class="reading-section">
              <h4>Contoh dua jalan keputusan</h4>
              <div class="reading-code">age = 15

<span class="code-keyword">if</span> age &gt;= 17:
    print(<span class="code-string">"Boleh membuat KTP"</span>)
<span class="code-keyword">else</span>:
    print(<span class="code-string">"Belum boleh membuat KTP"</span>)</div>
              <p class="reading-note">Python hanya menjalankan <strong>satu cabang</strong>. Karena <code>15 &gt;= 17</code> bernilai False, program melewati blok <code>if</code> dan menjalankan blok <code>else</code>.</p>
            </article>

            <details class="reading-details">
              <summary>Operator perbandingan yang sering dipakai</summary>
              <div class="reading-details-content">
                <table class="comparison-table">
                  <thead><tr><th>Operator</th><th>Arti</th><th>Contoh</th></tr></thead>
                  <tbody>
                    <tr><td><code>==</code></td><td>Sama dengan</td><td><code>answer == "A"</code></td></tr>
                    <tr><td><code>!=</code></td><td>Nggak sama kayak</td><td><code>status != "off"</code></td></tr>
                    <tr><td><code>&gt;</code> / <code>&lt;</code></td><td>Lebih besar / lebih kecil</td><td><code>score &gt; 75</code></td></tr>
                    <tr><td><code>&gt;=</code> / <code>&lt;=</code></td><td>Minimal / maksimal</td><td><code>age &gt;= 17</code></td></tr>
                  </tbody>
                </table>
              </div>
            </details>
          </div>
          </details>
        </section>

        <section class="step-panel" id="step-3" v-show="currentStep === 3">
          <div class="video-frame" :class="{ 'player-ready': playerStates[3]?.isReady }" data-video-step="3">
            <div id="youtube-player-3"></div>
            <div class="custom-thumbnail" v-show="!playerStates[3]?.hasStarted" @click="togglePlay(3)">
              <img src="https://cdn-web-2.ruangguru.com/landing-pages/assets/ec2aeaa6-e2e2-4e83-861e-223bfb9e1138.jpg" alt="Thumbnail" />
            </div>
            <button class="video-center-play" type="button" v-show="!playerStates[3]?.isPlaying" @click="togglePlay(3)">▶</button>
            <div class="video-controls" aria-label="Kontrol video 3">
              <button class="video-control-button video-play" type="button" @click="togglePlay(3)">{{ playerStates[3]?.isPlaying ? "⏸" : "▶" }}</button>
              <input class="video-seek" type="range" min="0" max="100" step="0.1" :value="playerStates[3]?.progress || 0" @input="onSeekInput(3, $event)" aria-label="Posisi video">
              <span class="video-time">{{ playerStates[3]?.currentTimeFormatted || "0:00" }} / {{ playerStates[3]?.durationFormatted || "0:00" }}</span>
              <button class="video-control-button video-mute" type="button" @click="toggleMute(3)">{{ playerStates[3]?.isMuted ? "🔇" : "🔊" }}</button>
              <button class="video-control-button video-fullscreen" type="button" @click="toggleFullscreen(3)">⛶</button>
            </div>
          </div>

          <div class="bookmarks-container" v-if="courseData[3].bookmarks?.length > 0">
            <button class="bookmark-btn" v-for="bm in courseData[3].bookmarks" :key="bm.label" @click="seekToBookmark(3, bm.time)">
              <span class="bookmark-time">{{ formatVideoTime(bm.time) }}</span> {{ bm.label }}
            </button>
          </div>
          <div class="below-video">
            <article class="summary-card">
              <h3 class="card-heading">
                <span class="heading-icon" aria-hidden="true">03</span>
                Loot Box Hari Ini 🎁
              </h3>
              <ul class="takeaway-list">
                <li><strong><code>elif</code> menambah cabang.</strong> Gunakan ketika keputusan memiliki lebih dari dua kemungkinan.</li>
                <li><strong>Python membaca dari atas.</strong> Cabang pertama yang bernilai True akan dijalankan dan cabang berikutnya dilewati.</li>
                <li><strong>Urutan kondisi menentukan hasil.</strong> Untuk rentang nilai, letakkan syarat paling tinggi atau paling spesifik lebih dahulu.</li>
              </ul>
            </article>

            <aside class="focus-card">
              <div>
                <p class="label">Peringatan Kuis Kejutan! 🤫</p>
                <h3>Perhatikan videonya baik-baik!</h3>
                <p>Di tengah-tengah video nanti, akan muncul kuis kejutan untuk mengecek pemahamanmu. Tonton sampai selesai ya!</p>
              </div>
            </aside>
          </div>
          <details class="lesson-reading-accordion">
            <summary>Buka Materi Bacaan</summary>
          <div class="lesson-reading">
            <header class="reading-header">
              <div>
                <p class="label">Materi Bacaan 03</p>
                <h3>Multi-branch dengan <code>if</code>, <code>elif</code>, dan <code>else</code></h3>
                <p>Multi-branch dipakai ketika program harus memilih satu hasil dari banyak kategori, misalnya kategori nilai, level, atau hari.</p>
              </div>
              <span class="reading-badge">Banyak pilihan</span>
            </header>

            <div class="concept-grid">
              <article class="concept-card">
                <span class="concept-number">1</span>
                <h4>Mulai dengan <code>if</code></h4>
                <p>Cabang pertama memeriksa kondisi yang paling penting atau paling spesifik.</p>
              </article>
              <article class="concept-card">
                <span class="concept-number">2</span>
                <h4>Lanjutkan dengan <code>elif</code></h4>
                <p>Setiap <code>elif</code> hanya diperiksa jika semua kondisi sebelumnya salah.</p>
              </article>
              <article class="concept-card">
                <span class="concept-number">3</span>
                <h4>Akhiri dengan <code>else</code></h4>
                <p><code>else</code> menangani semua nilai yang tidak cocok dengan cabang sebelumnya.</p>
              </article>
            </div>

            <article class="reading-section">
              <h4>Pohon Keputusan (Decision Tree) 🌲</h4>
              <p>Kamu bisa membayangkan <code>elif</code> sebagai cabang-cabang pohon. Mulai dari batang utama (<code>if</code>), lalu kamu bisa menambahkan sebanyak apa pun cabang yang kamu butuhkan dengan <code>elif</code>. Jika tidak ada yang cocok, semuanya jatuh ke tanah (<code>else</code>).</p>
            </article>

            <article class="reading-section">
              <h4>Contoh kategori nilai</h4>
              <div class="reading-code">score = 82

<span class="code-keyword">if</span> score &gt;= 90:
    print(<span class="code-string">"Sangat Baik"</span>)
<span class="code-keyword">elif</span> score &gt;= 75:
    print(<span class="code-string">"Baik"</span>)
<span class="code-keyword">elif</span> score &gt;= 60:
    print(<span class="code-string">"Cukup"</span>)
<span class="code-keyword">else</span>:
    print(<span class="code-string">"Perlu latihan lagi"</span>)</div>
              <p class="reading-note">Hasilnya adalah <strong>Baik</strong>. Nilai 82 gagal pada syarat pertama, berhasil pada syarat kedua, lalu Python berhenti memeriksa cabang berikutnya.</p>
            </article>

            <article class="reading-section">
              <h4>Mini Project: Smart Checker 👨‍🎓</h4>
              <p>Contoh lain yang sering dipakai adalah mengecek status penyelesaian tugas siswa bersama dengan nilai.</p>
              <div class="reading-code">score = 82
task_done = <span class="code-keyword">True</span>

<span class="code-keyword">if not</span> task_done:
    print(<span class="code-string">"Selesaikan tugas dulu"</span>)
<span class="code-keyword">elif</span> score &gt;= 85:
    print(<span class="code-string">"Siap ikut kelas advance"</span>)
<span class="code-keyword">elif</span> score &gt;= 70:
    print(<span class="code-string">"Lanjut latihan berikutnya"</span>)
<span class="code-keyword">else</span>:
    print(<span class="code-string">"Perlu belajar ulang"</span>)</div>
            </article>

            <details class="reading-details">
              <summary>Kesalahan umum: kondisi terlalu umum ditaruh di atas</summary>
              <div class="reading-details-content">
                <p>Jika <code>score &gt;= 60</code> ditaruh paling atas, nilai 95 langsung masuk ke kategori “Cukup”. Susun rentang dari batas tertinggi ke batas terendah agar setiap kategori mendapat prioritas yang benar.</p>
              </div>
            </details>
          </div>
          </details>
        </section>

        <section class="step-panel" id="step-4" v-show="currentStep === 4">
          <div class="video-frame" :class="{ 'player-ready': playerStates[4]?.isReady }" data-video-step="4">
            <div id="youtube-player-4"></div>
            <div class="custom-thumbnail" v-show="!playerStates[4]?.hasStarted" @click="togglePlay(4)">
              <img src="https://cdn-web-2.ruangguru.com/landing-pages/assets/47f3ef56-348b-4c3c-a767-aa4a40c5b833.jpg" alt="Thumbnail" />
            </div>
            <button class="video-center-play" type="button" v-show="!playerStates[4]?.isPlaying" @click="togglePlay(4)">▶</button>
            <div class="video-controls" aria-label="Kontrol video 4">
              <button class="video-control-button video-play" type="button" @click="togglePlay(4)">{{ playerStates[4]?.isPlaying ? "⏸" : "▶" }}</button>
              <input class="video-seek" type="range" min="0" max="100" step="0.1" :value="playerStates[4]?.progress || 0" @input="onSeekInput(4, $event)" aria-label="Posisi video">
              <span class="video-time">{{ playerStates[4]?.currentTimeFormatted || "0:00" }} / {{ playerStates[4]?.durationFormatted || "0:00" }}</span>
              <button class="video-control-button video-mute" type="button" @click="toggleMute(4)">{{ playerStates[4]?.isMuted ? "🔇" : "🔊" }}</button>
              <button class="video-control-button video-fullscreen" type="button" @click="toggleFullscreen(4)">⛶</button>
            </div>
          </div>
          
          <div class="bookmarks-container" v-if="courseData[4].bookmarks?.length > 0">
            <button class="bookmark-btn" v-for="bm in courseData[4].bookmarks" :key="bm.label" @click="seekToBookmark(4, bm.time)">
              <span class="bookmark-time">{{ formatVideoTime(bm.time) }}</span> {{ bm.label }}
            </button>
          </div>
          <div class="below-video">
            <aside class="focus-card">
              <div>
                <p class="label">Peringatan Kuis Kejutan! 🤫</p>
                <h3>Perhatikan videonya baik-baik!</h3>
                <p>Di tengah-tengah video nanti, akan muncul kuis kejutan untuk mengecek pemahamanmu. Tonton sampai selesai ya!</p>
              </div>
            </aside>
          </div>
          <details class="lesson-reading-accordion">
            <summary>Buka Materi Bacaan</summary>
          <div class="lesson-reading">
            <header class="reading-header">
              <div>
                <p class="label">Materi Bacaan 04</p>
                <h3>Nested condition: pengecekan bertahap</h3>
                <p>Nested condition adalah kondisi di dalam kondisi. Pemeriksaan kedua baru dilakukan setelah pemeriksaan pertama berhasil.</p>
              </div>
              <span class="reading-badge">Kondisi bersarang</span>
            </header>

            <div class="concept-grid">
              <article class="concept-card">
                <span class="concept-number">A</span>
                <h4>Tahap pertama</h4>
                <p>Periksa syarat utama, misalnya apakah pengguna punya tiket atau sudah login.</p>
              </article>
              <article class="concept-card">
                <span class="concept-number">B</span>
                <h4>Tahap kedua</h4>
                <p>Jika syarat utama terpenuhi, periksa syarat lanjutan seperti umur, role, atau jumlah koin.</p>
              </article>
              <article class="concept-card">
                <span class="concept-number">C</span>
                <h4>Aksi berbeda per tahap</h4>
                <p>Nested cocok ketika tiap kegagalan perlu pesan atau tindakan yang berbeda.</p>
              </article>
            </div>

            <article class="reading-section">
              <h4>Analogi Masuk Bioskop 🏢</h4>
              <p>Bayangkan kamu sedang pergi menonton bioskop:</p>
              <ul>
                <li><strong>Pintu Pertama:</strong> Penjaga mengecek tiket masuk. Kalau tidak punya tiket, kamu langsung dilarang masuk.</li>
                <li><strong>Pintu Kedua:</strong> Petugas di depan studio mengecek umurmu untuk disesuaikan dengan rating film.</li>
              </ul>
              <p>Kamu tidak akan pernah sampai diperiksa di pintu kedua jika tidak lolos di pintu pertama!</p>
            </article>

            <article class="reading-section">
              <h4>Contoh pemeriksaan tiket dan umur</h4>
              <div class="reading-code">has_ticket = <span class="code-keyword">True</span>
age = 16

<span class="code-keyword">if</span> has_ticket:
    <span class="code-keyword">if</span> age &gt;= 13:
        print(<span class="code-string">"Boleh masuk studio"</span>)
    <span class="code-keyword">else</span>:
        print(<span class="code-string">"Umur belum cukup"</span>)
<span class="code-keyword">else</span>:
    print(<span class="code-string">"Harus punya tiket dulu"</span>)</div>
              <p class="reading-note">Perhatikan indentasinya. <code>if age</code> berada di dalam <code>if has_ticket</code>, sehingga umur hanya diperiksa ketika pengguna sudah memiliki tiket.</p>
            </article>

            <details class="reading-details">
              <summary>Kapan nested condition sebaiknya dipakai?</summary>
              <div class="reading-details-content">
                <ul>
                  <li>Ketika proses memang harus berlangsung secara berurutan.</li>
                  <li>Ketika setiap tahap memiliki pesan kegagalan yang berbeda.</li>
                  <li>Ketika kondisi kedua tidak relevan sebelum kondisi pertama terpenuhi.</li>
                </ul>
                <p class="reading-note">Hindari terlalu banyak tingkat nested karena kode akan makin menjorok dan sulit dibaca.</p>
              </div>
            </details>
          </div>
          </details>
        </section>

        <section class="step-panel" id="step-5" v-show="currentStep === 5">
          <div class="video-frame" :class="{ 'player-ready': playerStates[5]?.isReady }" data-video-step="5">
            <div id="youtube-player-5"></div>
            <div class="custom-thumbnail" v-show="!playerStates[5]?.hasStarted" @click="togglePlay(5)">
              <img src="https://cdn-web-2.ruangguru.com/landing-pages/assets/00c64b24-9e45-4a7e-8665-0817c04217c3.jpg" alt="Thumbnail" />
            </div>
            <button class="video-center-play" type="button" v-show="!playerStates[5]?.isPlaying" @click="togglePlay(5)">▶</button>
            <div class="video-controls" aria-label="Kontrol video 5">
              <button class="video-control-button video-play" type="button" @click="togglePlay(5)">{{ playerStates[5]?.isPlaying ? "⏸" : "▶" }}</button>
              <input class="video-seek" type="range" min="0" max="100" step="0.1" :value="playerStates[5]?.progress || 0" @input="onSeekInput(5, $event)" aria-label="Posisi video">
              <span class="video-time">{{ playerStates[5]?.currentTimeFormatted || "0:00" }} / {{ playerStates[5]?.durationFormatted || "0:00" }}</span>
              <button class="video-control-button video-mute" type="button" @click="toggleMute(5)">{{ playerStates[5]?.isMuted ? "🔇" : "🔊" }}</button>
              <button class="video-control-button video-fullscreen" type="button" @click="toggleFullscreen(5)">⛶</button>
            </div>
          </div>
          
          <div class="bookmarks-container" v-if="courseData[5].bookmarks?.length > 0">
            <button class="bookmark-btn" v-for="bm in courseData[5].bookmarks" :key="bm.label" @click="seekToBookmark(5, bm.time)">
              <span class="bookmark-time">{{ formatVideoTime(bm.time) }}</span> {{ bm.label }}
            </button>
          </div>
          <div class="below-video">
            <aside class="focus-card">
              <div>
                <p class="label">Peringatan Kuis Kejutan! 🤫</p>
                <h3>Perhatikan videonya baik-baik!</h3>
                <p>Di tengah-tengah video nanti, akan muncul kuis kejutan untuk mengecek pemahamanmu. Tonton sampai selesai ya!</p>
              </div>
            </aside>
          </div>
          <details class="lesson-reading-accordion">
            <summary>Buka Materi Bacaan</summary>
          <div class="lesson-reading">
            <header class="reading-header">
              <div>
                <p class="label">Materi Bacaan 05</p>
                <h3>Menggabungkan kondisi dengan logical operators</h3>
                <p><code>and</code>, <code>or</code>, dan <code>not</code> membantu kita mengecek beberapa syarat dalam satu ekspresi yang lebih ringkas.</p>
              </div>
              <span class="reading-badge">Logika kombinasi</span>
            </header>

            <div class="concept-grid">
              <article class="concept-card">
                <span class="concept-number">&amp;</span>
                <h4><code>and</code>: semua harus benar</h4>
                <p>Hasilnya True hanya jika setiap kondisi yang digabungkan bernilai True.</p>
              </article>
              <article class="concept-card">
                <span class="concept-number">∨</span>
                <h4><code>or</code>: salah satu cukup</h4>
                <p>Hasilnya True jika minimal satu kondisi bernilai True.</p>
              </article>
              <article class="concept-card">
                <span class="concept-number">¬</span>
                <h4><code>not</code>: membalik nilai</h4>
                <p><code>not True</code> menjadi False dan <code>not False</code> menjadi True.</p>
              </article>
            </div>

            <article class="reading-section">
              <h4>Contoh Sistem Diskon Toko 🏷️</h4>
              <p>Sebuah toko memberi diskon jika pelanggan mempunyai total belanja &gt;= 100.000 <strong>dan</strong> adalah member, <strong>atau</strong> pelanggan punya kupon spesial.</p>
              <div class="reading-code">total = 120000
is_member = <span class="code-keyword">True</span>
has_coupon = <span class="code-keyword">False</span>

<span class="code-keyword">if</span> (total &gt;= 100000 <span class="code-keyword">and</span> is_member) <span class="code-keyword">or</span> has_coupon:
    print(<span class="code-string">"Mendapat diskon"</span>)
<span class="code-keyword">else</span>:
    print(<span class="code-string">"Tidak mendapat diskon"</span>)</div>
              <p class="reading-note">Tanda kurung <code>()</code> penting digunakan agar prioritas logika lebih mudah dipahami oleh programmer lain!</p>
            </article>

            <article class="reading-section">
              <h4>Contoh kondisi kompleks</h4>
              <div class="reading-code">score = 80
task_done = <span class="code-keyword">True</span>
remedial = <span class="code-keyword">False</span>

<span class="code-keyword">if</span> score &gt;= 75 <span class="code-keyword">and</span> task_done <span class="code-keyword">and not</span> remedial:
    print(<span class="code-string">"Semua syarat terpenuhi"</span>)</div>
              <p class="reading-note"><code>score &gt;= 75</code>, <code>task_done</code>, dan <code>not remedial</code> semuanya True, jadi blok dijalankan.</p>
            </article>

            <article class="reading-section">
              <h4>Nested atau logical operator?</h4>
              <table class="comparison-table">
                <thead><tr><th>Pilih</th><th>Ketika</th><th>Contoh</th></tr></thead>
                <tbody>
                  <tr><td><strong>Nested</strong></td><td>Pengecekan bertahap dan tiap tahap punya aksi berbeda.</td><td>Login dulu, lalu cek role pengguna.</td></tr>
                  <tr><td><strong>Logical operator</strong></td><td>Beberapa syarat dapat diperiksa sekaligus untuk satu aksi.</td><td>Sudah daftar <code>and</code> sudah membayar.</td></tr>
                </tbody>
              </table>
              <div class="reading-code"><span class="code-comment"># Tanda kurung memperjelas prioritas</span>
<span class="code-keyword">if</span> password_ok <span class="code-keyword">and</span> (is_admin <span class="code-keyword">or</span> is_premium):
    print(<span class="code-string">"Akses diterima"</span>)</div>
            </article>
          </div>
          </details>
        </section>

        <section class="step-panel" id="step-6" v-show="currentStep === 6">
          <div class="video-frame" :class="{ 'player-ready': playerStates[6]?.isReady }" data-video-step="6">
            <div id="youtube-player-6"></div>
            <div class="custom-thumbnail" v-show="!playerStates[6]?.hasStarted" @click="togglePlay(6)">
              <img src="https://cdn-web-2.ruangguru.com/landing-pages/assets/c179c0a4-8817-4f1b-a9ef-cf6dcaa093c9.jpg" alt="Thumbnail" />
            </div>
            <button class="video-center-play" type="button" v-show="!playerStates[6]?.isPlaying" @click="togglePlay(6)">▶</button>
            <div class="video-controls" aria-label="Kontrol video 6">
              <button class="video-control-button video-play" type="button" @click="togglePlay(6)">{{ playerStates[6]?.isPlaying ? "⏸" : "▶" }}</button>
              <input class="video-seek" type="range" min="0" max="100" step="0.1" :value="playerStates[6]?.progress || 0" @input="onSeekInput(6, $event)" aria-label="Posisi video">
              <span class="video-time">{{ playerStates[6]?.currentTimeFormatted || "0:00" }} / {{ playerStates[6]?.durationFormatted || "0:00" }}</span>
              <button class="video-control-button video-mute" type="button" @click="toggleMute(6)">{{ playerStates[6]?.isMuted ? "🔇" : "🔊" }}</button>
              <button class="video-control-button video-fullscreen" type="button" @click="toggleFullscreen(6)">⛶</button>
            </div>
          </div>
          
          <div class="bookmarks-container" v-if="courseData[6].bookmarks?.length > 0">
            <button class="bookmark-btn" v-for="bm in courseData[6].bookmarks" :key="bm.label" @click="seekToBookmark(6, bm.time)">
              <span class="bookmark-time">{{ formatVideoTime(bm.time) }}</span> {{ bm.label }}
            </button>
          </div>
          <div class="below-video">
            <aside class="focus-card">
              <div>
                <p class="label">Peringatan Kuis Kejutan! 🤫</p>
                <h3>Perhatikan videonya baik-baik!</h3>
                <p>Di tengah-tengah video nanti, akan muncul kuis kejutan untuk mengecek pemahamanmu. Tonton sampai selesai ya!</p>
              </div>
            </aside>
          </div>
          <details class="lesson-reading-accordion">
            <summary>Buka Materi Bacaan</summary>
          <div class="lesson-reading">
            <header class="reading-header">
              <div>
                <p class="label">Materi Bacaan 06</p>
                <h3>Financial literacy dengan Python</h3>
                <p>Gunakan data, conditional, logical operator, dan nested condition untuk membedakan kebutuhan, menyusun budget, serta menilai risiko keputusan keuangan.</p>
              </div>
              <span class="reading-badge">Aplikasi nyata</span>
            </header>

            <div class="concept-grid">
              <article class="concept-card">
                <span class="concept-number">1</span>
                <h4>Kebutuhan</h4>
                <p>Penting untuk hidup, belajar, atau aktivitas utama. Contoh: makanan, transportasi, buku, dan kuota belajar.</p>
              </article>
              <article class="concept-card">
                <span class="concept-number">2</span>
                <h4>Keinginan</h4>
                <p>Disukai, tetapi dapat ditunda. Contoh: skin game, stiker, minuman tambahan, atau aksesori.</p>
              </article>
              <article class="concept-card">
                <span class="concept-number">3</span>
                <h4>Keputusan berdasarkan data</h4>
                <p>Program mempertimbangkan kategori, harga, jumlah uang, sisa budget, dan rencana pengguna.</p>
              </article>
            </div>

            <article class="reading-section">
              <h4>Analogi Uang Rp 50.000 ⚖️</h4>
              <p>Kalau kamu punya uang Rp 50.000, kamu harus memilih antara buku tulis (kebutuhan) dan stiker lucu (keinginan). Dalam Python, kita bisa membuat program yang mengecek kategori dan uang:</p>
              <div class="reading-code">category = <span class="code-string">"kebutuhan"</span>
price = 15000
money = 50000

<span class="code-keyword">if</span> category == <span class="code-string">"kebutuhan"</span> <span class="code-keyword">and</span> money &gt;= price:
    print(<span class="code-string">"Prioritaskan pembelian!"</span>)
<span class="code-keyword">elif</span> category == <span class="code-string">"keinginan"</span> <span class="code-keyword">and</span> money &gt;= price:
    print(<span class="code-string">"Boleh beli, tapi cek kebutuhan utama sudah terpenuhi belum"</span>)
<span class="code-keyword">else</span>:
    print(<span class="code-string">"Uang belum cukup, cari alternatif lebih murah"</span>)</div>
            </article>

            <article class="reading-section">
              <h4>Langkah membuat budget</h4>
              <ol>
                <li>Simpan jumlah uang yang tersedia.</li>
                <li>Bagi anggaran ke kategori makan, transportasi, sekolah, dan tabungan.</li>
                <li>Hitung <code>total_budget</code> dan <code>remaining_money</code>.</li>
                <li>Gunakan conditional untuk menentukan apakah budget aman, pas, atau terlalu besar.</li>
              </ol>
              <div class="reading-code">total_money = 100000
food_budget = 40000
transport_budget = 20000
school_budget = 25000
saving_budget = 10000

total_budget = food_budget + transport_budget + school_budget + saving_budget
remaining_money = total_money - total_budget

<span class="code-keyword">if</span> total_budget &gt; total_money:
    print(<span class="code-string">"Budget terlalu besar"</span>)
<span class="code-keyword">elif</span> remaining_money == 0:
    print(<span class="code-string">"Budget pas, tidak ada sisa"</span>)
<span class="code-keyword">else</span>:
    print(<span class="code-string">"Budget aman, masih ada sisa"</span>)</div>
            </article>

            <article class="reading-section">
              <h4>Menilai level risiko</h4>
              <table class="comparison-table">
                <thead><tr><th>Level</th><th>Ciri utama</th><th>Contoh keputusan</th></tr></thead>
                <tbody>
                  <tr><td><strong>Low</strong></td><td>Kebutuhan penting, uang cukup, dan masih ada cadangan.</td><td>Membeli buku sekolah Rp25.000 dari Rp100.000.</td></tr>
                  <tr><td><strong>Medium</strong></td><td>Masih dapat dipertimbangkan, tetapi hasil atau manfaat belum pasti.</td><td>Memakai sebagian uang sebagai modal project kecil.</td></tr>
                  <tr><td><strong>High</strong></td><td>Menghabiskan hampir semua uang atau membeli keinginan mahal tanpa rencana.</td><td>Menggunakan Rp95.000 untuk barang tren.</td></tr>
                </tbody>
              </table>
              <p class="reading-note">Semakin lengkap data yang diperiksa, semakin masuk akal rekomendasi program. Jangan hanya mengecek “uang cukup”, tetapi cek juga kategori barang dan sisa uang.</p>
            </article>

            <details class="reading-details">
              <summary>Contoh nested condition untuk rekomendasi risiko</summary>
              <div class="reading-details-content">
                <div class="reading-code">remaining_money = money - price

<span class="code-keyword">if</span> category == <span class="code-string">"kebutuhan"</span>:
    <span class="code-keyword">if</span> money &gt;= price:
        risk_level = <span class="code-string">"Low"</span>
    <span class="code-keyword">else</span>:
        risk_level = <span class="code-string">"Medium"</span>
<span class="code-keyword">else</span>:
    <span class="code-keyword">if</span> money &lt; price <span class="code-keyword">or</span> remaining_money &lt; 10000:
        risk_level = <span class="code-string">"High"</span>
    <span class="code-keyword">elif</span> price &gt; money * 0.5:
        risk_level = <span class="code-string">"Medium"</span>
    <span class="code-keyword">else</span>:
        risk_level = <span class="code-string">"Low"</span></div>
              </div>
            </details>
          </div>
          </details>
        </section>

        <section class="step-panel" id="step-7" v-show="currentStep === 7">
          <div class="video-frame" :class="{ 'player-ready': playerStates[7]?.isReady }" data-video-step="7">
            <div id="youtube-player-7"></div>
            <div class="custom-thumbnail" v-show="!playerStates[7]?.hasStarted" @click="togglePlay(7)">
              <img src="https://cdn-web-2.ruangguru.com/landing-pages/assets/98bcac2b-e88e-46d8-b1c1-deebd6a12c03.jpg" alt="Thumbnail" />
            </div>
            <button class="video-center-play" type="button" v-show="!playerStates[7]?.isPlaying" @click="togglePlay(7)">▶</button>
            <div class="video-controls" aria-label="Kontrol video 7">
              <button class="video-control-button video-play" type="button" @click="togglePlay(7)">{{ playerStates[7]?.isPlaying ? "⏸" : "▶" }}</button>
              <input class="video-seek" type="range" min="0" max="100" step="0.1" :value="playerStates[7]?.progress || 0" @input="onSeekInput(7, $event)" aria-label="Posisi video">
              <span class="video-time">{{ playerStates[7]?.currentTimeFormatted || "0:00" }} / {{ playerStates[7]?.durationFormatted || "0:00" }}</span>
              <button class="video-control-button video-mute" type="button" @click="toggleMute(7)">{{ playerStates[7]?.isMuted ? "🔇" : "🔊" }}</button>
              <button class="video-control-button video-fullscreen" type="button" @click="toggleFullscreen(7)">⛶</button>
            </div>
          </div>
          <details class="lesson-reading-accordion">
            <summary>Buka Materi Bacaan</summary>
          <div class="lesson-reading">
            <iframe src="assignment_slides.html" style="width: 100%; height: 600px; border: 4px solid var(--black); border-radius: 12px; margin-top: 15px; margin-bottom: 30px; box-shadow: 6px 6px 0 var(--black);" title="Instruksi Tugas Akhir"></iframe>
            <!-- Python IDE -->
            <div class="ide-container" style="background-color: #282c34; border-radius: 12px; padding: 20px; color: white; border: 4px solid var(--black); margin-bottom: 40px; box-shadow: 6px 6px 0px var(--black);">
              <h3 style="margin-top: 0; color: var(--yellow); font-family: 'Fredoka', sans-serif;">Tulis dan uji programmu</h3>
              <textarea id="python-ide-7" spellcheck="false" style="width: 100%; height: 420px; background-color: #1e1e1e; color: #d4d4d4; font-family: 'Courier New', Courier, monospace; font-size: 16px; padding: 15px; border-radius: 8px; border: 1px solid #444; margin-bottom: 15px; resize: vertical;"># 1. Data uang dan budget
total_money = 100000
food_budget = 30000
transport_budget = 20000
school_budget = 25000
saving_budget = 15000

# 2. Hitung total budget dan sisa uang
total_budget = food_budget + transport_budget + school_budget + saving_budget
remaining_money = total_money - total_budget

# 3. Data barang yang akan dievaluasi
item = "buku tulis"
category = "kebutuhan"
price = 15000
risk_level = ""

# Lanjutkan programmu:
# - cek keamanan budget
# - tentukan risk_level
# - tampilkan rekomendasi dan alasan
</textarea>
              <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                <button onclick="runAssignmentCode()" style="background-color: var(--green); color: var(--black); font-weight: bold; padding: 12px 24px; border-radius: 8px; border: 2px solid var(--black); cursor: pointer; font-family: 'Fredoka', sans-serif; box-shadow: 3px 3px 0px var(--black);">▶ Jalankan Kode</button>
                <button onclick="submitAssignmentCode()" style="background-color: var(--blue); color: var(--white); font-weight: bold; padding: 12px 24px; border-radius: 8px; border: 2px solid var(--black); cursor: pointer; font-family: 'Fredoka', sans-serif; box-shadow: 3px 3px 0px var(--black);">📥 Submit Tugas</button>
              </div>
              <h4 style="margin-bottom: 5px; font-family: 'Fredoka', sans-serif;">Console Output:</h4>
              <div id="ide-output-7" style="background-color: black; padding: 15px; border-radius: 8px; min-height: 100px; font-family: 'Courier New', Courier, monospace; white-space: pre-wrap; font-size: 14px; border: 1px solid #444;"></div>
            </div>
          </div>
          </details>
        </section>

        <div class="navigation">
          <button class="nav-button secondary" id="prevButton" type="button" disabled>
            <span aria-hidden="true">←</span> Sebelumnya
          </button>
          <button class="nav-button primary" id="nextButton" type="button" disabled>
            Lanjut ke video 2 <span aria-hidden="true">→</span>
          </button>
        </div>
      </section>
    </main>

    <footer class="footer-note">
      Copyright © 2025 PT Ruang Raya Indonesia. Materi tidak boleh disebarluaskan tanpa izin.
    </footer>
  </div>

  
  <div class="quiz-overlay" id="quizOverlay" role="dialog" aria-modal="true" aria-labelledby="quizTitle" :class="{ open: quizState.isOpen }">
    <div class="quiz-dialog">
      <header class="quiz-header">
        <span class="quiz-header-icon" aria-hidden="true">?</span>
        <div>
          <p class="quiz-kicker">Checkpoint pemahaman</p>
          <h2 id="quizTitle">Mini Quiz Waktu!</h2>
          <p class="quiz-subtitle">Jawab berdasarkan materi yang baru kamu tonton.</p>
        </div>
      </header>
      <div class="quiz-body">
        <div class="quiz-progress" id="quizProgress" aria-label="Progres kuis">
          <span 
            v-for="(_, index) in quizState.shuffledQuestions" 
            :key="index" 
            class="quiz-dot"
            :class="{ 
              done: index < quizState.currentQuestionIdx, 
              active: index === quizState.currentQuestionIdx 
            }"
          ></span>
        </div>
        <div v-show="currentQuestion && !currentQuestion.html" class="quiz-question" id="quizQuestion">
          {{ currentQuestion ? currentQuestion.question : 'Memuat pertanyaan...' }}
        </div>
        <div v-if="currentQuestion && currentQuestion.html" id="quizCustomHtml" v-html="currentQuestion.html"></div>
        <div v-show="currentQuestion && !currentQuestion.html" class="answer-row" id="answerRow">
          <button 
            v-for="(choice, cIdx) in (currentQuestion ? currentQuestion.choices : [])" 
            :key="cIdx" 
            class="answer-button"
            :class="{ 
              true: choice === 'TRUE' || choice === 'True',
              false: choice === 'FALSE' || choice === 'False'
            }"
            @click="checkAnswer(choice)"
            :disabled="quizState.choicesDisabled"
            :style="{ opacity: quizState.choicesDisabled ? (quizState.selectedChoice === choice ? 1 : 0.5) : 1 }"
          >
            {{ choice }}
          </button>
        </div>
        <div class="quiz-feedback" id="quizFeedback" role="status" v-show="quizState.quizFeedback" :class="quizState.quizFeedbackType">
          <span v-html="quizState.quizFeedback"></span>
        </div>
        <div class="quiz-actions">
          <button class="quiz-review" type="button" @click="replayActiveQuizVideo">↺ Ulangi 30 detik video</button>
          <button class="quiz-next" type="button" v-show="quizState.isNextBtnVisible" @click="goToNextQuestion">{{ quizState.nextBtnText || (quizState.currentQuestionIdx < quizState.shuffledQuestions.length - 1 ? 'Soal berikutnya →' : 'Selesai →') }}</button>
        </div>
      </div>
    </div>
  </div>

  <div class="quiz-return" id="quizReturn" role="status" :class="{ visible: quizReturn.isVisible }">
    <p>Sudah cukup mengulang materinya? Kamu bisa kembali ke checkpoint kapan saja.</p>
    <button type="button" @click="returnToActiveQuiz">Kembali ke kuis sekarang →</button>
  </div>

  <div class="completion-toast" id="completionToast" role="status">
    Misi selesai. Kamu sudah mempelajari conditional, logical operator, dan penerapannya dalam perencanaan keuangan.
  </div>
</template>