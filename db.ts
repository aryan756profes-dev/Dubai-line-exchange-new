import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  updateDoc, 
  addDoc,
  serverTimestamp,
  Timestamp,
  increment,
  runTransaction
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { OperationType, handleFirestoreError } from './firestoreUtils';

// User hooks and functions
export const getUserProfile = async (uid: string) => {
  const path = `users/${uid}`;
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
};

export const createUserProfile = async (uid: string, data: any) => {
  const path = `users/${uid}`;
  try {
    await setDoc(doc(db, 'users', uid), {
      ...data,
      balance: 0,
      bonusBalance: 0,
      lockedBalance: 0,
      isAdmin: false,
      isBlocked: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

// Requests
export const submitFundRequest = async (data: any) => {
  const path = 'fundRequests';
  try {
    await addDoc(collection(db, path), {
      ...data,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

import { computeUserFinancials } from './utils';

export const submitWithdrawRequest = async (data: any) => {
  const path = 'withdrawRequests';
  try {
    return await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', data.uid);
      const userSnap = await transaction.get(userRef);
      
      if (!userSnap.exists()) throw new Error("User does not exist");
      
      const userData = userSnap.data();
      const currentBalance = userData.balance || 0;
      const requiredWager = userData.requiredWager || 0;
      const wagerCompleted = userData.wagerCompleted || 0;
      
      const currentStats = computeUserFinancials(currentBalance, requiredWager, wagerCompleted);
      const currentLockedAmount = userData.lockedAmount || 0;
      const currentAvailable = currentBalance - currentLockedAmount;

      const maxWithdrawable = Math.min(currentAvailable, currentStats.withdrawableAmount);

      if (maxWithdrawable < data.amount) {
        throw new Error("Insufficient unlocked balance");
      }
      
      // Deduct balance immediately
      const newBalance = currentBalance - data.amount;
      const newStats = computeUserFinancials(newBalance, requiredWager, wagerCompleted);

      transaction.update(userRef, {
        balance: newBalance,
        withdrawableAmount: newStats.withdrawableAmount,
        progressRatio: newStats.progressRatio,
        updatedAt: serverTimestamp()
      });
      
      // Add withdraw request
      const withdrawRef = doc(collection(db, 'withdrawRequests'));
      transaction.set(withdrawRef, {
        ...data,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      
      return { requestId: withdrawRef.id };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

// Game Logic
export const placeBet = async (betData: any) => {
  const path = 'bets';
  try {
    return await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', betData.uid);
      const userSnap = await transaction.get(userRef);
      
      if (!userSnap.exists()) throw new Error("User does not exist");
      
      const userData = userSnap.data();
      const currentBalance = userData.balance || 0;
      const currentLockedAmount = userData.lockedAmount || 0;
      if (currentBalance - currentLockedAmount < betData.amount) {
        throw new Error("Insufficient balance");
      }
      
      const newLockedAmount = currentLockedAmount + betData.amount;
      const requiredWager = userData.requiredWager || 0;
      const newWagerCompleted = (userData.wagerCompleted || 0) + betData.amount;
      const newStats = computeUserFinancials(currentBalance, requiredWager, newWagerCompleted);

      transaction.update(userRef, {
        wagerCompleted: newWagerCompleted,
        lockedAmount: newLockedAmount,
        withdrawableAmount: newStats.withdrawableAmount,
        progressRatio: newStats.progressRatio,
        updatedAt: serverTimestamp()
      });
      console.log(`Firestore updated: balance -= ${betData.amount}, wagerCompleted += ${betData.amount}`);
      
      // Add bet
      const betRef = doc(collection(db, 'bets'));
      transaction.set(betRef, {
        ...betData,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      
      return { betId: betRef.id };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

// Admin Functions
export const updateRequestStatus = async (collectionName: string, requestId: string, status: string, uid?: string, amount?: number) => {
  const path = `${collectionName}/${requestId}`;
  try {
    await runTransaction(db, async (transaction) => {
      const requestRef = doc(db, collectionName, requestId);
      const requestSnap = await transaction.get(requestRef);
      
      if (!requestSnap.exists()) throw new Error("Request not found");
      if (requestSnap.data().status !== 'pending') throw new Error("Request already processed");
      
      transaction.update(requestRef, { status });
      
      if (status === 'approved' && uid && amount && collectionName === 'fundRequests') {
        const userRef = doc(db, 'users', uid);
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) return;
        const userData = userSnap.data();
        
        const newBalance = (userData.balance || 0) + amount;
        const newRequiredWager = (userData.requiredWager || 0) + amount;
        const wagerCompleted = userData.wagerCompleted || 0;
        const depositAmount = (userData.depositAmount || 0) + amount;
        const newStats = computeUserFinancials(newBalance, newRequiredWager, wagerCompleted);

        console.log(`Approving fund request: user=${uid}, amount=${amount}`);
        transaction.update(userRef, {
          balance: newBalance,
          requiredWager: newRequiredWager,
          depositAmount: depositAmount,
          withdrawableAmount: newStats.withdrawableAmount,
          progressRatio: newStats.progressRatio,
          updatedAt: serverTimestamp()
        });
        console.log(`Firestore updated: balance += ${amount}, requiredWager += ${amount}`);
      } else if (status === 'rejected' && uid && amount && collectionName === 'withdrawRequests') {
        const userRef = doc(db, 'users', uid);
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) return;
        const userData = userSnap.data();

        const newBalance = (userData.balance || 0) + amount;
        const requiredWager = userData.requiredWager || 0;
        const wagerCompleted = userData.wagerCompleted || 0;
        const newStats = computeUserFinancials(newBalance, requiredWager, wagerCompleted);

        console.log(`Rejecting withdraw request: user=${uid}, amount=${amount}, refunding balance`);
        transaction.update(userRef, {
          balance: newBalance,
          withdrawableAmount: newStats.withdrawableAmount,
          progressRatio: newStats.progressRatio,
          updatedAt: serverTimestamp()
        });
        console.log(`Firestore updated: balance += ${amount}`);
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};
