import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database schema initialization
export async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database connection...');
    
    // Test the connection
    const { data, error } = await supabase.from('characters').select('count').limit(1);
    
    if (error) {
      console.warn('⚠️  Database connection failed. Running in mock mode.');
      console.warn('⚠️  Please configure SUPABASE_URL and SUPABASE_ANON_KEY in your .env file');
      return;
    }

    console.log('✅ Database connection successful');
    
    // Initialize default items (only if we can connect)
    await initializeDefaultItems();
    
    console.log('✅ Database initialization completed');
  } catch (error) {
    console.warn('⚠️  Database initialization failed. Running in mock mode.');
    console.warn('⚠️  Error:', error);
    // Don't throw error - allow server to start in mock mode
  }
}

async function initializeDefaultItems() {
  const defaultItems = [
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

  for (const item of defaultItems) {
    const { error } = await supabase
      .from('items')
      .upsert(item, { onConflict: 'id' });
    
    if (error && !error.message.includes('duplicate key')) {
      console.error('Error inserting item:', item.name, error);
    }
  }
}

// Database types
export interface Character {
  id: string;
  wallet_address: string;
  avatar_token_id: number;
  name: string;
  class: number; // 0: Warrior, 1: Mage, 2: Rogue
  level: number;
  experience: number;
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

export interface Item {
  id: number;
  name: string;
  type: 'weapon' | 'armor' | 'consumable' | 'accessory';
  class_restriction: number | null; // null means any class can use
  stats: Record<string, number>;
  price: number;
  description: string;
}

export interface InventoryItem {
  id: string;
  character_id: string;
  item_id: number;
  quantity: number;
  acquired_at: string;
}

export interface Battle {
  id: string;
  character_id: string;
  enemy_name: string;
  enemy_stats: Record<string, number>;
  result: 'victory' | 'defeat' | 'ongoing';
  experience_gained: number;
  tokens_earned: number;
  battle_log: any[];
  created_at: string;
  completed_at?: string;
}