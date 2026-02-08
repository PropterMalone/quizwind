/**
 * Main application entry point
 * Coordinates all components and manages application state
 */

import { requireElement } from './dom';
import { loadProgress, saveProgress } from './storage';
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
import { createProgress, updateProgress } from '../core/progress-tracker';
import type { Question, QuizSession, AnswerOption, UserProgress } from '../types';

// Import questions
import questionsData from '../data/questions.json';

// Application state
let currentQuestions: Question[] = [];
let currentQuestionIndex = 0;
let currentSession: QuizSession | null = null;
let userProgress: Map<string, UserProgress> = new Map();
let isAnswered = false;

/**
 * Initialize the application
 */
function init(): void {
  loadUserProgress();
  setupNavigation();
  startQuizMode();
}

/**
 * Load user progress from storage
 */
function loadUserProgress(): void {
  const result = loadProgress();
  if (result.success && result.data) {
    result.data.forEach((progress) => {
      userProgress.set(progress.questionId, progress);
    });
  }
}

/**
 * Save user progress to storage
 */
function saveUserProgress(): void {
  const progressList = Array.from(userProgress.values());
  saveProgress(progressList);
}

/**
 * Setup mode navigation
 */
function setupNavigation(): void {
  const navButtons = document.querySelectorAll('.nav-button');
  const views = document.querySelectorAll('.view');

  navButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const mode = (button as HTMLElement).dataset.mode;

      // Update active button
      navButtons.forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');

      // Update active view
      views.forEach((view) => view.classList.remove('active'));

      switch (mode) {
        case 'quiz':
          requireElement('quizView').classList.add('active');
          startQuizMode();
          break;
        case 'flashcard':
          requireElement('flashcardView').classList.add('active');
          // TODO: Initialize flashcard mode
          break;
        case 'timed':
          requireElement('timedView').classList.add('active');
          // TODO: Initialize timed mode
          break;
        case 'progress':
          requireElement('progressView').classList.add('active');
          // TODO: Initialize progress view
          break;
      }
    });
  });
}

/**
 * Start quiz mode
 */
function startQuizMode(): void {
  // Select questions for quiz (grade 6-8, 10 questions)
  currentQuestions = selectQuestions(questionsData as Question[], {
    mode: 'quiz',
    enabledGradeLevels: ['6-8'],
    questionCount: 10,
  });

  currentQuestionIndex = 0;
  currentSession = createSession('quiz');
  isAnswered = false;

  // Setup event listeners
  setupQuizView({
    onAnswerSelected: handleAnswerSelected,
    onNextQuestion: handleNextQuestion,
  });

  // Render first question
  renderCurrentQuestion();
  updateScore(currentSession);
}

/**
 * Render the current question
 */
function renderCurrentQuestion(): void {
  const question = currentQuestions[currentQuestionIndex];
  if (!question) {
    showQuizComplete();
    return;
  }

  renderQuestion(question, currentQuestionIndex + 1, currentQuestions.length);
  disableNextButton();

  // Hide feedback
  const feedbackContainer = requireElement('feedbackContainer');
  feedbackContainer.classList.add('hidden');

  isAnswered = false;
}

/**
 * Handle answer selection
 */
function handleAnswerSelected(answer: AnswerOption): void {
  if (isAnswered) return;

  const question = currentQuestions[currentQuestionIndex];
  const isCorrect = checkAnswer(question, answer);

  isAnswered = true;

  // Mark the answer visually
  markAnswer(answer, question.correctAnswer);

  // Show feedback
  showFeedback(isCorrect, question.correctAnswer);

  // Update session
  if (currentSession) {
    currentSession = updateSession(currentSession, isCorrect, 0);
    updateScore(currentSession);
  }

  // Update user progress
  const progress = userProgress.get(question.id) || createProgress(question.id);
  const updatedProgress = updateProgress(progress, isCorrect);
  userProgress.set(question.id, updatedProgress);
  saveUserProgress();

  // Enable next button
  enableNextButton();
}

/**
 * Handle next question
 */
function handleNextQuestion(): void {
  if (!isAnswered) return;

  currentQuestionIndex++;
  renderCurrentQuestion();
}

/**
 * Show quiz complete screen
 */
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

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
