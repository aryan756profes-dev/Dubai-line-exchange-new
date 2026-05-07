import { createContext, useContext, useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, CheckCircle2, AlertCircle } from 'lucide-react';

interface Notification {
  id: string;
  type: 'deposit' | 'withdrawal';
  status: 'approved' | 'rejected';
  amount: number;
  message: string;
  createdAt: any;
}

interface NotificationContextType {
  notifications: Notification[];
}

const NotificationContext = createContext<NotificationContextType>({ notifications: [] });

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeToast, setActiveToast] = useState<Notification | null>(null);

  useEffect(() => {
    if (!user) return;

    // Listen for deposit updates
    const qDeposits = query(
      collection(db, 'fundRequests'),
      where('uid', '==', user.uid),
      where('status', 'in', ['approved', 'rejected']),
      orderBy('processedAt', 'desc'),
      limit(1)
    );

    const unsubscribeDeposits = onSnapshot(qDeposits, (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === 'modified' || change.type === 'added') {
          const data = change.doc.data();
          const note: Notification = {
            id: change.doc.id,
            type: 'deposit',
            status: data.status,
            amount: data.amount,
            message: `Your deposit of ₹${data.amount} has been ${data.status}`,
            createdAt: data.processedAt
          };
          setActiveToast(note);
          setTimeout(() => setActiveToast(null), 5000);
        }
      });
    }, (error) => {
      console.error("Note listener error:", error);
    });

    return () => {
      unsubscribeDeposits();
    };
  }, [user]);

  return (
    <NotificationContext.Provider value={{ notifications }}>
      {children}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ y: 50, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 50, opacity: 0, scale: 0.9 }}
            className="fixed bottom-20 left-4 right-4 z-[999] md:left-auto md:right-8 md:w-80"
          >
            <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-4 shadow-2xl flex items-center gap-4 relative overflow-hidden backdrop-blur-xl">
              <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500" />
              <div className={activeToast.status === 'approved' ? "text-emerald-500" : "text-amber-500"}>
                {activeToast.status === 'approved' ? <CheckCircle2 className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Bell className="w-3 h-3" /> System Update
                </p>
                <p className="text-sm font-bold text-white mt-1 leading-tight">{activeToast.message}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
