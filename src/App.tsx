/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Trophy, RefreshCw, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface Track {
  id: number;
  title: string;
  artist: string;
  url: string;
  cover: string;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Point = { x: number; y: number };

// --- Constants ---
const GRID_SIZE = 20;
const INITIAL_SNAKE: Point[] = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
const INITIAL_DIRECTION: Direction = 'UP';
const GAME_SPEED = 150;

const TRACKS: Track[] = [
  {
    id: 1,
    title: "Neon Pulse",
    artist: "SynthWave AI",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    cover: "https://picsum.photos/seed/neon1/400/400"
  },
  {
    id: 2,
    title: "Cyber Drift",
    artist: "Digital Dreams",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    cover: "https://picsum.photos/seed/neon2/400/400"
  },
  {
    id: 3,
    title: "Midnight Grid",
    artist: "Retro Future",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    cover: "https://picsum.photos/seed/neon3/400/400"
  }
];

export default function App() {
  // --- Music State ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- Game State ---
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  const currentTrack = TRACKS[currentTrackIndex];

  // --- Music Logic ---
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const nextTrack = () => setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
  const prevTrack = () => setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);

  // --- Game Logic ---
  const generateFood = useCallback(() => {
    const newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
    setFood(newFood);
  }, []);

  const moveSnake = useCallback(() => {
    if (gameOver || !gameStarted) return;

    setSnake((prevSnake) => {
      const head = prevSnake[0];
      const newHead = { ...head };

      switch (direction) {
        case 'UP': newHead.y -= 1; break;
        case 'DOWN': newHead.y += 1; break;
        case 'LEFT': newHead.x -= 1; break;
        case 'RIGHT': newHead.x += 1; break;
      }

      // Check collisions
      if (
        newHead.x < 0 || newHead.x >= GRID_SIZE ||
        newHead.y < 0 || newHead.y >= GRID_SIZE ||
        prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)
      ) {
        setGameOver(true);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check food
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        generateFood();
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, gameOver, gameStarted, generateFood]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': if (direction !== 'DOWN') setDirection('UP'); break;
        case 'ArrowDown': if (direction !== 'UP') setDirection('DOWN'); break;
        case 'ArrowLeft': if (direction !== 'RIGHT') setDirection('LEFT'); break;
        case 'ArrowRight': if (direction !== 'LEFT') setDirection('RIGHT'); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction]);

  useEffect(() => {
    if (gameStarted && !gameOver) {
      gameLoopRef.current = setInterval(moveSnake, GAME_SPEED);
    } else {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    }
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameStarted, gameOver, moveSnake]);

  const startGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
    generateFood();
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-cyan-500/30 overflow-hidden flex flex-col items-center justify-center p-4">
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/10 blur-[120px] rounded-full" />
      </div>

      <audio
        ref={audioRef}
        src={currentTrack.url}
        onEnded={nextTrack}
      />

      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Panel: Music Info */}
        <div className="lg:col-span-3 space-y-6 order-2 lg:order-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 p-6 rounded-3xl shadow-2xl"
          >
            <div className="relative aspect-square rounded-2xl overflow-hidden mb-6 group">
              <img 
                src={currentTrack.cover} 
                alt={currentTrack.title}
                className={`w-full h-full object-cover transition-transform duration-700 ${isPlaying ? 'scale-110' : 'scale-100'}`}
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <p className="text-xs font-medium text-cyan-400 uppercase tracking-widest">Now Playing</p>
              </div>
            </div>
            
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-white">{currentTrack.title}</h2>
              <p className="text-zinc-400 text-sm">{currentTrack.artist}</p>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button onClick={prevTrack} className="p-2 text-zinc-400 hover:text-white transition-colors">
                <SkipBack size={20} />
              </button>
              <button 
                onClick={togglePlay}
                className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
              >
                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} className="ml-1" fill="currentColor" />}
              </button>
              <button onClick={nextTrack} className="p-2 text-zinc-400 hover:text-white transition-colors">
                <SkipForward size={20} />
              </button>
            </div>
          </motion.div>

          <div className="bg-zinc-900/30 backdrop-blur-md border border-white/5 p-4 rounded-2xl">
            <div className="flex items-center gap-3 text-zinc-500 mb-4">
              <Music size={16} />
              <span className="text-xs font-semibold uppercase tracking-widest">Playlist</span>
            </div>
            <div className="space-y-2">
              {TRACKS.map((track, idx) => (
                <button
                  key={track.id}
                  onClick={() => {
                    setCurrentTrackIndex(idx);
                    setIsPlaying(true);
                  }}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group ${currentTrackIndex === idx ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-zinc-400'}`}
                >
                  <span className="text-sm font-medium truncate">{track.title}</span>
                  {currentTrackIndex === idx && isPlaying && (
                    <div className="flex gap-0.5 items-end h-3">
                      <div className="w-0.5 bg-cyan-400 animate-[music-bar_0.8s_ease-in-out_infinite]" />
                      <div className="w-0.5 bg-cyan-400 animate-[music-bar_1.2s_ease-in-out_infinite]" />
                      <div className="w-0.5 bg-cyan-400 animate-[music-bar_1s_ease-in-out_infinite]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center Panel: Snake Game */}
        <div className="lg:col-span-6 flex flex-col items-center order-1 lg:order-2">
          <div className="w-full max-w-[450px] aspect-square relative bg-zinc-900/80 backdrop-blur-2xl rounded-[2rem] border-2 border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
            
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-20" 
              style={{ 
                backgroundImage: `linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)`,
                backgroundSize: `${100 / GRID_SIZE}% ${100 / GRID_SIZE}%`
              }} 
            />

            {/* Snake & Food */}
            {!gameOver && gameStarted && (
              <>
                {snake.map((segment, i) => (
                  <motion.div
                    key={`${segment.x}-${segment.y}-${i}`}
                    className={`absolute rounded-sm ${i === 0 ? 'bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)] z-10' : 'bg-cyan-600/60'}`}
                    style={{
                      width: `${100 / GRID_SIZE}%`,
                      height: `${100 / GRID_SIZE}%`,
                      left: `${(segment.x * 100) / GRID_SIZE}%`,
                      top: `${(segment.y * 100) / GRID_SIZE}%`,
                    }}
                    initial={false}
                    animate={{ scale: 1 }}
                  />
                ))}
                <motion.div
                  className="absolute bg-rose-500 rounded-full shadow-[0_0_15px_rgba(244,63,94,0.8)]"
                  style={{
                    width: `${100 / GRID_SIZE}%`,
                    height: `${100 / GRID_SIZE}%`,
                    left: `${(food.x * 100) / GRID_SIZE}%`,
                    top: `${(food.y * 100) / GRID_SIZE}%`,
                  }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
              </>
            )}

            {/* Game Over / Start Overlay */}
            <AnimatePresence>
              {(!gameStarted || gameOver) && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-8 text-center"
                >
                  {gameOver ? (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h3 className="text-4xl font-black text-white tracking-tighter uppercase italic">Game Over</h3>
                        <p className="text-zinc-400 font-mono text-sm">FINAL SCORE: {score}</p>
                      </div>
                      <button 
                        onClick={startGame}
                        className="group relative px-8 py-4 bg-cyan-500 text-black font-bold rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                          TRY AGAIN
                        </span>
                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      <div className="space-y-4">
                        <h1 className="text-6xl font-black tracking-tighter text-white uppercase italic leading-none">
                          Neon<br/><span className="text-cyan-400">Snake</span>
                        </h1>
                        <p className="text-zinc-500 text-sm max-w-[240px] mx-auto">Use arrow keys to navigate the grid. Eat the red orbs to grow.</p>
                      </div>
                      <button 
                        onClick={startGame}
                        className="px-10 py-5 bg-white text-black font-black rounded-full hover:bg-cyan-400 transition-colors shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                      >
                        START ENGINE
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Game Stats Bar */}
          <div className="mt-8 w-full max-w-[450px] flex items-center justify-between px-6 py-4 bg-zinc-900/40 border border-white/5 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                <Trophy size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Score</p>
                <p className="text-xl font-mono font-bold text-white leading-none">{score}</p>
              </div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                <Volume2 size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Audio</p>
                <p className="text-xs font-medium text-white leading-none">{isPlaying ? 'Active' : 'Muted'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Controls Info */}
        <div className="lg:col-span-3 space-y-6 order-3">
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 p-6 rounded-3xl">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] mb-6">Instructions</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400 flex-shrink-0">
                  <span className="text-xs font-bold">↑</span>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">Use <span className="text-white">Arrow Keys</span> to navigate the snake through the neon grid.</p>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400 flex-shrink-0">
                  <span className="text-xs font-bold">P</span>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">Control the <span className="text-white">Music Player</span> on the left to set your rhythm.</p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl border border-cyan-500/20 bg-cyan-500/5 relative overflow-hidden group">
            <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-cyan-500/10 blur-2xl rounded-full group-hover:scale-150 transition-transform duration-1000" />
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-2 italic">Pro Tip</h4>
            <p className="text-sm text-zinc-300 leading-relaxed">The snake moves faster as you eat more orbs. Keep your focus sharp!</p>
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes music-bar {
          0%, 100% { height: 4px; }
          50% { height: 12px; }
        }
      `}} />
    </div>
  );
}
