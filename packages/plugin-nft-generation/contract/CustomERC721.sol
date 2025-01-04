// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract NFTContractName is ERC721Enumerable {
    uint256 public maxSupply;
    uint256 public currentTokenId;
    address public owner;
    uint256 public royalty;

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _maxSupply,
        uint256 _royalty
    ) ERC721(_name, _symbol) {
        maxSupply = _maxSupply;
        royalty = _royalty;
        owner = msg.sender;
    }

    function mint(address _to) public {
        require(currentTokenId < maxSupply, "Max supply reached");
        currentTokenId++;
        _mint(_to, currentTokenId);
    }
}
