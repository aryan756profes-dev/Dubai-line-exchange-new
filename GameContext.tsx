import { createContext, useContext, useState, useEffect } from 'react';

interface GameContextType {
  timeLeft: number;
  marketStatus: 'open' | 'closed' | 'settling';
}

const GameContext = createContext<GameContextType>({ timeLeft: 60, marketStatus: 'open' });

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    // Synchronize to the nearest minute for "synced" feel across users
    const interval = setInterval(() => {
      const seconds = 60 - (new Date().getSeconds());
      setTimeLeft(seconds);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <GameContext.Provider value={{ 
      timeLeft, 
      marketStatus: timeLeft <= 5 ? 'settling' : 'open' 
    }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => useContext(GameContext);
