import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { RecentWinners, LiveActivity } from '../components/SocialFeed';
import { Card, Button } from '../components/UI';
import { Wallet, Gift, Lock, Clock, ArrowUpRight, ArrowDownLeft, ChevronRight, User, Activity as ActivityIcon, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn, formatCurrency } from '../lib/utils';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [recentRequests, setRecentRequests] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    
    const path = 'fundRequests';
    const q = query(
      collection(db, path),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setRecentRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'Deposit' })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Profile Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 border border-slate-800 rounded-full bg-slate-900 text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-black italic tracking-tighter uppercase leading-none text-white whitespace-nowrap">Dubai Line Exchange</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Prime Command Center</p>
          </div>
        </div>
        <Link to="/profile" className="p-2 border border-slate-800 rounded-full bg-slate-900 group">
           <User className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
        </Link>
      </div>

      {/* Social Win Marquee */}
      <RecentWinners />

      {/* Balance Cards */}
      <Card className="bg-slate-900 border-cyan-500/30 overflow-visible" glow>
        <div className="flex flex-col gap-1 mb-6">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Main Available Balance</span>
          <span className="text-4xl font-black text-white tabular-nums drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            {formatCurrency((profile?.balance || 0) - (profile?.lockedAmount || 0))}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
           <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Bonus</span>
              <span className="text-lg font-bold text-amber-500">{formatCurrency(profile?.bonusBalance || 0)}</span>
           </div>
           <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Exposure</span>
              <span className="text-lg font-bold text-slate-400">{formatCurrency(profile?.lockedAmount || 0)}</span>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
           <Link to="/add-funds" className="flex-1">
             <Button variant="primary" className="w-full py-4 text-sm" glow>
               <ArrowUpRight className="w-4 h-4" /> ADD FUNDS
             </Button>
           </Link>
           <Link to="/withdraw" className="flex-1">
             <Button variant="outline" className="w-full py-4 text-sm">
               <ArrowDownLeft className="w-4 h-4" /> WITHDRAW
             </Button>
           </Link>
        </div>
      </Card>

      {/* Recent History */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" /> Recent Requests
          </h3>
          <Link to="/activity" className="text-cyan-400 text-xs font-bold flex items-center gap-1">SEE ALL <ChevronRight className="w-4 h-4" /></Link>
        </div>

        <Card className="p-0">
          <div className="divide-y divide-slate-800">
            {recentRequests.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <Lock className="w-10 h-10 border border-slate-800 text-slate-800 rounded-full mx-auto mb-3 p-2" />
                <p className="text-sm">No recent transactions found</p>
              </div>
            ) : (
              recentRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-4 bg-slate-950/20 active:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border",
                      req.status === 'approved' ? "bg-green-500/10 border-green-500/20 text-green-500" :
                      req.status === 'rejected' ? "bg-red-500/10 border-red-500/20 text-red-500" :
                      "bg-amber-500/10 border-amber-500/20 text-amber-500"
                    )}>
                      <ArrowUpRight className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{req.type} Request</p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Ref: {req.referenceNote?.substring(0, 10)}...</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold tabular-nums text-slate-100">{formatCurrency(req.amount)}</p>
                    <p className={cn(
                      "text-[10px] font-black uppercase tracking-tighter",
                      req.status === 'approved' ? "text-green-500" :
                      req.status === 'rejected' ? "text-red-500" :
                      "text-amber-500"
                    )}>{req.status}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>

      {/* Quick Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LiveActivity />
        
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <ActivityIcon className="w-3 h-3 text-cyan-500" /> System Metrics
          </h3>
          <Card className="bg-slate-900 border-slate-800">
            <h4 className="font-bold mb-3 flex items-center gap-2">
               <Gift className="w-4 h-4 text-cyan-400" /> Account Perks
            </h4>
            <ul className="space-y-3">
              {[
                { title: "Priority Support", desc: "Elite membership status" },
                { title: "Fast Withdrawal", desc: "Approved in 2-4 hours" },
                { title: "Weekly Rebate", desc: "Get 5% back on losses" }
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                  <div>
                    <p className="text-xs font-bold text-white">{item.title}</p>
                    <p className="text-[10px] text-slate-500">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
