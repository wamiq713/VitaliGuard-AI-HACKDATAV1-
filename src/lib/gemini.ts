import { GoogleGenAI, Type } from "@google/genai";
import { HealthLog, HealthRiskReport, UserProfile } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export const analyzeHealthRisks = async (user: UserProfile, logs: HealthLog[]): Promise<HealthRiskReport> => {
  const prompt = `Analyze the health data for the following user and provide a risk report.
  
  User Profile:
  Age: ${user.age}
  Gender: ${user.gender}
  BMI: ${user.weight && user.height ? (user.weight / ((user.height / 100) ** 2)).toFixed(1) : 'Unknown'}
  Goals: ${user.goals?.join(', ')}
  
  Recent Logs:
  ${logs.map(l => `- Date: ${l.date}, Steps: ${l.steps}, Sleep: ${l.sleepHours}h, Water: ${l.waterIntake}L, BP: ${l.bloodPressureSystolic}/${l.bloodPressureDiastolic}, Calories: ${l.caloriesConsumed}, Mood: ${l.mood}`).join('\n')}
  
  Predict risk levels (low, medium, high) for diabetes, hypertension, and stress. 
  Provide actionable personalized recommendations.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          diabetesRisk: { type: Type.STRING, enum: ["low", "medium", "high"] },
          hypertensionRisk: { type: Type.STRING, enum: ["low", "medium", "high"] },
          stressRisk: { type: Type.STRING, enum: ["low", "medium", "high"] },
          recommendations: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["diabetesRisk", "hypertensionRisk", "stressRisk", "recommendations"]
      }
    }
  });

  const rawJson = JSON.parse(response.text);
  return {
    ...rawJson,
    userId: user.uid,
    calculatedAt: new Date().toISOString()
  };
};

export const getHealthAssistantResponse = async (history: { role: 'user' | 'model', content: string }[], currentMessage: string, user: UserProfile) => {
  const systemInstruction = `You are VitaliGuard AI, a helpful and professional preventive healthcare assistant. 
  You provide guidance based on user health data. 
  User Name: ${user.displayName}
  User Stats: Age ${user.age}, Gender ${user.gender}, BMI ${user.weight && user.height ? (user.weight / ((user.height / 100) ** 2)).toFixed(1) : 'Unknown'}.
  Always encourage healthy habits and suggest seeing a doctor for medical emergencies.
  Be concise but empathetic.`;

  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction
    }
  });

  // Reconstruct history
  // Note: The SDK might have a specific format for history, usually { role: 'user' | 'model', parts: [{ text: '...' }] }
  const formattedHistory = history.map(h => ({
    role: h.role,
    parts: [{ text: h.content }]
  }));

  const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [...formattedHistory, { role: 'user', parts: [{ text: currentMessage }] }],
      config: {
          systemInstruction
      }
  });

  return response.text;
};
