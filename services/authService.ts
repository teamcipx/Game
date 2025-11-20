import { UserProfile } from "../types";
import { auth, db } from "../firebaseConfig";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc, increment } from "firebase/firestore";

export const loginUser = async (email: string, password: string): Promise<{ success: boolean; message: string; user?: UserProfile }> => {
  try {
    if (auth) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;
        
        // Fetch user profile
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
            const userData = userDoc.data() as UserProfile;
            localStorage.setItem('fastcash_user_v1', JSON.stringify(userData));
            return { success: true, message: "Login Successful", user: userData };
        } else {
            return { success: false, message: "User profile not found" };
        }
    }
  } catch (error: any) {
    console.error("Login Error:", error);
    return { success: false, message: error.message || "Login failed" };
  }
  
  return mockLogin(email, password); // Fallback
};

export const registerUser = async (email: string, password: string, name: string, referralCode?: string): Promise<{ success: boolean; message: string; user?: UserProfile }> => {
  try {
      if (auth) {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const uid = userCredential.user.uid;
          
          const myReferralCode = Math.random().toString(36).substring(7).toUpperCase();
          
          const newUser: UserProfile = {
            id: uid,
            username: email,
            name: name,
            balance: 0, // Initial balance
            totalCoins: 0,
            highScore: 0,
            referralCode: myReferralCode,
            referredBy: referralCode || null
          };

          // Handle Referral Bonus
          if (referralCode) {
             // Note: This is simplified. In production, use Cloud Functions or transactions for safety.
             // This logic might need to be on backend if security rules prevent querying other users.
             // For now, we register the user first.
             newUser.balance += 5.00; // Bonus for using code
          }

          await setDoc(doc(db, "users", uid), newUser);
          
          localStorage.setItem('fastcash_user_v1', JSON.stringify(newUser));
          return { success: true, message: "Registration Successful", user: newUser };
      }
  } catch (error: any) {
      console.error("Register Error:", error);
      return { success: false, message: error.message || "Registration failed" };
  }

  return mockRegister(email, password, name, referralCode); // Fallback
};

export const logoutUser = async () => {
  if (auth) {
      try {
          await signOut(auth);
      } catch (e) { console.error(e); }
  }
  localStorage.removeItem('fastcash_user_v1');
};

// --- Local Mock Fallback (Kept for safety if Firebase fails) ---

const mockLogin = (username: string, password: string) => {
    const users = JSON.parse(localStorage.getItem('fastcash_users_db') || '{}');
    const user = users[username];
    if (user && user.password === password) {
        localStorage.setItem('fastcash_user_v1', JSON.stringify(user));
        return { success: true, message: "Login (Mock) Successful", user };
    }
    return { success: false, message: "User not found or wrong password (Mock)" };
};

const mockRegister = (username: string, password: string, name: string, referralCode?: string) => {
    const users = JSON.parse(localStorage.getItem('fastcash_users_db') || '{}');
    if (users[username]) return { success: false, message: "User exists" };
    
    let balance = 0;
    if (referralCode) {
        const referrer = Object.values(users).find((u: any) => u.referralCode === referralCode) as UserProfile | undefined;
        if (referrer) {
            balance = 5;
            referrer.balance += 5; // Give bonus to referrer
            users[referrer.username] = referrer; 
        }
    }

    const newUser = {
        id: 'local_' + Date.now(),
        username, password, name, balance, totalCoins: 0, highScore: 0,
        referralCode: Math.random().toString(36).substring(7).toUpperCase(),
        referredBy: referralCode
    };
    users[username] = newUser;
    localStorage.setItem('fastcash_users_db', JSON.stringify(users));
    localStorage.setItem('fastcash_user_v1', JSON.stringify(newUser));
    return { success: true, message: "Registered (Mock)", user: newUser };
};
