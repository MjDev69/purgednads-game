async function main() {
    const [deployer] = await ethers.getSigners();
    
    console.log("Deploying PurgedNadsNFT with account:", deployer.address);
    
    // Base URI for the single metadata
    const baseURI = "https://testnetpurgednads.vercel.app/nft-assets/metadata/";
    // If using IPFS: const baseURI = "ipfs://YOUR_IPFS_CID/";
    
    const PurgedNadsNFT = await ethers.getContractFactory("PurgedNadsNFT");
    const nft = await PurgedNadsNFT.deploy(baseURI);
    
    await nft.deployed();
    
    console.log("PurgedNadsNFT deployed to:", nft.address);
  }