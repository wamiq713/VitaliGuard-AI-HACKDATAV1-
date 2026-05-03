export interface GoalReminder {
  id: string;
  goal: string;
  time: string; // HH:mm
  frequency: 'daily' | 'weekly' | 'weekdays';
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  height?: number; // cm
  weight?: number; // kg
  goals?: string[];
  reminders?: GoalReminder[];
  dailyWaterGoal?: number; // Liters
  createdAt: string;
}

export interface HealthLog {
  id?: string;
  userId: string;
  date: string; // YYYY-MM-DD
  steps?: number;
  sleepHours?: number;
  waterIntake?: number; // Liters
  caloriesConsumed?: number;
  mood?: string;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  bmi: number;
  recordedAt: string;
}

export interface HealthRiskReport {
  id?: string;
  userId: string;
  diabetesRisk: 'low' | 'medium' | 'high';
  hypertensionRisk: 'low' | 'medium' | 'high';
  stressRisk: 'low' | 'medium' | 'high';
  recommendations: string[];
  calculatedAt: string;
}

export interface ChatMessage {
  id?: string;
  userId: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: { providerId: string; displayName: string; email: string; }[];
  }
}
