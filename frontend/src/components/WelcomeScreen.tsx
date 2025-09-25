import React from 'react';
import { motion } from 'framer-motion';
import { Sword, Shield, Zap } from 'lucide-react';
import { useWeb3 } from '../contexts/Web3Context';

const WelcomeScreen: React.FC = () => {
  const { connectWallet, isConnecting } = useWeb3();

  return (
    <motion.div
      className="welcome-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        padding: '20px',
        textAlign: 'center',
      }}
    >
      {/* Title */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      >
        <h1 style={{ fontSize: '24px', marginBottom: '16px', color: '#4ecdc4' }}>
          AETHERIUM RPG
        </h1>
        <p style={{ fontSize: '10px', color: '#aaa', marginBottom: '40px' }}>
          A Final Fantasy-like Blockchain Adventure
        </p>
      </motion.div>

      {/* Features */}
      <motion.div
        className="features"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '40px',
          maxWidth: '800px',
        }}
      >
        <div className="card" style={{ textAlign: 'center', padding: '30px 20px' }}>
          <Sword size={32} color="#4ecdc4" style={{ marginBottom: '16px' }} />
          <h3 style={{ color: '#4ecdc4', marginBottom: '12px' }}>Epic Battles</h3>
          <p style={{ fontSize: '8px', color: '#ccc' }}>
            Engage in turn-based combat against mythical creatures and earn rewards
          </p>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '30px 20px' }}>
          <Shield size={32} color="#f7931e" style={{ marginBottom: '16px' }} />
          <h3 style={{ color: '#f7931e', marginBottom: '12px' }}>NFT Characters</h3>
          <p style={{ fontSize: '8px', color: '#ccc' }}>
            Create unique characters as ERC-721 tokens with distinct classes and abilities
          </p>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '30px 20px' }}>
          <Zap size={32} color="#51cf66" style={{ marginBottom: '16px' }} />
          <h3 style={{ color: '#51cf66', marginBottom: '12px' }}>Blockchain Rewards</h3>
          <p style={{ fontSize: '8px', color: '#ccc' }}>
            Earn AETH tokens through battles and participate in exclusive airdrops
          </p>
        </div>
      </motion.div>

      {/* Game Info */}
      <motion.div
        className="game-info"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        style={{ marginBottom: '40px', maxWidth: '600px' }}
      >
        <div className="card">
          <h3 style={{ color: '#4ecdc4', marginBottom: '16px' }}>Game Features</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '8px' }}>
            <div>
              <p>✨ Three Character Classes</p>
              <p>⚔️ Turn-based Combat</p>
              <p>🎒 Item Management</p>
            </div>
            <div>
              <p>📈 Experience & Leveling</p>
              <p>🏪 In-game Shop</p>
              <p>🎁 Token Airdrops</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Connect Button */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.8 }}
      >
        <button
          className="btn btn-primary"
          onClick={connectWallet}
          disabled={isConnecting}
          style={{
            fontSize: '12px',
            padding: '16px 32px',
            minWidth: '200px',
          }}
        >
          {isConnecting ? 'CONNECTING...' : 'CONNECT WALLET'}
        </button>
        <p style={{ fontSize: '8px', color: '#666', marginTop: '16px' }}>
          MetaMask required to play
        </p>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
        style={{ marginTop: '60px', fontSize: '6px', color: '#555' }}
      >
        <p>Built with React, TypeScript, Solidity & Ethers.js</p>
      </motion.div>
    </motion.div>
  );
};

export default WelcomeScreen;