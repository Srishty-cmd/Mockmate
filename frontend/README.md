# AI Voice Interview System

Full-stack AI-powered interview platform with:

- JWT authentication
- Dashboard navigation
- AI interview simulation (voice + text)
- AI evaluation and feedback reports
- Interview history tracking in MongoDB

## Tech Stack

- Frontend: React, Tailwind CSS, Axios, Web Speech API
- Backend: Node.js, Express.js, JWT, OpenAI API
- Database: MongoDB Atlas

## Folder Structure

```text
MockMate-AI-/
├─ backend/
│  ├─ src/
│  │  ├─ config/db.js
│  │  ├─ middleware/authMiddleware.js
│  │  ├─ models/User.js
│  │  ├─ models/InterviewResult.js
│  │  ├─ routes/authRoutes.js
│  │  ├─ routes/aiRoutes.js
│  │  ├─ routes/userRoutes.js
│  │  ├─ utils/openaiClient.js
│  │  └─ server.js
│  └─ .env.example
├─ src/
│  ├─ components/Layout.jsx
│  ├─ pages/Login.jsx
│  ├─ pages/Dashboard.jsx
│  ├─ pages/Roadmap.jsx
│  ├─ pages/Interview.jsx
│  ├─ pages/Feedback.jsx
│  ├─ utils/api.js
│  ├─ utils/auth.js
│  └─ App.jsx
└─ .env.example
```

## Backend Setup

1. Open terminal in `backend`:
   - `cd backend`
2. Install dependencies:
   - `npm install`
3. Create `.env` using `backend/.env.example`:
   - `PORT=5000`
   - `MONGODB_URI=...`
   - `JWT_SECRET=...`
   - `OPENAI_API_KEY=...`
   - `OPENAI_MODEL=gpt-4o-mini`
4. Run backend:
   - `npm run dev`

## Frontend Setup

1. In project root install dependencies:
   - `npm install`
2. Create `.env` using `.env.example`:
   - `REACT_APP_API_BASE_URL=http://localhost:5000`
3. Run frontend:
   - `npm start`

## API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/ai/question`
- `POST /api/ai/evaluate`
- `POST /api/ai/roadmap`
- `POST /api/ai/mentor-chat`
- `GET /api/user/history` (JWT protected)
- `POST /api/user/history` (JWT protected)

## Core User Flow

1. User registers/logs in.
2. Dashboard opens with Roadmap / Interview / Feedback.
3. Interview page runs AI Q&A with speech input/output.
4. AI evaluation creates score, strengths, weaknesses, suggestions.
5. Result is stored in MongoDB and shown in Feedback + History.
