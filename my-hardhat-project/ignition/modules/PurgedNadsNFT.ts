// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PurgedNadsNFTModule = buildModule("PurgedNadsNFTModule", (m) => {
    // Define the base URI for your NFT metadata
    const baseURI = "https://testnetpurgednads.vercel.app/nft-assets/metadata/purgednadsnft";
    
    // Deploy the PurgedNadsNFT contract with the baseURI parameter
    const purgedNadsNFT = m.contract("PurgedNadsNFT", [baseURI]);

    return { purgedNadsNFT };
});

module.exports = PurgedNadsNFTModule;
