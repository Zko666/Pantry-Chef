import React from 'react';
import { Recipe } from '../types';
import { Clock, ChefHat, Flame, ArrowRight, Heart, TrendingDown } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface RecipeCardProps {
  recipe: Recipe;
  missingCount?: number;
  onClick: () => void;
}

export default function RecipeCard({ recipe, missingCount = 0, onClick }: RecipeCardProps) {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="organic-card overflow-hidden group cursor-pointer flex flex-col h-full active:scale-[0.98] transition-transform"
      onClick={onClick}
    >
      <div className="relative aspect-[4/3] overflow-hidden -mx-6 -mt-6 mb-6">
        <img 
          src={recipe.imageUrl} 
          alt={recipe.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
          <div className="flex gap-2 mb-2">
            {(recipe.tags || []).slice(0, 2).map(tag => (
              <span key={tag} className="px-2 py-1 bg-white/20 backdrop-blur-md rounded-md text-[10px] text-white font-medium uppercase tracking-wider">
                {tag}
              </span>
            ))}
          </div>
          {recipe.wasteReductionScore && recipe.wasteReductionScore > 7 && (
            <div className="flex items-center gap-1.5 bg-green-500/90 backdrop-blur-md text-white text-[10px] font-bold uppercase py-1 px-2.5 rounded-full w-fit">
              <TrendingDown className="w-3 h-3" />
              Waste Hero: Save ${((recipe.wasteReductionScore/10) * 8.5).toFixed(2)}
            </div>
          )}
        </div>
        <button className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-red-500 transition-all">
          <Heart className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-2xl font-serif leading-tight">{recipe.title}</h3>
          {missingCount > 0 && (
            <span className="shrink-0 ml-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-bold uppercase tracking-wider border border-amber-100">
              {missingCount} Missing
            </span>
          )}
          {missingCount === 0 && (
            <span className="shrink-0 ml-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-wider border border-green-100">
              Ready to Cook
            </span>
          )}
        </div>

        <p className="text-gray-500 text-sm line-clamp-2 mb-6 flex-1">
          {recipe.description}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-black/5">
          <div className="flex items-center gap-4 text-xs font-medium text-gray-400">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {recipe.prepTime + recipe.cookTime}m
            </div>
            <div className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" />
              {recipe.nutrients?.calories || 0} kcal
            </div>
            <div className="flex items-center gap-1">
              <ChefHat className="w-3.5 h-3.5" />
              {recipe.difficulty}
            </div>
          </div>
          
          <div className="p-2 rounded-full bg-primary/5 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
