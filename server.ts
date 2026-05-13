import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Gemini Initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const MODELS = {
  text: "gemini-3-flash-preview",
  vision: "gemini-flash-latest",
};

// AI Endpoints
app.post("/api/ai/match", async (req, res) => {
  const { pantry, preferences } = req.body;
  const pantryList = pantry.map((i: any) => `${i.name} (${i.quantity} ${i.unit})`).join(", ");
  
  const prompt = `Based on these ingredients: ${pantryList}. 
    User preferences: ${JSON.stringify(preferences)}.
    Suggest 5 creative recipes. 
    Include flavorProfile (spicy, sweet, savory, fresh, rich, acidic from 0.0 to 1.0) and techniqueTags.
    Also calculate a wasteReductionScore (0-10) based on using items that might be closer to expiration.
    Return a JSON array of recipe objects.
    Each object should have: title, description, ingredients (name, quantity), steps, prepTime, cookTime, difficulty, cuisine, nutrients (calories, protein, carbs, fat), flavorProfile, techniqueTags, wasteReductionScore, imageUrl.`;

  try {
    const response = await ai.models.generateContent({
      model: MODELS.text,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              ingredients: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    quantity: { type: Type.STRING }
                  }
                }
              },
              steps: { type: Type.ARRAY, items: { type: Type.STRING } },
              prepTime: { type: Type.INTEGER },
              cookTime: { type: Type.INTEGER },
              difficulty: { type: Type.STRING },
              cuisine: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              techniqueTags: { type: Type.ARRAY, items: { type: Type.STRING } },
              wasteReductionScore: { type: Type.NUMBER },
              flavorProfile: {
                type: Type.OBJECT,
                properties: {
                  spicy: { type: Type.NUMBER },
                  sweet: { type: Type.NUMBER },
                  savory: { type: Type.NUMBER },
                  fresh: { type: Type.NUMBER },
                  rich: { type: Type.NUMBER },
                  acidic: { type: Type.NUMBER }
                }
              },
              nutrients: {
                type: Type.OBJECT,
                properties: {
                  calories: { type: Type.INTEGER },
                  protein: { type: Type.STRING },
                  carbs: { type: Type.STRING },
                  fat: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text || "";
    const cleanJson = text.replace(/```json\n?|```/g, "").trim();
    res.json(JSON.parse(cleanJson));
  } catch (error) {
    console.error("AI matching failed", error);
    res.status(500).json({ error: "AI matching failed" });
  }
});

app.post("/api/ai/vision", async (req, res) => {
  const { image, mimeType } = req.body;
  const prompt = "Identify all the food ingredients visible in this image. Return a simple JSON array of strings.";
  
  try {
    const response = await ai.models.generateContent({
      model: MODELS.vision,
      contents: [
        {
          parts: [
            { inlineData: { data: image, mimeType } },
            { text: prompt }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    const text = response.text || "[]";
    const cleanJson = text.replace(/```json\n?|```/g, "").trim();
    res.json(JSON.parse(cleanJson));
  } catch (error) {
    console.error("AI vision failed", error);
    res.status(500).json({ error: "AI vision failed" });
  }
});

app.post("/api/ai/barcode", async (req, res) => {
  const { image, mimeType } = req.body;
  const prompt = "Read the barcode in this image. If you find a barcode, look up the product and return its details. If multiple items are present, pick the most prominent one. Return a JSON object with: name, category (Produce, Dairy, Proteins, Pantry Staples, Spices, Frozen), quantity (number only), unit (string). If no barcode is found, return null.";
  
  try {
    const response = await ai.models.generateContent({
      model: MODELS.vision,
      contents: [
        {
          parts: [
            { inlineData: { data: image, mimeType } },
            { text: prompt }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            category: { type: Type.STRING },
            quantity: { type: Type.NUMBER },
            unit: { type: Type.STRING }
          }
        }
      }
    });
    const text = response.text || "null";
    const cleanJson = text.replace(/```json\n?|```/g, "").trim();
    res.json(JSON.parse(cleanJson));
  } catch (error) {
    console.error("AI barcode failed", error);
    res.status(500).json({ error: "AI barcode failed" });
  }
});

app.post("/api/ai/substitute", async (req, res) => {
  const { missing, pantry, dietary } = req.body;
  const pantryList = pantry.map((i: any) => i.name).join(", ");
  const prompt = `Missing ingredients: ${missing.join(", ")}.
    Available in pantry: ${pantryList}.
    Dietary restrictions: ${dietary.join(", ")}.
    Suggest the best possible substitutions for each missing ingredient using only items from the available pantry or common household alternatives.
    For each, provide: name, confidence (0-100), and rationale.
    Return a JSON object where keys are missing ingredient names.`;

  try {
    const response = await ai.models.generateContent({
      model: MODELS.text,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          additionalProperties: {
            type: Type.OBJECT,
            properties: {
              substitution: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              rationale: { type: Type.STRING }
            }
          }
        }
      }
    });
    const text = response.text || "{}";
    const cleanJson = text.replace(/```json\n?|```/g, "").trim();
    res.json(JSON.parse(cleanJson));
  } catch (error) {
    console.error("Substitution failed", error);
    res.status(500).json({ error: "Substitution failed" });
  }
});

app.post("/api/ai/custom", async (req, res) => {
  const { cuisine, dietary, usePantry, pantry } = req.body;
  const pantryList = usePantry ? pantry.map((i: any) => `${i.name} (${i.quantity} ${i.unit})`).join(", ") : "none";
  
  const prompt = `Create a unique, high-quality recipe based on these criteria:
    Cuisine: ${cuisine || 'Any'}
    Dietary Preferences: ${dietary || 'None'}
    Available Ingredients: ${pantryList}
    
    The recipe must be creative and use the available ingredients where possible.
    Include flavorProfile and techniqueTags.
    Return a JSON object conforming to the following schema.`;

  try {
    const response = await ai.models.generateContent({
      model: MODELS.text,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            imageUrl: { type: Type.STRING },
            prepTime: { type: Type.NUMBER },
            cookTime: { type: Type.NUMBER },
            difficulty: { type: Type.STRING },
            cuisine: { type: Type.STRING },
            techniqueTags: { type: Type.ARRAY, items: { type: Type.STRING } },
            flavorProfile: {
              type: Type.OBJECT,
              properties: {
                spicy: { type: Type.NUMBER },
                sweet: { type: Type.NUMBER },
                savory: { type: Type.NUMBER },
                fresh: { type: Type.NUMBER },
                rich: { type: Type.NUMBER },
                acidic: { type: Type.NUMBER }
              }
            },
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  quantity: { type: Type.STRING }
                }
              }
            },
            steps: { type: Type.ARRAY, items: { type: Type.STRING } },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            nutrients: {
              type: Type.OBJECT,
              properties: {
                calories: { type: Type.NUMBER },
                protein: { type: Type.STRING },
                carbs: { type: Type.STRING },
                fat: { type: Type.STRING }
              }
            }
          }
        }
      }
    });

    const text = response.text || "{}";
    const cleanJson = text.replace(/```json\n?|```/g, "").trim();
    res.json(JSON.parse(cleanJson));
  } catch (error) {
    console.error("Custom recipe failed", error);
    res.status(500).json({ error: "Custom recipe failed" });
  }
});

app.post("/api/ai/geocode", async (req, res) => {
  const { address } = req.body;
  const prompt = `Geocode this address to latitude and longitude: "${address}". Return a JSON object with lat and lng. If you cannot find the location, return null.`;
  
  try {
    const response = await ai.models.generateContent({
      model: MODELS.text,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            lat: { type: Type.NUMBER },
            lng: { type: Type.NUMBER }
          }
        }
      }
    });
    const text = response.text || "null";
    const cleanJson = text.replace(/```json\n?|```/g, "").trim();
    res.json(JSON.parse(cleanJson));
  } catch (error) {
    console.error("Geocoding failed", error);
    res.status(500).json({ error: "Geocoding failed" });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
