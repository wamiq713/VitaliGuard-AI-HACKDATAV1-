import { auth } from '../firebase';
import { 
  FirestoreErrorInfo 
} from '../types';
import { FirebaseError } from 'firebase/app';

export const handleFirestoreError = (error: unknown, operationType: FirestoreErrorInfo['operationType'], path: string | null = null): never => {
  const user = auth.currentUser;
  
  const errorInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: user?.uid || 'anonymous',
      email: user?.email || 'none',
      emailVerified: user?.emailVerified || false,
      isAnonymous: user?.isAnonymous || true,
      providerInfo: user?.providerData.map(p => ({
        providerId: p.providerId,
        displayName: p.displayName || '',
        email: p.email || ''
      })) || []
    }
  };

  throw new Error(JSON.stringify(errorInfo));
};

export const calculateBMI = (weightKg: number, heightCm: number): number => {
  if (!weightKg || !heightCm) return 0;
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
};

export const getBMICategory = (bmi: number): string => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};
