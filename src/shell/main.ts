/**
 * Main application - Complete version with all modes
 */

import { requireElement } from './dom';
import { loadProgress, saveProgress, clearProgress } from './storage';
import { selectQuestions, createSession, updateSession, checkAnswer } from '../core/quiz-engine';
import {
  renderQuestion,
  showFeedback,
  updateScore,
  markAnswer,
  enableNextButton,
  disableNextButton,
  setupQuizView,
} from '../components/quiz-view';
import {
  renderFlashcard,
  setupFlashcard,
  updateFlashcardButtons,
} from '../components/flashcard-view';
import { renderProgressStats, setupProgressView } from '../components/progress-view';
import { createProgress, updateProgress, calculateStats } from '../core/progress-tracker';
import type { Question, QuizSession, AnswerOption, UserProgress } from '../types';
import questionsData from '../data/questions.json';

// Application state
let currentQuestions: Question[] = [];
let currentQuestionIndex = 0;
let currentSession: QuizSession | null = null;
let userProgress: Map<string, UserProgress> = new Map();
let isAnswered = false;
let flashcardIndex = 0;

function init(): void {
  loadUserProgress();
  setupNavigation();
  startQuizMode();
}

function loadUserProgress(): void {
  const result = loadProgress();
  if (result.success && result.data) {
    result.data.forEach((progress) => {
      userProgress.set(progress.questionId, progress);
    });
  }
}

function saveUserProgress(): void {
  const progressList = Array.from(userProgress.values());
  saveProgress(progressList);
}

function setupNavigation(): void {
  const navButtons = document.querySelectorAll('.nav-button');
  const views = document.querySelectorAll('.view');

  navButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const mode = (button as HTMLElement).dataset.mode;

      navButtons.forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');

      views.forEach((view) => view.classList.remove('active'));

      switch (mode) {
        case 'quiz':
          requireElement('quizView').classList.add('active');
          startQuizMode();
          break;
        case 'flashcard':
          requireElement('flashcardView').classList.add('active');
          startFlashcardMode();
          break;
        case 'timed':
          requireElement('timedView').classList.add('active');
          startTimedMode();
          break;
        case 'progress':
          requireElement('progressView').classList.add('active');
          startProgressView();
          break;
      }
    });
  });
}

// QUIZ MODE
function startQuizMode(): void {
  currentQuestions = selectQuestions(questionsData as Question[], {
    mode: 'quiz',
    gradeLevel: '6-8',
    questionCount: 10,
  });

  currentQuestionIndex = 0;
  currentSession = createSession('quiz');
  isAnswered = false;

  setupQuizView({
    onAnswerSelected: handleAnswerSelected,
    onNextQuestion: handleNextQuestion,
  });

  renderCurrentQuestion();
  updateScore(currentSession);
}

function renderCurrentQuestion(): void {
  const question = currentQuestions[currentQuestionIndex];
  if (!question) {
    showQuizComplete();
    return;
  }

  renderQuestion(question, currentQuestionIndex + 1, currentQuestions.length);
  disableNextButton();

  const feedbackContainer = requireElement('feedbackContainer');
  feedbackContainer.classList.add('hidden');

  isAnswered = false;
}

function handleAnswerSelected(answer: AnswerOption): void {
  if (isAnswered) return;

  const question = currentQuestions[currentQuestionIndex];
  const isCorrect = checkAnswer(question, answer);

  isAnswered = true;

  markAnswer(answer, question.correctAnswer);
  showFeedback(isCorrect, question.correctAnswer);

  if (currentSession) {
    currentSession = updateSession(currentSession, isCorrect, 0);
    updateScore(currentSession);
  }

  const progress = userProgress.get(question.id) || createProgress(question.id);
  const updatedProgress = updateProgress(progress, isCorrect);
  userProgress.set(question.id, updatedProgress);
  saveUserProgress();

  enableNextButton();
}

function handleNextQuestion(): void {
  if (!isAnswered) return;

  currentQuestionIndex++;
  renderCurrentQuestion();
}

function showQuizComplete(): void {
  if (!currentSession) return;

  const questionCard = requireElement('questionCard');
  const feedbackContainer = requireElement('feedbackContainer');
  const nextButton = requireElement<HTMLButtonElement>('nextButton');

  feedbackContainer.classList.add('hidden');

  questionCard.innerHTML = `
    <div style="text-align: center; padding: 2rem;">
      <h2 style="font-size: 2rem; margin-bottom: 1rem;">🎉 Quiz Complete!</h2>
      <p style="font-size: 1.5rem; margin-bottom: 1rem;">
        Your Score: <strong>${currentSession.score}</strong>
      </p>
      <p style="font-size: 1.2rem; color: var(--color-text-secondary);">
        ${currentSession.correctAnswers} out of ${currentSession.questionsAnswered} correct
      </p>
    </div>
  `;

  nextButton.textContent = 'Start New Quiz';
  nextButton.disabled = false;
  nextButton.onclick = () => {
    nextButton.textContent = 'Next Question';
    startQuizMode();
  };
}

// FLASHCARD MODE
function startFlashcardMode(): void {
  currentQuestions = selectQuestions(questionsData as Question[], {
    mode: 'flashcard',
    gradeLevel: '6-8',
  });

  flashcardIndex = 0;

  setupFlashcard({
    onKnowIt: handleFlashcardKnowIt,
    onNeedReview: handleFlashcardNeedReview,
    onNext: handleFlashcardNext,
    onPrevious: handleFlashcardPrevious,
  });

  renderCurrentFlashcard();
}

function renderCurrentFlashcard(): void {
  const question = currentQuestions[flashcardIndex];
  if (!question) return;

  renderFlashcard(question, flashcardIndex, currentQuestions.length);
  updateFlashcardButtons(flashcardIndex, currentQuestions.length);
}

function handleFlashcardKnowIt(): void {
  const question = currentQuestions[flashcardIndex];
  const progress = userProgress.get(question.id) || createProgress(question.id);
  const updatedProgress = updateProgress(progress, true);
  userProgress.set(question.id, updatedProgress);
  saveUserProgress();

  if (flashcardIndex < currentQuestions.length - 1) {
    flashcardIndex++;
    renderCurrentFlashcard();
  }
}

function handleFlashcardNeedReview(): void {
  const question = currentQuestions[flashcardIndex];
  const progress = userProgress.get(question.id) || createProgress(question.id);
  const updatedProgress = updateProgress(progress, false);
  userProgress.set(question.id, updatedProgress);
  saveUserProgress();

  if (flashcardIndex < currentQuestions.length - 1) {
    flashcardIndex++;
    renderCurrentFlashcard();
  }
}

function handleFlashcardNext(): void {
  if (flashcardIndex < currentQuestions.length - 1) {
    flashcardIndex++;
    renderCurrentFlashcard();
  }
}

function handleFlashcardPrevious(): void {
  if (flashcardIndex > 0) {
    flashcardIndex--;
    renderCurrentFlashcard();
  }
}

// TIMED MODE (Basic implementation)
function startTimedMode(): void {
  const startButton = requireElement<HTMLButtonElement>('timedStartButton');
  startButton.textContent = 'Coming Soon - Timed Quiz';
  startButton.disabled = true;
}

// PROGRESS VIEW
function startProgressView(): void {
  const stats = calculateStats(Array.from(userProgress.values()), questionsData as Question[]);

  renderProgressStats(stats);

  setupProgressView(() => {
    clearProgress();
    userProgress.clear();
    loadUserProgress();
    startProgressView();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
