import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
  AuthError
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  provider: string;
  createdAt?: any;
  lastLoginAt?: any;
}

/**
 * Creates or updates a user profile document in Firestore `users/{uid}`
 */
export async function syncUserProfile(user: User): Promise<void> {
  try {
    const userRef = doc(db, 'users', user.uid);
    const existingDoc = await getDoc(userRef);

    const provider = user.providerData?.[0]?.providerId || 'password';
    
    if (!existingDoc.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email,
        photoURL: user.photoURL || null,
        provider,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });
    } else {
      await setDoc(
        userRef,
        {
          displayName: user.displayName || existingDoc.data()?.displayName || user.email?.split('@')[0],
          photoURL: user.photoURL || existingDoc.data()?.photoURL || null,
          lastLoginAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
  } catch (error) {
    // Non-blocking sync error
    console.warn('Could not sync Firestore user profile:', error);
  }
}

/**
 * Cleanly maps Firebase error codes to human-readable, professional error messages
 */
export function formatAuthError(error: any): string {
  if (!error) return 'An unexpected error occurred. Please try again.';
  const code = (error as AuthError).code || error.message || '';

  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This user account has been disabled.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Your password must contain at least 6 characters.';
    case 'auth/unauthorized-domain':
      return 'Google Sign-In is restricted because this deployment domain has not been added to your Firebase Authorized Domains list yet. Please use Email & Password registration below (which works immediately), or add this domain in your Firebase Authentication Console.';
    case 'auth/operation-not-allowed':
      return 'This sign-in provider is not enabled in Firebase Console. Please use Email & Password or enable Google Sign-In.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completion.';
    case 'auth/cancelled-popup-request':
      return 'Sign-in operation cancelled.';
    case 'auth/popup-blocked':
      return 'Popup was blocked by your browser. Please allow popups to sign in with Google.';
    case 'auth/network-request-failed':
      return 'Network error occurred. Please check your internet connection.';
    case 'auth/too-many-requests':
      return 'Access to this account has been temporarily disabled due to many failed attempts. Try again later.';
    default:
      if (typeof error.message === 'string' && error.message.length < 100) {
        return error.message.replace(/^Firebase:\s*/, '');
      }
      return 'Authentication failed. Please verify your credentials and try again.';
  }
}

/**
 * Sign in with email and password
 */
export async function loginWithEmail(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  await syncUserProfile(cred.user);
  return cred.user;
}

/**
 * Register new user with full name, email, and password
 */
export async function registerWithEmail(name: string, email: string, password: string): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (name.trim()) {
    await updateProfile(cred.user, { displayName: name.trim() });
  }
  await syncUserProfile(cred.user);
  return cred.user;
}

/**
 * Sign in / Sign up with Google OAuth
 */
export async function loginWithGoogle(): Promise<User> {
  const cred = await signInWithPopup(auth, googleProvider);
  await syncUserProfile(cred.user);
  return cred.user;
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

/**
 * Sign out current session
 */
export async function logout(): Promise<void> {
  await fbSignOut(auth);
}
