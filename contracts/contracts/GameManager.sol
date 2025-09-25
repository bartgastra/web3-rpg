// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./AetheriumShard.sol";
import "./AetheriumAvatar.sol";

/**
 * @title GameManager
 * @dev Central smart contract for managing on-chain game state in Aetherium RPG
 */
contract GameManager is AccessControl, ReentrancyGuard {
    bytes32 public constant LEVEL_UP_ROLE = keccak256("LEVEL_UP_ROLE");
    bytes32 public constant AIRDROP_ROLE = keccak256("AIRDROP_ROLE");
    bytes32 public constant GAME_MASTER_ROLE = keccak256("GAME_MASTER_ROLE");
    
    AetheriumShard public aetheriumShard;
    AetheriumAvatar public aetheriumAvatar;
    
    // Player data structure
    struct PlayerData {
        uint256 totalExperience;
        uint8 level;
        uint256 lastBattleTime;
        uint256 battlesWon;
        uint256 battlesLost;
        bool isActive;
    }
    
    // Battle result structure
    struct BattleResult {
        address player;
        bool victory;
        uint256 experienceGained;
        uint256 tokensEarned;
        uint256 timestamp;
    }
    
    mapping(address => PlayerData) public playerData;
    mapping(uint256 => PlayerData) public avatarData; // Avatar token ID to player data
    mapping(address => bool) public registeredPlayers;
    
    BattleResult[] public battleHistory;
    
    uint256 public constant EXP_PER_LEVEL = 1000;
    uint256 public constant BATTLE_COOLDOWN = 300; // 5 minutes
    uint256 public constant BASE_BATTLE_REWARD = 100 * 10**18; // 100 AETH tokens
    
    event PlayerRegistered(address indexed player, uint256 indexed avatarId);
    event PlayerLevelUp(address indexed player, uint8 newLevel);
    event AvatarLevelUp(uint256 indexed avatarId, uint8 newLevel);
    event BattleCompleted(address indexed player, bool victory, uint256 expGained, uint256 tokensEarned);
    event AirdropExecuted(address[] recipients, uint256[] amounts, uint256 totalAmount);
    event ExperienceAwarded(address indexed player, uint256 amount);
    
    constructor(
        address _aetheriumShard,
        address _aetheriumAvatar,
        address defaultAdmin
    ) {
        aetheriumShard = AetheriumShard(_aetheriumShard);
        aetheriumAvatar = AetheriumAvatar(_aetheriumAvatar);
        
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(LEVEL_UP_ROLE, defaultAdmin);
        _grantRole(AIRDROP_ROLE, defaultAdmin);
        _grantRole(GAME_MASTER_ROLE, defaultAdmin);
    }
    
    /**
     * @dev Register a new player with their avatar
     * @param avatarId Token ID of the player's avatar
     */
    function registerPlayer(uint256 avatarId) public {
        require(aetheriumAvatar.ownerOf(avatarId) == msg.sender, "GameManager: Not avatar owner");
        require(!registeredPlayers[msg.sender], "GameManager: Player already registered");
        
        playerData[msg.sender] = PlayerData({
            totalExperience: 0,
            level: 1,
            lastBattleTime: 0,
            battlesWon: 0,
            battlesLost: 0,
            isActive: true
        });
        
        avatarData[avatarId] = playerData[msg.sender];
        registeredPlayers[msg.sender] = true;
        
        emit PlayerRegistered(msg.sender, avatarId);
    }
    
    /**
     * @dev Award experience to a player and handle level ups
     * @param player Address of the player
     * @param experience Amount of experience to award
     */
    function awardExperience(address player, uint256 experience) public onlyRole(GAME_MASTER_ROLE) {
        require(registeredPlayers[player], "GameManager: Player not registered");
        
        PlayerData storage data = playerData[player];
        data.totalExperience += experience;
        
        uint8 newLevel = uint8((data.totalExperience / EXP_PER_LEVEL) + 1);
        if (newLevel > data.level) {
            data.level = newLevel;
            emit PlayerLevelUp(player, newLevel);
            
            // Update avatar level if player has one
            uint256[] memory avatars = aetheriumAvatar.getOwnerAvatars(player);
            if (avatars.length > 0) {
                aetheriumAvatar.updateAvatarProgress(avatars[0], data.totalExperience, newLevel);
                emit AvatarLevelUp(avatars[0], newLevel);
            }
        }
        
        emit ExperienceAwarded(player, experience);
    }
    
    /**
     * @dev Complete a battle and award rewards
     * @param player Address of the player
     * @param victory Whether the player won
     */
    function completeBattle(address player, bool victory) public onlyRole(GAME_MASTER_ROLE) nonReentrant {
        require(registeredPlayers[player], "GameManager: Player not registered");
        
        PlayerData storage data = playerData[player];
        require(block.timestamp >= data.lastBattleTime + BATTLE_COOLDOWN, "GameManager: Battle cooldown active");
        
        data.lastBattleTime = block.timestamp;
        
        uint256 expGained = 0;
        uint256 tokensEarned = 0;
        
        if (victory) {
            data.battlesWon++;
            expGained = 50 + (data.level * 10); // More exp for higher levels
            tokensEarned = BASE_BATTLE_REWARD + (data.level * 10 * 10**18);
        } else {
            data.battlesLost++;
            expGained = 10; // Small consolation exp
            tokensEarned = BASE_BATTLE_REWARD / 10;
        }
        
        // Award experience
        awardExperience(player, expGained);
        
        // Award tokens
        aetheriumShard.mint(player, tokensEarned);
        
        // Record battle result
        battleHistory.push(BattleResult({
            player: player,
            victory: victory,
            experienceGained: expGained,
            tokensEarned: tokensEarned,
            timestamp: block.timestamp
        }));
        
        emit BattleCompleted(player, victory, expGained, tokensEarned);
    }
    
    /**
     * @dev Execute airdrop to multiple winners
     * @param recipients Array of recipient addresses
     * @param amounts Array of token amounts to distribute
     */
    function airdropWinners(
        address[] calldata recipients, 
        uint256[] calldata amounts
    ) public onlyRole(AIRDROP_ROLE) nonReentrant {
        require(recipients.length == amounts.length, "GameManager: Arrays length mismatch");
        require(recipients.length > 0, "GameManager: Empty recipients array");
        
        uint256 totalAmount = 0;
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "GameManager: Invalid recipient address");
            require(amounts[i] > 0, "GameManager: Invalid amount");
            
            totalAmount += amounts[i];
            aetheriumShard.mint(recipients[i], amounts[i]);
        }
        
        emit AirdropExecuted(recipients, amounts, totalAmount);
    }
    
    /**
     * @dev Get player data
     * @param player Address of the player
     */
    function getPlayerData(address player) public view returns (PlayerData memory) {
        return playerData[player];
    }
    
    /**
     * @dev Get avatar data by token ID
     * @param avatarId Token ID of the avatar
     */
    function getAvatarData(uint256 avatarId) public view returns (PlayerData memory) {
        return avatarData[avatarId];
    }
    
    /**
     * @dev Get battle history length
     */
    function getBattleHistoryLength() public view returns (uint256) {
        return battleHistory.length;
    }
    
    /**
     * @dev Get battle result by index
     * @param index Index in battle history
     */
    function getBattleResult(uint256 index) public view returns (BattleResult memory) {
        require(index < battleHistory.length, "GameManager: Invalid index");
        return battleHistory[index];
    }
    
    /**
     * @dev Check if player can battle (cooldown check)
     * @param player Address of the player
     */
    function canBattle(address player) public view returns (bool) {
        if (!registeredPlayers[player]) return false;
        return block.timestamp >= playerData[player].lastBattleTime + BATTLE_COOLDOWN;
    }
    
    /**
     * @dev Calculate experience needed for next level
     * @param player Address of the player
     */
    function getExpToNextLevel(address player) public view returns (uint256) {
        if (!registeredPlayers[player]) return 0;
        
        PlayerData memory data = playerData[player];
        uint256 expForCurrentLevel = (data.level - 1) * EXP_PER_LEVEL;
        uint256 expForNextLevel = data.level * EXP_PER_LEVEL;
        
        if (data.totalExperience >= expForNextLevel) return 0;
        return expForNextLevel - data.totalExperience;
    }
}