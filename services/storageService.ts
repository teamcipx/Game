
import { UserProfile } from "../types";
import { db } from "../firebaseConfig";
import { doc, updateDoc, getDoc, increment, setDoc, query, collection, where, getDocs } from "firebase/firestore";

const USER_KEY = 'fastcash_user_v1';
const EXCHANGE_RATE = 0.02; 

// Helper to get local state for immediate UI updates
export const getUser = (): UserProfile => {
  const stored = localStorage.getItem(USER_KEY);
  return stored ? JSON.parse(stored) : null;
};

// Sync Local to Firestore
const syncToFirestore = async (userId: string, data: Partial<UserProfile>) => {
  if (!db || userId.startsWith('local_')) return;
  try {
     const userRef = doc(db, "users", userId);
     await updateDoc(userRef, data);
  } catch (e) {
    console.error("Firestore Sync Error", e);
  }
};

export const updateUser = (updates: Partial<UserProfile>): UserProfile => {
  const current = getUser();
  if (!current) return current;

  const updated = { ...current, ...updates };
  localStorage.setItem(USER_KEY, JSON.stringify(updated));
  
  // Background Sync
  syncToFirestore(current.id, updates);
  
  return updated;
};

export const addBalance = (amountBDT: number) => {
  const user = getUser();
  if (!user) return;
  
  const newBalance = parseFloat((user.balance + amountBDT).toFixed(2));
  updateUser({ balance: newBalance });
};

export const saveRunCoins = (coins: number) => {
  const user = getUser();
  if (user) {
    updateUser({
      totalCoins: user.totalCoins + coins
    });
  }
};

export const exchangeCoinsForCash = (coinsToExchange: number): number => {
  const user = getUser();
  if (!user || user.totalCoins < coinsToExchange) return 0;

  const cashValue = parseFloat((coinsToExchange * EXCHANGE_RATE).toFixed(2));
  const newBalance = parseFloat((user.balance + cashValue).toFixed(2));
  const newCoins = user.totalCoins - coinsToExchange;

  updateUser({
    balance: newBalance,
    totalCoins: newCoins
  });

  return cashValue;
};

export const processReferral = async (referralCode: string, newUserId: string) => {
  if (!db) return;
  
  try {
    // 1. Find referrer
    const q = query(collection(db, "users"), where("referralCode", "==", referralCode));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const referrerDoc = querySnapshot.docs[0];
      
      // 2. Give Bonus to Referrer (e.g. ৳5.00)
      await updateDoc(referrerDoc.ref, {
        balance: increment(5.00) 
      });
      
      return true;
    }
  } catch (e) {
    console.error("Referral Error", e);
  }
  return false;
};
