import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useWeb3 } from './contexts/Web3Context';
import { useGame } from './contexts/GameContext';
import Header from './components/Layout/Header';
import LoadingScreen from './components/UI/LoadingScreen';
import WelcomeScreen from './components/WelcomeScreen';
import Dashboard from './components/Dashboard/Dashboard';
import CharacterCreation from './components/Character/CharacterCreation';
import Battle from './components/Battle/Battle';
import Inventory from './components/Inventory/Inventory';
import Shop from './components/Shop/Shop';

function App() {
  const { isConnected, isConnecting } = useWeb3();
  const { character, isLoading } = useGame();

  if (isConnecting || isLoading) {
    return <LoadingScreen />;
  }

  if (!isConnected) {
    return <WelcomeScreen />;
  }

  if (!character) {
    return <CharacterCreation />;
  }

  return (
    <motion.div 
      className="app"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/battle" element={<Battle />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/character" element={<Dashboard />} />
        </Routes>
      </main>
    </motion.div>
  );
}

export default App;