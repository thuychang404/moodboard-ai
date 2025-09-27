import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Mic, Palette, Music, Brain, Download, AlertCircle, CheckCircle, Sparkles, LogOut, User as UserIcon, History, BarChart3, Save } from 'lucide-react';
import { moodService, MoodAnalysis, MoodHistoryEntry } from './services/moodService';
import { authService, User, AuthState } from './services/authService';
import { GlassCard } from './components/GlassCard';
import { AnimatedBackground } from './components/AnimatedBackground';
import { LoadingSpinner } from './components/LoadingSpinner';
import AuthComponent from './components/AuthComponent';
import confetti from 'canvas-confetti';

interface MoodEntry {
  id: number;
  text: string;
  analysis: MoodAnalysis;
  timestamp: string;
}

const generateAbstractArt = (canvas: HTMLCanvasElement, analysis: MoodAnalysis) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  const width = canvas.width;
  const height = canvas.height;
  const { color_palette, art_style, energy_level } = analysis;
  
  ctx.clearRect(0, 0, width, height);
  
  // Create animated gradient background
  const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height)/2);
  gradient.addColorStop(0, color_palette[0] + '40');
  gradient.addColorStop(0.7, color_palette[1] + '20');
  gradient.addColorStop(1, color_palette[2] + '10');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Generate shapes based on mood
  const shapeCount = energy_level === 'high' ? 20 : 12;
  
  for (let i = 0; i < shapeCount; i++) {
    ctx.globalAlpha = Math.random() * 0.8 + 0.2;
    ctx.fillStyle = color_palette[Math.floor(Math.random() * color_palette.length)];
    
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 80 + 20;
    
    if (art_style === 'circles') {
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    } else if (art_style === 'sharp') {
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let j = 0; j < 6; j++) {
        const angle = (j / 6) * Math.PI * 2;
        const radius = size + Math.random() * 40;
        ctx.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
      }
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.ellipse(x, y, size, size * (0.4 + Math.random() * 0.4), Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  ctx.globalAlpha = 1;
};

const MoodBoardAI: React.FC = () => {
  // Authentication state
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null
  });
  const [showAuth, setShowAuth] = useState(false);
  
  // Mood analysis state
  const [entry, setEntry] = useState('');
  const [analysis, setAnalysis] = useState<MoodAnalysis | null>(null);
  const [entries, setEntries] = useState<MoodEntry[]>([]); // Temporary storage for non-authenticated users
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [saveToHistory, setSaveToHistory] = useState(false); // Toggle for saving
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Personal features (authenticated only)
  const [moodHistory, setMoodHistory] = useState<MoodHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Initialize auth state on component mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentAuthState = await authService.refreshAuthState();
        setAuthState(currentAuthState);
        
        // If authenticated, load mood history
        if (currentAuthState.isAuthenticated) {
          loadMoodHistory();
        }
      } catch (error) {
        console.error('Failed to initialize auth state:', error);
      }
    };

    initializeAuth();
    
    // Test backend connection
    const testConnection = async () => {
      try {
        await moodService.checkHealth();
        console.log('✅ Backend connected');
      } catch (err) {
        setError('Backend connection failed. Make sure server is running on http://localhost:8000');
      }
    };
    testConnection();
  }, []);

  const loadMoodHistory = async () => {
    try {
      const history = await moodService.getMoodHistory(10);
      setMoodHistory(history);
    } catch (error) {
      console.error('Failed to load mood history:', error);
    }
  };

  const handleLogin = (user: User) => {
    setAuthState({
      isAuthenticated: true,
      user,
      token: authService.getToken()
    });
    loadMoodHistory(); // Load history after login
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      setAuthState({
        isAuthenticated: false,
        user: null,
        token: null
      });
      setMoodHistory([]); // Clear history
      setSaveToHistory(false); // Reset save toggle
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleAnalyze = async () => {
    if (!entry.trim()) {
      setError('Please enter some text to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Use the appropriate endpoint based on authentication and save preference
      const moodAnalysis = await moodService.analyzeMood(entry.trim(), authState.isAuthenticated && saveToHistory);
      setAnalysis(moodAnalysis);

      // For non-authenticated users or when not saving, store locally
      if (!authState.isAuthenticated || !saveToHistory) {
        const newEntry: MoodEntry = {
          id: Date.now(),
          text: entry.trim(),
          analysis: moodAnalysis,
          timestamp: new Date().toISOString()
        };
        setEntries(prev => [newEntry, ...prev.slice(0, 4)]);
      } else {
        // If authenticated and saving, reload history
        loadMoodHistory();
      }

      setShowSuccess(true);

      // Celebration confetti for positive moods
      if (moodAnalysis.sentiment === 'positive') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: moodAnalysis.color_palette
        });
      }

      // Generate art
      setTimeout(() => {
        if (canvasRef.current) {
          generateAbstractArt(canvasRef.current, moodAnalysis);
        }
      }, 500);

      // Hide success message
      setTimeout(() => setShowSuccess(false), 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze mood');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadArtwork = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = `moodboard-${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      
      {/* Authentication Modal */}
      <AnimatePresence>
        {showAuth && (
          <AuthComponent 
            onLogin={handleLogin}
            onClose={() => setShowAuth(false)}
          />
        )}
      </AnimatePresence>
      
      <div className="relative z-10 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header with Auth */}
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* User Menu */}
            <div className="absolute top-0 right-0 z-20">
              {authState.isAuthenticated ? (
                <div className="flex items-center gap-2">
                  {/* Personal Features Buttons */}
                  <motion.button
                    onClick={() => setShowHistory(!showHistory)}
                    className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white p-3 rounded-full transition-all duration-300 border border-white/30"
                    title="Mood History"
                    whileHover={{ scale: 1.05 }}
                  >
                    <History size={18} />
                  </motion.button>

                  {/* User Info */}
                  <div className="flex items-center gap-4 bg-white/20 backdrop-blur-md rounded-full px-4 py-2 border border-white/30">
                    <div className="flex items-center gap-2 text-white">
                      <UserIcon size={20} />
                      <span className="font-medium">
                        {authState.user?.full_name || authState.user?.username}
                      </span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-all duration-300"
                      title="Logout"
                    >
                      <LogOut size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuth(true)}
                  className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white px-6 py-3 rounded-full font-semibold transition-all duration-300 border border-white/30"
                >
                  Login for History & More
                </button>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 mb-6">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Brain className="text-white" size={48} />
              </motion.div>
              <h1 className="text-6xl font-bold text-white text-shadow">
                MoodBoard AI
              </h1>
              <Sparkles className="text-yellow-300 floating-element" size={32} />
            </div>
            <p className="text-xl text-white/90 font-medium">
              Transform your thoughts into beautiful art, insights, and experiences ✨
            </p>
            
            {/* Feature highlight */}
            {!authState.isAuthenticated && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-green-500/20 backdrop-blur-md border border-green-400/30 rounded-xl text-green-100"
              >
                <p>🎨 Try mood analysis now! Login to save history and access personal features.</p>
              </motion.div>
            )}
          </motion.div>

          {/* Success Message */}
          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className="mb-6 p-4 bg-green-500/20 backdrop-blur-md border border-green-400/30 rounded-xl flex items-center justify-center gap-2"
              >
                <CheckCircle className="text-green-300" size={20} />
                <span className="text-green-100 font-medium">
                  Mood analysis complete! {authState.isAuthenticated && saveToHistory ? 'Saved to your history 📊' : '🎉'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6 p-4 bg-red-500/20 backdrop-blur-md border border-red-400/30 rounded-xl flex items-center gap-2"
              >
                <AlertCircle className="text-red-300" size={20} />
                <span className="text-red-100">{error}</span>
                <button 
                  onClick={() => setError(null)}
                  className="ml-auto text-red-300 hover:text-red-100"
                >
                  ×
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Journal Entry */}
              <GlassCard>
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2 text-gray-800">
                  <Heart className="text-red-500" size={24} />
                  How are you feeling today?
                </h2>
                
                <div className="relative">
                  <textarea
                    value={entry}
                    onChange={(e) => setEntry(e.target.value)}
                    placeholder="Share your thoughts and feelings... Try: 'I'm excited about my new project but also feeling a bit nervous about the challenges ahead.'"
                    className="w-full h-36 p-4 bg-white/50 border-2 border-white/30 rounded-xl resize-none focus:border-purple-400 focus:outline-none focus:bg-white/70 transition-all duration-300 text-gray-800 placeholder-gray-500"
                  />
                  
                  {/* Microphone Button - Only for authenticated users */}
                  {authState.isAuthenticated && (
                    <button
                      onClick={() => setIsRecording(!isRecording)}
                      className={`absolute bottom-4 right-4 p-3 rounded-full transition-all duration-300 ${
                        isRecording 
                          ? 'bg-red-500 text-white animate-pulse shadow-lg' 
                          : 'bg-white/70 hover:bg-white/90 text-gray-600 hover:text-gray-800'
                      }`}
                      title="Voice Input (Premium Feature)"
                    >
                      <Mic size={18} />
                    </button>
                  )}
                </div>
                
                {/* Save to History Toggle - Only for authenticated users */}
                {authState.isAuthenticated && (
                  <div className="flex items-center gap-3 mt-4 p-3 bg-blue-50/80 rounded-xl">
                    <input
                      type="checkbox"
                      id="saveToHistory"
                      checked={saveToHistory}
                      onChange={(e) => setSaveToHistory(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="saveToHistory" className="text-blue-800 font-medium cursor-pointer flex items-center gap-2">
                      <Save size={16} />
                      Save to my mood history
                    </label>
                  </div>
                )}
                
                <motion.button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !entry.trim()}
                  className="w-full mt-6 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isAnalyzing ? (
                    <>
                      <LoadingSpinner size="sm" color="text-white" />
                      <span className="loading-dots">Analyzing</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      Generate MoodBoard
                    </>
                  )}
                </motion.button>
              </GlassCard>
              
              {/* Analysis Results */}
              <AnimatePresence>
                {analysis && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <GlassCard>
                      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-800">
                        <Brain className="text-purple-500" size={22} />
                        AI Analysis Results
                        <CheckCircle className="text-green-500" size={18} />
                      </h3>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <motion.div 
                          className="text-center p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl"
                          whileHover={{ scale: 1.05 }}
                        >
                          <div className="text-3xl mb-2">
                            {moodService.getMoodEmoji(analysis)}
                          </div>
                          <div className="text-sm font-medium text-gray-600">Sentiment</div>
                          <div className="text-lg font-bold capitalize text-gray-800">{analysis.sentiment}</div>
                          <div className="text-xs text-gray-500">
                            {Math.round(analysis.sentiment_confidence * 100)}% confident
                          </div>
                        </motion.div>
                        
                        <motion.div 
                          className="text-center p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl"
                          whileHover={{ scale: 1.05 }}
                        >
                          <div className="text-3xl mb-2">
                            {analysis.energy_level === 'high' ? '⚡' : '🕯️'}
                          </div>
                          <div className="text-sm font-medium text-gray-600">Energy</div>
                          <div className="text-lg font-bold capitalize text-gray-800">{analysis.energy_level}</div>
                          <div className="text-xs text-gray-500">
                            {analysis.art_style} style
                          </div>
                        </motion.div>
                      </div>

                      {analysis.keywords.length > 0 && (
                        <div>
                          <div className="text-sm font-medium text-gray-600 mb-3">Key Themes:</div>
                          <div className="flex flex-wrap gap-2">
                            {analysis.keywords.slice(0, 6).map((keyword, idx) => (
                              <motion.span
                                key={idx}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-medium"
                              >
                                {keyword}
                              </motion.span>
                            ))}
                          </div>
                        </div>
                      )}
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* AI Insights */}
              <AnimatePresence>
                {analysis?.ai_insight && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <GlassCard className="bg-gradient-to-br from-blue-50/90 to-indigo-100/90">
                      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-blue-800">
                        <Brain className="text-blue-600" size={22} />
                        Personal Insight
                        {authState.isAuthenticated && <span className="text-sm">for {authState.user?.full_name || authState.user?.username}</span>}
                      </h3>
                      <p className="text-blue-900 leading-relaxed text-lg">{analysis.ai_insight}</p>
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Right Column */}
            <div className="space-y-6">
              {/* Mood History - Only for authenticated users */}
              <AnimatePresence>
                {authState.isAuthenticated && showHistory && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.6 }}
                  >
                    <GlassCard>
                      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-800">
                        <History className="text-indigo-500" size={22} />
                        Your Mood History
                        <span className="text-sm text-gray-500">({moodHistory.length} entries)</span>
                      </h3>
                      
                      {moodHistory.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <History size={48} className="mx-auto mb-4 opacity-50" />
                          <p>No mood history yet. Start saving your moods to see patterns!</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {moodHistory.slice(0, 5).map((historyEntry, idx) => (
                            <motion.div
                              key={historyEntry.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className="p-3 bg-white/60 rounded-xl border border-white/30 hover:bg-white/80 transition-all"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-2xl">
                                    {historyEntry.sentiment === 'positive' ? '😊' : 
                                     historyEntry.sentiment === 'negative' ? '😔' : '😐'}
                                  </span>
                                  <span className="text-sm text-gray-600">
                                    {new Date(historyEntry.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex gap-1">
                                  {historyEntry.color_palette?.slice(0, 3).map((color, i) => (
                                    <div
                                      key={i}
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: color }}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-sm text-gray-700 line-clamp-2">
                                "{historyEntry.text_content?.slice(0, 100)}..."
                              </p>
                              <div className="mt-2 flex justify-between text-xs text-gray-500">
                                <span className="capitalize">{historyEntry.sentiment} • {historyEntry.energy_level} energy</span>
                                <span>{Math.round((historyEntry.sentiment_confidence || 0) * 100)}% confidence</span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Color Palette */}
              <AnimatePresence>
                {analysis?.color_palette && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                  >
                    <GlassCard>
                      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-800">
                        <Palette className="text-orange-500" size={22} />
                        AI-Generated Mood Palette
                      </h3>
                      
                      <div className="grid grid-cols-5 gap-3 mb-4">
                        {analysis.color_palette.map((color, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: idx * 0.1, type: "spring" }}
                            className="aspect-square rounded-xl shadow-lg border-2 border-white/50 hover:scale-110 transition-transform cursor-pointer relative overflow-hidden group"
                            style={{ backgroundColor: color }}
                            title={color}
                            whileHover={{ scale: 1.1 }}
                          >
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white text-xs font-mono">{color}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      
                      <div className="text-sm text-gray-600 bg-white/30 rounded-lg p-3">
                        <strong>Mood:</strong> {analysis.sentiment} • 
                        <strong> Energy:</strong> {analysis.energy_level} • 
                        <strong> Style:</strong> {analysis.music_mood}
                      </div>
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Generated Art */}
              <AnimatePresence>
                {analysis && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <GlassCard>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold flex items-center gap-2 text-gray-800">
                          <Palette className="text-pink-500" size={22} />
                          Generated Mood Art
                        </h3>
                        <motion.button
                          onClick={downloadArtwork}
                          className="p-2 bg-white/50 hover:bg-white/70 text-gray-700 hover:text-gray-900 rounded-lg transition-all duration-300 hover:shadow-md"
                          title="Download artwork"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Download size={18} />
                        </motion.button>
                      </div>
                      
                      <div className="relative">
                        <canvas
                          ref={canvasRef}
                          width={400}
                          height={300}
                          className="w-full border-2 border-white/30 rounded-xl bg-white/20 backdrop-blur-sm shadow-inner"
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
                      </div>
                      
                      <div className="text-sm text-gray-600 mt-3 bg-white/30 rounded-lg p-3 flex justify-between">
                        <span><strong>Art Style:</strong> {analysis.art_style}</span>
                        <span><strong>Mood Theme:</strong> {analysis.music_mood}</span>
                      </div>
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Music Mood Visualization */}
              <AnimatePresence>
                {analysis && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    <GlassCard>
                      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-800">
                        <Music className="text-green-500" size={22} />
                        Ambient Soundscape
                        {!authState.isAuthenticated && (
                          <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">
                            Login for Audio
                          </span>
                        )}
                      </h3>
                      
                      <div className="bg-gradient-to-br from-green-100/80 to-blue-100/80 backdrop-blur-sm rounded-xl p-6 text-center relative overflow-hidden">
                        {/* Animated background elements */}
                        <div className="absolute inset-0">
                          {[...Array(3)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="absolute rounded-full bg-white/20"
                              style={{
                                width: 60 + i * 20,
                                height: 60 + i * 20,
                                left: `${20 + i * 30}%`,
                                top: `${20 + i * 20}%`,
                              }}
                              animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.3, 0.6, 0.3],
                              }}
                              transition={{
                                duration: 2 + i,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                            />
                          ))}
                        </div>
                        
                        <div className="relative z-10">
                          <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <Music size={56} className="mx-auto mb-4 text-green-600" />
                          </motion.div>
                          
                          <div className="text-xl font-bold text-gray-800 mb-2">
                            {analysis.music_mood === 'uplifting' ? '🎵 Uplifting Melodies' : 
                             analysis.music_mood === 'soothing' ? '🎼 Soothing Harmonies' : '🎹 Balanced Tones'}
                          </div>
                          
                          <div className="text-gray-700 mb-4">
                            AI-curated soundscape: <strong className="text-green-700">{analysis.music_mood}</strong>
                          </div>
                          
                          <motion.button 
                            className={`px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 ${
                              authState.isAuthenticated 
                                ? 'bg-green-500 hover:bg-green-600 text-white' 
                                : 'bg-gray-400 cursor-not-allowed text-gray-200'
                            }`}
                            whileHover={authState.isAuthenticated ? { scale: 1.05 } : {}}
                            whileTap={authState.isAuthenticated ? { scale: 0.95 } : {}}
                            disabled={!authState.isAuthenticated}
                          >
                            {authState.isAuthenticated ? '▶ Play Soundscape (Coming Soon)' : '🔒 Login to Play'}
                          </motion.button>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          {/* Recent Session Entries (for non-authenticated users) */}
          <AnimatePresence>
            {!authState.isAuthenticated && entries.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="mt-12"
              >
                <GlassCard>
                  <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-800">
                    <Heart className="text-indigo-500" size={22} />
                    Current Session Results
                    <span className="text-sm bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                      Not Saved • Login to Keep History
                    </span>
                  </h3>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {entries.slice(0, 3).map((entryData, index) => (
                      <motion.div
                        key={entryData.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white/60 backdrop-blur-sm border border-white/30 rounded-xl p-4 hover:bg-white/80 hover:shadow-lg transition-all duration-300 group"
                      >
                        <div className="flex gap-1 mb-3">
                          {entryData.analysis.color_palette.slice(0, 4).map((color, idx) => (
                            <div
                              key={idx}
                              className="w-3 h-3 rounded-full border border-white/50"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        
                        <div className="text-xs text-gray-600 mb-2 flex items-center gap-2">
                          <span>{new Date(entryData.timestamp).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{moodService.getMoodEmoji(entryData.analysis)}</span>
                        </div>
                        
                        <div className="text-sm text-gray-800 mb-3 line-clamp-2 group-hover:text-gray-900">
                          "{entryData.text.slice(0, 80)}{entryData.text.length > 80 ? '...' : ''}"
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            entryData.analysis.sentiment === 'positive' 
                              ? 'bg-green-200 text-green-800' 
                              : entryData.analysis.sentiment === 'negative' 
                              ? 'bg-red-200 text-red-800' 
                              : 'bg-gray-200 text-gray-800'
                          }`}>
                            {entryData.analysis.sentiment}
                          </span>
                          <span className="text-xs text-gray-500">
                            {Math.round(entryData.analysis.sentiment_confidence * 100)}% confidence
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Footer */}
          <motion.div 
            className="mt-12 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
          >
            <div className="text-white/80 text-sm bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 inline-block border border-white/20">
              ✨ Powered by advanced AI models • {authState.isAuthenticated ? 'Enjoy your personal mood tracking!' : 'Free mood analysis! Login for history, voice input & more features.'}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default MoodBoardAI;