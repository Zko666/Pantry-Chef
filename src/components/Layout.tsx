import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChefHat, 
  ShoppingCart, 
  Refrigerator, 
  Calendar, 
  Settings,
  Plus
} from 'lucide-react';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const navItems = [
    { id: 'pantry', label: 'Pantry', icon: Refrigerator },
    { id: 'recipes', label: 'Recipes', icon: ChefHat },
    { id: 'planner', label: 'Planner', icon: Calendar },
    { id: 'shopping', label: 'Shopping', icon: ShoppingCart },
    { id: 'settings', label: 'Account', icon: Settings },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-secondary pb-20 md:pb-0 md:pl-20">
      {/* Sidebar for Desktop / Bottom Nav for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-t border-black/5 px-6 py-3 md:top-0 md:left-0 md:bottom-0 md:right-auto md:w-20 md:border-t-0 md:border-r md:flex-col md:justify-center md:items-center">
        <ul className="flex justify-between items-center md:flex-col md:gap-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 transition-colors relative group",
                    isActive ? "text-primary" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -top-2 w-1 h-1 bg-primary rounded-full md:left-[-12px] md:top-1/2 md:-translate-y-1/2 md:w-1 md:h-6"
                    />
                  )}
                  <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[10px] font-medium uppercase tracking-wider md:hidden">
                    {item.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 pt-8 md:pt-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating Action Button for Adding Ingredients/Recipes */}
      <button className="fixed right-6 bottom-24 bg-primary text-white p-4 rounded-full shadow-lg shadow-primary/20 transition-transform hover:scale-110 active:scale-95 md:bottom-12 md:right-12">
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
