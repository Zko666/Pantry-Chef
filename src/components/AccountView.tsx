import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { 
  LogOut, 
  BookOpen, 
  Refrigerator, 
  ChefHat, 
  ShoppingCart, 
  Calendar,
  Sparkles,
  Camera,
  Barcode,
  ArrowRight,
  HelpCircle,
  Trophy,
  Flame,
  Utensils,
  Download,
  Info,
  ShieldCheck
} from 'lucide-react';
import { cn } from '../lib/utils';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer 
} from 'recharts';

export default function AccountView() {
  const { user, profile, logOut } = useAuth();

  const flavorData = [
    { subject: 'Spicy', value: profile?.flavorVector?.spicy || 0.4 },
    { subject: 'Sweet', value: profile?.flavorVector?.sweet || 0.3 },
    { subject: 'Savory', value: profile?.flavorVector?.savory || 0.8 },
    { subject: 'Fresh', value: profile?.flavorVector?.fresh || 0.6 },
    { subject: 'Rich', value: profile?.flavorVector?.rich || 0.5 },
    { subject: 'Acidic', value: profile?.flavorVector?.acidic || 0.2 },
  ];

  const techniques = [
    { id: 'knife_skills', name: 'Knife Skills', level: profile?.techniqueMastery?.knife_skills || 0, icon: Utensils },
    { id: 'heat_control', name: 'Heat Control', level: profile?.techniqueMastery?.heat_control || 0, icon: Flame },
    { id: 'baking_science', name: 'Baking Science', level: profile?.techniqueMastery?.baking_science || 0, icon: ChefHat },
    { id: 'flavor_building', name: 'Flavor Building', level: profile?.techniqueMastery?.flavor_building || 0, icon: Sparkles },
  ];

  const guideSteps = [
    {
      title: "Smart Pantry",
      description: "Keep track of what you have. Add items by taking a photo of your ingredients or scanning barcodes.",
      icon: Refrigerator,
      actions: [
        { label: "AI Scan", icon: Camera },
        { label: "Barcode", icon: Barcode }
      ],
      color: "bg-blue-50 text-blue-600"
    },
    // ... rest of guide steps ...
  ];

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-5xl font-serif mb-2">My Profile</h1>
          <div className="flex items-center gap-3">
            <p className="text-gray-500 font-medium tracking-tight uppercase text-xs opacity-60">
              Flavor intelligence & Technique Mastery
            </p>
            <span className="px-2 py-0.5 rounded bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-wider border border-green-100">
              Free Personal Use
            </span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: User & Flavor */}
        <div className="space-y-8 lg:col-span-1">
          {/* User Profile */}
          <div className="organic-card">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <span className="text-3xl font-serif text-primary">
                  {user?.email?.[0].toUpperCase()}
                </span>
              </div>
              <h2 className="text-2xl font-serif mb-1">{user?.displayName || 'Home Chef'}</h2>
              <p className="text-gray-500 text-sm mb-6">{user?.email}</p>
              
              <div className="flex gap-4 w-full">
                <div className="flex-1 p-3 bg-secondary rounded-2xl">
                  <div className="text-xs font-bold text-gray-400 uppercase mb-1">Rank</div>
                  <div className="font-serif text-primary">Beginner</div>
                </div>
                <div className="flex-1 p-3 bg-secondary rounded-2xl">
                  <div className="text-xs font-bold text-gray-400 uppercase mb-1">XP</div>
                  <div className="font-serif text-primary">1,240</div>
                </div>
              </div>
            </div>
          </div>

          {/* Flavor Profile Chart */}
          <div className="organic-card">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-serif">Flavor Profile</h3>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={flavorData}>
                  <PolarGrid stroke="#f3f4f6" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 600, fill: '#9ca3af' }} />
                  <Radar
                    name="User"
                    dataKey="value"
                    stroke="#1a1a1a"
                    fill="#1a1a1a"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-gray-400 text-center uppercase font-bold tracking-widest mt-4">
              Learned from your cooking behavior
            </p>
          </div>
        </div>

        {/* Right Column: Techniques & Progress */}
        <div className="lg:col-span-2 space-y-8">
          {/* Technique Mastery */}
          <div className="organic-card">
            {/* ... rest of technique mastery remains ... */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-serif">Technique Mastery</h2>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Skill Tree Progression</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-serif">Tier 1</div>
                <div className="text-[10px] font-bold text-primary uppercase">Kitchen Basics</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {techniques.map((tech) => (
                <div key={tech.id} className="p-6 bg-secondary/50 rounded-[32px] border border-black/5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-xl shadow-sm">
                        <tech.icon className="w-5 h-5 text-primary" />
                      </div>
                      <span className="font-bold text-sm tracking-tight">{tech.name}</span>
                    </div>
                    <span className="text-xs font-serif italic text-gray-400">{tech.level}/3 mastered</span>
                  </div>
                  
                  <div className="flex gap-1.5">
                    {[1, 2, 3].map((step) => (
                      <div 
                        key={step}
                        className={cn(
                          "h-2 flex-1 rounded-full",
                          tech.level >= step ? "bg-primary" : "bg-white border border-black/5"
                        )}
                      />
                    ))}
                  </div>
                  {tech.level >= 3 && (
                     <div className="mt-3 text-[10px] font-bold text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Mastered - Tier 2 Unlocked
                     </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Personal Access & Offline Section */}
          <div className="organic-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-black/5 rounded-xl">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-serif">Personal Use Billing</h3>
            </div>
            
            <div className="p-6 bg-white border border-black/5 rounded-[32px] mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="font-bold text-sm">Personal License: Active</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                This application is fully licensed for individual, non-commercial use. No monthly subscription or "smart features" billing is required for your personal home kitchen access.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-secondary/50 rounded-3xl border border-black/5">
                <div className="flex items-center gap-2 mb-2">
                  <Download className="w-4 h-4 text-primary" />
                  <span className="font-bold text-sm">Install App</span>
                </div>
                <p className="text-xs text-gray-500">Add PantryChef to your home screen for faster, native-like access.</p>
              </div>
              <div className="p-5 bg-secondary/50 rounded-3xl border border-black/5">
                <div className="flex items-center gap-2 mb-2">
                  <Refrigerator className="w-4 h-4 text-primary" />
                  <span className="font-bold text-sm">Offline Pantry</span>
                </div>
                <p className="text-xs text-gray-500">Access your basic inventory and shopping lists even without internet.</p>
              </div>
            </div>
          </div>

          {/* Logout Helper */}
          <button 
            onClick={() => logOut()}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-3xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

function CheckCircle2({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
