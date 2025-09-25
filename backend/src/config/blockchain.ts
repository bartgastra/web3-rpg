import { ethers } from 'ethers';
import contractAddresses from './contracts.json';

// Contract ABIs (simplified for demo - in production, import from compiled artifacts)
export const AETHERIUM_SHARD_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount)",
  "function totalSupply() view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

export const AETHERIUM_AVATAR_ABI = [
  "function mintAvatar(address to, string memory name, uint8 class) returns (uint256)",
  "function getAvatarData(uint256 tokenId) view returns (tuple(string name, uint8 class, uint256 createdAt, uint256 experience, uint8 level))",
  "function getOwnerAvatars(address owner) view returns (uint256[])",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "event AvatarMinted(address indexed to, uint256 indexed tokenId, string name, uint8 class)"
];

export const GAME_MANAGER_ABI = [
  "function registerPlayer(uint256 avatarId)",
  "function completeBattle(address player, bool victory)",
  "function awardExperience(address player, uint256 experience)",
  "function airdropWinners(address[] calldata recipients, uint256[] calldata amounts)",
  "function getPlayerData(address player) view returns (tuple(uint256 totalExperience, uint8 level, uint256 lastBattleTime, uint256 battlesWon, uint256 battlesLost, bool isActive))",
  "function canBattle(address player) view returns (bool)",
  "function getExpToNextLevel(address player) view returns (uint256)",
  "event PlayerRegistered(address indexed player, uint256 indexed avatarId)",
  "event BattleCompleted(address indexed player, bool victory, uint256 expGained, uint256 tokensEarned)"
];

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private aetheriumShard: ethers.Contract;
  private aetheriumAvatar: ethers.Contract;
  private gameManager: ethers.Contract;

  constructor() {
    const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
    const privateKey = process.env.PRIVATE_KEY;

    if (!privateKey) {
      console.warn('⚠️  PRIVATE_KEY environment variable not set. Using development default.');
      console.warn('⚠️  Please set up your .env file for production use.');
      // Use a development-only private key (never use in production!)
      process.env.PRIVATE_KEY = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, this.provider);

    // Initialize contracts with fallback addresses for development
    const defaultAddress = '0x1234567890123456789012345678901234567890';
    
    this.aetheriumShard = new ethers.Contract(
      contractAddresses?.contracts?.AetheriumShard || defaultAddress,
      AETHERIUM_SHARD_ABI,
      this.wallet
    );

    this.aetheriumAvatar = new ethers.Contract(
      contractAddresses?.contracts?.AetheriumAvatar || defaultAddress,
      AETHERIUM_AVATAR_ABI,
      this.wallet
    );

    this.gameManager = new ethers.Contract(
      contractAddresses?.contracts?.GameManager || defaultAddress,
      GAME_MANAGER_ABI,
      this.wallet
    );
  }

  // Token operations
  async getTokenBalance(address: string): Promise<string> {
    const balance = await this.aetheriumShard.balanceOf(address);
    return ethers.formatEther(balance);
  }

  async mintTokens(to: string, amount: string): Promise<string> {
    const tx = await this.aetheriumShard.mint(to, ethers.parseEther(amount));
    await tx.wait();
    return tx.hash;
  }

  // Avatar operations
  async mintAvatar(to: string, name: string, characterClass: number): Promise<{ tokenId: number; txHash: string }> {
    const tx = await this.aetheriumAvatar.mintAvatar(to, name, characterClass);
    const receipt = await tx.wait();
    
    // Parse the AvatarMinted event to get token ID
    const event = receipt.logs.find((log: any) => {
      try {
        const parsed = this.aetheriumAvatar.interface.parseLog(log);
        return parsed?.name === 'AvatarMinted';
      } catch {
        return false;
      }
    });

    const tokenId = event ? parseInt(event.args.tokenId.toString()) : 0;
    
    return {
      tokenId,
      txHash: tx.hash
    };
  }

  async getAvatarData(tokenId: number) {
    return await this.aetheriumAvatar.getAvatarData(tokenId);
  }

  async getOwnerAvatars(address: string): Promise<number[]> {
    const avatars = await this.aetheriumAvatar.getOwnerAvatars(address);
    return avatars.map((id: any) => parseInt(id.toString()));
  }

  // Game operations
  async registerPlayer(avatarId: number): Promise<string> {
    const tx = await this.gameManager.registerPlayer(avatarId);
    await tx.wait();
    return tx.hash;
  }

  async completeBattle(player: string, victory: boolean): Promise<string> {
    const tx = await this.gameManager.completeBattle(player, victory);
    await tx.wait();
    return tx.hash;
  }

  async getPlayerData(address: string) {
    return await this.gameManager.getPlayerData(address);
  }

  async canBattle(address: string): Promise<boolean> {
    return await this.gameManager.canBattle(address);
  }

  async getExpToNextLevel(address: string): Promise<string> {
    const exp = await this.gameManager.getExpToNextLevel(address);
    return exp.toString();
  }

  async executeAirdrop(recipients: string[], amounts: string[]): Promise<string> {
    const amountsInWei = amounts.map(amount => ethers.parseEther(amount));
    const tx = await this.gameManager.airdropWinners(recipients, amountsInWei);
    await tx.wait();
    return tx.hash;
  }

  // Utility methods
  getContractAddresses() {
    return contractAddresses.contracts;
  }

  async getBlockNumber(): Promise<number> {
    return await this.provider.getBlockNumber();
  }
}

export const blockchainService = new BlockchainService();