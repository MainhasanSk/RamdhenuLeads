import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signOut,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserProfile, setUserProfile, type AppUser, type UserRole } from '@/lib/userService';

interface AuthContextType {
  user: User | null;
  profile: AppUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          let userProfile = await getUserProfile(firebaseUser.uid);
          // Auto-create admin profile for first user or if no profile exists
          if (!userProfile) {
            const newProfile = {
              email: firebaseUser.email || '',
              displayName: firebaseUser.email?.split('@')[0] || 'Admin',
              role: 'admin' as UserRole,
              createdAt: new Date().toISOString(),
              isActive: true,
            };
            await setUserProfile(firebaseUser.uid, newProfile);
            userProfile = { uid: firebaseUser.uid, ...newProfile };
          }
          setProfile(userProfile);
        } catch (error) {
          console.error('Failed to load user profile:', error);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, profile, isLoading, isAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
