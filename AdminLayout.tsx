import { ReactNode } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  ShieldCheck,
  ChevronLeft,
  Settings,
  Gift
} from 'lucide-react';
import { cn } from '../lib/utils';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navItems = [
    { label: 'Overview', path: '/admin', icon: LayoutDashboard },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Deposits', path: '/admin/deposits', icon: ArrowUpCircle },
    { label: 'Withdrawals', path: '/admin/withdrawals', icon: ArrowDownCircle },
    { label: 'Bonus Codes', path: '/admin/bonuses', icon: Gift },
    { label: 'Game Control', path: '/admin/games', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="w-full lg:w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-6 flex items-center justify-between border-b border-slate-800/50">
          <Link to="/" className="flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-cyan-500" />
            <span className="font-bold tracking-tight text-white">ADMIN PANEL</span>
          </Link>
          <Link to="/" className="lg:hidden p-2 text-slate-400 hover:text-white">
             <ChevronLeft className="w-6 h-6" />
          </Link>
        </div>

        <nav className="flex-1 p-4 flex flex-row lg:flex-col gap-1 overflow-x-auto custom-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                isActive 
                  ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20" 
                  : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800/50 hidden lg:block">
           <Link to="/" className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-cyan-400 transition-colors">
              <ChevronLeft className="w-3 h-3" /> Back to Dashboard
           </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        <div className="max-w-6xl mx-auto pb-20">
          {children}
        </div>
      </main>
    </div>
  );
}
