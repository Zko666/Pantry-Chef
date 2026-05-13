import { Recipe, PantryItem } from "../types";

export async function matchRecipesWithPantry(pantry: PantryItem[], preferences: any): Promise<any[]> {
  try {
    const response = await fetch("/api/ai/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pantry, preferences }),
    });
    
    if (!response.ok) throw new Error("Server error");
    const recipes = await response.json();

    return recipes.map((r: any) => ({
      ...r,
      imageUrl: r.imageUrl || `https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&auto=format&fit=crop&q=60`,
      ingredients: r.ingredients || [],
      steps: r.steps || [],
      tags: r.tags || ['AI Suggested'],
      techniqueTags: r.techniqueTags || [],
      flavorProfile: r.flavorProfile || { spicy: 0.1, sweet: 0.1, savory: 0.5, fresh: 0.3, rich: 0.2, acidic: 0.1 }
    }));
  } catch (error) {
    console.error("AI matching failed", error);
    return [];
  }
}

export async function identifyIngredientsFromImage(base64Image: string, mimeType: string = "image/jpeg"): Promise<string[]> {
  try {
    const response = await fetch("/api/ai/vision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64Image, mimeType }),
    });
    if (!response.ok) throw new Error("Server error");
    return await response.json();
  } catch (error) {
    console.error("AI vision failed", error);
    throw error;
  }
}

export async function identifyBarcodeFromImage(base64Image: string, mimeType: string = "image/jpeg"): Promise<{ name: string, category: string, quantity: number, unit: string } | null> {
  try {
    const response = await fetch("/api/ai/barcode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64Image, mimeType }),
    });
    if (!response.ok) throw new Error("Server error");
    return await response.json();
  } catch (error) {
    console.error("AI barcode scan failed", error);
    throw error;
  }
}

export async function suggestSubstitutions(missing: string[], pantry: PantryItem[], dietary: string[]): Promise<any> {
  try {
    const response = await fetch("/api/ai/substitute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ missing, pantry, dietary }),
    });
    if (!response.ok) throw new Error("Server error");
    return await response.json();
  } catch (error) {
    console.error("Substitution scan failed", error);
    return {};
  }
}

export async function generateCustomRecipe(criteria: { cuisine?: string, dietary?: string, usePantry: boolean, pantry: PantryItem[] }): Promise<Recipe> {
  try {
    const response = await fetch("/api/ai/custom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(criteria),
    });
    if (!response.ok) throw new Error("Server error");
    const recipe = await response.json();
    
    // Ensure critical arrays exist
    if (!recipe.ingredients) recipe.ingredients = [];
    if (!recipe.steps) recipe.steps = [];
    if (!recipe.tags) recipe.tags = ['AI Dream'];
    
    // Add a fallback image if AI doesn't provide a good URL
    if (!recipe.imageUrl || !recipe.imageUrl.startsWith('http')) {
      recipe.imageUrl = `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=60`;
    }
    // Ensure ID exists
    if (!recipe.id) recipe.id = Math.random().toString(36).substr(2, 9);
    
    return recipe as Recipe;
  } catch (error) {
    console.error("AI recipe generation failed", error);
    throw error;
  }
}

export function calculateWasteUrgency(item: PantryItem): number {
  if (!item.expiryDate) return 0;
  
  const expiry = item.expiryDate.toDate ? item.expiryDate.toDate() : new Date(item.expiryDate);
  const now = new Date();
  const diffDays = Math.max(0.1, (expiry.getTime() - now.getTime()) / (1000 * 3600 * 24));
  
  const price = item.pricePerUnit || 5.0;
  const urgency = Math.pow(diffDays, -1.5) * price * 1.0;
  
  return urgency;
}

export function updateUserFlavorVector(currentVector: any, recipeProfile: any, actionWeight: number): any {
  const defaultVector = { spicy: 0.5, sweet: 0.5, savory: 0.5, fresh: 0.5, rich: 0.5, acidic: 0.5 };
  const vector = currentVector || defaultVector;
  const newVector = { ...vector };
  
  const keys = ['spicy', 'sweet', 'savory', 'fresh', 'rich', 'acidic'];
  keys.forEach(key => {
    const currentVal = vector[key] ?? 0.5;
    const recipeVal = recipeProfile?.[key] ?? 0.5;
    newVector[key] = Number((currentVal + (recipeVal - currentVal) * actionWeight).toFixed(3));
  });
  
  return newVector;
}

export async function geocodeAddress(address: string): Promise<{ lat: number, lng: number } | null> {
  try {
    const response = await fetch("/api/ai/geocode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });
    if (!response.ok) throw new Error("Server error");
    return await response.json();
  } catch (error) {
    console.error("Geocoding failed", error);
    return null;
  }
}

