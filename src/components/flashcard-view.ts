/**
 * Flashcard View - Flashcard UI component
 */

import type { Question } from '../types';
import { requireElement } from '../shell/dom';

export interface FlashcardCallbacks {
  onKnowIt: () => void;
  onNeedReview: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

export function renderFlashcard(question: Question, index: number, total: number): void {
  const flashcardQuestion = requireElement<HTMLParagraphElement>('flashcardQuestion');
  const flashcardAnswer = requireElement<HTMLParagraphElement>('flashcardAnswer');
  const flashcardCounter = requireElement<HTMLSpanElement>('flashcardCounter');
  const flashcard = requireElement<HTMLDivElement>('flashcard');

  flashcardQuestion.textContent = question.question;
  flashcardAnswer.textContent = question.options[question.correctAnswer];
  flashcardCounter.textContent = `Card ${index + 1} of ${total}`;

  // Reset flip state
  flashcard.classList.remove('flipped');
}

export function setupFlashcard(callbacks: FlashcardCallbacks): () => void {
  const flashcard = requireElement<HTMLDivElement>('flashcard');
  const knowButton = requireElement<HTMLButtonElement>('flashcardKnow');
  const reviewButton = requireElement<HTMLButtonElement>('flashcardReview');
  const nextButton = requireElement<HTMLButtonElement>('flashcardNext');
  const prevButton = requireElement<HTMLButtonElement>('flashcardPrev');

  const handleFlip = () => {
    flashcard.classList.toggle('flipped');
  };

  flashcard.addEventListener('click', handleFlip);
  knowButton.addEventListener('click', callbacks.onKnowIt);
  reviewButton.addEventListener('click', callbacks.onNeedReview);
  nextButton.addEventListener('click', callbacks.onNext);
  prevButton.addEventListener('click', callbacks.onPrevious);

  return () => {
    flashcard.removeEventListener('click', handleFlip);
    knowButton.removeEventListener('click', callbacks.onKnowIt);
    reviewButton.removeEventListener('click', callbacks.onNeedReview);
    nextButton.removeEventListener('click', callbacks.onNext);
    prevButton.removeEventListener('click', callbacks.onPrevious);
  };
}

export function updateFlashcardButtons(index: number, total: number): void {
  const prevButton = requireElement<HTMLButtonElement>('flashcardPrev');
  const nextButton = requireElement<HTMLButtonElement>('flashcardNext');

  prevButton.disabled = index === 0;
  nextButton.disabled = index >= total - 1;
}
