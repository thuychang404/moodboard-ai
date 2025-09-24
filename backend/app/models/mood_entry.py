# SQLAlchemy model for mood journal entries (future feature)
# Responsibilities:
# - Define mood entries table structure
# - Store analysis results
# - Link to users

from sqlalchemy import Column, Integer, String, Text, Float, JSON, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base

class MoodEntry(Base):
    __tablename__ = "mood_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Original text
    text_content = Column(Text, nullable=False)
    
    # AI Analysis results
    sentiment = Column(String(20), nullable=True)
    sentiment_confidence = Column(Float, nullable=True)
    energy_level = Column(String(10), nullable=True)
    emotions = Column(JSON, nullable=True)  # {"joy": 0.8, "sadness": 0.1}
    keywords = Column(JSON, nullable=True)  # ["happy", "excited"]
    
    # Generated content
    color_palette = Column(JSON, nullable=True)  # ["#FF6B6B", "#4ECDC4"]
    art_style = Column(String(50), nullable=True)
    music_mood = Column(String(50), nullable=True)
    ai_insight = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship with user
    user = relationship("User", back_populates="mood_entries")