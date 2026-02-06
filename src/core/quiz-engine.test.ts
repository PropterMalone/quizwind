import { describe, it, expect } from 'vitest';
import {
  selectQuestions,
  checkAnswer,
  calculateScore,
  createSession,
  updateSession,
  getNextQuestion,
  isQuizComplete,
  getTopics,
  sortByMasteryPriority,
} from './quiz-engine';
import type { Question } from '../types';

const mockQuestions: Question[] = [
  {
    id: 'q1',
    gradeLevel: '6-8',
    question: 'Test question 1?',
    options: { a: 'A1', b: 'B1', c: 'C1', d: 'D1' },
    correctAnswer: 'a',
    topic: 'wind',
  },
  {
    id: 'q2',
    gradeLevel: '4-5',
    question: 'Test question 2?',
    options: { a: 'A2', b: 'B2', c: 'C2', d: 'D2' },
    correctAnswer: 'b',
    topic: 'solar',
  },
  {
    id: 'q3',
    gradeLevel: '6-8',
    question: 'Test question 3?',
    options: { a: 'A3', b: 'B3', c: 'C3', d: 'D3' },
    correctAnswer: 'c',
    topic: 'wind',
  },
];

describe('quiz-engine', () => {
  describe('selectQuestions', () => {
    it('should return all questions when no filters applied', () => {
      const result = selectQuestions(mockQuestions, { mode: 'quiz' });
      expect(result).toHaveLength(3);
    });

    it('should filter by grade level', () => {
      const result = selectQuestions(mockQuestions, {
        mode: 'quiz',
        gradeLevel: '6-8',
      });
      expect(result).toHaveLength(2);
      expect(result.every((q) => q.gradeLevel === '6-8')).toBe(true);
    });

    it('should filter by topic', () => {
      const result = selectQuestions(mockQuestions, {
        mode: 'quiz',
        topic: 'wind',
      });
      expect(result).toHaveLength(2);
      expect(result.every((q) => q.topic === 'wind')).toBe(true);
    });

    it('should limit to requested count', () => {
      const result = selectQuestions(mockQuestions, {
        mode: 'quiz',
        questionCount: 2,
      });
      expect(result).toHaveLength(2);
    });

    it('should shuffle questions (probabilistic test)', () => {
      // Run multiple times and check if order varies
      const results = Array.from({ length: 10 }, () =>
        selectQuestions(mockQuestions, { mode: 'quiz' })
      );

      // Check that at least one result differs from the first
      const allSameOrder = results.every(
        (result) => result[0].id === results[0][0].id && result[1].id === results[0][1].id
      );

      // With 10 attempts, probability of always getting same order is very low
      expect(allSameOrder).toBe(false);
    });
  });

  describe('checkAnswer', () => {
    it('should return true for correct answer', () => {
      expect(checkAnswer(mockQuestions[0], 'a')).toBe(true);
    });

    it('should return false for incorrect answer', () => {
      expect(checkAnswer(mockQuestions[0], 'b')).toBe(false);
    });
  });

  describe('calculateScore', () => {
    it('should calculate percentage score for non-timed mode', () => {
      const score = calculateScore(8, 10, 120, 'quiz');
      expect(score).toBe(80);
    });

    it('should calculate score with time bonus for timed mode', () => {
      // 10 correct out of 10, 50 seconds total (5s per question)
      const score = calculateScore(10, 10, 50, 'timed');
      expect(score).toBeGreaterThan(100); // 100 base + time bonus
    });

    it('should give higher time bonus for faster answers', () => {
      const fastScore = calculateScore(10, 10, 30, 'timed');
      const slowScore = calculateScore(10, 10, 100, 'timed');
      expect(fastScore).toBeGreaterThan(slowScore);
    });

    it('should round score to nearest integer', () => {
      const score = calculateScore(1, 3, 10, 'quiz');
      expect(score).toBe(33); // 33.333... rounded to 33
    });
  });

  describe('createSession', () => {
    it('should create a new session with initial values', () => {
      const session = createSession('quiz');
      expect(session).toMatchObject({
        mode: 'quiz',
        questionsAnswered: 0,
        correctAnswers: 0,
        timeElapsed: 0,
        score: 0,
      });
      expect(session.startTime).toBeInstanceOf(Date);
    });
  });

  describe('updateSession', () => {
    it('should increment questionsAnswered', () => {
      const session = createSession('quiz');
      const updated = updateSession(session, true, 5);
      expect(updated.questionsAnswered).toBe(1);
    });

    it('should increment correctAnswers when answer is correct', () => {
      const session = createSession('quiz');
      const updated = updateSession(session, true, 5);
      expect(updated.correctAnswers).toBe(1);
    });

    it('should not increment correctAnswers when answer is incorrect', () => {
      const session = createSession('quiz');
      const updated = updateSession(session, false, 5);
      expect(updated.correctAnswers).toBe(0);
    });

    it('should add timeTaken to timeElapsed', () => {
      const session = createSession('quiz');
      const updated = updateSession(session, true, 5);
      expect(updated.timeElapsed).toBe(5);
    });

    it('should recalculate score', () => {
      const session = createSession('quiz');
      const updated = updateSession(session, true, 5);
      expect(updated.score).toBe(100); // 1/1 = 100%
    });

    it('should not mutate original session', () => {
      const session = createSession('quiz');
      const original = { ...session };
      updateSession(session, true, 5);
      expect(session).toEqual(original);
    });
  });

  describe('getNextQuestion', () => {
    it('should return question at current index', () => {
      const question = getNextQuestion(mockQuestions, 0);
      expect(question).toBe(mockQuestions[0]);
    });

    it('should return null when index is out of bounds', () => {
      const question = getNextQuestion(mockQuestions, 10);
      expect(question).toBeNull();
    });
  });

  describe('isQuizComplete', () => {
    it('should return false when more questions remain', () => {
      expect(isQuizComplete(2, 5)).toBe(false);
    });

    it('should return true when all questions answered', () => {
      expect(isQuizComplete(5, 5)).toBe(true);
    });

    it('should return true when index exceeds total', () => {
      expect(isQuizComplete(6, 5)).toBe(true);
    });
  });

  describe('getTopics', () => {
    it('should extract unique topics', () => {
      const topics = getTopics(mockQuestions);
      expect(topics).toEqual(['solar', 'wind']);
    });

    it('should return empty array when no topics', () => {
      const questionsWithoutTopics: Question[] = [
        {
          id: 'q1',
          gradeLevel: '6-8',
          question: 'Test?',
          options: { a: 'A', b: 'B', c: 'C', d: 'D' },
          correctAnswer: 'a',
        },
      ];
      const topics = getTopics(questionsWithoutTopics);
      expect(topics).toEqual([]);
    });
  });

  describe('sortByMasteryPriority', () => {
    it('should prioritize new questions first', () => {
      const progressMap = new Map([
        ['q1', 'mastered' as const],
        ['q2', 'new' as const],
        ['q3', 'learning' as const],
      ]);

      const sorted = sortByMasteryPriority(mockQuestions, progressMap);
      expect(sorted[0].id).toBe('q2'); // new
      expect(sorted[1].id).toBe('q3'); // learning
      expect(sorted[2].id).toBe('q1'); // mastered
    });

    it('should treat questions not in progressMap as new', () => {
      const progressMap = new Map([['q1', 'mastered' as const]]);

      const sorted = sortByMasteryPriority(mockQuestions, progressMap);
      expect(sorted[2].id).toBe('q1'); // mastered should be last
    });
  });
});
