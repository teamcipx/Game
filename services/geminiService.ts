
import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => {
  if (!process.env.API_KEY) {
    console.error("API_KEY is missing");
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export interface TriviaQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  reward: number;
}

export const generateDailyChallenge = async (): Promise<TriviaQuestion | null> => {
  const ai = getAI();
  if (!ai) return null;

  const prompt = `
    Generate a "High Stakes Trivia Question" for a game where players earn real money.
    The question should be about General Knowledge, Tech, or Pop Culture.
    Difficulty: Medium.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            correctAnswer: { type: Type.STRING },
            reward: { type: Type.NUMBER }
          },
          required: ["question", "options", "correctAnswer", "reward"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    
    return JSON.parse(text) as TriviaQuestion;
  } catch (error) {
    console.error("Gemini Trivia Error:", error);
    return {
      question: "Which built-in React hook is used for side effects?",
      options: ["useState", "useEffect", "useContext", "useReducer"],
      correctAnswer: "useEffect",
      reward: 10
    };
  }
};
