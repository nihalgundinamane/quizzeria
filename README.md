# Quizzeria — Bilingual Live Quiz Platform

> A cinematic, bilingual (English + Kannada) live quiz for 2 teams across 8 unique rounds.

---

## 📚 Documentation

| File | Contents |
|------|----------|
| **[GAME_GUIDE.md](./GAME_GUIDE.md)** | How to play, all 8 rounds explained, scoring rules, quizmaster tips, admin panel usage, all visual features |
| **[TECHNICAL.md](./TECHNICAL.md)** | Architecture, API reference, GameContext state, deployment, adding questions, feature implementation log |

---

## Quick Start

### Backend
```bash
cd backend
python3 -m venv venv && source venv/bin/activate
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

### Docker (both together)
```bash
docker compose up --build
# Frontend: http://localhost:80  |  Backend: http://localhost:8000
```

---

## Deploy to Render (Free)

1. Push to GitHub → [render.com](https://render.com) → New → Blueprint
2. Connect repo — `render.yaml` creates two services automatically
3. After first deploy: set `VITE_API_BASE` to your backend URL, redeploy frontend

---

## Admin Panel (Quizmaster)

Press **`Ctrl + Shift + A`** at any time to open the quizmaster panel.
Tabs: Score Override · Round Management · Navigate · System Reset.
Press **ESC** or click outside to close.

---

## Rounds at a Glance

| # | Name | Format |
|---|------|--------|
| 1 | Category Clash | 10 categories × 30 MCQ, verbal + pass system |
| 2 | The Visual Vault | Shadow image identification, 5 sub-cats |
| 3 | The Wild Card | Proverbs, riddles, jumbles, songs, smart, translation |
| 4 | Buzzer Battle | 50 rapid-fire MCQ |
| 5 | Agni Pariksha | 20Q per team, 10 min rapid fire |
| 6 | Pen & Power | Written offline round, manual scoring |
| 7 | Decode Zone | Sequence memory + emoji decode |
| 8 | The Final Frontier | 2 boss questions × 4 min each |
