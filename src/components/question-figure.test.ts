import { describe, it, expect } from 'vitest';
import { createQuestionFigure } from './question-figure';
import type { Question } from '../types';

const baseQuestion: Question = {
  id: 'q1',
  gradeLevel: '6-8',
  question: 'Test question?',
  options: { a: 'A', b: 'B', c: 'C', d: 'D' },
  correctAnswer: 'a',
  topic: 'wind',
};

describe('createQuestionFigure', () => {
  it('returns null when question has no figureUrl', () => {
    expect(createQuestionFigure(baseQuestion)).toBeNull();
  });

  it('returns null when figureUrl is empty string', () => {
    expect(createQuestionFigure({ ...baseQuestion, figureUrl: '' })).toBeNull();
  });

  it('returns a div with correct class when figureUrl is present', () => {
    const result = createQuestionFigure({
      ...baseQuestion,
      figureUrl: '/figures/test.png',
    });

    expect(result).not.toBeNull();
    expect(result!.tagName).toBe('DIV');
    expect(result!.className).toBe('question-figure');
  });

  it('contains an img with correct src and loading attribute', () => {
    const result = createQuestionFigure({
      ...baseQuestion,
      figureUrl: '/figures/turbine-diagram.png',
    });

    const img = result!.querySelector('img');
    expect(img).not.toBeNull();
    expect(img!.src).toContain('/figures/turbine-diagram.png');
    expect(img!.loading).toBe('lazy');
  });

  it('sets alt text from question text', () => {
    const result = createQuestionFigure({
      ...baseQuestion,
      question: 'What part is labeled C?',
      figureUrl: '/figures/turbine-diagram.png',
    });

    const img = result!.querySelector('img');
    expect(img!.alt).toBe('Figure for: What part is labeled C?');
  });
});
