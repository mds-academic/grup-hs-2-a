<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick, reactive } from 'vue';
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
const currentStep = ref(0);
const maxStep = computed(() => Math.max(...Object.keys(courseData).map(Number)));
const totalSteps = Object.keys(courseData).length;
const APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz58EffczfpcNL0bvbD6VZvrY3mrVNtmpWasSwJT0baOowD2yGu_KNM0YNul9EtxxKVpg/exec';
const LEARNING_STATE_STORAGE_KEY = 'mds_ghs2a_learning_state';
const isLoggedIn = ref(false);
const loginSchool = ref('');
const loginEmail = ref('');
const selectedSchool = ref('');
const isLoggingIn = ref(false);
const showLoginError = ref(false);
const loginErrorTitle = ref('');
const loginErrorMessage = ref('');
const dashboardNotice = reactive({
  isOpen: false,
  type: 'warning',
  title: '',
  message: '',
  actionLabel: 'Mengerti',
  actionStep: null,
  actionMode: 'step'
});
const dashboardNoticeIcon = computed(() => ({
  success: 'OK',
  warning: '!',
  error: '!'
})[dashboardNotice.type] || '!');
const showDashboardNotice = ({ type = 'warning', title = 'Perhatian', message = '', actionLabel = 'Mengerti', actionStep = null, actionMode = 'step' } = {}) => {
  dashboardNotice.type = type;
  dashboardNotice.title = title;
  dashboardNotice.message = message;
  dashboardNotice.actionLabel = actionLabel;
  dashboardNotice.actionStep = actionStep;
  dashboardNotice.actionMode = actionMode;
  dashboardNotice.isOpen = true;
};
const closeDashboardNotice = () => {
  dashboardNotice.isOpen = false;
};
const handleDashboardNoticeAction = () => {
  if (dashboardNotice.actionStep) {
    currentStep.value = dashboardNotice.actionStep;
  }
  const shouldOpenQuiz = dashboardNotice.actionMode === 'quiz';
  closeDashboardNotice();
  if (shouldOpenQuiz) {
    nextTick(() => {
      openQuizButtonHandler();
    });
  }
};
const schoolOptions = ref([]);
const isSchoolLoading = ref(false);
const isSchoolDropdownOpen = ref(false);
const loginEmailAttempts = ref(0);
const loginEmailSuggestion = ref(null);
const emailHelpOpen = ref(false);
const emailHelpQuery = ref('');
const emailHelpResults = ref([]);
const isEmailHelpLoading = ref(false);

const showProfileMenu = ref(false);

const isDesktop = ref(window.innerWidth > 1024);
const updateWidth = () => { isDesktop.value = window.innerWidth > 1024; };
let schoolSearchTimer = null;
let schoolSearchRequestId = 0;

const studentData = ref({ name: '', school: '', email: '' });
const studentProgress = ref({}); // Menyimpan progress jawaban & attempts

const buildSheetsPayload = () => ({
  Group: 'ghs2a',
  Students_Email: studentData.value.email,
  Students_Name: studentData.value.name,
  Students_School: studentData.value.school,
  ...studentProgress.value
});

const getQuizDebugInfo = (quizConfig = quizState.value.activeQuizConfig, stepId = quizState.value.activeQuizStep || currentStep.value) => {
  const quizzes = courseData[stepId]?.quizzes || [];
  const quizIndex = quizConfig ? quizzes.indexOf(quizConfig) + 1 : null;
  return {
    tab: Number(stepId),
    quizKe: quizIndex && quizIndex > 0 ? quizIndex : null,
    totalQuizDiTab: quizzes.length,
    waktuVideoDetik: quizConfig?.time ?? null
  };
};

const debugLearningEvent = (message, details = {}, payloadOverride = null) => {
  const payload = payloadOverride || buildSheetsPayload();
  console.groupCollapsed(`[MDS Debug] ${message}`);
  console.log('Detail event:', {
    waktu: new Date().toISOString(),
    ...details
  });
  console.log('Payload yang akan dikirim ke Sheets:', payload);
  console.groupEnd();
};

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

const markQuestionFailed = (qid) => {
  if (!qid) return;
  studentProgress.value[`${qid}_Ans`] = '0';
  studentProgress.value[`${qid}_Score`] = 0;
  studentProgress.value[`${qid}_Failed`] = true;
  if (qid === 'V6_Q1') studentProgress.value['V6_Needs_Ans'] = '0';
  if (qid === 'V6_Q2') studentProgress.value['V6_Wants_Ans'] = '0';
  if (qid === 'V6_Q3') studentProgress.value['V6_IDE_Code'] = '0';
  localStorage.setItem('mds_student_progress', JSON.stringify(studentProgress.value));
  syncToSheets();
};

const syncToSheets = async () => {
  if (!isLoggedIn.value) return;
  const payload = buildSheetsPayload();
  debugLearningEvent('Mengirim progress ke Sheets', { status: 'sync_mulai' }, payload);
  try {
    const res = await fetch(APP_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'text/plain;charset=utf-8' } // text/plain untuk bypass CORS AppScript
    });
    const responseText = await res.text();
    let responseData = null;
    try {
      responseData = responseText ? JSON.parse(responseText) : null;
    } catch (parseErr) {
      responseData = responseText;
    }

    if (!res.ok || responseData?.success === false) {
      console.error('[MDS Debug] Sync ke Sheets gagal atau ditolak.', {
        httpStatus: res.status,
        response: responseData
      });
      return;
    }

    console.log('[MDS Debug] Sync ke Sheets berhasil disimpan.', responseData);
  } catch(err) {
    console.error("Sync error", err);
  }
};

const handleLogin = async () => {
  if (!selectedSchool.value || !loginEmail.value.trim()) {
    loginErrorTitle.value = 'Lengkapi dulu ya';
    loginErrorMessage.value = 'Pilih sekolah, lalu masukkan email yang terdaftar di Akademia Ruangguru.';
    showLoginError.value = true;
    return;
  }
  
  isLoggingIn.value = true;
  showLoginError.value = false;
  loginEmailSuggestion.value = null;

  try {
    const nextAttempt = loginEmailAttempts.value + 1;
    const params = new URLSearchParams({
      action: 'login',
      school: selectedSchool.value,
      email: loginEmail.value,
      group: 'ghs2a',
      attempts: String(nextAttempt)
    });
    const res = await fetch(`${APP_SCRIPT_URL}?${params.toString()}`);
    const data = await res.json();
    if (data.success) {
      studentData.value = { name: data.name, school: data.school, email: data.email };
      isLoggedIn.value = true;
      loginEmailAttempts.value = 0;
      localStorage.setItem('mds_student_login', JSON.stringify(studentData.value));

      // SINKRONISASI CLOUD & RESET BERSIH
      if (!data.existsInResult || !data.progress || Object.keys(data.progress).length === 0) {
        console.log('[MDS] Data reset terdeteksi dari sheet. Menghapus cache lokal.');
        studentProgress.value = {};
        localStorage.removeItem('mds_student_progress');
        localStorage.removeItem(LEARNING_STATE_STORAGE_KEY);
        currentStep.value = 0;
        Object.keys(videoWatchedStatus.value).forEach(k => { videoWatchedStatus.value[k] = false; });
        Object.keys(courseData).forEach(s => {
          (courseData[s].quizzes || []).forEach(q => { q.shown = false; });
        });
      } else {
        console.log('[MDS] Restore progress dari Google Sheets:', data.progress);
        studentProgress.value = { ...studentProgress.value, ...data.progress };
        if (studentProgress.value['V6_Needs_Ans'] && !studentProgress.value['V6_Q1_Ans']) {
          studentProgress.value['V6_Q1_Ans'] = studentProgress.value['V6_Needs_Ans'];
        }
        if (studentProgress.value['V6_Wants_Ans'] && !studentProgress.value['V6_Q2_Ans']) {
          studentProgress.value['V6_Q2_Ans'] = studentProgress.value['V6_Wants_Ans'];
        }
        if (studentProgress.value['V6_IDE_Code'] && !studentProgress.value['V6_Q3_Ans']) {
          studentProgress.value['V6_Q3_Ans'] = studentProgress.value['V6_IDE_Code'];
        }
        localStorage.setItem('mds_student_progress', JSON.stringify(studentProgress.value));
      }

      debugLearningEvent('Login berhasil', { status: 'login_berhasil' });
      nextTick(() => {
        initializeYouTubePlayer(currentStep.value);
      });
    } else {
      loginEmailAttempts.value = nextAttempt;
      loginErrorTitle.value = data.needsRfo ? 'Perlu bantuan RFO' : 'Email belum cocok';
      loginErrorMessage.value = data.message || 'Email ini belum cocok dengan data Akademia Ruangguru untuk sekolah yang dipilih. Coba cek lagi penulisannya ya.';
      loginEmailSuggestion.value = data.suggestion || null;
      showLoginError.value = true;
    }
  } catch (err) {
    console.error("Login error", err);
    loginErrorTitle.value = 'Belum bisa masuk';
    loginErrorMessage.value = 'Koneksi ke data siswa belum berhasil. Coba lagi sebentar ya.';
    showLoginError.value = true;
  } finally {
    isLoggingIn.value = false;
  }
};

const fetchSchoolOptions = async (query = loginSchool.value) => {
  const requestId = ++schoolSearchRequestId;
  isSchoolLoading.value = true;
  try {
    const params = new URLSearchParams({ action: 'schools', query });
    const res = await fetch(`${APP_SCRIPT_URL}?${params.toString()}`);
    const data = await res.json();
    if (requestId === schoolSearchRequestId && data.success) schoolOptions.value = data.schools || [];
  } catch (err) {
    console.error("School search error", err);
  } finally {
    if (requestId === schoolSearchRequestId) isSchoolLoading.value = false;
  }
};

const fetchEmailHelpResults = async (query = emailHelpQuery.value) => {
  if (!selectedSchool.value || !query.trim()) {
    emailHelpResults.value = [];
    return;
  }
  isEmailHelpLoading.value = true;
  try {
    const params = new URLSearchParams({ action: 'students', school: selectedSchool.value, query });
    const res = await fetch(`${APP_SCRIPT_URL}?${params.toString()}`);
    const data = await res.json();
    if (data.success) emailHelpResults.value = data.students || [];
  } catch (err) {
    console.error("Email help search error", err);
  } finally {
    isEmailHelpLoading.value = false;
  }
};

const handleSchoolInput = () => {
  selectedSchool.value = '';
  loginEmail.value = '';
  emailHelpQuery.value = '';
  emailHelpResults.value = [];
  isSchoolDropdownOpen.value = true;
  loginEmailAttempts.value = 0;
  loginEmailSuggestion.value = null;
  showLoginError.value = false;
  if (schoolSearchTimer) clearTimeout(schoolSearchTimer);
  schoolSearchTimer = setTimeout(() => fetchSchoolOptions(), 250);
};

const handleEmailInput = () => {
  loginEmailSuggestion.value = null;
  showLoginError.value = false;
};

const handleEmailHelpInput = () => {
  fetchEmailHelpResults();
};

const openSchoolDropdown = () => {
  isSchoolDropdownOpen.value = true;
  fetchSchoolOptions('');
};

const closeSchoolDropdownSoon = () => {
  setTimeout(() => {
    isSchoolDropdownOpen.value = false;
  }, 120);
};

const selectSchool = (school) => {
  loginSchool.value = school;
  selectedSchool.value = school;
  loginEmail.value = '';
  emailHelpQuery.value = '';
  emailHelpResults.value = [];
  isSchoolDropdownOpen.value = false;
  loginEmailAttempts.value = 0;
  loginEmailSuggestion.value = null;
  showLoginError.value = false;
};

const toggleEmailHelp = () => {
  emailHelpOpen.value = !emailHelpOpen.value;
  if (!emailHelpOpen.value) return;
  emailHelpQuery.value = '';
  emailHelpResults.value = [];
};


onUnmounted(() => {
  window.removeEventListener('resize', updateWidth);
});

const handleLogout = () => {
  pauseAllMediaExcept(-1);
  localStorage.removeItem('mds_student_login');
  isLoggedIn.value = false;
  loginSchool.value = '';
  loginEmail.value = '';
  selectedSchool.value = '';
  isSchoolDropdownOpen.value = false;
  loginEmailAttempts.value = 0;
  loginEmailSuggestion.value = null;
  emailHelpOpen.value = false;
  emailHelpQuery.value = '';
  emailHelpResults.value = [];
  studentData.value = { email: '', name: '', school: '' };
};

const checkCloudProgressOnMount = async () => {
  if (!studentData.value.email) return;
  try {
    const params = new URLSearchParams({
      action: 'get_progress',
      email: studentData.value.email,
      group: 'ghs2a'
    });
    const res = await fetch(`${APP_SCRIPT_URL}?${params.toString()}`);
    const data = await res.json();
    if (data.success) {
      if (!data.existsInResult) {
        console.log('[MDS] Reset admin terdeteksi saat mount. Reset progress lokal.');
        studentProgress.value = {};
        localStorage.removeItem('mds_student_progress');
        localStorage.removeItem(LEARNING_STATE_STORAGE_KEY);
        currentStep.value = 0;
        Object.keys(videoWatchedStatus.value).forEach(k => { videoWatchedStatus.value[k] = false; });
        Object.keys(courseData).forEach(s => {
          (courseData[s].quizzes || []).forEach(q => { q.shown = false; });
        });
      } else if (data.progress && Object.keys(data.progress).length > 0) {
        studentProgress.value = { ...studentProgress.value, ...data.progress };
        if (studentProgress.value['V6_Needs_Ans'] && !studentProgress.value['V6_Q1_Ans']) {
          studentProgress.value['V6_Q1_Ans'] = studentProgress.value['V6_Needs_Ans'];
        }
        if (studentProgress.value['V6_Wants_Ans'] && !studentProgress.value['V6_Q2_Ans']) {
          studentProgress.value['V6_Q2_Ans'] = studentProgress.value['V6_Wants_Ans'];
        }
        if (studentProgress.value['V6_IDE_Code'] && !studentProgress.value['V6_Q3_Ans']) {
          studentProgress.value['V6_Q3_Ans'] = studentProgress.value['V6_IDE_Code'];
        }
        localStorage.setItem('mds_student_progress', JSON.stringify(studentProgress.value));
      }
    }
  } catch(e) {
    console.warn('[MDS] Cek progress cloud mount gagal:', e);
  }
};

onMounted(() => {
  window.addEventListener('resize', updateWidth);

  const savedLogin = localStorage.getItem('mds_student_login');
  if (savedLogin) {
    studentData.value = JSON.parse(savedLogin);
    isLoggedIn.value = true;
    checkCloudProgressOnMount();
  }
  const savedProgress = localStorage.getItem('mds_student_progress');
  if (savedProgress) {
    studentProgress.value = JSON.parse(savedProgress);
  }
  restoreLearningState();
});

const videoWatchedStatus = ref({
  0: false, 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false
});

const youtubeReady = ref(false);
const players = {};
const timeCheckers = {};


const introRefs = ref({});
const introPlayed = ref({});
const introVideoSrc = import.meta.env.BASE_URL + 'intro.mp4';

const playerStates = ref({
  0: { isPlaying: false, currentTime: 0, duration: 0, isMuted: false, isReady: false, isError: false, hasStarted: false, isBuffering: false },
  1: { isPlaying: false, currentTime: 0, duration: 0, isMuted: false, isReady: false, isError: false, hasStarted: false, isBuffering: false },
  2: { isPlaying: false, currentTime: 0, duration: 0, isMuted: false, isReady: false, isError: false, hasStarted: false, isBuffering: false },
  3: { isPlaying: false, currentTime: 0, duration: 0, isMuted: false, isReady: false, isError: false, hasStarted: false, isBuffering: false },
  4: { isPlaying: false, currentTime: 0, duration: 0, isMuted: false, isReady: false, isError: false, hasStarted: false, isBuffering: false },
  5: { isPlaying: false, currentTime: 0, duration: 0, isMuted: false, isReady: false, isError: false, hasStarted: false, isBuffering: false },
  6: { isPlaying: false, currentTime: 0, duration: 0, isMuted: false, isReady: false, isError: false, hasStarted: false, isBuffering: false },
  7: { isPlaying: false, currentTime: 0, duration: 0, isMuted: false, isReady: false, isError: false, hasStarted: false, isBuffering: false },
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
  choicesDisabled: false,
  selectedChoice: null
});

let learningStateHydrated = false;
let lastLearningStatePersistedAt = 0;
let pendingActiveQuizRestore = null;

const getActiveQuizSnapshot = () => {
  const stepId = quizState.value.activeQuizStep;
  const quizConfig = quizState.value.activeQuizConfig;
  if (!quizState.value.isOpen || !stepId || !quizConfig) return null;

  const quizIndex = (courseData[stepId]?.quizzes || []).indexOf(quizConfig);
  if (quizIndex < 0) return null;

  return {
    stepId: Number(stepId),
    quizIndex,
    currentQuestionIdx: quizState.value.currentQuestionIdx || 0
  };
};

const isQuestionCompleted = (question) => {
  if (!question?.qid || question.type === 'info' || question.continueOnly === true) return true;
  const ans = studentProgress.value[`${question.qid}_Ans`];
  const failed = studentProgress.value[`${question.qid}_Failed`];
  if ((ans !== undefined && ans !== null && ans !== '') || failed === true) return true;
  if (question.qid === 'V6_Q1' && studentProgress.value['V6_Needs_Ans']) return true;
  if (question.qid === 'V6_Q2' && studentProgress.value['V6_Wants_Ans']) return true;
  if (question.qid === 'V6_Q3' && (studentProgress.value['V6_IDE_Code'] || studentProgress.value['V6_IDE_Att'])) return true;
  return false;
};

const isQuizCompleted = (quiz) => {
  const requiredQuestions = (quiz?.questions || []).filter(q => q.qid && q.type !== 'info' && q.continueOnly !== true);
  return requiredQuestions.length === 0 || requiredQuestions.every(isQuestionCompleted);
};

const getQuizShownSnapshot = () => {
  const snapshot = {};
  Object.keys(courseData).forEach((stepId) => {
    snapshot[stepId] = (courseData[stepId]?.quizzes || []).map(quiz => quiz.shown === true);
  });
  return snapshot;
};

const getLastVideoTimeSnapshot = () => {
  const snapshot = {};
  Object.keys(courseData).forEach((stepId) => {
    const player = players[stepId];
    if (player && typeof player.getCurrentTime === 'function') {
      snapshot[stepId] = Math.floor(player.getCurrentTime() || 0);
      return;
    }
    const startBoundary = getVideoStartBoundary(stepId);
    snapshot[stepId] = Math.floor(startBoundary + (playerStates.value[stepId]?.currentTime || 0));
  });
  return snapshot;
};

const persistLearningState = ({ force = false, activeQuiz } = {}) => {
  if (!learningStateHydrated) return;

  const now = Date.now();
  if (!force && now - lastLearningStatePersistedAt < 1500) return;
  lastLearningStatePersistedAt = now;

  const state = {
    currentStep: Number(currentStep.value),
    videoWatchedStatus: { ...videoWatchedStatus.value },
    quizShown: getQuizShownSnapshot(),
    lastVideoTime: getLastVideoTimeSnapshot(),
    activeQuiz: activeQuiz !== undefined ? activeQuiz : getActiveQuizSnapshot(),
    updatedAt: new Date().toISOString()
  };

  localStorage.setItem(LEARNING_STATE_STORAGE_KEY, JSON.stringify(state));
};

const restoreLearningState = () => {
  learningStateHydrated = true;

  try {
    const savedState = JSON.parse(localStorage.getItem(LEARNING_STATE_STORAGE_KEY) || 'null');
    if (!savedState || typeof savedState !== 'object') return;

    const restoredStep = Number(savedState.currentStep);
    if (courseData[restoredStep] !== undefined) {
      currentStep.value = restoredStep;
    }

    if (savedState.videoWatchedStatus && typeof savedState.videoWatchedStatus === 'object') {
      Object.keys(videoWatchedStatus.value).forEach((stepId) => {
        videoWatchedStatus.value[stepId] = savedState.videoWatchedStatus[stepId] === true;
      });
    }

    if (savedState.quizShown && typeof savedState.quizShown === 'object') {
      Object.keys(savedState.quizShown).forEach((stepId) => {
        const quizzes = courseData[stepId]?.quizzes || [];
        quizzes.forEach((quiz, index) => {
          quiz.shown = savedState.quizShown[stepId]?.[index] === true;
        });
      });
    }

    if (savedState.lastVideoTime && typeof savedState.lastVideoTime === 'object') {
      Object.keys(savedState.lastVideoTime).forEach((stepId) => {
        if (!playerStates.value[stepId]) return;
        const absoluteTime = Number(savedState.lastVideoTime[stepId]) || 0;
        const startBoundary = getVideoStartBoundary(stepId);
        const relativeTime = Math.max(0, absoluteTime - startBoundary);
        playerStates.value[stepId].currentTime = relativeTime;
        playerStates.value[stepId].currentTimeFormatted = formatVideoTime(relativeTime);
        playerStates.value[stepId].hasStarted = relativeTime > 0 || savedState.videoWatchedStatus?.[stepId] === true;
      });
    }

    const activeQuiz = savedState.activeQuiz;
    const activeStepId = Number(activeQuiz?.stepId);
    const activeQuizIndex = Number(activeQuiz?.quizIndex);
    const activeQuizConfig = courseData[activeStepId]?.quizzes?.[activeQuizIndex];
    if (activeQuizConfig && !isQuizCompleted(activeQuizConfig)) {
      currentStep.value = activeStepId;
      activeQuizConfig.shown = true;
      pendingActiveQuizRestore = { stepId: activeStepId, quizIndex: activeQuizIndex };
    }
  } catch (err) {
    console.warn('Gagal memulihkan progress belajar:', err);
  }
};

const restorePendingActiveQuiz = () => {
  if (!pendingActiveQuizRestore) return;

  const { stepId, quizIndex } = pendingActiveQuizRestore;
  const quizConfig = courseData[stepId]?.quizzes?.[quizIndex];
  pendingActiveQuizRestore = null;
  if (!quizConfig || isQuizCompleted(quizConfig)) {
    persistLearningState({ force: true, activeQuiz: null });
    return;
  }

  const player = players[stepId];
  if (player && typeof player.pauseVideo === 'function') {
    player.pauseVideo();
  }
  openQuiz(quizConfig.questions, quizConfig.resume !== undefined ? quizConfig.resume : true, quizConfig.resumeTime, quizConfig, stepId);
};

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

const restartVideoFromBoundary = (stepId, shouldPlay = true) => {
  const player = players[stepId];
  if (!player || typeof player.seekTo !== "function") return;

  const startBoundary = getVideoStartBoundary(stepId);
  player.seekTo(startBoundary, true);
  playerStates.value[stepId].currentTime = startBoundary;
  playerStates.value[stepId].progress = getSeekValue(stepId);

  if (shouldPlay && typeof player.playVideo === "function") {
    player.playVideo();
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
  
  const thresholdTime = duration > 25 ? (duration - 20) : (duration * 0.95);
  const isWatchedByThreshold = duration > 0 && currentTime >= thresholdTime;
  const isWatchedByPercent = playerStates.value[stepId].progress >= 95;
  const meetsWatchRequirement = (stepId === 0 || stepId === '0') ? isWatchedByThreshold : (isWatchedByThreshold || isWatchedByPercent);

  if (meetsWatchRequirement && !videoWatchedStatus.value[stepId]) {
    videoWatchedStatus.value[stepId] = true;
    persistLearningState({ force: true });
  }
  persistLearningState();
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

// Helper universal pemati media antar-tab & logout
const pauseAllMediaExcept = (activeStepId) => {
  const targetId = activeStepId !== undefined && activeStepId !== null ? Number(activeStepId) : -1;
  
  // Pause all HTML5 intro videos
  if (introRefs.value) {
    Object.keys(introRefs.value).forEach(id => {
      if (Number(id) !== targetId) {
        const el = introRefs.value[id];
        if (el && typeof el.pause === 'function') {
          try { el.pause(); } catch(e) {}
        }
        if (playerStates.value && playerStates.value[id]) {
          playerStates.value[id].introPlaying = false;
        }
      }
    });
  }

  // Pause all YouTube players
  Object.keys(players).forEach(id => {
    if (Number(id) !== targetId) {
      if (players[id] && typeof players[id].pauseVideo === 'function') {
        try { players[id].pauseVideo(); } catch(e) {}
      }
      if (playerStates.value && playerStates.value[id]) {
        playerStates.value[id].isPlaying = false;
      }
    }
  });

  // Clear all timeCheckers except activeStepId
  Object.keys(timeCheckers).forEach(id => {
    if (Number(id) !== targetId) {
      window.clearInterval(timeCheckers[id]);
      delete timeCheckers[id];
    }
  });
};

// Video actions
const playIntroThenVideo = async (stepId) => {
  if (Number(stepId) !== Number(currentStep.value)) return;
  const introEl = introRefs.value[stepId];
  if (introEl && !introPlayed.value[stepId]) {
    playerStates.value[stepId].introPlaying = true;
    playerStates.value[stepId].hasStarted = true;
    await nextTick();
    introEl.currentTime = 0;
    introEl.play().catch(e => {
      console.error("Intro video play error:", e);
      onIntroEnded(stepId);
    });
  } else {
    console.warn("No introEl or already played for step", stepId);
    onIntroEnded(stepId);
  }
};

const onIntroEnded = (stepId) => {
  if (playerStates.value[stepId]) {
    playerStates.value[stepId].introPlaying = false;
  }
  introPlayed.value[stepId] = true;
  
  // Guard: Jangan putar YouTube jika siswa sudah berganti tab!
  if (Number(stepId) !== Number(currentStep.value)) {
    return;
  }

  const player = players[stepId];
  if (!player || typeof player.getPlayerState !== "function") {
    initializeYouTubePlayer(stepId);
    setTimeout(() => {
      if (Number(stepId) === Number(currentStep.value) && players[stepId] && typeof players[stepId].playVideo === 'function') {
         players[stepId].playVideo();
      }
    }, 500);
  } else {
    player.playVideo();
  }
};

const playVideo = (stepId) => {
  if (Number(stepId) !== Number(currentStep.value)) return;
  if (!introPlayed.value[stepId]) {
    playIntroThenVideo(stepId);
    return;
  }
  playerStates.value[stepId].hasStarted = true;
  const player = players[stepId];
  if (!player || typeof player.getPlayerState !== "function") {
    initializeYouTubePlayer(stepId);
    setTimeout(() => {
      if (Number(stepId) === Number(currentStep.value) && players[stepId] && typeof players[stepId].playVideo === 'function') {
         players[stepId].playVideo();
      }
    }, 500);
    return;
  }
  player.playVideo();
};
const togglePlay = (stepId) => {
  if (!introPlayed.value[stepId]) {
    playIntroThenVideo(stepId);
    return;
  }
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
  if (!isLoggedIn.value) return;
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
      vq: 'hd1080',
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
        const savedState = JSON.parse(localStorage.getItem(LEARNING_STATE_STORAGE_KEY) || 'null');
        const savedVideoTime = Number(savedState?.lastVideoTime?.[normalizedStepId]) || 0;
        const startBoundary = getVideoStartBoundary(normalizedStepId);
        if (savedVideoTime > startBoundary + 1 && typeof event.target.seekTo === 'function') {
          event.target.seekTo(savedVideoTime, true);
          if (typeof event.target.pauseVideo === 'function') {
            event.target.pauseVideo();
          }
        }
        updateVideoControls(normalizedStepId);
        checkVideoQuizzes(normalizedStepId);
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
  const isBuffering = event.data === window.YT.PlayerState.BUFFERING;
  const wasPlaying = playerStates.value[stepId].isPlaying;
  playerStates.value[stepId].isBuffering = isBuffering;
  playerStates.value[stepId].isPlaying = isPlaying;

  if (isPlaying) {
    playerStates.value[stepId].hasStarted = true;
    enforceVideoStartBoundary(stepId);
    if (!wasPlaying) {
      debugLearningEvent(`Video ${stepId} sedang ditonton`, {
        status: 'video_sedang_ditonton',
        tab: Number(stepId),
        videoId: courseData[stepId]?.videoId || null
      });
    }
  }

  if (event.data === window.YT.PlayerState.ENDED) {
    videoWatchedStatus.value[stepId] = true;
    persistLearningState({ force: true });
    debugLearningEvent(`Video ${stepId} selesai ditonton`, {
      status: 'video_selesai',
      tab: Number(stepId),
      tabBerikutnya: Number(stepId) < totalSteps ? Number(stepId) + 1 : null
    });
    const quizOpened = checkVideoQuizzes(stepId);
    
    if (!quizOpened) {
      restartVideoFromBoundary(stepId, false);
      introPlayed.value[stepId] = false;
      playerStates.value[stepId].hasStarted = false;
      playerStates.value[stepId].isPlaying = false;
    }
    
    return;
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
  const currentTime = player && typeof player.getCurrentTime === 'function' ? player.getCurrentTime() : 0;
  const isEnded = Boolean(
    videoWatchedStatus.value[stepId] ||
    (player && typeof player.getPlayerState === 'function' && player.getPlayerState() === window.YT.PlayerState.ENDED)
  );

  const stepConfig = courseData[stepId];
  if (!stepConfig || !stepConfig.quizzes) return false;

  for (let quiz of stepConfig.quizzes) {
    if (quizState.value.replayingQuizVideo && quiz === quizState.value.activeQuizConfig) {
      if (currentTime < quiz.time - 0.5) {
        quizState.value.replayCheckpointArmed = true;
      }
      if (!quizState.value.replayCheckpointArmed) continue;
    }

    if (!quiz.shown && (currentTime >= quiz.time || isEnded)) {
      quiz.shown = true;
      persistLearningState({ force: true });
      if (player && typeof player.pauseVideo === 'function') {
        player.pauseVideo();
      }
      window.clearInterval(timeCheckers[stepId]);

      const shouldResume = quiz.resume !== undefined ? quiz.resume : true;
      openQuiz(quiz.questions, shouldResume, quiz.resumeTime, quiz, stepId);
      return true;
    }
  }

  return false;
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
  quizState.value.selectedChoice = null;
  quizState.value.quizFeedback = '';
  quizState.value.quizFeedbackType = '';
  quizState.value.isNextBtnVisible = false;
  quizState.value.nextBtnText = 'Soal berikutnya →';
  persistLearningState({ force: true });

  const quizInfo = getQuizDebugInfo(quizConfig, stepId);
  debugLearningEvent(`Pop up quiz ${quizInfo.quizKe || '-'} dari ${quizInfo.totalQuizDiTab} di tab ${stepId} sedang dikerjakan`, {
    status: 'quiz_sedang_dikerjakan',
    ...quizInfo,
    jumlahSoal: questionsArray.length
  });

  nextTick(() => {
    renderQuestion();
  });
};

const closeQuiz = (resumeVideo = false, seekTime = null) => {
  const stepId = currentStep.value;
  const player = players[stepId];
  const currentTime = (player && typeof player.getCurrentTime === 'function') ? player.getCurrentTime() : 0;
  const isEnded = Boolean(
    videoWatchedStatus.value[stepId] ||
    (player && typeof player.getPlayerState === 'function' && player.getPlayerState() === window.YT.PlayerState.ENDED)
  );

  const stepConfig = courseData[stepId];
  if (stepConfig && stepConfig.quizzes) {
    const nextQuiz = stepConfig.quizzes.find(q => !q.shown && (currentTime >= q.time || isEnded));
    if (nextQuiz) {
      nextQuiz.shown = true;
      const shouldResume = nextQuiz.resume !== undefined ? nextQuiz.resume : true;
      openQuiz(nextQuiz.questions, shouldResume, nextQuiz.resumeTime, nextQuiz, stepId);
      return;
    }
  }

  sheet.sequence.play({ direction: 'reverse', range: [0, 0.4] }).then(() => {
    quizState.value.isOpen = false;
    persistLearningState({ force: true, activeQuiz: null });
  });
  if (!resumeVideo) {
    videoWatchedStatus.value[stepId] = true;
  }
  if (isEnded && !stepConfig?.quizzes?.some(q => !q.shown)) {
    restartVideoFromBoundary(stepId, false);
    introPlayed.value[stepId] = false;
    if (playerStates.value[stepId]) {
      playerStates.value[stepId].hasStarted = false;
      playerStates.value[stepId].isPlaying = false;
    }
  } else if (resumeVideo && players[currentStep.value]) {
    const p = players[currentStep.value];
    if (seekTime !== null && typeof p.seekTo === "function") {
      p.seekTo(seekTime, true);
    }
    if (typeof p.playVideo === "function") {
      p.playVideo();
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

const getQuestionChoices = (question) => {
  if (!question) return [];
  if (Array.isArray(question.choices) && question.choices.length > 0) return question.choices;
  if (typeof question.answer === "boolean") return ["True", "False"];
  return [];
};

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
  if (currentQuestion.value && (currentQuestion.value.continueOnly || currentQuestion.value.type === 'info')) {
    revealQuizNext("Lanjut →");
  }
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
    const nextBtn = document.querySelector('.quiz-next');
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
    markQuestionFailed(currentQuestion.value?.qid);
    debugLearningEvent(`Quiz di tab ${currentStep.value} sudah 3 kali salah`, {
      status: 'quiz_3_kesempatan_salah',
      ...getQuizDebugInfo(),
      qid: currentQuestion.value?.qid || null,
      attempts
    });
    attemptStatus.innerHTML = "<strong>Sudah 3 kali mencoba.</strong><br>Kamu boleh lanjut dulu. Perhatikan lagi videonya sebelum masuk ke bagian berikutnya, ya.";
    revealQuizNext("Lanjut →");
    btn.disabled = true;
    btn.style.opacity = "0.55";
  } else {
    attemptStatus.textContent = "Jawabanmu belum tepat. Coba cek lagi perlahan dan perhatikan petunjuk dari video.";
  }

  feedbackEl.appendChild(attemptStatus);
};

const handleStandardAnswer = (answer) => {
  const item = currentQuestion.value;
  if (!item) return;
  if (quizState.value.choicesDisabled) return;

  const expectedAnswer = item.answer ?? item.correct;
  const normalizeAnswerValue = (value) => String(value).trim().toLowerCase();
  const normalizedAnswer = normalizeAnswerValue(answer);
  const normalizedExpected = normalizeAnswerValue(expectedAnswer);
  const isCorrect = normalizedAnswer === normalizedExpected;
  const attKey = item.qid ? `${item.qid}_Att` : null;
  const attempts = item.qid
    ? (studentProgress.value[attKey] || 0) + 1
    : (failedAttempts.value[item.question] || 0) + 1;
  
  quizState.value.selectedChoice = answer;
  if (item.qid) {
    studentProgress.value[attKey] = attempts;
    localStorage.setItem('mds_student_progress', JSON.stringify(studentProgress.value));
    syncToSheets();
  } else {
    failedAttempts.value[item.question] = attempts;
  }

  if (isCorrect) {
    quizState.value.choicesDisabled = true;
    quizState.value.quizFeedbackType = 'correct';
    quizState.value.quizFeedback = "Tepat. " + (item.explanation || "");
    if (item.qid) {
      saveProgress(`${item.qid}_Ans`, String(answer));
    }
    debugLearningEvent(`Jawaban quiz di tab ${currentStep.value} benar`, {
      status: 'quiz_jawaban_benar',
      ...getQuizDebugInfo(),
      qid: item.qid || null,
      attempts,
      jawaban: answer,
      kunciJawaban: expectedAnswer
    });
    revealQuizNext();
  } else {
    quizState.value.quizFeedbackType = 'wrong';
    quizState.value.choicesDisabled = true;
    quizState.value.quizFeedback = `Belum tepat. ${(item.explanation || "Silakan coba lagi.")}`;
    markQuestionFailed(item.qid);
    debugLearningEvent(`Jawaban quiz di tab ${currentStep.value} salah`, {
      status: 'quiz_jawaban_salah',
      ...getQuizDebugInfo(),
      qid: item.qid || null,
      attempts,
      jawaban: answer,
      kunciJawaban: expectedAnswer
    });
    revealQuizNext("Lanjut →");
  }
};

const goToNextQuestion = () => {
  if (quizState.value.currentQuestionIdx + 1 >= quizState.value.shuffledQuestions.length) {
    closeQuiz(quizState.value.resumeVideoAfterQuiz, quizState.value.resumeVideoTime);
    return;
  }
  quizState.value.currentQuestionIdx += 1;
  quizState.value.choicesDisabled = false;
  quizState.value.selectedChoice = null;
  quizState.value.quizFeedback = '';
  quizState.value.quizFeedbackType = '';
  quizState.value.isNextBtnVisible = false;
  persistLearningState({ force: true });
  
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
  const showEmptyInputFeedback = (btn, message = 'Isi jawaban dulu sebelum cek, ya.') => {
    const container = btn.parentElement;
    const feedback = container?.nextElementSibling;
    if (!feedback) return false;
    feedback.style.display = 'block';
    feedback.innerHTML = `⚠️ <strong>Belum bisa dicek.</strong><br>${message}`;
    feedback.style.backgroundColor = "#fff3cd";
    feedback.style.color = "#1A1A1A";
    setTimeout(() => {
      if (window.innerWidth <= 650) {
        feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
    return false;
  };

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
    
    if (isCorrect) {
      studentProgress.value[ansKey] = answerStr;
      if (finalAnsKey !== ansKey) {
        studentProgress.value[finalAnsKey] = answerStr;
      }
    } else if (att >= 3) {
      studentProgress.value[ansKey] = '0';
      if (finalAnsKey !== ansKey) {
        studentProgress.value[finalAnsKey] = '0';
      }
      studentProgress.value[`${qid}_Score`] = 0;
      studentProgress.value[`${qid}_Failed`] = true;
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
      buttons.forEach(b => {
        b.disabled = false;
        b.style.opacity = '1';
      });
      markQuestionFailed(qid);
      revealQuizNext("Lanjut →");
    }
  };

  window.checkMB1QGuess = function(kwVal, condVal, btn, explanation) {
    if (!kwVal.trim() || !condVal.trim()) {
      return showEmptyInputFeedback(btn, 'Lengkapi keyword dan kondisi terlebih dahulu.');
    }
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
    if (!val1.trim() || !val2.trim()) {
      return showEmptyInputFeedback(btn, 'Isi kedua angka terlebih dahulu.');
    }
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
    if (!userVal.trim()) {
      return showEmptyInputFeedback(btn, 'Tulis kondisi di kolom jawaban terlebih dahulu.');
    }
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
    if (!userVal.trim()) {
      return showEmptyInputFeedback(btn, 'Tulis lanjutan kondisi terlebih dahulu.');
    }
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
    if (!userVal.trim()) {
      return showEmptyInputFeedback(btn, 'Tulis lanjutan kondisi terlebih dahulu.');
    }
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
    if (!userVal.trim()) {
      return showEmptyInputFeedback(btn, 'Tulis operator dan kondisi lanjutannya terlebih dahulu.');
    }
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
      return showEmptyInputFeedback(btn, 'Lengkapi kelima contohnya terlebih dahulu.');
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

    showDashboardNotice({
      type: 'success',
      title: 'Tugas tersimpan',
      message: 'Progress kamu otomatis tersimpan di server. Selamat, kamu telah menyelesaikan Misi Conditional.'
    });
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
    if (isLoggedIn.value) {
      initializeYouTubePlayer(currentStep.value);
    }
  } else {
    const oldReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (oldReady) oldReady();
      youtubeReady.value = true;
      if (isLoggedIn.value) {
        initializeYouTubePlayer(currentStep.value);
      }
    };
  }
  exposeGlobalMethods();
  nextTick(() => {
    restorePendingActiveQuiz();
  });
});

watch(currentStep, (newStep) => {
  debugLearningEvent(`Tab ${newStep} dibuka`, {
    status: 'tab_dibuka',
    tab: Number(newStep),
    title: courseData[newStep]?.title || ''
  });

  pauseAllMediaExcept(newStep);

  if (quizState.value.activeQuizStep !== null && quizState.value.activeQuizStep !== newStep) {
    quizState.value.replayingQuizVideo = false;
    quizState.value.replayCheckpointArmed = false;
    quizReturn.value.isVisible = false;
  }

  nextTick(() => {
    if (isLoggedIn.value) {
      initializeYouTubePlayer(newStep);
    }
  });
  persistLearningState({ force: true });
  restorePendingActiveQuiz();
});

const openQuizButtonHandler = () => {
  const stepId = currentStep.value;
  if (players[stepId] && typeof players[stepId].pauseVideo === "function") {
    players[stepId].pauseVideo();
  }
  const quizzes = courseData[stepId]?.quizzes || [];
  const targetQuiz = quizzes.find(q => !isQuizCompleted(q)) || quizzes[0];
  if (targetQuiz) {
    targetQuiz.shown = true;
    persistLearningState({ force: true });
    openQuiz(targetQuiz.questions, false, null, targetQuiz, stepId);
  }
};

const getStepQuizProgress = (stepId) => {
  const requiredQuizzes = (courseData[stepId]?.quizzes || [])
    .map((quiz) => {
      const requiredQuestions = (quiz.questions || []).filter(q => q.qid && q.type !== 'info' && q.continueOnly !== true);
      const isCompleted = requiredQuestions.length === 0 || requiredQuestions.every(q => {
        const ans = studentProgress.value[`${q.qid}_Ans`];
        return ans !== undefined && ans !== null && ans !== '';
      });
      const isActive = quizState.value.isOpen &&
        Number(quizState.value.activeQuizStep) === Number(stepId) &&
        quiz === quizState.value.activeQuizConfig;
      const hasOpenedThisSession = quiz.shown === true || isActive;
      return { quiz, requiredQuestions, isCompleted, isActive, hasOpenedThisSession };
    })
    .filter(item => item.requiredQuestions.length > 0);

  const total = requiredQuizzes.length;
  const recordedCompletedCount = requiredQuizzes.filter(item => item.isCompleted).length;
  const sessionCompletedCount = requiredQuizzes.filter(item => item.isCompleted && item.hasOpenedThisSession).length;
  const openedCount = requiredQuizzes.filter(item => item.hasOpenedThisSession).length;
  const activeQuizIndex = requiredQuizzes.findIndex(item => item.isActive) + 1;
  const displayCompletedCount = recordedCompletedCount;

  return { requiredQuizzes, total, recordedCompletedCount, displayCompletedCount, openedCount, activeQuizIndex };
};

const isStepFinished = (stepId) => {
  if (courseData[stepId]?.videoId) {
    if (!videoWatchedStatus.value[stepId]) return false;
  }

  const quizProgress = getStepQuizProgress(stepId);
  return quizProgress.requiredQuizzes.every(item => item.isCompleted);
};

const getStepBlockingNotice = (stepId, targetStep = null) => {
  const stepConfig = courseData[stepId] || {};
  const moduleLabel = (stepId === 0 || stepId === '0') ? 'Video 00' : `Modul ${stepId}`;
  const quizProgress = getStepQuizProgress(stepId);
  const destinationLabel = targetStep !== null ? ((targetStep === 0 || targetStep === '0') ? 'Video 00' : `Modul ${targetStep}`) : 'modul berikutnya';
  const playerState = playerStates.value[stepId] || {};
  const videoStarted = Boolean(
    videoWatchedStatus.value[stepId] ||
    playerState.hasStarted ||
    playerState.currentTime > 0 ||
    quizProgress.openedCount > 0
  );

  if (stepConfig.videoId && !videoStarted) {
    return {
      type: 'warning',
      title: `Mulai ${moduleLabel} dulu ya!`,
      message: `${destinationLabel} masih terkunci karena kamu belum mulai menonton video ${moduleLabel}.\n\nYuk mulai dari langkah pertama:\n\n1. Tonton video ${moduleLabel} sampai selesai (minimal hingga 20 detik sebelum selesai).\n2. Setelah video selesai, kerjakan Quiz/Checkpoint jika ada.\n3. Jika semua checkpoint sudah selesai, ${destinationLabel} akan terbuka otomatis.`,
      actionLabel: `Mulai ${moduleLabel}`,
      actionStep: Number(stepId)
    };
  }

  const videoIncomplete = stepConfig.videoId && !videoWatchedStatus.value[stepId];
  const checkpointIncomplete = quizProgress.total > 0 && quizProgress.displayCompletedCount < quizProgress.total;
  const statusText = videoIncomplete && checkpointIncomplete
    ? `video ${moduleLabel} belum selesai ditonton (minimal hingga 20 detik sebelum video berakhir) dan checkpoint-nya belum lengkap`
    : videoIncomplete
      ? ((stepId === 0 || stepId === '0') ? 'video orientasi ini belum selesai ditonton (wajib tonton sampai minimal 20 detik sebelum video berakhir)' : `video ${moduleLabel} belum selesai ditonton (minimal sampai 20 detik sebelum selesai)`)
      : `quiz/checkpoint ${moduleLabel} belum lengkap`;
  const progressText = quizProgress.total > 0
    ? `\n\nProgress kamu: ${quizProgress.displayCompletedCount} dari ${quizProgress.total} checkpoint selesai.`
    : '';
  const canRecoverQuiz = quizProgress.total > 0 && checkpointIncomplete && (!stepConfig.videoId || videoWatchedStatus.value[stepId]);

  return {
    type: 'warning',
    title: `${moduleLabel} belum selesai`,
    message: canRecoverQuiz
      ? `Kamu sudah mulai belajar, tapi ${statusText}.\n\nKalau quiz/checkpoint tidak muncul otomatis di HP, tekan tombol di bawah untuk membuka checkpoint yang belum selesai.${progressText}`
      : `Kamu sudah mulai belajar, tapi ${statusText}.\n\nSelesaikan dulu video sampai akhir (minimal hingga 20 detik sebelum selesai), lalu kerjakan quiz/checkpoint. Setelah semua checkpoint lengkap, ${destinationLabel} akan terbuka otomatis.${progressText}`,
    actionLabel: canRecoverQuiz ? 'Buka checkpoint' : `Lanjutkan ${moduleLabel}`,
    actionStep: Number(stepId),
    actionMode: canRecoverQuiz ? 'quiz' : 'step'
  };
};

const goToStep = (step) => {
  if (step <= currentStep.value) {
    currentStep.value = step;
    return;
  }
  for (let i = 0; i < step; i++) {
    if (!isStepFinished(i)) {
      showDashboardNotice(getStepBlockingNotice(i, step));
      return;
    }
  }
  currentStep.value = step;
};

const handleStepSelect = (event) => {
  const requestedStep = Number(event.target.value);
  goToStep(requestedStep);
  event.target.value = String(currentStep.value);
};

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
};

const nextStep = () => {
  if (!isStepFinished(currentStep.value)) {
    showDashboardNotice(getStepBlockingNotice(currentStep.value, currentStep.value + 1));
    return;
  }
  if (currentStep.value < maxStep.value) {
    currentStep.value++;
  }
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
        <div class="login-copy">
          <div class="brand-group-login">
            <img class="rg-logo" src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Ruangguru_logo.svg/3840px-Ruangguru_logo.svg.png" alt="Ruangguru">
            <img class="uob-logo" src="https://cdn-web-2.ruangguru.com/landing-pages/assets/37185db7-24a8-467d-aabb-1d5df48f9bc0.png" alt="UOB">
          </div>
          <span class="login-kicker">UOB My Digital Space</span>
          <h1>Python Learning Dashboard</h1>
          <p>Masuk dengan email siswa untuk membuka materi kelasmu.</p>
          <div class="login-highlights" aria-label="Fitur pembelajaran">
            <span>High School</span>
            <span>Python</span>
            <span>Async Class</span>
          </div>
        </div>

        <div class="login-form-panel">
          <span class="login-step">Materi Grup A - HS - 2A</span>
          <h2>Masuk ke kelas</h2>
          <div class="input-group">
            <label for="login-school-a">Nama sekolah</label>
            <div class="login-combobox">
              <input id="login-school-a" type="text" v-model="loginSchool" placeholder="Cari nama sekolah" autocomplete="off" @focus="openSchoolDropdown" @blur="closeSchoolDropdownSoon" @input="handleSchoolInput" :disabled="isLoggingIn">
              <div v-if="isSchoolDropdownOpen" class="login-dropdown">
                <template v-if="!isSchoolLoading">
                  <button v-for="school in schoolOptions" :key="school" type="button" @mousedown.prevent="selectSchool(school)">
                    {{ school }}
                  </button>
                </template>
                <p v-if="isSchoolLoading">Memuat data sekolah...</p>
                <p v-else-if="!schoolOptions.length">Sekolah tidak ditemukan.</p>
              </div>
            </div>

            <label for="login-email-a">Email terdaftar di Akademia Ruangguru</label>
            <input id="login-email-a" type="email" v-model="loginEmail" placeholder="nama@email.com" @input="handleEmailInput" @keyup.enter="handleLogin" :disabled="isLoggingIn || !selectedSchool">

            <button type="button" class="login-help-toggle" @click="toggleEmailHelp" :disabled="!selectedSchool">
              Tidak yakin emailnya? Cari bantuan lewat nama/email
            </button>

            <div v-if="emailHelpOpen" class="email-help-panel">
              <label for="login-help-a">Cari nama siswa/orang tua atau email</label>
              <input id="login-help-a" type="text" v-model="emailHelpQuery" placeholder="Contoh: Taylor atau gmail" @input="handleEmailHelpInput">
              <div class="email-help-results">
                <p v-if="!emailHelpQuery.trim()">Ketik nama atau sebagian email yang mungkin terdaftar.</p>
                <p v-else-if="isEmailHelpLoading">Mencari data...</p>
                <p v-else-if="!emailHelpResults.length">Belum ada data yang mirip di sekolah ini.</p>
                <div v-for="student in emailHelpResults" :key="`${student.school}-${student.name}-${student.maskedEmail}`" class="email-help-result">
                  <strong>{{ student.name }}</strong>
                  <span class="email-help-label">Email terdaftar:</span>
                  <code v-if="student.maskedEmail">{{ student.maskedEmail }}</code>
                  <span v-else class="email-help-missing">Email belum tersedia. Coba cek lagi email yang didaftarkan di Akademia Ruangguru.</span>
                </div>
                <p v-if="emailHelpResults.length" class="email-help-note">Gunakan email terdaftar di atas untuk masuk ke kelas.</p>
              </div>
            </div>

            <button @click="handleLogin" :disabled="isLoggingIn || !selectedSchool || !loginEmail.trim()" class="login-btn">
              {{ isLoggingIn ? 'Memuat...' : 'Mulai Belajar' }}
            </button>
          </div>
          <p class="login-helper">Gunakan email pribadi yang sudah didaftarkan di Akademia Ruangguru.</p>

          <transition name="pop">
            <div v-if="showLoginError" class="login-error-msg">
              <span class="icon">!</span>
              <div>
                <strong>{{ loginErrorTitle }}</strong>
                <p>{{ loginErrorMessage }}</p>
                <div v-if="loginEmailSuggestion" class="registered-email-card">
                  <span>Email terdaftar di sekolah ini:</span>
                  <strong>{{ loginEmailSuggestion.maskedEmail || 'Email belum tersedia' }}</strong>
                  <p>Coba cek lagi tanda titik, huruf yang tertukar, atau domain emailnya.</p>
                </div>
              </div>
            </div>
          </transition>
        </div>
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
            <span id="progressText">{{ currentStep }} dari {{ maxStep }}</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" :style="{ width: (currentStep / maxStep * 100) + '%' }"></div>
          </div>
        </div>

        <nav class="mobile-nav">
          <label for="mobile-lesson-select">Pilih Modul</label>
          <div class="select-wrapper">
            <select id="mobile-lesson-select" :value="currentStep" @change="handleStepSelect">
              <option :value="0">00 Introduction to Async Learning</option>
              <option :value="1">01 Kenalan dengan Conditional</option>
              <option :value="2">02 Conditional di Python</option>
              <option :value="3">03 Multi Branch Conditionals</option>
              <option :value="4">04 Nested Conditionals</option>
              <option :value="5">05 Logical Operator</option>
              <option :value="6">06 Financial Literacy</option>
              <option :value="7">07 Mini Project</option>
            </select>
          </div>
        </nav>

        <nav class="lesson-nav" aria-label="Daftar video">
          <button class="lesson-tab" :class="{ active: currentStep === 0 }" type="button" @click="goToStep(0)">
            <span class="tab-number">00</span>
            <span class="tab-copy">
              <strong>Introduction to Async Learning</strong>
              <span>Orientasi Belajar Mandiri</span>
            </span>
            <span class="tab-arrow" aria-hidden="true">›</span>
          </button>
          <button class="lesson-tab" :class="{ active: currentStep === 1 }" type="button" @click="goToStep(1)">

            <span class="tab-number">01</span>
            <span class="tab-copy">
              <strong>Kenalan dengan Conditional</strong>
              <span>Konsep dasar</span>
            </span>
            <span class="tab-arrow" aria-hidden="true">›</span>
          </button>
          <button class="lesson-tab" :class="{ active: currentStep === 2 }" type="button" @click="goToStep(2)">

            <span class="tab-number">02</span>
            <span class="tab-copy">
              <strong>Conditional di Python</strong>
              <span>Praktik kode</span>
            </span>
            <span class="tab-arrow" aria-hidden="true">›</span>
          </button>
          <button class="lesson-tab" :class="{ active: currentStep === 3 }" type="button" @click="goToStep(3)">

            <span class="tab-number">03</span>
            <span class="tab-copy">
              <strong>Multi Branch Conditionals</strong>
              <span>Cabang & Operator</span>
            </span>
            <span class="tab-arrow" aria-hidden="true">›</span>
          </button>
          <button class="lesson-tab" :class="{ active: currentStep === 4 }" type="button" @click="goToStep(4)">

            <span class="tab-number">04</span>
            <span class="tab-copy">
              <strong>Nested Conditionals</strong>
              <span>Kondisi dalam kondisi</span>
            </span>
            <span class="tab-arrow" aria-hidden="true">›</span>
          </button>
          <button class="lesson-tab" :class="{ active: currentStep === 5 }" type="button" @click="goToStep(5)">

            <span class="tab-number">05</span>
            <span class="tab-copy">
              <strong>Logical Operator</strong>
              <span>Menggabungkan kondisi</span>
            </span>
            <span class="tab-arrow" aria-hidden="true">›</span>
          </button>
          <button class="lesson-tab" :class="{ active: currentStep === 6 }" type="button" @click="goToStep(6)">

            <span class="tab-number">06</span>
            <span class="tab-copy">
              <strong>Financial Literacy</strong>
              <span>Needs vs Wants</span>
            </span>
            <span class="tab-arrow" aria-hidden="true">›</span>
          </button>
          <button class="lesson-tab" :class="{ active: currentStep === 7 }" type="button" @click="goToStep(7)">

            <span class="tab-number">07</span>
            <span class="tab-copy">
              <strong>Mini Project</strong>
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

        <section class="step-panel" id="step-0" v-show="currentStep === 0">
          <div class="video-frame" :class="{ 'player-ready': playerStates[0]?.isReady }" data-video-step="0">
            <video 
              v-show="playerStates[0]?.introPlaying"
              :ref="(el) => { if (el) introRefs[0] = el; }"
              :src="introVideoSrc"
              style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 10; background: black;"
              @ended="onIntroEnded(0)"
              playsinline
            ></video>
            <div id="youtube-player-0"></div>
            <div class="custom-thumbnail" v-show="!playerStates[0]?.hasStarted" @click="togglePlay(0)">
              <img src="https://img.youtube.com/vi/yxmLOk5vcFg/hqdefault.jpg" alt="Thumbnail" />
            </div>
            <button class="video-center-play" type="button" v-show="!playerStates[0]?.isPlaying && !playerStates[0]?.isBuffering && (playerStates[0]?.isReady || !playerStates[0]?.hasStarted)" @click="togglePlay(0)">▶</button>
            <div class="video-loading-overlay" v-show="playerStates[0]?.isBuffering || (playerStates[0]?.hasStarted && !playerStates[0]?.isReady)">
              <div class="spinner"></div>
            </div>
            <div class="video-controls" aria-label="Kontrol video 0" v-show="!playerStates[0]?.introPlaying">
              <button class="video-control-button video-play" type="button" @click="togglePlay(0)">{{ playerStates[0]?.isPlaying ? "⏸" : "▶" }}</button>
              <input class="video-seek" type="range" min="0" max="100" step="0.1" :value="playerStates[0]?.progress || 0" @input="onSeekInput(0, $event)" aria-label="Posisi video">
              <span class="video-time">{{ playerStates[0]?.currentTimeFormatted || "0:00" }} / {{ playerStates[0]?.durationFormatted || "0:00" }}</span>
              <button class="video-control-button video-mute" type="button" @click="toggleMute(0)">{{ playerStates[0]?.isMuted ? "🔇" : "🔊" }}</button>
              <button class="video-control-button video-fullscreen" type="button" @click="toggleFullscreen(0)">⛶</button>
            </div>
          </div>

          <div class="bookmarks-container" v-if="courseData[0]?.bookmarks?.length > 0">
            <button class="bookmark-btn" v-for="bm in courseData[0].bookmarks" :key="bm.label" @click="seekToBookmark(0, bm.time)">
              <span class="bookmark-time">{{ formatVideoTime(bm.time) }}</span> {{ bm.label }}
            </button>
          </div>
        </section>

        <section class="step-panel" id="step-1" v-show="currentStep === 1">
          <div class="video-frame" :class="{ 'player-ready': playerStates[1]?.isReady }" data-video-step="1">
            <video 
              v-show="playerStates[1]?.introPlaying"
              :ref="(el) => { if (el) introRefs[1] = el; }"
              :src="introVideoSrc"
              style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 10; background: black;"
              @ended="onIntroEnded(1)"
              playsinline
            ></video>
            <div id="youtube-player-1"></div>
            <div class="custom-thumbnail" v-show="!playerStates[1]?.hasStarted" @click="togglePlay(1)">
              <img src="https://cdn-web-2.ruangguru.com/landing-pages/assets/fec32e8d-d711-48a2-bd22-59581f0594c1.jpg" alt="Thumbnail" />
            </div>
            <button class="video-center-play" type="button" v-show="!playerStates[1]?.isPlaying && !playerStates[1]?.isBuffering && (playerStates[1]?.isReady || !playerStates[1]?.hasStarted)" @click="togglePlay(1)">▶</button>
            <div class="video-loading-overlay" v-show="playerStates[1]?.isBuffering || (playerStates[1]?.hasStarted && !playerStates[1]?.isReady)">
              <div class="spinner"></div>
            </div>
            <div class="video-controls" aria-label="Kontrol video 1" v-show="!playerStates[1]?.introPlaying">
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
          <details class="lesson-reading-accordion" :open="isDesktop ? true : undefined">
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
            <video 
              v-show="playerStates[2]?.introPlaying"
              :ref="(el) => { if (el) introRefs[2] = el; }"
              :src="introVideoSrc"
              style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 10; background: black;"
              @ended="onIntroEnded(2)"
              playsinline
            ></video>
            <div id="youtube-player-2"></div>
            <div class="custom-thumbnail" v-show="!playerStates[2]?.hasStarted" @click="togglePlay(2)">
              <img src="https://cdn-web-2.ruangguru.com/landing-pages/assets/2925ebc7-89c3-4010-a057-9807aacc6a32.jpg" alt="Thumbnail" />
            </div>
            <button class="video-center-play" type="button" v-show="!playerStates[2]?.isPlaying && !playerStates[2]?.isBuffering && (playerStates[2]?.isReady || !playerStates[2]?.hasStarted)" @click="togglePlay(2)">▶</button>
            <div class="video-loading-overlay" v-show="playerStates[2]?.isBuffering || (playerStates[2]?.hasStarted && !playerStates[2]?.isReady)">
              <div class="spinner"></div>
            </div>
            <div class="video-controls" aria-label="Kontrol video 2" v-show="!playerStates[2]?.introPlaying">
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
          <details class="lesson-reading-accordion" :open="isDesktop ? true : undefined">
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
            <video 
              v-show="playerStates[3]?.introPlaying"
              :ref="(el) => { if (el) introRefs[3] = el; }"
              :src="introVideoSrc"
              style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 10; background: black;"
              @ended="onIntroEnded(3)"
              playsinline
            ></video>
            <div id="youtube-player-3"></div>
            <div class="custom-thumbnail" v-show="!playerStates[3]?.hasStarted" @click="togglePlay(3)">
              <img src="https://cdn-web-2.ruangguru.com/landing-pages/assets/ec2aeaa6-e2e2-4e83-861e-223bfb9e1138.jpg" alt="Thumbnail" />
            </div>
            <button class="video-center-play" type="button" v-show="!playerStates[3]?.isPlaying && !playerStates[3]?.isBuffering && (playerStates[3]?.isReady || !playerStates[3]?.hasStarted)" @click="togglePlay(3)">▶</button>
            <div class="video-loading-overlay" v-show="playerStates[3]?.isBuffering || (playerStates[3]?.hasStarted && !playerStates[3]?.isReady)">
              <div class="spinner"></div>
            </div>
            <div class="video-controls" aria-label="Kontrol video 3" v-show="!playerStates[3]?.introPlaying">
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
          <details class="lesson-reading-accordion" :open="isDesktop ? true : undefined">
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
            <video 
              v-show="playerStates[4]?.introPlaying"
              :ref="(el) => { if (el) introRefs[4] = el; }"
              :src="introVideoSrc"
              style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 10; background: black;"
              @ended="onIntroEnded(4)"
              playsinline
            ></video>
            <div id="youtube-player-4"></div>
            <div class="custom-thumbnail" v-show="!playerStates[4]?.hasStarted" @click="togglePlay(4)">
              <img src="https://cdn-web-2.ruangguru.com/landing-pages/assets/47f3ef56-348b-4c3c-a767-aa4a40c5b833.jpg" alt="Thumbnail" />
            </div>
            <button class="video-center-play" type="button" v-show="!playerStates[4]?.isPlaying && !playerStates[4]?.isBuffering && (playerStates[4]?.isReady || !playerStates[4]?.hasStarted)" @click="togglePlay(4)">▶</button>
            <div class="video-loading-overlay" v-show="playerStates[4]?.isBuffering || (playerStates[4]?.hasStarted && !playerStates[4]?.isReady)">
              <div class="spinner"></div>
            </div>
            <div class="video-controls" aria-label="Kontrol video 4" v-show="!playerStates[4]?.introPlaying">
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
          <details class="lesson-reading-accordion" :open="isDesktop ? true : undefined">
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
            <video 
              v-show="playerStates[5]?.introPlaying"
              :ref="(el) => { if (el) introRefs[5] = el; }"
              :src="introVideoSrc"
              style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 10; background: black;"
              @ended="onIntroEnded(5)"
              playsinline
            ></video>
            <div id="youtube-player-5"></div>
            <div class="custom-thumbnail" v-show="!playerStates[5]?.hasStarted" @click="togglePlay(5)">
              <img src="https://cdn-web-2.ruangguru.com/landing-pages/assets/00c64b24-9e45-4a7e-8665-0817c04217c3.jpg" alt="Thumbnail" />
            </div>
            <button class="video-center-play" type="button" v-show="!playerStates[5]?.isPlaying && !playerStates[5]?.isBuffering && (playerStates[5]?.isReady || !playerStates[5]?.hasStarted)" @click="togglePlay(5)">▶</button>
            <div class="video-loading-overlay" v-show="playerStates[5]?.isBuffering || (playerStates[5]?.hasStarted && !playerStates[5]?.isReady)">
              <div class="spinner"></div>
            </div>
            <div class="video-controls" aria-label="Kontrol video 5" v-show="!playerStates[5]?.introPlaying">
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
          <details class="lesson-reading-accordion" :open="isDesktop ? true : undefined">
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
            <video 
              v-show="playerStates[6]?.introPlaying"
              :ref="(el) => { if (el) introRefs[6] = el; }"
              :src="introVideoSrc"
              style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 10; background: black;"
              @ended="onIntroEnded(6)"
              playsinline
            ></video>
            <div id="youtube-player-6"></div>
            <div class="custom-thumbnail" v-show="!playerStates[6]?.hasStarted" @click="togglePlay(6)">
              <img src="https://cdn-web-2.ruangguru.com/landing-pages/assets/c179c0a4-8817-4f1b-a9ef-cf6dcaa093c9.jpg" alt="Thumbnail" />
            </div>
            <button class="video-center-play" type="button" v-show="!playerStates[6]?.isPlaying && !playerStates[6]?.isBuffering && (playerStates[6]?.isReady || !playerStates[6]?.hasStarted)" @click="togglePlay(6)">▶</button>
            <div class="video-loading-overlay" v-show="playerStates[6]?.isBuffering || (playerStates[6]?.hasStarted && !playerStates[6]?.isReady)">
              <div class="spinner"></div>
            </div>
            <div class="video-controls" aria-label="Kontrol video 6" v-show="!playerStates[6]?.introPlaying">
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
          <details class="lesson-reading-accordion" :open="isDesktop ? true : undefined">
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
            <video 
              v-show="playerStates[7]?.introPlaying"
              :ref="(el) => { if (el) introRefs[7] = el; }"
              :src="introVideoSrc"
              style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 10; background: black;"
              @ended="onIntroEnded(7)"
              playsinline
            ></video>
            <div id="youtube-player-7"></div>
            <div class="custom-thumbnail" v-show="!playerStates[7]?.hasStarted" @click="togglePlay(7)">
              <img src="https://cdn-web-2.ruangguru.com/landing-pages/assets/98bcac2b-e88e-46d8-b1c1-deebd6a12c03.jpg" alt="Thumbnail" />
            </div>
            <button class="video-center-play" type="button" v-show="!playerStates[7]?.isPlaying && !playerStates[7]?.isBuffering && (playerStates[7]?.isReady || !playerStates[7]?.hasStarted)" @click="togglePlay(7)">▶</button>
            <div class="video-loading-overlay" v-show="playerStates[7]?.isBuffering || (playerStates[7]?.hasStarted && !playerStates[7]?.isReady)">
              <div class="spinner"></div>
            </div>
            <div class="video-controls" aria-label="Kontrol video 7" v-show="!playerStates[7]?.introPlaying">
              <button class="video-control-button video-play" type="button" @click="togglePlay(7)">{{ playerStates[7]?.isPlaying ? "⏸" : "▶" }}</button>
              <input class="video-seek" type="range" min="0" max="100" step="0.1" :value="playerStates[7]?.progress || 0" @input="onSeekInput(7, $event)" aria-label="Posisi video">
              <span class="video-time">{{ playerStates[7]?.currentTimeFormatted || "0:00" }} / {{ playerStates[7]?.durationFormatted || "0:00" }}</span>
              <button class="video-control-button video-mute" type="button" @click="toggleMute(7)">{{ playerStates[7]?.isMuted ? "🔇" : "🔊" }}</button>
              <button class="video-control-button video-fullscreen" type="button" @click="toggleFullscreen(7)">⛶</button>
            </div>
          </div>
          <details class="lesson-reading-accordion" :open="isDesktop ? true : undefined">
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

        <div class="nav-buttons">
          <button class="nav-button secondary" type="button" :disabled="currentStep === 0" @click="prevStep()">
            ← Modul Sebelumnya
          </button>
          <button class="nav-button primary" type="button" :disabled="currentStep === maxStep" @click="nextStep()">
            Modul Berikutnya →
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
        <div v-show="currentQuestion && getQuestionChoices(currentQuestion).length > 0" class="answer-row" id="answerRow">
          <button 
            v-for="(choice, cIdx) in getQuestionChoices(currentQuestion)" 
            :key="cIdx" 
            class="answer-button"
            :class="{ 
              true: choice === 'TRUE' || choice === 'True',
              false: choice === 'FALSE' || choice === 'False'
            }"
            @click="handleStandardAnswer(choice)"
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

  <div
    v-if="dashboardNotice.isOpen"
    class="dashboard-notice-backdrop"
    role="dialog"
    aria-modal="true"
    aria-labelledby="dashboardNoticeTitle"
    @click.self="closeDashboardNotice"
  >
    <section class="dashboard-notice-card" :class="dashboardNotice.type">
      <div class="dashboard-notice-icon" aria-hidden="true">{{ dashboardNoticeIcon }}</div>
      <div class="dashboard-notice-copy">
        <p class="dashboard-notice-kicker">Checkpoint belajar</p>
        <h3 id="dashboardNoticeTitle">{{ dashboardNotice.title }}</h3>
        <p class="dashboard-notice-message">{{ dashboardNotice.message }}</p>
      </div>
      <button type="button" class="dashboard-notice-action" @click="handleDashboardNoticeAction">
        {{ dashboardNotice.actionLabel }}
      </button>
    </section>
  </div>

  <div class="completion-toast" id="completionToast" role="status">
    Misi selesai. Kamu sudah mempelajari conditional, logical operator, dan penerapannya dalam perencanaan keuangan.
  </div>
</template>

<style>
.dashboard-notice-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(26, 26, 26, 0.42);
  backdrop-filter: blur(6px);
}

.dashboard-notice-card {
  width: min(440px, 100%);
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 16px;
  align-items: start;
  padding: 22px;
  background: #fff7d8;
  border: 4px solid #1a1a1a;
  border-radius: 18px;
  box-shadow: 10px 10px 0 #1a1a1a;
  color: #1a1a1a;
  animation: dashboard-notice-in 180ms ease-out both;
}

.dashboard-notice-card.success {
  background: #dcffe9;
}

.dashboard-notice-icon {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border: 3px solid #1a1a1a;
  border-radius: 14px;
  background: #ffce4a;
  box-shadow: 4px 4px 0 #1a1a1a;
  font-weight: 900;
  font-size: 24px;
}

.dashboard-notice-card.success .dashboard-notice-icon {
  background: #27c881;
}

.dashboard-notice-copy {
  min-width: 0;
}

.dashboard-notice-kicker {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0;
  text-transform: uppercase;
  color: #5b5b5b;
}

.dashboard-notice-copy h3 {
  margin: 0 0 8px;
  font-size: 24px;
  line-height: 1.05;
}

.dashboard-notice-copy p:last-child {
  margin: 0;
  font-size: 16px;
  line-height: 1.45;
  font-weight: 700;
}

.dashboard-notice-message {
  white-space: pre-line;
}

.dashboard-notice-action {
  grid-column: 1 / -1;
  justify-self: end;
  min-width: 132px;
  padding: 12px 18px;
  border: 3px solid #1a1a1a;
  border-radius: 12px;
  background: #1f6bff;
  color: #ffffff;
  box-shadow: 4px 4px 0 #1a1a1a;
  font: inherit;
  font-weight: 900;
  cursor: pointer;
}

.dashboard-notice-action:hover {
  transform: translate(-1px, -1px);
  box-shadow: 5px 5px 0 #1a1a1a;
}

@keyframes dashboard-notice-in {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (max-width: 520px) {
  .dashboard-notice-card {
    grid-template-columns: 44px 1fr;
    gap: 12px;
    padding: 18px;
    border-radius: 14px;
    box-shadow: 7px 7px 0 #1a1a1a;
  }

  .dashboard-notice-icon {
    width: 42px;
    height: 42px;
    border-radius: 11px;
    font-size: 19px;
  }

  .dashboard-notice-copy h3 {
    font-size: 21px;
  }

  .dashboard-notice-action {
    justify-self: stretch;
  }
}
</style>
