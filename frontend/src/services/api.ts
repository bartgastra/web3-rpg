import axios from 'axios';
import type {
  CharacterResponse,
  CreateCharacterResponse,
  StartBattleResponse,
  BattleTurnResponse,
  InventoryResponse,
  ShopResponse,
  UseItemResponse,
  PurchaseItemResponse,
  Item
} from '../types/api';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Character API
export const gameApi = {
  // Character endpoints
  createCharacter: (walletAddress: string, name: string, characterClass: number): Promise<CreateCharacterResponse> =>
    api.post('/character/create', { walletAddress, name, class: characterClass }),

  getCharacter: (id: string): Promise<CharacterResponse> =>
    api.get(`/character/${id}`),

  getCharacterByWallet: (walletAddress: string): Promise<CharacterResponse> =>
    api.get(`/character/wallet/${walletAddress}`),

  equipItem: (characterId: string, itemId: number, slot: string): Promise<{ message: string; equippedItems: any }> =>
    api.put(`/character/${characterId}/equip`, { itemId, slot }),

  // Battle endpoints
  startBattle: (characterId: string, enemyType?: string): Promise<StartBattleResponse> =>
    api.post('/battle/start', { characterId, enemyType }),

  battleTurn: (battleId: string, action: string, targetId?: string, itemId?: number): Promise<BattleTurnResponse> =>
    api.post('/battle/turn', { battleId, action, targetId, itemId }),

  getBattle: (battleId: string): Promise<any> =>
    api.get(`/battle/${battleId}`),

  // Item endpoints
  getItems: (): Promise<{ items: Item[]; groupedItems: Record<string, Item[]>; totalCount: number }> =>
    api.get('/items'),

  getItem: (id: number): Promise<{ item: Item }> =>
    api.get(`/items/${id}`),

  getInventory: (characterId: string): Promise<InventoryResponse> =>
    api.get(`/items/character/${characterId}/inventory`),

  useItem: (characterId: string, itemId: number, quantity?: number): Promise<UseItemResponse> =>
    api.post(`/items/character/${characterId}/use`, { itemId, quantity }),

  getShopItems: (): Promise<ShopResponse> =>
    api.get('/items/shop'),

  purchaseItem: (characterId: string, itemId: number, quantity?: number): Promise<PurchaseItemResponse> =>
    api.post(`/items/character/${characterId}/purchase`, { itemId, quantity }),
};

export default api;