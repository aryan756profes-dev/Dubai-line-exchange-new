import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button } from '../components/UI';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cn, formatCurrency } from '../lib/utils';
import { Eye, Clock, CheckCircle2, XCircle, Gamepad2, ArrowRightLeft, ChevronLeft } from 'lucide-react';

type ActivityTab = 'bets' | 'funds' | 'withdraws';

export default function Activity() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ActivityTab>('bets');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const collectionMap = {
      bets: 'bets',
      funds: 'fundRequests',
      withdraws: 'withdrawRequests'
    };

    const q = query(
      collection(db, collectionMap[activeTab]),
      where(activeTab === 'bets' ? 'userId' : 'uid', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setData(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, activeTab]);

  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/" className="p-2 border border-slate-800 rounded-full bg-slate-900 text-slate-400 hover:text-white transition-colors">
           <ChevronLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-2xl font-black italic tracking-tighter uppercase">My Activity</h2>
      </div>

      <div className="flex gap-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
        {[
          { id: 'bets', label: 'Bets', icon: Gamepad2 },
          { id: 'funds', label: 'Deposits', icon: ArrowRightLeft },
          { id: 'withdraws', label: 'Payouts', icon: ArrowRightLeft }
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as ActivityTab)}
            className={cn(
              "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex flex-col items-center gap-1",
              activeTab === tab.id ? "bg-cyan-500 text-slate-950" : "text-slate-500"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center text-slate-500 font-bold uppercase tracking-widest animate-pulse">Loading Activity...</div>
        ) : data.length === 0 ? (
          <Card className="py-20 text-center text-slate-600 border-dashed border-slate-800">
             <Eye className="w-12 h-12 mx-auto mb-4 opacity-10" />
             <p className="font-bold">No records found for this section</p>
          </Card>
        ) : (
          data.map((item) => (
            <Card key={item.id} className="p-4 border-slate-800 bg-slate-950/40 relative">
               <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 block mb-1">
                      {new Date(item.createdAt?.toDate()).toLocaleString()}
                    </span>
                    <h4 className="font-bold text-sm uppercase">
                      {activeTab === 'bets' ? `${item.gameType} Game - ${item.selectedValue}` : `${activeTab.slice(0, -1)} Requested`}
                    </h4>
                  </div>
                  <div className={cn(
                    "px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border",
                    item.status === 'approved' || item.status === 'win' || item.status === 'won' ? "bg-green-500/10 border-green-500/20 text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.1)]" :
                    item.status === 'rejected' || item.status === 'loss' || item.status === 'lost' ? "bg-red-500/10 border-red-500/20 text-red-500" :
                    "bg-amber-500/10 border-amber-500/20 text-amber-500"
                  )}>
                    {item.status}
                  </div>
               </div>

               <div className="flex items-center justify-between pt-3 border-t border-slate-800/50">
                  <div className="flex gap-4">
                     <div>
                       <p className="text-[10px] font-bold text-slate-600 uppercase">Amount</p>
                       <p className="font-mono text-sm">{formatCurrency(item.amount)}</p>
                     </div>
                     {activeTab === 'bets' && (
                       <div>
                         <p className="text-[10px] font-bold text-slate-600 uppercase">Payout</p>
                         <p className={cn("font-mono text-sm", (item.status === 'win' || item.status === 'won') ? 'text-green-400' : 'text-slate-400')}>
                            {(item.status === 'win' || item.status === 'won') ? formatCurrency(item.winningAmount || item.payout) : '-'}
                         </p>
                       </div>
                     )}
                  </div>
                  <div className="text-[10px] font-mono text-slate-700">ID: {item.id.slice(0, 8)}...</div>
               </div>

               {/* Status Icon Decoration */}
               <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-5 pointer-events-none">
                  {item.status === 'approved' || item.status === 'win' || item.status === 'won' ? <CheckCircle2 className="w-16 h-16 text-green-500" /> :
                   item.status === 'rejected' || item.status === 'loss' || item.status === 'lost' ? <XCircle className="w-16 h-16 text-red-500" /> :
                   <Clock className="w-16 h-16 text-amber-500" />}
               </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
