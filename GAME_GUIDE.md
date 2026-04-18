# 🎯 QUIZZERIA — The Complete Game Guide

> A bilingual (English + Kannada) live quiz experience for 2 teams, 8 rounds, and one glorious winner.

---

## 📖 Table of Contents

1. [What is Quizzeria?](#what-is-quizzeria)
2. [Before You Start](#before-you-start)
3. [The Toss](#the-toss)
4. [The Game Flow](#the-game-flow)
5. [All 8 Rounds — Detailed](#all-8-rounds)
6. [Scoring System](#scoring-system)
7. [Visual Features & Animations](#visual-features--animations)
8. [Save & Continue](#save--continue)
9. [The Halftime Show](#the-halftime-show)
10. [The Winner Screen & Trophy Room](#the-winner-screen--trophy-room)
11. [Tips for Quizmasters](#tips-for-quizmasters)
12. [Admin Panel (Quizmaster Controls)](#admin-panel-quizmaster-controls)

---

## What is Quizzeria?

Quizzeria is a live, host-led quiz game designed for **2 competing teams** played on a single screen (laptop or projector). It features:

- **8 rounds** with completely different formats
- **Bilingual questions** — every question in both English and Kannada
- **Cinematic animations** for every round intro, category reveal, and score change
- **10 categories** in Round 01 alone, each with 30 questions
- A **save/resume** system so a long game can be paused and continued
- A **quizmaster admin panel** for live score corrections

The quizmaster (host) controls the screen. Both teams sit facing the screen and answer questions verbally or by selecting options shown on screen.

---

## Before You Start

### Setup Checklist

- [ ] Backend server is running on port 8000
- [ ] Frontend is open in a browser (full screen recommended)
- [ ] Projector or large screen connected
- [ ] Both team names decided
- [ ] A coin ready (or just use the on-screen toss)

### Starting a Game

1. Open the app — you land on the **Landing Page**
2. If a saved game exists, choose **Continue** or **New Game**
3. **New Game** → enter **Team 1** and **Team 2** names → confirm
4. Proceed to the **Toss**

---

## The Toss

The toss decides which team gets first pick in Round 01 (Category Clash).

- A virtual coin flip animation plays on screen
- The winning team picks the first category in Round 01
- After Round 01, toss advantage alternates every category automatically

---

## The Game Flow

```
Landing Page
    ↓
Team Entry (enter team names)
    ↓
Toss (coin flip)
    ↓
Round Select (choose any of 8 rounds)
    ↓
Round Intro Cinematic (dramatic animated entrance)
    ↓
Rules Page (quick overview of the round's rules)
    ↓
[Round-specific gameplay]
    ↓
Round complete → back to Round Select
    ↓ (after Round 4)
Halftime Summary Screen
    ↓
Continue rounds 5–8
    ↓
Winner Screen → Trophy Room
```

**You can play rounds in any order.** There is no forced sequence after the toss — the quizmaster picks which round to play next from the Round Select grid.

---

## All 8 Rounds — Detailed

---

### Round 01 — Category Clash
**Format:** 10 Categories × 30 Questions (MCQ + Verbal)
**Accent Colour:** Gold

#### How It Works
- The **team whose turn it is** picks one of 10 category cards from the grid
- When a category is selected, the other 9 cards **flip face-down** dramatically and the chosen card zooms in
- A **category intro screen** shows the category name, Kannada name, and tagline
- Questions are asked one by one — alternating between teams each question

#### The 10 Categories

| Icon | English Name | Kannada Name | Subject |
|------|-------------|--------------|---------|
| 🌍 | Sarvagna | ಸರ್ವಜ್ಞ | General Knowledge |
| 🏛️ | Namma Nadu | ನಮ್ಮ ನಾಡು | Karnataka |
| ⚗️ | Einstein's Corner | ಐನ್ಸ್ಟೈನ್ ಕಾರ್ನರ್ | Science |
| 💻 | Tech Titans | ಟೆಕ್ ಟೈಟನ್ಸ್ | Technology |
| 🏏 | Arena | ಆರೀನಾ | Sports & Cricket |
| 🗺️ | Terra Firma | ಟೆರ್ರಾ ಫರ್ಮಾ | Geography |
| 📜 | Itihaas | ಇತಿಹಾಸ | History |
| 🍛 | Ruchi & Sanskriti | ರುಚಿ & ಸಂಸ್ಕೃತಿ | Food & Culture |
| 🏹 | Raama Katha | ರಾಮ ಕಥೆ | Ramayana |
| ⚔️ | Kurukshetra | ಕುರುಕ್ಷೇತ್ರ | Mahabharata |

#### Question Flow (per question)

```
Question appears (slides in dramatically)
    ↓
Primary team answers VERBALLY
    ↓ (Quizmaster judges)
CORRECT → +20 pts for primary team
WRONG   → −10 pts for primary team → PASS to other team
    ↓ (if passed)
Secondary team answers VERBALLY
CORRECT → +5 pts for secondary team
WRONG   → 0 pts (no penalty on pass)
    ↓
OR: "Show Options" → reveals 4 MCQ options, timer starts (30 sec)
MCQ CORRECT → +10 pts (primary) or +5 pts (secondary)
MCQ WRONG   → pass to other team (no penalty)
```

#### Background Colour Wash
When a category is selected, the entire background subtly shifts to that category's accent colour — a gentle radial gradient bloom.

---

### Round 02 — The Visual Vault
**Format:** Picture identification — 5 sub-categories × 20 questions
**Accent Colour:** Blue

- A shadow/partial image is shown
- Teams identify what they see
- A timer starts after the image is revealed
- Sub-categories include Gods, Animals, Flags, etc.

---

### Round 03 — The Wild Card
**Format:** 6 sub-categories with unique question types
**Accent Colour:** Purple

Sub-categories:
- 🗣️ Proverbs
- 🧩 Riddles
- 🔤 Jumbled Words
- 🎵 Song Identification
- 🧠 Smart Questions
- 🌐 Translation Challenges

---

### Round 04 — Buzzer Battle
**Format:** 50 rapid-fire MCQ questions, first to buzz wins each
**Accent Colour:** Red

- Questions scroll fast — both teams compete to buzz
- **−10 pts** for a wrong answer when no options shown
- A sidebar tracks all 50 questions with completion status

---

### Round 05 — Agni Pariksha
**Format:** Rapid fire — 20 questions per team, timed separately
**Accent Colour:** Orange

- Each team gets **10 minutes** to answer their 20 questions
- **+10 pts** per correct answer
- No passing — questions are answered by the assigned team only

---

### Round 06 — Pen & Power
**Format:** Written offline round, 10 minutes
**Accent Colour:** Green

- Both teams write answers on paper simultaneously
- Quizmaster scores manually using the Admin Panel after the round
- The screen shows a 10-minute countdown

---

### Round 07 — Decode Zone
**Format:** Two sub-formats — Sequence Memory & Emoji Decode
**Accent Colour:** Cyan

- **Sequence Memory:** Remember and recall a sequence shown on screen
- **Emoji Decode:** Decode emoji combinations representing people, movies, or phrases

---

### Round 08 — The Final Frontier
**Format:** Boss questions — 2 questions per team, 4 minutes each
**Accent Colour:** Amber

- The hardest questions in the quiz
- Each question gets a full **4-minute timer**
- Teams can request up to 2 hints (−10 pts per hint)
- High stakes — a single question can swing the entire game

---

## Scoring System

| Action | Points |
|--------|--------|
| Verbal correct (primary team) | **+20** |
| Verbal wrong (primary team) | **−10** |
| Pass + verbal correct (secondary) | **+5** |
| Pass + verbal wrong (secondary) | **0** |
| MCQ correct (primary, after options shown) | **+10** |
| MCQ correct (secondary/pass) | **+5** |
| MCQ wrong | **0** (no penalty) |
| Hint used (Round 08) | **−10** |
| Timer runs out (no options shown) | **−10** |
| Timer runs out (options shown) | **0** |

### Streak Bonus (Visual Only)
If a team answers **3 or more questions correctly in a row**, a **🔥 On Fire!** banner flashes on the scorebar. This is a morale indicator — no extra points, just fire.

### Score Milestones
When a team crosses **100, 200, or 300 points**, a **mini confetti burst** fires above their score in the scorebar with a celebratory tag.

---

## Visual Features & Animations

Quizzeria is designed to feel like a TV game show. Here's what you'll see:

### Category Select Screen
- **Colour Wash:** Background subtly shifts to the selected category's accent colour
- **Card Flip Drama:** The 9 unchosen cards flip face-down one by one (staggered 80ms) before the chosen card zooms in
- **Turn Indicator:** Shows which team picks, with a glowing colour dot

### Question Screen
- **Question Reveal:** Every new question slides up and fades in with a blur-to-clear effect
- **Countdown Heartbeat:** In the last 5 seconds, the timer circle pulses red and grows with each tick; a ticking sound plays (louder in the last 3 seconds)
- **Score Floaters:** When points are awarded, +20/+5/+10 floats upward from the scorebar
- **Score Badge:** A gold/green badge shows the awarded points inline on the question card

### Round Intro
- Every round has a **unique animated entrance** for the round name:
  - R1: Bounce up from below (elastic)
  - R2: Zoom in from tiny with blur
  - R3: Slide in from left with overshoot
  - R4: Slam down from top
  - R5: Stretch and settle
  - R6: Elegant fade-in
  - R7: Spin into place
  - R8: Split halves converge
- **Particle explosion** fires when the round name appears
- An expanding ambient glow ring breathes in the background
- A breathing ring animates around the logo

### Round Completion Fanfare
When the last question of a round is answered and you return to Round Select:
- **Shatter effect:** Triangle shards in the round's accent colour explode outward from screen centre
- Screen flashes to black
- The grid **rebuilds** from darkness — like the screen was shattered and reassembled

### Idle Mode (Screensaver)
If there is **no interaction for 90 seconds**, the screen dims and a breathing **QUIZZERIA** logo appears letter by letter with a slow pulse animation. Tap anywhere to wake.

---

## Save & Continue

- Tap the **💾 Save Game** button at any round or category boundary
- The save captures: team names, scores, toss result, completed rounds, completed categories, and answered questions
- On the Landing Page, if a save exists, **Continue Game** appears showing team names and the save date
- Individual question progress within categories is also saved — you can resume mid-category

---

## The Halftime Show

After **Round 4** is completed, the game automatically shows a **Halftime Summary Screen** before returning to Round Select:

- Animated scoreboard with large score reveal
- Trophy/medal emojis based on the current leader
- Dynamic lead indicator ("X leads by Y pts" / "It's all tied up!")
- Stat bars: Rounds completed, Categories done, Score split
- Motivational tagline based on the score gap
- "Continue to Round 5 →" button

---

## The Winner Screen & Trophy Room

After all desired rounds are complete, navigate to the Winner Screen:

1. **Drum Roll** animation plays (~4 seconds) with actual drum sound via Web Audio
2. **Confetti** explodes across the full screen
3. The **winner name** flies in dramatically with a glow
4. Final scores are displayed

### Trophy Room Stats
Below the score, a full game breakdown shows:

| Stat | What It Shows |
|------|---------------|
| 🔥 Longest Streak | Which team had the longest consecutive correct run and how many |
| ⚖️ Contest | Whether it was "Razor close", "Close contest", or "Decisive win" |
| 📋 Categories Done | How many of 10 Round 01 categories were completed |
| 🎯 Rounds Played | How many of 8 rounds were finished |
| Score Bar | Visual split of final scores between the two teams |

---

## Tips for Quizmasters

1. **Use full screen mode** (F11) on your browser for the best projector experience
2. **Round 01 is the longest** — plan ~90 minutes for all 10 categories
3. **Show Options sparingly** — verbal answers keep energy high; options slow the pace
4. **Use the Admin Panel** (`Ctrl+Shift+A`) to correct scores if you misjudge an answer
5. **Save regularly** — tap 💾 before breaks or between categories
6. **Halftime** is a great moment for a 10-minute break between rounds 4 and 5
7. **Round 08 (Final Frontier)** should always be played last — it's designed as the climax
8. The scorebar is always visible at the top — teams can see their scores at all times
9. The sidebar in Round 01 shows all 30 questions with completion status — use it to jump to unanswered ones
10. Kannada text is shown below every English question and answer — read both for full engagement

---

## Admin Panel (Quizmaster Controls)

> Open with **Ctrl + Shift + A** (or **Cmd + Shift + A** on Mac). Press **ESC** or click outside to close.

The Admin Panel is invisible to the audience — it opens as a centred overlay.

### Tabs

#### 📊 Scores Tab
- Live scoreboard at the top showing current scores
- Quick ±buttons: −50, −20, −10, −5, +5, +10, +20, +50, +100
- Custom input: enter any positive or negative number and press Apply or Enter
- Useful for correcting a misjudgement instantly

#### 🏆 Rounds Tab
- See which rounds are completed (green ✓) and which are not (grey ○)
- Click any incomplete round to mark it as done
- Use this if a round was played offline (e.g., Pen & Power) and you need to log it

#### 🗺️ Navigate Tab
- Jump to any page directly: Landing, Team Entry, Toss, Round Select, Category Select, Halftime, Winner, Rules
- Useful for skipping to the Winner Screen at the end, or re-doing the toss

#### ⚙️ System Tab
- **Full Reset** — clears all scores, teams, rounds, progress. Cannot be undone.
- **Session Info** — shows current team names, scores, and rounds completed at a glance
