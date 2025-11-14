import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword as firebaseSignIn,
  createUserWithEmailAndPassword as firebaseCreateUser,
  updateProfile as firebaseUpdateProfile,
  deleteUser as firebaseDeleteUser,
  reauthenticateWithCredential,
  updatePassword,
  EmailAuthProvider
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
  deleteUserAccount: (password?: string, softDelete?: boolean) => Promise<void>;
  reauthenticate: (password: string) => Promise<void>;
  cancelSoftDelete: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>; // Added to interface
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Move cancelSoftDelete inside the component so it can be used in useEffect
  const cancelSoftDelete = async (): Promise<void> => {
    if (!user) return;

    const cancelData = {
      scheduledForDeletion: false,
      deletionScheduledAt: null,
      deletionDate: null,
      isActive: true
    };

    // Remove soft delete flags
    await databaseService.updateUser(user.uid, cancelData);
    
    // Cancel the scheduled deletion task
    await databaseService.cancelScheduledDeletion(user.uid);

    // Update local state
    setUser(prev => prev ? { ...prev, ...cancelData } : null);
  };

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

          // Check if user has a pending soft deletion and cancel it on login
          if (userData.scheduledForDeletion) {
            await cancelSoftDelete();
          }
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

  const reauthenticate = async (password: string): Promise<void> => {
    if (!firebaseUser || !firebaseUser.email) {
      throw new Error('No user logged in or user has no email');
    }

    try {
      const credential = EmailAuthProvider.credential(firebaseUser.email, password);
      await reauthenticateWithCredential(firebaseUser, credential);
    } catch (error) {
      console.error('Reauthentication error:', error);
      throw new Error('Invalid password. Please try again.');
    }
  };

  const changePassword = async (newPassword: string): Promise<void> => {
    if (!firebaseUser) throw new Error('No user logged in');
    
    try {
      await updatePassword(firebaseUser, newPassword);
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  };

  const deleteUserAccount = async (password?: string, softDelete: boolean = true): Promise<void> => {
    if (!firebaseUser || !user) {
      throw new Error('No user logged in');
    }

    try {
      // Re-authenticate if password is provided (for email/password users)
      if (password && firebaseUser.email) {
        await reauthenticate(password);
      }

      if (softDelete) {
        // Soft delete - schedule for deletion in 10 days
        await scheduleSoftDelete();
      } else {
        // Immediate hard delete
        await performHardDelete();
      }

    } catch (error) {
      console.error('Error deleting user account:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('auth/requires-recent-login')) {
          throw new Error('Please re-authenticate before deleting your account. Try signing out and back in.');
        } else if (error.message.includes('Invalid password')) {
          throw new Error('Invalid password. Please try again.');
        }
      }
      
      throw new Error('Failed to delete account. Please try again.');
    }
  };

  const scheduleSoftDelete = async (): Promise<void> => {
    if (!user) return;

    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 10); // 10 days from now

    const softDeleteData = {
      scheduledForDeletion: true,
      deletionScheduledAt: new Date(),
      deletionDate: deletionDate,
      isActive: false
    };

    // Update user with soft delete flags
    await databaseService.updateUser(user.uid, softDeleteData);
    
    // Create a scheduled task for deletion
    await databaseService.scheduleUserDeletion(user.uid, deletionDate);

    // Update local state
    setUser(prev => prev ? { ...prev, ...softDeleteData } : null);
    
    // Sign out the user
    await signOut();
  };

  const performHardDelete = async (): Promise<void> => {
    if (!firebaseUser || !user) return;

    const userId = user.uid;

    // Delete user data from Firestore first
    await cleanupUserData(userId);

    // Delete user from Firebase Authentication
    await firebaseDeleteUser(firebaseUser);

    // Clear local state
    setUser(null);
    setFirebaseUser(null);
  };

  // Helper function to clean up user data from Firestore
  const cleanupUserData = async (userId: string): Promise<void> => {
    try {
      // Delete user document
      await databaseService.deleteUserData(userId);
      
      // Note: In a production app, you might want to:
      // - Delete user's events if they're the organizer
      // - Remove user from event registrations
      // - Delete user's chat messages
      // - Remove user from affiliation requests
      // - Delete user's notifications
      
    } catch (error) {
      console.error('Error cleaning up user data:', error);
      // We still want to proceed with account deletion even if cleanup fails
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
      updateUserProfile,
      deleteUserAccount,
      reauthenticate,
      cancelSoftDelete,
      changePassword // Added to the context value
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