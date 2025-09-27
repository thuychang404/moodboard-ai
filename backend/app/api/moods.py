from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Dict, List, Any, Optional
from datetime import datetime
from app.services.mood_analyzer import mood_analyzer
from app.core.database import get_db
from app.models.user import User
from app.models.mood_entry import MoodEntry
from app.api.auth import get_current_active_user

router = APIRouter()

class MoodAnalysisRequest(BaseModel):
    text: str

class MoodAnalysisResponse(BaseModel):
    sentiment: str
    sentiment_confidence: float
    energy_level: str
    emotions: Dict[str, float]
    keywords: List[str]
    color_palette: List[str]
    art_style: str
    music_mood: str
    ai_insight: str

class MoodEntryResponse(BaseModel):
    id: int
    text_content: str
    sentiment: Optional[str]
    sentiment_confidence: Optional[float]
    energy_level: Optional[str]
    emotions: Optional[Dict[str, Any]]
    keywords: Optional[List[str]]
    color_palette: Optional[List[str]]
    art_style: Optional[str]
    music_mood: Optional[str]
    ai_insight: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

# PUBLIC ENDPOINT - Main mood analysis (no auth required)
@router.post("/analyze", response_model=MoodAnalysisResponse)
async def analyze_mood_public(request: MoodAnalysisRequest):
    """
    PUBLIC: Analyze mood without authentication (not saved to database)
    """
    try:
        if not request.text or len(request.text.strip()) < 3:
            raise HTTPException(status_code=400, detail="Text must be at least 3 characters long")
        
        analysis = mood_analyzer.analyze_full_mood(request.text.strip())
        print(f"🔓 Public mood analysis completed: {analysis.get('sentiment')} sentiment")
        return MoodAnalysisResponse(**analysis)
    
    except Exception as e:
        print(f"Error in public mood analysis: {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze mood")

# AUTHENTICATED ENDPOINT - Save mood to user's history
@router.post("/analyze-and-save", response_model=MoodAnalysisResponse)
async def analyze_and_save_mood(
    request: MoodAnalysisRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    AUTHENTICATED: Analyze mood and save to user's personal history
    """
    try:
        if not request.text or len(request.text.strip()) < 3:
            raise HTTPException(status_code=400, detail="Text must be at least 3 characters long")
        
        # Perform mood analysis
        analysis = mood_analyzer.analyze_full_mood(request.text.strip())
        
        # Save mood entry to database
        mood_entry = MoodEntry(
            user_id=current_user.id,
            text_content=request.text.strip(),
            sentiment=analysis.get("sentiment"),
            sentiment_confidence=analysis.get("sentiment_confidence"),
            energy_level=analysis.get("energy_level"),
            emotions=analysis.get("emotions", {}),
            keywords=analysis.get("keywords", []),
            color_palette=analysis.get("color_palette", []),
            art_style=analysis.get("art_style"),
            music_mood=analysis.get("music_mood"),
            ai_insight=analysis.get("ai_insight")
        )
        
        db.add(mood_entry)
        db.commit()
        db.refresh(mood_entry)
        
        print(f"✅ Mood entry saved for user {current_user.username} (ID: {mood_entry.id})")
        
        return MoodAnalysisResponse(**analysis)
    
    except Exception as e:
        print(f"Error in authenticated mood analysis: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to analyze and save mood")

# AUTHENTICATED ENDPOINTS - Personal features
@router.get("/history", response_model=List[MoodEntryResponse])
async def get_mood_history(
    limit: int = 20,
    skip: int = 0,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    AUTHENTICATED: Get user's mood history
    """
    try:
        mood_entries = db.query(MoodEntry)\
            .filter(MoodEntry.user_id == current_user.id)\
            .order_by(MoodEntry.created_at.desc())\
            .offset(skip)\
            .limit(limit)\
            .all()
        
        return [MoodEntryResponse.from_orm(entry) for entry in mood_entries]
    
    except Exception as e:
        print(f"Error fetching mood history: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch mood history")

@router.get("/stats")
async def get_mood_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    AUTHENTICATED: Get user's mood statistics
    """
    try:
        entries = db.query(MoodEntry)\
            .filter(MoodEntry.user_id == current_user.id)\
            .all()
        
        if not entries:
            return {
                "total_entries": 0,
                "sentiment_distribution": {},
                "energy_distribution": {},
                "most_common_emotions": [],
                "streak_days": 0
            }
        
        # Calculate statistics
        total_entries = len(entries)
        
        # Sentiment distribution
        sentiment_counts = {}
        for entry in entries:
            sentiment = entry.sentiment or "unknown"
            sentiment_counts[sentiment] = sentiment_counts.get(sentiment, 0) + 1
        
        # Energy distribution
        energy_counts = {}
        for entry in entries:
            energy = entry.energy_level or "unknown"
            energy_counts[energy] = energy_counts.get(energy, 0) + 1
        
        # Most common emotions
        emotion_totals = {}
        for entry in entries:
            if entry.emotions:
                for emotion, score in entry.emotions.items():
                    emotion_totals[emotion] = emotion_totals.get(emotion, 0) + score
        
        most_common_emotions = sorted(emotion_totals.items(), key=lambda x: x[1], reverse=True)[:5]
        
        return {
            "total_entries": total_entries,
            "sentiment_distribution": sentiment_counts,
            "energy_distribution": energy_counts,
            "most_common_emotions": [{"emotion": emotion, "total_score": score} for emotion, score in most_common_emotions],
            "user": current_user.username
        }
    
    except Exception as e:
        print(f"Error calculating mood stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to calculate mood statistics")

@router.delete("/entry/{entry_id}")
async def delete_mood_entry(
    entry_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    AUTHENTICATED: Delete a mood entry from user's history
    """
    try:
        entry = db.query(MoodEntry)\
            .filter(MoodEntry.id == entry_id, MoodEntry.user_id == current_user.id)\
            .first()
        
        if not entry:
            raise HTTPException(status_code=404, detail="Mood entry not found")
        
        db.delete(entry)
        db.commit()
        
        return {"message": "Mood entry deleted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting mood entry: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete mood entry")

# Keep existing test and health endpoints
@router.get("/test")
async def test_mood_analysis():
    """Test mood analysis with sample texts"""
    sample_texts = [
        "I'm feeling really happy and excited!",
        "I'm quite sad today",
        "Just a normal day"
    ]
    
    results = []
    for text in sample_texts:
        try:
            analysis = mood_analyzer.analyze_full_mood(text)
            results.append({"text": text, "analysis": analysis})
        except Exception as e:
            results.append({"text": text, "error": str(e)})
    
    return {"test_results": results, "status": "success"}

@router.get("/health")
async def mood_service_health():
    """Health check for mood analysis service"""
    return {
        "status": "healthy",
        "service": "mood_analysis",
        "models_loaded": {
            "sentiment": mood_analyzer.sentiment_analyzer is not None,
            "emotion": mood_analyzer.emotion_analyzer is not None,
            "nlp": mood_analyzer.nlp is not None
        }
    }