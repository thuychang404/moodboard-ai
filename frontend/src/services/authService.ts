const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

class AuthService {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        detail: `HTTP ${response.status}: ${response.statusText}` 
      }));
      throw new Error(error.detail || `Request failed with status ${response.status}`);
    }
    return response.json();
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const formData = new FormData();
    formData.append('username', email); // FastAPI OAuth2 expects 'username'
    formData.append('password', password);

    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      body: formData,
    });

    const data = await this.handleResponse<LoginResponse>(response);
    
    // Store auth data
    localStorage.setItem('auth_token', data.access_token);
    localStorage.setItem('user_data', JSON.stringify(data.user));
    
    return data;
  }

  async register(userData: {
    username: string;
    email: string;
    password: string;
    full_name?: string;
  }): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    return this.handleResponse<User>(response);
  }

  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: this.getAuthHeaders(),
    });

    return this.handleResponse<User>(response);
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    }
  }

  getAuthState(): AuthState {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    
    if (!token || !userData) {
      return {
        isAuthenticated: false,
        user: null,
        token: null
      };
    }

    try {
      const user = JSON.parse(userData);
      return {
        isAuthenticated: true,
        user,
        token
      };
    } catch (error) {
      // Clear corrupted data
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      return {
        isAuthenticated: false,
        user: null,
        token: null
      };
    }
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    return !!token;
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  // Check if token is expired (basic check)
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      // Basic JWT parsing (without verification for client-side check)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  // Refresh auth state by fetching current user
  async refreshAuthState(): Promise<AuthState> {
    if (!this.isAuthenticated() || this.isTokenExpired()) {
      this.logout();
      return this.getAuthState();
    }

    try {
      const user = await this.getCurrentUser();
      localStorage.setItem('user_data', JSON.stringify(user));
      return {
        isAuthenticated: true,
        user,
        token: this.getToken()
      };
    } catch (error) {
      // Token is invalid, clear auth data
      this.logout();
      return this.getAuthState();
    }
  }
}

export const authService = new AuthService();