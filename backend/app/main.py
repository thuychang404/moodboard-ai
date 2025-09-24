# This is the main FastAPI application file
# Responsibilities:
# - Create FastAPI app instance
# - Configure CORS middleware  
# - Include API routers
# - Define global exception handlers
# - Root endpoints (/, /health)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv

# Import API routers
from app.api import moods

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="MoodBoard AI API",
    description="AI-powered mood tracking and visualization API", 
    version="1.0.0"
)

# Configure CORS for frontend access
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(moods.router, prefix="/api/moods", tags=["Moods"])

@app.get("/")
async def root():
    return {
        "message": "🧠 MoodBoard AI API",
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health") 
async def health_check():
    return {"status": "healthy", "service": "moodboard-ai"}