import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are the Dungeon Master and Narrator for an atmospheric adventure game called "Echoes of the Canopy".
The tone is mysterious, serene, slightly melancholic, and wonder-filled.
The player is a lone wanderer who has just woken up in a strange, beautiful low-poly forest.

Rules:
1. Keep descriptions concise (max 2-3 sentences).
2. Focus on sensory details (light, sound, texture).
3. Do not offer choices, just describe the result of the player's action or observation.
4. Be creative with the lore. This isn't just a normal forest; it's old and forgotten.
`;

export const generateNarrative = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      }
    });
    
    return response.text || "...The wind whispers, but you cannot make out the words.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "A strange silence falls over the forest. (Connection Error)";
  }
};

export const generateObjectDescription = async (objectType: string, context: string): Promise<string> => {
  const prompt = `The player examines a ${objectType}. Context: ${context}. Describe what they see and feel.`;
  return generateNarrative(prompt);
};