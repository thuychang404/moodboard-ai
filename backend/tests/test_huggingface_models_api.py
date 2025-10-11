# test_hf_working.py
import requests

token = 'my-huggingface-token'  # Your actual token

# List of FREE models to try (in order of reliability)
models = [
    "google/flan-t5-base",  # Very reliable, always works
    # "facebook/bart-large-cnn",  # Good for summarization
    "mistralai/Mistral-7B-Instruct-v0.1",  # Note: v0.1 not v0.2
    "meta-llama/Meta-Llama-3-8B-Instruct",  # Requires gated access
]

def test_model(model_name, token):
    print(f"\n🧪 Testing: {model_name}")
    print("-" * 50)
    
    url = f"https://api-inference.huggingface.co/models/{model_name}"
    
    headers = {'Authorization': f'Bearer {token}'}
    payload1 = {
        'inputs': 'Summarize this in one sentence: I had a great day today, feeling happy and energized!',
        'parameters': {
            'max_new_tokens': 60,
            'temperature': 0.7
        }
    }
    payload2 = {
        'inputs': 'Summarize this in one sentence: I had a great day today, feeling happy and energized!',
        'parameters': {
            'max_length': 60, # Flan-T5 uses max_length not max_new_tokens
            'temperature': 0.7
        }
    }
    
    try:
        if model_name.startswith("google/flan-t5"):
            payload = payload2
            print("Using payload for Flan-T5")
        else:
            payload = payload1
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            try:
                result = response.json()
                print(f"✅ SUCCESS!")
                print(f"Response: {result}")
                return True
            except:
                print(f"✅ SUCCESS but response is text:")
                print(f"Response: {response.text}")
                return True
                
        elif response.status_code == 503:
            print(f"⏳ Model is loading... wait 20s and try again")
            return False
            
        elif response.status_code == 404:
            print(f"❌ Model not found or not accessible")
            print(f"Response: {response.text}")
            return False
            
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("⏱️ Request timeout - model might be loading")
        return False
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

# Test all models
print("Testing Hugging Face API with multiple models...")
print(f"Token: {token[:10]}...")

for model in models:
    if test_model(model, token):
        print(f"\n🎉 Found working model: {model}")
        break
else:
    print("\n⚠️ None of the models worked. Checking token validity...")
    
    # Test with a simple public model (no auth needed)
    response = requests.post(
        "https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english",
        headers={'Authorization': f'Bearer {token}'},
        json={'inputs': 'I love this!'}
    )
    
    if response.status_code == 401:
        print("❌ Your token is INVALID. Please check:")
        print("1. Go to https://huggingface.co/settings/tokens")
        print("2. Create a new token with 'read' access")
        print("3. Make sure you copied it correctly")
    else:
        print(f"Token seems valid (status: {response.status_code})")
        print("The text generation models might be gated or loading.")