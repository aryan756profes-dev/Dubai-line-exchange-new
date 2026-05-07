import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Button, Modal } from '../components/UI';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle, ArrowDownCircle, CheckCircle2, ChevronLeft, Building2, Smartphone, Wallet, ShieldCheck } from 'lucide-react';
import { submitWithdrawRequest } from '../lib/db';
import { formatCurrency, cn } from '../lib/utils';

export default function Withdraw() {
  const { user, profile } = useAuth();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'UPI' | 'Bank'>('UPI');
  const [accountDetails, setAccountDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const requiredWager = profile?.requiredWager || 0;
  const wagerCompleted = profile?.wagerCompleted || 0;

  const preWithdrawable = profile?.withdrawableAmount || 0;
  const finalLocked = profile?.lockedAmount || 0;
  const availableBalance = (profile?.balance || 0) - finalLocked;
  const finalWithdrawable = Math.min(availableBalance, preWithdrawable);
  const progressRatio = profile?.progressRatio || (requiredWager === 0 ? 1 : 0);

  const remainingWager = Math.max(0, requiredWager - wagerCompleted);
  const rolloverProgress = progressRatio * 100;

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const withdrawAmount = parseInt(amount);
    
    if (!amount || withdrawAmount < 500) return setError('Minimum withdrawal is ₹500');
    if (finalWithdrawable < withdrawAmount) return setError(`Insufficient unlocked balance. You can only withdraw up to ${formatCurrency(Math.max(0, finalWithdrawable))}.`);
    if (!accountDetails || accountDetails.length < 5) return setError('Please enter valid payout details');
    
    setError('');
    setShowConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    setLoading(true);
    setShowConfirm(false);
    
    try {
      if (!user) throw new Error('Not authenticated');
      
      await submitWithdrawRequest({
        uid: user.uid,
        username: profile?.username,
        amount: parseInt(amount),
        method,
        accountDetails,
      });
      setSuccess(true);
    } catch (err: any) {
      console.error('Withdrawal error:', err);
      const message = err.message || '';
      if (message.includes('Insufficient balance')) {
        setError('Insufficient balance');
      } else {
        setError('Request failed. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[80vh] text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="relative">
          <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full" />
          <div className="relative w-24 h-24 bg-slate-900 border border-amber-500/30 rounded-full flex items-center justify-center text-amber-500 shadow-2xl">
            <CheckCircle2 className="w-12 h-12" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">Request Placed</h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-[300px] mx-auto">
            Your withdrawal of <span className="text-amber-400 font-bold">₹{amount}</span> has been submitted. 
            <br/><br/>
            Funds are typically processed within <span className="text-white font-bold">2 to 12 hours</span> after a security audit of your gaming history.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-[240px]">
          <Button onClick={() => navigate('/activity')} variant="outline" className="w-full">VIEW REQUEST STATUS</Button>
          <Button onClick={() => navigate('/')} variant="secondary" className="w-full">BACK TO HOME</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 space-y-6 max-w-xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/')} className="p-2 border border-slate-800 rounded-full bg-slate-900 text-slate-400 hover:text-white transition-colors">
           <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white">Secure Payout</h2>
      </div>

      {/* Balance Tracker */}
      <Card className="bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20 flex flex-col items-center py-8">
         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Available for Withdrawal</span>
         <span className="text-4xl font-black text-amber-500 tabular-nums">{formatCurrency(finalWithdrawable)}</span>
         {finalLocked > 0 ? (
           <p className="text-[10px] font-bold text-slate-600 mt-2 uppercase tracking-tight">
             Note: {formatCurrency(finalLocked)} is currently locked (Due to wager or active bets)
           </p>
         ) : null}
      </Card>

      {/* Rollover Tracker */}
      {requiredWager > 0 && (
      <Card className={cn(
        "bg-slate-900 border p-5 space-y-4",
        rolloverProgress >= 100 ? "border-emerald-500/20 shadow-lg shadow-emerald-500/5" : "border-slate-800"
      )}>
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                rolloverProgress >= 100  ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
              )}>
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Withdrawal Status</span>
                <span className={cn("text-xs font-black uppercase tracking-tighter", rolloverProgress >= 100 ? "text-emerald-500" : "text-amber-500")}>
                  {rolloverProgress >= 100 ? "Wager completed" : "Partial withdrawal unlocked"}
                </span>
              </div>
           </div>
           <div className="text-right">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Progress</span>
              <span className="text-sm font-black text-white tabular-nums">{Math.round(rolloverProgress)}%</span>
           </div>
        </div>

        <div className="space-y-2">
           <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
              <div 
                style={{ width: `${rolloverProgress}%` }}
                className={cn(
                  "h-full rounded-full transition-all duration-1000 ease-out",
                  rolloverProgress >= 100 ? "bg-gradient-to-r from-emerald-600 to-emerald-400" : "bg-gradient-to-r from-amber-600 to-amber-400"
                )}
              />
           </div>
           <div className="flex justify-between items-center text-[10px] font-bold tracking-tight">
              <span className="text-slate-500 italic text-[9px]">
                {formatCurrency(wagerCompleted)} / {formatCurrency(requiredWager)} completed ({Math.floor(rolloverProgress)}%)
              </span>
              {rolloverProgress < 100 ? (
                <span className="text-amber-500 uppercase font-black">
                  {formatCurrency(remainingWager)} wager remaining
                </span>
              ) : (
                <span className="text-emerald-500 uppercase font-black space-x-1">
                  <span>Requirements Met</span>
                </span>
              )}
           </div>
        </div>

        <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/50">
           <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                 <span className="text-[8px] text-slate-600 font-bold uppercase block text-center">Required</span>
                 <span className="text-xs font-bold text-slate-300 block text-center">{formatCurrency(requiredWager)}</span>
              </div>
              <div className="space-y-1 border-x border-slate-800 px-2">
                 <span className="text-[8px] text-slate-600 font-bold uppercase block text-center">Completed</span>
                 <span className="text-xs font-bold text-slate-300 block text-center">{formatCurrency(wagerCompleted)}</span>
              </div>
              <div className="space-y-1">
                 <span className="text-[8px] text-slate-600 font-bold uppercase block text-center">Remaining</span>
                 <span className={cn("text-xs font-bold block text-center", remainingWager > 0 ? "text-amber-500" : "text-emerald-500")}>
                    {formatCurrency(remainingWager)}
                 </span>
              </div>
           </div>
        </div>

        {rolloverProgress < 100 && (
          <p className="text-[10px] text-center text-amber-500 font-bold bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
            ⚠ Your available withdrawal is proportional to your wager progress.
          </p>
        )}
      </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
         <button 
           onClick={() => setMethod('UPI')}
           className={cn(
             "p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all",
             method === 'UPI' ? "bg-slate-900 border-amber-500 text-amber-500" : "bg-slate-950 border-slate-800 text-slate-500 opacity-50"
           )}
         >
           <Smartphone className="w-6 h-6" />
           <span className="text-[10px] font-black uppercase tracking-widest">UPI Payout</span>
         </button>
         <button 
           onClick={() => setMethod('Bank')}
           className={cn(
             "p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all",
             method === 'Bank' ? "bg-slate-900 border-amber-500 text-amber-500" : "bg-slate-950 border-slate-800 text-slate-500 opacity-50"
           )}
         >
           <Building2 className="w-6 h-6" />
           <span className="text-[10px] font-black uppercase tracking-widest">Bank IMPS</span>
         </button>
      </div>

      <form onSubmit={handlePreSubmit} className="space-y-8">
        <div className="space-y-4">
           <div className="space-y-2">
             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Payout Amount (₹)</label>
             <div className="relative">
                <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-700" />
                <input 
                  type="number" 
                  placeholder="Min. 500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-5 pl-12 pr-4 text-2xl font-black font-mono text-white placeholder:text-slate-800 focus:border-amber-500/50 outline-none transition-all"
                  required min="500"
                />
             </div>
             <div className="flex justify-between px-1">
                <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Available: {formatCurrency(finalWithdrawable)}</span>
                <button 
                  type="button"
                  onClick={() => setAmount(finalWithdrawable.toString())}
                  className="text-[9px] text-amber-500 font-bold uppercase tracking-widest hover:underline"
                >
                  Withdraw Available
                </button>
             </div>
           </div>

           <div className="space-y-2">
             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
               {method === 'UPI' ? 'UPI Address' : 'Bank Account Details'}
             </label>
             <textarea 
              rows={3}
              placeholder={method === 'UPI' ? "e.g. username@upi" : "Name, Account Number, IFSC Code"}
              value={accountDetails}
              onChange={(e) => setAccountDetails(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-4 text-sm font-medium text-slate-200 placeholder:text-slate-800 outline-none focus:border-amber-500/50 min-h-[100px] shadow-inner"
              required
             />
           </div>
        </div>

        <Card className="bg-amber-500/5 border-dashed border-amber-500/20 py-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
            Funds will be deducted from your balance immediately. Rejection by admin will refund the amount to your main balance automatically.
          </p>
        </Card>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold text-center">
            {error}
          </div>
        )}

        <Button 
          type="submit"
          loading={loading}
          disabled={finalWithdrawable < 500}
          className="w-full py-5 text-base font-black shadow-xl shadow-amber-500/10 disabled:opacity-50 disabled:grayscale transition-all"
        >
          <ArrowDownCircle className="w-5 h-5 mr-1" /> {finalWithdrawable >= 500 ? 'REQUEST PAYOUT' : 'MORE WAGER REQUIRED (MIN ₹500)'}
        </Button>
      </form>

      <Modal 
        isOpen={showConfirm} 
        onClose={() => setShowConfirm(false)}
        title="Confirm Payout"
      >
        <div className="space-y-6">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
               <span className="text-[10px] text-slate-500 font-bold uppercase">Amount</span>
               <span className="text-xl font-black text-amber-500 font-mono">{formatCurrency(parseInt(amount))}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
               <span className="text-[10px] text-slate-500 font-bold uppercase">Method</span>
               <span className="text-sm font-bold text-white uppercase">{method}</span>
            </div>
            <div>
               <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Receiving Account</span>
               <p className="text-xs font-medium text-slate-300 break-all leading-relaxed">{accountDetails}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium bg-slate-900 p-3 rounded-xl">
             <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
             Ensure your details are accurate. We are not responsible for funds sent to incorrect accounts.
          </div>

          <div className="grid grid-cols-2 gap-3">
             <Button variant="secondary" onClick={() => setShowConfirm(false)}>CANCEL</Button>
             <Button onClick={handleConfirmSubmit} glow>CONFIRM</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
