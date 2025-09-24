import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Mic, Palette, Music, Brain, Download, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { moodService, MoodAnalysis } from './services/moodService';
import { GlassCard } from './components/GlassCard';
import { AnimatedBackground } from './components/AnimatedBackground';
import { LoadingSpinner } from './components/LoadingSpinner';
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
      // Soft circles for positive mood
      const innerGradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      innerGradient.addColorStop(0, ctx.fillStyle as string);
      innerGradient.addColorStop(1, ctx.fillStyle + '00');
      ctx.fillStyle = innerGradient;
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    } else if (art_style === 'sharp') {
      // Angular shapes for intense emotions
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
      // Organic shapes for neutral/calm moods
      ctx.beginPath();
      ctx.ellipse(x, y, size, size * (0.4 + Math.random() * 0.4), Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  ctx.globalAlpha = 1;
};

const MoodBoardAI: React.FC = () => {
  const [entry, setEntry] = useState('');
  const [analysis, setAnalysis] = useState<MoodAnalysis | null>(null);
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
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

  const handleAnalyze = async () => {
    if (!entry.trim()) {
      setError('Please enter some text to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const moodAnalysis = await moodService.analyzeMood(entry.trim());
      setAnalysis(moodAnalysis);

      const newEntry: MoodEntry = {
        id: Date.now(),
        text: entry.trim(),
        analysis: moodAnalysis,
        timestamp: new Date().toISOString()
      };

      setEntries(prev => [newEntry, ...prev.slice(0, 4)]);
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
      
      <div className="relative z-10 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
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
                <span className="text-green-100 font-medium">Mood analysis complete! 🎉</span>
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
                  
                  <button
                    onClick={() => setIsRecording(!isRecording)}
                    className={`absolute bottom-4 right-4 p-3 rounded-full transition-all duration-300 ${
                      isRecording 
                        ? 'bg-red-500 text-white animate-pulse shadow-lg' 
                        : 'bg-white/70 hover:bg-white/90 text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <Mic size={18} />
                  </button>
                </div>
                
                <motion.button
                  onClick={handleAnalyze}
                  disabled={!entry.trim() || isAnalyzing}
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
                      </h3>
                      <p className="text-blue-900 leading-relaxed text-lg">{analysis.ai_insight}</p>
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Right Column */}
            <div className="space-y-6">
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
                            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            ▶ Play Soundscape (Coming Soon)
                          </motion.button>
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          {/* Recent Mood History */}
          <AnimatePresence>
            {entries.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="mt-12"
              >
                <GlassCard>
                  <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-800">
                    <Heart className="text-indigo-500" size={22} />
                    Recent Mood Journey
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
              ✨ Powered by advanced AI models • Try different emotions and see the magic happen!
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default MoodBoardAI;