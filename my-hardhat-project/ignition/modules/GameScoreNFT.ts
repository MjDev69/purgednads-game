// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const GameScoreNFTModule = buildModule("GameScoreNFTModule", (m) => {
    const gamescorenft = m.contract("GameScoreNFT");

    return { gamescorenft };
});

module.exports = GameScoreNFTModule;
