
import { GoogleGenAI } from "@google/genai";
import { ExerciseName } from "../types";

const API_KEY = process.env.API_KEY;
let ai: GoogleGenAI | null = null;

if (API_KEY) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
    console.warn("Gemini API key not found. AI-powered motivational tips are disabled. Please set the API_KEY environment variable to enable this feature.");
}

const tipCache = new Map<string, string>();

const defaultTips = [
    "Keep pushing, you're doing great!",
    "Focus on your form, one rep at a time.",
    "Breathe and stay focused.",
    "You've got this! Keep up the great work.",
    "Every rep makes you stronger."
];


export const getMotivationalTip = async (exercise: ExerciseName, correction: string): Promise<string> => {
    // If AI client isn't initialized or API key is missing, return a default tip.
    if (!ai) {
        return defaultTips[Math.floor(Math.random() * defaultTips.length)];
    }

    const cacheKey = `${exercise}:${correction}`;
    if (tipCache.has(cacheKey)) {
        return tipCache.get(cacheKey)!;
    }

    const prompt = `
        You are an encouraging AI fitness coach. A user is doing ${exercise} and needs a correction.
        The specific issue is: "${correction}".
        Provide a very short, positive, and actionable tip (max 1-2 sentences) to help them improve their form.
        Do not greet the user. Be direct and encouraging.
        Example for 'Squat deeper!': "Great job! Try to lower your hips just a bit more, as if you're sitting in a chair. You've got this!"
    `;

    try {
        let textResult = '';
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    temperature: 0.7,
                    maxOutputTokens: 60,
                }
            });
            textResult = typeof (response as any).text === 'function' ? (response as any).text() : (response.text || '');
        } catch (modelErr) {
            // Fallback to gemini-1.5-flash or gemini-2.0-flash
            const fallbackResponse = await ai.models.generateContent({
                model: "gemini-1.5-flash",
                contents: prompt,
                config: {
                    temperature: 0.7,
                    maxOutputTokens: 60,
                }
            });
            textResult = typeof (fallbackResponse as any).text === 'function' ? (fallbackResponse as any).text() : (fallbackResponse.text || '');
        }
        
        const tip = textResult.trim();
        if (tip) {
            tipCache.set(cacheKey, tip);
        }
        return tip || "Focus on your form and keep pushing!";
    } catch (error) {
        console.warn("Could not fetch tip from Gemini, using encouraging fallback tip:", error);
        return defaultTips[Math.floor(Math.random() * defaultTips.length)];
    }
};
