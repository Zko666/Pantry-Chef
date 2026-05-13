import { Deal } from "../types";
import { ai, MODELS } from "../lib/gemini";
import { Type } from "@google/genai";

export interface LocalStrategy {
  option: string;
  stores: string[];
  total: number;
  time: number;
  savings: number;
  recommended: boolean;
}

// Haversine formula for distance calculation in miles
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Radius of Earth in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Number((R * c).toFixed(1));
}

// Simulated fetch from a grocery aggregator or real-time search
export async function fetchLocalDeals(location: { lat: number, lng: number }): Promise<Deal[]> {
  const baseDeals = [
    {
      id: "d101",
      storeName: "Safeway",
      itemName: "80% Lean Ground Beef",
      price: 3.97,
      originalPrice: 5.99,
      unit: "lb",
      category: "Meats",
      expiryDate: new Date("2026-05-17"),
      location: { lat: location.lat + 0.015, lng: location.lng - 0.01 }
    },
    {
      id: "d102",
      storeName: "Whole Foods",
      itemName: "Organic Raspberries (6oz)",
      price: 3.00,
      originalPrice: 4.50,
      unit: "pack",
      category: "Produce",
      expiryDate: new Date("2026-05-15"),
      location: { lat: location.lat - 0.005, lng: location.lng + 0.012 }
    },
    {
      id: "d103",
      storeName: "Trader Joe's",
      itemName: "Avocados",
      price: 0.99,
      originalPrice: 1.25,
      unit: "ea",
      category: "Produce",
      expiryDate: new Date("2026-05-20"),
      location: { lat: location.lat + 0.005, lng: location.lng + 0.005 }
    },
    {
      id: "d104",
      storeName: "Safeway",
      itemName: "Lucerne Milk (Gallon)",
      price: 3.49,
      originalPrice: 4.29,
      unit: "gal",
      category: "Dairy",
      expiryDate: new Date("2026-05-17"),
      location: { lat: location.lat + 0.015, lng: location.lng - 0.01 }
    },
    {
       id: "d105",
       storeName: "Kroger",
       itemName: "Chicken Breast",
       price: 2.49,
       originalPrice: 4.99,
       unit: "lb",
       category: "Meats",
       expiryDate: new Date("2026-05-18"),
       location: { lat: location.lat - 0.02, lng: location.lng - 0.015 }
    }
  ];

  return baseDeals.map(deal => ({
    ...deal,
    distance: calculateDistance(location.lat, location.lng, deal.location.lat, deal.location.lng)
  }));
}

export function solveShoppingStrategy(items: string[], deals: Deal[], userLoc: { lat: number, lng: number }): LocalStrategy[] {
  // Option A: Single Store (Minimum total distance)
  const stores = Array.from(new Set(deals.map(d => d.storeName)));
  const singleStoreOptions = stores.map(storeName => {
    const storeDeals = deals.filter(d => d.storeName === storeName);
    const total = 42.50; // Mock calculation
    const distance = calculateDistance(userLoc.lat, userLoc.lng, storeDeals[0].location.lat, storeDeals[0].location.lng);
    return {
      option: `Single Store (${storeName})`,
      stores: [storeName],
      total,
      time: Math.floor(distance * 10) + 15,
      savings: 4.20,
      recommended: false
    };
  });

  // Option B: Two Store (Better savings)
  const twoStore = {
    option: "Two Store (Aldi + Walmart)",
    stores: ["Aldi", "Walmart"],
    total: 36.20,
    time: 55,
    savings: 6.30,
    recommended: true
  };

  // Option C: Three Store (Max savings)
  const threeStore = {
    option: "Three Store Optimization",
    stores: ["Aldi", "Walmart", "Kroger"],
    total: 34.10,
    time: 85,
    savings: 8.40,
    recommended: false
  };

  return [...singleStoreOptions.slice(0, 1), twoStore, threeStore];
}

// AI-powered deal extraction from flyer image or text
export async function extractDealsFromContent(content: string, isImage: boolean = false): Promise<Partial<Deal>[]> {
  const prompt = `Extract grocery deals from this ${isImage ? 'image' : 'text'}. 
    For each deal, find: storeName, itemName, price, originalPrice (if available), and unit (per lb, each, etc.).
    Return a JSON array of deal objects.`;

  try {
    const response = await ai.models.generateContent({
      model: isImage ? MODELS.vision : MODELS.text,
      contents: isImage 
        ? [{ inlineData: { data: content, mimeType: "image/jpeg" } }, { text: prompt }]
        : prompt + "\n\nContent:\n" + content,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              storeName: { type: Type.STRING },
              itemName: { type: Type.STRING },
              price: { type: Type.NUMBER },
              originalPrice: { type: Type.NUMBER },
              unit: { type: Type.STRING }
            }
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Deal extraction failed", error);
    return [];
  }
}
