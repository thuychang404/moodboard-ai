# backend/app/services/summary_service.py
import os
import requests
from typing import List
from dotenv import load_dotenv

load_dotenv()

# FREE Hugging Face Inference Router for Llama-3
HF_API_KEY = os.getenv("HUGGINGFACE_API_KEY", "")
LLAMA_API_URL = "https://router.huggingface.co/v1/chat/completions"

async def generate_weekly_summary(mood_entries: List) -> str:
    """
    Generate a one-sentence weekly mood summary using FREE Meta-Llama-3-8B
    """
    if not mood_entries:
        return "No mood data available for summary."
    
    # Prepare mood data
    mood_summary = []
    sentiments = []
    energies = []
    
    for entry in mood_entries:
        day = entry.created_at.strftime("%A")
        sentiment = entry.sentiment or "neutral"
        energy = entry.energy_level or "calm"
        
        sentiments.append(sentiment)
        energies.append(energy)
        mood_summary.append(f"{day}: {sentiment} mood, {energy} energy")
    
    # Count patterns
    positive_count = sentiments.count("positive")
    negative_count = sentiments.count("negative")
    neutral_count = sentiments.count("neutral")
    high_energy = energies.count("high")
    
    mood_text = "\n".join(mood_summary[:7])  # Last 7 days
    
    try:
        if not HF_API_KEY:
            print("⚠️ No Hugging Face API key, using fallback")
            return generate_fallback_summary(mood_entries)
        
        headers = {
            "Authorization": f"Bearer {HF_API_KEY}",
            "Content-Type": "application/json"
        }
        
        # Llama-3 chat format
        payload = {
            "model": "meta-llama/Meta-Llama-3-8B-Instruct",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a compassionate emotional wellness assistant. Write warm, encouraging, concise summaries."
                },
                {
                    "role": "user",
                    "content": f"""Summarize this person's emotional week in EXACTLY ONE sentence (max 50 words). Be warm and encouraging.
Week overview: {mood_text} 
Stats: {positive_count} positive days, {negative_count} negative days, {neutral_count} neutral days, {high_energy} high energy days.
Write ONE encouraging sentence summarizing their week:"""
                }
            ],
            "max_tokens": 60,
            "temperature": 0.8,
            "top_p": 0.9
        }
        
        response = requests.post(LLAMA_API_URL, headers=headers, json=payload, timeout=30)
        
        print(f"🔍 Llama API Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"🔍 Llama Response: {result}")
            
            # Extract the message from Llama's response
            if "choices" in result and len(result["choices"]) > 0:
                message = result["choices"][0].get("message", {})
                summary = message.get("content", "").strip()
                
                # Clean up the summary
                summary = summary.replace("This person", "You")
                summary = summary.replace("this person", "you")
                summary = summary.replace("their", "your")
                summary = summary.replace("Their", "Your")
                summary = summary.strip('"').strip("'").strip()
                
                # Ensure proper ending
                if summary and not summary.endswith(('.', '!', '?')):
                    summary += '.'
                
                # Validate length
                if summary and 15 < len(summary) < 400:
                    print(f"✅ Llama-3 summary generated: {summary}")
                    return summary
                else:
                    print(f"⚠️ Summary length invalid: {len(summary)} chars")
            
            print("⚠️ Invalid response format, using fallback")
            return generate_fallback_summary(mood_entries)
        
        elif response.status_code == 503:
            print("⏳ Llama model is loading, using fallback")
            return generate_fallback_summary(mood_entries)
        
        else:
            print(f"⚠️ Llama API error {response.status_code}: {response.text}")
            return generate_fallback_summary(mood_entries)
    
    except Exception as e:
        print(f"❌ Llama summary generation failed: {e}")
        return generate_fallback_summary(mood_entries)


def generate_fallback_summary(mood_entries: List) -> str:
    """Enhanced fallback summary - sounds natural and personalized!"""
    import random
    
    sentiments = [e.sentiment for e in mood_entries if e.sentiment]
    energies = [e.energy_level for e in mood_entries if e.energy_level]
    
    if not sentiments:
        return "Your week was full of experiences worth reflecting on."
    
    positive_count = sentiments.count("positive")
    negative_count = sentiments.count("negative")
    high_energy_count = energies.count("high")
    
    total = len(sentiments)
    positive_ratio = positive_count / total
    negative_ratio = negative_count / total
    energy_ratio = high_energy_count / len(energies) if energies else 0.5
    
    # Creative summaries based on mood patterns
    if positive_ratio > 0.75:
        if energy_ratio > 0.6:
            summaries = [
                "Your week sparkled with positive energy and enthusiastic momentum.",
                "A vibrant week full of joy, excitement, and uplifting moments.",
                "You radiated positivity this week, riding waves of high energy and happiness."
            ]
        else:
            summaries = [
                "A peacefully positive week filled with contentment and gentle joy.",
                "Your week glowed with quiet happiness and serene contentment.",
                "Calm positivity defined your week, with peaceful moments of gratitude."
            ]
    
    elif negative_ratio > 0.75:
        if energy_ratio > 0.6:
            summaries = [
                "This week brought intense challenges that you faced head-on with strength.",
                "A powerful week of processing difficult emotions with courage and resilience.",
                "You navigated turbulent waters this week, showing remarkable emotional strength."
            ]
        else:
            summaries = [
                "A reflective week of processing emotions, showing your emotional awareness.",
                "You moved through this challenging week with grace and self-compassion.",
                "A gentle week of healing, allowing yourself space to feel and process."
            ]
    
    elif positive_ratio > negative_ratio + 0.2:
        summaries = [
            "Your week leaned toward the bright side, with more smiles than struggles.",
            "A balanced week that tilted positive, with hope outweighing the challenges.",
            "You found more light than shadow this week, celebrating small victories."
        ]
    
    elif negative_ratio > positive_ratio + 0.2:
        summaries = [
            "This week asked a lot of you, and you showed up for yourself.",
            "A challenging week where you practiced resilience and self-care.",
            "You weathered some storms this week with admirable emotional awareness."
        ]
    
    else:
        summaries = [
            "A balanced week of varied emotions, each moment teaching you something valuable.",
            "Your week was a tapestry of different feelings, all equally valid and meaningful.",
            "You experienced the full spectrum of emotions this week, embracing each one.",
            "A wonderfully human week of ups and downs, growth and reflection."
        ]
    
    return random.choice(summaries)