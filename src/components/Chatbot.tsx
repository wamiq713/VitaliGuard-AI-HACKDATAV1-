import React from 'react';
import { UserProfile, ChatMessage } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { getHealthAssistantResponse } from '../lib/gemini';
import { Send, Bot, User, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ChatbotProps {
  user: UserProfile;
}

export default function Chatbot({ user }: ChatbotProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const q = query(
      collection(db, `users/${user.uid}/chat`),
      orderBy('timestamp', 'asc'),
      limit(50)
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/chat`);
    });
    return unsub;
  }, [user.uid]);

  React.useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    const chatPath = `users/${user.uid}/chat`;
    try {
      // 1. Save user message to Firestore
      try {
        await addDoc(collection(db, chatPath), {
          userId: user.uid,
          role: 'user',
          content: userMessage,
          timestamp: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, chatPath);
      }

      // 2. Get AI response
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const aiResponse = await getHealthAssistantResponse(history, userMessage, user);

      // 3. Save AI message to Firestore
      try {
        await addDoc(collection(db, chatPath), {
          userId: user.uid,
          role: 'model',
          content: aiResponse,
          timestamp: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, chatPath);
      }
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-160px)] flex flex-col bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6 bg-white border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center" aria-hidden="true">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 leading-none">VitaliGuard Assistant</h2>
            <p className="text-xs text-green-500 font-medium mt-1 uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" aria-hidden="true" />
              Online & Ready
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide" role="log" aria-live="polite">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <Bot className="w-12 h-12 text-gray-200 mx-auto mb-4" aria-hidden="true" />
            <p className="text-gray-400">Hello {user.displayName}! Ask me anything about your health data, diet, or exercise.</p>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <motion.div
            key={msg.id || i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                msg.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'
              }`} aria-hidden="true">
                {msg.role === 'user' ? <User className="w-4 h-4 text-blue-600" /> : <Bot className="w-4 h-4 text-gray-600" />}
              </div>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-gray-100 text-gray-800 rounded-tl-none'
              }`}>
                <span className="sr-only">{msg.role === 'user' ? 'You:' : 'Assistant:'}</span>
                {msg.content}
              </div>
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center" aria-hidden="true">
                <Bot className="w-4 h-4 text-gray-600" />
              </div>
              <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-tl-none space-x-1 flex items-center" aria-label="Assistant is thinking">
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="p-6 bg-white border-t border-gray-100">
        <form onSubmit={handleSend} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            aria-label="New Message"
            className="flex-1 px-4 py-3 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            aria-label="Send Message"
            className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center disabled:opacity-50 focus:ring-2 focus:ring-blue-500 outline-none hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
          >
            <Send className="w-5 h-5" aria-hidden="true" />
          </button>
        </form>
      </div>
    </div>
  );
}
