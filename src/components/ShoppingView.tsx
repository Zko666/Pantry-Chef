import React, { useState, useEffect, useMemo } from 'react';
import { MOCK_DEALS } from '../data/mockData';
import { MapPin, TrendingDown, Store, ArrowRight, Tag, ShoppingCart, Percent, Loader2, Sparkles, Clock, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { fetchLocalDeals, solveShoppingStrategy, LocalStrategy } from '../services/groceryService';
import { geocodeAddress } from '../services/aiService';
import { Deal } from '../types';
import { cn } from '../lib/utils';

export default function ShoppingView() {
  const { profile, detectLocation, updateProfile } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loadingDeals, setLoadingDeals] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [strategies, setStrategies] = useState<LocalStrategy[]>([]);
  const [manualLocation, setManualLocation] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [showLocationInput, setShowLocationInput] = useState(false);

  const handleFetchDeals = async () => {
    if (!profile?.location) {
      await detectLocation();
    }
    setLoadingDeals(true);
    try {
      const loc = profile?.location || { lat: 37.7749, lng: -122.4194 };
      const fetched = await fetchLocalDeals(loc);
      setDeals(fetched);
      
      const solved = solveShoppingStrategy([], fetched, loc);
      setStrategies(solved);
    } finally {
      setLoadingDeals(false);
    }
  };

  const handleManualLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualLocation.trim()) return;
    
    setIsGeocoding(true);
    const coords = await geocodeAddress(manualLocation);
    if (coords) {
      await updateProfile({ location: coords });
      setShowLocationInput(false);
      setManualLocation('');
    } else {
      alert("Could not find that location. Please try entering a city or zip code.");
    }
    setIsGeocoding(false);
  };

  useEffect(() => {
    if (profile?.location) {
      handleFetchDeals();
    }
  }, [profile?.location]);

  const displayDeals = deals.length > 0 ? deals : MOCK_DEALS;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-5xl font-serif mb-2">Smart Shop</h1>
          <div className="flex items-center gap-2 text-gray-500 font-medium tracking-tight uppercase text-xs opacity-60">
            Local deals & price intelligence
            {profile?.location && ` • Nearby ${profile.location.lat.toFixed(2)}, ${profile.location.lng.toFixed(2)}`}
            <button 
              onClick={() => setShowLocationInput(!showLocationInput)}
              className="ml-1 p-1 hover:bg-black/5 rounded-md transition-colors"
              title="Manual Location"
            >
              <Navigation className="w-3 h-3 hover:text-primary transition-colors" />
            </button>
          </div>
          <AnimatePresence>
            {showLocationInput && (
              <motion.form 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleManualLocationSubmit}
                className="mt-3 flex items-center gap-2"
              >
                <input 
                  type="text"
                  value={manualLocation}
                  onChange={(e) => setManualLocation(e.target.value)}
                  placeholder="Enter City, State or Zip..."
                  className="px-4 py-2 bg-secondary border border-black/5 rounded-xl text-xs w-64 focus:outline-none focus:border-primary/40 focus:bg-white transition-all shadow-sm"
                  disabled={isGeocoding}
                />
                <button 
                  type="submit"
                  disabled={isGeocoding || !manualLocation}
                  className="px-4 py-2 bg-[#1a1a1a] text-white text-[10px] font-bold uppercase tracking-widest rounded-xl disabled:opacity-50"
                >
                  {isGeocoding ? 'Finding...' : 'Set'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
        
        <div className="flex gap-2">
          {!profile?.location && (
            <button 
              onClick={detectLocation}
              className="px-6 py-2 rounded-full bg-white border border-black/5 text-sm font-medium hover:bg-gray-50"
            >
              Set Location
            </button>
          )}
          <button 
            onClick={handleFetchDeals}
            disabled={loadingDeals}
            className="flex items-center gap-2 px-6 py-2 rounded-full bg-[#1a1a1a] text-white text-sm font-medium disabled:opacity-50 transition-all active:scale-95"
          >
            {loadingDeals ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Scan Local Deals
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Shopping List Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="organic-card relative">
            <AnimatePresence>
              {comparing && (
                <motion.div 
                  initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                  animate={{ opacity: 1, backdropFilter: 'blur(4px)' }}
                  exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                  className="absolute inset-0 z-20 bg-white/60 flex items-center justify-center rounded-[32px]"
                >
                  <div className="bg-white p-6 rounded-[32px] shadow-2xl border border-black/5 w-[90%] max-w-lg text-center overflow-auto max-h-[80%]">
                    <div className="flex items-center justify-center gap-2 mb-2">
                       <Navigation className="w-6 h-6 text-primary" />
                       <h3 className="text-2xl font-serif">Optimal Strategy Solver</h3>
                    </div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-6">Multi-Store Minimum Cost Logic</p>
                    
                    <div className="space-y-4 text-sm text-left">
                      {strategies.map((strat, i) => (
                        <div key={i} className={cn(
                          "p-4 rounded-3xl border transition-all",
                          strat.recommended ? "bg-primary text-white border-primary shadow-xl shadow-primary/20" : "bg-white border-black/5 hover:bg-gray-50"
                        )}>
                          <div className="flex justify-between items-start mb-2">
                             <div className="flex items-center gap-2">
                               {strat.recommended && <Sparkles className="w-4 h-4" />}
                               <span className="font-bold text-lg">{strat.option}</span>
                             </div>
                             <span className={cn("font-bold text-lg", strat.recommended ? "text-white" : "text-green-600")}>
                               ${strat.total.toFixed(2)}
                             </span>
                          </div>
                          
                          <div className={cn("flex flex-wrap gap-2 mb-3", strat.recommended ? "text-white/70" : "text-gray-400")}>
                             {strat.stores.map(s => (
                               <span key={s} className="px-2 py-0.5 rounded-md bg-black/5 text-[10px] font-bold uppercase">{s}</span>
                             ))}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-white/10">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                <span className="text-xs font-bold">{strat.time} min</span>
                              </div>
                              <div className="flex items-center gap-1 font-bold text-xs">
                                <TrendingDown className="w-3.5 h-3.5" />
                                <span>Save ${strat.savings.toFixed(2)}</span>
                              </div>
                            </div>
                            {strat.recommended && <div className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2 py-1 rounded">Best Ratio</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => setComparing(false)}
                      className="mt-6 w-full py-4 rounded-2xl bg-[#1a1a1a] text-white font-bold text-sm"
                    >
                      Dismiss Solver
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-serif">Your Grocery List</h2>
              <button 
                onClick={() => setComparing(true)}
                className="text-primary text-sm font-bold flex items-center gap-1 group"
              >
                <TrendingDown className="w-4 h-4 transition-transform group-hover:-translate-y-1" />
                Find Lowest Prices
              </button>
            </div>
            
            <div className="space-y-4">
              {[
                { name: 'Chicken Breast', qty: '2 lbs', category: 'Meats', price: '$7.98', deal: 'Save $2.00 at Safeway' },
                { name: 'Organic Raspberries', qty: '2 packs', category: 'Produce', price: '$6.00', deal: 'Whole Foods deal matches' },
                { name: 'Avocados', qty: '2 each', category: 'Produce', price: '$1.98', deal: 'Trader Joe\'s flash sale' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-black/5 group">
                  <div className="w-6 h-6 rounded-md border-2 border-primary/20 flex items-center justify-center cursor-pointer group-hover:border-primary transition-colors">
                    <div className="w-3 h-3 bg-primary rounded-sm opacity-0 group-hover:opacity-10 transition-opacity" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-sm font-bold text-gray-900">{item.price}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400 capitalize">{item.qty} • {item.category}</span>
                      {item.deal && (
                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded uppercase tracking-tighter">
                          {item.deal}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="organic-card bg-[#1a1a1a] text-white overflow-hidden relative group">
            <motion.div 
              className="absolute -right-20 -bottom-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ duration: 5, repeat: Infinity }}
            />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-serif mb-1">Weekly Savings Dashboard</h3>
                  <p className="text-white/40 text-sm">Optimization based on local store intelligence</p>
                </div>
                <div className="p-3 rounded-2xl bg-white/10">
                  <Percent className="w-6 h-6" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-3xl font-serif mb-1">$24.50</div>
                  <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Total Saved</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="text-3xl font-serif mb-1">12%</div>
                  <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Efficiency</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Deals Selection */}
        <div className="space-y-6">
          <h2 className="text-2xl font-serif flex items-center gap-2">
            <Tag className="w-6 h-6 text-primary" />
            Local Deals
          </h2>
          <div className="space-y-4">
            {displayDeals.map(deal => (
              <motion.div 
                key={deal.id}
                layoutId={deal.id}
                whileHover={{ x: 4 }}
                className="organic-card bg-white p-5 border-l-4 border-l-primary flex gap-4"
              >
                <div className="p-3 rounded-2xl bg-primary/5 h-fit text-primary">
                  <Store className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-sm leading-tight">{deal.itemName}</h4>
                    <span className="text-green-600 font-bold">${deal.price.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-3">{deal.storeName} • Ends {deal.expiryDate instanceof Date ? format(deal.expiryDate, 'MMM d') : format(new Date(deal.expiryDate), 'MMM d')}</p>
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-1 text-[10px] text-gray-500">
                      <MapPin className="w-3 h-3" />
                      {deal.distance ? `${deal.distance} miles away` : 'Calculating...'}
                    </div>
                    <button className="text-xs font-bold text-primary flex items-center gap-1 group">
                      Add to List
                      <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <button className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 font-medium hover:border-primary/40 hover:text-primary transition-all">
            See All Local Flyers
          </button>
        </div>
      </div>
    </div>
  );
}
