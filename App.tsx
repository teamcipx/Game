

import React, { useState, useEffect, useRef } from 'react';
import { GameState, GameEntity, Lane, UserProfile, Particle } from './types';
import { getUser, updateUser, saveRunCoins, exchangeCoinsForCash, addBalance } from './services/storageService';
import { generateDailyChallenge, TriviaQuestion } from './services/geminiService';
import { loginUser, registerUser, logoutUser } from './services/authService';
import { playSound } from './services/audioService';
import { 
  Play, Wallet, Shield, RefreshCw, Tv, X, Share2, Brain, LogOut, Magnet, User as UserIcon, Coins, ArrowRightLeft, Users
} from 'lucide-react';

// --- Ad Config ---
// এখানে আপনার Adsterra Direct Link বসান
const ADSTERRA_DIRECT_LINK = "https://www.google.com"; // REPLACE WITH YOUR ACTUAL DIRECT LINK

// --- Constants & Config ---
const LANE_WIDTH = 100;
const CANVAS_WIDTH = 300; // 3 Lanes * 100
const CANVAS_HEIGHT = 600; 
const PLAYER_SIZE = 40;
const BASE_SPEED = 6;
const EXCHANGE_RATE = 0.02; // UI Display purpose

// --- Components ---

const AuthScreen = ({ onLogin }: { onLogin: () => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [referral, setReferral] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    playSound('UI');

    let result;
    if (isLogin) {
      result = await loginUser(email, password);
    } else {
      if (!name) { setError("Name is required"); setLoading(false); return; }
      result = await registerUser(email, password, name, referral);
    }

    setLoading(false);
    if (result.success) {
        playSound('WIN');
        onLogin();
    } else {
        playSound('CRASH'); // Error sound
        setError(result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex items-center justify-center p-6 pb-20">
      <div className="bg-gray-800 border border-gray-700 w-full max-w-sm p-8 rounded-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-neon-green"></div>
        
        <h2 className="text-3xl font-display italic text-center text-white mb-2">
          {isLogin ? 'LOGIN' : 'REGISTER'}
        </h2>
        <p className="text-center text-gray-400 mb-6 font-mono text-xs">Join the Fast Cash Race</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {!isLogin && (
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-gray-900 border border-gray-700 p-3 rounded text-white focus:border-neon-green outline-none" placeholder="Your Name" />
            </div>
          )}
          
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-gray-900 border border-gray-700 p-3 rounded text-white focus:border-neon-blue outline-none" placeholder="you@email.com" />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-gray-900 border border-gray-700 p-3 rounded text-white focus:border-neon-pink outline-none" placeholder="••••••••" />
          </div>

          {!isLogin && (
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Referral Code (Optional)</label>
              <input type="text" value={referral} onChange={e => setReferral(e.target.value)} className="w-full bg-gray-900 border border-gray-700 p-3 rounded text-white focus:border-neon-yellow outline-none font-mono" placeholder="CODE123" />
              <p className="text-[10px] text-gray-500 mt-1">Enter code to get ৳5.00 bonus!</p>
            </div>
          )}

          {error && <p className="text-red-500 text-xs font-bold text-center bg-red-900/30 p-2 rounded">{error}</p>}

          <button disabled={loading} type="submit" className="w-full bg-neon-green text-black font-black py-3 rounded hover:bg-green-400 transition-colors uppercase tracking-widest mt-4 disabled:opacity-50">
            {loading ? 'Processing...' : (isLogin ? 'Start Earning' : 'Join Now')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-gray-400 text-sm underline hover:text-white">
            {isLogin ? "New here? Create Account" : "Have account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
};

// AdOverlay Component Removed - We use Direct Link now

const WalletView = ({ user, onClose }: { user: UserProfile, onClose: () => void }) => {
  const [method, setMethod] = useState<'bKash' | 'Nagad'>('bKash');
  const [number, setNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'WITHDRAW' | 'EXCHANGE'>('EXCHANGE');

  const handleExchange = () => {
    if (user.totalCoins < 100) {
      alert("Need at least 100 coins to exchange.");
      return;
    }
    const exchanged = exchangeCoinsForCash(user.totalCoins);
    playSound('WIN');
    alert(`Exchanged ${user.totalCoins + exchanged/EXCHANGE_RATE} coins for ৳${exchanged}`);
    onClose(); // will trigger refresh
  };

  const handleWithdraw = () => {
    if (user.balance < 100) {
      alert("Minimum withdrawal is ৳100");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      playSound('WIN');
      alert(`Withdrawal request of ৳${user.balance} sent to ${method} ${number}!`);
      updateUser({ balance: 0 });
      setLoading(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/90 flex items-center justify-center p-6 pb-20">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-md rounded-xl p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-display text-white italic">MY WALLET</h2>
          <button onClick={onClose}><X className="text-gray-400" /></button>
        </div>

        <div className="flex gap-2 mb-6">
           <button onClick={() => { playSound('UI'); setMode('EXCHANGE'); }} className={`flex-1 py-2 rounded font-bold border-b-2 ${mode === 'EXCHANGE' ? 'bg-gray-800 border-neon-yellow text-white' : 'bg-transparent border-gray-800 text-gray-500'}`}>EXCHANGE</button>
           <button onClick={() => { playSound('UI'); setMode('WITHDRAW'); }} className={`flex-1 py-2 rounded font-bold border-b-2 ${mode === 'WITHDRAW' ? 'bg-gray-800 border-neon-green text-white' : 'bg-transparent border-gray-800 text-gray-500'}`}>WITHDRAW</button>
        </div>

        {mode === 'EXCHANGE' ? (
           <div className="text-center space-y-6">
              <div className="bg-black p-4 rounded-lg border border-gray-800">
                 <p className="text-gray-400 text-sm font-bold uppercase">Coins Available</p>
                 <div className="text-5xl font-display text-neon-yellow mt-2 flex items-center justify-center gap-2">
                   <Coins className="text-yellow-500" size={40} />
                   {user.totalCoins}
                 </div>
              </div>
              
              <div className="flex items-center justify-center gap-4 text-gray-500">
                  <ArrowRightLeft size={24} />
                  <p className="font-mono text-xs">Rate: 100 Coins = ৳{(100 * EXCHANGE_RATE).toFixed(2)}</p>
              </div>

              <button 
                onClick={handleExchange}
                disabled={user.totalCoins < 100}
                className="w-full bg-neon-yellow text-black font-black py-4 rounded hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border-b-4 border-yellow-700 active:border-b-0 active:translate-y-1"
              >
                CONVERT TO CASH
              </button>
           </div>
        ) : (
           <div className="space-y-4">
             <div className="bg-black p-4 rounded-lg border border-gray-800 text-center">
                <p className="text-gray-400 text-sm font-mono">Withdrawable Balance</p>
                <div className="text-4xl font-display text-neon-green mt-1">
                   ৳{user.balance.toFixed(2)}
                </div>
             </div>

             <div>
               <label className="block text-xs text-gray-500 mb-1 font-bold">METHOD</label>
               <div className="flex space-x-2">
                 <button onClick={() => setMethod('bKash')} className={`flex-1 py-2 rounded font-bold ${method === 'bKash' ? 'bg-pink-600 text-white' : 'bg-gray-800 text-gray-500'}`}>bKash</button>
                 <button onClick={() => setMethod('Nagad')} className={`flex-1 py-2 rounded font-bold ${method === 'Nagad' ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-500'}`}>Nagad</button>
               </div>
             </div>

             <div>
               <label className="block text-xs text-gray-500 mb-1 font-bold">NUMBER</label>
               <input 
                 type="text" 
                 placeholder="01XXXXXXXXX"
                 value={number}
                 onChange={e => setNumber(e.target.value)}
                 className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-white focus:border-neon-green outline-none font-mono font-bold"
               />
             </div>

             <button 
               onClick={handleWithdraw}
               disabled={loading || user.balance < 100}
               className="w-full bg-neon-green text-black font-black py-4 rounded hover:bg-green-400 disabled:opacity-50 transition-colors border-b-4 border-green-700 active:border-b-0 active:translate-y-1"
             >
               {loading ? 'PROCESSING...' : 'WITHDRAW NOW'}
             </button>
           </div>
        )}
      </div>
    </div>
  );
};

const QuizModal = ({ onClose, onReward }: { onClose: () => void, onReward: (amt: number) => void }) => {
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<TriviaQuestion | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    generateDailyChallenge().then(q => {
      setQuiz(q);
      setLoading(false);
    });
  }, []);

  const handleAnswer = (opt: string) => {
    if (answered || !quiz) return;
    playSound('UI');
    setSelected(opt);
    setAnswered(true);
    
    if (opt === quiz.correctAnswer) {
      playSound('WIN');
      setTimeout(() => {
        onReward(quiz.reward);
        onClose();
      }, 1500);
    } else {
      playSound('CRASH');
      setTimeout(onClose, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 pb-20">
      <div className="w-full max-w-md">
        {loading ? (
          <div className="text-center animate-pulse">
            <Brain className="mx-auto text-neon-blue mb-4" size={64} />
            <h2 className="text-2xl font-black text-neon-blue uppercase tracking-widest">Connecting AI...</h2>
          </div>
        ) : quiz ? (
          <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl shadow-[0_0_30px_rgba(0,243,255,0.3)]">
            <div className="flex justify-between items-start mb-4 border-b border-gray-700 pb-4">
               <h3 className="text-neon-blue font-black text-xl italic">AI CHALLENGE</h3>
               <span className="bg-neon-yellow text-black font-bold px-3 py-1 rounded shadow-[2px_2px_0px_#fff]">WIN ৳{quiz.reward}</span>
            </div>
            <p className="text-xl text-white mb-8 font-bold leading-relaxed">{quiz.question}</p>
            <div className="space-y-3">
              {quiz.options.map((opt) => {
                let style = "bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700";
                if (answered) {
                  if (opt === quiz.correctAnswer) style = "bg-green-600 border-green-400 text-white font-bold";
                  else if (opt === selected) style = "bg-red-600 border-red-400 text-white";
                  else style = "bg-gray-800 border-gray-700 opacity-50";
                }
                return (
                  <button 
                    key={opt}
                    onClick={() => handleAnswer(opt)}
                    className={`w-full p-4 text-left border-2 rounded-lg transition-all font-medium ${style}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center">
             <p className="text-red-500 font-bold">AI Service Unavailable.</p>
             <button onClick={onClose} className="mt-4 text-white underline">Close</button>
          </div>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);

  // App UI State
  const [showWallet, setShowWallet] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [countDown, setCountDown] = useState<number | null>(null);
  
  // Game State
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    isGameOver: false,
    isPaused: false,
    score: 0,
    coinsCollected: 0,
    speed: BASE_SPEED,
    activePowerups: { magnet: false, shield: false, doublePoints: false }
  });
  
  // Refs
  const playerLaneRef = useRef<Lane>(1);
  const playerXRef = useRef<number>(150); 
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const entitiesRef = useRef<GameEntity[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const frameCountRef = useRef(0);
  const scoreRef = useRef(0);
  const powerupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gamesPlayedRef = useRef(0);

  // Init Check
  useEffect(() => {
    const storedUser = getUser();
    if (storedUser) {
      setUser(storedUser);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    logoutUser();
    setIsAuthenticated(false);
    setUser(null);
  };

  const refreshUser = () => {
    const u = getUser();
    setUser(u);
  };

  // --- Real Ad Logic ---
  const handleWatchAd = (isRevive: boolean = false) => {
    playSound('UI');
    
    if (confirm("Watch a short ad to earn reward? (Click OK to open Ad)")) {
       // Open Adsterra Direct Link in new tab
       const w = window.open(ADSTERRA_DIRECT_LINK, '_blank');
       
       // In a web game, we can't easily verify if they watched.
       // We simulate a delay or just give reward for clicking.
       // Better UX: Show a "Processing..." toast then reward.
       
       setTimeout(() => {
           if (isRevive) {
               playSound('WIN');
               setGameState(prev => ({ 
                 ...prev, 
                 isGameOver: false, 
                 isPlaying: true 
               }));
               launchGameLoop(); // Continue game
           } else {
               saveRunCoins(100);
               playSound('WIN');
               alert("Thank you! 100 Coins added.");
               refreshUser();
           }
       }, 3000); // 3 seconds delay simulating check
    }
};

  // --- Game Logic ---

  const startGame = () => {
    playSound('UI');
    setCountDown(3);
  };

  useEffect(() => {
    if (countDown === null) return;
    
    if (countDown > 0) {
        const timer = setTimeout(() => {
          setCountDown(c => c! - 1);
          playSound('UI'); // Beep
        }, 1000);
        return () => clearTimeout(timer);
    } else {
        // Start
        playSound('JUMP'); // High beep
        setCountDown(null);
        launchGameLoop();
    }
  }, [countDown]);

  const launchGameLoop = () => {
    // If restarting from scratch (not revive)
    if (gameState.isGameOver && gameState.score === 0) {
      scoreRef.current = 0;
      entitiesRef.current = [];
      particlesRef.current = [];
      playerLaneRef.current = 1; 
      playerXRef.current = 150; 
    } else if (!gameState.isGameOver && !gameState.isPlaying) {
      // Fresh start
      scoreRef.current = 0;
      entitiesRef.current = [];
      particlesRef.current = [];
      playerLaneRef.current = 1; 
      playerXRef.current = 150;
    }

    setGameState(prev => ({
      ...prev,
      isPlaying: true,
      isGameOver: false,
      isPaused: false,
      // if reviving, keep score/coins, else reset
      score: prev.isGameOver && prev.score > 0 ? prev.score : 0,
      coinsCollected: prev.isGameOver && prev.coinsCollected > 0 ? prev.coinsCollected : 0,
      speed: BASE_SPEED,
      activePowerups: prev.isGameOver ? prev.activePowerups : { magnet: false, shield: false, doublePoints: false }
    }));
    
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    requestRef.current = requestAnimationFrame(gameLoop);
  }

  const spawnEntity = () => {
    const lane = Math.floor(Math.random() * 3) as Lane;
    const roll = Math.random();
    
    let type: 'OBSTACLE' | 'COIN' | 'POWERUP' = 'OBSTACLE';
    let subType: any = undefined;

    if (roll > 0.95) {
      type = 'POWERUP';
      subType = Math.random() > 0.5 ? 'MAGNET' : 'SHIELD';
    } else if (roll > 0.6) {
      type = 'COIN';
    } else {
      subType = Math.random() > 0.5 ? 'WALL' : 'CAR';
    }
    
    entitiesRef.current.push({
      id: Date.now() + Math.random(),
      type,
      lane,
      y: -60,
      subType
    });
  };

  const spawnParticles = (x: number, y: number, color: string, count: number) => {
    for(let i=0; i<count; i++) {
      particlesRef.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1.0,
        color
      });
    }
  };

  const activatePowerup = (type: 'MAGNET' | 'SHIELD') => {
    if (type === 'MAGNET') {
      setGameState(prev => ({
        ...prev,
        activePowerups: { ...prev.activePowerups, magnet: true }
      }));
      if (powerupTimerRef.current) clearTimeout(powerupTimerRef.current);
      powerupTimerRef.current = setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          activePowerups: { ...prev.activePowerups, magnet: false }
        }));
      }, 8000); 
    } else if (type === 'SHIELD') {
      setGameState(prev => ({
        ...prev,
        activePowerups: { ...prev.activePowerups, shield: true }
      }));
    }
  };

  const gameLoop = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    frameCountRef.current++;
    
    // Speed Scaling
    const currentSpeed = BASE_SPEED + (scoreRef.current / 1000);
    
    // Spawn
    const spawnRate = Math.max(30, 60 - Math.floor(scoreRef.current / 100));
    if (frameCountRef.current % spawnRate === 0) {
      spawnEntity();
    }

    // Player Movement Logic
    const targetX = playerLaneRef.current * LANE_WIDTH + (LANE_WIDTH/2);
    playerXRef.current = playerXRef.current + (targetX - playerXRef.current) * 0.2; 

    const playerX = playerXRef.current;
    const playerY = CANVAS_HEIGHT - PLAYER_SIZE - 50;

    // Move Entities & Collision
    entitiesRef.current.forEach(e => {
      e.y += currentSpeed;
      
      // Magnet Effect
      if (e.type === 'COIN' && gameState.activePowerups.magnet) {
        const dx = playerX - (e.lane * LANE_WIDTH + LANE_WIDTH/2);
        const dy = playerY - e.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 250) {
          e.lane = playerLaneRef.current; // Snap to player lane
          e.y += 5; // Move faster towards player
        }
      }
    });

    // Filter Logic (Collision & Removal)
    entitiesRef.current = entitiesRef.current.filter(e => {
      if (e.y > CANVAS_HEIGHT) return false;

      const entityX = e.lane * LANE_WIDTH + (LANE_WIDTH/2);
      const entityY = e.y;
      // Hitbox
      const distX = Math.abs(playerX - entityX);
      const distY = Math.abs(playerY - (entityY + 20));

      if (distX < 40 && distY < 50) {
        if (e.type === 'OBSTACLE') {
          if (gameState.activePowerups.shield) {
            // Use Shield
            setGameState(prev => ({
              ...prev,
              activePowerups: { ...prev.activePowerups, shield: false }
            }));
            spawnParticles(entityX, entityY, '#3b82f6', 10); 
            playSound('CRASH'); // Shield break sound (same as crash for impact)
            return false; // Remove obstacle
          } else {
            playSound('CRASH');
            gameOver();
            return false; 
          }
        } else if (e.type === 'COIN') {
          setGameState(prev => ({ ...prev, coinsCollected: prev.coinsCollected + 1 }));
          spawnParticles(entityX, entityY, '#fbbf24', 5);
          playSound('COIN');
          return false;
        } else if (e.type === 'POWERUP') {
          activatePowerup(e.subType as any);
          spawnParticles(entityX, entityY, '#ec4899', 10);
          playSound('JUMP'); // Powerup sound
          return false;
        }
      }
      return true;
    });

    // Update Particles
    particlesRef.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.05;
    });
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);

    scoreRef.current += 0.5;
    
    drawGame(ctx, playerX, playerY);

    if (!gameState.isGameOver) {
      requestRef.current = requestAnimationFrame(gameLoop);
    }
  };

  const gameOver = () => {
    cancelAnimationFrame(requestRef.current);
    setGameState(prev => ({ ...prev, isGameOver: true, isPlaying: false, score: scoreRef.current }));
    saveRunCoins(gameState.coinsCollected || 0); // Save coins for manual exchange
    refreshUser();
    
    gamesPlayedRef.current += 1;
    // No Automatic popup AD, user must click button to watch
  };

  // --- Rendering ---

  const drawGame = (ctx: CanvasRenderingContext2D, playerX: number, playerY: number) => {
    // Clear
    ctx.fillStyle = '#050505'; 
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Moving Cyberpunk City Scenery (Graphics Upgrade)
    const scrollY = frameCountRef.current * 2;
    drawCityScenery(ctx, scrollY, true); // Left side
    drawCityScenery(ctx, scrollY, false); // Right side

    // Road
    const roadMargin = 10;
    // Gradient Road
    const roadGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    roadGrad.addColorStop(0, '#111827');
    roadGrad.addColorStop(1, '#1f2937');
    ctx.fillStyle = roadGrad;
    ctx.fillRect(roadMargin, 0, CANVAS_WIDTH - (roadMargin*2), CANVAS_HEIGHT);

    // Neon Road Borders
    ctx.strokeStyle = '#00ff41';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(roadMargin, 0); ctx.lineTo(roadMargin, CANVAS_HEIGHT);
    ctx.moveTo(CANVAS_WIDTH - roadMargin, 0); ctx.lineTo(CANVAS_WIDTH - roadMargin, CANVAS_HEIGHT);
    ctx.stroke();

    // Lane Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 4;
    ctx.setLineDash([40, 40]);
    ctx.lineDashOffset = -frameCountRef.current * 8;
    for(let i=1; i<3; i++) {
      ctx.beginPath();
      ctx.moveTo(i * LANE_WIDTH, 0);
      ctx.lineTo(i * LANE_WIDTH, CANVAS_HEIGHT);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Entities
    entitiesRef.current.forEach(e => {
      const x = e.lane * LANE_WIDTH + (LANE_WIDTH/2);
      
      if (e.type === 'OBSTACLE') {
        if (e.subType === 'CAR') {
             // Cartoon Car (Detailed)
             ctx.fillStyle = '#ef4444'; 
             ctx.beginPath();
             ctx.roundRect(x - 30, e.y, 60, 80, 12);
             ctx.fill();
             
             // Windshield with reflection
             ctx.fillStyle = '#3b82f6'; 
             ctx.fillRect(x - 24, e.y + 10, 48, 20);
             ctx.fillStyle = 'rgba(255,255,255,0.5)';
             ctx.beginPath(); ctx.moveTo(x-24, e.y+10); ctx.lineTo(x-10, e.y+10); ctx.lineTo(x-24, e.y+30); ctx.fill();
             
             // Hood Stripes
             ctx.fillStyle = '#b91c1c'; 
             ctx.fillRect(x - 24, e.y + 40, 48, 30);
             ctx.fillStyle = '#7f1d1d';
             ctx.fillRect(x - 5, e.y+40, 10, 30);
             
             // Lights (Glow)
             ctx.shadowBlur = 10;
             ctx.shadowColor = '#fef08a';
             ctx.fillStyle = '#fef08a'; 
             ctx.beginPath();
             ctx.arc(x - 18, e.y + 75, 6, 0, Math.PI*2);
             ctx.arc(x + 18, e.y + 75, 6, 0, Math.PI*2);
             ctx.fill();
             ctx.shadowBlur = 0;

        } else {
             // Wall (Detailed)
             ctx.fillStyle = '#334155'; 
             ctx.fillRect(x - 35, e.y, 70, 40);
             // Hazard Stripes
             ctx.fillStyle = '#eab308';
             for(let k=0; k<70; k+=20) {
                ctx.beginPath();
                ctx.moveTo(x-35+k, e.y);
                ctx.lineTo(x-25+k, e.y);
                ctx.lineTo(x-35+k, e.y+40); // Slanted
                ctx.lineTo(x-45+k, e.y+40);
                ctx.fill();
             }
             // Top Cap
             ctx.fillStyle = '#1e293b';
             ctx.fillRect(x-35, e.y, 70, 5);
        }
      } else if (e.type === 'COIN') {
        const bob = Math.sin(frameCountRef.current * 0.1) * 4;
        const scaleX = Math.abs(Math.cos(frameCountRef.current * 0.1)); // Rotation effect
        
        ctx.save();
        ctx.translate(x, e.y + 20 + bob);
        ctx.scale(scaleX, 1);
        
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#fbbf24';
        ctx.fillStyle = '#fbbf24'; 
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.arc(0, 0, 14, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('৳', 0, 2);
        
        ctx.restore();
      } else if (e.type === 'POWERUP') {
        ctx.shadowBlur = 20;
        ctx.shadowColor = e.subType === 'MAGNET' ? '#ec4899' : '#3b82f6';
        ctx.fillStyle = e.subType === 'MAGNET' ? '#ec4899' : '#3b82f6';
        ctx.beginPath();
        ctx.arc(x, e.y + 20, 22, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(e.subType === 'MAGNET' ? 'M' : 'S', x, e.y + 20);
      }
    });

    // Draw Particles
    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI*2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });

    drawSkeletalHuman(ctx, playerX, playerY, frameCountRef.current);

    if (gameState.activePowerups.shield) {
      ctx.strokeStyle = `rgba(59, 130, 246, ${0.5 + Math.sin(frameCountRef.current * 0.2) * 0.2})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(playerX, playerY + 10, 40, 0, Math.PI*2);
      ctx.stroke();
    }
  };

  // Graphics: Draw city buildings on side
  const drawCityScenery = (ctx: CanvasRenderingContext2D, scrollY: number, isLeft: boolean) => {
     const w = 40;
     const x = isLeft ? 0 : CANVAS_WIDTH - w; // Draw on edges inside canvas or just barely visible?
     // To make it look like "surrounding" logic, we draw on the 0-10 margin and 290-300 margin, 
     // but actually maybe drawing transparency overlays
     
     // Since canvas is width 300 (just the road + margin), let's draw silhouttes in the background layer
     // Actually, let's draw "passing lights" on the road margin to simulate speed
     const sideX = isLeft ? 5 : CANVAS_WIDTH - 5;
     const numLights = 5;
     for (let i=0; i<numLights; i++) {
        const y = ((scrollY + i * 150) % (CANVAS_HEIGHT + 100)) - 50;
        ctx.fillStyle = isLeft ? '#ff00ff' : '#00f3ff';
        ctx.globalAlpha = 0.5;
        ctx.fillRect(sideX - 2, y, 4, 40);
        ctx.globalAlpha = 1.0;
     }
  };

  const drawSkeletalHuman = (ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) => {
     const scale = 1.0;
     const speed = 0.3;
     const hipY = y;
     const legLen = 20;
     const width = 8;
     const lCycle = frame * speed;
     const rCycle = frame * speed + Math.PI;

     const drawLeg = (cycle: number, offsetX: number) => {
        const thighAngle = Math.sin(cycle) * 0.8;
        const kneeAngle = Math.max(0, Math.sin(cycle + Math.PI/2)) * 1.5;
        const kneeX = x + offsetX + Math.sin(thighAngle) * legLen;
        const kneeY = hipY + Math.cos(thighAngle) * legLen;
        const footX = kneeX + Math.sin(thighAngle - kneeAngle) * legLen;
        const footY = kneeY + Math.cos(thighAngle - kneeAngle) * legLen;

        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#1f2937'; 
        ctx.beginPath(); ctx.moveTo(x + offsetX, hipY); ctx.lineTo(kneeX, kneeY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(kneeX, kneeY); ctx.lineTo(footX, footY); ctx.stroke();
        ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(footX, footY + 2, 6, 3, 0, 0, Math.PI*2); ctx.fill();
     };

     drawLeg(lCycle, -6);
     drawLeg(rCycle, 6);

     const armLen = 18;
     const shoulderY = y - 25;
     const drawArm = (cycle: number, offsetX: number) => {
        const angle = Math.sin(cycle) * 0.6;
        const handX = x + offsetX + Math.sin(angle) * armLen;
        const handY = shoulderY + Math.cos(angle) * armLen;
        ctx.strokeStyle = '#fca5a5'; 
        ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(x + offsetX, shoulderY); ctx.lineTo(handX, handY); ctx.stroke();
     };

     ctx.fillStyle = '#3b82f6'; 
     ctx.fillRect(x - 12, y - 30, 24, 30);
     drawArm(rCycle, -14);
     drawArm(lCycle, 14);

     const bob = Math.abs(Math.sin(frame * speed * 2)) * 3;
     ctx.fillStyle = '#fca5a5'; ctx.beginPath(); ctx.arc(x, y - 42 + bob, 12, 0, Math.PI*2); ctx.fill();
     ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(x, y - 45 + bob, 13, Math.PI, 0); ctx.fill();
  };

  const handleInput = (dir: 'left' | 'right') => {
    if (!gameState.isPlaying && countDown === null) return;
    playSound('UI'); // Subtle swipe sound
    const current = playerLaneRef.current;
    if (dir === 'left') {
      playerLaneRef.current = Math.max(0, current - 1) as Lane;
    } else {
      playerLaneRef.current = Math.min(2, current + 1) as Lane;
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handleInput('left');
      if (e.key === 'ArrowRight') handleInput('right');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [gameState.isPlaying, countDown]);

  // --- Render ---

  if (!isAuthenticated) {
    return <AuthScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative font-sans text-white overflow-hidden bg-gray-900 pb-20">
      <div className="absolute inset-0 grid-bg opacity-10 pointer-events-none"></div>
      
      {/* Top Bar */}
      {!gameState.isPlaying && !countDown && (
        <div className="absolute top-0 w-full p-4 flex justify-between items-center z-20 bg-black/50 backdrop-blur">
          <div className="flex items-center gap-2">
            <div className="bg-gray-700 p-2 rounded-full"><UserIcon size={20} /></div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase">Player</p>
              <p className="text-sm font-bold text-white">{user?.name || 'Guest'}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-red-500 hover:text-white transition-colors"><LogOut size={20} /></button>
        </div>
      )}

      {/* Main Menu */}
      {!gameState.isPlaying && !gameState.isGameOver && !countDown && (
        <div className="z-10 w-full max-w-md px-6 flex flex-col items-center space-y-6 animate-in fade-in zoom-in duration-300 mt-10">
           <div className="text-center">
             <h1 className="text-6xl font-display italic text-transparent bg-clip-text bg-gradient-to-b from-neon-yellow to-orange-500 drop-shadow-[0_4px_0px_rgba(0,0,0,0.5)] transform -rotate-2">
               FAST
             </h1>
             <h1 className="text-7xl font-display italic text-transparent bg-clip-text bg-gradient-to-b from-neon-green to-green-700 drop-shadow-[0_4px_0px_rgba(0,0,0,0.5)] transform rotate-1 -mt-4">
               CASH RUN
             </h1>
           </div>
           
           <div className="bg-gray-800 border border-gray-700 w-full p-4 rounded-xl flex items-center justify-between shadow-lg transform hover:scale-105 transition-transform cursor-pointer" onClick={() => { playSound('UI'); setShowWallet(true); }}>
             <div>
               <p className="text-gray-400 text-xs font-bold tracking-widest">WALLET BALANCE</p>
               <p className="text-3xl font-mono font-bold text-neon-green text-shadow-sm">৳{user?.balance.toFixed(2)}</p>
             </div>
             <div className="bg-gray-700 p-3 rounded-full">
               <Wallet size={28} className="text-white" />
             </div>
           </div>

           <div className="bg-gray-800 border border-gray-700 w-full p-3 rounded-xl flex items-center justify-between shadow-md">
             <div>
               <p className="text-gray-400 text-[10px] font-bold tracking-widest uppercase">Coins (Run to Earn)</p>
               <p className="text-xl font-mono font-bold text-neon-yellow flex items-center gap-2"><Coins size={16}/> {user?.totalCoins}</p>
             </div>
             <button onClick={() => setShowWallet(true)} className="text-xs bg-yellow-600 px-2 py-1 rounded font-bold">EXCHANGE</button>
           </div>

           <button 
             onClick={startGame}
             className="w-full bg-neon-pink hover:bg-pink-600 text-white py-5 rounded-2xl font-black text-3xl tracking-widest shadow-[0_6px_0px_#be185d] active:shadow-none active:translate-y-1.5 transition-all flex items-center justify-center gap-3"
           >
             <Play fill="currentColor" size={32} /> PLAY NOW
           </button>

           <div className="grid grid-cols-2 gap-4 w-full">
             <button 
              onClick={() => { playSound('UI'); setShowQuiz(true); }}
              className="bg-gradient-to-br from-blue-600 to-blue-800 border-b-4 border-blue-900 p-4 rounded-xl flex flex-col items-center hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all"
             >
               <Brain className="text-white mb-2" size={28} />
               <span className="font-black text-sm uppercase">Smart Quiz</span>
               <span className="text-xs text-blue-200">Earn Cash</span>
             </button>

             <button 
              onClick={() => handleWatchAd(false)}
              className="bg-gradient-to-br from-orange-500 to-orange-700 border-b-4 border-orange-900 p-4 rounded-xl flex flex-col items-center hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all"
             >
               <Tv className="text-white mb-2" size={28} />
               <span className="font-black text-sm uppercase">Watch Ad</span>
               <span className="text-xs text-orange-200">+100 Coins</span>
             </button>
           </div>

           <div className="mt-4 text-center bg-black/30 p-4 rounded-lg w-full border border-white/10">
             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2"><Users size={12}/> Referral Program</p>
             <div className="text-neon-yellow font-mono text-lg flex items-center justify-center gap-2 mt-1">
                {user?.referralCode} <Share2 size={16} className="cursor-pointer hover:text-white" onClick={() => alert('Copied!')}/>
             </div>
             <p className="text-[10px] text-gray-500 mt-1">Share & Earn ৳5.00 per user</p>
           </div>
        </div>
      )}

      {/* Countdown Overlay */}
      {countDown !== null && (
         <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="text-9xl font-black text-neon-yellow animate-pulse-fast">
              {countDown === 0 ? 'GO!' : countDown}
            </div>
         </div>
      )}

      {/* Game Canvas Area */}
      {(gameState.isPlaying || gameState.isGameOver || countDown !== null) && (
        <div className="relative">
          {/* HUD */}
          <div className="absolute top-4 left-0 w-full px-4 flex justify-between items-center z-10">
             <div className="bg-black/60 backdrop-blur-md p-2 rounded-full border-2 border-yellow-500 flex items-center gap-2 px-4 shadow-lg">
               <div className="w-4 h-4 bg-yellow-400 rounded-full border border-yellow-600"></div>
               <span className="text-white font-display font-bold text-xl">
                 {gameState.coinsCollected}
               </span>
             </div>
             
             <div className="flex gap-2">
               {gameState.activePowerups.magnet && (
                 <div className="bg-pink-600 p-2 rounded-full animate-pulse"><Magnet size={16} /></div>
               )}
               {gameState.activePowerups.shield && (
                 <div className="bg-blue-600 p-2 rounded-full animate-pulse"><Shield size={16} /></div>
               )}
             </div>

             <div className="bg-black/60 backdrop-blur-md p-2 rounded-lg border border-white/20 shadow-lg">
               <span className="text-white font-mono font-bold tracking-wider text-lg">{Math.floor(scoreRef.current)}m</span>
             </div>
          </div>

          <canvas 
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="bg-gray-800 border-x-8 border-gray-700 shadow-2xl"
          />
          
          {/* Mobile Controls Overlay (Invisible) */}
          <div className="absolute inset-0 flex">
             <div className="w-1/2 h-full active:bg-white/5 transition-colors" onTouchStart={() => handleInput('left')} onClick={() => handleInput('left')}></div>
             <div className="w-1/2 h-full active:bg-white/5 transition-colors" onTouchStart={() => handleInput('right')} onClick={() => handleInput('right')}></div>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState.isGameOver && (
        <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-500">
          <h2 className="text-6xl font-black text-red-600 mb-2 transform -rotate-3 drop-shadow-lg uppercase italic">Wasted!</h2>
          <div className="text-center mb-8">
            <p className="text-gray-300 text-sm font-bold tracking-widest uppercase">Run Distance</p>
            <p className="text-4xl font-mono text-white">{Math.floor(gameState.score)}m</p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-xl border-2 border-neon-yellow w-72 mb-8 shadow-[0_0_30px_rgba(251,191,36,0.2)] transform scale-110">
             <p className="text-xs text-gray-400 text-center font-bold uppercase mb-1">Coins Earned</p>
             <div className="flex items-center justify-center gap-1">
               <Coins className="text-yellow-500" />
               <span className="text-4xl font-display text-neon-yellow">{gameState.coinsCollected}</span>
             </div>
             <p className="text-[10px] text-gray-500 text-center mt-2">Added to Wallet. Exchange for Cash!</p>
          </div>

          <button 
            onClick={() => { 
                playSound('UI'); 
                setGameState(prev => ({ ...prev, isGameOver: false, isPlaying: false, score: 0 })); 
            }}
            className="bg-white text-black font-black py-4 px-10 rounded-full hover:scale-105 transition-transform shadow-lg flex items-center gap-2"
          >
             <RefreshCw size={24} /> TRY AGAIN
          </button>
          
          <button 
            onClick={() => handleWatchAd(true)}
            className="mt-6 text-sm text-yellow-400 hover:text-yellow-300 font-bold flex items-center gap-2 underline decoration-dashed underline-offset-4"
          >
            <Tv size={16} /> WATCH AD TO REVIVE
          </button>
        </div>
      )}

      {/* Modals */}
      {showWallet && user && <WalletView user={user} onClose={() => { setShowWallet(false); refreshUser(); }} />}
      
      {showQuiz && (
        <QuizModal 
          onClose={() => setShowQuiz(false)}
          onReward={(amt) => {
            addBalance(amt);
            refreshUser();
            alert(`Correct! Won ৳${amt}`);
          }}
        />
      )}
    </div>
  );
};

export default App;
