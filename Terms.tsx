import { Link } from 'react-router-dom';
import { Card } from '../components/UI';
import { ShieldCheck, AlertCircle, Scale, Verified, ChevronLeft } from 'lucide-react';

export default function Terms() {
  const sections = [
    {
      title: "Age & Compliance",
      icon: ShieldCheck,
      text: "You must be 18 years of age or older to use this platform. We reserve the right to request proof of age at any time. Accounts found to be underage will be permanently terminated without refund."
    },
    {
      title: "Financial Policy",
      icon: AlertCircle,
      text: "All deposits and withdrawals are processed manually. We do not use automated payment gateways. Dubai Line Exchange is not responsible for funds sent to incorrect accounts or delayed due to bank holidays."
    },
    {
      title: "Account Security",
      icon: Verified,
      text: "Users are responsible for maintaining the confidentiality of their login credentials. Any activity conducted under your account is your sole responsibility. We recommend unique passwords and regular changes."
    },
    {
      title: "Technical Disclaimer",
      icon: Scale,
      text: "In the event of a technical failure, server downtime, or result error, the management decision will be final. Bets placed on erroneous sessions will be refunded if the error is from our side."
    }
  ];

  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/" className="p-2 border border-slate-800 rounded-full bg-slate-900 text-slate-400 hover:text-white transition-colors">
           <ChevronLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-2xl font-black italic tracking-tighter uppercase">Terms & Conditions</h2>
      </div>

      <Card className="p-6 space-y-4 border-amber-500/20 bg-amber-500/5">
         <div className="flex items-center gap-3 text-amber-500">
            <AlertCircle className="w-6 h-6" />
            <h3 className="font-bold uppercase tracking-widest text-sm">Legal Notice</h3>
         </div>
         <p className="text-xs text-slate-400 leading-relaxed font-medium">
            By accessing Dubai Line Exchange, you represent and warrant that your use of the services complies with all applicable laws and regulations in your jurisdiction.
         </p>
      </Card>

      <div className="space-y-4">
         {sections.map((s, i) => (
           <div key={i} className="space-y-2">
              <div className="flex items-center gap-2">
                 <s.icon className="w-4 h-4 text-cyan-400" />
                 <h4 className="font-bold text-sm uppercase tracking-wider">{s.title}</h4>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed p-4 bg-slate-900 rounded-xl border border-slate-800">
                 {s.text}
              </p>
           </div>
         ))}
      </div>

      <p className="text-[10px] text-center text-slate-600 italic py-6">
        Latest Update: May 2026 • Dubai Line Exchange Regulation Board
      </p>
    </div>
  );
}
