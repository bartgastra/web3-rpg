// Mock data service for development when database is not available

export interface MockCharacter {
  id: string;
  wallet_address: string;
  avatar_token_id: number;
  name: string;
  class: number;
  className: string;
  level: number;
  experience: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  defense: number;
  speed: number;
  stats: {
    strength: number;
    vitality: number;
    intelligence: number;
    dexterity: number;
    luck: number;
  };
  equipped_items: {
    weapon?: number;
    armor?: number;
    accessory?: number;
  };
  created_at: string;
  updated_at: string;
}

export interface MockItem {
  id: number;
  name: string;
  type: 'weapon' | 'armor' | 'consumable' | 'accessory';
  class_restriction: number | null;
  stats: Record<string, number>;
  price: number;
  description: string;
}

// In-memory storage for development
const mockCharacters = new Map<string, MockCharacter>();
const mockInventory = new Map<string, Array<{ item_id: number; quantity: number }>>();

export const mockItems: MockItem[] = [
  // Weapons
  { id: 1, name: 'Iron Sword', type: 'weapon', class_restriction: 0, stats: { attack: 10 }, price: 100, description: 'A sturdy iron sword for warriors.' },
  { id: 2, name: 'Magic Staff', type: 'weapon', class_restriction: 1, stats: { magic_attack: 15 }, price: 120, description: 'A staff imbued with magical energy.' },
  { id: 3, name: 'Steel Dagger', type: 'weapon', class_restriction: 2, stats: { attack: 8, speed: 5 }, price: 90, description: 'A quick and deadly dagger.' },
  
  // Armor
  { id: 4, name: 'Leather Armor', type: 'armor', class_restriction: null, stats: { defense: 5 }, price: 80, description: 'Basic leather protection.' },
  { id: 5, name: 'Chain Mail', type: 'armor', class_restriction: 0, stats: { defense: 12 }, price: 150, description: 'Heavy armor for warriors.' },
  { id: 6, name: 'Mage Robe', type: 'armor', class_restriction: 1, stats: { defense: 3, magic_defense: 10 }, price: 130, description: 'Robes that enhance magical abilities.' },
  
  // Consumables
  { id: 7, name: 'Health Potion', type: 'consumable', class_restriction: null, stats: { heal: 50 }, price: 25, description: 'Restores 50 HP.' },
  { id: 8, name: 'Mana Potion', type: 'consumable', class_restriction: null, stats: { mana_restore: 30 }, price: 30, description: 'Restores 30 MP.' },
  { id: 9, name: 'Elixir', type: 'consumable', class_restriction: null, stats: { heal: 100, mana_restore: 50 }, price: 100, description: 'Fully restores HP and MP.' }
];

const classNames = ['Warrior', 'Mage', 'Rogue'];

export class MockDataService {
  static createCharacter(walletAddress: string, name: string, characterClass: number): MockCharacter {
    const id = `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const baseStats = this.getBaseStatsForClass(characterClass);
    
    const character: MockCharacter = {
      id,
      wallet_address: walletAddress,
      avatar_token_id: Math.floor(Math.random() * 1000) + 1,
      name,
      class: characterClass,
      className: classNames[characterClass] || 'Unknown',
      level: 1,
      experience: 0,
      hp: baseStats.hp,
      maxHp: baseStats.hp,
      mp: baseStats.mp,
      maxMp: baseStats.mp,
      attack: baseStats.attack,
      defense: baseStats.defense,
      speed: baseStats.speed,
      stats: {
        strength: baseStats.strength,
        vitality: baseStats.vitality,
        intelligence: baseStats.intelligence,
        dexterity: baseStats.dexterity,
        luck: baseStats.luck
      },
      equipped_items: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    mockCharacters.set(walletAddress, character);
    
    // Give starting items
    mockInventory.set(id, [
      { item_id: 7, quantity: 5 }, // Health Potions
      { item_id: 8, quantity: 3 }, // Mana Potions
    ]);

    return character;
  }

  static getCharacterByWallet(walletAddress: string): MockCharacter | null {
    return mockCharacters.get(walletAddress) || null;
  }

  static updateCharacter(walletAddress: string, updates: Partial<MockCharacter>): MockCharacter | null {
    const character = mockCharacters.get(walletAddress);
    if (!character) return null;

    const updatedCharacter = { ...character, ...updates, updated_at: new Date().toISOString() };
    mockCharacters.set(walletAddress, updatedCharacter);
    return updatedCharacter;
  }

  static getItems(): MockItem[] {
    return mockItems;
  }

  static getItemById(id: number): MockItem | null {
    return mockItems.find(item => item.id === id) || null;
  }

  static getInventory(characterId: string) {
    const inventory = mockInventory.get(characterId) || [];
    return inventory.map(inv => ({
      ...inv,
      item: this.getItemById(inv.item_id)
    })).filter(inv => inv.item);
  }

  static addToInventory(characterId: string, itemId: number, quantity: number = 1) {
    const inventory = mockInventory.get(characterId) || [];
    const existingItem = inventory.find(inv => inv.item_id === itemId);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      inventory.push({ item_id: itemId, quantity });
    }
    
    mockInventory.set(characterId, inventory);
  }

  static removeFromInventory(characterId: string, itemId: number, quantity: number = 1): boolean {
    const inventory = mockInventory.get(characterId) || [];
    const itemIndex = inventory.findIndex(inv => inv.item_id === itemId);
    
    if (itemIndex === -1) return false;
    
    const item = inventory[itemIndex];
    if (item.quantity <= quantity) {
      inventory.splice(itemIndex, 1);
    } else {
      item.quantity -= quantity;
    }
    
    mockInventory.set(characterId, inventory);
    return true;
  }

  private static getBaseStatsForClass(characterClass: number) {
    switch (characterClass) {
      case 0: // Warrior
        return {
          hp: 100, mp: 20, attack: 15, defense: 12, speed: 8,
          strength: 15, vitality: 14, intelligence: 8, dexterity: 10, luck: 8
        };
      case 1: // Mage
        return {
          hp: 60, mp: 80, attack: 8, defense: 6, speed: 10,
          strength: 8, vitality: 10, intelligence: 16, dexterity: 12, luck: 9
        };
      case 2: // Rogue
        return {
          hp: 80, mp: 40, attack: 12, defense: 8, speed: 15,
          strength: 12, vitality: 11, intelligence: 10, dexterity: 16, luck: 12
        };
      default:
        return {
          hp: 80, mp: 50, attack: 10, defense: 8, speed: 10,
          strength: 10, vitality: 10, intelligence: 10, dexterity: 10, luck: 10
        };
    }
  }
}