import React from 'react';
import { motion } from 'framer-motion';

interface ExperienceBarProps {
  currentExp: number;
  expToNext: number;
  level: number;
}

const ExperienceBar: React.FC<ExperienceBarProps> = ({ currentExp, expToNext, level }) => {
  const expForCurrentLevel = (level - 1) * 1000;
  const expForNextLevel = level * 1000;
  const expInCurrentLevel = currentExp - expForCurrentLevel;
  const expNeededForLevel = expForNextLevel - expForCurrentLevel;
  const progressPercentage = expNeededForLevel > 0 ? (expInCurrentLevel / expNeededForLevel) * 100 : 100;

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="card-header">
        <h3 className="card-title">Experience Progress</h3>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '8px',
          fontSize: '8px'
        }}>
          <span style={{ color: '#aaa' }}>Level {level}</span>
          <span style={{ color: '#f7931e' }}>
            {expInCurrentLevel} / {expNeededForLevel} EXP
          </span>
          <span style={{ color: '#aaa' }}>Level {level + 1}</span>
        </div>

        <div className="progress-bar">
          <motion.div
            className="progress-fill exp"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progressPercentage, 100)}%` }}
            transition={{ duration: 1, delay: 0.3 }}
          />
          <div className="progress-text">
            {Math.round(progressPercentage)}%
          </div>
        </div>
      </div>

      <div style={{ fontSize: '8px', color: '#aaa' }}>
        <div className="stat-item">
          <span>Total Experience</span>
          <span style={{ color: '#f7931e' }}>{currentExp.toLocaleString()}</span>
        </div>
        <div className="stat-item">
          <span>EXP to Next Level</span>
          <span style={{ color: '#f7931e' }}>{expToNext.toLocaleString()}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ExperienceBar;