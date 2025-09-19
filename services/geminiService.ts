
import { GoogleGenAI, Type } from "@google/genai";

// FIX: Aligned with @google/genai guidelines for API client initialization.
// The API key must be sourced exclusively from `process.env.API_KEY`.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const generateCategories = async (count: number): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate ${count} unique, single-word trivia categories in Arabic suitable for a Jeopardy-style game. Focus on topics like history, science, literature, and general knowledge.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            categories: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
                description: "A single trivia category in Arabic.",
              },
            },
          },
        },
      },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    return result.categories || [];
  } catch (error) {
    console.error("Error generating categories with Gemini:", error);
    // Fallback to generic categories in case of an API error
    return Array.from({ length: count }, (_, i) => `فئة ${i + 1}`);
  }
};