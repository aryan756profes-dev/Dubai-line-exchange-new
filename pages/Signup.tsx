import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Button } from '../components/UI';
import { User, Lock, Mail, UserCheck, ShieldCheck } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, runTransaction, serverTimestamp } from 'firebase/firestore';

export default function Signup() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreed: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) return setError('Passwords do not match');
    if (!formData.agreed) return setError('Please agree to the terms');
    
    setLoading(true);
    setError('');

    try {
      const usernameLower = formData.username.trim().toLowerCase();
      const emailValue = formData.email.trim().toLowerCase();

      // 1. First check if username exists (Pre-flight check)
      const usernameDoc = await getDoc(doc(db, 'usernames', usernameLower));
      if (usernameDoc.exists()) {
        throw new Error('Username already taken');
      }
      
      // 2. Create the auth user
      const userCredential = await createUserWithEmailAndPassword(auth, emailValue, formData.password);
      const { user } = userCredential;

      // 3. Finalize profile creation in transaction
      await runTransaction(db, async (transaction) => {
        const usernameRef = doc(db, 'usernames', usernameLower);
        const usernameSnap = await transaction.get(usernameRef);
        
        if (usernameSnap.exists()) {
          throw new Error('Username already taken');
        }

        // Save username and profile
        transaction.set(usernameRef, { uid: user.uid });
        transaction.set(doc(db, 'users', user.uid), {
          uid: user.uid,
          username: formData.username.trim(),
          email: emailValue,
          balance: 0,
          bonusBalance: 0,
          lockedBalance: 0,
          depositAmount: 0,
          requiredWager: 0,
          wagerCompleted: 0,
          isAdmin: false,
          role: 'user',
          isBlocked: false,
          createdAt: serverTimestamp(),
        });
      });

      navigate('/dashboard');
    } catch (err: any) {
      console.error("Signup error:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Email already in use');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error: Browser security may be blocking requests in this iframe. Try opening the app in a new tab.');
      } else {
        setError(err.message || 'Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">DUBAI LINE <span className="text-cyan-400">EXCHANGE</span></h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Join the Elite Exchange</p>
        </div>

        <Card className="p-8 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-cyan-400" /> Create Account
          </h2>
          
          <form className="space-y-4" onSubmit={handleSignup}>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Choose Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                <input 
                  type="text" 
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 focus:border-cyan-500 outline-none transition-all placeholder:text-slate-800"
                  placeholder="CoolExchanger"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 focus:border-cyan-500 outline-none transition-all placeholder:text-slate-800"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                <input 
                  type="password" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 focus:border-cyan-500 outline-none transition-all placeholder:text-slate-800"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Confirm Password</label>
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                <input 
                  type="password" 
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 focus:border-cyan-500 outline-none transition-all placeholder:text-slate-800"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex items-start gap-3 py-2">
              <input 
                type="checkbox" 
                id="terms"
                checked={formData.agreed}
                onChange={(e) => setFormData({...formData, agreed: e.target.checked})}
                className="mt-1 w-4 h-4 rounded border-slate-800 bg-slate-950 text-cyan-500 focus:ring-cyan-500"
              />
              <label htmlFor="terms" className="text-xs text-slate-400 leading-relaxed">
                I agree to the <Link to="/terms" className="text-cyan-400 underline underline-offset-2">Terms & Conditions</Link> and confirm that I am over 18 years of age.
              </label>
            </div>

            {error && <p className="text-red-500 text-xs font-medium text-center">{error}</p>}

            <Button 
              type="submit" 
              className="w-full mt-2" 
              loading={loading} 
              glow
            >
              REGISTER ACCOUNT
            </Button>
          </form>
        </Card>

        <div className="text-center">
          <p className="text-slate-500 text-sm">Already a member?</p>
          <Link to="/login" className="text-cyan-400 font-bold block mt-2 hover:underline underline-offset-4">LOGIN TO YOUR EXCHANGE</Link>
        </div>
      </div>
    </div>
  );
}
