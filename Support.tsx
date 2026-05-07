import { LifeBuoy, AlertTriangle } from 'lucide-react';
import { Card } from '../components/UI';
import { motion } from 'motion/react';

export default function Support() {
  return (
    <div className="p-6 max-w-lg mx-auto min-h-[80vh] flex flex-col items-center justify-center space-y-8 text-center pt-24">
      {/* Header */}
      <div className="space-y-4 flex flex-col items-center">
        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-400 rotate-12 mb-4">
          <LifeBuoy className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black italic tracking-tighter uppercase">Support</h1>
        <p className="text-slate-400 text-sm font-medium px-4">
          If you need any help, contact our support team on Telegram
        </p>
      </div>

      {/* Action Button */}
      <motion.a
        href="https://t.me/Fearless_990"
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-full sm:w-auto relative group flex items-center justify-center overflow-hidden rounded-full font-black px-8 py-4 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)] bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 text-white"
      >
        <span className="relative z-10 uppercase tracking-widest text-sm">Contact Support</span>
      </motion.a>

      {/* Warning Section */}
      <Card className="bg-red-500/5 border-red-500/20 text-left space-y-4 p-6 w-full relative overflow-hidden mt-8">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
          <h2 className="text-sm font-black uppercase tracking-wider text-orange-500">
            ⚠️ Important Notice
          </h2>
        </div>
        <ul className="space-y-3">
          <li className="flex items-start gap-2 text-xs font-semibold text-slate-300">
            <span className="text-orange-500 shrink-0 mt-0.5">•</span>
            We NEVER ask for payment in support
          </li>
          <li className="flex items-start gap-2 text-xs font-semibold text-slate-300">
            <span className="text-orange-500 shrink-0 mt-0.5">•</span>
            Do NOT send money to anyone claiming to be support
          </li>
          <li className="flex items-start gap-2 text-xs font-semibold text-slate-300">
            <span className="text-orange-500 shrink-0 mt-0.5">•</span>
            All payments are only done through the official deposit section
          </li>
          <li className="flex items-start gap-2 text-xs font-semibold text-slate-300">
            <span className="text-orange-500 shrink-0 mt-0.5">•</span>
            If anyone asks for payment on Telegram, it is a scam
          </li>
        </ul>
      </Card>
    </div>
  );
}
