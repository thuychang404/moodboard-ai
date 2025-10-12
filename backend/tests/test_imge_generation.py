# backend/tests/simple_image_test.py
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.image_service import image_service

# Simple test mood data
TEST_MOOD = {
    "sentiment": "positive",
    "energy_level": "high",
    "color_palette": ["#FF6B6B", "#FFE66D", "#FF8E53"],
    "art_style": "circles",
    "music_mood": "uplifting",
    "keywords": ["happy", "excited"],
    "emotions": {"joy": 0.9}
}

async def test_cloudflare():
    """Test Cloudflare AI"""
    print("\n🔹 Testing Cloudflare AI (DreamShaper-8-LCM)...")
    try:
        result = await image_service.generate_with_cloudflare(TEST_MOOD)
        if result:
            print("   ✅ Cloudflare AI works!")
            return True
        else:
            print("   ❌ Cloudflare AI failed (no image returned)")
            return False
    except Exception as e:
        print(f"   ❌ Cloudflare AI error: {str(e)}")
        return False

async def test_huggingface():
    """Test Hugging Face"""
    print("\n🔹 Testing Hugging Face...")
    try:
        result = await image_service.generate_with_huggingface(TEST_MOOD)
        if result:
            print("   ✅ Hugging Face works!")
            return True
        else:
            print("   ❌ Hugging Face failed (no image returned)")
            return False
    except Exception as e:
        print(f"   ❌ Hugging Face error: {str(e)}")
        return False

async def main():
    print("="*50)
    print("  AI IMAGE MODEL TEST")
    print("="*50)
    
    # Check API keys
    print("\n📋 API Key Status:")
    cloudflare_configured = image_service.cloudflare_account_id and image_service.cloudflare_api_token
    print(f"   Cloudflare AI: {'✅ Configured' if cloudflare_configured else '❌ Not configured'}")
    print(f"   Hugging Face: {'✅ Configured' if image_service.hf_api_key else '❌ Not configured'}")

    # Run tests
    print("\n" + "="*50)
    print("  RUNNING TESTS")
    print("="*50)
    
    results = []
    
    # Test each provider
    if cloudflare_configured:
        results.append(("Cloudflare AI", await test_cloudflare()))
    else:
        print("\n🔹 Skipping Cloudflare AI (no API credentials)")
        results.append(("Cloudflare AI", None))
    
    if image_service.hf_api_key:
        results.append(("Hugging Face", await test_huggingface()))
    else:
        print("\n🔹 Skipping Hugging Face (no API key)")
        results.append(("Hugging Face", None))
    
    # Summary
    print("\n" + "="*50)
    print("  RESULTS SUMMARY")
    print("="*50)
    
    for provider, result in results:
        if result is True:
            print(f"   ✅ {provider}: WORKING")
        elif result is False:
            print(f"   ❌ {provider}: FAILED")
        else:
            print(f"   ⏭️  {provider}: SKIPPED (no API key)")
    
    working = sum(1 for _, r in results if r is True)
    total = len([r for _, r in results if r is not None])
    
    print(f"\n   {working}/{total} providers working")
    
    if working == 0:
        print("\n⚠️  Add API keys to backend/.env:")
        print("   CLOUDFLARE_ACCOUNT_ID=your_account_id")
        print("   CLOUDFLARE_API_TOKEN=your_token")
        print("   HUGGINGFACE_API_KEY=hf_...")
    
    print("\n" + "="*50)

if __name__ == "__main__":
    asyncio.run(main())