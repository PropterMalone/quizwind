# QuizWind

**Target Audience**: 6th grade students preparing for KidWind competitions
**Tech Stack**: TypeScript + Vite + Chart.js
**Deployment**: Cloudflare Pages

## Architecture

**Pattern**: Functional Core, Imperative Shell (FCIS)
- **Core** (`src/core/`): Pure functions, no side effects, 100% testable
- **Shell** (`src/shell/`): DOM, localStorage, audio - side effects isolated
- **Components** (`src/components/`): UI rendering logic

## Features

1. **Multiple Choice Quiz**: Immediate feedback, score tracking
2. **Flashcard Mode**: Flip cards, self-assessment (know it / review)
3. **Timed Practice**: Quiz bowl style with countdown, time-based scoring
4. **Progress Dashboard**: Charts, mastery levels, topic breakdown

## Data

**Source**: `questions.json` - Parsed from KidWind Quizbowl Bank PDF
**Storage**: localStorage for user progress
**Levels**: Grades 4-5, 6-8 (focus on 6-8 for target audience)

## Visual Design

**Theme**: Wind energy (sky blue, turbine white, energetic green)
**Animations**: Card flips, transitions, confetti for achievements
**Audio**: Correct/incorrect sounds, timer beep, achievement chime
**Responsive**: Mobile-first, large touch targets (44x44px min)

## Development

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (localhost:3000)
npm run validate     # Format → Lint → Type-check → Test
npm run build        # Production build
npm run preview      # Preview production build
```

## Testing

- **Framework**: Vitest + happy-dom
- **Coverage**: >95% target (excludes main.ts, test files)
- **Pattern**: Colocated tests (`foo.ts` → `foo.test.ts`)

## Type Definitions

```typescript
interface Question {
  id: string;
  gradeLevel: '4-5' | '6-8';
  question: string;
  options: { a: string; b: string; c: string; d: string };
  correctAnswer: 'a' | 'b' | 'c' | 'd';
  explanation?: string;
  topic?: string;
}

interface UserProgress {
  questionId: string;
  attempts: number;
  correctCount: number;
  lastAttempted: Date;
  mastery: 'new' | 'learning' | 'mastered';
}
```

## Standards

- Conventional commits (`feat:`, `fix:`, `test:`, etc.)
- Strict TypeScript mode
- No external API calls (static data)
- Error handling: return errors, don't throw for expected failures
