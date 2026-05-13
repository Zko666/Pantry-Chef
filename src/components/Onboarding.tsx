import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile } from '../types';
import { ChefHat, Heart, Scale, Wallet, MapPin, Check, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Onboarding() {
  const { profile, updateProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [prefs, setPrefs] = useState<UserProfile['preferences']>(profile?.preferences || {
    dietary: [],
    allergies: [],
    householdSize: 2,
    budget: 'moderate',
    cuisines: [],
    skillLevel: 'Home Cook'
  });

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => s - 1);

  const save = async () => {
    await updateProfile({
      preferences: prefs,
      onboarded: true
    });
  };

  const toggle = (list: string[], item: string) => 
    list.includes(item) ? list.filter(i => i !== item) : [...list, item];

  return (
    <div className="max-w-xl mx-auto min-h-[70vh] flex flex-col justify-center">
      <div className="mb-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
          <ChefHat className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-serif mb-2">Welcome to PantryChef</h1>
        <p className="text-gray-500">Let's personalize your kitchen experience.</p>
      </div>

      <div className="organic-card min-h-[400px] flex flex-col">
        <div className="flex-1">
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-2xl mb-6">Any dietary preferences?</h2>
              <div className="grid grid-cols-2 gap-3">
                {['Vegetarian', 'Vegan', 'Keto', 'Gluten-Free', 'Halal', 'Kosher'].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setPrefs(p => ({ ...p, dietary: toggle(p.dietary, opt) }))}
                    className={cn(
                      "p-4 rounded-2xl border text-left transition-all",
                      prefs.dietary.includes(opt) ? "border-primary bg-primary/5 text-primary" : "border-gray-100 hover:border-gray-200"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-2xl mb-6">Choose your budget style</h2>
              <div className="space-y-3">
                {[
                  { id: 'frugal', label: 'Frugal', desc: 'Saving is my top priority', icon: Wallet },
                  { id: 'moderate', label: 'Moderate', desc: 'Balance of quality and price', icon: Scale },
                  { id: 'premium', label: 'Premium', desc: 'Organic and specialty ingredients', icon: Sparkles }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setPrefs(p => ({ ...p, budget: opt.id as any }))}
                    className={cn(
                      "w-full p-6 rounded-2xl border text-left transition-all flex items-center justify-between group",
                      prefs.budget === opt.id ? "border-primary bg-primary/5 text-primary" : "border-gray-100 hover:border-gray-200"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-3 rounded-xl transition-colors",
                        prefs.budget === opt.id ? "bg-primary/10" : "bg-gray-50 group-hover:bg-gray-100"
                      )}>
                        <opt.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-bold">{opt.label}</div>
                        <div className="text-sm opacity-60 font-medium">{opt.desc}</div>
                      </div>
                    </div>
                    {prefs.budget === opt.id ? (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border border-gray-200" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-2xl mb-6">Household size</h2>
              <div className="flex items-center justify-center gap-8 py-12">
                <button 
                  onClick={() => setPrefs(p => ({ ...p, householdSize: Math.max(1, p.householdSize - 1) }))}
                  className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-2xl"
                >-</button>
                <div className="text-6xl font-serif">{prefs.householdSize}</div>
                <button 
                  onClick={() => setPrefs(p => ({ ...p, householdSize: p.householdSize + 1 }))}
                  className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-2xl"
                >+</button>
              </div>
              <p className="text-center text-gray-500">How many people are you cooking for?</p>
            </motion.div>
          )}
        </div>

        <div className="pt-8 flex justify-between items-center">
          {step > 1 ? (
            <button onClick={back} className="text-gray-500 hover:text-gray-900 font-medium">Back</button>
          ) : <div />}
          
          {step < 3 ? (
            <button onClick={next} className="bg-primary text-white pill-button">Continue</button>
          ) : (
            <button onClick={save} className="bg-primary text-white pill-button">Complete Setup</button>
          )}
        </div>
      </div>

      <div className="mt-8 flex justify-center gap-2">
        {[1, 2, 3].map(i => (
          <div key={i} className={cn("w-2 h-2 rounded-full transition-all", step === i ? "bg-primary w-4" : "bg-gray-200")} />
        ))}
      </div>
    </div>
  );
}
