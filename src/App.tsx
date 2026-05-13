import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Landing from './components/Landing';
import PantryView from './components/PantryView';
import RecipeView from './components/RecipeView';
import ShoppingView from './components/ShoppingView';
import Onboarding from './components/Onboarding';
import MealPlanner from './components/MealPlanner';
import AccountView from './components/AccountView';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('pantry');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Landing />;
  }

  if (profile && !profile.onboarded) {
    return <Onboarding />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'pantry': return <PantryView />;
      case 'recipes': return <RecipeView />;
      case 'planner': return <MealPlanner />;
      case 'shopping': return <ShoppingView />;
      case 'settings': return <AccountView />;
      default: return <PantryView />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
