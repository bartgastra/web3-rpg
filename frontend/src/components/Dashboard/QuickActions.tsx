import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sword, Package, ShoppingCart, RefreshCw } from 'lucide-react';
import { Character } from '../../types/api';
import { useGame } from '../../contexts/GameContext';

interface QuickActionsProps {
  character: Character;
}

const QuickActions: React.FC<QuickActionsProps> = ({ character }) => {
  const navigate = useNavigate();
  const { refreshCharacter } = useGame();

  const actions = [
    {
      icon: Sword,
      label: 'Start Battle',
      description: 'Fight enemies and earn rewards',
      color: '#ff6b6b',
      onClick: () => navigate('/battle')
    },
    {
      icon: Package,
      label: 'Inventory',
      description: 'Manage your items and equipment',
      color: '#4ecdc4',
      onClick: () => navigate('/inventory')
    },
    {
      icon: ShoppingCart,
      label: 'Shop',
      description: 'Buy items and equipment',
      color: '#f7931e',
      onClick: () => navigate('/shop')
    },
    {
      icon: RefreshCw,
      label: 'Refresh',
      description: 'Update character data',
      color: '#51cf66',
      onClick: refreshCharacter
    }
  ];

  return (
    <motion.div
      className="card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <div className="card-header">
        <h3 className="card-title">Quick Actions</h3>
      </div>

      <div className="grid grid-4">
        {actions.map((action, index) => {
          const Icon = action.icon;
          
          return (
            <motion.button
              key={action.label}
              className="quick-action-btn"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={action.onClick}
              style={{
                background: 'none',
                border: `2px solid ${action.color}`,
                borderRadius: '8px',
                padding: '20px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                color: action.color,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `rgba(${action.color.slice(1).match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ')}, 0.1)`;
                e.currentTarget.style.boxShadow = `0 0 20px rgba(${action.color.slice(1).match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ')}, 0.3)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Icon size={24} style={{ marginBottom: '12px' }} />
              <div style={{ fontSize: '8px', fontWeight: 'bold', marginBottom: '4px' }}>
                {action.label}
              </div>
              <div style={{ fontSize: '6px', color: '#aaa', lineHeight: '1.4' }}>
                {action.description}
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default QuickActions;