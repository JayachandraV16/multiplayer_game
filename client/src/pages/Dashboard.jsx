import React, { useState, useContext, lazy, Suspense } from 'react';
import { AuthContext } from '../context/AuthContext';
import SutradharCharacter from '../components/SutradharCharacter';
import { Coins, Gem, LogOut, Home, ShoppingBag, FolderOpen, BarChart3, User2 } from 'lucide-react';

const SutradharMaze = lazy(() => import('../components/SutradharMaze'));
const ChorSipahi = lazy(() => import('../components/ChorSipahi'));
const ShopTab = lazy(() => import('../components/ShopTab'));
const InventoryTab = lazy(() => import('../components/InventoryTab'));
const LeaderboardTab = lazy(() => import('../components/LeaderboardTab'));
const ProfileTab = lazy(() => import('../components/ProfileTab'));

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('HOME'); // HOME, MAZE, MULTIPLAYER, SHOP, INVENTORY, LEADERBOARD, PROFILE

  const renderTabContent = () => {
    switch (activeTab) {
      case 'HOME':
        return renderHomeTab();
      case 'MAZE':
        return <SutradharMaze onBackToDashboard={() => setActiveTab('HOME')} />;
      case 'MULTIPLAYER':
        return <ChorSipahi onBackToDashboard={() => setActiveTab('HOME')} />;
      case 'SHOP':
        return <ShopTab />;
      case 'INVENTORY':
        return <InventoryTab />;
      case 'LEADERBOARD':
        return <LeaderboardTab />;
      case 'PROFILE':
        return <ProfileTab />;
      default:
        return renderHomeTab();
    }
  };

  const renderHomeTab = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center max-w-5xl mx-auto py-4">
        {/* Left Column: Character preview */}
        <div className="lg:col-span-2 flex flex-col items-center">
          <SutradharCharacter />
        </div>

        {/* Right Column: Game Mode Options */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          {/* Intro Text */}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl text-gold font-display mb-2">Decipher the Forgotten Saga</h2>
            <p className="text-sm text-parchment-dark leading-relaxed">
              India's cultural memories are slipping away into the void. As a Sutradhar, you must venture into ancient stepwells, mandalas, and university corridors to gather fragments of heritage and restore the eternal thread.
            </p>
          </div>

          {/* Mode 1 Card */}
          <div className="heritage-card p-5 rounded-lg border border-royal-blue-light hover:border-gold transition-all duration-300 group">
            <h3 className="text-xl text-gold font-display mb-1.5 flex justify-between items-center">
              <span>Sutradhar's Maze</span>
              <span className="text-[10px] bg-gold/15 text-gold border border-gold/30 px-1.5 rounded uppercase tracking-wider">Solo Mode</span>
            </h3>
            <p className="text-xs text-parchment-dark mb-4 leading-relaxed">
              Dodge the <strong className="text-pink-500">Vismarana</strong> spirits of forgetfulness in Stepwells, Forts, and Temple Mandalas. Collect memory fragments and solve ancient riddles for coins and speed boosts!
            </p>
            <button
              onClick={() => setActiveTab('MAZE')}
              className="btn-heritage px-6 py-2 text-xs w-full sm:w-auto"
            >
              Play Solo Maze
            </button>
          </div>

          {/* Mode 2 Card */}
          <div className="heritage-card p-5 rounded-lg border border-royal-blue-light hover:border-gold transition-all duration-300 group">
            <h3 className="text-xl text-gold font-display mb-1.5 flex justify-between items-center">
              <span>Chor Sipahi</span>
              <span className="text-[10px] bg-cyan-400/15 text-cyan-400 border border-cyan-400/30 px-1.5 rounded uppercase tracking-wider">Multiplayer</span>
            </h3>
            <p className="text-xs text-parchment-dark mb-4 leading-relaxed">
              Step into ancient Nalanda University. Coordinate with 4-6 players. One player is the <strong className="text-red-500">Chor (Thief)</strong>. Decipher clues and vote out the suspect before time runs out!
            </p>
            <button
              onClick={() => setActiveTab('MULTIPLAYER')}
              className="btn-heritage px-6 py-2 text-xs w-full sm:w-auto"
            >
              Enter Multiplayer Lobby
            </button>
          </div>

        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-maroon-dark text-parchment">
      {/* 1. Dashboard Header */}
      <header className="bg-royal-blue-dark/95 border-b border-gold/20 sticky top-0 z-30 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('HOME')}>
          <div className="w-8 h-8 rounded-full border border-gold flex items-center justify-center font-bold text-gold text-xs shadow-inner">
            T
          </div>
          <h1 className="text-lg sm:text-xl font-display text-gold tracking-wide gold-text-glow">
            THE LOST THREADS OF BHARAT
          </h1>
        </div>

        {/* User stats + Logout */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-maroon-dark/60 border border-maroon-light px-3 py-1 rounded-md text-xs sm:text-sm">
            <span className="text-parchment-dark font-medium hidden md:inline">{user?.name}</span>
            <div className="h-4 w-px bg-maroon-light hidden md:inline"></div>
            <div className="flex items-center gap-1 text-gold font-semibold font-display">
              <Coins size={14} />
              <span>{user?.coins || 0}</span>
            </div>
            <div className="flex items-center gap-1 text-cyan-400 font-semibold font-display">
              <Gem size={14} />
              <span>{user?.diamonds || 0}</span>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1 text-xs text-parchment-dark hover:text-red-400 border border-transparent hover:border-red-500/20 hover:bg-red-950/20 px-2.5 py-1 rounded transition-all"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* 2. Main Workspace Layout */}
      <main className="flex-1 p-6 overflow-y-auto">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center py-20 text-gold font-display gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-gold border-t-transparent animate-spin"></div>
            <p className="text-xs uppercase tracking-widest animate-pulse">Unrolling archives...</p>
          </div>
        }>
          {renderTabContent()}
        </Suspense>
      </main>

      {/* 3. Bottom Tab Selector */}
      {activeTab !== 'MAZE' && activeTab !== 'MULTIPLAYER' && (
        <footer className="bg-royal-blue-dark/95 border-t border-gold/15 sticky bottom-0 z-30 p-2.5 flex justify-around items-center">
          <button
            onClick={() => setActiveTab('HOME')}
            className={`flex flex-col items-center gap-1 text-xs transition-all ${
              activeTab === 'HOME' ? 'text-gold scale-105 font-bold' : 'text-parchment-dark hover:text-parchment'
            }`}
          >
            <Home size={18} />
            <span>Home</span>
          </button>
          
          <button
            onClick={() => setActiveTab('SHOP')}
            className={`flex flex-col items-center gap-1 text-xs transition-all ${
              activeTab === 'SHOP' ? 'text-gold scale-105 font-bold' : 'text-parchment-dark hover:text-parchment'
            }`}
          >
            <ShoppingBag size={18} />
            <span>Shop</span>
          </button>
          
          <button
            onClick={() => setActiveTab('INVENTORY')}
            className={`flex flex-col items-center gap-1 text-xs transition-all ${
              activeTab === 'INVENTORY' ? 'text-gold scale-105 font-bold' : 'text-parchment-dark hover:text-parchment'
            }`}
          >
            <FolderOpen size={18} />
            <span>Treasury</span>
          </button>
          
          <button
            onClick={() => setActiveTab('LEADERBOARD')}
            className={`flex flex-col items-center gap-1 text-xs transition-all ${
              activeTab === 'LEADERBOARD' ? 'text-gold scale-105 font-bold' : 'text-parchment-dark hover:text-parchment'
            }`}
          >
            <BarChart3 size={18} />
            <span>Rankings</span>
          </button>
          
          <button
            onClick={() => setActiveTab('PROFILE')}
            className={`flex flex-col items-center gap-1 text-xs transition-all ${
              activeTab === 'PROFILE' ? 'text-gold scale-105 font-bold' : 'text-parchment-dark hover:text-parchment'
            }`}
          >
            <User2 size={18} />
            <span>Profile</span>
          </button>
        </footer>
      )}
    </div>
  );
};

export default Dashboard;
