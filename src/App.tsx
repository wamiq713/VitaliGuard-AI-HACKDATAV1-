import React from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { UserProfile } from './types';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import HealthLogger from './components/HealthLogger';
import Chatbot from './components/Chatbot';
import Profile from './components/Profile';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, MessageSquare, LayoutDashboard, User as UserIcon, PlusCircle } from 'lucide-react';

export default function App() {
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [showRetry, setShowRetry] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'dashboard' | 'logs' | 'chat' | 'profile'>('dashboard');

  React.useEffect(() => {
    let unsubProfile: (() => void) | null = null;
    let timeout: NodeJS.Timeout;

    // Show retry option if initialization takes too long
    timeout = setTimeout(() => {
      setShowRetry(true);
    }, 8000);

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      
      // Clean up previous profile listener
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (user) {
        const userRef = doc(db, 'users', user.uid);
        unsubProfile = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          } else {
            setUserProfile(null);
          }
          setLoading(false);
          clearTimeout(timeout);
          setShowRetry(false);
        }, (error) => {
          console.error("Profile snapshot error:", error);
          setLoading(false);
          clearTimeout(timeout);
        });
      } else {
        setUserProfile(null);
        setLoading(false);
        clearTimeout(timeout);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubProfile) unsubProfile();
      clearTimeout(timeout);
    };
  }, []); // Empty dependencies ensure listeners are stable throughout the session

  const handleRetry = () => {
    window.location.reload();
  };

  const resolvedUser: UserProfile | null = React.useMemo(() => {
    if (userProfile) return userProfile;
    if (firebaseUser) {
      return {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName || 'User',
        email: firebaseUser.email || '',
        createdAt: new Date().toISOString()
      };
    }
    return null;
  }, [userProfile, firebaseUser]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500 animate-pulse font-medium">Checking health portal...</p>
        
        {showRetry && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 text-center"
          >
            <p className="text-sm text-gray-400 mb-4 max-w-xs">Connecting is taking longer than usual. This can happen in some restricted network environments.</p>
            <button 
              onClick={handleRetry}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 shadow-sm"
            >
              Refresh App
            </button>
          </motion.div>
        )}
      </div>
    );
  }

  if (!resolvedUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <Auth />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard user={resolvedUser} />;
      case 'logs': return <HealthLogger user={resolvedUser} />;
      case 'chat': return <Chatbot user={resolvedUser} />;
      case 'profile': return <Profile user={resolvedUser} />;
      default: return <Dashboard user={resolvedUser} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 p-6 fixed h-full" role="complementary">
        <div className="flex items-center gap-2 mb-10">
          <div className="p-2 bg-blue-600 rounded-lg" aria-hidden="true">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">VitaliGuard AI</h1>
        </div>

        <nav className="space-y-1" aria-label="Main Navigation">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'logs', label: 'Health Logs', icon: PlusCircle },
            { id: 'chat', label: 'AI Assistant', icon: MessageSquare },
            { id: 'profile', label: 'Profile', icon: UserIcon },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              aria-current={activeTab === item.id ? 'page' : undefined}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all focus:ring-2 focus:ring-blue-500 outline-none ${
                activeTab === item.id 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <item.icon className="w-5 h-5" aria-hidden="true" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto">
          <Auth />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8" id="main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Nav - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-50" aria-label="Mobile Navigation">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'logs', label: 'Health Logs', icon: PlusCircle },
          { id: 'chat', label: 'AI Assistant', icon: MessageSquare },
          { id: 'profile', label: 'Profile', icon: UserIcon },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            aria-label={item.label}
            aria-current={activeTab === item.id ? 'page' : undefined}
            className={`p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${activeTab === item.id ? 'text-blue-600 bg-blue-50' : 'text-gray-400'}`}
          >
            <item.icon className="w-6 h-6" aria-hidden="true" />
          </button>
        ))}
      </nav>
    </div>
  );
}
