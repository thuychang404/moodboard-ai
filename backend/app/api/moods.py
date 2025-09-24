from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Any, Optional
from app.services.mood_analyzer import mood_analyzer

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

@router.post("/analyze", response_model=MoodAnalysisResponse)
async def analyze_mood(request: MoodAnalysisRequest):
    try:
        if not request.text or len(request.text.strip()) < 3:
            raise HTTPException(status_code=400, detail="Text must be at least 3 characters long")
        
        analysis = mood_analyzer.analyze_full_mood(request.text.strip())
        return MoodAnalysisResponse(**analysis)
    
    except Exception as e:
        print(f"Error in mood analysis: {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze mood")

@router.get("/test")
async def test_mood_analysis():
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
    return {
        "status": "healthy",
        "service": "mood_analysis",
        "models_loaded": {
            "sentiment": mood_analyzer.sentiment_analyzer is not None,
            "emotion": mood_analyzer.emotion_analyzer is not None,
            "nlp": mood_analyzer.nlp is not None
        }
    }