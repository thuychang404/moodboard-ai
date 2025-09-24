from transformers import pipeline
import spacy
import openai
import os
from typing import Dict, Any, List
import warnings

# Suppress warnings for cleaner output
warnings.filterwarnings("ignore", category=UserWarning)
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

class MoodAnalyzer:
    def __init__(self):
        try:
            print("🤖 Loading AI models...")

            # Sentiment analysis model
            self.sentiment_analyzer = pipeline(
                "sentiment-analysis",
                model="cardiffnlp/twitter-roberta-base-sentiment-latest",
                top_k=None
            )

            # Emotion analysis model
            self.emotion_analyzer = pipeline(
                "text-classification",
                model="j-hartmann/emotion-english-distilroberta-base",
                top_k=None
            )

            # SpaCy for NLP tasks (keywords, etc.)
            self.nlp = spacy.load("en_core_web_sm")
            openai.api_key = os.getenv("OPENAI_API_KEY")

            print("✅ AI models loaded successfully")

        except Exception as e:
            print(f"⚠️ AI models failed to load: {e}")
            print("🔄 Using fallback analysis methods")
            self.sentiment_analyzer = None
            self.emotion_analyzer = None
            self.nlp = None

    def heuristic_energy(self, text: str) -> str:
        """
        Estimate energy (high/low) based on lexical cues:
        - Multiple exclamation marks
        - High ratio of uppercase letters
        - Presence of intense words
        """
        exclamations = text.count("!")
        caps_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)
        intense_words = {
            "amazing", "awesome", "fantastic", "furious", "incredible",
            "hate", "love", "ecstatic", "angry", "thrilled", "so", "very", 
            "extremely", "super", "totally", "completely"
        }
        intense_match = any(w in text.lower() for w in intense_words)
        if exclamations > 1 or caps_ratio > 0.2 or intense_match:
            return "high"
        return "low"

    def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        if self.sentiment_analyzer:
            try:
                results = self.sentiment_analyzer(text)
                # Flatten if results is a list of lists
                if isinstance(results, list) and len(results) > 0 and isinstance(results[0], list):
                    results = results[0]
                # Ensure results is a non-empty list
                if not isinstance(results, list) or len(results) == 0:
                    raise ValueError("No sentiment results returned from model.")
                sentiment_map = {"LABEL_0": "negative", "LABEL_1": "neutral", "LABEL_2": "positive"}
                scores = {sentiment_map.get(r["label"], r["label"]): r["score"] for r in results}
                dominant = max(scores.items(), key=lambda x: x[1])

                # === ENERGY METRIC ===
                # Confidence-based rule with heuristic fallback
                if dominant[1] >= 0.75:
                    energy = "high"
                elif dominant[1] <= 0.40:
                    energy = "low"
                else:
                    energy = self.heuristic_energy(text)

                combined_label = f"{dominant[0]}-{energy}"

                return {
                    "sentiment": dominant[0],
                    "confidence": dominant[1],
                    "energy": energy,
                    "combined_label": combined_label,
                    "scores": scores
                }
            except Exception as e:
                print(f"Sentiment analysis failed: {e}")

        # ✅ Fallback if model is unavailable
        return self._fallback_sentiment_analysis(text)

    def analyze_emotions(self, text: str) -> Dict[str, float]:
        if self.emotion_analyzer:
            try:
                results = self.emotion_analyzer(text)
                if isinstance(results, list) and len(results) > 0 and isinstance(results[0], list):
                    results = results[0]
                # Ensure results is a non-empty list
                if not isinstance(results, list) or len(results) == 0:
                    raise ValueError("No sentiment results returned from model.")
                
                return {r["label"]: r["score"] for r in results}
            except Exception as e:
                print(f"Emotion analysis failed: {e}")

        return self._fallback_emotion_analysis(text)

    def extract_keywords(self, text: str) -> List[str]:
        """Extract meaningful keywords from text"""
        keywords = []
        if self.nlp:
            try:
                doc = self.nlp(text)
                # Extract noun chunks and adjectives
                keywords = [chunk.text.lower() for chunk in doc.noun_chunks][:5]
                # Add important adjectives
                adjectives = [token.text.lower() for token in doc if token.pos_ == "ADJ"][:3]
                keywords.extend(adjectives)
            except Exception as e:
                print(f"Keyword extraction failed: {e}")
        
        # Fallback: simple word extraction
        if not keywords:
            words = text.lower().split()
            emotion_words = ['happy', 'sad', 'angry', 'excited', 'worried', 'calm', 'stressed', 'peaceful']
            keywords = [word for word in words if word in emotion_words][:5]
        
        return keywords

    def analyze_full_mood(self, text: str) -> Dict[str, Any]:
        print(f"🧠 Analyzing: '{text[:50]}...'")

        sentiment_result = self.analyze_sentiment(text)
        emotions = self.analyze_emotions(text)
        keywords = self.extract_keywords(text)

        # 🎨 Color palettes by sentiment/energy
        palettes = {
            "positive": {
                "high": ['#FF6B6B', '#FFE66D', '#FF8E53', '#FF6B9D', '#4ECDC4'],
                "low":  ['#A8E6CF', '#88D8C0', '#FFEAA7', '#FD79A8', '#FDCB6E']
            },
            "negative": {
                "high": ['#636E72', '#2D3436', '#E17055', '#A29BFE', '#6C5CE7'],
                "low":  ['#74B9FF', '#0984E3', '#A29BFE', '#DDA0DD', '#81ECEC']
            },
            "neutral": {
                "high": ['#FDCB6E', '#E17055', '#00B894', '#00CEC9', '#A29BFE'],
                "low":  ['#DDDDDD', '#AAAAAA', '#888888', '#666666', '#444444']
            }
        }

        # ✅ Use computed energy for palette selection
        energy = sentiment_result.get("energy", "low")  # Fixed: get energy properly
        color_palette = palettes.get(sentiment_result["sentiment"], palettes["neutral"]).get(energy, palettes["neutral"]["low"])

        # Generate insights based on sentiment-energy combination
        insights = {
            'positive-high': "Your energy is radiating positivity! Channel this momentum into creative projects or connecting with others.",
            'positive-low': "There's a gentle contentment in your words. This peaceful energy is perfect for reflection and self-care.",
            'negative-high': "I sense some intensity in your emotions. Consider channeling this energy through physical activity or creative expression.",
            'negative-low': "You seem to be processing some heavy feelings. Remember that it's okay to feel this way - try some deep breathing or gentle movement.",
            'neutral-high': "You're in an active, balanced state. This is great energy for tackling projects or trying something new.",
            'neutral-low': "Your mood feels steady and calm. This is a perfect time for planning, organizing, or quiet activities."
        }

        # Determine art style and music mood
        art_styles = {
            "positive": "circles",
            "negative": "sharp", 
            "neutral": "organic"
        }
        
        music_moods = {
            "positive": "uplifting",
            "negative": "soothing",
            "neutral": "balanced"
        }

        result = {
            "sentiment": sentiment_result["sentiment"],
            "sentiment_confidence": sentiment_result["confidence"],
            "energy_level": energy,  # ✅ Fixed: use the extracted energy variable
            "emotions": emotions,
            "keywords": keywords,
            "color_palette": color_palette,
            "art_style": art_styles.get(sentiment_result["sentiment"], "organic"),
            "music_mood": music_moods.get(sentiment_result["sentiment"], "balanced"),
            "ai_insight": insights.get(sentiment_result.get("combined_label"), "Every emotion is valid and temporary. You're doing great by checking in with yourself.")
        }

        print(f"✅ Analysis complete: {sentiment_result['sentiment']} sentiment at {sentiment_result['confidence']*100:.1f}% confidence, energy: {energy}")
        return result

    def _fallback_sentiment_analysis(self, text: str) -> Dict[str, Any]:
        positive_words = ['happy', 'joy', 'love', 'excited', 'great', 'amazing',
                          'wonderful', 'good', 'peaceful', 'grateful']
        negative_words = ['sad', 'angry', 'frustrated', 'tired', 'worried',
                          'stressed', 'bad', 'awful', 'terrible', 'anxious']

        words = text.lower().split()
        positive_count = sum(1 for word in words if word in positive_words)
        negative_count = sum(1 for word in words if word in negative_words)

        # ✅ Fixed confidence calculation
        confidence = max(0.6, min(0.95,
            (abs(positive_count - negative_count) + 1) / (len(words) / 10 + 1)
        ))

        if positive_count > negative_count:
            overall_sentiment = "positive"
        elif negative_count > positive_count:
            overall_sentiment = "negative"
        else:
            overall_sentiment = "neutral"

        # Simple heuristic energy for fallback
        energy = "high" if positive_count + negative_count > 2 else "low"

        return {
            "sentiment": overall_sentiment,
            "confidence": confidence,
            "energy": energy,
            "combined_label": f"{overall_sentiment}-{energy}",  # Fixed: use dash instead of underscore
            "scores": {overall_sentiment: confidence}
        }

    def _fallback_emotion_analysis(self, text: str) -> Dict[str, float]:
        """Simple keyword-based emotion analysis fallback"""
        emotion_keywords = {
            'joy': ['happy', 'excited', 'joy', 'love', 'amazing', 'wonderful'],
            'sadness': ['sad', 'down', 'depressed', 'lonely', 'hurt'],
            'anger': ['angry', 'mad', 'frustrated', 'annoyed', 'irritated'],
            'fear': ['scared', 'worried', 'anxious', 'nervous', 'afraid'],
            'surprise': ['surprised', 'shocked', 'amazed', 'unexpected'],
            'disgust': ['disgusted', 'sick', 'revolting', 'gross']
        }
        
        words = text.lower().split()
        emotions = {}
        
        for emotion, keywords in emotion_keywords.items():
            score = sum(1 for word in words if word in keywords) / max(len(words), 1)
            emotions[emotion] = min(score * 3, 1.0)  # Scale and cap at 1.0
        
        # Ensure at least some emotion
        if all(score < 0.1 for score in emotions.values()):
            emotions['neutral'] = 0.8
            
        return emotions


# === Global Analyzer Instance ===
mood_analyzer = MoodAnalyzer()