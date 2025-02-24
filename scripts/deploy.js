const hre = require("hardhat");

async function main() {
  // Get the contract factory
  const GameScoreNFT = await hre.ethers.getContractFactory("GameScoreNFT");

  // Deploy the contract
  console.log("Deploying GameScoreNFT...");
  const gameScoreNFT = await GameScoreNFT.deploy();
  await gameScoreNFT.deployed();

  console.log("GameScoreNFT deployed to:", gameScoreNFT.address);
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });