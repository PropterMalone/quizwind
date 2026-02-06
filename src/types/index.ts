/**
 * Type definitions for QuizWind application
 */

export type GradeLevel = '4-5' | '6-8';
export type AnswerOption = 'a' | 'b' | 'c' | 'd';
export type MasteryLevel = 'new' | 'learning' | 'mastered';
export type QuizMode = 'quiz' | 'flashcard' | 'timed';

export interface Question {
  id: string;
  gradeLevel: GradeLevel;
  question: string;
  options: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  correctAnswer: AnswerOption;
  explanation?: string;
  topic?: string;
}

export interface UserProgress {
  questionId: string;
  attempts: number;
  correctCount: number;
  incorrectCount: number;
  lastAttempted: Date;
  mastery: MasteryLevel;
}

export interface QuizSession {
  mode: QuizMode;
  questionsAnswered: number;
  correctAnswers: number;
  timeElapsed: number;
  score: number;
  startTime: Date;
}

export interface QuizState {
  currentQuestion: Question | null;
  questionIndex: number;
  selectedAnswer: AnswerOption | null;
  isAnswered: boolean;
  session: QuizSession;
}

export interface TimerConfig {
  duration: number; // seconds
  onTick?: (remaining: number) => void;
  onComplete?: () => void;
}

export interface ProgressStats {
  totalQuestions: number;
  newQuestions: number;
  learningQuestions: number;
  masteredQuestions: number;
  overallAccuracy: number;
  topicBreakdown: Map<string, { correct: number; total: number }>;
}
