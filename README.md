# Moodboard AI

Moodboard AI is a full-stack application that analyzes user moods using AI models and visualizes them as interactive moodboards. The backend is powered by Python (FastAPI, Huggingface, OpenAI), and the frontend is built with React Native (TypeScript) and Tailwind CSS.

---

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Development](#development)
- [Updating Dependencies](#updating-dependencies)
- [Version History](#version-history)
- [License](#license)

---

## Features

- AI-powered mood analysis using Huggingface and OpenAI models
- RESTful API with FastAPI
- Secure authentication with JWT
- Interactive, modern UI with React Native and Tailwind CSS
- Colorful moodboard visualization
- Modular, extensible codebase

---

## Project Structure

```
moodboard-ai/
│
├── backend/                # Python FastAPI backend
│   ├── app/                # Main application code
│   ├── data/               # Database files (excluded from git)
│   ├── tests/              # Backend tests
│   ├── requirements.txt    # Python dependencies
│   ├── .env.example        # Example backend environment variables
│   └── .gitignore
│
├── frontend/               # React Native frontend
│   ├── public/             # Static assets
│   ├── src/                # Source code (components, services)
│   ├── package.json        # JS dependencies
│   ├── .env                # Frontend environment variables (not committed)
│   └── .gitignore
│
└── README.md               # Project documentation
```

---

## Getting Started

### Backend Setup

1. **Navigate to backend folder:**
   ```sh
   cd backend
   ```

2. **Create and activate a virtual environment (Windows):**
   ```sh
   python -m venv venv
   venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```sh
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   - Copy `.env.example` to `.env` and fill in your secrets.

5. **Run the backend server:**
   ```sh
   uvicorn app.main:app --reload --port 8000
   ```

6. **Verify backend:**
   - Visit [http://localhost:8000/docs](http://localhost:8000/docs) for API docs.
   - Console should show:
     - ✅ "AI models loaded successfully"
     - ✅ "Application startup complete"

---

### Frontend Setup

1. **Navigate to frontend folder:**
   ```sh
   cd frontend
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Configure environment variables (if needed):**
   - Create a `.env` file for frontend secrets (do not commit this file).

4. **Start the frontend:**
   ```sh
   npm start
   ```

5. **Verify frontend:**
   - Visit [http://localhost:3000](http://localhost:3000)
   - You should see the Moodboard AI UI.

---

## Development

- **Backend:** Python, FastAPI, Huggingface, OpenAI, JWT
- **Frontend:** React Native, TypeScript, Tailwind CSS
- **Database:** SQLite (local, for development)

---

## Updating Dependencies

### Backend
```sh
pip freeze > requirements.txt
```

### Frontend
```sh
npm install <package>
npm run build   # For production build
```

---

## Version History

- **v1.3.1**
  - Fix issue "Playlist Position": In front end, when click Show playlist, a list of songs will apear below the main card (which is not supposed to be there). Fixed: the correct position is under the Show playlist button.
  - Fix issue "`useEffect` warning": In front end, when run `npm start`, warnings show up. Turn out `useEffect` missed dependencies: `isMuted`, `volume`, `isPlaying`. Fixed: add `isMuted`, `volume`, `isPlaying` to `useEffect`. 

- **v1.3.0**
  Added new feature: now user will get a mood-based playlist whenever they generate a moodboard. Logged-in users only.

- **v1.2.0**
  Added new feature: users who have already logged in can now use voice-to-text feature.

- **v1.1.0**  
  Added new feature: users can now log in using their Gmail account. This version also includes integration with Authience services for enhanced authentication and many other features.

- **v1.0.0**  
  Initial release of the application. This version includes the core features and marks the first official launch.


---

## License

This project is licensed under the MIT License.

---

**Contributions are welcome!**
