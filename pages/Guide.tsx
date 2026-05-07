import { Link } from 'react-router-dom';
import { Card, Button } from '../components/UI';
import { BookOpen, UserPlus, Wallet, Gamepad2, Trophy, ShieldCheck, ChevronLeft } from 'lucide-react';

export default function Guide() {
  const steps = [
    { 
      title: "Registration", 
      icon: UserPlus, 
      content: "Click on 'Signup' from top right or side menu. Choose a unique username and enter your Email address. Your account will be created instantly upon verification." 
    },
    { 
      title: "Add Funds", 
      icon: Wallet, 
      content: "Go to 'Add Funds' section. Enter the amount (Min. ₹300). Note the reference ID and upload payment screenshot. Admins will verify and update your balance within 10-60 minutes." 
    },
    { 
      title: "Number Game", 
      icon: Trophy, 
      content: "Predict a number from 1 to 99. If your predicted number matches the declared result, you win 90x your bet amount. Results are declared daily at 10 AM and 10 PM IST." 
    },
    { 
      title: "Color Game", 
      icon: Gamepad2, 
      content: "Pick one out of our 10 specialty colors. If it matches the result, win 9x your bet. Results declared at 11:30 AM and 9:00 PM IST daily." 
    },
    { 
      title: "Withdrawals", 
      icon: ShieldCheck, 
      content: "Submit your bank or UPI details in 'Withdraw' section once you reach ₹500 minimum balance. Payouts are processed manually within 2-24 hours after verification." 
    }
  ];

  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/" className="p-2 border border-slate-800 rounded-full bg-slate-900 text-slate-400 hover:text-white transition-colors">
           <ChevronLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-2xl font-black italic tracking-tighter uppercase">Platform Guide</h2>
      </div>
      
      <div className="space-y-4">
        {steps.map((s, i) => (
          <Card key={i} className="relative overflow-hidden">
             <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0 border border-cyan-500/20">
                   <s.icon className="w-6 h-6" />
                </div>
                <div>
                   <h3 className="font-bold text-lg mb-2">{s.title}</h3>
                   <p className="text-sm text-slate-400 leading-relaxed font-medium">{s.content}</p>
                </div>
             </div>
             <div className="absolute -top-4 -right-2 text-7xl font-black text-white/5 italic pointer-events-none">0{i+1}</div>
          </Card>
        ))}

        <Card className="bg-gradient-to-br from-cyan-950 to-slate-900 border-cyan-500/30 p-6 text-center">
           <h4 className="font-bold text-xl mb-4 uppercase italic tracking-tighter">Need more help?</h4>
           <p className="text-sm text-slate-400 mb-6">Our priority support agents are available 24/7 to assist with your journey at Dubai Line Exchange.</p>
           <a href="https://t.me/TFCMANAGER01" target="_blank" rel="noopener noreferrer" className="block">
             <Button glow className="w-full">CONTACT LIVE SUPPORT</Button>
           </a>
        </Card>
      </div>
    </div>
  );
}
