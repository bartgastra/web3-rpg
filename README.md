# Aetherium RPG - Final Fantasy-like Blockchain Game

A comprehensive full-stack RPG web application with deep blockchain integration, featuring ERC-20/ERC-721 tokens and on-chain game state management.

## Project Structure

```
aetherium-rpg/
├── contracts/          # Solidity smart contracts
├── backend/            # Node.js/TypeScript API server
├── frontend/           # React/TypeScript client
└── assets/            # Game assets (16-bit style)
```

## Quick Start

1. **Install dependencies:**
   ```bash
   npm run install:all
   ```

2. **Deploy contracts:**
   ```bash
   cd contracts
   npm run deploy:local
   ```

3. **Start development servers:**
   ```bash
   npm run dev
   ```

## Features

- **Smart Contracts:** ERC-20 currency, ERC-721 avatars, GameManager
- **Backend API:** Character management, battle system, item handling
- **Frontend:** 16-bit pixel art UI, Web3 integration, turn-based battles
- **Game Systems:** Stats, classes, EXP, leveling, airdrops

## Tech Stack

- **Frontend:** React, TypeScript, Web3.js, Ethers.js
- **Backend:** Node.js, TypeScript, Express.js
- **Contracts:** Solidity, Hardhat
- **Database:** Supabase
- **Styling:** CSS with 16-bit aesthetic