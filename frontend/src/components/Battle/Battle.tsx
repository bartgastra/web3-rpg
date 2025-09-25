import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from 'react-query';
import { Sword, Shield, Zap, Heart } from 'lucide-react';
import { useGame } from '../../contexts/GameContext';
import { gameApi } from '../../services/api';
import { StartBattleResponse, BattleTurnResponse } from '../../types/api';
import toast from 'react-hot-toast';

const ENEMY_TYPES = [
  { id: 'goblin', name: 'Goblin', level: 1, color: '#51cf66' },
  { id: 'orc', name: 'Orc Warrior', level: 3, color: '#f7931e' },
  { id: 'skeleton', name: 'Skeleton Mage', level: 4, color: '#9775fa' },
  { id: 'dragon', name: 'Young Dragon', level: 10, color: '#ff6b6b' },
];

const Battle: React.FC = () => {
  const { character } = useGame();
  const queryClient = useQueryClient();
  const [selectedEnemy, setSelectedEnemy] = useState('goblin');
  const [currentBattle, setCurrentBattle] = useState<StartBattleResponse | null>(null);
  const [battleLog, setBattleLog] = useState<string[]>([]);

  // Start battle mutation
  const startBattleMutation = useMutation(
    () => gameApi.startBattle(character!.id, selectedEnemy),
    {
      onSuccess: (data: StartBattleResponse) => {
        setCurrentBattle(data);
        setBattleLog([data.message]);
        toast.success('Battle started!');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to start battle');
      },
    }
  );

  // Battle turn mutation
  const battleTurnMutation = useMutation(
    ({ action, itemId }: { action: string; itemId?: number }) =>
      gameApi.battleTurn(currentBattle!.battleId, action, undefined, itemId),
    {
      onSuccess: (data: BattleTurnResponse) => {
        setCurrentBattle((prev: StartBattleResponse | null) => 
          prev ? { ...prev, battleState: data.battleState } : null
        );
        
        const newLogEntries: string[] = [];
        if (data.actionResult) {
          newLogEntries.push(data.actionResult.message);
        }
        if (data.enemyActionResult) {
          newLogEntries.push(data.enemyActionResult.message);
        }
        
        setBattleLog((prev: string[]) => [...prev, ...newLogEntries]);

        if (data.battleEnded) {
          const resultMessage = data.result === 'victory' 
            ? `Victory! Gained ${data.experienceGained} EXP and ${data.tokensEarned} AETH tokens!`
            : `Defeat! Gained ${data.experienceGained} EXP.`;
          
          setBattleLog(prev => [...prev, resultMessage]);
          toast.success(data.result === 'victory' ? 'Victory!' : 'Better luck next time!');
          
          // Refresh character data
          queryClient.invalidateQueries(['character']);
          
          // Reset battle after a delay
          setTimeout(() => {
            setCurrentBattle(null);
            setBattleLog([]);
          }, 3000);
        }
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Battle action failed');
      },
    }
  );

  const handleStartBattle = () => {
    startBattleMutation.mutate();
  };

  const handleBattleAction = (action: string, itemId?: number) => {
    battleTurnMutation.mutate({ action, itemId });
  };

  if (!character) {
    return <div>Loading...</div>;
  }

  return (
    <motion.div
      className="battle-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h1 style={{ textAlign: 'center', marginBottom: '30px', color: '#ff6b6b' }}>
        BATTLE ARENA
      </h1>

      {!currentBattle ? (
        // Enemy Selection Screen
        <div className="enemy-selection">
          <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div className="card-header">
              <h3 className="card-title">Choose Your Opponent</h3>
            </div>

            <div className="grid grid-2" style={{ marginBottom: '20px' }}>
              {ENEMY_TYPES.map((enemy) => (
                <motion.div
                  key={enemy.id}
                  className="enemy-card"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedEnemy(enemy.id)}
                  style={{
                    border: `2px solid ${selectedEnemy === enemy.id ? enemy.color : '#0f3460'}`,
                    background: selectedEnemy === enemy.id 
                      ? `rgba(${enemy.color.slice(1).match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ')}, 0.1)` 
                      : 'rgba(22, 33, 62, 0.8)',
                    borderRadius: '8px',
                    padding: '20px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <h4 style={{ color: enemy.color, marginBottom: '8px' }}>
                    {enemy.name}
                  </h4>
                  <p style={{ fontSize: '8px', color: '#aaa' }}>
                    Level {enemy.level}
                  </p>
                </motion.div>
              ))}
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                className="btn btn-danger"
                onClick={handleStartBattle}
                disabled={startBattleMutation.isLoading}
                style={{ fontSize: '12px', padding: '16px 32px' }}
              >
                {startBattleMutation.isLoading ? 'STARTING...' : 'START BATTLE'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Battle Screen
        <div className="battle-interface">
          {/* Battle State Display */}
          <div className="grid grid-2" style={{ marginBottom: '20px' }}>
            {/* Player Stats */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title" style={{ color: '#4ecdc4' }}>
                  {currentBattle.battleState.character.name}
                </h3>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', marginBottom: '4px' }}>
                  <span>HP</span>
                  <span>{currentBattle.battleState.character.hp} / {currentBattle.battleState.character.maxHp}</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill hp"
                    style={{ width: `${(currentBattle.battleState.character.hp / currentBattle.battleState.character.maxHp) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', marginBottom: '4px' }}>
                  <span>MP</span>
                  <span>{currentBattle.battleState.character.mp} / {currentBattle.battleState.character.maxMp}</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill mp"
                    style={{ width: `${(currentBattle.battleState.character.mp / currentBattle.battleState.character.maxMp) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Enemy Stats */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title" style={{ color: '#ff6b6b' }}>
                  {currentBattle.battleState.enemy.name}
                </h3>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', marginBottom: '4px' }}>
                  <span>HP</span>
                  <span>{currentBattle.battleState.enemy.hp} / {currentBattle.battleState.enemy.maxHp}</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill hp"
                    style={{ width: `${(currentBattle.battleState.enemy.hp / currentBattle.battleState.enemy.maxHp) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', marginBottom: '4px' }}>
                  <span>MP</span>
                  <span>{currentBattle.battleState.enemy.mp} / {currentBattle.battleState.enemy.maxMp}</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill mp"
                    style={{ width: `${(currentBattle.battleState.enemy.mp / currentBattle.battleState.enemy.maxMp) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Battle Log */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-header">
              <h3 className="card-title">Battle Log</h3>
            </div>
            <div 
              style={{ 
                height: '150px', 
                overflowY: 'auto', 
                fontSize: '8px', 
                lineHeight: '1.6',
                padding: '10px',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '4px'
              }}
            >
              {battleLog.map((entry, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  style={{ marginBottom: '4px', color: '#ccc' }}
                >
                  {entry}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Battle Actions */}
          {currentBattle.battleState.currentTurn === 'character' && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Choose Your Action</h3>
              </div>
              
              <div className="grid grid-4">
                <button
                  className="btn btn-danger"
                  onClick={() => handleBattleAction('attack')}
                  disabled={battleTurnMutation.isLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
                >
                  <Sword size={14} />
                  ATTACK
                </button>
                
                <button
                  className="btn btn-primary"
                  onClick={() => handleBattleAction('skill')}
                  disabled={battleTurnMutation.isLoading || currentBattle.battleState.character.mp < 10}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
                >
                  <Zap size={14} />
                  SKILL
                </button>
                
                <button
                  className="btn btn-success"
                  onClick={() => handleBattleAction('item', 7)} // Health Potion
                  disabled={battleTurnMutation.isLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
                >
                  <Heart size={14} />
                  HEAL
                </button>
                
                <button
                  className="btn btn-secondary"
                  onClick={() => handleBattleAction('defend')}
                  disabled={battleTurnMutation.isLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
                >
                  <Shield size={14} />
                  DEFEND
                </button>
              </div>
            </div>
          )}

          {currentBattle.battleState.currentTurn === 'enemy' && (
            <div className="card" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '10px', color: '#f7931e' }}>
                Enemy is thinking...
              </p>
              <div className="loading-spinner" style={{ margin: '16px auto' }} />
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default Battle;