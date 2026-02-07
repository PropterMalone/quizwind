/**
 * Quiz View - Multiple choice quiz UI component
 */

import type { Question, AnswerOption, QuizSession } from '../types';
import { requireElement, clearElement, createElement } from '../shell/dom';

export interface QuizViewCallbacks {
  onAnswerSelected: (answer: AnswerOption) => void;
  onNextQuestion: () => void;
}

export function renderQuestion(question: Question, questionNumber: number, total: number): void {
  const questionText = requireElement<HTMLParagraphElement>('questionText');
  const questionCounter = requireElement<HTMLSpanElement>('questionCounter');
  const optionsContainer = requireElement<HTMLDivElement>('optionsContainer');

  questionText.textContent = question.question;
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

export function showFeedback(isCorrect: boolean, correctAnswer: AnswerOption): void {
  const feedbackContainer = requireElement<HTMLDivElement>('feedbackContainer');
  const feedbackMessage = requireElement<HTMLDivElement>('feedbackMessage');

  feedbackContainer.classList.remove('hidden', 'correct', 'incorrect');
  feedbackContainer.classList.add(isCorrect ? 'correct' : 'incorrect');

  if (isCorrect) {
    feedbackMessage.textContent = '✓ Correct! Great job!';
  } else {
    feedbackMessage.textContent = `✗ Incorrect. The correct answer was ${correctAnswer.toUpperCase()}.`;
  }
}

export function updateScore(session: QuizSession): void {
  const scoreElement = requireElement<HTMLSpanElement>('quizScore');
  scoreElement.textContent = `Score: ${session.score}`;
}

export function markAnswer(selectedAnswer: AnswerOption, correctAnswer: AnswerOption): void {
  const optionsContainer = requireElement<HTMLDivElement>('optionsContainer');
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

export function enableNextButton(): void {
  const nextButton = requireElement<HTMLButtonElement>('nextButton');
  nextButton.disabled = false;
}

export function disableNextButton(): void {
  const nextButton = requireElement<HTMLButtonElement>('nextButton');
  nextButton.disabled = true;
}

export function setupQuizView(callbacks: QuizViewCallbacks): () => void {
  const optionsContainer = requireElement<HTMLDivElement>('optionsContainer');
  const nextButton = requireElement<HTMLButtonElement>('nextButton');

  const handleOptionClick = (event: Event) => {
    const target = event.target as HTMLButtonElement;
    if (target.classList.contains('option-button') && !target.disabled) {
      const answer = target.dataset.answer as AnswerOption;
      callbacks.onAnswerSelected(answer);
    }
  };

  const handleNextClick = () => {
    callbacks.onNextQuestion();
  };

  optionsContainer.addEventListener('click', handleOptionClick);
  nextButton.addEventListener('click', handleNextClick);

  return () => {
    optionsContainer.removeEventListener('click', handleOptionClick);
    nextButton.removeEventListener('click', handleNextClick);
  };
}
