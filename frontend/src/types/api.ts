// API Response Types

export interface BattleState {
  character: {
    id: string;
    name: string;
    level: number;
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    attack: number;
    defense: number;
    speed: number;
  };
  enemy: {
    name: string;
    level: number;
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    attack: number;
    defense: number;
    speed: number;
  };
  turn: number;
  currentTurn: 'character' | 'enemy' | 'none';
}

export interface BattleActionResult {
  turn: number;
  actor: 'character' | 'enemy';
  action: string;
  damage: number;
  message: string;
  battleState: BattleState;
}

export interface StartBattleResponse {
  battleId: string;
  battleState: BattleState;
  enemy: string;
  message: string;
}

export interface BattleTurnResponse {
  battleState: BattleState;
  actionResult?: BattleActionResult;
  enemyActionResult?: BattleActionResult;
  battleEnded: boolean;
  result?: 'victory' | 'defeat';
  experienceGained?: number;
  tokensEarned?: number;
}

export interface Item {
  id: number;
  name: string;
  type: 'weapon' | 'armor' | 'consumable' | 'accessory';
  class_restriction: number | null;
  stats: Record<string, number>;
  price: number;
  description: string;
}

export interface InventoryItem extends Item {
  inventoryId: string;
  quantity: number;
  acquiredAt: string;
}

export interface ShopResponse {
  shopItems: Item[];
  groupedShopItems: Record<string, Item[]>;
  totalCount: number;
}

export interface InventoryResponse {
  inventory: InventoryItem[];
  groupedInventory: Record<string, InventoryItem[]>;
  totalItems: number;
}

export interface CreateCharacterResponse {
  character: any;
  avatarTokenId: number;
  transactionHash: string;
  className: string;
}

export interface CharacterResponse {
  character: any;
  blockchain?: {
    level: number;
    totalExperience: number;
    battlesWon: number;
    battlesLost: number;
    expToNextLevel: number;
    tokenBalance: number;
  };
}

export interface UseItemResponse {
  message: string;
  effects: Record<string, number>;
  remainingQuantity: number;
}

export interface PurchaseItemResponse {
  message: string;
  item: Item;
  quantity: number;
  totalCost: number;
}

export interface BlockchainData {
  level: number;
  totalExperience: number;
  battlesWon: number;
  battlesLost: number;
  expToNextLevel: number;
  tokenBalance: number;
}

export interface Character {
  id: string;
  name: string;
  level: number;
  experience: number;
  className: string;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  defense: number;
  speed: number;
  createdAt: string;
  stats?: {
    strength: number;
    vitality: number;
    intelligence: number;
    dexterity: number;
    luck: number;
  };
  currentStats?: {
    strength: number;
    vitality: number;
    intelligence: number;
    dexterity: number;
    luck: number;
  };
  equipped_items?: {
    weapon?: number;
    armor?: number;
    accessory?: number;
  };
}