import re

with open("src/App.vue", "r") as f:
    content = f.read()

# 1. Add validation logic before nextStep
validation_logic = """
const isStepFinished = (stepId) => {
  if (courseData[stepId]?.videoId) {
    if (!videoWatchedStatus.value[stepId]) return false;
  }
  
  const stepQuizzes = courseData[stepId]?.quizzes;
  if (stepQuizzes && stepQuizzes.length > 0) {
    for (let quiz of stepQuizzes) {
      for (let q of quiz.questions) {
        if (!q.qid) continue;
        const ans = studentProgress.value[`${q.qid}_Ans`];
        if (ans === undefined || ans === null || ans === '') return false;
      }
    }
  }
  return true;
};

const goToStep = (step) => {
  if (step <= currentStep.value) {
    currentStep.value = step;
    return;
  }
  for (let i = 1; i < step; i++) {
    if (!isStepFinished(i)) {
      alert(`Mohon selesaikan video dan kuis/tugas di Modul ${i} terlebih dahulu.`);
      return;
    }
  }
  currentStep.value = step;
};

const nextStep = () => {
  if (!isStepFinished(currentStep.value)) {
    alert(`Mohon selesaikan video dan kuis/tugas di modul ini terlebih dahulu.`);
    return;
  }
"""

content = content.replace("const nextStep = () => {", validation_logic)

# 2. Fix the tabs in HTML
content = re.sub(r'@click="currentStep = (\d+)"', r'@click="goToStep(\1)"', content)

# 3. Replace the navigation buttons
nav_old = """        <div class="navigation">
          <button class="nav-button secondary" id="prevButton" type="button" disabled>
            <span aria-hidden="true">←</span> Sebelumnya
          </button>
          <button class="nav-button primary" id="nextButton" type="button" disabled>
            Lanjut ke video 2 <span aria-hidden="true">→</span>
          </button>
        </div>"""

nav_new = """        <div class="nav-buttons">
          <button class="nav-button secondary" type="button" :disabled="currentStep === 1" @click="prevStep()">
            ← Modul Sebelumnya
          </button>
          <button class="nav-button primary" type="button" :disabled="currentStep === 7" @click="nextStep()">
            Modul Berikutnya →
          </button>
        </div>"""

content = content.replace(nav_old, nav_new)

with open("src/App.vue", "w") as f:
    f.write(content)
