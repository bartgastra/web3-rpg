import { Router } from 'express';
import { supabase } from '../database/init';
import { MockDataService } from '../services/mockData';

export const itemRoutes = Router();

/**
 * GET /api/items
 * Retrieves a list of all items and their properties
 */
itemRoutes.get('/', async (req, res) => {
  try {
    let items = [];
    
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('type', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      items = data;
    } catch (dbError) {
      console.warn('Database not available, using mock items');
      items = MockDataService.getItems();
    }

    // Group items by type for easier frontend consumption
    const groupedItems = items.reduce((acc: any, item: any) => {
      if (!acc[item.type]) {
        acc[item.type] = [];
      }
      acc[item.type].push(item);
      return acc;
    }, {});

    res.json({
      items,
      groupedItems,
      totalCount: items.length
    });

  } catch (error) {
    console.error('Items route error:', error);
    res.status(500).json({ error: 'Failed to retrieve items' });
  }
});

/**
 * GET /api/items/:id
 * Get specific item details
 */
itemRoutes.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const itemId = parseInt(id);

    if (isNaN(itemId)) {
      return res.status(400).json({ error: 'Invalid item ID' });
    }

    const { data: item, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (error || !item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ item });

  } catch (error) {
    console.error('Item retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve item' });
  }
});

/**
 * GET /api/items/character/:characterId/inventory
 * Get character's inventory
 */
itemRoutes.get('/character/:characterId/inventory', async (req, res) => {
  try {
    const { characterId } = req.params;

    const { data: inventory, error } = await supabase
      .from('inventory_items')
      .select(`
        id,
        item_id,
        quantity,
        acquired_at,
        items(*)
      `)
      .eq('character_id', characterId)
      .order('acquired_at', { ascending: false });

    if (error) {
      console.error('Inventory retrieval error:', error);
      return res.status(500).json({ error: 'Failed to retrieve inventory' });
    }

    // Group by item type
    const groupedInventory = inventory.reduce((acc: any, invItem: any) => {
      const itemType = invItem.items.type;
      if (!acc[itemType]) {
        acc[itemType] = [];
      }
      acc[itemType].push({
        inventoryId: invItem.id,
        quantity: invItem.quantity,
        acquiredAt: invItem.acquired_at,
        ...invItem.items
      });
      return acc;
    }, {});

    res.json({
      inventory,
      groupedInventory,
      totalItems: inventory.length
    });

  } catch (error) {
    console.error('Inventory route error:', error);
    res.status(500).json({ error: 'Failed to retrieve inventory' });
  }
});

/**
 * POST /api/items/character/:characterId/use
 * Use a consumable item
 */
itemRoutes.post('/character/:characterId/use', async (req, res) => {
  try {
    const { characterId } = req.params;
    const { itemId, quantity = 1 } = req.body;

    // Get item details
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (itemError || !item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (item.type !== 'consumable') {
      return res.status(400).json({ error: 'Item is not consumable' });
    }

    // Check if character has the item
    const { data: inventoryItem, error: invError } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('character_id', characterId)
      .eq('item_id', itemId)
      .single();

    if (invError || !inventoryItem) {
      return res.status(404).json({ error: 'Item not found in inventory' });
    }

    if (inventoryItem.quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient quantity' });
    }

    // Update inventory quantity
    const newQuantity = inventoryItem.quantity - quantity;
    
    if (newQuantity === 0) {
      // Remove item from inventory
      await supabase
        .from('inventory_items')
        .delete()
        .eq('id', inventoryItem.id);
    } else {
      // Update quantity
      await supabase
        .from('inventory_items')
        .update({ quantity: newQuantity })
        .eq('id', inventoryItem.id);
    }

    res.json({
      message: `Used ${quantity}x ${item.name}`,
      effects: item.stats,
      remainingQuantity: newQuantity
    });

  } catch (error) {
    console.error('Item usage error:', error);
    res.status(500).json({ error: 'Failed to use item' });
  }
});

/**
 * GET /api/items/shop
 * Get shop items (items that can be purchased)
 */
itemRoutes.get('/shop', async (req, res) => {
  try {
    let items = [];
    
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .gt('price', 0) // Only items with a price > 0 are available in shop
        .order('type', { ascending: true })
        .order('price', { ascending: true });

      if (error) throw error;
      items = data;
    } catch (dbError) {
      console.warn('Database not available, using mock shop items');
      items = MockDataService.getItems().filter(item => item.price > 0);
    }

    // Group by type
    const groupedShopItems = items.reduce((acc: any, item: any) => {
      if (!acc[item.type]) {
        acc[item.type] = [];
      }
      acc[item.type].push(item);
      return acc;
    }, {});

    res.json({
      shopItems: items,
      groupedShopItems,
      totalCount: items.length
    });

  } catch (error) {
    console.error('Shop route error:', error);
    res.status(500).json({ error: 'Failed to retrieve shop items' });
  }
});

/**
 * POST /api/items/character/:characterId/purchase
 * Purchase an item from the shop
 */
itemRoutes.post('/character/:characterId/purchase', async (req, res) => {
  try {
    const { characterId } = req.params;
    const { itemId, quantity = 1 } = req.body;

    // Get character and item
    const { data: character } = await supabase
      .from('characters')
      .select('wallet_address')
      .eq('id', characterId)
      .single();

    const { data: item } = await supabase
      .from('items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (!character || !item) {
      return res.status(404).json({ error: 'Character or item not found' });
    }

    const totalCost = item.price * quantity;

    // Check if character has enough tokens (this would need blockchain integration)
    // For now, we'll simulate the purchase

    // Add item to inventory
    const { data: existingItem } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('character_id', characterId)
      .eq('item_id', itemId)
      .single();

    if (existingItem) {
      // Update existing item quantity
      await supabase
        .from('inventory_items')
        .update({ quantity: existingItem.quantity + quantity })
        .eq('id', existingItem.id);
    } else {
      // Create new inventory item
      await supabase
        .from('inventory_items')
        .insert({
          id: require('uuid').v4(),
          character_id: characterId,
          item_id: itemId,
          quantity
        });
    }

    res.json({
      message: `Purchased ${quantity}x ${item.name} for ${totalCost} AETH tokens`,
      item,
      quantity,
      totalCost
    });

  } catch (error) {
    console.error('Item purchase error:', error);
    res.status(500).json({ error: 'Failed to purchase item' });
  }
});