import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true, isAdmin: false });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        setLoading(false);
      }
      // If there is a user, the second useEffect will handle setting loading(false) 
      // after the profile snapshot is received.
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      localStorage.removeItem('cachedProfile');
      return;
    }

    const cached = localStorage.getItem('cachedProfile');
    if (cached) {
      try {
        setProfile(JSON.parse(cached));
        setLoading(false);
      } catch (e) {}
    } else {
      setLoading(true);
    }

    const unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setProfile(data);
        localStorage.setItem('cachedProfile', JSON.stringify(data));
      } else {
        setProfile(null);
        localStorage.removeItem('cachedProfile');
      }
      setLoading(false);
    }, (error) => {
      console.error("Profile snapshot error:", error);
      setLoading(false);
    });

    return () => unsubscribeProfile();
  }, [user]);

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin' || profile?.isAdmin === true,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
