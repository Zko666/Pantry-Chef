import React from 'react';
import { ChefHat, ArrowRight, Zap, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';

export default function Landing() {
  const { signIn } = useAuth();

  return (
    <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-6 text-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-2xl"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full mb-8">
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-widest">AI-Powered Kitchen Intelligence</span>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-serif mb-8 leading-[0.9] tracking-tight">
          Cook with what you <br /><span className="italic text-primary">actually</span> have.
        </h1>
        
        <p className="text-xl text-gray-500 mb-12 max-w-lg mx-auto leading-relaxed">
          PantryChef identifies your ingredients, suggests recipes, and finds local grocery deals to save you time and money.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={signIn}
            className="w-full sm:w-auto bg-[#1a1a1a] text-white px-8 py-4 rounded-full font-bold flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl shadow-black/10 active:scale-95"
          >
            Get Started for Free
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Zap, label: 'Smart Matching', desc: 'AI analyzes your pantry' },
            { icon: Shield, label: 'No Waste', desc: 'Expiration tracking alerts' },
            { icon: ChefHat, label: 'Chef Modes', desc: 'Step-by-step guidance' }
          ].map((feature, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-black/5">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="font-bold text-sm tracking-tight">{feature.label}</div>
              <div className="text-xs text-gray-400">{feature.desc}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
