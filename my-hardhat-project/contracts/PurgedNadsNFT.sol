// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract PurgedNadsNFT is ERC721, ERC721Enumerable, Ownable {
    using Strings for uint256;
    
    // Maximum supply of NFTs
    uint256 public constant MAX_SUPPLY = 2500;
    
    // Mint price in wei (0.05 MON)
    uint256 public mintPrice = 0.05 ether;
    
    // Base URI for metadata
    string private _baseTokenURI;
    
    // Contract constructor
    constructor(string memory baseURI) ERC721("Purged Nads NFT", "PURGEDNADS") Ownable(msg.sender) {
        _baseTokenURI = baseURI;
    }
    
    /**
     * @dev Allows users to mint an NFT
     * @return tokenId The ID of the newly minted token
     */
    function mintNFT() public payable returns (uint256) {
        // Check if max supply is reached
        require(totalSupply() < MAX_SUPPLY, "Max supply reached");
        
        // Check if payment is sufficient
        require(msg.value >= mintPrice, "Insufficient payment");
        
        // Get next token ID (starting from 1)
        uint256 tokenId = totalSupply() + 1;
        
        // Mint the NFT to the caller
        _safeMint(msg.sender, tokenId);
        
        return tokenId;
    }
    
    /**
     * @dev Override tokenURI to return the same metadata for all tokens
     */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        // Check if the token exists by validating owner is not zero address
        address owner = _ownerOf(tokenId);
        require(owner != address(0), "URI query for nonexistent token");
        
        // Return the baseURI with ".json" appended
        return string(abi.encodePacked(_baseURI(), ".json"));
    }
    
    /**
     * @dev Allows owner to update the mint price
     * @param newPrice New price in wei
     */
    function setMintPrice(uint256 newPrice) public onlyOwner {
        mintPrice = newPrice;
    }
    
    /**
     * @dev Allows owner to update the base URI
     * @param newBaseURI New base URI
     */
    function setBaseURI(string memory newBaseURI) public onlyOwner {
        _baseTokenURI = newBaseURI;
    }
    
    /**
     * @dev Returns the total supply of NFTs
     * @return Current total supply
     */
    function totalSupply() public view override(ERC721Enumerable) returns (uint256) {
        return super.totalSupply();
    }
    
    /**
     * @dev Returns the maximum supply of NFTs
     * @return Maximum supply
     */
    function maxSupply() public pure returns (uint256) {
        return MAX_SUPPLY;
    }
    
    /**
     * @dev Withdraws all funds from the contract to the owner
     */
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @dev Base URI for computing {tokenURI}
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
    
    // The following functions are overrides required by Solidity
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}