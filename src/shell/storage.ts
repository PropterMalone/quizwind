/**
 * Storage - localStorage wrapper for persisting user data
 * Imperative Shell - handles side effects
 */

import type { UserProgress, GradeLevel } from '../types';

const STORAGE_KEY = 'quizwind_progress';
const GRADE_LEVELS_KEY = 'quizwind_grade_levels';
const ALL_GRADE_LEVELS: GradeLevel[] = ['4-5', '6-8', '9-12'];

export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Save progress to localStorage
 */
export function saveProgress(progressList: UserProgress[]): StorageResult<void> {
  try {
    const serialized = JSON.stringify(progressList);
    localStorage.setItem(STORAGE_KEY, serialized);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save progress',
    };
  }
}

/**
 * Load progress from localStorage
 */
export function loadProgress(): StorageResult<UserProgress[]> {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);

    if (!serialized) {
      return { success: true, data: [] };
    }

    const parsed = JSON.parse(serialized);

    // Convert date strings back to Date objects
    const progressList: UserProgress[] = parsed.map((p: UserProgress) => ({
      ...p,
      lastAttempted: new Date(p.lastAttempted),
    }));

    return { success: true, data: progressList };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load progress',
    };
  }
}

/**
 * Clear all progress from localStorage
 */
export function clearProgress(): StorageResult<void> {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear progress',
    };
  }
}

/**
 * Save enabled grade levels to localStorage
 */
export function saveGradeLevels(levels: GradeLevel[]): StorageResult<void> {
  try {
    localStorage.setItem(GRADE_LEVELS_KEY, JSON.stringify(levels));
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save grade levels',
    };
  }
}

/**
 * Load enabled grade levels from localStorage (defaults to all enabled)
 */
export function loadGradeLevels(): StorageResult<GradeLevel[]> {
  try {
    const serialized = localStorage.getItem(GRADE_LEVELS_KEY);
    if (!serialized) {
      return { success: true, data: [...ALL_GRADE_LEVELS] };
    }
    const parsed: unknown = JSON.parse(serialized);
    if (!Array.isArray(parsed)) {
      return { success: true, data: [...ALL_GRADE_LEVELS] };
    }
    const valid = parsed.filter((v): v is GradeLevel => v === '4-5' || v === '6-8' || v === '9-12');
    return { success: true, data: valid.length > 0 ? valid : [...ALL_GRADE_LEVELS] };
  } catch {
    return { success: true, data: [...ALL_GRADE_LEVELS] };
  }
}

/**
 * Check if localStorage is available
 */
export function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}
