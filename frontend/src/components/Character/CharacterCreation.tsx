import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sword, Wand2, Zap } from 'lucide-react';
import { useGame } from '../../contexts/GameContext';

const CHARACTER_CLASSES = [
  {
    id: 0,
    name: 'Warrior',
    icon: Sword,
    description: 'Masters of melee combat with high strength and vitality',
    stats: { strength: 15, vitality: 12, intelligence: 5, dexterity: 8, luck: 5 },
    color: '#ff6b6b'
  },
  {
    id: 1,
    name: 'Mage',
    icon: Wand2,
    description: 'Wielders of arcane magic with high intelligence and luck',
    stats: { strength: 5, vitality: 8, intelligence: 15, dexterity: 7, luck: 10 },
    color: '#4ecdc4'
  },
  {
    id: 2,
    name: 'Rogue',
    icon: Zap,
    description: 'Swift assassins with high dexterity and luck',
    stats: { strength: 10, vitality: 9, intelligence: 8, dexterity: 15, luck: 13 },
    color: '#f7931e'
  }
];

const CharacterCreation: React.FC = () => {
  const [name, setName] = useState('');
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { createCharacter } = useGame();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || selectedClass === null) {
      return;
    }

    setIsCreating(true);
    try {
      await createCharacter(name.trim(), selectedClass);
    } catch (error) {
      console.error('Character creation failed:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const selectedClassData = selectedClass !== null ? CHARACTER_CLASSES[selectedClass] : null;

  return (
    <motion.div
      className="character-creation"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div className="card" style={{ maxWidth: '800px', width: '100%' }}>
        <div className="card-header">
          <h1 className="card-title" style={{ textAlign: 'center', fontSize: '16px' }}>
            CREATE YOUR HERO
          </h1>
          <p style={{ textAlign: 'center', fontSize: '8px', color: '#aaa' }}>
            Choose your name and class to begin your adventure
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Character Name */}
          <div className="form-group">
            <label className="form-label">Character Name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your hero's name"
              maxLength={50}
              required
            />
          </div>

          {/* Class Selection */}
          <div className="form-group">
            <label className="form-label">Choose Your Class</label>
            <div className="grid grid-3" style={{ marginTop: '16px' }}>
              {CHARACTER_CLASSES.map((characterClass) => {
                const Icon = characterClass.icon;
                const isSelected = selectedClass === characterClass.id;
                
                return (
                  <motion.div
                    key={characterClass.id}
                    className="class-card"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedClass(characterClass.id)}
                    style={{
                      border: `2px solid ${isSelected ? characterClass.color : '#0f3460'}`,
                      background: isSelected 
                        ? `rgba(${characterClass.color.slice(1).match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ')}, 0.1)` 
                        : 'rgba(22, 33, 62, 0.8)',
                      borderRadius: '8px',
                      padding: '20px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Icon 
                      size={32} 
                      color={characterClass.color} 
                      style={{ marginBottom: '12px' }} 
                    />
                    <h3 style={{ color: characterClass.color, marginBottom: '8px' }}>
                      {characterClass.name}
                    </h3>
                    <p style={{ fontSize: '7px', color: '#ccc', marginBottom: '16px' }}>
                      {characterClass.description}
                    </p>
                    
                    {/* Base Stats */}
                    <div style={{ fontSize: '6px', color: '#aaa' }}>
                      <div className="flex justify-between">
                        <span>STR</span>
                        <span>{characterClass.stats.strength}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>VIT</span>
                        <span>{characterClass.stats.vitality}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>INT</span>
                        <span>{characterClass.stats.intelligence}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>DEX</span>
                        <span>{characterClass.stats.dexterity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>LUK</span>
                        <span>{characterClass.stats.luck}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Selected Class Preview */}
          {selectedClassData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
              style={{ 
                marginTop: '20px',
                border: `2px solid ${selectedClassData.color}`,
                background: `rgba(${selectedClassData.color.slice(1).match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ')}, 0.05)`
              }}
            >
              <h3 style={{ color: selectedClassData.color, marginBottom: '12px' }}>
                Selected: {selectedClassData.name}
              </h3>
              <p style={{ fontSize: '8px', color: '#ccc', marginBottom: '16px' }}>
                {selectedClassData.description}
              </p>
              
              <div className="grid grid-2">
                <div>
                  <h4 style={{ fontSize: '8px', color: '#aaa', marginBottom: '8px' }}>
                    Starting Stats:
                  </h4>
                  <div style={{ fontSize: '8px' }}>
                    <div className="stat-item">
                      <span>Strength</span>
                      <span>{selectedClassData.stats.strength}</span>
                    </div>
                    <div className="stat-item">
                      <span>Vitality</span>
                      <span>{selectedClassData.stats.vitality}</span>
                    </div>
                    <div className="stat-item">
                      <span>Intelligence</span>
                      <span>{selectedClassData.stats.intelligence}</span>
                    </div>
                    <div className="stat-item">
                      <span>Dexterity</span>
                      <span>{selectedClassData.stats.dexterity}</span>
                    </div>
                    <div className="stat-item">
                      <span>Luck</span>
                      <span>{selectedClassData.stats.luck}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 style={{ fontSize: '8px', color: '#aaa', marginBottom: '8px' }}>
                    Starting Equipment:
                  </h4>
                  <div style={{ fontSize: '8px', color: '#ccc' }}>
                    <p>• Class-specific weapon</p>
                    <p>• Leather armor</p>
                    <p>• Health potions (5x)</p>
                    <p>• Mana potions (3x)</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Create Button */}
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!name.trim() || selectedClass === null || isCreating}
              style={{
                fontSize: '12px',
                padding: '16px 32px',
                minWidth: '200px',
              }}
            >
              {isCreating ? 'CREATING...' : 'CREATE CHARACTER'}
            </button>
          </div>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '7px', color: '#666' }}>
          <p>This will mint an NFT avatar and register you on the blockchain</p>
        </div>
      </div>
    </motion.div>
  );
};

export default CharacterCreation;