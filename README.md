# Moodboard AI

Moodboard AI is a full-stack application that analyzes user moods using AI models and visualizes them as interactive moodboards. The backend is powered by Python (FastAPI, Huggingface, OpenAI), and the frontend is built with React Native (TypeScript) and Tailwind CSS.

---

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Updating Dependencies](#updating-dependencies)
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

## Environment Variables

### Backend (`backend/.env`)
Copy from `.env.example` and fill in:
```
DATABASE_URL=sqlite:///./data/moodboard.db
OPENAI_API_KEY=your-openai-key-here
SECRET_KEY=your-secret-key
ENVIRONMENT=development
DEBUG=True
ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend (`frontend/.env`)
Add any frontend secrets or API URLs as needed.  
**Do not commit this file.**

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

## License

This project is licensed under the MIT License.

---

**Contributions are welcome!**
