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

export interface MoodHistoryEntry {
  id: number;
  text_content: string;
  sentiment: string | null;
  sentiment_confidence: number | null;
  energy_level: string | null;
  emotions: { [key: string]: number } | null;
  keywords: string[] | null;
  color_palette: string[] | null;
  art_style: string | null;
  music_mood: string | null;
  ai_insight: string | null;
  created_at: string;
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

  // PUBLIC: Analyze mood without authentication (not saved)
  async analyzeMoodPublic(text: string): Promise<MoodAnalysis> {
    const response = await fetch(`${API_BASE_URL}/api/moods/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    return this.handleResponse<MoodAnalysis>(response);
  }

  // AUTHENTICATED: Analyze mood and save to user's history
  async analyzeMoodAndSave(text: string): Promise<MoodAnalysis> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}/api/moods/analyze-and-save`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ text }),
    });
    return this.handleResponse<MoodAnalysis>(response);
  }

  // AUTHENTICATED: Get mood history
  async getMoodHistory(limit: number = 20, skip: number = 0): Promise<MoodHistoryEntry[]> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}/api/moods/history?limit=${limit}&skip=${skip}`, {
      headers: { 
        'Authorization': `Bearer ${token}`
      },
    });
    return this.handleResponse<MoodHistoryEntry[]>(response);
  }

  // AUTHENTICATED: Get mood statistics
  async getMoodStats(): Promise<any> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}/api/moods/stats`, {
      headers: { 
        'Authorization': `Bearer ${token}`
      },
    });
    return this.handleResponse<any>(response);
  }

  // AUTHENTICATED: Delete mood entry
  async deleteMoodEntry(entryId: number): Promise<void> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(`${API_BASE_URL}/api/moods/entry/${entryId}`, {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${token}`
      },
    });
    await this.handleResponse<any>(response);
  }

  // Convenience method: Auto-choose public vs authenticated
  async analyzeMood(text: string, saveToHistory: boolean = false): Promise<MoodAnalysis> {
    const isAuthenticated = !!localStorage.getItem('auth_token');
    
    if (saveToHistory && isAuthenticated) {
      return this.analyzeMoodAndSave(text);
    } else {
      return this.analyzeMoodPublic(text);
    }
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

  // Helper to check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }
}

export const moodService = new MoodService();