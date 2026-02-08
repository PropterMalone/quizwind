import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveProgress,
  loadProgress,
  clearProgress,
  isStorageAvailable,
  saveGradeLevels,
  loadGradeLevels,
} from './storage';
import type { UserProgress } from '../types';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('isStorageAvailable', () => {
    it('should return true in test environment', () => {
      expect(isStorageAvailable()).toBe(true);
    });
  });

  describe('saveProgress', () => {
    it('should save progress to localStorage', () => {
      const progress: UserProgress[] = [
        {
          questionId: 'q1',
          attempts: 5,
          correctCount: 4,
          incorrectCount: 1,
          lastAttempted: new Date('2024-01-01'),
          mastery: 'mastered',
        },
      ];

      const result = saveProgress(progress);
      expect(result.success).toBe(true);

      const stored = localStorage.getItem('quizwind_progress');
      expect(stored).toBeTruthy();
    });

    it('should return success result on successful save', () => {
      const result = saveProgress([]);
      expect(result).toEqual({ success: true });
    });
  });

  describe('loadProgress', () => {
    it('should load progress from localStorage', () => {
      const progress: UserProgress[] = [
        {
          questionId: 'q1',
          attempts: 5,
          correctCount: 4,
          incorrectCount: 1,
          lastAttempted: new Date('2024-01-01'),
          mastery: 'mastered',
        },
      ];

      saveProgress(progress);
      const result = loadProgress();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].questionId).toBe('q1');
    });

    it('should convert date strings back to Date objects', () => {
      const progress: UserProgress[] = [
        {
          questionId: 'q1',
          attempts: 1,
          correctCount: 1,
          incorrectCount: 0,
          lastAttempted: new Date('2024-01-01'),
          mastery: 'new',
        },
      ];

      saveProgress(progress);
      const result = loadProgress();

      expect(result.data![0].lastAttempted).toBeInstanceOf(Date);
    });

    it('should return empty array when no data exists', () => {
      const result = loadProgress();
      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should return error result on invalid JSON', () => {
      localStorage.setItem('quizwind_progress', 'invalid json');
      const result = loadProgress();
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('saveGradeLevels', () => {
    it('should save grade levels to localStorage', () => {
      const result = saveGradeLevels(['4-5', '6-8']);
      expect(result.success).toBe(true);
      expect(localStorage.getItem('quizwind_grade_levels')).toBe('["4-5","6-8"]');
    });
  });

  describe('loadGradeLevels', () => {
    it('should return all levels when nothing saved', () => {
      const result = loadGradeLevels();
      expect(result.success).toBe(true);
      expect(result.data).toEqual(['4-5', '6-8', '9-12']);
    });

    it('should load saved levels', () => {
      saveGradeLevels(['6-8']);
      const result = loadGradeLevels();
      expect(result.data).toEqual(['6-8']);
    });

    it('should filter out invalid values', () => {
      localStorage.setItem('quizwind_grade_levels', '["6-8","bogus","4-5"]');
      const result = loadGradeLevels();
      expect(result.data).toEqual(['6-8', '4-5']);
    });

    it('should default to all levels on invalid JSON', () => {
      localStorage.setItem('quizwind_grade_levels', 'not json');
      const result = loadGradeLevels();
      expect(result.data).toEqual(['4-5', '6-8', '9-12']);
    });

    it('should default to all levels when stored array is empty after filtering', () => {
      localStorage.setItem('quizwind_grade_levels', '["invalid"]');
      const result = loadGradeLevels();
      expect(result.data).toEqual(['4-5', '6-8', '9-12']);
    });
  });

  describe('clearProgress', () => {
    it('should remove progress from localStorage', () => {
      const progress: UserProgress[] = [
        {
          questionId: 'q1',
          attempts: 1,
          correctCount: 1,
          incorrectCount: 0,
          lastAttempted: new Date(),
          mastery: 'new',
        },
      ];

      saveProgress(progress);
      expect(localStorage.getItem('quizwind_progress')).toBeTruthy();

      clearProgress();
      expect(localStorage.getItem('quizwind_progress')).toBeNull();
    });

    it('should return success result', () => {
      const result = clearProgress();
      expect(result.success).toBe(true);
    });
  });
});
