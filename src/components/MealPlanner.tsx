import React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function MealPlanner() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-5xl font-serif mb-2">Meal Planner</h1>
          <p className="text-gray-500 font-medium tracking-tight uppercase text-xs opacity-60">
            May 11 - May 17, 2026
          </p>
        </div>
        
        <div className="flex gap-2">
          <button className="p-3 rounded-full bg-white border border-black/5 shadow-sm hover:bg-gray-50"><ChevronLeft className="w-5 h-5"/></button>
          <button className="p-3 rounded-full bg-white border border-black/5 shadow-sm hover:bg-gray-50"><ChevronRight className="w-5 h-5"/></button>
        </div>
      </header>

      <div className="flex flex-col gap-6">
        {days.map((day, i) => (
          <div key={day} className="flex gap-4 md:gap-8 group">
            <div className="w-16 shrink-0 pt-4">
              <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">{day}</div>
              <div className="text-3xl font-serif">{11 + i}</div>
            </div>
            
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              {['Breakfast', 'Lunch', 'Dinner'].map(meal => (
                <div key={meal} className="organic-card min-h-[120px] bg-white hover:bg-gray-50/50 transition-colors cursor-pointer group/card flex flex-col justify-center items-center text-center p-4">
                  {meal === 'Dinner' && i === 0 ? (
                    <div className="w-full text-left">
                      <div className="text-[10px] font-bold text-primary uppercase tracking-tighter mb-1">Dinner</div>
                      <h4 className="font-bold text-sm leading-tight mb-2 truncate">Herb-Roasted Lemon Chicken</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        45 min
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-2">{meal}</div>
                      <Plus className="w-5 h-5 text-gray-300 group-hover/card:text-primary transition-colors" />
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="organic-card border-l-4 border-l-primary bg-primary/5">
        <h3 className="text-xl font-serif mb-2">Prep Strategy</h3>
        <p className="text-sm text-gray-600">
          We noticed you're having Chicken on Monday. Cook double the portion to use for Tuesday's Chicken Salad lunch.
        </p>
      </div>
    </div>
  );
}
