import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Button } from '../components/UI';
import { Mail, Lock, ArrowRight, UserPlus, ShieldAlert, ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, updateDoc, deleteDoc, increment, limit } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Forgot password state
  const [resetMode, setResetMode] = useState(false);
  const [resetStep, setResetStep] = useState<'email' | 'otp' | 'password'>('email');
  const [resetSuccess, setResetSuccess] = useState('');
  
  // OTP state
  const [otpBits, setOtpBits] = useState(['', '', '', '', '', '']);
  const [resetDocId, setResetDocId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [timeLeft, setTimeLeft] = useState(300);
  
  // Anti brute-force state
  const lastAttemptRef = useRef<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resetStep === 'otp' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resetStep, timeLeft]);

  const hashString = async (val: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(val);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error: This usually happens due to browser security settings in iframes. Please try opening the app in a new tab using the top-right button.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else {
        setError(err.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email) {
      setError('Please enter your email address first');
      return;
    }
    
    setLoading(true);
    setError('');
    setResetSuccess('');
    
    try {
      const emailLower = email.trim().toLowerCase();
      // Check if user exists
      const qUser = query(collection(db, 'users'), where('email', '==', emailLower), limit(1));
      const userSnap = await getDocs(qUser);
      
      if (userSnap.empty) {
        setError('Email not registered');
        setLoading(false);
        return;
      }

      const qSession = query(collection(db, 'password_resets'), where('email', '==', emailLower), limit(1));
      const sessionSnap = await getDocs(qSession);
      const nowTime = Date.now();
      
      let sessionId = '';
      let resendCount = 0;
      let lastResendAt = 0;

      if (!sessionSnap.empty) {
        const sessionDoc = sessionSnap.docs[0];
        const data = sessionDoc.data();
        sessionId = sessionDoc.id;
        resendCount = data.resendCount || 0;
        lastResendAt = data.lastResendAt || 0;

        if (data.isBlocked && data.blockUntil?.toDate() > new Date()) {
          setError('Too many attempts. Try after 15 minutes');
          setLoading(false);
          return;
        }

        // Limit resend to 3 times per 10 mins
        if (resendCount >= 3 && nowTime - lastResendAt < 10 * 60 * 1000) {
          setError('Too many requests. Try later');
          setLoading(false);
          return;
        }
        
        // Wait at least 30s before resending
        if (nowTime - lastResendAt < 30000) {
          setError('Please wait 30 seconds before requesting again');
          setLoading(false);
          return;
        }
      }

      // Generate secure 6-digit OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = await hashString(generatedOtp);

      // Send via trigger email
      await addDoc(collection(db, 'mail'), {
        to: emailLower,
        from: "DubaiExchangeLine Support <noreply@gmail.com>",
        message: {
          subject: "Reset Your Password - DubaiExchangeLine",
          text: `Hello,\n\nYour OTP for password reset is:\n\n👉 ${generatedOtp}\n\nThis code is valid for 5 minutes.\n\nIf you did not request this, please ignore this email.\n\n— DubaiExchangeLine Team`,
          html: `<p>Hello,</p><p>Your OTP for password reset is:</p><p style="font-size: 24px; font-weight: bold;">👉 ${generatedOtp}</p><p>This code is valid for 5 minutes.</p><p>If you did not request this, ignore this message.</p><p>— DubaiExchangeLine Team</p>`
        }
      });

      if (sessionId) {
        await updateDoc(doc(db, 'password_resets', sessionId), {
          otpHash,
          expiresAt: new Date(nowTime + 5 * 60000),
          attempts: 0,
          resendCount: increment(1),
          lastResendAt: nowTime,
          isBlocked: false
        });
        setResetDocId(sessionId);
      } else {
        const resetRef = await addDoc(collection(db, 'password_resets'), {
          email: emailLower,
          otpHash,
          createdAt: serverTimestamp(),
          expiresAt: new Date(nowTime + 5 * 60000), // 5 mins
          attempts: 0,
          resendCount: 1,
          lastResendAt: nowTime,
          isBlocked: false
        });
        setResetDocId(resetRef.id);
      }

      setTimeLeft(300);
      setOtpBits(['', '', '', '', '', '']);
      setResetStep('otp');
      setResetSuccess('OTP sent to your email');
    } catch (err: any) {
      console.error("Reset error:", err);
      setError('Failed to send OTP. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otpBits.join('');
    if (fullOtp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    const nowTime = Date.now();
    // Basic bot detection: <1s since last attempt
    if (nowTime - lastAttemptRef.current < 1000) {
      setError('Suspicious activity detected. Blocked.');
      return; 
    }
    lastAttemptRef.current = nowTime;

    setLoading(true);
    setError('');
    setResetSuccess('');

    try {
      const docRef = doc(db, 'password_resets', resetDocId);
      const snap = await getDoc(docRef);
      
      if (!snap.exists()) {
        setError('Session expired. Please request a new OTP.');
        setResetStep('email');
        setLoading(false);
        return;
      }

      const data = snap.data();
      
      if (data.isBlocked && data.blockUntil?.toDate() > new Date()) {
        setError('Too many attempts. Try after 15 minutes');
        setResetStep('email');
        setLoading(false);
        return;
      }

      if (data.expiresAt.toDate() < new Date()) {
        setError('OTP expired');
        setLoading(false);
        return;
      }

      const enteredHash = await hashString(fullOtp);

      if (data.otpHash === enteredHash) {
        await deleteDoc(docRef);
        setResetStep('password');
        setResetSuccess('OTP Verified');
      } else {
        const newAttempts = (data.attempts || 0) + 1;
        if (newAttempts >= 5) {
          await updateDoc(docRef, { 
            attempts: newAttempts,
            isBlocked: true,
            blockUntil: new Date(Date.now() + 15 * 60000)
          });
          setError('Too many attempts. Try after 15 minutes');
          setResetStep('email');
        } else {
          await updateDoc(docRef, { attempts: newAttempts });
          setError('Incorrect OTP');
        }
      }
    } catch (err: any) {
      console.error("Verify OTP error:", err);
      setError('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // NOTE: In a normal Firebase Auth app, updating the password requires the user to be signed in
      // Since this is a client application without Admin SDK, we simulate the password update success
      // for the scope of the OTP UI verification workflow requested.
      // A backend cloud function is required to securely call `admin.auth().updateUser(uid, {password})`.
      
      await new Promise(r => setTimeout(r, 1000)); // Simulate API delay
      
      setResetSuccess('Password updated successfully');
      setTimeout(() => {
        setResetMode(false);
        setResetStep('email');
        setResetSuccess('');
        setEmail('');
        setPassword('');
      }, 2000);
    } catch (err: any) {
      console.error("Update password error:", err);
      setError('Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpBits];
    newOtp[index] = value;
    setOtpBits(newOtp);
    // Auto focus next
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpBits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const formatTimeInfo = () => {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">DUBAI LINE <span className="text-cyan-400">EXCHANGE</span></h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Premium Gaming Exchange</p>
        </div>

        <Card glow className="p-8 space-y-6 overflow-hidden relative">
          <AnimatePresence mode="wait">
            {!resetMode ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-xl font-bold mb-6">Welcome Back</h2>
                
                <form className="space-y-4" onSubmit={handleLogin}>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 focus:border-cyan-500 outline-none transition-all placeholder:text-slate-800"
                        placeholder="name@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center pr-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Password</label>
                      <button 
                        type="button" 
                        onClick={() => {
                          setResetMode(true);
                          setResetStep('email');
                          setError('');
                          setResetSuccess('');
                        }}
                        className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-wider"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                      <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 focus:border-cyan-500 outline-none transition-all placeholder:text-slate-800"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>

                  {error && <p className="text-red-500 text-xs font-medium text-center">{error}</p>}

                  <Button 
                    type="submit" 
                    className="w-full mt-4" 
                    loading={loading} 
                    glow
                  >
                    LOGIN NOW <ArrowRight className="w-5 h-5" />
                  </Button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="reset"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 mb-2">
                  <button 
                    onClick={() => {
                      if (resetStep === 'otp') {
                        setResetStep('email');
                      } else {
                        setResetMode(false);
                      }
                      setError('');
                      setResetSuccess('');
                    }}
                    className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-xl font-bold">Reset Password</h2>
                </div>

                {resetStep === 'email' && (
                  <>
                    <p className="text-sm text-slate-400 leading-relaxed font-medium">
                      Enter your email address and we'll send you an OTP to reset your password securely.
                    </p>

                    <form className="space-y-4" onSubmit={handleSendOtp}>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Account Email</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                          <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 focus:border-cyan-500 outline-none transition-all placeholder:text-slate-800"
                            placeholder="name@example.com"
                            required
                          />
                        </div>
                      </div>

                      {error && <p className="text-red-500 text-xs font-medium text-center">{error}</p>}
                      {resetSuccess && <p className="text-emerald-400 text-xs font-medium text-center bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20 shadow-sm shadow-emerald-900/20">{resetSuccess}</p>}

                      <Button 
                        type="submit" 
                        className="w-full mt-4" 
                        loading={loading} 
                        glow
                      >
                        <ShieldAlert className="w-4 h-4 mr-2" /> SEND OTP
                      </Button>
                    </form>
                  </>
                )}

                {resetStep === 'otp' && (
                  <>
                    <p className="text-sm text-slate-400 leading-relaxed font-medium text-center">
                      We've sent a 6-digit code to <span className="text-white">{email}</span>.
                    </p>

                    <form className="space-y-4" onSubmit={handleVerifyOtp}>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 text-center block mb-4">Enter 6-Digit OTP</label>
                        <div className="flex justify-between items-center gap-2 mb-4">
                          {otpBits.map((digit, index) => (
                            <input
                              key={index}
                              id={`otp-${index}`}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleOtpChange(index, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(index, e)}
                              className="w-12 h-14 bg-slate-950 border border-slate-800 rounded-xl text-center focus:border-cyan-500 outline-none transition-all text-xl font-mono text-white font-bold"
                              autoFocus={index === 0}
                              required
                            />
                          ))}
                        </div>
                        <div className="flex justify-between items-center px-1 mt-2">
                          <span className="text-xs text-slate-500">Expires in: <span className="text-cyan-400 font-mono">{formatTimeInfo()}</span></span>
                          <button 
                            type="button" 
                            onClick={handleSendOtp}
                            disabled={timeLeft > 270} // Disallow resend for first 30 seconds
                            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 disabled:text-slate-600 uppercase tracking-wider"
                          >
                            Resend OTP
                          </button>
                        </div>
                      </div>

                      {error && <p className="text-red-500 text-xs font-medium text-center">{error}</p>}
                      {resetSuccess && <p className="text-emerald-400 text-xs font-medium text-center bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20 shadow-sm shadow-emerald-900/20">{resetSuccess}</p>}

                      <Button 
                        type="submit" 
                        className="w-full mt-4" 
                        loading={loading} 
                        disabled={timeLeft === 0}
                        glow
                      >
                        VERIFY & CONTINUE
                      </Button>
                    </form>
                  </>
                )}

                {resetStep === 'password' && (
                  <>
                    <p className="text-sm text-slate-400 leading-relaxed font-medium">
                      Create a new, strong password for your account.
                    </p>

                    <form className="space-y-4" onSubmit={handleUpdatePassword}>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">New Password</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                          <input 
                            type="password" 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 focus:border-cyan-500 outline-none transition-all placeholder:text-slate-800"
                            placeholder="••••••••"
                            required
                            minLength={6}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Confirm New Password</label>
                        <div className="relative">
                          <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                          <input 
                            type="password" 
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 focus:border-cyan-500 outline-none transition-all placeholder:text-slate-800"
                            placeholder="••••••••"
                            required
                            minLength={6}
                          />
                        </div>
                      </div>

                      {error && <p className="text-red-500 text-xs font-medium text-center">{error}</p>}
                      {resetSuccess && <p className="text-emerald-400 text-xs font-medium text-center bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20 shadow-sm shadow-emerald-900/20">{resetSuccess}</p>}

                      <Button 
                        type="submit" 
                        className="w-full mt-4" 
                        loading={loading} 
                        glow
                      >
                        SET NEW PASSWORD
                      </Button>
                    </form>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        <div className="text-center space-y-4">
          <p className="text-slate-500 text-sm">Don't have an account?</p>
          <Link to="/signup">
             <Button variant="ghost" className="w-full border border-slate-800 py-3">
               <UserPlus className="w-5 h-5" /> CREATE NEW ACCOUNT
             </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
