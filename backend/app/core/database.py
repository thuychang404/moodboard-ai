# Database connection and session management
# Responsibilities:
# - SQLAlchemy engine setup
# - Database session factory
# - Table creation
# - Database dependency injection

import os
from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/moodboard.db")

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all models
Base = declarative_base()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def init_db():
    """Initialize database and create tables"""
    os.makedirs("data", exist_ok=True)
    
    # Import models to register them
    from app.models import user, mood_entry
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("✅ Database initialized successfully")