# backend/app/services/image_service.py
import os
import requests
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

class ImageGenerationService:
    """Service for generating AI images based on mood analysis"""
    
    def __init__(self):
        self.hf_api_key = os.getenv("HUGGINGFACE_API_KEY", "")
        self.cloudflare_account_id = os.getenv("CLOUDFLARE_ACCOUNT_ID", "")
        self.cloudflare_api_token = os.getenv("CLOUDFLARE_API_TOKEN", "")

    def _build_prompt_from_mood(self, mood_analysis: Dict[str, Any]) -> str:
        """Build creative image prompt from complete mood analysis"""
        sentiment = mood_analysis.get("sentiment", "neutral")
        energy = mood_analysis.get("energy_level", "low")
        keywords = mood_analysis.get("keywords", [])
        emotions = mood_analysis.get("emotions", {})
        color_palette = mood_analysis.get("color_palette", [])
        art_style = mood_analysis.get("art_style", "organic")
        music_mood = mood_analysis.get("music_mood", "balanced")
        
        # Get dominant emotion
        dominant_emotion = ""
        if emotions:
            dominant_emotion = max(emotions.items(), key=lambda x: x[1])[0]
        
        # Convert hex colors to descriptive color names for better prompt
        color_descriptions = self._describe_color_palette(color_palette)
        
        # Detailed prompt templates based on complete analysis
        prompt_templates = {
            "positive-high": {
                "scene": "vibrant, energetic dreamscape bursting with life and movement",
                "atmosphere": "exhilarating, dynamic, full of joy and excitement",
                "lighting": "bright, radiant sunlight, golden hour glow",
                "composition": "explosive, dynamic, upward flowing composition"
            },
            "positive-low": {
                "scene": "peaceful, serene sanctuary bathed in gentle warmth",
                "atmosphere": "calm, tranquil, harmonious and content",
                "lighting": "soft, warm, diffused natural light",
                "composition": "balanced, flowing, gentle curves and harmony"
            },
            "negative-high": {
                "scene": "intense, dramatic landscape with powerful contrasts",
                "atmosphere": "turbulent, powerful, raw emotional energy",
                "lighting": "dramatic, high contrast, stormy lighting",
                "composition": "sharp angles, intense perspective, bold forms"
            },
            "negative-low": {
                "scene": "contemplative, introspective space with depth and shadow",
                "atmosphere": "melancholic, reflective, quietly emotional",
                "lighting": "muted, soft shadows, twilight ambiance",
                "composition": "subtle, layered, deep perspective"
            },
            "neutral-high": {
                "scene": "modern, clean environment with structured energy",
                "atmosphere": "focused, balanced, steadily active",
                "lighting": "clear, even lighting, crisp definition",
                "composition": "geometric, organized, rhythmic patterns"
            },
            "neutral-low": {
                "scene": "minimalist, tranquil space with quiet presence",
                "atmosphere": "meditative, still, peacefully neutral",
                "lighting": "soft, ambient, gentle gradients",
                "composition": "simple, spacious, zen-like balance"
            }
        }
        
        mood_key = f"{sentiment}-{energy}"
        template = prompt_templates.get(mood_key, prompt_templates["neutral-low"])
        
        # Build comprehensive prompt from analysis
        prompt_parts = []
        
        # 1. Main scene description
        prompt_parts.append(template["scene"])
        
        # 2. Color palette integration
        if color_descriptions:
            prompt_parts.append(f"dominant colors: {color_descriptions}")
        
        # 3. Atmospheric mood
        prompt_parts.append(template["atmosphere"])
        
        # 4. Emotional context
        if dominant_emotion:
            emotion_descriptors = {
                "joy": "radiating happiness and light",
                "sadness": "tinged with melancholy and depth",
                "anger": "charged with intense energy",
                "fear": "mysterious and ethereal",
                "surprise": "filled with wonder and discovery",
                "disgust": "edgy and provocative"
            }
            if dominant_emotion in emotion_descriptors:
                prompt_parts.append(emotion_descriptors[dominant_emotion])
        
        # 5. Lighting and composition
        prompt_parts.append(template["lighting"])
        prompt_parts.append(template["composition"])
        
        # 6. Art style integration
        art_style_descriptors = {
            "circles": "featuring flowing circular forms, organic bubbles, soft rounded shapes",
            "sharp": "with angular geometric patterns, crystalline structures, bold edges",
            "organic": "incorporating natural flowing forms, fluid shapes, biomorphic elements"
        }
        if art_style in art_style_descriptors:
            prompt_parts.append(art_style_descriptors[art_style])
        
        # 7. Music mood influence (adds movement/texture)
        music_style_elements = {
            "uplifting": "with ascending motion, light particles, ethereal wisps floating upward",
            "soothing": "with gentle waves, soft textures, calming ripples",
            "balanced": "with rhythmic patterns, harmonious elements, steady flow"
        }
        if music_mood in music_style_elements:
            prompt_parts.append(music_style_elements[music_mood])
        
        # 8. Keywords integration (if available)
        if keywords:
            keyword_text = ", ".join(keywords[:3])
            prompt_parts.append(f"symbolizing themes of {keyword_text}")
        
        # 9. Quality and style parameters
        quality_params = "digital art, highly detailed, professional artwork, cinematic lighting, masterpiece quality, 8k resolution, trending on artstation"
        
        # Combine all parts
        full_prompt = ", ".join(prompt_parts) + f", {quality_params}"
        
        return full_prompt
    
    def _describe_color_palette(self, hex_colors: List[str]) -> str:
        """Convert hex colors to descriptive color names for prompts"""
        if not hex_colors:
            return ""
        
        color_names = []
        for hex_color in hex_colors[:4]:  # Use first 4 colors
            color_name = self._hex_to_color_name(hex_color)
            if color_name:
                color_names.append(color_name)
        
        return " and ".join(color_names) if color_names else ""
    
    def _hex_to_color_name(self, hex_color: str) -> str:
        """Convert hex color to descriptive name"""
        try:
            hex_color = hex_color.lstrip('#')
            
            r = int(hex_color[0:2], 16)
            g = int(hex_color[2:4], 16)
            b = int(hex_color[4:6], 16)
            
            max_val = max(r, g, b)
            min_val = min(r, g, b)
            
            # Grayscale check
            if max_val - min_val < 30:
                if max_val > 200:
                    return "bright white"
                elif max_val > 150:
                    return "soft gray"
                elif max_val > 100:
                    return "medium gray"
                else:
                    return "deep charcoal"
            
            # Color hue determination
            if r > g and r > b:
                if r > 200 and g < 100:
                    return "vibrant red" if max_val > 220 else "warm crimson"
                elif r > 200 and g > 150:
                    return "coral pink" if b < 150 else "soft rose"
                else:
                    return "burnt orange" if g > b else "rusty red"
            
            elif g > r and g > b:
                if g > 200 and r < 100:
                    return "bright green" if b < 100 else "mint green"
                elif g > 200 and b > 150:
                    return "cyan blue" if b > g else "turquoise"
                else:
                    return "forest green" if r < b else "olive green"
            
            elif b > r and b > g:
                if b > 200 and r < 100:
                    return "electric blue" if g < 100 else "sky blue"
                elif b > 200 and r > 150:
                    return "lavender purple" if r > g else "violet"
                else:
                    return "navy blue" if r < g else "indigo"
            
            else:
                if r > 150 and g > 150 and b < 100:
                    return "golden yellow"
                elif r > 150 and b > 150:
                    return "magenta"
                else:
                    return "earthy tone"
                    
        except Exception as e:
            print(f"Error parsing color {hex_color}: {e}")
            return "colorful"
        
    async def generate_with_cloudflare(self, mood_analysis: Dict[str, Any]) -> Optional[str]:
        """Generate image using Cloudflare AI - DreamShaper-8-LCM"""
        cloudflare_account_id = os.getenv("CLOUDFLARE_ACCOUNT_ID", "")
        cloudflare_api_token = os.getenv("CLOUDFLARE_API_TOKEN", "")
        
        if not cloudflare_account_id or not cloudflare_api_token:
            print("⚠️ Cloudflare AI credentials not configured")
            return None
        
        try:
            prompt = self._build_prompt_from_mood(mood_analysis)
            print(f"🎨 Generating Cloudflare AI image with prompt: {prompt[:100]}...")
            
            # Cloudflare AI API endpoint
            API_URL = f"https://api.cloudflare.com/client/v4/accounts/{cloudflare_account_id}/ai/run/@cf/lykon/dreamshaper-8-lcm"
            
            headers = {
                "Authorization": f"Bearer {cloudflare_api_token}",
                "Content-Type": "application/json"
            }
            
            # DreamShaper-8-LCM parameters
            payload = {
                "prompt": prompt,
                "negative_prompt": "ugly, blurry, low quality, distorted, deformed, bad anatomy, extra limbs",
                "num_steps": 8,  # LCM optimized for 4-8 steps
                "guidance": 1.5,  # Lower guidance for LCM
                "strength": 1.0
            }
            
            print(f"📊 Request payload: {payload}")
            
            response = requests.post(API_URL, headers=headers, json=payload, timeout=30)
            
            print(f"🔍 Cloudflare response status: {response.status_code}")
            
            if response.status_code == 200:
                # Cloudflare returns binary image data
                import base64
                
                image_bytes = response.content
                image_base64 = base64.b64encode(image_bytes).decode('utf-8')
                image_data_url = f"data:image/png;base64,{image_base64}"
                
                print(f"✅ Cloudflare AI image generated (size: {len(image_bytes)} bytes)")
                return image_data_url
            else:
                error_text = response.text
                print(f"❌ Cloudflare AI error: {response.status_code}")
                print(f"   Response: {error_text[:200]}")
                return None
                
        except Exception as e:
            print(f"❌ Cloudflare AI image generation failed: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    async def generate_with_huggingface(self, mood_analysis: Dict[str, Any]) -> Optional[str]:
        """Generate image using Hugging Face Stable Diffusion with retry logic"""
        if not self.hf_api_key:
            print("⚠️ Hugging Face API key not configured")
            return None
        
        try:
            prompt = self._build_prompt_from_mood(mood_analysis)
            print(f"🎨 Generating HF image with prompt: {prompt[:100]}...")
            
            API_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0"
            headers = {"Authorization": f"Bearer {self.hf_api_key}"}
            
            payload = {
                "inputs": prompt,
                "parameters": {
                    "negative_prompt": "ugly, blurry, low quality, distorted, deformed",
                    "num_inference_steps": 30,
                }
            }
            
            # Retry logic for 503 (model loading)
            max_retries = 3
            retry_delay = 20  # seconds
            
            for attempt in range(max_retries):
                response = requests.post(API_URL, headers=headers, json=payload, timeout=90)
                
                if response.status_code == 200:
                    import base64
                    
                    image_bytes = response.content
                    image_base64 = base64.b64encode(image_bytes).decode('utf-8')
                    image_data_url = f"data:image/png;base64,{image_base64}"
                    
                    print(f"✅ HuggingFace image generated (attempt {attempt + 1})")
                    return image_data_url
                
                elif response.status_code == 503:
                    # Model is loading
                    if attempt < max_retries - 1:
                        print(f"⏳ Model loading... retrying in {retry_delay}s (attempt {attempt + 1}/{max_retries})")
                        import time
                        time.sleep(retry_delay)
                        retry_delay += 10  # Increase delay for next retry
                    else:
                        print(f"❌ HuggingFace timeout: Model still loading after {max_retries} attempts")
                        return None
                
                else:
                    print(f"❌ HuggingFace API error: {response.status_code}")
                    print(f"   Response: {response.text[:200]}")
                    return None
            
            return None
                
        except Exception as e:
            print(f"❌ HuggingFace image generation failed: {e}")
            return None
        
    async def generate_mood_image(
        self, 
        mood_analysis: Dict[str, Any],
        provider: str = "auto"
    ) -> Optional[Dict[str, Any]]:
        """
        Generate mood-based image using available provider
        
        Args:
            mood_analysis: Mood analysis result
            provider: "cloudflare", "huggingface", "canvas", or "auto"
        
        Returns:
            Dict with image_url and metadata, or fallback indicator
        """
        # If explicitly requesting canvas fallback
        if provider == "canvas":
            return {
                "image_url": None,
                "provider": "canvas",
                "use_canvas_fallback": True,
                "prompt": self._build_prompt_from_mood(mood_analysis),
                "sentiment": mood_analysis.get("sentiment"),
                "energy": mood_analysis.get("energy_level")
            }
        
        image_url = None
        used_provider = None
        
        # Try Cloudflare AI first (fast and free)
        if provider == "cloudflare" or (provider == "auto" and self.cloudflare_account_id and self.cloudflare_api_token):
            image_url = await self.generate_with_cloudflare(mood_analysis)
            used_provider = "cloudflare"
        
        # Fallback to Hugging Face
        if not image_url and (provider == "huggingface" or (provider == "auto" and self.hf_api_key)):
            image_url = await self.generate_with_huggingface(mood_analysis)
            used_provider = "huggingface"
        
        if not image_url:
            print("⚠️ All AI image providers failed, using canvas fallback")
            return {
                "image_url": None,
                "provider": "canvas",
                "use_canvas_fallback": True,
                "prompt": self._build_prompt_from_mood(mood_analysis),
                "sentiment": mood_analysis.get("sentiment"),
                "energy": mood_analysis.get("energy_level")
            }
        
        return {
            "image_url": image_url,
            "provider": used_provider,
            "use_canvas_fallback": False,
            "prompt": self._build_prompt_from_mood(mood_analysis),
            "sentiment": mood_analysis.get("sentiment"),
            "energy": mood_analysis.get("energy_level")
        }


# Global instance
image_service = ImageGenerationService()