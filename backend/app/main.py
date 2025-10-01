from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import uvicorn

# Import routers
from app.api.moods import router as mood_router
from app.api.auth import router as auth_router

# Import database and config
from app.core.database import init_db, get_db
from app.core.config import settings

# Create FastAPI app
app = FastAPI(
    title="MoodBoard AI API",
    description="AI-powered mood analysis and creative content generation",
    version="1.3.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(mood_router, prefix="/api/moods", tags=["Mood Analysis"])

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    print("🚀 Starting MoodBoard AI API...")
    await init_db()
    print("✅ API ready at http://localhost:8000")

@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "Welcome to MoodBoard AI API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint"""
    try:
        db.execute("SELECT 1")
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    return {
        "status": "healthy",
        "database": db_status,
        "services": {
            "mood_analysis": "available",
            "authentication": "available"
        }
    }

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )