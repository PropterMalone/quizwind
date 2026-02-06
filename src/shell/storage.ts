/**
 * Storage - localStorage wrapper for persisting user data
 * Imperative Shell - handles side effects
 */

import type { UserProgress } from '../types';

const STORAGE_KEY = 'quizwind_progress';

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
