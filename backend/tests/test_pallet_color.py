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
        "low":  ['#DDD', '#AAA', '#888', '#666', '#444']
    }
}

sentiment_result = {"sentiment": "positive", "energy": "high"}
sentiment_result2 = {"sentiment": "negative", "energy": "low"}
sentiment_result3 = {"sentiment": "angry", "energy": "high"}
# Example usage

a=sentiment_result3["sentiment"]  # "positive"
b=sentiment_result3["energy"]    # "high"

color_palette = palettes.get(sentiment_result3["sentiment"], palettes["neutral"]).get(sentiment_result3.get("energy", "low"), palettes["neutral"]["low"])
print(color_palette)  # Output: ['#FF6B6B', '#FFE66D', '#FF8E53', '#FF6B9D', '#4ECDC4']