import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button } from '../components/UI';
import { PremiumButton } from '../components/PremiumButton';
import { PlusCircle, Wallet, Gift, Gamepad2, Trophy, Clock, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, onSnapshot, orderBy, limit, doc, runTransaction, increment, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatCurrency } from '../lib/utils';
import { RecentWinners } from '../components/SocialFeed';

export default function Home() {
  const { user, profile } = useAuth();
  const [banners, setBanners] = useState<any[]>([]);
  const [nextNumberResult, setNextNumberResult] = useState<Date | null>(null);
  const [nextColorResult, setNextColorResult] = useState<Date | null>(null);
  const [showBonusPopup, setShowBonusPopup] = useState(false);
  const [bonusCode, setBonusCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleClaimBonus = async () => {
    if (!user) return setError('Login required');
    if (!bonusCode) return setError('Enter code');
    
    setLoading(true);
    setError('');
    
    try {
      const code = bonusCode.trim().toUpperCase();
      const bonusRef = doc(db, 'bonusCodes', code);
      
      const claimedAmount = await runTransaction(db, async (transaction) => {
        const bonusSnap = await transaction.get(bonusRef);
        if (!bonusSnap.exists()) throw new Error('Invalid bonus code');
        
        const bonusData = bonusSnap.data();
        if (!bonusData.isActive) throw new Error('Code is inactive');
        
        if (bonusData.expiry && bonusData.expiry.toDate() < new Date()) {
          throw new Error('Code expired');
        }
        
        if (bonusData.usageLimit > 0 && (bonusData.usedCount || 0) >= bonusData.usageLimit) {
          throw new Error('Code limit exhausted');
        }
        
        const usageId = `${user.uid}_${code}`;
        const usageRef = doc(db, 'userBonusUsage', usageId);
        const usageSnap = await transaction.get(usageRef);
        
        if (usageSnap.exists()) {
          throw new Error('Already claimed');
        }
        
        transaction.set(usageRef, {
          userId: user.uid,
          code: code,
          amount: bonusData.amount,
          usedAt: serverTimestamp()
        });
        
        transaction.update(bonusRef, {
          usedCount: increment(1)
        });
        
        console.log(`Claiming bonus for user ${user.uid}: code ${code}`);
        const userRef = doc(db, 'users', user.uid);
        
        const multiplier = bonusData.wagerMultiplier || 1;
        const wagerAmount = bonusData.amount * multiplier;
        
        transaction.update(userRef, {
          balance: increment(bonusData.amount),
          requiredWager: increment(wagerAmount),
          updatedAt: serverTimestamp()
        });
        
        return bonusData.amount;
      });

      setSuccess(`Congratulations! ${formatCurrency(claimedAmount)} bonus added to your balance.`);
      setBonusCode('');
      setTimeout(() => {
        setSuccess('');
        setShowBonusPopup(false);
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to claim bonus');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Calculcate next result times accurately using UTC
    const updateTimers = () => {
      const nowUtc = new Date();

      // Number: 10am IST = 04:30 UTC, 10pm IST = 16:30 UTC
      let n_next1 = new Date(Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth(), nowUtc.getUTCDate(), 4, 30, 0));
      let n_next2 = new Date(Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth(), nowUtc.getUTCDate(), 16, 30, 0));
      if (nowUtc > n_next2) {
         n_next1.setUTCDate(n_next1.getUTCDate() + 1);
         n_next2.setUTCDate(n_next2.getUTCDate() + 1);
      }
      setNextNumberResult(nowUtc > n_next1 ? n_next2 : n_next1);

      // Color: 11:30am IST = 06:00 UTC, 9pm IST = 15:30 UTC
      let c_next1 = new Date(Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth(), nowUtc.getUTCDate(), 6, 0, 0));
      let c_next2 = new Date(Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth(), nowUtc.getUTCDate(), 15, 30, 0));
      if (nowUtc > c_next2) {
         c_next1.setUTCDate(c_next1.getUTCDate() + 1);
         c_next2.setUTCDate(c_next2.getUTCDate() + 1);
      }
      setNextColorResult(nowUtc > c_next1 ? c_next2 : c_next1);
    };

    updateTimers();
    const interval = setInterval(updateTimers, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="pb-24 px-4 pt-4 space-y-6">
      {/* Promotional Banner */}
      <Card className="h-44 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 p-0 overflow-hidden border-indigo-500/20 relative group" glow>
        <div className="h-full w-full flex flex-col justify-center px-8 relative z-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-400/10 blur-3xl opacity-50" />
          <p className="text-indigo-400 font-bold text-[10px] tracking-[0.2em] mb-1 uppercase">Limited Time Offer</p>
          <h2 className="text-3xl font-black italic tracking-tighter leading-none mb-1 text-white">100% WELCOME BONUS</h2>
          <p className="text-white/60 text-xs font-bold mb-4 italic uppercase">ON YOUR FIRST DEPOSIT UP TO {formatCurrency(1000)}</p>
          <div className="flex gap-3">
            <Link to="/add-funds">
              <PremiumButton variant="deposit" className="text-xs py-2 px-5 sm:px-6">
                DEPOSIT NOW
              </PremiumButton>
            </Link>
            <PremiumButton variant="bonus" onClick={() => setShowBonusPopup(true)} className="text-xs py-2 px-5 sm:px-6">
              CLAIM BONUS
            </PremiumButton>
          </div>
        </div>
        <div className="absolute right-[-10%] top-[-20%] w-64 h-64 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors" />
      </Card>

      {/* Main Actions */}
      <div className="grid grid-cols-3 gap-2">
        <Link to="/add-funds" className="flex flex-col items-center gap-1">
          <div className="w-full aspect-square bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-cyan-400 group active:scale-95 transition-all">
            <PlusCircle className="w-8 h-8 group-hover:scale-110" />
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Deposit</span>
        </Link>
        <Link to="/withdraw" className="flex flex-col items-center gap-1">
          <div className="w-full aspect-square bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-100 group active:scale-95 transition-all">
            <Wallet className="w-8 h-8 group-hover:scale-110" />
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Withdraw</span>
        </Link>
        <button onClick={() => setShowBonusPopup(true)} className="flex flex-col items-center gap-1">
          <div className="w-full aspect-square bg-cyan-500 border border-cyan-400 rounded-2xl flex items-center justify-center text-slate-950 group active:scale-95 transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <Gift className="w-8 h-8 group-hover:scale-110" />
          </div>
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Bonus</span>
        </button>
      </div>

      {/* Quick Access Games */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-cyan-400" /> Live Games
          </h3>
        </div>
        
        <div className="space-y-4">
          <Link to="/game/number">
            <Card className="hover:border-cyan-500/50 transition-colors group cursor-pointer" glow>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-xl uppercase tracking-tighter">Number <span className="text-cyan-400 underline decoration-2 underline-offset-4">Exchange</span></h4>
                  <p className="text-slate-500 text-xs font-medium mt-1">Pick 1 to 99</p>
                </div>
                <div className="bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full text-[10px] font-bold border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.1)] flex items-center gap-1">
                   <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" /> LIVE
                </div>
              </div>
              <div className="flex items-center gap-4 bg-slate-950/50 rounded-xl p-3 border border-slate-800">
                <Clock className="w-4 h-4 text-slate-500" />
                <div className="flex-1">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Next Result</p>
                  <p className="text-cyan-400 font-mono text-sm leading-tight">
                    {nextNumberResult?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/game/color">
            <Card className="hover:border-pink-500/50 transition-colors group cursor-pointer">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-xl uppercase tracking-tighter">Color <span className="text-pink-500 underline decoration-2 underline-offset-4">X-Line</span></h4>
                  <p className="text-slate-500 text-xs font-medium mt-1">Pick from 10 Colors</p>
                </div>
                <div className="bg-pink-500/10 text-pink-500 px-3 py-1 rounded-full text-[10px] font-bold border border-pink-500/20 shadow-[0_0_10px_rgba(236,72,153,0.1)]">LIVE</div>
              </div>
              <div className="flex items-center gap-4 bg-slate-950/50 rounded-xl p-3 border border-slate-800">
                <Clock className="w-4 h-4 text-slate-500" />
                <div className="flex-1">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Next Result</p>
                  <p className="text-pink-500 font-mono text-sm leading-tight">
                    {nextColorResult?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </section>

      {/* Hall of Fame - Global Component */}
      <RecentWinners />

      {/* Bonus Popup */}
      <AnimatePresence>
        {showBonusPopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowBonusPopup(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-md">
              <Card glow className="p-8 text-center space-y-6 bg-slate-900 border-cyan-500/30">
                <div className="mx-auto w-20 h-20 bg-cyan-500/10 rounded-3xl flex items-center justify-center text-cyan-400 rotate-12 group hover:rotate-0 transition-transform">
                  <Gift className="w-10 h-10" />
                </div>
                <div>
                  <h4 className="text-2xl font-black tracking-tighter uppercase italic text-white">Claim Rewards</h4>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Enter bonus code to unlock credits</p>
                </div>
                
                <div className="space-y-4">
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="e.g. WELCOME100" 
                      value={bonusCode}
                      onChange={(e) => setBonusCode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-4 text-center text-lg font-black tracking-widest text-cyan-400 placeholder:text-slate-800 focus:border-cyan-500 outline-none transition-all shadow-inner uppercase" 
                    />
                  </div>

                  {error && <div className="text-red-500 text-[10px] font-bold flex items-center justify-center gap-1 bg-red-500/5 p-2 rounded-lg border border-red-500/10 italic"><AlertCircle className="w-3 h-3" />{error}</div>}
                  {success && <div className="text-emerald-500 text-[10px] font-bold flex items-center justify-center gap-1 bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10 italic"><CheckCircle2 className="w-3 h-3" />{success}</div>}

                  <PremiumButton
                    variant="bonus" 
                    className="w-full py-5 text-base font-black shadow-xl" 
                    onClick={handleClaimBonus}
                    loading={loading}
                  >
                    CLAIM BONUS
                  </PremiumButton>
                </div>
                <button onClick={() => setShowBonusPopup(false)} className="text-slate-600 font-bold uppercase text-[10px] tracking-widest hover:text-slate-400 transition-colors">Maybe Later</button>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
