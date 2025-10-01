# backend/app/services/jamendo_service.py
import os
import requests
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

class JamendoService:
    """Service for fetching music from Jamendo API based on mood analysis"""
    
    BASE_URL = "https://api.jamendo.com/v3.0"
    CLIENT_ID = os.getenv("JAMENDO_CLIENT_ID", "")
    
    # Mood to music tag mapping
    MOOD_TAG_MAP = {
        # Sentiment-Energy combinations
        "positive-high": ["happy", "energetic", "pop", "upbeat", "dance"],
        "positive-low": ["calm", "peaceful", "acoustic", "soft", "chill"],
        "negative-high": ["rock", "intense", "alternative", "pop", "energetic"],  # CHANGED
        "negative-low": ["sad", "slow", "acoustic", "emotional", "calm"],  # CHANGED
        "neutral-high": ["electronic", "instrumental", "pop", "upbeat"],
        "neutral-low": ["chill", "ambient", "instrumental", "lounge"],
        
        # Dominant emotions mapping
        "joy": ["happy", "pop", "upbeat"],
        "sadness": ["sad", "emotional", "slow", "acoustic"],  # CHANGED
        "anger": ["rock", "metal", "intense"],
        "fear": ["ambient", "electronic", "dark"],
        "surprise": ["pop", "electronic", "upbeat"],
        "disgust": ["rock", "alternative", "metal"],
    }
    
    # Additional genre/vibe mapping based on color palette intensity
    COLOR_INTENSITY_GENRES = {
        "vibrant": ["pop", "dance", "electronic", "edm"],
        "pastel": ["indie", "folk", "acoustic", "singer-songwriter"],
        "dark": ["alternative", "rock", "gothic", "darkwave"],
        "warm": ["jazz", "soul", "r&b", "blues"],
        "cool": ["ambient", "chillwave", "synthwave", "electronic"]
    }
    
    def __init__(self):
        if not self.CLIENT_ID:
            print("⚠️ WARNING: JAMENDO_CLIENT_ID not set. Music features will be limited.")
    
    def _make_request(self, endpoint: str, params: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Make API request to Jamendo"""
        try:
            params["client_id"] = self.CLIENT_ID
            params["format"] = "jsonpretty"
            
            response = requests.get(f"{self.BASE_URL}/{endpoint}", params=params, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"❌ Jamendo API error: {e}")
            return None
    
    def _analyze_color_palette(self, colors: List[str]) -> str:
        """Analyze color palette to determine intensity/vibe"""
        # Simple heuristic based on color brightness/saturation
        # This is a basic implementation - could be enhanced with proper color analysis
        if not colors:
            return "neutral"
        
        # Check if colors are vibrant (high saturation)
        vibrant_count = sum(1 for c in colors if any(x in c.lower() for x in ['ff', 'ee', 'dd']))
        
        if vibrant_count > len(colors) * 0.6:
            return "vibrant"
        elif vibrant_count < len(colors) * 0.3:
            return "pastel"
        
        # Check for dark/light colors
        dark_count = sum(1 for c in colors if c.startswith('#') and int(c[1:3], 16) < 100)
        if dark_count > len(colors) * 0.5:
            return "dark"
        
        return "neutral"
    
    def _get_tags_from_mood(self, mood_analysis: Dict[str, Any]) -> List[str]:
        """Extract relevant music tags from mood analysis"""
        tags = []
        
        # 1. Get tags from sentiment-energy combination
        sentiment = mood_analysis.get("sentiment", "neutral")
        energy = mood_analysis.get("energy_level", "low")
        mood_key = f"{sentiment}-{energy}"
        
        tags.extend(self.MOOD_TAG_MAP.get(mood_key, ["chill"]))
        
        # 2. Get tags from dominant emotion
        emotions = mood_analysis.get("emotions", {})
        if emotions:
            dominant_emotion = max(emotions.items(), key=lambda x: x[1])[0]
            emotion_tags = self.MOOD_TAG_MAP.get(dominant_emotion, [])
            tags.extend(emotion_tags)
        
        # 3. Add genre based on color palette
        color_palette = mood_analysis.get("color_palette", [])
        color_vibe = self._analyze_color_palette(color_palette)
        if color_vibe in self.COLOR_INTENSITY_GENRES:
            tags.extend(self.COLOR_INTENSITY_GENRES[color_vibe])
        
        # Remove duplicates while preserving order
        seen = set()
        unique_tags = []
        for tag in tags:
            if tag not in seen:
                seen.add(tag)
                unique_tags.append(tag)
        
        return unique_tags[:5]  # Limit to top 5 most relevant tags
    
    def get_mood_playlist(
        self, 
        mood_analysis: Dict[str, Any], 
        limit: int = 10
    ) -> Dict[str, Any]:
        """
        Get a curated playlist based on mood analysis
        
        Args:
            mood_analysis: The mood analysis result from MoodAnalyzer
            limit: Number of tracks to return (default 10)
        
        Returns:
            Dictionary with playlist info and tracks
        """
        if not self.CLIENT_ID:
            print("❌ No Jamendo CLIENT_ID found!")  # ADD THIS
            return {
                "error": "Jamendo API not configured",
                "playlist_name": "Mood Playlist",
                "tracks": []
            }
        
        # Extract relevant tags from mood
        tags = self._get_tags_from_mood(mood_analysis)
        print(f"🎵 Searching Jamendo with tags: {tags}")  # ADD THIS
        
        # Try progressively broader searches if no results
        data = None
        search_attempts = [
            tags[:3],  # Try first 3 tags
            tags[:2],  # Try first 2 tags
            tags[:1],  # Try first tag only
            ["instrumental"],  # Fallback to instrumental
        ]

        for attempt_tags in search_attempts:
            params = {
                "tags": ",".join(attempt_tags),
                "limit": limit,
                "order": "popularity_total",
                "audioformat": "mp32",
                "include": "musicinfo+licenses"
            }

            data = self._make_request("tracks/", params)
            if data and "results" in data and data["results"]:
                print(f"✅ Found {len(data['results'])} tracks with tags: {attempt_tags}")  # ADD THIS
                break  # Found results, exit loop
            else:
                print(f"⚠️ No tracks found with tags: {attempt_tags}, trying broader search...")  # ADD THIS

        print(f"📊 Jamendo API response: {data is not None}")  # ADD THIS
        if data:
            print(f"📊 Number of tracks returned: {len(data.get('results', []))}")  # ADD THIS

        if not data or "results" not in data:
            print("❌ No data or results from Jamendo API")  # ADD THIS

            return {
                "error": "Failed to fetch tracks",
                "playlist_name": self._generate_playlist_name(mood_analysis),
                "tracks": []
            }
        
        # Format tracks for frontend
        tracks = []
        for track in data["results"]:
            tracks.append({
                "id": track.get("id"),
                "name": track.get("name"),
                "artist": track.get("artist_name"),
                "album": track.get("album_name"),
                "duration": track.get("duration"),  # in seconds
                "audio_url": track.get("audio"),
                "image_url": track.get("image"),
                "jamendo_url": f"https://www.jamendo.com/track/{track.get('id')}",
                "license": track.get("license_ccurl"),
            })

        print(f"✅ Formatted {len(tracks)} tracks for frontend")  # ADD THIS
        
        return {
            "playlist_name": self._generate_playlist_name(mood_analysis),
            "mood_tags": tags,
            "total_tracks": len(tracks),
            "tracks": tracks,
            "sentiment": mood_analysis.get("sentiment"),
            "energy": mood_analysis.get("energy_level"),
        }
    
    def _generate_playlist_name(self, mood_analysis: Dict[str, Any]) -> str:
        """Generate a creative playlist name based on mood"""
        sentiment = mood_analysis.get("sentiment", "neutral").capitalize()
        energy = mood_analysis.get("energy_level", "low").capitalize()
        
        # Get dominant emotion if available
        emotions = mood_analysis.get("emotions", {})
        dominant_emotion = ""
        if emotions:
            dominant_emotion = max(emotions.items(), key=lambda x: x[1])[0].capitalize()
        
        # Creative name templates
        name_templates = {
            "positive-high": [
                f"Energized & {dominant_emotion or 'Joyful'}",
                "High Vibes Only",
                "Uplifting Energy"
            ],
            "positive-low": [
                f"Peaceful {dominant_emotion or 'Calm'}",
                "Gentle Positivity",
                "Serene Moments"
            ],
            "negative-high": [
                f"Intense {dominant_emotion or 'Power'}",
                "Cathartic Release",
                "Raw Energy"
            ],
            "negative-low": [
                f"Reflective {dominant_emotion or 'Melancholy'}",
                "Quiet Contemplation",
                "Emotional Journey"
            ],
            "neutral-high": [
                "Focused Flow",
                "Active Balance",
                "Steady Motion"
            ],
            "neutral-low": [
                "Chill Zone",
                "Balanced Calm",
                "Mellow Vibes"
            ]
        }
        
        mood_key = f"{mood_analysis.get('sentiment', 'neutral')}-{mood_analysis.get('energy_level', 'low')}"
        templates = name_templates.get(mood_key, [f"{sentiment} {energy} Mix"])
        
        return templates[0]  # Return first template
    
    def search_tracks_by_keyword(
        self, 
        keyword: str, 
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search tracks by keyword (for future features)
        """
        if not self.CLIENT_ID:
            return []
        
        params = {
            "search": keyword,
            "limit": limit,
            "audioformat": "mp31",
            "include": "musicinfo"
        }
        
        data = self._make_request("tracks/", params)
        
        if not data or "results" not in data:
            return []
        
        tracks = []
        for track in data["results"]:
            tracks.append({
                "id": track.get("id"),
                "name": track.get("name"),
                "artist": track.get("artist_name"),
                "audio_url": track.get("audio"),
                "image_url": track.get("image"),
            })
        
        return tracks


# Global instance
jamendo_service = JamendoService()