import React from 'react';
import { UserProfile, HealthLog, HealthRiskReport } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { Activity, Thermometer, Moon, Droplets, Utensils, TrendingUp, AlertCircle, Sparkles, BarChart3, Bell, Clock, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { analyzeHealthRisks } from '../lib/gemini';
import ProgressTracker from './ProgressTracker';

const StatCard = ({ title, value, icon: Icon, color, unit }: any) => (
  <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md" aria-labelledby={`stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500" id={`stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 mt-1">
          {value || '--'} <span className="text-sm font-normal text-gray-400">{unit}</span>
        </h3>
      </div>
      <div className={`p-2 rounded-lg ${color}`} aria-hidden="true">
        <Icon className="w-5 h-5" />
      </div>
    </div>
  </section>
);

interface DashboardProps {
  user: UserProfile;
}

export default function Dashboard({ user }: DashboardProps) {
  const [logs, setLogs] = React.useState<HealthLog[]>([]);
  const [riskReport, setRiskReport] = React.useState<HealthRiskReport | null>(null);
  const [analyzing, setAnalyzing] = React.useState(false);

  React.useEffect(() => {
    // Increase limit to 30 for better progress tracking
    const qLogs = query(
      collection(db, `users/${user.uid}/logs`),
      orderBy('date', 'desc'),
      limit(30)
    );
    const unsubLogs = onSnapshot(qLogs, (snap) => {
      setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as HealthLog)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/logs`);
    });

    const qRisks = query(
      collection(db, `users/${user.uid}/risks`),
      orderBy('calculatedAt', 'desc'),
      limit(1)
    );
    const unsubRisks = onSnapshot(qRisks, (snap) => {
      if (!snap.empty) {
        setRiskReport(snap.docs[0].data() as HealthRiskReport);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/risks`);
    });

    return () => {
      unsubLogs();
      unsubRisks();
    };
  }, [user.uid]);

  const handleAnalyze = async () => {
    if (logs.length === 0) return alert('Add some health logs first!');
    setAnalyzing(true);
    try {
      const result = await analyzeHealthRisks(user, logs);
      const riskPath = `users/${user.uid}/risks`;
      try {
        await addDoc(collection(db, riskPath), {
          ...result,
          calculatedAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, riskPath);
      }
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const currentLog = logs[0];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Health Overview</h2>
          <p className="text-gray-500">Welcome back, {user.displayName}</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAnalyze}
          disabled={analyzing}
          aria-label="Run AI health risk analysis"
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-200 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50 transition-all"
        >
          <Sparkles className="w-5 h-5" aria-hidden="true" />
          {analyzing ? 'Analyzing...' : 'AI Risk Analysis'}
        </motion.button>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard 
          title="Steps" 
          value={currentLog?.steps} 
          icon={Activity} 
          unit="steps"
          color="bg-orange-50 text-orange-600" 
        />
        <StatCard 
          title="BP" 
          value={currentLog?.bloodPressureSystolic && currentLog?.bloodPressureDiastolic ? `${currentLog.bloodPressureSystolic}/${currentLog.bloodPressureDiastolic}` : undefined} 
          icon={Heart} 
          unit="mmHg"
          color="bg-red-50 text-red-600" 
        />
        <StatCard 
          title="Sleep" 
          value={currentLog?.sleepHours} 
          icon={Moon} 
          unit="hours"
          color="bg-purple-50 text-purple-600" 
        />
        <StatCard 
          title="Water" 
          value={`${currentLog?.waterIntake || 0} / ${user.dailyWaterGoal || 2}`} 
          icon={Droplets} 
          unit="L"
          color="bg-blue-50 text-blue-600" 
        />
        <StatCard 
          title="Calories" 
          value={currentLog?.caloriesConsumed} 
          icon={Utensils} 
          unit="kcal"
          color="bg-green-50 text-green-600" 
        />
      </div>

      {/* Progress Tracking */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-bold text-gray-900">Health Progress Trends</h3>
        </div>
        <ProgressTracker logs={logs} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Risk Assessment */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">AI Risk Assessment</h3>
            </div>

            {riskReport ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Diabetes', risk: riskReport.diabetesRisk },
                    { label: 'Hypertension', risk: riskReport.hypertensionRisk },
                    { label: 'Stress', risk: riskReport.stressRisk },
                  ].map((item) => (
                    <div key={item.label} className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                      <p className="text-sm font-medium text-gray-500">{item.label}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`w-3 h-3 rounded-full ${
                          item.risk === 'high' ? 'bg-red-500' :
                          item.risk === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                        <span className="font-bold capitalize">{item.risk} Risk</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm uppercase tracking-wider text-blue-600">
                    <Sparkles className="w-4 h-4" />
                    Personalized Recommendations
                  </h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {riskReport.recommendations.map((rec, i) => (
                      <li key={i} className="flex gap-3 text-gray-600 text-sm bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                        <span className="text-blue-600 font-bold">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-gray-500">No risk assessment generated yet.<br/>Click "AI Risk Analysis" to get insights.</p>
              </div>
            )}
          </section>
        </div>

        {/* BMI & Stats */}
        <div className="space-y-6">
          <section className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-3xl text-white shadow-xl shadow-blue-200">
            <h3 className="text-lg font-bold mb-4">Your BMI Status</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold">{currentLog?.bmi || '--'}</span>
              <span className="text-indigo-100">BMI Index</span>
            </div>
            <div className="mt-4 p-3 bg-white/10 rounded-xl inline-block text-sm font-medium">
              Category: {currentLog?.bmi ? (currentLog.bmi < 18.5 ? 'Underweight' : currentLog.bmi < 25 ? 'Normal' : 'Overweight') : '--'}
            </div>
          </section>

          <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-600" />
              Active Reminders
            </h3>
            <div className="space-y-3">
              {user.reminders && user.reminders.length > 0 ? (
                user.reminders.map((reminder) => (
                  <div key={reminder.id} className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900 leading-none">{reminder.goal}</p>
                      <p className="text-[10px] text-blue-600 font-medium mt-1">
                        {reminder.time} • {reminder.frequency.charAt(0).toUpperCase() + reminder.frequency.slice(1)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm italic">No reminders set.</p>
              )}
            </div>
            <p className="mt-4 text-[10px] text-gray-400 text-center">Manage reminders in your Profile</p>
          </section>

          <section className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Health Goals</h3>
            <div className="space-y-3">
              {user.goals?.map((goal, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-700">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  {goal}
                </div>
              )) || <p className="text-gray-500 text-sm">No goals set yet.</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
