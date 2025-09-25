import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Target, Zap } from 'lucide-react';
import { BlockchainData } from '../../types/api';

interface BattleStatsProps {
  blockchainData: BlockchainData | null;
}

const BattleStats: React.FC<BattleStatsProps> = ({ blockchainData }) => {
  if (!blockchainData) {
    return (
      <motion.div
        className="card"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="card-header">
          <h3 className="card-title">Battle Statistics</h3>
        </div>
        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
          <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ fontSize: '8px' }}>Loading battle data...</p>
        </div>
      </motion.div>
    );
  }

  const totalBattles = blockchainData.battlesWon + blockchainData.battlesLost;
  const winRate = totalBattles > 0 ? (blockchainData.battlesWon / totalBattles) * 100 : 0;

  const stats = [
    {
      icon: Trophy,
      label: 'Victories',
      value: blockchainData.battlesWon,
      color: '#51cf66'
    },
    {
      icon: Target,
      label: 'Total Battles',
      value: totalBattles,
      color: '#4ecdc4'
    },
    {
      icon: Zap,
      label: 'Win Rate',
      value: `${Math.round(winRate)}%`,
      color: '#f7931e'
    }
  ];

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="card-header">
        <h3 className="card-title">Battle Statistics</h3>
      </div>

      <div className="battle-stats-grid">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          
          return (
            <motion.div
              key={stat.label}
              className="stat-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                border: `1px solid ${stat.color}`,
                borderRadius: '8px',
                background: `rgba(${stat.color.slice(1).match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ')}, 0.1)`,
                marginBottom: '12px',
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: stat.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Icon size={16} color="#fff" />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontSize: '8px', 
                  color: '#aaa',
                  marginBottom: '4px'
                }}>
                  {stat.label}
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  color: stat.color,
                  fontWeight: 'bold'
                }}>
                  {stat.value}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Win Rate Progress Bar */}
      {totalBattles > 0 && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '8px',
            fontSize: '8px'
          }}>
            <span style={{ color: '#aaa' }}>Performance</span>
            <span style={{ color: '#f7931e' }}>
              {blockchainData.battlesWon}W / {blockchainData.battlesLost}L
            </span>
          </div>

          <div className="progress-bar">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${winRate}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              style={{
                background: winRate >= 70 
                  ? 'linear-gradient(90deg, #51cf66, #69db7c)' 
                  : winRate >= 50 
                  ? 'linear-gradient(90deg, #f7931e, #ffa94d)'
                  : 'linear-gradient(90deg, #ff6b6b, #ff8e8e)'
              }}
            />
            <div className="progress-text">
              {Math.round(winRate)}%
            </div>
          </div>
        </div>
      )}

      {totalBattles === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '20px',
          fontSize: '8px',
          color: '#666'
        }}>
          <p>No battles fought yet!</p>
          <p>Start your first battle to see statistics.</p>
        </div>
      )}
    </motion.div>
  );
};

export default BattleStats;