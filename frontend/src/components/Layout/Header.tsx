import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Sword, Package, ShoppingCart, User, Wallet } from 'lucide-react';
import { useWeb3 } from '../../contexts/Web3Context';
import { useGame } from '../../contexts/GameContext';

const Header: React.FC = () => {
  const location = useLocation();
  const { account, balance, disconnectWallet } = useWeb3();
  const { character, blockchainData } = useGame();

  const navigation = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Battle', path: '/battle', icon: Sword },
    { name: 'Inventory', path: '/inventory', icon: Package },
    { name: 'Shop', path: '/shop', icon: ShoppingCart },
  ];

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <motion.header
      className="header"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        background: 'rgba(22, 33, 62, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '2px solid #0f3460',
        padding: '16px 20px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between' 
      }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none' }}>
          <motion.div
            whileHover={{ scale: 1.05 }}
            style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              background: 'linear-gradient(45deg, #4ecdc4, #7dd3d8)',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ color: '#1a1a2e', fontSize: '12px', fontWeight: 'bold' }}>A</span>
            </div>
            <h1 style={{ color: '#4ecdc4', fontSize: '12px', margin: 0 }}>
              AETHERIUM RPG
            </h1>
          </motion.div>
        </Link>

        {/* Navigation */}
        <nav style={{ display: 'flex', gap: '8px' }}>
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
                <motion.div
                  className="nav-item"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: `1px solid ${isActive ? '#4ecdc4' : 'transparent'}`,
                    background: isActive ? 'rgba(78, 205, 196, 0.1)' : 'transparent',
                    color: isActive ? '#4ecdc4' : '#aaa',
                    fontSize: '8px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Icon size={14} />
                  <span className="nav-text" style={{ display: window.innerWidth > 768 ? 'block' : 'none' }}>
                    {item.name}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Character Info */}
          {character && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ textAlign: 'right', fontSize: '8px' }}>
                <div style={{ color: '#4ecdc4', fontWeight: 'bold' }}>
                  {character.name}
                </div>
                <div style={{ color: '#aaa' }}>
                  Lv.{blockchainData?.level || character.level} {character.className}
                </div>
              </div>
              <User size={20} color="#4ecdc4" />
            </div>
          )}

          {/* Token Balance */}
          {blockchainData && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              padding: '8px 12px',
              background: 'rgba(247, 147, 30, 0.1)',
              border: '1px solid #f7931e',
              borderRadius: '4px',
            }}>
              <div style={{ fontSize: '8px', color: '#f7931e' }}>
                {blockchainData.tokenBalance.toFixed(2)} AETH
              </div>
            </div>
          )}

          {/* Wallet Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right', fontSize: '8px' }}>
              <div style={{ color: '#aaa' }}>
                {formatAddress(account!)}
              </div>
              <div style={{ color: '#666' }}>
                {parseFloat(balance).toFixed(4)} ETH
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={disconnectWallet}
              style={{
                background: 'none',
                border: '1px solid #666',
                borderRadius: '4px',
                padding: '8px',
                cursor: 'pointer',
                color: '#666',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#ff6b6b';
                e.currentTarget.style.color = '#ff6b6b';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#666';
                e.currentTarget.style.color = '#666';
              }}
            >
              <Wallet size={16} />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;