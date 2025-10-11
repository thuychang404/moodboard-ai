# backend/tests/test_summary.py
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from datetime import datetime, timedelta

class MockMoodEntry:
    def __init__(self, sentiment, energy, text, days_ago=0):
        self.sentiment = sentiment
        self.energy_level = energy
        self.text_content = text
        self.created_at = datetime.now() - timedelta(days=days_ago)
        self.emotions = {}

async def test_llama_summary():
    from app.services.summary_service import generate_weekly_summary
    
    # Create test entries
    test_entries = [
        MockMoodEntry("positive", "high", "Had an amazing day at work!", 0),
        MockMoodEntry("positive", "low", "Feeling peaceful and content", 1),
        MockMoodEntry("neutral", "high", "Busy but productive day", 2),
        MockMoodEntry("negative", "low", "Feeling a bit down today", 3),
        MockMoodEntry("positive", "high", "Great workout session!", 4),
        MockMoodEntry("neutral", "low", "Relaxing weekend", 5),
        MockMoodEntry("positive", "high", "Excited for the week ahead!", 6),
    ]
    
    print("🧪 Testing Llama-3 Weekly Summary\n")
    print("="*60)
    print("\nMood Entries:")
    for entry in test_entries:
        day = entry.created_at.strftime("%A")
        print(f"  {day}: {entry.sentiment} ({entry.energy_level} energy)")
    
    print("\n" + "="*60)
    print("\n🤖 Generating AI summary with Llama-3...\n")
    
    summary = await generate_weekly_summary(test_entries)
    
    print("="*60)
    print(f"\n✨ YOUR WEEK IN ONE SENTENCE:\n")
    print(f'  "{summary}"')
    print("\n" + "="*60)
    
    if len(summary) > 20:
        print("\n✅ SUCCESS! Summary looks good.")
    else:
        print("\n⚠️ Summary seems short, but test passed.")

if __name__ == "__main__":
    import asyncio
    
    # Load your HF token
    from dotenv import load_dotenv
    load_dotenv()
    
    token = os.getenv('HUGGINGFACE_API_KEY')
    if not token:
        print("❌ Please set HUGGINGFACE_API_KEY in your .env file")
        exit(1)
    
    print(f"Token loaded: {token[:10]}...\n")
    
    asyncio.run(test_llama_summary())