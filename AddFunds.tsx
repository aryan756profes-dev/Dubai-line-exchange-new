import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '../components/UI';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle, Upload, CheckCircle2, ChevronLeft } from 'lucide-react';
import { submitFundRequest } from '../lib/db';
import { Link } from 'react-router-dom';

export default function AddFunds() {
  const { user, profile } = useAuth();
  const [amount, setAmount] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        setError('Image size must be less than 1MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result as string);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseInt(amount) < 300) return setError('Minimum amount is ₹300');
    if (transactionId.length !== 12 || !/^\d+$/.test(transactionId)) {
      return setError('Enter valid 12 digit UTR ID');
    }
    if (!screenshot) return setError('Please upload payment screenshot');
    
    setLoading(true);
    try {
      await submitFundRequest({
        uid: user?.uid,
        username: profile?.username,
        amount: parseInt(amount),
        transactionId,
        screenshotUrl: screenshot, // Saving base64 for now
        paymentMethod: 'UPI',
      });
      setSuccess(true);
    } catch (err: any) {
      setError('Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[80vh] text-center space-y-6">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-2xl font-black italic tracking-tighter uppercase mb-2">Request Submitted!</h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-[280px] mx-auto">
            Your deposit request of <span className="text-white font-bold">₹{amount}</span> is under review. 
            <br/><br/>
            <span className="text-cyan-400 font-bold uppercase text-[10px] tracking-widest bg-cyan-400/10 px-3 py-1 rounded-full">Manual verification in progress</span>
          </p>
        </div>
        <Button onClick={() => navigate('/')} variant="secondary" className="w-full max-w-[200px]">BACK TO HOME</Button>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/" className="p-2 border border-slate-800 rounded-full bg-slate-900">
           <ChevronLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-2xl font-black italic tracking-tighter uppercase">Add Funds</h2>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
        <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center text-cyan-500 shrink-0">
          <Upload className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-white uppercase tracking-widest">Manual Proof Submission</p>
          <p className="text-[10px] text-slate-500 font-medium">Upload your payment receipt and enter the transaction ID below for verification.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="space-y-4">
           <div className="space-y-1">
             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Username</label>
             <input 
              type="text" 
              value={profile?.username || ''}
              readOnly
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm font-bold text-slate-400 outline-none cursor-not-allowed"
             />
           </div>

           <div className="space-y-1">
             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Amount Added (₹)</label>
             <input 
              type="number" 
              placeholder="e.g. 500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-4 px-4 text-xl font-bold font-mono text-cyan-400 placeholder:text-slate-800 focus:border-cyan-500 outline-none transition-all"
              required min="100"
             />
           </div>

           <div className="space-y-1">
             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Transaction / UTR ID</label>
             <input 
              type="text" 
              placeholder="12 Digit ID from Receipt"
              value={transactionId}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 12);
                setTransactionId(val);
                if (val.length > 0 && val.length < 12) {
                  setError('Enter valid 12 digit UTR ID');
                } else {
                  setError('');
                }
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm font-medium text-slate-200 placeholder:text-slate-800 outline-none border-b-2 border-b-cyan-500/30"
              required
             />
           </div>
        </Card>

        <Card className="p-0 overflow-hidden">
          <label className="cursor-pointer block">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileChange}
            />
            {!screenshot ? (
              <div className="border-2 border-dashed border-slate-800 bg-slate-950/50 p-8 text-center space-y-4 hover:bg-slate-900/50 transition-colors">
                <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center text-slate-500 mx-auto">
                    <Upload className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-sm font-bold text-white">Upload Screenshot Proof</p>
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-1">Required for verification</p>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-lg border border-slate-800 text-[10px] font-bold text-slate-400">
                  CHOOSE FILE
                </div>
              </div>
            ) : (
              <div className="relative group">
                <img src={screenshot} alt="Preview" className="w-full aspect-video object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-2" />
                  <p className="text-xs font-bold text-white uppercase tracking-widest">Screenshot Attached</p>
                  <p className="text-[10px] text-slate-500 mt-1">Click to change</p>
                </div>
              </div>
            )}
          </label>
        </Card>

        <div className="pt-2">
          <a
            href="https://t.me/Fearless_990"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center justify-center overflow-hidden rounded-full font-black px-6 py-4 transition-all duration-300 shadow-lg bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-500 hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] text-white w-full outline-none transform active:scale-95 hover:scale-[1.02] animate-[pulse-slow_2s_ease-in-out_infinite] min-h-[56px]"
          >
            {/* Outer Glow behind button */}
            <div className="absolute -inset-1 blur-lg transition-opacity duration-300 opacity-60 group-hover:opacity-100 rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400" />
            
            {/* Background to maintain base color */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-500 z-0" />
            
            {/* Ripple/Sweep effect - continuous */}
            <div className="absolute inset-0 -translate-x-[150%] skew-x-[-20deg] animate-[sweep_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent z-0 pointer-events-none rounded-full" />
            
            {/* Actual content */}
            <span className="relative z-10 flex items-center justify-center gap-3 drop-shadow-sm uppercase tracking-widest text-sm sm:text-base w-full">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="currentColor" 
                className="w-5 h-5 sm:w-6 sm:h-6"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.49-1-.65-.35-1.01.21-1.6l3.05-2.82c.15-.14.03-.31-.19-.17l-3.8 2.39c-.58.38-1.11.56-1.63.55-.58-.01-1.68-.32-2.5-.59-.68-.22-1.22-.34-1.18-.72.02-.2.24-.41.67-.62 2.62-1.14 5.25-2.29 7.85-3.41 1.25-.53 2.15-.9 2.76-.9.13 0 .42.03.57.14.13.1.18.25.19.41-.01.07-.01.21-.02.36z" />
              </svg>
              <span>Only Payment</span>
            </span>
          </a>
        </div>

        {error && <p className="text-red-500 text-xs text-center font-bold px-4">{error}</p>}

        <Button 
          type="submit" 
          disabled={loading || transactionId.length !== 12 || !/^\d+$/.test(transactionId) || !amount || !screenshot} 
          className="w-full py-4 text-base shadow-lg shadow-cyan-500/20" 
          glow
        >
           {loading ? 'PROCESSING...' : 'SUBMIT DEPOSIT REQUEST'}
        </Button>
      </form>
    </div>
  );
}
