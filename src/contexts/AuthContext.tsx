import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword as firebaseSignIn,
  createUserWithEmailAndPassword as firebaseCreateUser,
  updateProfile as firebaseUpdateProfile
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { databaseService } from '../services/database';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string, role: UserRole, organizationInfo?: any) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          let userData = await databaseService.getUser(firebaseUser.uid);
          
          if (!userData) {
            // If user doesn't exist in database, create a basic user account
            userData = await databaseService.createUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || firebaseUser.email!.split('@')[0],
              photoURL: firebaseUser.photoURL || undefined,
              role: 'user',
              approved: true, // Regular users are auto-approved
              approvalRequested: false
            });
          }
          
          setUser(userData);
        } catch (error) {
          console.error('Error handling user state:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string, displayName: string, role: UserRole, organizationInfo?: any) => {
    setLoading(true);
    try {
      const { user: firebaseUser } = await firebaseCreateUser(auth, email, password);
      await firebaseUpdateProfile(firebaseUser, { displayName });
      
      // Check if this role requires approval
      const requiresApproval = ['school', 'university', 'firm'].includes(role);
      
      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName,
        role,
        approved: !requiresApproval, // Auto-approve if no approval required
        approvalRequested: requiresApproval, // Mark as requested if approval needed
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Create user in database
      await databaseService.createUser(userData);

      // If role requires approval, create an approval request
      if (requiresApproval && organizationInfo) {
        await databaseService.createUserApprovalRequest({
          userId: firebaseUser.uid,
          userEmail: firebaseUser.email!,
          userDisplayName: displayName,
          requestedRole: role as 'school' | 'firm' | 'university',
          status: 'pending',
          organizationInfo: {
            name: organizationInfo.organizationName,
            address: organizationInfo.address,
            phone: organizationInfo.phone,
            description: organizationInfo.description
          }
        });
      }
      
      // Set the user state
      setUser(userData);
      
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      await firebaseSignIn(auth, email, password);
      // User state will be updated by onAuthStateChanged
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // User state will be updated by onAuthStateChanged
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await auth.signOut();
      setUser(null);
      setFirebaseUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!user) throw new Error('No user logged in');
    
    try {
      await databaseService.updateUser(user.uid, updates);
      setUser(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      firebaseUser,
      loading,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
      updateUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};