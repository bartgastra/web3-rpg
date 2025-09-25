import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { ShoppingCart, Sword, Shield, Gem, Pill, Coins } from 'lucide-react';
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

const Shop: React.FC = () => {
  const { character, blockchainData } = useGame();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState<string>('all');

  // Fetch shop items
  const { data: shopData, isLoading } = useQuery(
    ['shop-items'],
    () => gameApi.getShopItems()
  );

  // Purchase item mutation
  const purchaseItemMutation = useMutation(
    ({ itemId, quantity }: { itemId: number; quantity?: number }) =>
      gameApi.purchaseItem(character!.id, itemId, quantity),
    {
      onSuccess: (data) => {
        toast.success(data.message);
        queryClient.invalidateQueries(['inventory', character?.id]);
        queryClient.invalidateQueries(['character']);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to purchase item');
      },
    }
  );

  const handlePurchaseItem = (itemId: number, price: number, quantity: number = 1) => {
    const totalCost = price * quantity;
    const playerBalance = blockchainData?.tokenBalance || 0;

    if (totalCost > playerBalance) {
      toast.error('Insufficient AETH tokens!');
      return;
    }

    purchaseItemMutation.mutate({ itemId, quantity });
  };

  if (!character) {
    return <div>Loading...</div>;
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
        <p>Loading shop...</p>
      </div>
    );
  }

  const shopItems = shopData?.shopItems || [];
  const groupedShopItems = shopData?.groupedShopItems || {};

  const tabs = [
    { id: 'all', name: 'All Items', count: shopItems.length },
    { id: 'weapon', name: 'Weapons', count: groupedShopItems.weapon?.length || 0 },
    { id: 'armor', name: 'Armor', count: groupedShopItems.armor?.length || 0 },
    { id: 'consumable', name: 'Consumables', count: groupedShopItems.consumable?.length || 0 },
    { id: 'accessory', name: 'Accessories', count: groupedShopItems.accessory?.length || 0 },
  ];

  const filteredItems = selectedTab === 'all' 
    ? shopItems 
    : groupedShopItems[selectedTab] || [];

  return (
    <motion.div
      className="shop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <ShoppingCart size={24} color="#f7931e" />
          <h1 style={{ color: '#f7931e', fontSize: '18px', margin: 0 }}>
            ITEM SHOP
          </h1>
        </div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          padding: '8px 16px',
          background: 'rgba(247, 147, 30, 0.1)',
          border: '2px solid #f7931e',
          borderRadius: '8px',
        }}>
          <Coins size={16} color="#f7931e" />
          <span style={{ fontSize: '10px', color: '#f7931e', fontWeight: 'bold' }}>
            {blockchainData?.tokenBalance.toFixed(2) || '0.00'} AETH
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedTab(tab.id)}
              style={{
                background: selectedTab === tab.id ? 'rgba(247, 147, 30, 0.2)' : 'none',
                border: `1px solid ${selectedTab === tab.id ? '#f7931e' : '#0f3460'}`,
                borderRadius: '4px',
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '8px',
                color: selectedTab === tab.id ? '#f7931e' : '#aaa',
                transition: 'all 0.2s ease',
              }}
            >
              {tab.name} ({tab.count})
            </motion.button>
          ))}
        </div>
      </div>

      {/* Shop Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-3">
          {filteredItems.map((item: any, index: number) => {
            const Icon = ITEM_TYPE_ICONS[item.type as keyof typeof ITEM_TYPE_ICONS] || ShoppingCart;
            const color = ITEM_TYPE_COLORS[item.type as keyof typeof ITEM_TYPE_COLORS] || '#f7931e';
            const canAfford = (blockchainData?.tokenBalance || 0) >= item.price;

            return (
              <motion.div
                key={item.id}
                className="shop-item-card"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                style={{
                  border: `2px solid ${color}`,
                  borderRadius: '8px',
                  padding: '16px',
                  background: `rgba(${color.slice(1).match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ')}, 0.1)`,
                  opacity: canAfford ? 1 : 0.7,
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Coins size={10} color="#f7931e" />
                      <span style={{ fontSize: '8px', color: '#f7931e', fontWeight: 'bold' }}>
                        {item.price} AETH
                      </span>
                    </div>
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

                {/* Purchase Button */}
                <button
                  className={`btn ${canAfford ? 'btn-secondary' : 'btn-secondary'}`}
                  onClick={() => handlePurchaseItem(item.id, item.price)}
                  disabled={!canAfford || purchaseItemMutation.isLoading}
                  style={{ 
                    width: '100%', 
                    fontSize: '7px', 
                    padding: '8px',
                    opacity: canAfford ? 1 : 0.5
                  }}
                >
                  {canAfford ? 'BUY NOW' : 'INSUFFICIENT FUNDS'}
                </button>

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
          <ShoppingCart size={48} color="#666" style={{ marginBottom: '16px' }} />
          <h3 style={{ color: '#666', marginBottom: '8px' }}>
            No Items Available
          </h3>
          <p style={{ fontSize: '8px', color: '#aaa' }}>
            The shop is currently empty. Check back later!
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default Shop;