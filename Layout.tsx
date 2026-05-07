import { ReactNode, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X, Home, Gamepad2, LayoutDashboard, Activity, PlusCircle, ArrowDownCircle, Star, BookOpen, FileText, LifeBuoy, LogOut, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { cn, formatCurrency } from '../lib/utils';

export default function Layout({ children }: { children: ReactNode }) {
  const { user, profile, loading, isAdmin } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
    setIsMenuOpen(false);
  };

  const navLinks = [
    { name: 'Home', path: '/', icon: Home, public: true },
    { name: 'Number Exchange', path: '/game/number', icon: Gamepad2, public: false },
    { name: 'Color X-Line', path: '/game/color', icon: Gamepad2, public: false },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, public: false },
    { name: 'My Activity', path: '/activity', icon: Activity, public: false },
    { name: 'Add Funds', path: '/add-funds', icon: PlusCircle, public: false },
    { name: 'Withdraw', path: '/withdraw', icon: ArrowDownCircle, public: false },
    { name: 'Reviews', path: '/reviews', icon: Star, public: true },
    { name: 'Guide', path: '/guide', icon: BookOpen, public: true },
    { name: 'Terms', path: '/terms', icon: FileText, public: true },
    { name: 'Support', path: '/support', icon: LifeBuoy, public: true },
    ...(isAdmin ? [{ name: 'Admin Panel', path: '/admin', icon: User, public: false }] : []),
  ].filter(link => link.public || !!user);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMenuOpen(true)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <Menu className="w-6 h-6 text-cyan-400" />
          </button>
          <Link to="/" className="text-xl font-bold tracking-tighter text-white whitespace-nowrap">
            DUBAI <span className="text-cyan-400">LINE</span> EXCHANGE
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {!user ? (
            <div className="flex gap-2">
              <Link to="/login" className="px-4 py-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors">Login</Link>
              <Link to="/signup" className="px-4 py-1.5 text-sm font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-full transition-all shadow-[0_0_15px_rgba(6,182,212,0.5)]">Signup</Link>
            </div>
          ) : (
            <div className="flex flex-col items-end text-[10px]">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Bal:</span>
                <span className="text-cyan-400 font-bold text-sm">{formatCurrency(profile?.balance || 0)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Exp:</span>
                <span className="text-rose-400 font-bold">{formatCurrency(profile?.lockedAmount || 0)}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 pt-1">
                <span>@{profile?.username}</span>
                <span>|</span>
                <span>ID: {user.uid.slice(-6).toUpperCase()}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-md mx-auto relative">
        {children}
      </main>

      {/* Side Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 h-full w-[280px] bg-slate-900 z-[70] shadow-2xl flex flex-col border-r border-slate-800"
            >
              <div className="p-6 flex items-center justify-between border-b border-slate-800">
                <div className="text-lg font-bold">
                  DUBAI <span className="text-cyan-400">LINE</span>
                </div>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 border border-slate-700 rounded-full">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-4 px-6 py-4 transition-all hover:bg-slate-800 border-l-4",
                      location.pathname === link.path ? "border-cyan-400 bg-cyan-400/5 text-cyan-400" : "border-transparent text-slate-400"
                    )}
                  >
                    <link.icon className="w-5 h-5" />
                    <span className="font-medium">{link.name}</span>
                  </Link>
                ))}
              </div>

              {user && (
                <div className="p-6 border-t border-slate-800">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-4 text-red-400 hover:text-red-300 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
