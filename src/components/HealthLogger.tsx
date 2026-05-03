import React from 'react';
import { UserProfile, HealthLog } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { calculateBMI, formatDate } from '../lib/utils';
import { Save, Calendar, StepForward, Moon, Droplets, Utensils, Smile, Heart } from 'lucide-react';
import { motion } from 'motion/react';

interface HealthLoggerProps {
  user: UserProfile;
}

export default function HealthLogger({ user }: HealthLoggerProps) {
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    date: formatDate(new Date()),
    steps: '',
    sleepHours: '',
    waterIntake: '',
    caloriesConsumed: '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    mood: 'Good'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const bmi = calculateBMI(user.weight || 0, user.height || 0);
      
      const logData: any = {
        userId: user.uid,
        date: formData.date,
        steps: formData.steps ? Number(formData.steps) : 0,
        sleepHours: formData.sleepHours ? Number(formData.sleepHours) : 0,
        waterIntake: formData.waterIntake ? Number(formData.waterIntake) : 0,
        caloriesConsumed: formData.caloriesConsumed ? Number(formData.caloriesConsumed) : 0,
        bloodPressureSystolic: formData.bloodPressureSystolic ? Number(formData.bloodPressureSystolic) : null,
        bloodPressureDiastolic: formData.bloodPressureDiastolic ? Number(formData.bloodPressureDiastolic) : null,
        mood: formData.mood,
        bmi: bmi > 0 ? bmi : null,
        recordedAt: new Date().toISOString()
      };

      const logPath = `users/${user.uid}/logs`;
      try {
        await addDoc(collection(db, logPath), logData);
        alert('Log saved successfully!');
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, logPath);
      }
      setFormData({
        date: formatDate(new Date()),
        steps: '',
        sleepHours: '',
        waterIntake: '',
        caloriesConsumed: '',
        bloodPressureSystolic: '',
        bloodPressureDiastolic: '',
        mood: 'Good'
      });
    } catch (error) {
      console.error('Error saving log:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Log Health Data</h2>
        <p className="text-gray-500 italic mt-1">Keep track of your daily habits for better AI insights.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date Input */}
          <div className="space-y-2">
            <label htmlFor="log-date" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" aria-hidden="true" />
              Date
            </label>
            <input
              id="log-date"
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* Steps Input */}
          <div className="space-y-2">
            <label htmlFor="log-steps" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <StepForward className="w-4 h-4 text-blue-600" aria-hidden="true" />
              Steps
            </label>
            <input
              id="log-steps"
              type="number"
              required
              value={formData.steps}
              onChange={(e) => setFormData({ ...formData, steps: e.target.value })}
              placeholder="e.g., 8000"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* Sleep Input */}
          <div className="space-y-2">
            <label htmlFor="log-sleep" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Moon className="w-4 h-4 text-blue-600" aria-hidden="true" />
              Sleep <span className="text-gray-400 font-normal italic">(hours)</span>
            </label>
            <input
              id="log-sleep"
              type="number"
              step="0.1"
              required
              value={formData.sleepHours}
              onChange={(e) => setFormData({ ...formData, sleepHours: e.target.value })}
              placeholder="e.g., 7.5"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* Water Input */}
          <div className="space-y-2">
            <label htmlFor="log-water" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-600" aria-hidden="true" />
              Water Intake <span className="text-gray-400 font-normal italic">(liters)</span>
            </label>
            <input
              id="log-water"
              type="number"
              step="0.1"
              required
              value={formData.waterIntake}
              onChange={(e) => setFormData({ ...formData, waterIntake: e.target.value })}
              placeholder="e.g., 2.5"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* Calories Input */}
          <div className="space-y-2">
            <label htmlFor="log-calories" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Utensils className="w-4 h-4 text-blue-600" aria-hidden="true" />
              Calories Consumed <span className="text-gray-400 font-normal italic">(kcal)</span>
            </label>
            <input
              id="log-calories"
              type="number"
              required
              value={formData.caloriesConsumed}
              onChange={(e) => setFormData({ ...formData, caloriesConsumed: e.target.value })}
              placeholder="e.g., 2100"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          
          {/* Blood Pressure Input */}
          <div className="space-y-2">
            <label htmlFor="log-bp" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Heart className="w-4 h-4 text-blue-600" aria-hidden="true" />
              Blood Pressure <span className="text-gray-400 font-normal italic">(systolic/diastolic)</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                id="log-bp-sys"
                type="number"
                value={formData.bloodPressureSystolic}
                onChange={(e) => setFormData({ ...formData, bloodPressureSystolic: e.target.value })}
                placeholder="120"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
              <span className="text-gray-400 font-bold">/</span>
              <input
                id="log-bp-dia"
                type="number"
                value={formData.bloodPressureDiastolic}
                onChange={(e) => setFormData({ ...formData, bloodPressureDiastolic: e.target.value })}
                placeholder="80"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="log-mood" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Smile className="w-4 h-4 text-blue-600" aria-hidden="true" />
              Mood
            </label>
            <select
              id="log-mood"
              value={formData.mood}
              onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            >
              <option>Great</option>
              <option>Good</option>
              <option>Okay</option>
              <option>Tired</option>
              <option>Stressed</option>
            </select>
          </div>
        </div>

        <div className="pt-4">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 hover:bg-blue-700 disabled:opacity-50 transition-all uppercase tracking-wide"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Saving...' : 'Save Daily Log'}
          </motion.button>
        </div>
      </form>
    </div>
  );
}
