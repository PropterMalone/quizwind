/**
 * Quiz Engine - Pure business logic for quiz functionality
 * Functional Core - no side effects
 */

import type { Question, AnswerOption, QuizSession, QuizMode } from '../types';

export interface QuizConfig {
  mode: QuizMode;
  gradeLevel?: '4-5' | '6-8' | '9-12' | 'all';
  topic?: string;
  questionCount?: number;
}

/**
 * Select questions based on configuration
 */
export function selectQuestions(allQuestions: Question[], config: QuizConfig): Question[] {
  let filtered = [...allQuestions];

  // Filter by grade level
  if (config.gradeLevel && config.gradeLevel !== 'all') {
    filtered = filtered.filter((q) => q.gradeLevel === config.gradeLevel);
  }

  // Filter by topic
  if (config.topic) {
    filtered = filtered.filter((q) => q.topic === config.topic);
  }

  // Shuffle questions
  const shuffled = shuffleArray(filtered);

  // Limit to requested count
  const count = config.questionCount || shuffled.length;
  return shuffled.slice(0, count);
}

/**
 * Check if answer is correct
 */
export function checkAnswer(question: Question, answer: AnswerOption): boolean {
  return question.correctAnswer === answer;
}

/**
 * Calculate score for a session
 */
export function calculateScore(
  correctAnswers: number,
  totalQuestions: number,
  timeElapsed: number,
  mode: QuizMode
): number {
  const baseScore = (correctAnswers / totalQuestions) * 100;

  // Add time bonus for timed mode
  if (mode === 'timed') {
    // Bonus points for answering quickly (max 20 points)
    const avgTimePerQuestion = timeElapsed / totalQuestions;
    const timeBonus = Math.max(0, 20 - avgTimePerQuestion);
    return Math.round(baseScore + timeBonus);
  }

  return Math.round(baseScore);
}

/**
 * Create a new quiz session
 */
export function createSession(mode: QuizMode): QuizSession {
  return {
    mode,
    questionsAnswered: 0,
    correctAnswers: 0,
    timeElapsed: 0,
    score: 0,
    startTime: new Date(),
  };
}

/**
 * Update session after answering a question
 */
export function updateSession(
  session: QuizSession,
  isCorrect: boolean,
  timeTaken: number
): QuizSession {
  const newSession: QuizSession = {
    ...session,
    questionsAnswered: session.questionsAnswered + 1,
    correctAnswers: session.correctAnswers + (isCorrect ? 1 : 0),
    timeElapsed: session.timeElapsed + timeTaken,
  };

  // Recalculate score
  newSession.score = calculateScore(
    newSession.correctAnswers,
    newSession.questionsAnswered,
    newSession.timeElapsed,
    newSession.mode
  );

  return newSession;
}

/**
 * Get next question from list
 */
export function getNextQuestion(questions: Question[], currentIndex: number): Question | null {
  if (currentIndex >= questions.length) {
    return null;
  }
  return questions[currentIndex];
}

/**
 * Check if quiz is complete
 */
export function isQuizComplete(currentIndex: number, totalQuestions: number): boolean {
  return currentIndex >= totalQuestions;
}

/**
 * Fisher-Yates shuffle algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Extract unique topics from questions
 */
export function getTopics(questions: Question[]): string[] {
  const topics = new Set<string>();
  questions.forEach((q) => {
    if (q.topic) {
      topics.add(q.topic);
    }
  });
  return Array.from(topics).sort();
}

/**
 * Get questions by mastery level preference
 * Returns questions sorted by: new > learning > mastered
 */
export function sortByMasteryPriority(
  questions: Question[],
  progressMap: Map<string, 'new' | 'learning' | 'mastered'>
): Question[] {
  const priority = { new: 0, learning: 1, mastered: 2 };

  return [...questions].sort((a, b) => {
    const aMastery = progressMap.get(a.id) || 'new';
    const bMastery = progressMap.get(b.id) || 'new';
    return priority[aMastery] - priority[bMastery];
  });
}
