import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import { supabase, Character } from '../database/init';
import { blockchainService } from '../config/blockchain';
import { validateRequest } from '../middleware/validation';
import { MockDataService } from '../services/mockData';

export const characterRoutes = Router();

// Validation schemas
const createCharacterSchema = Joi.object({
  walletAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
  name: Joi.string().min(1).max(50).required(),
  class: Joi.number().integer().min(0).max(2).required() // 0: Warrior, 1: Mage, 2: Rogue
});

const getCharacterSchema = Joi.object({
  id: Joi.string().uuid().required()
});

// Class definitions
const CHARACTER_CLASSES = {
  0: { // Warrior
    name: 'Warrior',
    baseStats: { strength: 15, vitality: 12, intelligence: 5, dexterity: 8, luck: 5 },
    statGrowth: { strength: 3, vitality: 2, intelligence: 1, dexterity: 1, luck: 1 }
  },
  1: { // Mage
    name: 'Mage',
    baseStats: { strength: 5, vitality: 8, intelligence: 15, dexterity: 7, luck: 10 },
    statGrowth: { strength: 1, vitality: 1, intelligence: 3, dexterity: 1, luck: 2 }
  },
  2: { // Rogue
    name: 'Rogue',
    baseStats: { strength: 10, vitality: 9, intelligence: 8, dexterity: 15, luck: 13 },
    statGrowth: { strength: 2, vitality: 1, intelligence: 1, dexterity: 3, luck: 2 }
  }
};

/**
 * POST /api/character/create
 * Creates a new character and mints the corresponding ERC-721 NFT
 */
characterRoutes.post('/create', validateRequest(createCharacterSchema), async (req, res) => {
  try {
    const { walletAddress, name, class: characterClass } = req.body;

    // Check if character with this wallet already exists (try database first, then mock)
    let existingCharacter = null;
    try {
      const { data } = await supabase
        .from('characters')
        .select('id')
        .eq('wallet_address', walletAddress)
        .single();
      existingCharacter = data;
    } catch (error) {
      // Database not available, check mock data
      existingCharacter = MockDataService.getCharacterByWallet(walletAddress);
    }

    if (existingCharacter) {
      return res.status(400).json({ 
        error: 'Character already exists for this wallet address' 
      });
    }

    // Calculate base stats for the class
    const classData = CHARACTER_CLASSES[characterClass as keyof typeof CHARACTER_CLASSES];

    try {
      // Try blockchain operations (will use mock values if not available)
      const { tokenId, txHash } = await blockchainService.mintAvatar(
        walletAddress, 
        name, 
        characterClass
      );

      // Try to create character in database
      const characterId = uuidv4();
      const character: Omit<Character, 'created_at' | 'updated_at'> = {
        id: characterId,
        wallet_address: walletAddress,
        avatar_token_id: tokenId,
        name,
        class: characterClass,
        level: 1,
        experience: 0,
        stats: classData.baseStats,
        equipped_items: {}
      };

      const { data, error } = await supabase
        .from('characters')
        .insert(character)
        .select()
        .single();

      if (error) {
        throw new Error('Database not available');
      }

      // Register player on blockchain
      await blockchainService.registerPlayer(tokenId);
      await giveStartingItems(characterId, characterClass);

      res.status(201).json({
        character: data,
        avatarTokenId: tokenId,
        transactionHash: txHash,
        className: classData.name
      });

    } catch (blockchainError) {
      console.warn('Blockchain/Database not available, using mock data');
      
      // Create character using mock data service
      const mockCharacter = MockDataService.createCharacter(walletAddress, name, characterClass);
      
      res.status(201).json({
        character: mockCharacter,
        avatarTokenId: mockCharacter.avatar_token_id,
        transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
        className: classData.name
      });
    }

  } catch (error) {
    console.error('Character creation error:', error);
    res.status(500).json({ error: 'Failed to create character' });
  }
});

/**
 * GET /api/character/:id
 * Retrieves a character's stats and data from the database
 */
characterRoutes.get('/:id', validateRequest(getCharacterSchema, 'params'), async (req, res) => {
  try {
    const { id } = req.params;

    const { data: character, error } = await supabase
      .from('characters')
      .select(`
        *,
        inventory:inventory_items(
          id,
          item_id,
          quantity,
          items(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // Get blockchain data
    const playerData = await blockchainService.getPlayerData(character.wallet_address);
    const expToNextLevel = await blockchainService.getExpToNextLevel(character.wallet_address);
    const tokenBalance = await blockchainService.getTokenBalance(character.wallet_address);

    // Calculate current stats based on level and equipment
    const currentStats = calculateCurrentStats(character);

    res.json({
      character: {
        ...character,
        currentStats,
        className: CHARACTER_CLASSES[character.class as keyof typeof CHARACTER_CLASSES].name
      },
      blockchain: {
        level: parseInt(playerData.level.toString()),
        totalExperience: parseInt(playerData.totalExperience.toString()),
        battlesWon: parseInt(playerData.battlesWon.toString()),
        battlesLost: parseInt(playerData.battlesLost.toString()),
        expToNextLevel: parseInt(expToNextLevel),
        tokenBalance: parseFloat(tokenBalance)
      }
    });

  } catch (error) {
    console.error('Character retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve character' });
  }
});

/**
 * GET /api/character/wallet/:address
 * Get character by wallet address
 */
characterRoutes.get('/wallet/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }

    let character = null;
    let blockchain = null;

    try {
      // Try database first
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('wallet_address', address)
        .single();

      if (!error && data) {
        character = data;
        
        // Try to get blockchain data
        try {
          const playerData = await blockchainService.getPlayerData(address);
          const expToNextLevel = await blockchainService.getExpToNextLevel(address);
          const tokenBalance = await blockchainService.getTokenBalance(address);

          blockchain = {
            level: parseInt(playerData.level.toString()),
            totalExperience: parseInt(playerData.totalExperience.toString()),
            battlesWon: parseInt(playerData.battlesWon.toString()),
            battlesLost: parseInt(playerData.battlesLost.toString()),
            expToNextLevel: parseInt(expToNextLevel),
            tokenBalance: parseFloat(tokenBalance)
          };
        } catch (blockchainError) {
          console.warn('Blockchain data not available, using defaults');
          blockchain = {
            level: character.level,
            totalExperience: character.experience,
            battlesWon: 0,
            battlesLost: 0,
            expToNextLevel: 100,
            tokenBalance: 100.0
          };
        }
      }
    } catch (dbError) {
      // Database not available, try mock data
      character = MockDataService.getCharacterByWallet(address);
      if (character) {
        blockchain = {
          level: character.level,
          totalExperience: character.experience,
          battlesWon: 0,
          battlesLost: 0,
          expToNextLevel: 100,
          tokenBalance: 100.0
        };
      }
    }

    if (!character) {
      return res.status(404).json({ error: 'Character not found for this wallet' });
    }

    res.json({ character, blockchain });

  } catch (error) {
    console.error('Character lookup error:', error);
    res.status(500).json({ error: 'Failed to lookup character' });
  }
});

/**
 * PUT /api/character/:id/equip
 * Equip an item to a character
 */
characterRoutes.put('/:id/equip', async (req, res) => {
  try {
    const { id } = req.params;
    const { itemId, slot } = req.body;

    // Validate slot
    if (!['weapon', 'armor', 'accessory'].includes(slot)) {
      return res.status(400).json({ error: 'Invalid equipment slot' });
    }

    // Get character and item
    const { data: character } = await supabase
      .from('characters')
      .select('*')
      .eq('id', id)
      .single();

    const { data: item } = await supabase
      .from('items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (!character || !item) {
      return res.status(404).json({ error: 'Character or item not found' });
    }

    // Check class restriction
    if (item.class_restriction !== null && item.class_restriction !== character.class) {
      return res.status(400).json({ error: 'Item cannot be equipped by this class' });
    }

    // Check if character owns the item
    const { data: inventoryItem } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('character_id', id)
      .eq('item_id', itemId)
      .single();

    if (!inventoryItem) {
      return res.status(400).json({ error: 'Character does not own this item' });
    }

    // Update equipped items
    const equippedItems = { ...character.equipped_items };
    equippedItems[slot] = itemId;

    const { error } = await supabase
      .from('characters')
      .update({ equipped_items: equippedItems })
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: 'Failed to equip item' });
    }

    res.json({ message: 'Item equipped successfully', equippedItems });

  } catch (error) {
    console.error('Equipment error:', error);
    res.status(500).json({ error: 'Failed to equip item' });
  }
});

// Helper functions
async function giveStartingItems(characterId: string, characterClass: number) {
  const startingItems = [
    { itemId: 7, quantity: 5 }, // Health Potions
    { itemId: 8, quantity: 3 }, // Mana Potions
  ];

  // Add class-specific starting weapon
  if (characterClass === 0) startingItems.push({ itemId: 1, quantity: 1 }); // Iron Sword
  if (characterClass === 1) startingItems.push({ itemId: 2, quantity: 1 }); // Magic Staff
  if (characterClass === 2) startingItems.push({ itemId: 3, quantity: 1 }); // Steel Dagger

  // Add starting armor
  startingItems.push({ itemId: 4, quantity: 1 }); // Leather Armor

  for (const item of startingItems) {
    await supabase
      .from('inventory_items')
      .insert({
        id: uuidv4(),
        character_id: characterId,
        item_id: item.itemId,
        quantity: item.quantity
      });
  }
}

function calculateCurrentStats(character: Character) {
  const classData = CHARACTER_CLASSES[character.class as keyof typeof CHARACTER_CLASSES];
  const levelBonus = character.level - 1;
  
  // Base stats + level growth
  const currentStats = {
    strength: character.stats.strength + (classData.statGrowth.strength * levelBonus),
    vitality: character.stats.vitality + (classData.statGrowth.vitality * levelBonus),
    intelligence: character.stats.intelligence + (classData.statGrowth.intelligence * levelBonus),
    dexterity: character.stats.dexterity + (classData.statGrowth.dexterity * levelBonus),
    luck: character.stats.luck + (classData.statGrowth.luck * levelBonus)
  };

  // TODO: Add equipment bonuses
  
  return currentStats;
}