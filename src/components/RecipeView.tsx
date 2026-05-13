import React, { useState, useEffect, useMemo } from 'react';
import { MOCK_RECIPES } from '../data/mockData';
import { Recipe, PantryItem } from '../types';
import RecipeCard from './RecipeCard';
import { Search, SlidersHorizontal, Sparkles, X, ChevronLeft, ChevronRight, CheckCircle2, Play, Wand2, ChefHat, Info, HelpCircle, ArrowRightLeft, AlertCircle, Loader2 } from 'lucide-react';
import { matchRecipesWithPantry, generateCustomRecipe, suggestSubstitutions, updateUserFlavorVector } from '../services/aiService';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function RecipeView() {
  const { user, profile } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>(MOCK_RECIPES);
  const [pantry, setPantry] = useState<PantryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [criteria, setCriteria] = useState({
    cuisine: '',
    dietary: '',
    usePantry: true
  });
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isCooking, setIsCooking] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [subs, setSubs] = useState<Record<string, { substitution: string, confidence: number, rationale: string }>>({});
  const [isSubLoading, setIsSubLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'pantry'));
    return onSnapshot(q, (snapshot) => {
      setPantry(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PantryItem[]);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}/pantry`);
    });
  }, [user]);

  const handleAiMatch = async () => {
    setIsAiLoading(true);
    const result = await matchRecipesWithPantry(pantry, profile?.preferences);
    const formatted: Recipe[] = result.map((r: any, idx: number) => ({
      id: `ai-${idx}-${Date.now()}`,
      ...r,
      tags: ['AI Suggested', r.cuisine, r.difficulty]
    }));
    setRecipes([...formatted, ...recipes]);
    setIsAiLoading(false);
  };

  const handleGenerateRecipe = async () => {
    setIsGenerating(true);
    try {
      const newRecipe = await generateCustomRecipe({
        ...criteria,
        pantry
      });
      setRecipes([newRecipe, ...recipes]);
      setSelectedRecipe(newRecipe);
      setShowGenerator(false);
    } catch (err) {
      console.error("Failed to generate recipe", err);
      alert("AI was unable to dream up a recipe this time. Please try different criteria.");
    } finally {
      setIsGenerating(false);
    }
  };

  const calculateMissing = (recipe: Recipe) => {
    if (!recipe.ingredients) return 0;
    return recipe.ingredients.filter(ri => 
      !pantry.some(pi => pi.name.toLowerCase().includes(ri.name.toLowerCase()))
    ).length;
  };

  const calculateFlavorScore = (recipe: Recipe) => {
    if (!profile?.flavorVector || !recipe.flavorProfile) return 0;
    const keys = ['spicy', 'sweet', 'savory', 'fresh', 'rich', 'acidic'] as const;
    let similarity = 0;
    keys.forEach(key => {
      const uVal = profile.flavorVector![key] || 0.5;
      const rVal = recipe.flavorProfile![key] || 0.5;
      // Cosine similarity or Manhattan distance... let's do simple inverse distance
      similarity += 1 - Math.abs(uVal - rVal);
    });
    return similarity / keys.length;
  };

  const filteredRecipes = useMemo(() => {
    return recipes.filter(r => 
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.cuisine.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
      // UserFlavorScore Logic from PDF
      const aMissing = calculateMissing(a);
      const bMissing = calculateMissing(b);
      
      if (aMissing !== bMissing) return aMissing - bMissing;
      
      const aFlavor = calculateFlavorScore(a);
      const bFlavor = calculateFlavorScore(b);
      return bFlavor - aFlavor;
    });
  }, [recipes, searchTerm, pantry, profile]);

  const loadSubstitutions = async (recipe: Recipe) => {
    const missing = recipe.ingredients
      .filter(i => !pantry.some(p => p.name.toLowerCase().includes(i.name.toLowerCase())))
      .map(i => i.name);
    
    if (missing.length === 0) return;
    
    setIsSubLoading(true);
    const suggestedSubs = await suggestSubstitutions(missing, pantry, profile?.preferences?.dietary || []);
    setSubs(suggestedSubs);
    setIsSubLoading(false);
  };

  useEffect(() => {
    if (selectedRecipe && !isCooking) {
      loadSubstitutions(selectedRecipe);
    } else {
      setSubs({});
    }
  }, [selectedRecipe, isCooking]);

  const handleFinishCooking = async () => {
    if (!user || !selectedRecipe) return;
    
    // Update Flavor Vector
    const newVector = updateUserFlavorVector(profile?.flavorVector, selectedRecipe.flavorProfile, 0.05);
    
    // Update Technique Mastery
    const newMastery = { ...(profile?.techniqueMastery || {}) };
    selectedRecipe.techniqueTags?.forEach(tag => {
      newMastery[tag] = (newMastery[tag] || 0) + 1;
    });

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        flavorVector: newVector,
        techniqueMastery: newMastery
      });
      closeModal();
    } catch (err) {
      console.error("Failed to update user profile", err);
      closeModal();
    }
  };

  const closeModal = () => {
    setSelectedRecipe(null);
    setIsCooking(false);
    setCurrentStep(0);
    setSubs({});
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-5xl font-serif mb-2">Recipe Hub</h1>
          <p className="text-gray-500 font-medium tracking-tight uppercase text-xs opacity-60">
            AI-matched dishes from your kitchen
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="group relative">
            <button 
              onClick={handleAiMatch}
              disabled={isAiLoading || pantry.length === 0}
              className="flex items-center gap-2 border-2 border-primary/20 bg-white pill-button disabled:opacity-50 hover:bg-primary/5 transition-colors"
            >
              {isAiLoading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                  <Sparkles className="w-5 h-5 text-primary" />
                </motion.div>
              ) : <Sparkles className="w-5 h-5 text-primary" />}
              Pantry Auto-Match
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 p-2 bg-black text-white text-[10px] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
              Analyzes your pantry to find 5 recipes you can make right now.
            </div>
          </div>

          <button 
            onClick={() => setShowGenerator(!showGenerator)}
            className="flex items-center gap-2 bg-[#1a1a1a] text-white pill-button shadow-lg shadow-black/10 hover:bg-black transition-colors"
          >
            <Wand2 className="w-5 h-5 text-primary" />
            Dream up a Recipe
          </button>
        </div>
      </header>

      {/* ... (rest of the UI remains mostly same, just updating Modal content) ... */}
      
      {/* AI Generator Panel */}
      <AnimatePresence>
        {showGenerator && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="organic-card border-2 border-primary bg-primary/5 shadow-xl shadow-primary/5">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary text-white rounded-2xl">
                    <Wand2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-serif">Recipe Creator</h2>
                    <p className="text-xs text-primary font-bold uppercase tracking-widest">Powered by Gemini AI</p>
                  </div>
                </div>
                <button onClick={() => setShowGenerator(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block ml-2">Cuisine Style</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Italian, Thai, Fusion..." 
                    className="w-full p-4 rounded-2xl border border-black/5 bg-white focus:ring-2 ring-primary/20 outline-none transition-all"
                    value={criteria.cuisine}
                    onChange={(e) => setCriteria({ ...criteria, cuisine: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block ml-2">Dietary Preferences</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Vegan, Gluten-free..." 
                    className="w-full p-4 rounded-2xl border border-black/5 bg-white focus:ring-2 ring-primary/20 outline-none transition-all"
                    value={criteria.dietary}
                    onChange={(e) => setCriteria({ ...criteria, dietary: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-black/5 mt-auto">
                  <div className="flex-1">
                    <h4 className="text-sm font-bold">Use my Pantry</h4>
                    <p className="text-[10px] text-gray-400">Prioritize what you have</p>
                  </div>
                  <button 
                    onClick={() => setCriteria({ ...criteria, usePantry: !criteria.usePantry })}
                    className={cn(
                      "w-12 h-6 rounded-full relative transition-colors duration-300",
                      criteria.usePantry ? "bg-primary" : "bg-gray-200"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300",
                      criteria.usePantry ? "left-7" : "left-1"
                    )} />
                  </button>
                </div>
              </div>

              <button 
                onClick={handleGenerateRecipe}
                disabled={isGenerating}
                className="w-full bg-primary text-white py-5 rounded-[32px] font-bold shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
              >
                {isGenerating ? (
                   <>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                      <ChefHat className="w-6 h-6" />
                    </motion.div>
                    <span>Cooking up a masterpiece...</span>
                   </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    <span>Generate Unique Recipe</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search cuisines, ingredients or dishes..." 
            className="w-full pl-12 pr-4 py-4 bg-white rounded-3xl border border-black/5 shadow-sm focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="bg-white p-4 rounded-3xl border border-black/5 shadow-sm hover:bg-gray-50 transition-colors">
          <SlidersHorizontal className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredRecipes.map((recipe) => (
            <RecipeCard 
              key={recipe.id} 
              recipe={recipe} 
              missingCount={calculateMissing(recipe)}
              onClick={() => setSelectedRecipe(recipe)}
            />
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedRecipe && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              layoutId={selectedRecipe.id}
              className="relative w-full max-w-2xl bg-white rounded-[40px] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
            >
              <button 
                onClick={closeModal}
                className="absolute top-6 right-6 z-10 p-2 bg-black/10 backdrop-blur-md rounded-full text-white hover:bg-black/20"
              >
                <X className="w-5 h-5" />
              </button>

              {!isCooking ? (
                <>
                  <div className="aspect-video w-full overflow-hidden">
                    <img src={selectedRecipe.imageUrl} className="w-full h-full object-cover" alt="" />
                  </div>

                  <div className="p-8 overflow-y-auto flex-1 space-y-8">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2 mb-2">
                           {selectedRecipe.techniqueTags?.map(tag => (
                             <span key={tag} className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] uppercase font-bold rounded-md">
                               {tag.replace('_', ' ')}
                             </span>
                           ))}
                        </div>
                        <h2 className="text-4xl font-serif mb-4">{selectedRecipe.title}</h2>
                        <p className="text-gray-500 leading-relaxed">{selectedRecipe.description}</p>
                      </div>
                      
                      {selectedRecipe.nutrients && (
                        <div className="flex gap-4 p-4 bg-secondary rounded-3xl border border-black/5">
                           {/* ... (nutrients UI) ... */}
                           <div className="text-center min-w-[60px]">
                            <div className="text-xs font-bold text-gray-400 uppercase mb-1">Cals</div>
                            <div className="font-serif text-primary text-lg">{selectedRecipe.nutrients.calories}</div>
                          </div>
                          <div className="w-px bg-black/5" />
                          <div className="text-center min-w-[60px]">
                            <div className="text-xs font-bold text-gray-400 uppercase mb-1">Prot</div>
                            <div className="font-serif text-primary text-lg">{selectedRecipe.nutrients.protein}</div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                        Ingredients 
                        {isSubLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                      </h3>
                      <div className="grid grid-cols-1 gap-3">
                        {(selectedRecipe.ingredients || []).map((ing, i) => {
                          const isMissing = !pantry.some(p => p.name.toLowerCase().includes(ing.name.toLowerCase()));
                          const sub = subs[ing.name];
                          
                          return (
                            <div key={i} className="group">
                              <div className="flex items-center justify-between text-sm py-1">
                                <div className="flex items-center gap-2">
                                  <span className={cn(isMissing ? "text-amber-600 font-bold" : "text-gray-700")}>
                                    {ing.name}
                                  </span>
                                  {isMissing && <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
                                </div>
                                <span className="text-gray-400">{ing.quantity}</span>
                              </div>
                              {isMissing && sub && (
                                <motion.div 
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  className="mt-2 bg-amber-50 border border-amber-200 p-3 rounded-2xl"
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-1.5 text-amber-700 font-bold text-xs uppercase">
                                       <ArrowRightLeft className="w-3 h-3" />
                                       AI Substitution ({sub.confidence}%)
                                    </div>
                                    <button className="text-[10px] font-bold text-primary hover:underline">Apply</button>
                                  </div>
                                  <p className="text-[11px] text-amber-800/70 italic leading-tight">
                                    "Use {sub.substitution}. {sub.rationale}"
                                  </p>
                                </motion.div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Instructions</h3>
                      <ol className="space-y-4">
                        {(selectedRecipe.steps || []).map((step, i) => (
                          <li key={i} className="flex gap-4 text-sm">
                            <span className="font-serif italic text-primary text-xl opacity-30 mt-[-4px]">{i+1}</span>
                            <span className="text-gray-600 leading-relaxed">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  <div className="p-8 border-t border-black/5 bg-gray-50 flex gap-4">
                    <button 
                      onClick={() => setIsCooking(true)}
                      className="flex-1 bg-primary text-white py-4 rounded-full font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group"
                    >
                      <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      Start Cooking
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-8 flex-1 flex flex-col h-full bg-secondary/30">
                  {/* ... Cooking Mode UI ... */}
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Recipe Progress</h3>
                      <div className="flex gap-1">
                        {(selectedRecipe.steps || []).map((_, i) => (
                          <div 
                            key={i} 
                            className={cn(
                              "h-1.5 rounded-full transition-all duration-300",
                              i === currentStep ? "w-8 bg-primary" : i < currentStep ? "w-4 bg-primary/40" : "w-4 bg-gray-200"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-serif text-primary">Step {currentStep + 1}</span>
                      <span className="text-gray-400 font-serif"> of {selectedRecipe.steps.length}</span>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-center items-center text-center px-4">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                      >
                        <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                          <span className="text-3xl font-serif text-primary italic">{currentStep + 1}</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-serif leading-tight text-gray-800">
                          {selectedRecipe.steps[currentStep]}
                        </h2>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <div className="mt-12 grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                      disabled={currentStep === 0}
                      className="flex items-center justify-center gap-2 py-5 rounded-[32px] border-2 border-black/5 font-bold hover:bg-white disabled:opacity-30 transition-all font-serif italic"
                    >
                      <ChevronLeft className="w-5 h-5" />
                      Back
                    </button>
                    
                    {currentStep === selectedRecipe.steps.length - 1 ? (
                      <button 
                        onClick={handleFinishCooking}
                        className="flex items-center justify-center gap-2 py-5 rounded-[32px] bg-primary text-white font-bold shadow-xl shadow-primary/20 transition-transform active:scale-95"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        Finish Meal
                      </button>
                    ) : (
                      <button 
                        onClick={() => setCurrentStep(currentStep + 1)}
                        className="flex items-center justify-center gap-2 py-5 rounded-[32px] bg-[#1a1a1a] text-white font-bold shadow-xl shadow-black/10 transition-transform active:scale-95"
                      >
                        Next Step
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
