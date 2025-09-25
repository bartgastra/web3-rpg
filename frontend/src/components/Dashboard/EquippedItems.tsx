import React from 'react';
import { motion } from 'framer-motion';
import { Sword, Shield, Gem } from 'lucide-react';
import { Character } from '../../types/api';

interface EquippedItemsProps {
  character: Character;
}

const EquippedItems: React.FC<EquippedItemsProps> = ({ character }) => {
  const equippedItems = character.equipped_items || {};
  const equipmentSlots = [
    { 
      key: 'weapon', 
      name: 'Weapon', 
      icon: Sword, 
      color: '#ff6b6b',
      itemId: equippedItems.weapon 
    },
    { 
      key: 'armor', 
      name: 'Armor', 
      icon: Shield, 
      color: '#51cf66',
      itemId: equippedItems.armor 
    },
    { 
      key: 'accessory', 
      name: 'Accessory', 
      icon: Gem, 
      color: '#9775fa',
      itemId: equippedItems.accessory 
    },
  ];

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="card-header">
        <h3 className="card-title">Equipped Items</h3>
      </div>

      <div className="equipment-grid">
        {equipmentSlots.map((slot, index) => {
          const Icon = slot.icon;
          const hasItem = slot.itemId !== undefined;

          return (
            <motion.div
              key={slot.key}
              className="equipment-slot"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.1 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                border: `2px solid ${hasItem ? slot.color : '#0f3460'}`,
                borderRadius: '8px',
                background: hasItem 
                  ? `rgba(${slot.color.slice(1).match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ')}, 0.1)` 
                  : 'rgba(15, 52, 96, 0.1)',
                marginBottom: '12px',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '4px',
                background: hasItem ? slot.color : '#333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: hasItem ? 1 : 0.3,
              }}>
                <Icon size={16} color={hasItem ? '#fff' : '#666'} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontSize: '8px', 
                  color: hasItem ? slot.color : '#666',
                  fontWeight: 'bold',
                  marginBottom: '4px'
                }}>
                  {slot.name}
                </div>
                <div style={{ fontSize: '7px', color: '#aaa' }}>
                  {hasItem ? `Item ID: ${slot.itemId}` : 'No item equipped'}
                </div>
              </div>

              {!hasItem && (
                <div style={{
                  fontSize: '6px',
                  color: '#666',
                  padding: '4px 8px',
                  border: '1px solid #333',
                  borderRadius: '4px',
                  background: 'rgba(0, 0, 0, 0.2)',
                }}>
                  EMPTY
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div style={{ 
        marginTop: '16px', 
        paddingTop: '16px', 
        borderTop: '1px solid rgba(15, 52, 96, 0.3)',
        fontSize: '7px',
        color: '#666',
        textAlign: 'center'
      }}>
        Visit your inventory to equip items
      </div>
    </motion.div>
  );
};

export default EquippedItems;