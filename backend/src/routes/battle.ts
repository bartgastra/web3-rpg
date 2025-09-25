import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import { supabase, Battle } from '../database/init';
import { blockchainService } from '../config/blockchain';
import { validateRequest } from '../middleware/validation';

export const battleRoutes = Router();

// Validation schemas
const startBattleSchema = Joi.object({
  characterId: Joi.string().uuid().required(),
  enemyType: Joi.string().valid('goblin', 'orc', 'skeleton', 'dragon').optional().default('goblin')
});

const battleTurnSchema = Joi.object({
  battleId: Joi.string().uuid().required(),
  action: Joi.string().valid('attack', 'skill', 'item', 'defend').required(),
  targetId: Joi.string().optional(), // For items or skills with targets
  itemId: Joi.number().integer().optional() // For item usage
});

// Enemy definitions
const ENEMIES = {
  goblin: {
    name: 'Goblin',
    level: 1,
    stats: { hp: 30, mp: 10, attack: 8, defense: 3, speed: 12 },
    expReward: 25,
    tokenReward: 50
  },
  orc: {
    name: 'Orc Warrior',
    level: 3,
    stats: { hp: 60, mp: 5, attack: 15, defense: 8, speed: 6 },
    expReward: 75,
    tokenReward: 150
  },
  skeleton: {
    name: 'Skeleton Mage',
    level: 4,
    stats: { hp: 45, mp: 40, attack: 10, defense: 5, speed: 8 },
    expReward: 100,
    tokenReward: 200
  },
  dragon: {
    name: 'Young Dragon',
    level: 10,
    stats: { hp: 200, mp: 80, attack: 35, defense: 20, speed: 15 },
    expReward: 500,
    tokenReward: 1000
  }
};

/**
 * POST /api/battle/start
 * Initiates a player-vs-computer battle
 */
battleRoutes.post('/start', validateRequest(startBattleSchema), async (req, res) => {
  try {
    const { characterId, enemyType } = req.body;

    // Get character data
    const { data: character, error: characterError } = await supabase
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
      .eq('id', characterId)
      .single();

    if (characterError || !character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // Check if player can battle (blockchain cooldown)
    const canBattle = await blockchainService.canBattle(character.wallet_address);
    if (!canBattle) {
      return res.status(400).json({ error: 'Battle cooldown active. Please wait before battling again.' });
    }

    // Check for ongoing battles
    const { data: ongoingBattle } = await supabase
      .from('battles')
      .select('id')
      .eq('character_id', characterId)
      .eq('result', 'ongoing')
      .single();

    if (ongoingBattle) {
      return res.status(400).json({ 
        error: 'Character already has an ongoing battle',
        battleId: ongoingBattle.id
      });
    }

    // Select enemy
    const enemy = ENEMIES[enemyType as keyof typeof ENEMIES];
    const battleId = uuidv4();

    // Calculate character battle stats
    const characterStats = calculateBattleStats(character);
    
    // Initialize battle state
    const battleState = {
      character: {
        id: characterId,
        name: character.name,
        level: character.level,
        hp: characterStats.maxHp,
        maxHp: characterStats.maxHp,
        mp: characterStats.maxMp,
        maxMp: characterStats.maxMp,
        attack: characterStats.attack,
        defense: characterStats.defense,
        speed: characterStats.speed
      },
      enemy: {
        name: enemy.name,
        level: enemy.level,
        hp: enemy.stats.hp,
        maxHp: enemy.stats.hp,
        mp: enemy.stats.mp,
        maxMp: enemy.stats.mp,
        attack: enemy.stats.attack,
        defense: enemy.stats.defense,
        speed: enemy.stats.speed
      },
      turn: 1,
      currentTurn: characterStats.speed >= enemy.stats.speed ? 'character' : 'enemy'
    };

    // Create battle record
    const battle: Omit<Battle, 'created_at' | 'completed_at'> = {
      id: battleId,
      character_id: characterId,
      enemy_name: enemy.name,
      enemy_stats: enemy.stats,
      result: 'ongoing',
      experience_gained: 0,
      tokens_earned: 0,
      battle_log: [{
        turn: 0,
        action: 'battle_start',
        message: `Battle begins! ${character.name} vs ${enemy.name}`,
        battleState
      }]
    };

    const { error: battleError } = await supabase
      .from('battles')
      .insert(battle);

    if (battleError) {
      console.error('Battle creation error:', battleError);
      return res.status(500).json({ error: 'Failed to create battle' });
    }

    res.status(201).json({
      battleId,
      battleState,
      enemy: enemy.name,
      message: `Battle started against ${enemy.name}!`
    });

  } catch (error) {
    console.error('Battle start error:', error);
    res.status(500).json({ error: 'Failed to start battle' });
  }
});

/**
 * POST /api/battle/turn
 * Handles a player's action during a battle
 */
battleRoutes.post('/turn', validateRequest(battleTurnSchema), async (req, res) => {
  try {
    const { battleId, action, targetId, itemId } = req.body;

    // Get battle data
    const { data: battle, error: battleError } = await supabase
      .from('battles')
      .select('*')
      .eq('id', battleId)
      .single();

    if (battleError || !battle) {
      return res.status(404).json({ error: 'Battle not found' });
    }

    if (battle.result !== 'ongoing') {
      return res.status(400).json({ error: 'Battle is already completed' });
    }

    // Get current battle state from the last log entry
    const lastLog = battle.battle_log[battle.battle_log.length - 1];
    const battleState = lastLog.battleState;

    if (battleState.currentTurn !== 'character') {
      return res.status(400).json({ error: 'Not character\'s turn' });
    }

    // Process character action
    const actionResult = await processAction(battle, battleState, action, itemId);
    
    // Check if battle ended after character action
    let battleEnded = false;
    let result: 'victory' | 'defeat' | 'ongoing' = 'ongoing';

    if (battleState.enemy.hp <= 0) {
      battleEnded = true;
      result = 'victory';
    } else if (battleState.character.hp <= 0) {
      battleEnded = true;
      result = 'defeat';
    }

    // Process enemy turn if battle continues
    let enemyActionResult = null;
    if (!battleEnded) {
      enemyActionResult = processEnemyAction(battleState);
      
      // Check again after enemy action
      if (battleState.character.hp <= 0) {
        battleEnded = true;
        result = 'defeat';
      }
    }

    // Update battle state
    battleState.turn += 1;
    battleState.currentTurn = battleEnded ? 'none' : 'character';

    // Create new log entries
    const newLogEntries = [actionResult];
    if (enemyActionResult) {
      newLogEntries.push(enemyActionResult);
    }

    // Update battle in database
    const updatedBattleLog = [...battle.battle_log, ...newLogEntries];
    let updateData: any = {
      battle_log: updatedBattleLog
    };

    // Handle battle completion
    if (battleEnded) {
      const enemy = Object.values(ENEMIES).find(e => e.name === battle.enemy_name);
      const expGained = result === 'victory' ? (enemy?.expReward || 0) : 10;
      const tokensEarned = result === 'victory' ? (enemy?.tokenReward || 0) : 10;

      updateData = {
        ...updateData,
        result,
        experience_gained: expGained,
        tokens_earned: tokensEarned,
        completed_at: new Date().toISOString()
      };

      // Update blockchain
      const { data: character } = await supabase
        .from('characters')
        .select('wallet_address')
        .eq('id', battle.character_id)
        .single();

      if (character) {
        await blockchainService.completeBattle(character.wallet_address, result === 'victory');
      }
    }

    const { error: updateError } = await supabase
      .from('battles')
      .update(updateData)
      .eq('id', battleId);

    if (updateError) {
      console.error('Battle update error:', updateError);
      return res.status(500).json({ error: 'Failed to update battle' });
    }

    res.json({
      battleState,
      actionResult,
      enemyActionResult,
      battleEnded,
      result: battleEnded ? result : undefined,
      experienceGained: battleEnded ? updateData.experience_gained : undefined,
      tokensEarned: battleEnded ? updateData.tokens_earned : undefined
    });

  } catch (error) {
    console.error('Battle turn error:', error);
    res.status(500).json({ error: 'Failed to process battle turn' });
  }
});

/**
 * GET /api/battle/:id
 * Get battle details
 */
battleRoutes.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: battle, error } = await supabase
      .from('battles')
      .select(`
        *,
        character:characters(name, class, level)
      `)
      .eq('id', id)
      .single();

    if (error || !battle) {
      return res.status(404).json({ error: 'Battle not found' });
    }

    res.json({ battle });

  } catch (error) {
    console.error('Battle retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve battle' });
  }
});

// Helper functions
function calculateBattleStats(character: any) {
  const baseHp = 50 + (character.level * 10) + (character.stats.vitality * 2);
  const baseMp = 20 + (character.level * 5) + (character.stats.intelligence * 1.5);
  const attack = 10 + (character.level * 2) + character.stats.strength;
  const defense = 5 + (character.level * 1) + (character.stats.vitality * 0.5);
  const speed = 10 + character.stats.dexterity;

  return {
    maxHp: Math.floor(baseHp),
    maxMp: Math.floor(baseMp),
    attack: Math.floor(attack),
    defense: Math.floor(defense),
    speed: Math.floor(speed)
  };
}

async function processAction(battle: Battle, battleState: any, action: string, itemId?: number) {
  const character = battleState.character;
  const enemy = battleState.enemy;
  
  let damage = 0;
  let message = '';

  switch (action) {
    case 'attack':
      damage = Math.max(1, character.attack - enemy.defense + Math.floor(Math.random() * 10) - 5);
      enemy.hp = Math.max(0, enemy.hp - damage);
      message = `${character.name} attacks ${enemy.name} for ${damage} damage!`;
      break;

    case 'defend':
      character.defense += 5; // Temporary defense boost
      message = `${character.name} takes a defensive stance!`;
      break;

    case 'skill':
      // Simple skill implementation
      if (character.mp >= 10) {
        character.mp -= 10;
        damage = Math.floor(character.attack * 1.5);
        enemy.hp = Math.max(0, enemy.hp - damage);
        message = `${character.name} uses a special skill for ${damage} damage!`;
      } else {
        message = `${character.name} doesn't have enough MP for a skill!`;
      }
      break;

    case 'item':
      if (itemId) {
        // Simple item usage (health potion)
        if (itemId === 7) { // Health Potion
          const healAmount = 50;
          character.hp = Math.min(character.maxHp, character.hp + healAmount);
          message = `${character.name} uses a Health Potion and recovers ${healAmount} HP!`;
        } else if (itemId === 8) { // Mana Potion
          const manaAmount = 30;
          character.mp = Math.min(character.maxMp, character.mp + manaAmount);
          message = `${character.name} uses a Mana Potion and recovers ${manaAmount} MP!`;
        }
      }
      break;

    default:
      message = `${character.name} hesitates...`;
  }

  return {
    turn: battleState.turn,
    actor: 'character',
    action,
    damage,
    message,
    battleState: JSON.parse(JSON.stringify(battleState))
  };
}

function processEnemyAction(battleState: any) {
  const character = battleState.character;
  const enemy = battleState.enemy;
  
  // Simple AI: 70% attack, 20% skill, 10% defend
  const actionRoll = Math.random();
  let action = 'attack';
  let damage = 0;
  let message = '';

  if (actionRoll < 0.7) {
    action = 'attack';
    damage = Math.max(1, enemy.attack - character.defense + Math.floor(Math.random() * 8) - 4);
    character.hp = Math.max(0, character.hp - damage);
    message = `${enemy.name} attacks ${character.name} for ${damage} damage!`;
  } else if (actionRoll < 0.9 && enemy.mp >= 8) {
    action = 'skill';
    enemy.mp -= 8;
    damage = Math.floor(enemy.attack * 1.3);
    character.hp = Math.max(0, character.hp - damage);
    message = `${enemy.name} uses a special attack for ${damage} damage!`;
  } else {
    action = 'defend';
    enemy.defense += 3;
    message = `${enemy.name} takes a defensive stance!`;
  }

  return {
    turn: battleState.turn,
    actor: 'enemy',
    action,
    damage,
    message,
    battleState: JSON.parse(JSON.stringify(battleState))
  };
}