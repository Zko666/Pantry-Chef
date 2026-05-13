import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not defined in the environment.");
}

export const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "" 
});

export const MODELS = {
  text: "gemini-3-flash-preview",
  vision: "gemini-flash-latest", // Use latest flash for vision as it's often more stable for image processing
};
