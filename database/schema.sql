-- Aetherium RPG Database Schema
-- This file contains the SQL schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Characters table
CREATE TABLE IF NOT EXISTS characters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT NOT NULL UNIQUE,
    avatar_token_id INTEGER NOT NULL UNIQUE,
    name TEXT NOT NULL,
    class INTEGER NOT NULL CHECK (class IN (0, 1, 2)), -- 0: Warrior, 1: Mage, 2: Rogue
    level INTEGER NOT NULL DEFAULT 1,
    experience INTEGER NOT NULL DEFAULT 0,
    stats JSONB NOT NULL DEFAULT '{"strength": 10, "vitality": 10, "intelligence": 10, "dexterity": 10, "luck": 10}',
    equipped_items JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Items table
CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('weapon', 'armor', 'consumable', 'accessory')),
    class_restriction INTEGER CHECK (class_restriction IN (0, 1, 2)), -- null means any class
    stats JSONB NOT NULL DEFAULT '{}',
    price INTEGER NOT NULL DEFAULT 0,
    description TEXT NOT NULL DEFAULT ''
);

-- Inventory items table
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    acquired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(character_id, item_id)
);

-- Battles table
CREATE TABLE IF NOT EXISTS battles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    enemy_name TEXT NOT NULL,
    enemy_stats JSONB NOT NULL DEFAULT '{}',
    result TEXT NOT NULL DEFAULT 'ongoing' CHECK (result IN ('ongoing', 'victory', 'defeat')),
    experience_gained INTEGER NOT NULL DEFAULT 0,
    tokens_earned INTEGER NOT NULL DEFAULT 0,
    battle_log JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_characters_wallet_address ON characters(wallet_address);
CREATE INDEX IF NOT EXISTS idx_characters_avatar_token_id ON characters(avatar_token_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_character_id ON inventory_items(character_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_item_id ON inventory_items(item_id);
CREATE INDEX IF NOT EXISTS idx_battles_character_id ON battles(character_id);
CREATE INDEX IF NOT EXISTS idx_battles_result ON battles(result);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update timestamp trigger to characters table
CREATE TRIGGER update_characters_updated_at 
    BEFORE UPDATE ON characters 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default items
INSERT INTO items (id, name, type, class_restriction, stats, price, description) VALUES
-- Weapons
(1, 'Iron Sword', 'weapon', 0, '{"attack": 10}', 100, 'A sturdy iron sword for warriors.'),
(2, 'Magic Staff', 'weapon', 1, '{"magic_attack": 15}', 120, 'A staff imbued with magical energy.'),
(3, 'Steel Dagger', 'weapon', 2, '{"attack": 8, "speed": 5}', 90, 'A quick and deadly dagger.'),

-- Armor
(4, 'Leather Armor', 'armor', NULL, '{"defense": 5}', 80, 'Basic leather protection.'),
(5, 'Chain Mail', 'armor', 0, '{"defense": 12}', 150, 'Heavy armor for warriors.'),
(6, 'Mage Robe', 'armor', 1, '{"defense": 3, "magic_defense": 10}', 130, 'Robes that enhance magical abilities.'),

-- Consumables
(7, 'Health Potion', 'consumable', NULL, '{"heal": 50}', 25, 'Restores 50 HP.'),
(8, 'Mana Potion', 'consumable', NULL, '{"mana_restore": 30}', 30, 'Restores 30 MP.'),
(9, 'Elixir', 'consumable', NULL, '{"heal": 100, "mana_restore": 50}', 100, 'Fully restores HP and MP.')
ON CONFLICT (id) DO NOTHING;

-- RLS (Row Level Security) policies
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;

-- Allow read access to items for everyone
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Items are viewable by everyone" ON items FOR SELECT USING (true);

-- Characters policies
CREATE POLICY "Users can view their own characters" ON characters FOR SELECT USING (true);
CREATE POLICY "Users can insert their own characters" ON characters FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own characters" ON characters FOR UPDATE USING (true);

-- Inventory policies
CREATE POLICY "Users can view their own inventory" ON inventory_items FOR SELECT USING (true);
CREATE POLICY "Users can insert into their own inventory" ON inventory_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own inventory" ON inventory_items FOR UPDATE USING (true);
CREATE POLICY "Users can delete from their own inventory" ON inventory_items FOR DELETE USING (true);

-- Battle policies
CREATE POLICY "Users can view their own battles" ON battles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own battles" ON battles FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own battles" ON battles FOR UPDATE USING (true);