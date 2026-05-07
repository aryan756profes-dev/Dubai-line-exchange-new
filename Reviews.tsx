import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button } from '../components/UI';
import { User, Star, Quote, Upload, ImageIcon, CheckCircle2, ChevronLeft } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

export default function Reviews() {
  const { user, profile } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'reviews'),
      where('status', '==', 'approved'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setReviews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !feedback) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        uid: user.uid,
        username: profile?.username || 'Anonymous',
        feedback,
        status: 'pending', // Admins approve
        createdAt: serverTimestamp(),
        screenshotUrl: ''
      });
      setSuccess(true);
      setFeedback('');
      setTimeout(() => {
        setSuccess(false);
        setShowForm(false);
      }, 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 border border-slate-800 rounded-full bg-slate-900 text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h2 className="text-2xl font-black italic tracking-tighter uppercase">User Reviews</h2>
        </div>
        <Button onClick={() => setShowForm(!showForm)} variant="outline" className="py-2 px-4 text-[10px] h-8">
           {showForm ? 'CANCEL' : 'WRITE REVIEW'}
        </Button>
      </div>

      {showForm && (
        <Card className="border-cyan-500/20 bg-cyan-500/5 space-y-4">
           {success ? (
             <div className="py-6 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-cyan-400 mx-auto" />
                <p className="text-sm font-bold">Review submitted for approval!</p>
             </div>
           ) : (
             <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Your Feedback</label>
                  <textarea 
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    placeholder="Tell us about your winning experience..." 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm outline-none focus:border-cyan-500 min-h-[100px]"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center p-4 text-slate-700">
                     <ImageIcon className="w-6 h-6 mb-1" />
                     <span className="text-[8px] font-bold uppercase tracking-widest">Add Image</span>
                  </div>
                  <Button disabled={loading} className="w-full font-black italic tracking-tighter">SUBMIT REVIEW</Button>
                </div>
             </form>
           )}
        </Card>
      )}

      <div className="space-y-6 pt-2">
        {reviews.length === 0 ? (
          <div className="text-center py-20 opacity-20 bg-slate-900 rounded-3xl border border-slate-800">
             <Star className="w-12 h-12 mx-auto mb-4" />
             <p className="font-bold uppercase tracking-[0.3em] text-xs">Trust is Earned</p>
          </div>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="relative">
              <Card className="bg-slate-900 border-slate-800 pl-16 pr-8 pt-10 pb-8 rounded-tr-[40px] rounded-bl-[40px]">
                <Quote className="absolute top-6 left-6 w-8 h-8 text-cyan-500/20" />
                <div className="flex gap-1 mb-3">
                   {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 fill-amber-500 text-amber-500" />)}
                </div>
                <p className="text-sm text-slate-200 leading-relaxed font-medium mb-4 italic">"{r.feedback}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                   <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black text-cyan-400">
                      {r.username.slice(0, 2).toUpperCase()}
                   </div>
                   <div>
                      <p className="text-xs font-bold text-white uppercase tracking-wider">{r.username}</p>
                      <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Verified Member</p>
                   </div>
                </div>
              </Card>
              {r.screenshotUrl && (
                <div className="mt-2 ml-4 mr-4 rounded-2xl overflow-hidden border border-slate-800">
                   <img src={r.screenshotUrl} alt="Review Proof" className="w-full h-auto" />
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* Testimonials Mock (Requested clean trust design) */}
      <h3 className="font-bold text-center text-slate-600 uppercase text-[10px] tracking-[0.5em] pt-8 mb-4">Official Testimonials</h3>
      <div className="space-y-4 opacity-50 grayscale">
         <Card className="p-4 bg-slate-900/50 border-slate-800">
            <p className="text-xs text-slate-500 italic mb-2">"Fastest withdrawals I've seen in the exchange market."</p>
            <p className="text-[10px] font-black text-slate-700 uppercase">- Admin Verified</p>
         </Card>
      </div>
    </div>
  );
}
