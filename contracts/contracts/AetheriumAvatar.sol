// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title AetheriumAvatar
 * @dev ERC-721 token representing player avatars in Aetherium RPG
 */
contract AetheriumAvatar is ERC721, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    uint256 private _tokenIdCounter;
    string private _baseTokenURI;
    
    // Avatar metadata structure
    struct AvatarData {
        string name;
        uint8 class; // 0: Warrior, 1: Mage, 2: Rogue
        uint256 createdAt;
        uint256 experience;
        uint8 level;
    }
    
    mapping(uint256 => AvatarData) public avatarData;
    mapping(address => uint256[]) public ownerAvatars;
    
    event AvatarMinted(address indexed to, uint256 indexed tokenId, string name, uint8 class);
    event AvatarLevelUp(uint256 indexed tokenId, uint8 newLevel);
    
    constructor(address defaultAdmin, string memory baseURI) 
        ERC721("Aetherium Avatar", "AVATAR") 
    {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, defaultAdmin);
        _baseTokenURI = baseURI;
    }
    
    /**
     * @dev Mint a new avatar NFT
     * @param to Address to mint the avatar to
     * @param name Avatar name
     * @param avatarClass Avatar class (0: Warrior, 1: Mage, 2: Rogue)
     */
    function mintAvatar(
        address to, 
        string memory name, 
        uint8 avatarClass
    ) public onlyRole(MINTER_ROLE) returns (uint256) {
        require(avatarClass <= 2, "AetheriumAvatar: Invalid class");
        require(bytes(name).length > 0, "AetheriumAvatar: Name cannot be empty");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(to, tokenId);
        
        avatarData[tokenId] = AvatarData({
            name: name,
            class: avatarClass,
            createdAt: block.timestamp,
            experience: 0,
            level: 1
        });
        
        ownerAvatars[to].push(tokenId);
        
        emit AvatarMinted(to, tokenId, name, avatarClass);
        return tokenId;
    }
    
    /**
     * @dev Update avatar experience and level
     * @param tokenId Token ID of the avatar
     * @param newExperience New experience amount
     * @param newLevel New level
     */
    function updateAvatarProgress(
        uint256 tokenId, 
        uint256 newExperience, 
        uint8 newLevel
    ) public onlyRole(MINTER_ROLE) {
        require(_ownerOf(tokenId) != address(0), "AetheriumAvatar: Avatar does not exist");
        
        AvatarData storage avatar = avatarData[tokenId];
        avatar.experience = newExperience;
        
        if (newLevel > avatar.level) {
            avatar.level = newLevel;
            emit AvatarLevelUp(tokenId, newLevel);
        }
    }
    
    /**
     * @dev Get avatar data
     * @param tokenId Token ID of the avatar
     */
    function getAvatarData(uint256 tokenId) public view returns (AvatarData memory) {
        require(_ownerOf(tokenId) != address(0), "AetheriumAvatar: Avatar does not exist");
        return avatarData[tokenId];
    }
    
    /**
     * @dev Get all avatars owned by an address
     * @param owner Address to query
     */
    function getOwnerAvatars(address owner) public view returns (uint256[] memory) {
        return ownerAvatars[owner];
    }
    
    /**
     * @dev Set base URI for token metadata
     * @param baseURI New base URI
     */
    function setBaseURI(string memory baseURI) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _baseTokenURI = baseURI;
    }
    
    /**
     * @dev Returns the base URI for tokens
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
    
    /**
     * @dev Returns the token URI for a given token ID
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "AetheriumAvatar: URI query for nonexistent token");
        return string(abi.encodePacked(_baseURI(), tokenId));
    }
    
    /**
     * @dev Override required by Solidity
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}