import React from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../../contexts/GameContext';
import CharacterStats from './CharacterStats';
import ExperienceBar from './ExperienceBar';
import EquippedItems from './EquippedItems';
import BattleStats from './BattleStats';
import QuickActions from './QuickActions';

const Dashboard: React.FC = () => {
  const { character, blockchainData } = useGame();

  if (!character) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p>Loading character data...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="dashboard"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="dashboard-header" style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h1 style={{ color: '#4ecdc4', fontSize: '18px', marginBottom: '8px' }}>
          Welcome back, {character.name}!
        </h1>
        <p style={{ fontSize: '10px', color: '#aaa' }}>
          Level {blockchainData?.level || character.level} {character.className}
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-2" style={{ marginBottom: '30px' }}>
        {/* Left Column */}
        <div>
          <CharacterStats character={character} />
          <ExperienceBar 
            currentExp={blockchainData?.totalExperience || character.experience}
            expToNext={blockchainData?.expToNextLevel || 0}
            level={blockchainData?.level || character.level}
          />
        </div>

        {/* Right Column */}
        <div>
          <EquippedItems character={character} />
          <BattleStats blockchainData={blockchainData} />
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions character={character} />

      {/* Recent Activity */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="card-header">
          <h3 className="card-title">Recent Activity</h3>
        </div>
        
        <div style={{ fontSize: '8px', color: '#aaa' }}>
          {blockchainData ? (
            <div>
              <div className="stat-item">
                <span>Total Battles</span>
                <span>{blockchainData.battlesWon + blockchainData.battlesLost}</span>
              </div>
              <div className="stat-item">
                <span>Win Rate</span>
                <span>
                  {blockchainData.battlesWon + blockchainData.battlesLost > 0
                    ? `${Math.round((blockchainData.battlesWon / (blockchainData.battlesWon + blockchainData.battlesLost)) * 100)}%`
                    : '0%'
                  }
                </span>
              </div>
              <div className="stat-item">
                <span>Token Balance</span>
                <span style={{ color: '#f7931e' }}>{blockchainData.tokenBalance.toFixed(2)} AETH</span>
              </div>
            </div>
          ) : (
            <p>Loading blockchain data...</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;