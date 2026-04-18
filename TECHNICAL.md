# 🛠️ QUIZZERIA — Technical Reference

> Developer documentation covering architecture, state management, API, deployment, and all implemented features.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Tech Stack](#tech-stack)
3. [Quick Start](#quick-start)
4. [Environment Variables](#environment-variables)
5. [Frontend Architecture](#frontend-architecture)
6. [GameContext — State Management](#gamecontext--state-management)
7. [Backend API Reference](#backend-api-reference)
8. [Pages & Components](#pages--components)
9. [Feature Implementation Log](#feature-implementation-log)
10. [Animations System](#animations-system)
11. [Save / Persistence System](#save--persistence-system)
12. [Admin Panel](#admin-panel)
13. [Deployment](#deployment)
14. [Adding Questions](#adding-questions)

---

## Project Structure

```
Quizzeria_V01/
├── backend/
│   ├── main.py                  FastAPI entry point
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── render.yaml
│   └── app/
│       ├── routers/
│       │   ├── r01.py           Round 01 — Category Clash endpoints
│       │   ├── r02.py           Round 02 — Visual Vault
│       │   ├── r03.py           Round 03 — Wild Card
│       │   ├── r04.py           Round 04 — Buzzer Battle
│       │   ├── r05.py           Round 05 — Agni Pariksha
│       │   ├── r07.py           Round 07 — Decode Zone
│       │   └── r08.py           Round 08 — Final Frontier
│       └── data/                Question JSON files per round
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── nginx.conf               Nginx config for production Docker build
│   ├── .env.example
│   ├── public/
│   │   └── assets/
│   │       ├── Round_02/        Shadow images (Gods, Animals, Flags, etc.)
│   │       └── Round_07/        Emoji decode images (Actors, Cricketers, Songs)
│   └── src/
│       ├── App.jsx              Root — phase router + idle screensaver
│       ├── main.jsx             ReactDOM entry
│       ├── context/
│       │   └── GameContext.jsx  All global game state + save/load
│       ├── pages/               One file per screen/round
│       ├── components/
│       │   └── common/
│       │       ├── AdminPanel.jsx
│       │       ├── ScoreBar.jsx
│       │       ├── SaveButton.jsx
│       │       ├── QuestionSidebar.jsx
│       │       ├── BilingualText.jsx
│       │       └── ThemeToggle.jsx
│       └── styles/
│           ├── global.css       Base styles, score-bar, glass-card
│           ├── theme.css        CSS variables
│           └── animations.css   All keyframes
│
├── docker-compose.yml
├── render.yaml
├── README.md                   Quick start & deploy
├── GAME_GUIDE.md               Player & quizmaster guide (this repo)
└── TECHNICAL.md                Developer reference (this file)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | React 18 (Vite) |
| State management | React Context (`GameContext`) |
| Styling | Inline styles + CSS keyframes |
| Backend | FastAPI (Python 3.11+) |
| Question storage | JSON files (flat, no database) |
| Audio | Web Audio API (no external library) |
| Canvas effects | HTML5 Canvas (vanilla, no library) |
| Deployment | Docker + Nginx / Render.com |

---

## Quick Start

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

### Docker (both services together)
```bash
docker compose up --build
# Frontend: http://localhost:80
# Backend:  http://localhost:8000
```

---

## Environment Variables

### Frontend (`frontend/.env`)
```env
VITE_API_BASE=http://localhost:8000
```

For production, set `VITE_API_BASE` to your deployed backend URL.

### Backend
No env vars required for basic operation. FastAPI CORS is configured to allow all origins in development.

---

## Frontend Architecture

### Phase-Based Routing (`App.jsx`)

The app uses a string `phase` value stored in `GameContext` to determine which page renders. There is no React Router — `App.jsx` is a simple switch:

```jsx
const map = {
  landing, teamEntry, toss, roundSelect, roundIntro, rules,
  round01Rules, categorySelect, questionPlay,
  round02Play … round08Play, winner, halftime
}
return map[phase] ?? <LandingPage />
```

### Idle Screensaver (`App.jsx`)
A global 90-second idle timer runs in App.jsx. Any user interaction (`mousemove`, `mousedown`, `keydown`, `touchstart`, `scroll`, `click`) resets the timer. After 90s of inactivity, `<IdleScreensaver>` renders as a fixed overlay with a breathing letter animation.

---

## GameContext — State Management

**File:** `src/context/GameContext.jsx`

All game state lives here. Accessed via `useGame()` hook in any component.

### State Variables

| Variable | Type | Description |
|----------|------|-------------|
| `teams` | `{ team1, team2 }` | Team names |
| `scores` | `{ team1, team2 }` | Current scores (integers) |
| `tossWinner` | `1 \| 2 \| null` | Which team won the toss |
| `currentRound` | `number` | Active round number (1–8) |
| `currentCategory` | `object \| null` | Active R01 category object |
| `categoryIndex` | `number` | Index of current category (for turn order) |
| `questionIndex` | `number` | Current question index within category/round |
| `completedQuestions` | `Set<number>` | Questions answered in current session |
| `completedCategories` | `Set<string>` | R01 category IDs completed |
| `completedRounds` | `Set<number>` | Round numbers fully completed |
| `completedR02Cats` | `Set<string>` | R02 sub-categories completed |
| `completedR03Cats` | `Set<string>` | R03 sub-categories completed |
| `answerProgress` | `object` | `{ 'r01_gk': [0,1,2,...] }` — answered Q indices per key |
| `streaks` | `{ team1, team2 }` | Current consecutive correct count per team |
| `onFire` | `{ team1, team2 }` | Whether each team is on a 3+ streak right now |
| `peakStreaks` | `{ team1, team2 }` | Highest streak reached per team (for Trophy Room) |
| `phase` | `string` | Current page/screen |

### Key Functions

| Function | Description |
|----------|-------------|
| `addScore(team, pts)` | Add (or subtract) points for team 1 or 2 |
| `recordCorrect(team)` | Increment streak, check fire threshold, update peakStreaks |
| `recordWrong(team)` | Reset streak for that team |
| `startNewCategory(cat, catIdx)` | Set currentCategory, reset Q index, go to questionPlay |
| `finishCategory(catId)` | Mark category done, increment catIndex, go to categorySelect |
| `cancelCategory()` | Abandon current category, return to categorySelect |
| `nextQuestion()` | Mark current Q done, advance index |
| `markQuestionDone(idx)` | Add to completedQuestions set |
| `markAnswered(key, idx)` | Persist answered Q index to answerProgress |
| `getAnswered(key)` | Retrieve answered Q indices for a key |
| `markRoundDone(roundNum)` | Add to completedRounds |
| `saveGame(...)` | Snapshot all state to localStorage as `qz-save` |
| `loadSavedGame()` | Restore from `qz-save`, navigate to roundSelect |
| `resetGame()` | Clear all localStorage, reset all state to defaults |
| `categoryStartTeam(catIdx)` | Returns which team (1 or 2) picks first for a category |
| `teamForQuestion(qIdx, catIdx)` | Returns which team answers a given question |

### Persistence (localStorage Keys)

| Key | Content |
|-----|---------|
| `qz-teams` | Team names JSON |
| `qz-scores` | Scores JSON |
| `qz-toss` | Toss winner (1 or 2) |
| `qz-round` | Current round number |
| `qz-cats` | Completed R01 category IDs array |
| `qz-rounds` | Completed round numbers array |
| `qz-r02cats` | Completed R02 sub-cat IDs array |
| `qz-r03cats` | Completed R03 sub-cat IDs array |
| `qz-progress` | Answer progress object |
| `qz-save` | Full save snapshot (manual save) |

---

## Backend API Reference

Base URL: `http://localhost:8000` (dev) or your Render/Docker URL (prod)

### Round 01 — Category Clash

| Method | Endpoint | Response |
|--------|----------|----------|
| `GET` | `/r01/categories` | `{ categories: [{ id, count }] }` |
| `GET` | `/r01/questions/{category_id}` | `{ questions: [{ question_en, question_kn, options_en, options_kn, answer }] }` |
| `GET` | `/r01/hint/{category_id}/{q_index}` | `{ hint_en, hint_kn }` |

### Round 02 — Visual Vault

| Method | Endpoint | Response |
|--------|----------|----------|
| `GET` | `/r02/categories` | Sub-category list |
| `GET` | `/r02/questions/{category}` | Questions with image paths |

### Round 03 — Wild Card

| Method | Endpoint | Response |
|--------|----------|----------|
| `GET` | `/r03/categories` | Sub-category list |
| `GET` | `/r03/questions/{category}` | Questions per sub-cat |

### Round 04 — Buzzer Battle

| Method | Endpoint | Response |
|--------|----------|----------|
| `GET` | `/r04/questions` | `{ questions: [...] }` — 50 MCQ |

### Round 05 — Agni Pariksha

| Method | Endpoint | Response |
|--------|----------|----------|
| `GET` | `/r05/questions` | 20 questions per team |

### Round 07 — Decode Zone

| Method | Endpoint | Response |
|--------|----------|----------|
| `GET` | `/r07/categories` | Sub-category list |
| `GET` | `/r07/questions/{category}` | Questions with image paths |

### Round 08 — Final Frontier

| Method | Endpoint | Response |
|--------|----------|----------|
| `GET` | `/r08/questions` | Boss questions with hint fields |

### Question Object Shape (Round 01)
```json
{
  "question_en": "What is the capital of Karnataka?",
  "question_kn": "ಕರ್ನಾಟಕದ ರಾಜಧಾನಿ ಯಾವುದು?",
  "options_en": ["Mysuru", "Bengaluru", "Hubli", "Mangaluru"],
  "options_kn": ["ಮೈಸೂರು", "ಬೆಂಗಳೂರು", "ಹುಬ್ಬಳ್ಳಿ", "ಮಂಗಳೂರು"],
  "answer": 1
}
```
`answer` is a 0-based index into `options_en`.

---

## Pages & Components

### Pages (`src/pages/`)

| File | Phase Key | Description |
|------|-----------|-------------|
| `LandingPage.jsx` | `landing` | Start screen, Continue/New Game |
| `TeamEntryPage.jsx` | `teamEntry` | Enter team names |
| `TossPage.jsx` | `toss` | Coin flip animation |
| `RoundSelectPage.jsx` | `roundSelect` | 8-round grid, fanfare on completion |
| `RoundIntroPage.jsx` | `roundIntro` | Cinematic round entrance with particles |
| `RulesPage.jsx` | `rules` / `round01Rules` | Round rules display |
| `CategorySelectPage.jsx` | `categorySelect` | R01 10-category grid with drama |
| `QuestionPlayPage.jsx` | `questionPlay` | R01 question engine |
| `Round02PlayPage.jsx` | `round02Play` | Visual Vault gameplay |
| `Round03PlayPage.jsx` | `round03Play` | Wild Card gameplay |
| `Round04PlayPage.jsx` | `round04Play` | Buzzer Battle gameplay |
| `Round05PlayPage.jsx` | `round05Play` | Agni Pariksha gameplay |
| `Round06PlayPage.jsx` | `round06Play` | Pen & Power timer |
| `Round07PlayPage.jsx` | `round07Play` | Decode Zone gameplay |
| `Round08PlayPage.jsx` | `round08Play` | Final Frontier gameplay |
| `WinnerPage.jsx` | `winner` | Drum roll + confetti + Trophy Room |
| `HalftimePage.jsx` | `halftime` | Mid-game leaderboard (after R4) |
| `SubRoundLandingPage.jsx` | *(internal)* | Cinematic intro for R01 categories |

### Common Components (`src/components/common/`)

| File | Description |
|------|-------------|
| `AdminPanel.jsx` | Quizmaster overlay (Ctrl+Shift+A) |
| `ScoreBar.jsx` | Fixed top bar: scores, streaks, milestones |
| `SaveButton.jsx` | 💾 Save Game button with confirmation |
| `QuestionSidebar.jsx` | Left sidebar showing Q completion in R01/R04 |
| `BilingualText.jsx` | EN + KN text display component |
| `ThemeToggle.jsx` | Light/dark theme switch |

---

## Feature Implementation Log

All features added in v7 (grouped by delivery):

### Group A — Timer & Reveal
| Feature | Files Changed | Description |
|---------|--------------|-------------|
| Countdown Heartbeat | `QuestionPlayPage.jsx`, `animations.css` | Last 5s: tick sound via Web Audio API + pulsing red SVG ring |
| Question Reveal Animation | `QuestionPlayPage.jsx`, `animations.css` | Question card slides up + blur-to-clear on every new question |

### Group B — Category Drama & Streaks
| Feature | Files Changed | Description |
|---------|--------------|-------------|
| Category Colour Wash | `CategorySelectPage.jsx` | BG radial gradient shifts to category accent on selection |
| Category Reveal Drama | `CategorySelectPage.jsx`, `animations.css` | 9 cards flip face-down (staggered 80ms); selected card glows + scales |
| Streak Indicator | `GameContext.jsx`, `ScoreBar.jsx`, `QuestionPlayPage.jsx` | 3+ correct → 🔥 On Fire! banner on ScoreBar for 3.5s |
| Score Milestone | `ScoreBar.jsx`, `animations.css` | Mini canvas confetti burst + tag at 100/200/300 pts |

### Group C — Milestones & Fanfare
| Feature | Files Changed | Description |
|---------|--------------|-------------|
| Round Completion Fanfare | `RoundSelectPage.jsx` | Shard explosion canvas on any round completion |
| Halftime Summary | `HalftimePage.jsx`, `App.jsx` | Full leaderboard + stat bars auto-shown after Round 4 |

### Group D — Polish & Trophy
| Feature | Files Changed | Description |
|---------|--------------|-------------|
| Idle Mode Screensaver | `App.jsx`, `animations.css` | 90s inactivity → breathing QUIZZERIA logo overlay |
| Trophy Room | `WinnerPage.jsx`, `GameContext.jsx` | Streak, closeness, categories, rounds, score bar stats |
| Round Intro Particles | `RoundIntroPage.jsx` | 80-particle explosion on name reveal + expanding glow ring |

### Admin Panel Upgrade
| Feature | Files Changed | Description |
|---------|--------------|-------------|
| Larger, Centred Panel | `AdminPanel.jsx` | 720px max-width, 4 tabs (Scores/Rounds/Navigate/System), live scoreboard strip |

---

## Animations System

All keyframes live in `src/styles/animations.css`. Components apply them via inline `animation:` style properties.

### Core Animations
| Keyframe | Used In |
|----------|---------|
| `fadeUp` | Buttons, CTAs appearing |
| `fadeIn` / `scaleIn` | Page transitions |
| `letterDrop` | Landing page logo |
| `r1BounceUp` … `r8Left/r8Right` | Round name entrances (8 unique) |
| `timerPulse` / `timerDanger` | Timer ring when active/low |

### v7 Additions
| Keyframe | Used In |
|----------|---------|
| `timerHeartbeat` | Timer ring last 5 seconds |
| `questionReveal` | Question card entrance |
| `questionTextSlide` | EN/KN text staggered slide |
| `fireBanner` | 🔥 On Fire! banner pop |
| `milestoneTag` | Score milestone tag fade |
| `cardFlipOut` | Category card flip-down |
| `idleFadeIn` | Screensaver overlay |
| `idleBreathe` | QUIZZERIA letters breathing |

### Web Audio
Tick sounds in the countdown heartbeat are generated on-the-fly via `window.AudioContext` — no audio files needed. The drum roll on the Winner Screen also uses Web Audio synthesis.

---

## Save / Persistence System

### Auto-persistence
Every piece of state in GameContext has a `useEffect` that writes to localStorage on every change. This means navigating away and back preserves state automatically.

### Manual Save (`qz-save`)
The 💾 Save Game button calls `saveGame()` which takes a full snapshot. This is what `loadSavedGame()` restores from. It includes:
- Team names and scores
- Toss winner
- Current round
- All completed categories and rounds
- Full `answerProgress` object (answered Q indices per category key)

### Save Key Schema (`qz-save`)
```json
{
  "savedAt": "2025-01-15T14:32:00.000Z",
  "teams": { "team1": "Bengaluru Brainiacs", "team2": "Mysuru Mavens" },
  "scores": { "team1": 340, "team2": 280 },
  "toss": 1,
  "round": 4,
  "cats": ["gk", "karnataka", "science"],
  "rounds": [1, 2, 3],
  "r02cats": ["gods"],
  "r03cats": [],
  "progress": {
    "r01_gk": [0, 2, 4, 6, 8],
    "r01_karnataka": [0, 1, 3]
  }
}
```

---

## Admin Panel

**Trigger:** `Ctrl + Shift + A` (Windows/Linux) or `Cmd + Shift + A` (Mac)
**Close:** `Escape` or click outside

The panel renders as a fixed overlay at `z-index: 9001`, centred with `transform: translate(-50%, -50%)`. A backdrop at `z-index: 9000` dims the content behind it.

### Tabs

#### 📊 Scores
- Live score strip at top (always visible)
- Quick adjustment buttons: −50 −20 −10 −5 +5 +10 +20 +50 +100
- Custom input accepts any integer; Enter key or Apply button triggers `addScore(team, n)`
- Toast notification confirms every action

#### 🏆 Rounds
- Grid of all 8 rounds with name + completion status
- Click any incomplete round → `markRoundDone(r)`
- Cannot un-complete a round via UI (use System → Reset for full clear)

#### 🗺️ Navigate
- Direct `setPhase()` jump to any screen
- Available screens: Landing, Team Entry, Toss, Round Select, Category Select, Halftime, Winner, Rules

#### ⚙️ System
- Full Reset: calls `resetGame()` — clears all localStorage and state
- Session Info: read-only display of teams, scores, rounds done

---

## Deployment

### Render.com (recommended for free hosting)

1. Push project to a GitHub repo
2. Go to [render.com](https://render.com) → New → Blueprint
3. Connect your repo — it reads `render.yaml`
4. Two services are created automatically:
   - `quizzeria-api` → backend on `https://quizzeria-api.onrender.com`
   - `quizzeria-frontend` → frontend on `https://quizzeria-frontend.onrender.com`
5. After first deploy, update `VITE_API_BASE` in `render.yaml` to your actual backend URL, then redeploy frontend

### Docker

```bash
docker compose up --build
# Frontend: http://localhost:80
# Backend:  http://localhost:8000
```

The frontend Dockerfile uses Nginx to serve the built Vite output. `nginx.conf` handles SPA routing (all paths → `index.html`).

---

## Adding Questions

Questions are stored as JSON in `backend/app/data/`. Each round has its own folder structure.

### Round 01 Question Format

File: `backend/app/data/r01/{category_id}.json`

```json
[
  {
    "question_en": "English question text",
    "question_kn": "ಕನ್ನಡ ಪ್ರಶ್ನೆ",
    "options_en": ["Option A", "Option B", "Option C", "Option D"],
    "options_kn": ["ಆಯ್ಕೆ ಎ", "ಆಯ್ಕೆ ಬಿ", "ಆಯ್ಕೆ ಸಿ", "ಆಯ್ಕೆ ಡಿ"],
    "answer": 0,
    "hint_en": "Optional English hint",
    "hint_kn": "ಐಚ್ಛಿಕ ಕನ್ನಡ 힌트"
  }
]
```

- `answer` is a **0-based index** into `options_en`/`options_kn`
- `hint_en` / `hint_kn` are optional — used when the quizmaster clicks "Show Hint"
- Valid `category_id` values: `gk`, `karnataka`, `science`, `technology`, `sports`, `geography`, `history`, `food_culture`, `ramayana`, `mahabharata`

### Category IDs Reference

| Category ID | Display Name |
|-------------|-------------|
| `gk` | Sarvagna (General Knowledge) |
| `karnataka` | Namma Nadu (Karnataka) |
| `science` | Einstein's Corner |
| `technology` | Tech Titans |
| `sports` | Arena (Sports & Cricket) |
| `geography` | Terra Firma |
| `history` | Itihaas |
| `food_culture` | Ruchi & Sanskriti |
| `ramayana` | Raama Katha |
| `mahabharata` | Kurukshetra |
