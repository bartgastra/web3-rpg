import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useWeb3 } from './Web3Context';
import { gameApi } from '../services/api';
import type { Character, BlockchainData } from '../types/api';
import toast from 'react-hot-toast';



interface GameContextType {
  character: Character | null;
  blockchainData: BlockchainData | null;
  isLoading: boolean;
  createCharacter: (name: string, characterClass: number) => Promise<void>;
  refreshCharacter: () => void;
  equipItem: (itemId: number, slot: string) => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  const { account, isConnected } = useWeb3();
  const queryClient = useQueryClient();
  const [character, setCharacter] = useState<Character | null>(null);
  const [blockchainData, setBlockchainData] = useState<BlockchainData | null>(null);

  // Fetch character data
  const { data: characterData, isLoading, refetch } = useQuery(
    ['character', account],
    () => gameApi.getCharacterByWallet(account!),
    {
      enabled: !!account && isConnected,
      onSuccess: (data) => {
        if (data.character) {
          setCharacter(data.character);
          if (data.blockchain) {
            setBlockchainData(data.blockchain);
          }
        }
      },
      onError: (error: any) => {
        if (error.response?.status !== 404) {
          console.error('Error fetching character:', error);
        }
      },
    }
  );

  // Create character mutation
  const createCharacterMutation = useMutation(
    ({ name, characterClass }: { name: string; characterClass: number }) =>
      gameApi.createCharacter(account!, name, characterClass),
    {
      onSuccess: (data) => {
        setCharacter(data.character);
        toast.success(`Character ${data.character.name} created successfully!`);
        queryClient.invalidateQueries(['character', account]);
      },
      onError: (error: any) => {
        console.error('Error creating character:', error);
        toast.error(error.response?.data?.error || 'Failed to create character');
      },
    }
  );

  // Equip item mutation
  const equipItemMutation = useMutation(
    ({ itemId, slot }: { itemId: number; slot: string }) =>
      gameApi.equipItem(character!.id, itemId, slot),
    {
      onSuccess: () => {
        toast.success('Item equipped successfully!');
        queryClient.invalidateQueries(['character', account]);
      },
      onError: (error: any) => {
        console.error('Error equipping item:', error);
        toast.error(error.response?.data?.error || 'Failed to equip item');
      },
    }
  );

  const createCharacter = async (name: string, characterClass: number) => {
    await createCharacterMutation.mutateAsync({ name, characterClass });
  };

  const refreshCharacter = () => {
    refetch();
  };

  const equipItem = async (itemId: number, slot: string) => {
    await equipItemMutation.mutateAsync({ itemId, slot });
  };

  // Reset character when account changes
  useEffect(() => {
    if (!account || !isConnected) {
      setCharacter(null);
      setBlockchainData(null);
    }
  }, [account, isConnected]);

  const value: GameContextType = {
    character,
    blockchainData,
    isLoading: isLoading || createCharacterMutation.isLoading,
    createCharacter,
    refreshCharacter,
    equipItem,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

export type { Character, BlockchainData };