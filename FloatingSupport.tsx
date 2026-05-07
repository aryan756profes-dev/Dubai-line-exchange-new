import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X } from 'lucide-react';
import { cn } from '../lib/utils';

export default function FloatingSupport() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has closed it previously in this session
    const isClosed = sessionStorage.getItem('support_closed');
    if (!isClosed) {
      // Delay showing the button slightly
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsVisible(false);
    sessionStorage.setItem('support_closed', 'true');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.8 }}
          className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-2"
        >
          <div className="relative">
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="w-6 h-6 bg-slate-800 text-slate-400 hover:text-white rounded-full flex items-center justify-center border border-slate-700 shadow-lg transition-colors absolute -top-2 -right-2 z-10"
              aria-label="Close support"
            >
              <X className="w-3 h-3" />
            </button>

            {/* Support Button */}
            <motion.a
              href="https://t.me/TFCMANAGER01"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "relative flex items-center gap-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full px-4 py-3 shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_25px_rgba(16,185,129,0.5)] transition-shadow duration-300",
                "animate-[floating_3s_ease-in-out_infinite]"
              )}
            >
              {/* Pulsing glow effect behind */}
              <div className="absolute inset-0 rounded-full bg-emerald-400 blur-md opacity-40 animate-[pulse-slow_2s_ease-in-out_infinite]" />
              
              <div className="relative z-10 flex items-center justify-center w-8 h-8 bg-white/20 rounded-full">
                <MessageCircle className="w-5 h-5 text-white" fill="currentColor" />
              </div>
              
              <div className="relative z-10 flex flex-col pr-2">
                <span className="text-white text-xs font-black tracking-widest uppercase">24/7 Support</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse shadow-[0_0_5px_rgba(134,239,172,0.8)]" />
                  <span className="text-emerald-100 text-[9px] font-bold uppercase tracking-wider">Online</span>
                </div>
              </div>
            </motion.a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
