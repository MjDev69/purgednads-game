// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GameScoreNFT is ERC721, ERC721URIStorage, Ownable {
    // Counter for token IDs
    uint256 private _nextTokenId;

    // Mapping to store scores
    mapping(uint256 => uint256) public scores;
    
    // Event emitted when a new score is minted
    event ScoreMinted(address player, uint256 tokenId, uint256 score);

    constructor() 
        ERC721("Purge Game Score", "PURGE")
        Ownable(msg.sender)
    {}

    // Function to mint a new score NFT
    function mintScore(uint256 score) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        scores[tokenId] = score;
        
        emit ScoreMinted(msg.sender, tokenId, score);
        return tokenId;
    }

    // Function to get score for a specific token
    function getScore(uint256 tokenId) public view returns (uint256) {
        require(_ownerOf(tokenId) != address(0), "Score query for nonexistent token");
        return scores[tokenId];
    }

    // Required overrides
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}