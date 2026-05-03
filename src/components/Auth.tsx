import React from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { LogIn, LogOut, Shield } from 'lucide-react';
import { motion } from 'motion/react';

export default function Auth() {
  const [loading, setLoading] = React.useState(false);

  const [error, setError] = React.useState<string | null>(null);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      // Force account selection to avoid issues with cached sessions in some browsers
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Initialize user doc if it doesn't exist. 
      // Using setDoc with merge: true to avoid the need for a separate getDoc existence check.
      const userRef = doc(db, 'users', user.uid);
      try {
        await setDoc(userRef, {
          uid: user.uid,
          displayName: user.displayName || 'User',
          email: user.email || '',
          createdAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.error('Firestore initialization error (this is okay if user doc already exists or profile is being managed separately):', err);
      }
    } catch (err: any) {
      console.error('Full Sign-in Error Object:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup closed. Please try again.');
      } else if (err.code === 'auth/cancelled-by-user') {
        setError('Sign-in cancelled. Please try again.');
      } else if (err.code === 'auth/internal-error') {
        setError('Authentication error (Internal). SUGGESTION: Open the app in a NEW TAB using the button in the top header, or enable third-party cookies in your browser settings.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Check your internet or try opening in a new tab.');
      } else {
        setError(`Sign-in error: ${err.message || 'An unexpected error occurred.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => signOut(auth);

  if (auth.currentUser) {
    return (
      <button
        onClick={handleSignOut}
        aria-label="Sign out of your account"
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="p-4 bg-blue-100 rounded-full"
      >
        <Shield className="w-12 h-12 text-blue-600" />
      </motion.div>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Welcome to VitaliGuard AI</h2>
        <p className="mt-2 text-gray-600">Your AI-powered preventive health companion.</p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 max-w-xs text-center"
        >
          {error}
        </motion.div>
      )}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSignIn}
        disabled={loading}
        aria-label="Sign in with your Google account"
        className="flex items-center gap-3 px-8 py-3 text-white bg-blue-600 rounded-xl font-semibold shadow-lg shadow-blue-200 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50 transition-all"
      >
        <LogIn className="w-5 h-5" />
        {loading ? 'Signing in...' : 'Sign in with Google'}
      </motion.button>
    </div>
  );
}
