# TaskPilot

TaskPilot is a real-time, AI-assisted task assignment and monitoring platform for software development teams. It allows team leads to assign technical coding or writing tasks to employees, watch their progress and cursor movements in real-time as they type, and provide employees with a real-time AI assistant that automatically reviews code and offers one-click corrections.

---

## 🌟 Key Features

### 1. Team Lead Dashboard
- **AI Task Scaffolder**: Team leads describe a task in plain text, and Google Gemini automatically generates starting folder files, stubs, and `TODO` comments without writing the solution.
- **Task Dispatcher**: Creates tasks and sends secure single-use access links directly to employees' emails using the **Resend HTTP API**.
- **Real-Time Live Monitor**: Watch employees work in real-time. Code editors and cursor positions are mirrored line-by-line via **Socket.io WebSockets**.
- **Employee Performance Analytics**: Tracks task completion times, AI scores, and typing metrics with beautiful **Recharts** visualizations.

### 2. Employee Workspace
- **Integrated Editor**: Dark-themed Monaco Editor (for coding) and TipTap (for document writing) supporting multi-file projects.
- **Local Sandbox Runner**: Compiles and executes code locally on the server (using Node.js VM context), displaying output and catching compiler/runtime errors.
- **AI Coding Assistant**: Google Gemini reviews code in the background, flags issues, and provides an **"Accept Suggestion"** button that automatically replaces incorrect code blocks inside the editor (with full line-ending and indentation normalization).
- **Task Activity Heatmap**: A GitHub-style 365-day contribution calendar tracking task completion history.

---

## 📂 Project Structure

```
TaskPilot/
├── client/                 # React + Vite Frontend
│   ├── src/
│   │   ├── components/     # Reusable UI elements (Sidebar, Charts, Calendar, etc.)
│   │   ├── pages/          # Page layouts (Dashboard, Workspace, Profile, etc.)
│   │   ├── store/          # Zustand global state (workspaceStore.js)
│   │   └── main.jsx        # App entry and Axios interceptor
│   └── vercel.json         # Vercel SPA routing rewrites
│
└── server/                 # Express + Node.js Backend
    ├── middleware/         # Auth tokens validation filters
    ├── models/             # Mongoose database schemas (Task, Submission, User)
    ├── routes/             # REST endpoints (auth, tasks, analytics)
    └── utils/              # Third-party utilities (Gemini AI, Resend API, local runners)
```

---

## ⚙️ Environment Variables

Create a `.env` file inside the `server/` directory and configure the following variables:

| Variable | Description | Example / Fallback |
| :--- | :--- | :--- |
| `PORT` | Backend server port | `5000` |
| `MONGODB_URI` | MongoDB Connection URI | `mongodb+srv://...` (falls back to memory server locally) |
| `JWT_SECRET` | Secret key for signing sessions | `taskpilot-super-secret-key-123456789` |
| `RESEND_API_KEY` | Resend HTTP API key | `re_ZVZZ5MUR_...` |
| `CLIENT_URL` | Frontend client URL (for email links) | `https://your-app.vercel.app` (defaults to localhost) |
| `GEMINI_API_KEY` | Google Gemini AI API key | `AIzaSy...` |
| `JUDGE0_API_KEY` | (Optional) RapidAPI key for compilation | *Blank defaults to local JS sandbox* |

---

## 🚀 Local Development Setup

### 1. Clone the project and install all dependencies
From the root directory (`/TaskPilot`):
```bash
# Install root, client, and server dependencies
npm run install-all
```

### 2. Run the application locally
Run the backend API and socket server:
```bash
cd server
npm start
```

In a separate terminal, run the Vite frontend client:
```bash
cd client
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## ☁️ Production Split Deployment

To deploy this application in production:

### 1. Backend (Render Web Service)
- **Root Directory**: `server`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- Configure the required **Environment Variables** (see table above). Add `CLIENT_URL` pointing to your Vercel URL.

### 2. Frontend (Vercel Static Site)
- **Root Directory**: `client`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- Add the **Environment Variable**: `VITE_API_URL` pointing to your Render backend URL (e.g. `https://your-backend.onrender.com`).
