/**
 * Timed View - Timed quiz UI component
 * Follows the same pattern as quiz-view.ts
 */

import type { Question, AnswerOption, QuizSession } from '../types';
import { requireElement, clearElement, createElement } from '../shell/dom';

export interface TimedViewCallbacks {
  onAnswerSelected: (answer: AnswerOption) => void;
  onStartQuiz: () => void;
}

export function renderTimedQuestion(
  question: Question,
  questionNumber: number,
  total: number
): void {
  const questionText = requireElement<HTMLParagraphElement>('timedQuestionText');
  const questionCounter = requireElement<HTMLSpanElement>('timedCounter');
  const optionsContainer = requireElement<HTMLDivElement>('timedOptionsContainer');
  const questionCard = requireElement<HTMLDivElement>('timedQuestionCard');

  // Ensure question card is visible (not replaced by completion screen)
  questionText.textContent = question.question;
  questionCard.style.display = '';
  questionCounter.innerHTML = `Question ${questionNumber} of ${total} <span class="grade-badge grade-${question.gradeLevel}">Gr ${question.gradeLevel}</span>`;

  clearElement(optionsContainer);

  const options: Array<[AnswerOption, string]> = [
    ['a', question.options.a],
    ['b', question.options.b],
    ['c', question.options.c],
    ['d', question.options.d],
  ];

  options.forEach(([key, text]) => {
    const button = createElement('button', {
      className: 'option-button',
      textContent: `${key.toUpperCase()}. ${text}`,
    });
    button.dataset.answer = key;
    optionsContainer.appendChild(button);
  });
}

export function updateTimerDisplay(remaining: number): void {
  const timerValue = requireElement<HTMLSpanElement>('timerValue');
  const timerDisplay = requireElement<HTMLDivElement>('timerDisplay');

  timerValue.textContent = String(remaining);

  // Color transitions: green (>5s) → yellow (3-5s) → red (<=3s)
  timerDisplay.classList.remove('warning', 'danger');
  if (remaining <= 3) {
    timerDisplay.classList.add('danger');
  } else if (remaining <= 5) {
    timerDisplay.classList.add('warning');
  }
}

export function showTimedFeedback(isCorrect: boolean, correctAnswer: AnswerOption): void {
  const feedbackContainer = requireElement<HTMLDivElement>('timedFeedbackContainer');
  const feedbackMessage = requireElement<HTMLDivElement>('timedFeedbackMessage');

  feedbackContainer.classList.remove('hidden', 'correct', 'incorrect');
  feedbackContainer.classList.add(isCorrect ? 'correct' : 'incorrect');

  if (isCorrect) {
    feedbackMessage.textContent = 'Correct! Great job!';
  } else {
    feedbackMessage.textContent = `Incorrect. The correct answer was ${correctAnswer.toUpperCase()}.`;
  }
}

export function showTimedTimeout(correctAnswer: AnswerOption): void {
  const feedbackContainer = requireElement<HTMLDivElement>('timedFeedbackContainer');
  const feedbackMessage = requireElement<HTMLDivElement>('timedFeedbackMessage');

  feedbackContainer.classList.remove('hidden', 'correct', 'incorrect');
  feedbackContainer.classList.add('incorrect');

  feedbackMessage.textContent = `Time's up! The correct answer was ${correctAnswer.toUpperCase()}.`;
}

export function markTimedAnswer(selectedAnswer: AnswerOption, correctAnswer: AnswerOption): void {
  const optionsContainer = requireElement<HTMLDivElement>('timedOptionsContainer');
  const buttons = optionsContainer.querySelectorAll('.option-button');

  buttons.forEach((button) => {
    const btn = button as HTMLButtonElement;
    const answer = btn.dataset.answer as AnswerOption;

    btn.disabled = true;

    if (answer === selectedAnswer) {
      btn.classList.add('selected');
      btn.classList.add(answer === correctAnswer ? 'correct' : 'incorrect');
    }

    if (answer === correctAnswer) {
      btn.classList.add('correct');
    }
  });
}

export function disableTimedOptions(): void {
  const optionsContainer = requireElement<HTMLDivElement>('timedOptionsContainer');
  const buttons = optionsContainer.querySelectorAll('.option-button');

  buttons.forEach((button) => {
    (button as HTMLButtonElement).disabled = true;
  });
}

export function updateTimedScore(session: QuizSession): void {
  const scoreElement = requireElement<HTMLSpanElement>('timedScore');
  scoreElement.textContent = `Score: ${session.score}`;
}

export function showTimedComplete(session: QuizSession): void {
  const questionCard = requireElement<HTMLDivElement>('timedQuestionCard');
  const feedbackContainer = requireElement<HTMLDivElement>('timedFeedbackContainer');
  const timerDisplay = requireElement<HTMLDivElement>('timerDisplay');
  const startButton = requireElement<HTMLButtonElement>('timedStartButton');

  feedbackContainer.classList.add('hidden');
  timerDisplay.classList.remove('warning', 'danger');

  const accuracy =
    session.questionsAnswered > 0
      ? Math.round((session.correctAnswers / session.questionsAnswered) * 100)
      : 0;

  questionCard.innerHTML = `
    <div style="text-align: center; padding: 2rem;">
      <h2 style="font-size: 2rem; margin-bottom: 1rem;">Timed Quiz Complete!</h2>
      <p style="font-size: 1.5rem; margin-bottom: 1rem;">
        Your Score: <strong>${session.score}</strong>
      </p>
      <p style="font-size: 1.2rem; color: var(--color-text-secondary); margin-bottom: 0.5rem;">
        ${session.correctAnswers} out of ${session.questionsAnswered} correct (${accuracy}%)
      </p>
      <p style="font-size: 1rem; color: var(--color-text-secondary);">
        Total time: ${session.timeElapsed}s
      </p>
    </div>
  `;

  startButton.textContent = 'Play Again';
  startButton.disabled = false;
}

export function showTimedStart(): void {
  const questionCard = requireElement<HTMLDivElement>('timedQuestionCard');
  const questionText = requireElement<HTMLParagraphElement>('timedQuestionText');
  const optionsContainer = requireElement<HTMLDivElement>('timedOptionsContainer');
  const feedbackContainer = requireElement<HTMLDivElement>('timedFeedbackContainer');
  const timerValue = requireElement<HTMLSpanElement>('timerValue');
  const timerDisplay = requireElement<HTMLDivElement>('timerDisplay');
  const timedCounter = requireElement<HTMLSpanElement>('timedCounter');
  const startButton = requireElement<HTMLButtonElement>('timedStartButton');

  questionCard.style.display = '';
  questionText.textContent = 'Press Start to begin!';
  clearElement(optionsContainer);
  feedbackContainer.classList.add('hidden');
  timerValue.textContent = '15';
  timerDisplay.classList.remove('warning', 'danger');
  timedCounter.textContent = 'Question 1 of 10';
  startButton.textContent = 'Start Timed Quiz';
  startButton.disabled = false;
}

export function setupTimedView(callbacks: TimedViewCallbacks): () => void {
  const optionsContainer = requireElement<HTMLDivElement>('timedOptionsContainer');
  const startButton = requireElement<HTMLButtonElement>('timedStartButton');

  const handleOptionClick = (event: Event) => {
    const target = event.target as HTMLButtonElement;
    if (target.classList.contains('option-button') && !target.disabled) {
      const answer = target.dataset.answer as AnswerOption;
      callbacks.onAnswerSelected(answer);
    }
  };

  const handleStartClick = () => {
    callbacks.onStartQuiz();
  };

  optionsContainer.addEventListener('click', handleOptionClick);
  startButton.addEventListener('click', handleStartClick);

  return () => {
    optionsContainer.removeEventListener('click', handleOptionClick);
    startButton.removeEventListener('click', handleStartClick);
  };
}
