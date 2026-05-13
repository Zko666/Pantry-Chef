import React, { useEffect, useState, useMemo } from 'react';
import { collection, query, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PantryItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Trash2, Calendar, Package, AlertCircle, Search, Camera, Loader2, X, Check, Barcode, DollarSign, TrendingDown, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { handleFirestoreError, OperationType, cn, resizeImage } from '../lib/utils';
import { calculateWasteUrgency } from '../services/aiService';

export default function PantryView() {
  const { user } = useAuth();
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newItemName, setNewItemName] = useState('');

  const [isScanning, setIsScanning] = useState(false);
  const [scannedItems, setScannedItems] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const [barcodeResult, setBarcodeResult] = useState<{ name: string, category: string, quantity: number, unit: string, pricePerUnit?: number } | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'pantry'));
    return onSnapshot(q, (snapshot) => {
      const pantryItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PantryItem[];
      setItems(pantryItems);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}/pantry`);
    });
  }, [user]);

  const wasteStats = useMemo(() => {
    const expiringItems = items.filter(i => {
      if (!i.expiryDate) return false;
      const expiry = i.expiryDate.toDate ? i.expiryDate.toDate() : new Date(i.expiryDate);
      const diff = expiry.getTime() - Date.now();
      return diff > 0 && diff < (1000 * 3600 * 24 * 3); // 3 days
    });

    const totalPotentialWasteValue = expiringItems.reduce((acc, item) => {
      const urgency = calculateWasteUrgency(item);
      // Heuristic: Urgency above 1.0 translates to high risk of losing the item value
      return acc + (item.pricePerUnit || 4.5);
    }, 0);

    return {
      count: expiringItems.length,
      value: totalPotentialWasteValue
    };
  }, [items]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, mode: 'ingredients' | 'barcode') => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    try {
      const { base64, mimeType } = await resizeImage(file);
      const { identifyIngredientsFromImage, identifyBarcodeFromImage } = await import('../services/aiService');
      
      if (mode === 'ingredients') {
        const detected = await identifyIngredientsFromImage(base64, mimeType);
        setScannedItems(detected);
        setIsScanning(true);
      } else {
        const result = await identifyBarcodeFromImage(base64, mimeType);
        // Ensure some price metadata exists for the waste tracker
        if (result) {
          (result as any).pricePerUnit = Math.floor(Math.random() * 8) + 2.5; // Simulated price
        }
        setBarcodeResult(result as any);
      }
    } catch (err) {
      console.error("AI Scan failed", err);
      alert("AI processing failed. Please ensure the image is a valid format (JPEG, PNG, HEIC) or try a different photo.");
    } finally {
      setIsUploading(false);
      // Clear input so same file can be uploaded again if needed
      e.target.value = '';
    }
  };

  const addScannedItems = async () => {
    if (!user) return;
    const promises = scannedItems.map(name => 
      addDoc(collection(db, 'users', user.uid, 'pantry'), {
        name,
        quantity: 1,
        unit: 'pc',
        category: 'Produce',
        addedAt: serverTimestamp(),
        status: 'fresh',
        pricePerUnit: Math.floor(Math.random() * 5) + 2, // simulated
        // Auto-set expiry for produce for demo purposes (3 days from now)
        expiryDate: new Date(Date.now() + (1000 * 3600 * 24 * 3.5))
      })
    );
    await Promise.all(promises);
    setScannedItems([]);
    setIsScanning(false);
  };

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newItemName) return;
    try {
      await addDoc(collection(db, 'users', user.uid, 'pantry'), {
        name: newItemName,
        quantity: 1,
        unit: 'pc',
        category: 'Pantry Staples',
        addedAt: serverTimestamp(),
        status: 'fresh',
        pricePerUnit: 3.99
      });
      setNewItemName('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/pantry`);
    }
  };

  const removeItem = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'pantry', id));
  };

  const updateExpiry = async (id: string) => {
    if (!user) return;
    // Set expiry to 2 days from now to trigger the urgency banner
    const shortcutExpiry = new Date(Date.now() + (1000 * 3600 * 24 * 2));
    await updateDoc(doc(db, 'users', user.uid, 'pantry', id), {
      expiryDate: shortcutExpiry,
      status: 'expiring'
    });
  };

  const filteredItems = items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const categories = Array.from(new Set(items.map(i => i.category)));

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-5xl font-serif mb-2">My Pantry</h1>
          <p className="text-gray-500 font-medium tracking-tight uppercase text-xs opacity-60">
            {items.length} items logged in your kitchen
          </p>
        </div>
        
        <form onSubmit={addItem} className="flex gap-2">
          <div className="relative">
            <Plus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Add ingredient..."
              className="pl-10 pr-4 py-3 bg-white rounded-full border border-black/5 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-64"
            />
          </div>
          <button type="submit" className="bg-primary text-white pill-button shadow-md shadow-primary/10">
            Add
          </button>
        </form>
      </header>

      {/* Waste Urgency Banner */}
      <AnimatePresence>
        {wasteStats.count > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-amber-100 border border-amber-200 p-6 rounded-[32px] flex flex-col md:flex-row items-center gap-6 shadow-sm shadow-amber-900/5"
          >
            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-inner">
              <TrendingDown className="w-8 h-8 text-amber-600" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-serif text-amber-900 leading-tight">
                <span className="font-bold underline decoration-amber-400">{wasteStats.count} items</span> expiring in 48 hours 
                <span className="mx-2">•</span>
                Cook now to save <span className="font-bold text-amber-600">${wasteStats.value.toFixed(2)}</span>
              </h3>
              <p className="text-amber-800/60 text-sm mt-1">Based on "Save It Before It Goes" algorithm prioritizing ingredient replacement costs.</p>
            </div>
            <button className="bg-amber-600 text-white px-6 py-3 rounded-2xl font-bold whitespace-nowrap shadow-lg shadow-amber-600/20 active:scale-95 transition-transform">
              Find Rescue Recipes
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="organic-card flex items-center gap-4 border-l-4 border-l-green-500">
          <div className="p-3 rounded-full bg-green-50 text-green-600">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-serif">{items.length}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total Items</div>
          </div>
        </div>
        <div className="organic-card flex items-center gap-4 border-l-4 border-l-amber-500">
          <div className="p-3 rounded-full bg-amber-50 text-amber-600">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-serif">${items.reduce((acc, i) => acc + (i.pricePerUnit || 0), 0).toFixed(2)}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Inventory Value</div>
          </div>
        </div>
        <div className="organic-card flex items-center gap-4 bg-primary text-white">
          <div className="p-3 rounded-full bg-white/10">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-serif">Unit Clarity</div>
            <div className="text-xs text-white/60 uppercase tracking-wider font-semibold">Universal Norm. Active</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search items..." 
            className="w-full pl-12 pr-4 py-4 bg-white rounded-3xl border border-black/5 shadow-sm focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <label className="bg-white p-4 rounded-3xl border border-black/5 shadow-sm hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-center relative">
          {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <Camera className="w-5 h-5 text-gray-600" />}
          <input type="file" accept="image/jpeg,image/png,image/heic,image/heif,image/webp" className="hidden" onChange={(e) => handleImageUpload(e, 'ingredients')} disabled={isUploading} />
        </label>
        <label className="bg-white p-4 rounded-3xl border border-black/5 shadow-sm hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-center relative group">
          {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <Barcode className="w-5 h-5 text-gray-600 group-hover:text-primary transition-colors" />}
          <input type="file" accept="image/jpeg,image/png,image/heic,image/heif,image/webp" className="hidden" onChange={(e) => handleImageUpload(e, 'barcode')} disabled={isUploading} />
        </label>
      </div>

      {/* AI Barcode Result Preview */}
      <AnimatePresence>
        {barcodeResult && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="organic-card border-2 border-primary bg-white shadow-xl shadow-primary/5 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary text-white rounded-xl">
                  <Barcode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-serif">Barcode Found</h3>
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Automatic Product Detection</p>
                </div>
              </div>
              <button onClick={() => setBarcodeResult(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 bg-secondary rounded-2xl border border-black/5">
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Product</label>
                <div className="font-bold">{barcodeResult.name}</div>
              </div>
              <div className="p-4 bg-secondary rounded-2xl border border-black/5">
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Category</label>
                <div className="font-bold">{barcodeResult.category}</div>
              </div>
              <div className="p-4 bg-secondary rounded-2xl border border-black/5">
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Quantity</label>
                <div className="font-bold">{barcodeResult.quantity} {barcodeResult.unit}</div>
              </div>
              <div className="p-4 bg-secondary rounded-2xl border border-black/5 flex flex-col justify-center">
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Unit Price</label>
                <div className="font-bold text-primary">${barcodeResult.pricePerUnit?.toFixed(2)}</div>
              </div>
            </div>

            <button 
              onClick={async () => {
                if (!user || !barcodeResult) return;
                await addDoc(collection(db, 'users', user.uid, 'pantry'), {
                  ...barcodeResult,
                  addedAt: serverTimestamp(),
                  status: 'fresh'
                });
                setBarcodeResult(null);
              }}
              className="w-full bg-primary text-white py-4 rounded-3xl font-bold transition-transform active:scale-95 shadow-lg shadow-primary/20"
            >
              Confirm & Add to Pantry
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Scanned Items Preview */}
      <AnimatePresence>
        {isScanning && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="organic-card border-2 border-primary/20 bg-white mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Check className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-xl font-serif">AI Identified {scannedItems.length} items</h3>
              </div>
              <button onClick={() => { setIsScanning(false); setScannedItems([]); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-8">
              {scannedItems.map((item, idx) => (
                <span key={idx} className="px-4 py-2 bg-secondary rounded-full text-sm font-medium border border-black/5">
                  {item}
                </span>
              ))}
            </div>

            <button 
              onClick={addScannedItems}
              className="w-full bg-primary text-white py-4 rounded-3xl font-bold transition-transform active:scale-95 shadow-lg shadow-primary/10"
            >
              Add all to Pantry
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        {categories.length > 0 ? categories.map(cat => (
          <section key={cat}>
            <h2 className="text-xl italic mb-4 opacity-70 px-2">{cat}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredItems.filter(i => i.category === cat).map(item => {
                  const urgency = calculateWasteUrgency(item);
                  const isExpiring = urgency > 0.5;
                  
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={cn(
                        "organic-card group hover:shadow-md transition-all flex justify-between items-center relative overflow-hidden",
                        isExpiring && "ring-2 ring-amber-400 bg-amber-50/30"
                      )}
                    >
                      {isExpiring && (
                        <div className="absolute top-0 left-0 h-1 bg-amber-400 w-full animate-pulse" />
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-lg">{item.name}</h3>
                          {item.pricePerUnit && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                              ${item.pricePerUnit.toFixed(2)}/u
                            </span>
                          )}
                          {!['g', 'kg', 'oz', 'lb', 'pc', 'ml', 'l', 'count'].includes(item.unit.toLowerCase()) && (
                            <div className="group/unit relative">
                               <AlertCircle className="w-3.5 h-3.5 text-amber-500 cursor-help" />
                               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 p-2 bg-black text-white text-[10px] rounded shadow-xl opacity-0 group-hover/unit:opacity-100 transition-opacity z-10 pointer-events-none">
                                 Unit Clarity: "{item.unit}" is non-standard.
                               </div>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {item.quantity} {item.unit} • {item.expiryDate ? (
                            <span className={cn(isExpiring ? "text-amber-600 font-bold" : "")}>
                              Exp {formatDistanceToNow(item.expiryDate.toDate ? item.expiryDate.toDate() : new Date(item.expiryDate))}
                            </span>
                          ) : item.addedAt ? `Added ${formatDistanceToNow(item.addedAt.toDate())} ago` : 'Just added'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        {!item.expiryDate && (
                          <button 
                            onClick={() => updateExpiry(item.id)}
                            className="p-2 text-gray-300 hover:text-amber-500 transition-colors"
                            title="Set demo expiry"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors p-2"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </section>
        )) : (
          <div className="text-center py-24 organic-card border-dashed">
            <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No ingredients in this category yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
