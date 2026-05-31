import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User 
} from 'firebase/auth';

type Role = 'user' | 'polri' | 'admin' | null;

interface AuthContextType {
  user: User | null;
  role: Role;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (e: string, p: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (usr) => {
      setUser(usr);
      if (usr) {
        let assignedRole: Role = 'user';
        
        // Mocking roles based on email for prototype
        if (usr.email?.includes('admin')) {
          assignedRole = 'admin';
        } else if (usr.email?.includes('polri') || usr.email?.includes('satgas')) {
          assignedRole = 'polri';
        }
        
        setRole(assignedRole);

        // Sync user to Firestore so admin can see them
        try {
          const userRef = doc(db, 'users', usr.uid);
          const userSnap = await getDoc(userRef);
          
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: usr.uid,
              name: usr.displayName || usr.email?.split('@')[0] || 'Pengguna',
              email: usr.email,
              role: assignedRole,
              status: 'active',
              createdAt: serverTimestamp(),
              lastLoginAt: serverTimestamp()
            });
          } else {
            // Update last login
            await setDoc(userRef, {
              lastLoginAt: serverTimestamp()
            }, { merge: true });
          }
        } catch (e) {
          console.error("Gagal sinkronisasi data user:", e);
        }

      } else {
        setRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const loginWithEmail = async (e: string, p: string) => {
    try {
      await signInWithEmailAndPassword(auth, e, p);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        // Automatically create account for prototype and demo purposes
        try {
          await createUserWithEmailAndPassword(auth, e, p);
        } catch (createError) {
          throw error; // Throw original invalid-credential if creation fails
        }
      } else if (error.code === 'auth/operation-not-allowed' && (e === 'admin@tameng.id' || e === 'polri@tameng.id')) {
        // Fallback for simulation if Email/Password provider is not enabled in Firebase
        const mockUser = {
          uid: 'demo-' + e.split('@')[0],
          email: e,
          displayName: e === 'admin@tameng.id' ? 'Admin TAMENG' : 'Satgas Siber',
        } as unknown as User;
        setUser(mockUser);
        setRole(e.includes('admin') ? 'admin' : 'polri');
        return;
      } else {
        throw error;
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, loginWithGoogle, loginWithEmail, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
