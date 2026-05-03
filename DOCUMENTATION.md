# VitaliGuard AI - Project Documentation

## Team Information
*   **Team Name:** [TEAM_NAME]
*   **Team Lead Name:** [TEAM_LEAD_NAME]
*   **Project Name:** VitaliGuard AI

---

## 1. Problem Statement
Many individuals struggle to track their health metrics consistently and lack an intuitive way to understand the long-term implications of their daily habits. Existing apps often provide raw data but fail to offer personalized, actionable insights or preventive care warnings. VitaliGuard AI bridges this gap by combining traditional health tracking with cutting-edge AI to predict potential health risks (like hypertension or diabetes) and providing a friendly AI companion for immediate medical inquiries and lifestyle guidance.

---

## 2. Frontend Details
The application is built using **React 18** with **Vite** as the build tool, styled with **Tailwind CSS** for a modern, responsive interface. **Framer Motion** is utilized for smooth, purposeful animations between transitions and for interactive UI elements.

### Vibe Coding Prompts Used:
1. "Create a comprehensive health tracking application called VitaliGuard AI. It should have a Dashboard, a Health Logger, an AI Chatbot, and a Profile section."
2. "Design a sleek, dark-themed UI using Tailwind CSS and Framer Motion that feels like a professional medical portal."
3. "The Dashboard must feature AI-powered Risk Gauges that analyze historical health logs to identify patterns for Hypertension, Stress, and overall wellness."
4. "Implement a daily Health Logger that captures steps, sleep quality, water intake, blood pressure (systolic/diastolic), and mood."
5. "Integrate Gemini AI to act as a health assistant, providing a chat interface that can reference the user's specific health data to offer personalized advice."
6. "Use Firebase for secure Google Authentication and Firestore for real-time synchronization of health records across the platform."

---

## 3. AI Integration (Gemini AI)
VitaliGuard AI leverages the **Google Gemini API** (`gemini-3-flash-preview`) to provide intelligent preventive care:
1.  **Risk Prediction:** Gemini analyzes user physical metrics (Age, BMI) alongside multi-day health logs (Steps, Sleep, BP) to predict risk categories for chronic diseases.
2.  **Structured JSON Extraction:** The app uses Gemini's schema-guided generation to ensure risk reports are always valid and can be rendered directly into UI components.
3.  **Actionable Recommendations:** Gemini generates personalized, non-generic health advice tailored to the specific gaps found in a user's logs (e.g., suggesting specific hydration increases if water intake is low).
4.  **Context-Aware Chatbot:** The VitaliGuard Assistant uses a sophisticated System Instruction to maintain a professional medical persona while remembering user-specific stats for empathetic conversations.
5.  **Multimodal Potential:** The system is built to scale toward multimodal analysis, allowing it to process physical data and conversational nuance simultaneously.
6.  **Real-time Analytics:** Every health log entry can trigger a background analysis turn to keep the user's 'Risk Profile' updated on every dashboard visit.

---

## 4. System Design Diagram
The following architecture represents the flow of data within VitaliGuard AI:

```mermaid
graph TD
    A[User / Web Browser] -->|Auth| B(Firebase Auth - Google Sign-in)
    A -->|Data Entry/Read| C(Firestore Database)
    A -->|Prompts| D(Google Gemini AI API)
    
    subgraph Frontend Logic (React)
    A1[Dashboard Component]
    A2[Health Logger]
    A3[AI Chatbot UI]
    A4[Profile/Goals Manager]
    end
    
    C -->|Sync State| A1
    C -->|Store Logs| A2
    D -->|Health Risk Report| A1
    D -->|Chat Responses| A3
    
    subgraph Data Flow
    Logs[Steps/Sleep/BP] -->|Raw Data| GeminiPrompt[Gemini Analysis Engine]
    GeminiPrompt -->|Structured JSON| FirestoreResult[Store in 'risks' Collection]
    FirestoreResult -->|Real-time Update| DashboardGauge[UI Risk Gauge]
    end
```

### Backend Architecture Notes:
*   **Authentication:** Managed via Firebase for secure, enterprise-level identity management.
*   **Database:** Cloud Firestore (NoSQL) stores user profiles, historical logs, and AI-generated risk reports in a hierarchical sub-collection structure for high performance.
*   **AI Layer:** Direct secure integration with Gemini API using environment variable protection and lazy initialization to optimize resource usage.
