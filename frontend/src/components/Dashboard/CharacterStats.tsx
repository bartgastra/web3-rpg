import React from 'react';
import { motion } from 'framer-motion';
import { Character } from '../../types/api';

interface CharacterStatsProps {
  character: Character;
}

const CharacterStats: React.FC<CharacterStatsProps> = ({ character }) => {
  const stats = character.currentStats || character.stats || {
    strength: 10,
    vitality: 10,
    intelligence: 10,
    dexterity: 10,
    luck: 10
  };

  const statColors = {
    strength: '#ff6b6b',
    vitality: '#51cf66',
    intelligence: '#4ecdc4',
    dexterity: '#f7931e',
    luck: '#9775fa'
  };

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="card-header">
        <h3 className="card-title">Character Stats</h3>
      </div>

      <div className="stats-grid">
        {Object.entries(stats).map(([statName, value], index) => (
          <motion.div
            key={statName}
            className="stat-item"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 0',
              borderBottom: '1px solid rgba(15, 52, 96, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: statColors[statName as keyof typeof statColors],
                }}
              />
              <span className="stat-label" style={{ textTransform: 'capitalize' }}>
                {statName}
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="stat-value" style={{ 
                color: statColors[statName as keyof typeof statColors],
                fontWeight: 'bold'
              }}>
                {value as number}
              </span>
              
              {/* Visual bar */}
              <div style={{
                width: '40px',
                height: '4px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '2px',
                overflow: 'hidden',
              }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(((value as number) / 20) * 100, 100)}%` }}
                  transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
                  style={{
                    height: '100%',
                    background: statColors[statName as keyof typeof statColors],
                    borderRadius: '2px',
                  }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Derived Stats */}
      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(15, 52, 96, 0.3)' }}>
        <h4 style={{ fontSize: '8px', color: '#aaa', marginBottom: '12px' }}>
          Derived Stats
        </h4>
        
        <div className="derived-stats" style={{ fontSize: '8px' }}>
          <div className="stat-item">
            <span>Max HP</span>
            <span style={{ color: '#ff6b6b' }}>
              {50 + (character.level * 10) + (stats.vitality * 2)}
            </span>
          </div>
          <div className="stat-item">
            <span>Max MP</span>
            <span style={{ color: '#4ecdc4' }}>
              {20 + (character.level * 5) + Math.floor(stats.intelligence * 1.5)}
            </span>
          </div>
          <div className="stat-item">
            <span>Attack</span>
            <span style={{ color: '#f7931e' }}>
              {10 + (character.level * 2) + stats.strength}
            </span>
          </div>
          <div className="stat-item">
            <span>Defense</span>
            <span style={{ color: '#51cf66' }}>
              {5 + character.level + Math.floor(stats.vitality * 0.5)}
            </span>
          </div>
          <div className="stat-item">
            <span>Speed</span>
            <span style={{ color: '#9775fa' }}>
              {10 + stats.dexterity}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CharacterStats;