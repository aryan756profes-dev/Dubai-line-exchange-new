import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button } from '../components/UI';
import { User, Phone, Mail, MapPin, Lock, Save, RotateCcw, ChevronLeft } from 'lucide-react';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Profile() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [formData, setFormData] = useState({
    fullName: profile?.fullName || '',
    address: profile?.address || '',
    city: profile?.city || '',
    pinCode: profile?.pinCode || '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), formData);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/" className="p-2 border border-slate-800 rounded-full bg-slate-900 text-slate-400 hover:text-white transition-colors">
           <ChevronLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-2xl font-black italic tracking-tighter uppercase">My Profile</h2>
      </div>

      <Card className="space-y-4">
        {[
          { label: 'Username', value: profile?.username, icon: User, readonly: true },
          { label: 'Email Address', value: profile?.email, icon: Mail, readonly: true },
          { label: 'Full Name', key: 'fullName', icon: User },
          { label: 'Address', key: 'address', icon: MapPin },
          { label: 'City', key: 'city', icon: MapPin },
          { label: 'PIN Code', key: 'pinCode', icon: MapPin },
        ].map((item: any) => (
          <div key={item.label} className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">{item.label}</label>
            <div className="relative">
              <item.icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input 
                type="text" 
                value={item.readonly ? item.value : (formData as any)[item.key]}
                onChange={(e) => !item.readonly && setFormData({...formData, [item.key]: e.target.value})}
                disabled={item.readonly}
                className={cn(
                  "w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-sm focus:border-cyan-500 outline-none transition-all",
                  item.readonly && "opacity-50 grayscale cursor-not-allowed"
                )}
              />
            </div>
          </div>
        ))}
        
        {success && <p className="text-green-500 text-xs font-bold text-center">{success}</p>}

        <div className="flex gap-2 pt-4">
           <Button variant="secondary" className="flex-1 py-3" onClick={() => setFormData({
             fullName: profile?.fullName || '',
             address: profile?.address || '',
             city: profile?.city || '',
             pinCode: profile?.pinCode || '',
           })}><RotateCcw className="w-4 h-4" /> RESET</Button>
           <Button className="flex-1 py-3" onClick={handleSave} disabled={loading} glow>
              <Save className="w-4 h-4" /> {loading ? 'SAVING...' : 'SAVE CHANGES'}
           </Button>
        </div>
      </Card>

      <Card className="border-red-500/20 bg-red-500/5 p-6 space-y-4">
         <h4 className="font-bold text-red-500 flex items-center gap-2 uppercase tracking-widest text-[10px]">
            <Lock className="w-4 h-4" /> Security Settings
         </h4>
         <Button variant="danger" className="w-full py-3 h-auto text-xs bg-transparent border border-red-500/30 text-red-500">
           CHANGE LOGIN PASSWORD
         </Button>
      </Card>
    </div>
  );
}

import { cn } from '../lib/utils';
