import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Package, Sword, Shield, Gem, Pill } from 'lucide-react';
import { useGame } from '../../contexts/GameContext';
import { gameApi } from '../../services/api';
import toast from 'react-hot-toast';

const ITEM_TYPE_ICONS = {
  weapon: Sword,
  armor: Shield,
  accessory: Gem,
  consumable: Pill,
};

const ITEM_TYPE_COLORS = {
  weapon: '#ff6b6b',
  armor: '#51cf66',
  accessory: '#9775fa',
  consumable: '#f7931e',
};

const Inventory: React.FC = () => {
  const { character, equipItem } = useGame();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState<string>('all');

  // Fetch inventory
  const { data: inventoryData, isLoading } = useQuery(
    ['inventory', character?.id],
    () => gameApi.getInventory(character!.id),
    {
      enabled: !!character,
    }
  );

  // Use item mutation
  const useItemMutation = useMutation(
    ({ itemId, quantity }: { itemId: number; quantity?: number }) =>
      gameApi.useItem(character!.id, itemId, quantity),
    {
      onSuccess: (data) => {
        toast.success(data.message);
        queryClient.invalidateQueries(['inventory', character?.id]);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to use item');
      },
    }
  );

  // Equip item mutation
  const equipItemMutation = useMutation(
    ({ itemId, slot }: { itemId: number; slot: string }) =>
      equipItem(itemId, slot),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['inventory', character?.id]);
      },
    }
  );

  const handleUseItem = (itemId: number, itemType: string) => {
    if (itemType === 'consumable') {
      useItemMutation.mutate({ itemId, quantity: 1 });
    }
  };

  const handleEquipItem = (itemId: number, itemType: string) => {
    let slot = itemType;
    if (itemType === 'weapon' || itemType === 'armor' || itemType === 'accessory') {
      equipItemMutation.mutate({ itemId, slot });
    }
  };

  if (!character) {
    return <div>Loading...</div>;
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
        <p>Loading inventory...</p>
      </div>
    );
  }

  const inventory = inventoryData?.inventory || [];
  const groupedInventory = inventoryData?.groupedInventory || {};

  const tabs = [
    { id: 'all', name: 'All Items', count: inventory.length },
    { id: 'weapon', name: 'Weapons', count: groupedInventory.weapon?.length || 0 },
    { id: 'armor', name: 'Armor', count: groupedInventory.armor?.length || 0 },
    { id: 'consumable', name: 'Consumables', count: groupedInventory.consumable?.length || 0 },
    { id: 'accessory', name: 'Accessories', count: groupedInventory.accessory?.length || 0 },
  ];

  const filteredItems = selectedTab === 'all' 
    ? inventory 
    : groupedInventory[selectedTab] || [];

  return (
    <motion.div
      className="inventory"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '30px' }}>
        <Package size={24} color="#4ecdc4" />
        <h1 style={{ color: '#4ecdc4', fontSize: '18px', margin: 0 }}>
          INVENTORY
        </h1>
      </div>

      {/* Tabs */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              className={`tab-btn ${selectedTab === tab.id ? 'active' : ''}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedTab(tab.id)}
              style={{
                background: selectedTab === tab.id ? 'rgba(78, 205, 196, 0.2)' : 'none',
                border: `1px solid ${selectedTab === tab.id ? '#4ecdc4' : '#0f3460'}`,
                borderRadius: '4px',
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '8px',
                color: selectedTab === tab.id ? '#4ecdc4' : '#aaa',
                transition: 'all 0.2s ease',
              }}
            >
              {tab.name} ({tab.count})
            </motion.button>
          ))}
        </div>
      </div>

      {/* Inventory Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-3">
          {filteredItems.map((item: any, index: number) => {
            const Icon = ITEM_TYPE_ICONS[item.type as keyof typeof ITEM_TYPE_ICONS] || Package;
            const color = ITEM_TYPE_COLORS[item.type as keyof typeof ITEM_TYPE_COLORS] || '#4ecdc4';
            const isEquippable = ['weapon', 'armor', 'accessory'].includes(item.type);
            const isConsumable = item.type === 'consumable';

            return (
              <motion.div
                key={`${item.id}-${index}`}
                className="item-card"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                style={{
                  border: `2px solid ${color}`,
                  borderRadius: '8px',
                  padding: '16px',
                  background: `rgba(${color.slice(1).match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ')}, 0.1)`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '4px',
                    background: color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Icon size={16} color="#fff" />
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <h4 style={{ color: color, fontSize: '10px', marginBottom: '4px' }}>
                      {item.name}
                    </h4>
                    <p style={{ fontSize: '7px', color: '#aaa' }}>
                      Qty: {item.quantity}
                    </p>
                  </div>
                </div>

                <p style={{ fontSize: '7px', color: '#ccc', marginBottom: '12px', lineHeight: '1.4' }}>
                  {item.description}
                </p>

                {/* Item Stats */}
                {item.stats && Object.keys(item.stats).length > 0 && (
                  <div style={{ marginBottom: '12px', fontSize: '7px' }}>
                    <div style={{ color: '#aaa', marginBottom: '4px' }}>Stats:</div>
                    {Object.entries(item.stats).map(([stat, value]) => (
                      <div key={stat} style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ textTransform: 'capitalize' }}>{stat.replace('_', ' ')}</span>
                        <span style={{ color: color }}>+{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {isEquippable && (
                    <button
                      className="btn btn-primary"
                      onClick={() => handleEquipItem(item.id, item.type)}
                      disabled={equipItemMutation.isLoading}
                      style={{ flex: 1, fontSize: '7px', padding: '8px' }}
                    >
                      EQUIP
                    </button>
                  )}
                  
                  {isConsumable && (
                    <button
                      className="btn btn-success"
                      onClick={() => handleUseItem(item.id, item.type)}
                      disabled={useItemMutation.isLoading}
                      style={{ flex: 1, fontSize: '7px', padding: '8px' }}
                    >
                      USE
                    </button>
                  )}
                </div>

                {/* Class Restriction */}
                {item.class_restriction !== null && (
                  <div style={{ 
                    marginTop: '8px', 
                    fontSize: '6px', 
                    color: '#666',
                    textAlign: 'center'
                  }}>
                    Class: {['Warrior', 'Mage', 'Rogue'][item.class_restriction]}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <Package size={48} color="#666" style={{ marginBottom: '16px' }} />
          <h3 style={{ color: '#666', marginBottom: '8px' }}>
            {selectedTab === 'all' ? 'No Items' : `No ${selectedTab}s`}
          </h3>
          <p style={{ fontSize: '8px', color: '#aaa' }}>
            {selectedTab === 'all' 
              ? 'Your inventory is empty. Visit the shop to buy items!'
              : `You don't have any ${selectedTab}s yet.`
            }
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default Inventory;