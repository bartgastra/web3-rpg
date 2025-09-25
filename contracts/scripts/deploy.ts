import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy AetheriumShard (ERC-20)
  console.log("\nDeploying AetheriumShard...");
  const AetheriumShard = await ethers.getContractFactory("AetheriumShard");
  const aetheriumShard = await AetheriumShard.deploy(deployer.address);
  await aetheriumShard.waitForDeployment();
  const aetheriumShardAddress = await aetheriumShard.getAddress();
  console.log("AetheriumShard deployed to:", aetheriumShardAddress);

  // Deploy AetheriumAvatar (ERC-721)
  console.log("\nDeploying AetheriumAvatar...");
  const AetheriumAvatar = await ethers.getContractFactory("AetheriumAvatar");
  const baseURI = "https://api.aetherium-rpg.com/metadata/avatar/";
  const aetheriumAvatar = await AetheriumAvatar.deploy(deployer.address, baseURI);
  await aetheriumAvatar.waitForDeployment();
  const aetheriumAvatarAddress = await aetheriumAvatar.getAddress();
  console.log("AetheriumAvatar deployed to:", aetheriumAvatarAddress);

  // Deploy GameManager
  console.log("\nDeploying GameManager...");
  const GameManager = await ethers.getContractFactory("GameManager");
  const gameManager = await GameManager.deploy(
    aetheriumShardAddress,
    aetheriumAvatarAddress,
    deployer.address
  );
  await gameManager.waitForDeployment();
  const gameManagerAddress = await gameManager.getAddress();
  console.log("GameManager deployed to:", gameManagerAddress);

  // Grant roles
  console.log("\nGranting roles...");

  // Grant MINTER_ROLE to GameManager for both tokens
  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  await aetheriumShard.grantRole(MINTER_ROLE, gameManagerAddress);
  await aetheriumAvatar.grantRole(MINTER_ROLE, gameManagerAddress);

  console.log("MINTER_ROLE granted to GameManager for both tokens");

  // Save deployment addresses
  const deploymentInfo = {
    network: "localhost",
    deployer: deployer.address,
    contracts: {
      AetheriumShard: aetheriumShardAddress,
      AetheriumAvatar: aetheriumAvatarAddress,
      GameManager: gameManagerAddress
    },
    timestamp: new Date().toISOString()
  };

  console.log("\n=== Deployment Summary ===");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save to file for backend to use
  const backendConfigPath = path.join(__dirname, '../../backend/src/config/contracts.json');
  const backendConfigDir = path.dirname(backendConfigPath);

  // Ensure directory exists
  if (!fs.existsSync(backendConfigDir)) {
    fs.mkdirSync(backendConfigDir, { recursive: true });
  }

  fs.writeFileSync(backendConfigPath, JSON.stringify(deploymentInfo, null, 2));

  console.log("\nContract addresses saved to backend/src/config/contracts.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });