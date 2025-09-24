const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export interface MoodAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  sentiment_confidence: number;
  energy_level: 'high' | 'low';
  emotions: { [key: string]: number };
  keywords: string[];
  color_palette: string[];
  art_style: 'circles' | 'sharp' | 'organic';
  music_mood: 'uplifting' | 'soothing' | 'balanced';
  ai_insight: string;
}

class MoodService {
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        detail: `HTTP ${response.status}: ${response.statusText}` 
      }));
      throw new Error(error.detail || `Request failed with status ${response.status}`);
    }
    return response.json();
  }

  async analyzeMood(text: string): Promise<MoodAnalysis> {
    const response = await fetch(`${API_BASE_URL}/api/moods/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    return this.handleResponse<MoodAnalysis>(response);
  }

  async checkHealth(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/health`);
    return this.handleResponse(response);
  }

  getMoodEmoji(analysis: MoodAnalysis): string {
    const { sentiment, energy_level } = analysis;
    const emojiMap = {
      'positive-high': '😄',
      'positive-low': '😊',
      'negative-high': '😤',
      'negative-low': '😔',
      'neutral-high': '😐',
      'neutral-low': '😴'
    };
    return emojiMap[`${sentiment}-${energy_level}` as keyof typeof emojiMap] || '🙂';
  }
}

export const moodService = new MoodService();