
export interface UserProfile {
  id: string;
  username: string;
  password?: string; // In a real app, this would be hashed
  name: string;
  balance: number; // In BDT (Real Money)
  totalCoins: number; // Coin Inventory (Must be exchanged)
  highScore: number;
  referralCode: string;
  referredBy?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
}

export interface GameState {
  isPlaying: boolean;
  isGameOver: boolean;
  isPaused: boolean;
  score: number;
  coinsCollected: number;
  speed: number;
  activePowerups: {
    magnet: boolean;
    shield: boolean;
    doublePoints: boolean;
  };
}

export type Lane = 0 | 1 | 2; // Left, Center, Right

export interface GameEntity {
  id: number;
  type: 'COIN' | 'OBSTACLE' | 'POWERUP';
  lane: Lane;
  y: number; // Vertical position (0 to 100+)
  subType?: 'WALL' | 'CAR' | 'HOLE' | 'MAGNET' | 'SHIELD';
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export interface WithdrawalRequest {
  method: 'bKash' | 'Nagad';
  number: string;
  amount: number;
  timestamp: number;
}
