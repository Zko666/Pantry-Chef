import { Recipe, Deal } from '../types';

export const MOCK_RECIPES: Recipe[] = [
  {
    id: '1',
    title: 'Herb-Roasted Lemon Chicken',
    description: 'A classic, juicy chicken dish infused with fresh rosemary and bright lemon.',
    ingredients: [
      { name: 'Chicken Breast', quantity: '2 lbs' },
      { name: 'Lemon', quantity: '2 large' },
      { name: 'Fresh Rosemary', quantity: '3 sprigs' },
      { name: 'Garlic', quantity: '4 cloves' },
      { name: 'Olive Oil', quantity: '3 tbsp' }
    ],
    steps: [
      'Preheat oven to 400°F (200°C).',
      'Pat chicken dry and season with salt and pepper.',
      'Mince garlic and rosemary, mix with olive oil and lemon juice.',
      'Rub mixture under the skin and over the chicken.',
      'Roast for 25-30 minutes until internal temperature reaches 165°F.'
    ],
    prepTime: 15,
    cookTime: 30,
    difficulty: 'Easy',
    cuisine: 'Mediterranean',
    nutrients: { calories: 350, protein: '42g', carbs: '5g', fat: '18g' },
    imageUrl: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?q=80&w=800&auto=format&fit=crop',
    tags: ['High Protein', 'Keto-Friendly', 'One-Pan']
  },
  {
    id: '2',
    title: 'Garlic Butter Broccoli Pasta',
    description: 'Quick, comforting, and perfect for a weeknight dinner using pantry staples.',
    ingredients: [
      { name: 'Pasta', quantity: '12 oz' },
      { name: 'Broccoli Florets', quantity: '3 cups' },
      { name: 'Butter', quantity: '4 tbsp' },
      { name: 'Parmesan Cheese', quantity: '1/2 cup' },
      { name: 'Red Pepper Flakes', quantity: '1 tsp' }
    ],
    steps: [
      'Boil pasta in salted water according to package directions.',
      'Add broccoli to the pasta water during the last 3 minutes of cooking.',
      'Drain, reserving 1/2 cup of pasta water.',
      'In the same pot, melt butter and sauté garlic and red pepper flakes.',
      'Toss pasta and broccoli back in, add parmesan and reserved water until creamy.'
    ],
    prepTime: 5,
    cookTime: 12,
    difficulty: 'Easy',
    cuisine: 'Italian',
    nutrients: { calories: 480, protein: '15g', carbs: '65g', fat: '22g' },
    imageUrl: 'https://images.unsplash.com/photo-1473093226795-af9932fe5856?q=80&w=800&auto=format&fit=crop',
    tags: ['Vegetarian', 'Under 20 Min', 'Family Favorite']
  }
];

export const MOCK_DEALS: Deal[] = [
  {
    id: 'd1',
    storeName: 'FreshMarket',
    itemName: 'Chicken Breast (per lb)',
    price: 3.99,
    originalPrice: 5.99,
    expiryDate: new Date(Date.now() + 86400000 * 3),
    location: { lat: 40.7128, lng: -74.0060 }
  },
  {
    id: 'd2',
    storeName: 'BioGrocer',
    itemName: 'Organic Lemons (3 pack)',
    price: 1.50,
    originalPrice: 2.25,
    expiryDate: new Date(Date.now() + 86400000 * 2),
    location: { lat: 40.7138, lng: -74.0070 }
  }
];
