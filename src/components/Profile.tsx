import React from 'react';
import { UserProfile } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { User, Mail, Ruler, Weight, Target, Settings, ChevronRight, Plus, X, Droplets, Bell, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { GoalReminder } from '../types';
import { auth } from '../firebase';

interface ProfileProps {
  user: UserProfile;
}

export default function Profile({ user }: ProfileProps) {
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    age: user.age?.toString() || '',
    gender: user.gender || 'male',
    height: user.height?.toString() || '',
    weight: user.weight?.toString() || '',
    dailyWaterGoal: user.dailyWaterGoal?.toString() || '2.0'
  });
  const [goals, setGoals] = React.useState<string[]>(user.goals || []);
  const [reminders, setReminders] = React.useState<GoalReminder[]>(user.reminders || []);
  const [newGoal, setNewGoal] = React.useState('');
  const [newReminder, setNewReminder] = React.useState({ goal: '', time: '08:00', frequency: 'daily' as const });

  // Sync with user prop changes
  React.useEffect(() => {
    setFormData({
      age: user.age?.toString() || '',
      gender: user.gender || 'male',
      height: user.height?.toString() || '',
      weight: user.weight?.toString() || '',
      dailyWaterGoal: user.dailyWaterGoal?.toString() || '2.0'
    });
    setGoals(user.goals || []);
    setReminders(user.reminders || []);
  }, [user.uid, user.age, user.gender, user.height, user.weight, user.dailyWaterGoal, user.goals, user.reminders]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        age: Number(formData.age),
        gender: formData.gender,
        height: Number(formData.height),
        weight: Number(formData.weight),
        goals: goals.filter(g => g.trim() !== ''),
        reminders: reminders,
        dailyWaterGoal: Number(formData.dailyWaterGoal)
      }, { merge: true });
      alert('Profile updated!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  const addGoal = () => {
    if (newGoal.trim()) {
      setGoals([...goals, newGoal.trim()]);
      setNewGoal('');
    }
  };

  const removeGoal = (index: number) => {
    const goalToRemove = goals[index];
    setGoals(goals.filter((_, i) => i !== index));
    // Also remove reminders associated with this goal
    setReminders(reminders.filter(r => r.goal !== goalToRemove));
  };

  const addReminder = () => {
    if (newReminder.goal) {
      setReminders([...reminders, { ...newReminder, id: crypto.randomUUID() }]);
      setNewReminder({ goal: '', time: '08:00', frequency: 'daily' });
    }
  };

  const removeReminder = (id: string) => {
    setReminders(reminders.filter(r => r.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-6 mb-10 p-2">
        <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center text-white text-4xl font-bold shadow-xl shadow-blue-100">
          {user.displayName.charAt(0)}
        </div>
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900">{user.displayName}</h2>
          <p className="text-gray-500 font-medium">{user.email}</p>
          <div className="mt-2 flex gap-4 text-sm font-semibold text-blue-600">
            <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleUpdate} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-8">
            <div className="flex items-center justify-between pb-4 border-b border-gray-50">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                Physical Metrics
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Age */}
              <div className="space-y-1.5">
                <label htmlFor="profile-age" className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-3.5 h-3.5" aria-hidden="true" />
                  Age
                </label>
                <input
                  id="profile-age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                />
              </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <label htmlFor="profile-gender" className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-3.5 h-3.5" aria-hidden="true" />
                  Gender
                </label>
                <select
                  id="profile-gender"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Height */}
              <div className="space-y-1.5">
                <label htmlFor="profile-height" className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Ruler className="w-3.5 h-3.5" aria-hidden="true" />
                  Height (cm)
                </label>
                <input
                  id="profile-height"
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                />
              </div>

              {/* Weight */}
              <div className="space-y-1.5">
                <label htmlFor="profile-weight" className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Weight className="w-3.5 h-3.5" aria-hidden="true" />
                  Weight (kg)
                </label>
                <input
                  id="profile-weight"
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                />
              </div>

              {/* Water Goal */}
              <div className="space-y-1.5">
                <label htmlFor="profile-water" className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Droplets className="w-3.5 h-3.5 text-blue-500" aria-hidden="true" />
                  Daily Water Goal (L)
                </label>
                <input
                  id="profile-water"
                  type="number"
                  step="0.1"
                  value={formData.dailyWaterGoal}
                  onChange={(e) => setFormData({ ...formData, dailyWaterGoal: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Target className="w-3.5 h-3.5" aria-hidden="true" />
                Health Goals
              </h3>
              
              <div className="space-y-3" role="list">
                {goals.map((goal, index) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={index} 
                    role="listitem"
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl group"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600" aria-hidden="true" />
                    <span className="flex-1 text-sm text-gray-700 font-medium">{goal}</span>
                    <button
                      type="button"
                      onClick={() => removeGoal(index)}
                      aria-label={`Remove goal: ${goal}`}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal())}
                  placeholder="Add a new goal..."
                  aria-label="New health goal"
                  className="flex-1 px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={addGoal}
                  disabled={!newGoal.trim()}
                  className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50 transition-all flex items-center gap-2 font-bold text-sm"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  Add
                </button>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-50">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Bell className="w-3.5 h-3.5" aria-hidden="true" />
                Goal Reminders
              </h3>

              <div className="space-y-3">
                {reminders.map((reminder) => (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={reminder.id}
                    className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl group"
                  >
                    <Clock className="w-4 h-4 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900">{reminder.goal}</p>
                      <p className="text-xs text-blue-600 font-medium">
                        {reminder.time} • {reminder.frequency.charAt(0).toUpperCase() + reminder.frequency.slice(1)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeReminder(reminder.id)}
                      aria-label={`Remove reminder for ${reminder.goal}`}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>

              {goals.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-gray-50 rounded-2xl">
                  <div className="space-y-1.5">
                    <label htmlFor="reminder-goal" className="text-[10px] font-bold text-gray-400 uppercase">Select Goal</label>
                    <select
                      id="reminder-goal"
                      value={newReminder.goal}
                      onChange={(e) => setNewReminder({ ...newReminder, goal: e.target.value })}
                      className="w-full px-3 py-2 bg-white rounded-lg border-none text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                    >
                      <option value="">Choose a goal...</option>
                      {goals.map((goal, i) => (
                        <option key={i} value={goal}>{goal}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="reminder-time" className="text-[10px] font-bold text-gray-400 uppercase">Time</label>
                    <input
                      id="reminder-time"
                      type="time"
                      value={newReminder.time}
                      onChange={(e) => setNewReminder({ ...newReminder, time: e.target.value })}
                      className="w-full px-3 py-2 bg-white rounded-lg border-none text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="reminder-freq" className="text-[10px] font-bold text-gray-400 uppercase">Frequency</label>
                    <select
                      id="reminder-freq"
                      value={newReminder.frequency}
                      onChange={(e) => setNewReminder({ ...newReminder, frequency: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white rounded-lg border-none text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekdays">Weekdays</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={addReminder}
                      disabled={!newReminder.goal}
                      className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold text-xs hover:bg-blue-700 disabled:opacity-50 transition-all"
                    >
                      Add Reminder
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">Add at least one health goal to set reminders.</p>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black disabled:opacity-50 transition-all uppercase tracking-widest text-xs"
            >
              {loading ? 'Updating...' : 'Save Profile Settings'}
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-600 p-8 rounded-[32px] text-white">
            <h4 className="text-xl font-bold mb-4">Pro Security</h4>
            <p className="text-blue-100 text-sm leading-relaxed mb-6">
              Your health data is encrypted and protected by enterprise-grade AI security. We never share your personal metrics.
            </p>
            <div className="py-3 px-4 bg-white/10 rounded-2xl border border-white/10 text-xs font-semibold flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full" />
              HIPAA Compliant Protocols
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
