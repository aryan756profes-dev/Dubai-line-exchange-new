import { useState, useEffect, useMemo, useCallback } from 'react';
import { Trophy, TrendingUp, User, Zap, Gamepad2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, cn } from '../lib/utils';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Winner {
  id: string;
  user: string;
  amount: number;
  gameType: string;
}

const fakeUsernames = [
  "Sumit_56", "AmanSingh4588", "Suresh_867", "Rajiv@92", "Vikram_007", "RohanSharma",
  "Priya99", "Rahul_K", "Anita_77", "Amit_Desai", "Deepak_11", "Karan_Singh_99",
  "Nitin_88", "Gaurav_Tech", "Sanjay_Rao", "Vikas_90", "Arun_Kumar", "Prakash_77",
  "Saurabh_88", "Sunil_R", "Ajay_M", "Rakesh_Sharma", "Manish_K", "Ashok_99",
  "Vijay_Singh", "Dinesh_Kumar", "Ramesh_77", "Suresh_K", "Naresh_88", "Neha_Sharma",
  "Pooja_99", "Anjali_K", "Sneha_77", "Ritu_Desai", "Kajal_11", "Meera_Singh"
];

// Simple deterministic hash based on a string
function hashCode(str: string) {
  let hash = 0;
  for (let i = 0, len = str.length; i < len; i++) {
    let chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return hash;
}

export function RecentWinners() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [latestResultId, setLatestResultId] = useState<string>('');

  useEffect(() => {
    // Listen to latest result to trigger update
    const q = query(
      collection(db, 'results'),
      orderBy('resultTime', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setLatestResultId(snapshot.docs[0].id);
      } else {
        setLatestResultId('fallback');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!latestResultId || loading) return;

    // Deterministically generate 5 winners based on result ID
    const seed = Math.abs(hashCode(latestResultId));
    let numCount = (seed % 2 === 0) ? 2 : 3;
    let colCount = 5 - numCount;
    
    let generatedWinners: Winner[] = [];
    
    // Pick unique fake usernames
    let availableNames = [...fakeUsernames];
    for (let i = 0; i < availableNames.length - 1; i++) {
      let j = (seed + i) % availableNames.length;
      let temp = availableNames[i];
      availableNames[i] = availableNames[j];
      availableNames[j] = temp;
    }

    // Generate Number Games
    for (let i = 0; i < numCount; i++) {
      generatedWinners.push({
        id: `num_${latestResultId}_${i}`,
        user: availableNames.pop() || "User",
        amount: Math.round((900 + (seed % 5000)) / 10) * 10,
        gameType: 'number'
      });
    }

    // Generate Color Games (orange gives 15x, other gives 9x)
    for (let i = 0; i < colCount; i++) {
      generatedWinners.push({
        id: `col_${latestResultId}_${i}`,
        user: availableNames.pop() || "User",
        amount: Math.round((900 + ((seed * 2) % 4000)) / 10) * 10,
        gameType: 'color'
      });
    }

    // Shuffle the final list for mixed display
    generatedWinners.sort((a, b) => (hashCode(a.id) % 3) - 1);

    setWinners(generatedWinners);
  }, [latestResultId, loading]);

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[100px] animate-pulse">
        <Trophy className="w-6 h-6 text-slate-700 mb-2" />
        <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Loading Winners...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-2">
          <Sparkles className="w-3 h-3" />
          Hall of Fame
        </h3>
        <span className="text-[9px] font-bold text-slate-600 uppercase">Live Settlements</span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <AnimatePresence>
          {winners.map((winner, idx) => (
            <motion.div
              key={winner.id}
              initial={{ opacity: 0, x: -20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ delay: idx * 0.1, duration: 0.3 }}
              className="group bg-slate-950 border border-slate-900 rounded-xl p-3 flex items-center justify-between hover:border-emerald-500/30 transition-all relative overflow-hidden shadow-lg shadow-emerald-500/5"
            >
              <div className="flex items-center gap-3 relative z-10">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  winner.gameType === 'number' ? "bg-cyan-500/10 text-cyan-500" : "bg-pink-500/10 text-pink-500"
                )}>
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-black text-white italic tracking-tight">{winner.user}</p>
                  <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">
                    Won at {winner.gameType === 'number' ? 'Number Exchange' : 'Color X-Line'}
                  </p>
                </div>
              </div>
              <div className="text-right relative z-10">
                <p className="text-sm font-black text-emerald-500 tabular-nums">+{formatCurrency(winner.amount)}</p>
                <div className="flex items-center gap-1 justify-end">
                  <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[8px] text-slate-600 font-bold uppercase">Verified</span>
                </div>
              </div>
              {/* Background Accent */}
              <div className={cn(
                 "absolute -right-2 -bottom-2 w-12 h-12 opacity-[0.03] rotate-12 transition-transform group-hover:scale-125 group-hover:opacity-[0.07]",
                 winner.gameType === 'number' ? "text-cyan-400" : "text-pink-400"
              )}>
                 <Gamepad2 className="w-full h-full" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function LiveActivity() {
  const [realBets, setRealBets] = useState<any[]>([]);
  const [displayedItems, setDisplayedItems] = useState<any[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'bets'),
      orderBy('createdAt', 'desc'),
      limit(15)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const bets = snap.docs.map(doc => {
        const data = doc.data({ serverTimestamps: 'estimate' });
        return {
          id: doc.id,
          username: data.username || 'User',
          selectedValue: data.selectedValue,
          amount: data.amount,
          gameType: data.gameType,
          createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
          isReal: true
        };
      });
      setRealBets(bets);
    });
    return () => unsubscribe();
  }, []);

  const generateFakeBet = useCallback((id: string | number) => {
    const colors = ['Red', 'Green', 'Violet', 'Orange', 'Blue', 'Pink', 'Yellow', 'Black', 'White', 'Purple'];
    const user = fakeUsernames[Math.floor(Math.random() * fakeUsernames.length)];
    const isNumber = Math.random() > 0.5;
    const selectedValue = isNumber ? Math.floor(Math.random() * 99) + 1 : colors[Math.floor(Math.random() * colors.length)];
    const amount = [100, 200, 500, 1000, 2000, 5000][Math.floor(Math.random() * 6)];
    
    return {
      id: `fake_bet_${Date.now()}_${id}`,
      username: user,
      selectedValue: selectedValue,
      amount: amount,
      gameType: isNumber ? 'number' : 'color',
      createdAt: new Date(),
      isReal: false
    };
  }, []);

  useEffect(() => {
    let initial: any[] = [];
    const usedNames = new Set<string>();
    
    for (let i = 0; i < 5; i++) {
        let attempts = 0;
        let newFake;
        do {
            newFake = generateFakeBet(Date.now() + i);
            attempts++;
        } while (usedNames.has(newFake.username) && attempts < 10);
        usedNames.add(newFake.username);
        initial.push(newFake);
    }
    setDisplayedItems(initial);
  }, [generateFakeBet]);

  useEffect(() => {
    if (displayedItems.length === 0) return;

    let timeoutId: NodeJS.Timeout;

    const nextUpdate = () => {
       setDisplayedItems(prev => {
          const indexToReplace = Math.floor(Math.random() * 5);
          const currentNames = new Set(prev.map(item => item.username));
          
          let newItem = null;

          for (const bet of realBets) {
             if (!currentNames.has(bet.username)) {
                newItem = { ...bet, id: `real_${bet.id}_${Date.now()}` }; 
                break;
             }
          }

          if (!newItem) {
             let attempts = 0;
             let newFake;
             do {
                 newFake = generateFakeBet(Date.now());
                 attempts++;
             } while (currentNames.has(newFake.username) && attempts < 10);
             newItem = newFake;
          }

          const newArr = [...prev];
          newArr[indexToReplace] = newItem;
          return newArr;
       });

       const delay = Math.floor(Math.random() * (90000 - 60000 + 1)) + 60000;
       timeoutId = setTimeout(nextUpdate, delay);
    };

    const initialDelay = Math.floor(Math.random() * (90000 - 60000 + 1)) + 60000;
    timeoutId = setTimeout(nextUpdate, initialDelay);

    return () => clearTimeout(timeoutId);
  }, [realBets, displayedItems.length, generateFakeBet]);

  if (displayedItems.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
          Live Activity Feed
        </h3>
        <span className="text-[10px] font-bold text-slate-600 tabular-nums">2,481 ONLINE</span>
      </div>
      <div className="space-y-2 relative h-[350px]">
        <AnimatePresence mode="popLayout">
          {displayedItems.map((bet) => (
            <motion.div
              layout
              key={bet.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-slate-900 border border-slate-800/50 p-3 rounded-xl flex items-center justify-between group hover:border-slate-700 transition-all mb-2"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 group-hover:text-cyan-400">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-none mb-1">{bet.username || 'User'}</p>
                  <div className="flex gap-1 items-center">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Bet on</p>
                    <div className={cn("px-1.5 py-px rounded text-[9px] font-black uppercase text-slate-950", bet.gameType === 'number' ? 'bg-cyan-400' : 'bg-pink-400')}>
                        {bet.selectedValue}
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-cyan-400 font-mono tracking-tighter">{formatCurrency(bet.amount)}</p>
                <div className="flex items-center gap-1 justify-end">
                   <TrendingUp className="w-2 h-2 text-emerald-500" />
                   <span className="text-[8px] text-slate-600 font-bold">Just now</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
