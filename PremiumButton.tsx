import React, { ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface PremiumButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant: 'deposit' | 'bonus';
  className?: string;
  loading?: boolean;
}

export function PremiumButton({ children, onClick, variant, className, loading }: PremiumButtonProps) {
  const isDeposit = variant === 'deposit';

  return (
    <div className="relative group w-fit flex-1 sm:flex-none">
      {/* Outer Glow behind button */}
      <div className={cn(
        "absolute -inset-1 blur-lg transition-opacity duration-300 opacity-60 group-hover:opacity-100 rounded-xl",
        isDeposit ? "bg-cyan-500" : "bg-amber-500"
      )} />

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        onClick={onClick}
        disabled={loading}
        className={cn(
          "relative flex items-center justify-center overflow-hidden rounded-xl font-black w-full h-full sm:w-auto",
          "shadow-lg outline-none", 
          isDeposit 
            ? "bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-500 text-white" 
            : "bg-gradient-to-br from-orange-500 via-amber-400 to-yellow-500 text-amber-950",
          "animate-[pulse-slow_2s_ease-in-out_infinite]",
          loading && "opacity-50 cursor-not-allowed",
          className || "px-6 py-4 text-sm sm:text-base"
        )}
      >
        {/* Ripple/Sweep effect - continuous */}
        <div className="absolute inset-0 -translate-x-[150%] skew-x-[-20deg] animate-[sweep_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent z-0 pointer-events-none" />
        
        {/* Loading spinner */}
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/10">
            <div className={cn(
              "w-5 h-5 border-2 rounded-full animate-spin",
              isDeposit ? "border-white/30 border-t-white" : "border-amber-950/30 border-t-amber-950"
            )}></div>
          </div>
        )}

        {/* Actual content */}
        <span className={cn(
          "relative z-10 flex items-center gap-2 drop-shadow-sm uppercase tracking-wider",
          loading ? "opacity-0" : "opacity-100"
        )}>
          {children}
        </span>
      </motion.button>
    </div>
  );
}
