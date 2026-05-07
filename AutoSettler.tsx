import { useEffect, useRef } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, where, getDocs, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

function computeUserFinancials(balance: number, requiredWager: number, wagerCompleted: number) {
  const remainingWager = Math.max(0, requiredWager - wagerCompleted);
  const withdrawableAmount = Math.max(0, balance - remainingWager);
  const progressRatio = requiredWager > 0 ? Math.min(100, Math.round((wagerCompleted / requiredWager) * 100)) : 100;
  return { withdrawableAmount, progressRatio };
}

export default function AutoSettler() {
  const { user, profile } = useAuth();
  const processedBets = useRef<Set<string>>(new Set());
  const resultUnsubs = useRef<Record<string, () => void>>({});

  useEffect(() => {
    if (!user) return;
    
    // Clear previously processed on remount
    processedBets.current.clear();
    
    // 1. Listen for results that need to be declared
    const qPending = query(collection(db, 'results'), where('isDeclared', '==', false));
    const unsubPending = onSnapshot(qPending, (snap) => {
      snap.docs.forEach((d) => {
        const result = d.data() as any;
        const now = Date.now();
        if (now >= result.resultTime) {
          const flip = async () => {
             try {
                await runTransaction(db, async (t) => {
                   const rDoc = await t.get(d.ref);
                   if (!rDoc.exists() || rDoc.data()?.isDeclared) return;
                   t.update(d.ref, { isDeclared: true });
                });
             } catch (e) {}
          };
          flip();
        } else {
          const delay = result.resultTime - now;
          setTimeout(() => {
             const flip2 = async () => {
                try {
                   await runTransaction(db, async (t) => {
                      const rDoc = await t.get(d.ref);
                      if (!rDoc.exists() || rDoc.data()?.isDeclared) return;
                      t.update(d.ref, { isDeclared: true });
                   });
                } catch (e) {}
             };
             flip2();
          }, delay);
        }
      });
    });

    // 2. Listen for pending bets
    const betsQueryConstraints = [where('status', '==', 'pending')];
    if (!profile?.isAdmin) {
       betsQueryConstraints.push(where('userId', '==', user.uid));
    }
    
    const qPendingBets = query(collection(db, 'bets'), ...betsQueryConstraints);
    const unsubBets = onSnapshot(qPendingBets, async (snap) => {
       const sessionIds = [...new Set(snap.docs.map(doc => doc.data().sessionId))];
       
       if (sessionIds.length > 0) {
          for (const sId of sessionIds) {
             if (resultUnsubs.current[sId]) continue; // Already listening
             
             const resultRef = doc(db, 'results', sId as string);
             const unsubResult = onSnapshot(resultRef, async (rSnap) => {
                const rData = rSnap.data();
                if (rData && rData.isDeclared) {
                   const myBetsForSession = snap.docs.filter(d => d.data().sessionId === sId);
                   
                   for (const betDoc of myBetsForSession) {
                      if (processedBets.current.has(betDoc.id)) continue;
                      processedBets.current.add(betDoc.id);

                      const betData = betDoc.data() as any;
                      const isWin = betData.selectedValue === rData.resultValue;
                      const multiplier = betData.gameType === 'number' ? 90 : 8; 
                      
                      let winningAmount = 0;
                      if (isWin) {
                         if (betData.gameType === 'number') {
                            winningAmount = betData.amount * 90;
                         } else if (betData.gameType === 'color') {
                            winningAmount = (rData.resultValue === 'Orange') ? betData.amount * 15 : betData.amount * 9;
                         }
                      }

                      try {
                        await runTransaction(db, async (t) => {
                          const userRef = doc(db, 'users', betData.userId);
                          const userDoc = await t.get(userRef);
                          if (!userDoc.exists()) return;
                          
                          const userData = userDoc.data();
                          const newBalance = (userData.balance || 0) + (isWin ? winningAmount - betData.amount : -betData.amount);
                          const newLockedAmount = Math.max(0, (userData.lockedAmount || 0) - betData.amount);
                          const requiredWager = userData.requiredWager || 0;
                          const wagerCompleted = userData.wagerCompleted || 0;
                          const newStats = computeUserFinancials(newBalance, requiredWager, wagerCompleted);

                          t.update(userRef, { 
                            balance: newBalance,
                            lockedAmount: newLockedAmount,
                            withdrawableAmount: newStats.withdrawableAmount,
                            progressRatio: newStats.progressRatio,
                            updatedAt: serverTimestamp() 
                          });
                          
                          t.update(betDoc.ref, {
                            status: isWin ? 'win' : 'loss',
                            winningAmount,
                            updatedAt: serverTimestamp()
                          });
                        });
                      } catch (e) {
                         processedBets.current.delete(betDoc.id); 
                         console.error("AutoSettler bet settlement failed", e);
                      }
                   }
                   
                   // Clean up listener once declared
                   if (resultUnsubs.current[sId as string]) {
                     resultUnsubs.current[sId as string]();
                     delete resultUnsubs.current[sId as string];
                   }
                }
             });
             
             resultUnsubs.current[sId as string] = unsubResult;
          }
       }
    });

    return () => {
      unsubPending();
      unsubBets();
      Object.values(resultUnsubs.current).forEach(unsub => unsub());
      resultUnsubs.current = {};
    };
  }, [user]);

  return null;
}
