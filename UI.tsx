import { ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}

export function Card({ children, className, glow = false }: CardProps) {
  return (
    <div className={cn(
      "bg-slate-900 border border-slate-800 rounded-2xl p-4 overflow-hidden relative",
      glow && "shadow-[0_0_20px_rgba(6,182,212,0.1)] border-cyan-500/30",
      className
    )}>
      {glow && <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 blur-3xl -translate-y-1/2 translate-x-1/2 rounded-full" />}
      {children}
    </div>
  );
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  type = 'button',
  loading = false,
  className, 
  onClick, 
  disabled,
  glow = false
}: { 
  children: ReactNode; 
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  type?: 'button' | 'submit' | 'reset';
  loading?: boolean;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  glow?: boolean;
}) {
  const variants = {
    primary: "bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]",
    secondary: "bg-slate-800 text-slate-100 hover:bg-slate-700",
    outline: "bg-transparent border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10",
    ghost: "bg-transparent text-slate-400 hover:text-white hover:bg-slate-800",
    danger: "bg-red-500 text-white hover:bg-red-400",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base",
  };

  return (
    <motion.button
      type={type}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "rounded-xl font-bold transition-all flex items-center justify-center gap-2 relative overflow-hidden",
        variants[variant],
        sizes[size],
        (disabled || loading) && "opacity-50 cursor-not-allowed grayscale",
        glow && "animate-pulse",
        className
      )}
    >
      {loading && (
        <div className="absolute inset-0 bg-inherit flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></div>
        </div>
      )}
      <span className={cn(loading && "opacity-0")}>{children}</span>
    </motion.button>
  );
}

export function Modal({ 
  isOpen, 
  onClose, 
  children,
  title
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  children: ReactNode;
  title?: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
        {title && (
          <h3 className="text-xl font-black italic tracking-tighter uppercase text-white mb-4">{title}</h3>
        )}
        {children}
      </motion.div>
    </div>
  );
}
