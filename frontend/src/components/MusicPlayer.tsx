// frontend/src/components/MusicPlayer.tsx

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, 
  Music, ExternalLink, Heart, List, X 
} from 'lucide-react';

export interface Track {
  id: string;
  name: string;
  artist: string;
  album?: string;
  duration: number;
  audio_url: string;
  image_url?: string;
  jamendo_url: string;
  license?: string;
}

export interface Playlist {
  playlist_name: string;
  mood_tags: string[];
  total_tracks: number;
  tracks: Track[];
  sentiment?: string;
  energy?: string;
}

interface MusicPlayerProps {
  playlist: Playlist;
  onClose?: () => void;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ playlist, onClose }) => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set());
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentTrack = playlist.tracks[currentTrackIndex];

  // Initialize audio element
  useEffect(() => {
    if (currentTrack && audioRef.current) {
      audioRef.current.src = currentTrack.audio_url;
      audioRef.current.volume = isMuted ? 0 : volume;
      
      if (isPlaying) {
        audioRef.current.play().catch(err => {
          console.error('Playback error:', err);
          setIsPlaying(false);
        });
      }
    }
  }, [currentTrackIndex, currentTrack, isMuted, volume, isPlaying]);  // ADD missing dependencies

  // Update audio volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error('Playback error:', err);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const skipForward = () => {
    const nextIndex = (currentTrackIndex + 1) % playlist.tracks.length;
    setCurrentTrackIndex(nextIndex);
    setIsPlaying(true);
  };

  const skipBackward = () => {
    const prevIndex = currentTrackIndex === 0 
      ? playlist.tracks.length - 1 
      : currentTrackIndex - 1;
    setCurrentTrackIndex(prevIndex);
    setIsPlaying(true);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    skipForward();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleLike = (trackId: string) => {
    setLikedTracks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(trackId)) {
        newSet.delete(trackId);
      } else {
        newSet.add(trackId);
      }
      return newSet;
    });
  };

  const selectTrack = (index: number) => {
    setCurrentTrackIndex(index);
    setIsPlaying(true);
    setShowPlaylist(false);
  };

  return (
    <div className="relative w-full">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      {/* Main Player Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-900/95 to-pink-900/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/20 relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Music className="text-purple-300" size={24} />
            <div>
              <h3 className="text-white font-bold text-lg">{playlist.playlist_name}</h3>
              <p className="text-purple-200 text-sm">{playlist.total_tracks} tracks</p>
            </div>
          </div>
          <div className="flex gap-2 relative">  {/* ADD relative HERE */}
            <button
              onClick={() => setShowPlaylist(!showPlaylist)}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white"
              title="Show playlist"
            >
              <List size={20} />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white"
                title="Close player"
              >
                <X size={20} />
              </button>
            )}
            
            {/* MOVE PLAYLIST OVERLAY HERE - Right after the buttons */}
            <AnimatePresence>
              {showPlaylist && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full right-0 mt-2 w-96 max-w-[90vw] bg-gradient-to-br from-purple-900/98 to-pink-900/98 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 max-h-96 overflow-y-auto z-50"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4 sticky top-0 bg-purple-900/95 -mx-4 px-4 py-2 backdrop-blur-md">
                      <h4 className="text-white font-bold">Playlist</h4>
                      <button
                        onClick={() => setShowPlaylist(false)}
                        className="text-purple-200 hover:text-white"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {playlist.tracks.map((track, index) => (
                        <motion.button
                          key={track.id}
                          onClick={() => selectTrack(index)}
                          className={`w-full p-3 rounded-lg transition-all text-left ${
                            index === currentTrackIndex
                              ? 'bg-purple-500/30 border border-purple-400/50'
                              : 'bg-white/5 hover:bg-white/10 border border-transparent'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-8 text-center">
                              {index === currentTrackIndex && isPlaying ? (
                                <div className="flex gap-1 justify-center items-center">
                                  <motion.div
                                    className="w-1 h-3 bg-purple-300 rounded"
                                    animate={{ height: ['12px', '6px', '12px'] }}
                                    transition={{ duration: 0.6, repeat: Infinity }}
                                  />
                                  <motion.div
                                    className="w-1 h-3 bg-purple-300 rounded"
                                    animate={{ height: ['6px', '12px', '6px'] }}
                                    transition={{ duration: 0.6, repeat: Infinity }}
                                  />
                                  <motion.div
                                    className="w-1 h-3 bg-purple-300 rounded"
                                    animate={{ height: ['12px', '6px', '12px'] }}
                                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                                  />
                                </div>
                              ) : (
                                <span className="text-purple-200 text-sm">{index + 1}</span>
                              )}
                            </div>

                            {track.image_url ? (
                              <img
                                src={track.image_url}
                                alt={track.name}
                                className="w-10 h-10 rounded object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded bg-gradient-to-br from-purple-500/50 to-pink-500/50 flex items-center justify-center">
                                <Music size={16} className="text-white" />
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-medium truncate">
                                {track.name}
                              </p>
                              <p className="text-purple-200 text-xs truncate">
                                {track.artist}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-purple-300 text-xs">
                                {formatTime(track.duration)}
                              </span>
                              
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleLike(track.id);
                                }}
                                className={`p-1 rounded cursor-pointer ${
                                  likedTracks.has(track.id)
                                    ? 'text-pink-400'
                                    : 'text-purple-300 hover:text-pink-400'
                                }`}
                              >
                                <Heart 
                                  size={14} 
                                  fill={likedTracks.has(track.id) ? 'currentColor' : 'none'} 
                                />
                              </div>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mood Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {playlist.mood_tags.slice(0, 4).map((tag, idx) => (
            <span
              key={idx}
              className="px-3 py-1 bg-purple-500/30 text-purple-100 text-xs rounded-full border border-purple-400/30"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Current Track Info */}
        {currentTrack && (
          <div className="mb-6">
            <div className="flex items-center gap-4">
              {currentTrack.image_url ? (
                <img
                  src={currentTrack.image_url}
                  alt={currentTrack.name}
                  className="w-20 h-20 rounded-lg shadow-lg object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Music size={32} className="text-white" />
                </div>
              )}
              
              <div className="flex-1">
                <h4 className="text-white font-bold text-lg line-clamp-1">
                  {currentTrack.name}
                </h4>
                <p className="text-purple-200 text-sm line-clamp-1">
                  {currentTrack.artist}
                </p>
                {currentTrack.album && (
                  <p className="text-purple-300 text-xs line-clamp-1">
                    {currentTrack.album}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => toggleLike(currentTrack.id)}
                  className={`p-2 rounded-lg transition-all ${
                    likedTracks.has(currentTrack.id)
                      ? 'bg-pink-500 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                  title="Like track"
                >
                  <Heart size={18} fill={likedTracks.has(currentTrack.id) ? 'currentColor' : 'none'} />
                </button>
                
                <a
                  href={currentTrack.jamendo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white"
                  title="View on Jamendo"
                >
                  <ExternalLink size={18} />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-4">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, rgb(236 72 153) 0%, rgb(236 72 153) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-purple-200 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <motion.button
            onClick={skipBackward}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <SkipBack size={20} />
          </motion.button>

          <motion.button
            onClick={togglePlayPause}
            className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-full shadow-lg transition-all text-white"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
          </motion.button>

          <motion.button
            onClick={skipForward}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <SkipForward size={20} />
          </motion.button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMute}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white"
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, rgb(236 72 153) 0%, rgb(236 72 153) ${volume * 100}%, rgba(255,255,255,0.2) ${volume * 100}%, rgba(255,255,255,0.2) 100%)`
            }}
          />
        </div>

        {/* License Info */}
        {currentTrack?.license && (
          <div className="mt-4 p-2 bg-white/5 rounded-lg">
            <p className="text-purple-200 text-xs text-center">
              Licensed under Creative Commons •{' '}
              <a
                href={currentTrack.license}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-300 hover:text-purple-100 underline"
              >
                View License
              </a>
            </p>
          </div>
        )}
      </motion.div>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: white;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
};