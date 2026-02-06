import { describe, it, expect } from 'vitest';
import {
  createProgress,
  updateProgress,
  calculateMastery,
  calculateStats,
  getQuestionsNeedingReview,
  getWeakestTopics,
  resetProgress,
  resetAllProgress,
} from './progress-tracker';
import type { UserProgress, Question, ProgressStats } from '../types';

describe('progress-tracker', () => {
  describe('createProgress', () => {
    it('should create initial progress with zero counts', () => {
      const progress = createProgress('q1');
      expect(progress).toMatchObject({
        questionId: 'q1',
        attempts: 0,
        correctCount: 0,
        incorrectCount: 0,
        mastery: 'new',
      });
      expect(progress.lastAttempted).toBeInstanceOf(Date);
    });
  });

  describe('updateProgress', () => {
    it('should increment attempts', () => {
      const progress = createProgress('q1');
      const updated = updateProgress(progress, true);
      expect(updated.attempts).toBe(1);
    });

    it('should increment correctCount when answer is correct', () => {
      const progress = createProgress('q1');
      const updated = updateProgress(progress, true);
      expect(updated.correctCount).toBe(1);
      expect(updated.incorrectCount).toBe(0);
    });

    it('should increment incorrectCount when answer is incorrect', () => {
      const progress = createProgress('q1');
      const updated = updateProgress(progress, false);
      expect(updated.correctCount).toBe(0);
      expect(updated.incorrectCount).toBe(1);
    });

    it('should update lastAttempted', () => {
      const progress = createProgress('q1');
      const originalTime = progress.lastAttempted;
      setTimeout(() => {
        const updated = updateProgress(progress, true);
        expect(updated.lastAttempted.getTime()).toBeGreaterThanOrEqual(originalTime.getTime());
      }, 10);
    });

    it('should recalculate mastery level', () => {
      let progress = createProgress('q1');
      progress = updateProgress(progress, true);
      progress = updateProgress(progress, true);
      progress = updateProgress(progress, true);
      progress = updateProgress(progress, true);
      progress = updateProgress(progress, true);
      expect(progress.mastery).toBe('mastered');
    });

    it('should not mutate original progress', () => {
      const progress = createProgress('q1');
      const original = { ...progress };
      updateProgress(progress, true);
      expect(progress.attempts).toBe(original.attempts);
    });
  });

  describe('calculateMastery', () => {
    it('should return "new" for < 3 attempts', () => {
      const progress: UserProgress = {
        questionId: 'q1',
        attempts: 2,
        correctCount: 2,
        incorrectCount: 0,
        lastAttempted: new Date(),
        mastery: 'new',
      };
      expect(calculateMastery(progress)).toBe('new');
    });

    it('should return "learning" for 3+ attempts with < 80% accuracy', () => {
      const progress: UserProgress = {
        questionId: 'q1',
        attempts: 5,
        correctCount: 3,
        incorrectCount: 2,
        lastAttempted: new Date(),
        mastery: 'learning',
      };
      expect(calculateMastery(progress)).toBe('learning');
    });

    it('should return "mastered" for 5+ attempts with >= 80% accuracy', () => {
      const progress: UserProgress = {
        questionId: 'q1',
        attempts: 5,
        correctCount: 4,
        incorrectCount: 1,
        lastAttempted: new Date(),
        mastery: 'mastered',
      };
      expect(calculateMastery(progress)).toBe('mastered');
    });

    it('should not return "mastered" if attempts < 5 even with 100% accuracy', () => {
      const progress: UserProgress = {
        questionId: 'q1',
        attempts: 4,
        correctCount: 4,
        incorrectCount: 0,
        lastAttempted: new Date(),
        mastery: 'learning',
      };
      expect(calculateMastery(progress)).toBe('learning');
    });
  });

  describe('calculateStats', () => {
    const mockQuestions: Question[] = [
      {
        id: 'q1',
        gradeLevel: '6-8',
        question: 'Q1',
        options: { a: 'A', b: 'B', c: 'C', d: 'D' },
        correctAnswer: 'a',
        topic: 'wind',
      },
      {
        id: 'q2',
        gradeLevel: '6-8',
        question: 'Q2',
        options: { a: 'A', b: 'B', c: 'C', d: 'D' },
        correctAnswer: 'b',
        topic: 'solar',
      },
      {
        id: 'q3',
        gradeLevel: '6-8',
        question: 'Q3',
        options: { a: 'A', b: 'B', c: 'C', d: 'D' },
        correctAnswer: 'c',
        topic: 'wind',
      },
    ];

    it('should count new questions correctly', () => {
      const progressList: UserProgress[] = [
        { ...createProgress('q1'), attempts: 1, correctCount: 1, incorrectCount: 0 },
      ];

      const stats = calculateStats(progressList, mockQuestions);
      expect(stats.newQuestions).toBe(3); // q1 has <3 attempts, q2 and q3 not attempted
    });

    it('should count learning questions correctly', () => {
      const progressList: UserProgress[] = [
        {
          ...createProgress('q1'),
          attempts: 5,
          correctCount: 3,
          incorrectCount: 2,
          mastery: 'learning',
        },
      ];

      const stats = calculateStats(progressList, mockQuestions);
      expect(stats.learningQuestions).toBe(1);
    });

    it('should count mastered questions correctly', () => {
      const progressList: UserProgress[] = [
        {
          ...createProgress('q1'),
          attempts: 5,
          correctCount: 5,
          incorrectCount: 0,
          mastery: 'mastered',
        },
      ];

      const stats = calculateStats(progressList, mockQuestions);
      expect(stats.masteredQuestions).toBe(1);
    });

    it('should calculate overall accuracy', () => {
      const progressList: UserProgress[] = [
        {
          ...createProgress('q1'),
          attempts: 10,
          correctCount: 8,
          incorrectCount: 2,
          mastery: 'mastered',
        },
      ];

      const stats = calculateStats(progressList, mockQuestions);
      expect(stats.overallAccuracy).toBe(0.8);
    });

    it('should calculate topic breakdown', () => {
      const progressList: UserProgress[] = [
        {
          ...createProgress('q1'),
          attempts: 5,
          correctCount: 4,
          incorrectCount: 1,
          mastery: 'mastered',
        },
        {
          ...createProgress('q3'),
          attempts: 5,
          correctCount: 3,
          incorrectCount: 2,
          mastery: 'learning',
        },
      ];

      const stats = calculateStats(progressList, mockQuestions);
      const windStats = stats.topicBreakdown.get('wind');
      expect(windStats).toEqual({ correct: 7, total: 10 });
    });
  });

  describe('getQuestionsNeedingReview', () => {
    const mockQuestions: Question[] = [
      {
        id: 'q1',
        gradeLevel: '6-8',
        question: 'Q1',
        options: { a: 'A', b: 'B', c: 'C', d: 'D' },
        correctAnswer: 'a',
      },
      {
        id: 'q2',
        gradeLevel: '6-8',
        question: 'Q2',
        options: { a: 'A', b: 'B', c: 'C', d: 'D' },
        correctAnswer: 'b',
      },
      {
        id: 'q3',
        gradeLevel: '6-8',
        question: 'Q3',
        options: { a: 'A', b: 'B', c: 'C', d: 'D' },
        correctAnswer: 'c',
      },
    ];

    it('should return questions not yet mastered', () => {
      const progressList: UserProgress[] = [
        {
          ...createProgress('q1'),
          attempts: 5,
          correctCount: 5,
          incorrectCount: 0,
          mastery: 'mastered',
        },
        {
          ...createProgress('q2'),
          attempts: 3,
          correctCount: 2,
          incorrectCount: 1,
          mastery: 'learning',
        },
      ];

      const needReview = getQuestionsNeedingReview(mockQuestions, progressList);
      expect(needReview).toHaveLength(2);
      expect(needReview.map((q) => q.id)).toEqual(['q2', 'q3']);
    });

    it('should return all questions if none attempted', () => {
      const needReview = getQuestionsNeedingReview(mockQuestions, []);
      expect(needReview).toHaveLength(3);
    });
  });

  describe('getWeakestTopics', () => {
    it('should return topics sorted by lowest accuracy', () => {
      const stats: ProgressStats = {
        totalQuestions: 10,
        newQuestions: 2,
        learningQuestions: 3,
        masteredQuestions: 5,
        overallAccuracy: 0.75,
        topicBreakdown: new Map([
          ['wind', { correct: 8, total: 10 }], // 80%
          ['solar', { correct: 3, total: 10 }], // 30%
          ['energy', { correct: 5, total: 10 }], // 50%
        ]),
      };

      const weakest = getWeakestTopics(stats, 2);
      expect(weakest).toEqual(['solar', 'energy']);
    });

    it('should exclude topics with no attempts', () => {
      const stats: ProgressStats = {
        totalQuestions: 10,
        newQuestions: 5,
        learningQuestions: 5,
        masteredQuestions: 0,
        overallAccuracy: 0.5,
        topicBreakdown: new Map([
          ['wind', { correct: 5, total: 10 }],
          ['solar', { correct: 0, total: 0 }], // No attempts
        ]),
      };

      const weakest = getWeakestTopics(stats);
      expect(weakest).toEqual(['wind']);
    });
  });

  describe('resetProgress', () => {
    it('should reset progress to initial state', () => {
      const progress: UserProgress = {
        questionId: 'q1',
        attempts: 10,
        correctCount: 8,
        incorrectCount: 2,
        lastAttempted: new Date('2024-01-01'),
        mastery: 'mastered',
      };

      const reset = resetProgress(progress);
      expect(reset).toMatchObject({
        questionId: 'q1',
        attempts: 0,
        correctCount: 0,
        incorrectCount: 0,
        mastery: 'new',
      });
    });
  });

  describe('resetAllProgress', () => {
    it('should reset all progress records', () => {
      const progressList: UserProgress[] = [
        {
          questionId: 'q1',
          attempts: 5,
          correctCount: 4,
          incorrectCount: 1,
          lastAttempted: new Date(),
          mastery: 'mastered',
        },
        {
          questionId: 'q2',
          attempts: 3,
          correctCount: 2,
          incorrectCount: 1,
          lastAttempted: new Date(),
          mastery: 'learning',
        },
      ];

      const reset = resetAllProgress(progressList);
      expect(reset).toHaveLength(2);
      expect(reset.every((p) => p.attempts === 0 && p.mastery === 'new')).toBe(true);
    });
  });
});
