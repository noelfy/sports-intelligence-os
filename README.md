# 🏐 NeuroVolley AI — Sports Intelligence OS

AI-powered volleyball movement analysis platform. Upload your video and receive
biomechanical feedback with pose estimation, motion analysis, and LLM coaching.

## Architecture

```
sports-intelligence-os/
├── frontend/          # Next.js 16 + React + Tailwind + shadcn/ui
├── backend/           # FastAPI + Python (async)
├── pose_estimation/   # MediaPipe Pose + OpenCV
├── analysis_engine/   # Joint angles, movement metrics, AI feedback
├── database/          # SQLAlchemy ORM (SQLite dev / PostgreSQL prod)
├── ai_engine/         # Sport-agnostic abstractions (future)
├── docs/              # Documentation
└── experiments/       # Jupyter notebooks & sample data
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React, Tailwind CSS, shadcn/ui |
| Backend | FastAPI, Python 3.10, SQLAlchemy |
| Pose Estimation | MediaPipe Pose (33 landmarks), OpenCV |
| Analysis | NumPy, SciPy (joint angles, metrics, phase detection) |
| AI Feedback | OpenAI API (GPT-4o-mini) or any OpenAI-compatible API |
| Database | SQLite (dev) → PostgreSQL (prod) |
| Auth | JWT (python-jose + passlib/bcrypt) |

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 24+
- Git

### 1. Clone and Setup

```bash
git clone git@github.com:noelfy/sports-intelligence-os.git
cd sports-intelligence-os

# Python virtual environment
python -m venv venv
source venv/Scripts/activate  # Windows
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

### 2. Configure

```bash
cp .env.example .env
# Edit .env: add your OPENAI_API_KEY for AI feedback
```

### 3. Start Backend

```bash
cd sports-intelligence-os
PYTHONPATH=. ./venv/Scripts/uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Start Frontend

```bash
cd frontend
npm run dev
```

### 5. Open

- Frontend: http://localhost:3000
- Backend API docs: http://localhost:8000/docs

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/upload` | Upload video (mp4/mov) |
| GET | `/api/results/{id}` | Get analysis result |
| GET | `/api/results` | List all results |
| GET | `/api/files/videos/{id}/{file}` | Serve video files |
| GET | `/api/files/keypoints/{id}/keypoints.json` | Serve keypoint data |
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login → JWT |
| GET | `/api/auth/me` | Get user profile |
| GET | `/api/history` | User's analysis history |
| GET | `/api/history/progress` | Progress trends |

## Movement Metrics

The analysis engine computes five biomechanical metrics (0-100):

| Metric | What it measures |
|--------|-----------------|
| **Balance** | Center-of-mass lateral stability |
| **Posture** | Shoulder symmetry + trunk alignment |
| **Timing** | Movement rhythm consistency |
| **Efficiency** | Motion smoothness (jerk minimization) |
| **Coordination** | Multi-joint synchronization |

## MVP Status

- [x] Phase 0: Environment setup
- [x] Phase 1: Pose estimation pipeline
- [x] Phase 2: Backend API
- [x] Phase 3: Frontend MVP
- [x] Phase 4: Analysis engine
- [x] Phase 5: User system

## License

MIT
