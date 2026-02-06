# QuizWind 🌬️

Interactive quiz webapp to help 6th graders ace the KidWind competition.

## Features

- **Multiple Choice Quiz** - Practice with instant feedback
- **Flashcard Mode** - Flip cards to review concepts
- **Timed Practice** - Quiz bowl style with countdown timer
- **Progress Tracking** - Track mastery with charts and stats

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Development

```bash
npm run dev          # Start dev server at localhost:3000
npm run validate     # Run all checks (format, lint, type-check, tests)
npm run test:ui      # Run tests with UI
npm run test:coverage # Generate coverage report
```

## Data Setup

Extract questions from PDF:

```bash
# Install Python dependencies
pip install pypdf2

# Parse PDF into questions.json
python parse_pdf.py path/to/Quizbowl-Bank.pdf
```

## Tech Stack

- **Language**: TypeScript (strict mode)
- **Build**: Vite
- **Charts**: Chart.js
- **Testing**: Vitest + happy-dom
- **Deployment**: Cloudflare Pages

## Architecture

**Functional Core, Imperative Shell (FCIS)**

- `src/core/` - Pure business logic (testable)
- `src/shell/` - Side effects (DOM, storage, audio)
- `src/components/` - UI rendering

## Project Structure

```
quizwind/
├── src/
│   ├── core/              # Pure functions
│   ├── shell/             # Side effects
│   ├── components/        # UI components
│   ├── data/              # questions.json
│   ├── styles/            # CSS
│   └── types/             # TypeScript types
├── public/
│   ├── index.html
│   ├── sounds/            # Audio files
│   └── assets/            # Images, icons
└── tests/                 # Test files
```

## Standards

- Conventional commits (`feat:`, `fix:`, `test:`, etc.)
- >95% test coverage
- TypeScript strict mode
- ESLint + Prettier

## License

MIT
