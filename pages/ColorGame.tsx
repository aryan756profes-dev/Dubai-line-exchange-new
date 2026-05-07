import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button } from '../components/UI';
import { Clock, History, CheckCircle2, AlertCircle, TrendingUp, ChevronLeft, HelpCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, increment, doc, runTransaction, limit, getDocs } from 'firebase/firestore';
import { cn, formatCurrency, computeUserFinancials } from '../lib/utils';

export default function ColorGame() {
  const { user, profile } = useAuth();
  const [betAmount, setBetAmount] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showRules, setShowRules] = useState(false);
  
  const [timeLeft, setTimeLeft] = useState({ minutes: 0, seconds: 0 });
  const lastSettledSession = useRef<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isGameEnabled, setIsGameEnabled] = useState(true);

  useEffect(() => {
    // Check if game is enabled
    const unsubSettings = onSnapshot(doc(db, 'settings', 'colorGame'), (snap) => {
      if (snap.exists()) {
        setIsGameEnabled(snap.data().enabled ?? true);
      }
    });

    const q = query(
      collection(db, 'results'),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const allResults = snap.docs.map(doc => ({ id: doc.id, ref: doc.ref, ...doc.data() }));
      const declaredResults = allResults.filter((r: any) => r.gameType === 'color' && r.isDeclared);
      setHistory(declaredResults.slice(0, 10));
    });

    return () => {
      unsubSettings();
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const nowUtc = new Date();
      // ColorGame: 11:30 AM IST (06:00 UTC), 09:00 PM IST (15:30 UTC)
      let next1 = new Date(Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth(), nowUtc.getUTCDate(), 6, 0, 0));
      let next2 = new Date(Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth(), nowUtc.getUTCDate(), 15, 30, 0));
      
      if (nowUtc > next2) {
         next1.setUTCDate(next1.getUTCDate() + 1);
         next2.setUTCDate(next2.getUTCDate() + 1);
      }
      const d = nowUtc > next1 ? next2 : next1;

      const diff = d.getTime() - nowUtc.getTime();
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      
      setTimeLeft({ minutes: mins, seconds: secs });
    }, 1000);

    return () => clearInterval(interval);
  }, [user]);

  const handlePlaceBet = async () => {
    if (!user) return setError('Please login to place bets');
    const amount = parseInt(betAmount);
    if (isNaN(amount) || amount <= 0) return setError('Invalid amount');
    if (selectedColor === null) return setError('Select a color');
    
    const availableBalance = profile?.balance || 0;
    if (availableBalance < amount) return setError('Insufficient balance');

    setLoading(true);
    setError('');
    
    try {
      // ColorGame: 11:30 AM IST (06:00 UTC), 09:00 PM IST (15:30 UTC)
      const nowUtc = new Date();
      let next1 = new Date(Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth(), nowUtc.getUTCDate(), 6, 0, 0));
      let next2 = new Date(Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth(), nowUtc.getUTCDate(), 15, 30, 0));
      
      if (nowUtc > next2) {
         next1.setUTCDate(next1.getUTCDate() + 1);
         next2.setUTCDate(next2.getUTCDate() + 1);
      }
      const d = nowUtc > next1 ? next2 : next1;
      const sessionId = `color-${d.getTime()}`;

      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await transaction.get(userRef);
        
        if (!userSnap.exists()) throw new Error("User error");
        const currentBalance = userSnap.data().balance || 0;
        const currentLockedAmount = userSnap.data().lockedAmount || 0;
        
        if (currentBalance - currentLockedAmount < amount) throw new Error("Insufficient balance");

        const requiredWager = userSnap.data().requiredWager || 0;
        const newWagerCompleted = (userSnap.data().wagerCompleted || 0) + amount;
        const newLockedAmount = currentLockedAmount + amount;
        const newStats = computeUserFinancials(currentBalance, requiredWager, newWagerCompleted);

        transaction.update(userRef, { 
          wagerCompleted: newWagerCompleted,
          lockedAmount: newLockedAmount,
          withdrawableAmount: newStats.withdrawableAmount,
          progressRatio: newStats.progressRatio,
          updatedAt: serverTimestamp()
        });
        
        const betRef = doc(collection(db, 'bets'));
        transaction.set(betRef, {
          userId: user.uid,
          username: profile?.fullName || 'User',
          gameType: 'color',
          selectedValue: selectedColor,
          amount,
          sessionId,
          status: 'pending',
          createdAt: serverTimestamp(),
        });
      });

      setSuccess('Bet placed successfully!');
      setBetAmount('');
      setSelectedColor(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to place bet');
    } finally {
      setLoading(false);
    }
  };

  const colors = [
    { name: 'Green', bg: 'bg-green-600' },
    { name: 'Navy', bg: 'bg-navy-900' },
    { name: 'Pink', bg: 'bg-pink-500' },
    { name: 'Red', bg: 'bg-red-600' },
    { name: 'Grey', bg: 'bg-gray-500' },
    { name: 'Brown', bg: 'bg-amber-900' },
    { name: 'Tan', bg: 'bg-orange-200' },
    { name: 'Yellow', bg: 'bg-yellow-400' },
    { name: 'White', bg: 'bg-white' },
    { name: 'Orange', bg: 'bg-orange-500' },
  ];

  return (
    <div className="p-4 pb-24 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 border border-slate-800 rounded-full bg-slate-900 text-slate-400 hover:text-white transition-colors">
               <ChevronLeft className="w-5 h-5" />
            </Link>
            <h2 className="text-xl font-black uppercase tracking-tight text-white">Color X-Line</h2>
          </div>
          <div className="text-right">
             <div className="flex items-center gap-2 justify-end mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Available</span>
             </div>
             <p className="text-sm font-black text-white leading-none tabular-nums">
               {formatCurrency((profile?.balance || 0) - (profile?.lockedAmount || 0))}
             </p>
             <p className="text-[10px] font-bold text-slate-600 mt-1 uppercase">Withdrawable: {formatCurrency(profile?.withdrawableAmount || 0)}</p>
          </div>
        </div>

        <Card className="flex flex-col items-center justify-center py-8 bg-slate-950 border-pink-500/20 relative overflow-hidden">
          {/* Rules Icon - Top Corner */}
          <button 
            onClick={() => setShowRules(true)}
            className="absolute top-3 right-3 text-slate-500 hover:text-pink-500 transition-colors p-1"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
             <Clock className="w-4 h-4 text-slate-500" />
             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">SESSION ENDING IN</span>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <span className="text-5xl font-black tabular-nums text-pink-500">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <p className="text-[8px] font-bold text-slate-500 uppercase mt-1">Minutes</p>
            </div>
            <span className="text-5xl font-black text-slate-800">:</span>
            <div className="text-center">
              <span className="text-5xl font-black tabular-nums text-pink-500">
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <p className="text-[8px] font-bold text-slate-500 uppercase mt-1">Seconds</p>
            </div>
          </div>
        </Card>

        {/* Dedicated Result Display Area */}
        <div className="flex justify-center">
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-6 py-3 min-w-[200px] text-center shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Latest Result</p>
            <p className={`text-2xl font-black ${history[0] && history[0].resultValue ? 'text-pink-500' : 'text-slate-400'}`}>
              {history[0] && (Date.now() - history[0].resultTime) < 3600000 ? history[0].resultValue : 'PENDING'}
            </p>
          </div>
        </div>

        <Card className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {colors.map((c) => (
              <button
                key={c.name}
                onClick={() => setSelectedColor(c.name)}
                className={cn(
                  "p-4 rounded-xl border flex items-center gap-3 transition-all",
                  selectedColor === c.name 
                    ? "border-pink-500 bg-pink-500/10 shadow-[0_0_15px_rgba(236,72,153,0.3)]" 
                    : "border-slate-800 bg-slate-950 hover:border-slate-700"
                )}
              >
                <div className={cn("w-6 h-6 rounded-full border border-white/20", c.bg)} />
                <span className={cn("font-bold text-sm", selectedColor === c.name ? "text-pink-500" : "text-slate-400")}>{c.name}</span>
              </button>
            ))}
          </div>
        </Card>

        <div className="space-y-4 sticky bottom-24 bg-slate-950/80 backdrop-blur-md p-4 border border-white/5 rounded-3xl">
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex items-center gap-3 focus-within:border-cyan-500 transition-all">
               <TrendingUp className="w-5 h-5 text-slate-600" />
               <input 
                type="number" 
                placeholder="Bet Amount" 
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className="bg-transparent w-full outline-none font-bold placeholder:text-slate-700 text-white"
               />
            </div>
            <div className="flex gap-1">
               {[100, 500, 1000].map(val => (
                 <button key={val} onClick={() => setBetAmount(val.toString())} className="px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-400">+{val}</button>
               ))}
            </div>
          </div>

          {error && <div className="flex items-center gap-2 text-red-500 text-xs bg-red-500/10 p-2 rounded-lg border border-red-500/20"><AlertCircle className="w-4 h-4" />{error}</div>}
          {success && <div className="flex items-center gap-2 text-green-500 text-xs bg-green-500/10 p-2 rounded-lg border border-green-500/20"><CheckCircle2 className="w-4 h-4" />{success}</div>}

          <Button 
            className="w-full py-4 text-base" 
            glow 
            variant={isGameEnabled ? "primary" : "secondary"}
            onClick={handlePlaceBet}
            disabled={loading || !isGameEnabled}
          >
            {!isGameEnabled ? 'EXCHANGE TEMPORARILY CLOSED' : loading ? 'CONFIRMING...' : 'SUBMIT PREDICTION'}
          </Button>
        </div>

        <section className="space-y-4">
          <h3 className="font-bold flex items-center gap-2 text-sm text-slate-400 tracking-widest uppercase">
            <History className="w-4 h-4 text-pink-400" /> Recent Result Board
          </h3>
          <Card className="p-0 overflow-x-auto bg-slate-900 border-pink-500/10">
            <div className="min-w-max flex gap-3 p-4">
               {history.slice(0, 5).map((record, i) => (
                  <motion.div 
                    key={record.id} 
                    initial={{ opacity: 0, scale: 0.9 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    transition={{ delay: i * 0.1 }}
                    className="flex flex-col items-center bg-slate-950 px-4 py-3 rounded-2xl border border-slate-800 shadow-xl"
                  >
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-xs bg-pink-500/10 text-pink-500 border border-pink-500/30 shadow-[0_0_15px_rgba(236,72,153,0.2)]">
                      {record.resultValue || "-"}
                    </div>
                  </motion.div>
               ))}
               {history.length === 0 && (
                 <div className="px-8 py-4 text-slate-600 text-[10px] font-bold uppercase tracking-widest italic flex items-center justify-center w-full">
                    Waiting for next settlement...
                 </div>
               )}
            </div>
          </Card>
        </section>

      <AnimatePresence>
        {showRules && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRules(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-sm">
              <Card glow className="p-6 bg-slate-900 border-pink-500/30 shadow-[0_0_30px_rgba(236,72,153,0.15)]">
                <button onClick={() => setShowRules(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
                <div className="mb-4">
                  <h3 className="text-xl font-black uppercase text-pink-500 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5" /> Game Rules
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-medium">Color X-Line</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="w-6 h-6 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500 shrink-0 mt-0.5"><div className="w-2 h-2 rounded-full bg-pink-500" /></div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">How to play</h4>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Select a color. Enter your bet amount and place your bet before the session starts.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5"><CheckCircle2 className="w-3 h-3" /></div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">Winning & Payout</h4>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">If your selected color wins, you get a <span className="font-bold text-emerald-400">9x</span> payout. Orange gives <span className="font-bold text-emerald-400">15x</span>.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="w-6 h-6 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400 shrink-0 mt-0.5"><Clock className="w-3 h-3" /></div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">Session Timings</h4>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">Results are declared exactly at the session end time. Wait for the admin to finalize the draw.</p>
                    </div>
                  </div>
                </div>
                <Button variant="primary" className="w-full mt-6" onClick={() => setShowRules(false)}>Got It, Let's Play</Button>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
