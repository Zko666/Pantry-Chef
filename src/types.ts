export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  onboarded: boolean;
  preferences: {
    dietary: string[];
    allergies: string[];
    householdSize: number;
    budget: 'frugal' | 'moderate' | 'premium';
    cuisines: string[];
    skillLevel: 'Beginner' | 'Home Cook' | 'Chef';
  };
  flavorVector?: {
    spicy: number;
    sweet: number;
    savory: number;
    fresh: number;
    rich: number;
    acidic: number;
  };
  techniqueMastery?: Record<string, number>; // techniqueId -> count
  location?: {
    lat: number;
    lng: number;
  };
}

export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: 'Produce' | 'Dairy' | 'Proteins' | 'Pantry Staples' | 'Spices' | 'Frozen' | string;
  expiryDate?: any; // Firestore Timestamp
  addedAt: any;
  status: 'fresh' | 'expiring' | 'expired';
  pricePerUnit?: number;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: {
    name: string;
    quantity: string;
    isMissing?: boolean;
    substitution?: string;
  }[];
  steps: string[];
  prepTime: number;
  cookTime: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  cuisine: string;
  nutrients: {
    calories: number;
    protein: string;
    carbs: string;
    fat: string;
  };
  imageUrl: string;
  tags: string[];
  techniqueTags?: string[];
  flavorProfile?: {
    spicy: number;
    sweet: number;
    savory: number;
    fresh: number;
    rich: number;
    acidic: number;
  };
  wasteReductionScore?: number;
}

export interface Deal {
  id: string;
  storeName: string;
  itemName: string;
  price: number;
  originalPrice: number;
  unit?: string;
  distance?: number;
  expiryDate: any;
  location: {
    lat: number;
    lng: number;
  };
}
