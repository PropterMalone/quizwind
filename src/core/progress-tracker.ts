/**
 * Progress Tracker - Pure functions for tracking user progress
 * Functional Core - no side effects
 */

import type { UserProgress, MasteryLevel, ProgressStats, Question } from '../types';

/**
 * Create initial progress for a question
 */
export function createProgress(questionId: string): UserProgress {
  return {
    questionId,
    attempts: 0,
    correctCount: 0,
    incorrectCount: 0,
    lastAttempted: new Date(),
    mastery: 'new',
  };
}

/**
 * Update progress after answering a question
 */
export function updateProgress(progress: UserProgress, isCorrect: boolean): UserProgress {
  const newProgress: UserProgress = {
    ...progress,
    attempts: progress.attempts + 1,
    correctCount: progress.correctCount + (isCorrect ? 1 : 0),
    incorrectCount: progress.incorrectCount + (isCorrect ? 0 : 1),
    lastAttempted: new Date(),
    mastery: progress.mastery,
  };

  // Update mastery level based on performance
  newProgress.mastery = calculateMastery(newProgress);

  return newProgress;
}

/**
 * Calculate mastery level based on performance
 *
 * Rules:
 * - new: Never attempted or < 3 attempts
 * - learning: 3+ attempts, accuracy < 80%
 * - mastered: 5+ attempts, accuracy >= 80%
 */
export function calculateMastery(progress: UserProgress): MasteryLevel {
  if (progress.attempts < 3) {
    return 'new';
  }

  const accuracy = progress.correctCount / progress.attempts;

  if (progress.attempts >= 5 && accuracy >= 0.8) {
    return 'mastered';
  }

  return 'learning';
}

/**
 * Calculate overall statistics from progress records
 */
export function calculateStats(
  progressList: UserProgress[],
  allQuestions: Question[]
): ProgressStats {
  const progressMap = new Map(progressList.map((p) => [p.questionId, p]));

  let newCount = 0;
  let learningCount = 0;
  let masteredCount = 0;
  let totalCorrect = 0;
  let totalAttempts = 0;

  const topicBreakdown = new Map<string, { correct: number; total: number }>();

  allQuestions.forEach((question) => {
    const progress = progressMap.get(question.id);

    if (!progress) {
      newCount++;
    } else {
      switch (progress.mastery) {
        case 'new':
          newCount++;
          break;
        case 'learning':
          learningCount++;
          break;
        case 'mastered':
          masteredCount++;
          break;
      }

      totalCorrect += progress.correctCount;
      totalAttempts += progress.attempts;

      // Track topic stats
      if (question.topic) {
        const current = topicBreakdown.get(question.topic) || { correct: 0, total: 0 };
        topicBreakdown.set(question.topic, {
          correct: current.correct + progress.correctCount,
          total: current.total + progress.attempts,
        });
      }
    }
  });

  const overallAccuracy = totalAttempts > 0 ? totalCorrect / totalAttempts : 0;

  return {
    totalQuestions: allQuestions.length,
    newQuestions: newCount,
    learningQuestions: learningCount,
    masteredQuestions: masteredCount,
    overallAccuracy,
    topicBreakdown,
  };
}

/**
 * Get questions that need review (not mastered)
 */
export function getQuestionsNeedingReview(
  allQuestions: Question[],
  progressList: UserProgress[]
): Question[] {
  const progressMap = new Map(progressList.map((p) => [p.questionId, p]));

  return allQuestions.filter((q) => {
    const progress = progressMap.get(q.id);
    return !progress || progress.mastery !== 'mastered';
  });
}

/**
 * Get weakest topics (lowest accuracy)
 */
export function getWeakestTopics(stats: ProgressStats, limit: number = 3): string[] {
  const topics = Array.from(stats.topicBreakdown.entries())
    .map(([topic, { correct, total }]) => ({
      topic,
      accuracy: total > 0 ? correct / total : 0,
      total,
    }))
    .filter((t) => t.total > 0) // Only include topics with attempts
    .sort((a, b) => a.accuracy - b.accuracy); // Sort by accuracy (lowest first)

  return topics.slice(0, limit).map((t) => t.topic);
}

/**
 * Reset progress for a specific question
 */
export function resetProgress(progress: UserProgress): UserProgress {
  return createProgress(progress.questionId);
}

/**
 * Reset all progress
 */
export function resetAllProgress(progressList: UserProgress[]): UserProgress[] {
  return progressList.map((p) => createProgress(p.questionId));
}
