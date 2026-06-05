/**
 * Shared figure/image renderer for questions that reference diagrams, charts, or maps.
 */

import type { Question } from '../types';
import { createElement } from '../shell/dom';

/**
 * Creates a figure element for questions with an associated image.
 * Returns null if the question has no figureUrl.
 */
export function createQuestionFigure(question: Question): HTMLDivElement | null {
  if (!question.figureUrl) return null;

  const img = createElement('img');
  img.src = question.figureUrl;
  img.alt = `Figure for: ${question.question}`;
  img.loading = 'lazy';

  const container = createElement('div', { className: 'question-figure' });
  container.appendChild(img);

  return container;
}
