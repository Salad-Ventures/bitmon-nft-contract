// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract BitsmonNFT is ERC1155, Ownable, ReentrancyGuard {
    // Define constants for different rarities
    uint256 public constant COMMON = 0;
    uint256 public constant UNCOMMON = 1;
    uint256 public constant RARE = 2;
    uint256 public constant MYTHIC = 3;
    uint256 public constant LEGENDARY = 4;
    string public name = "Bitsmon";
    string public symbol = "BTSM";

    // Whitelist for User mint allowence
    mapping(address => uint256) public whitelist;
    mapping(address => bool) public admins;
    uint256 private nonce = 0;

    event MintBitsmon(
        address indexed account,
        uint256[] ids,
        uint256[] amounts,
        uint256 allowence
    );

    event WhitelistUpdated(address indexed account, uint256 newAllowance);

    event UpdateAdmin(address indexed account, bool isAdmin);

    event UpdateURI(string uri);

    event Debug(string message, uint256 value);

    constructor()
        ERC1155(
            "https://peach-electric-cow-235.mypinata.cloud/ipfs/QmaRT9uhxxWjztfcAo9sKXHry8a6xKQAdV5BxHcD5NqV6v/"
        )
        Ownable(msg.sender)
    {}

    modifier onlyAdmin() {
        require(admins[msg.sender], "Caller is not an admin");
        _;
    }

    // Function to set the URI for all token types, for updating metadata
    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
        emit UpdateURI(newuri);
    }

    function setAdmin(address account, bool isAdmin) public onlyOwner {
        admins[account] = isAdmin;
        emit UpdateAdmin(account, admins[account]);
    }

    function addWhitelist(address account, uint256 allowance) public onlyAdmin {
        require(allowance > 0, "Allowance increment has to be positive");
        whitelist[account] += allowance;
        emit WhitelistUpdated(account, whitelist[account]);
    }

    function decreaseWhitelist(
        address account,
        uint256 allowance
    ) public onlyAdmin {
        require(
            whitelist[account] >= allowance,
            "Allowance to decrease exceeds current allowance"
        );
        whitelist[account] -= allowance;
        emit WhitelistUpdated(account, whitelist[account]);
    }

    function getWhitelist(address account) public view returns (uint256) {
        return whitelist[account];
    }

    function safeMint(address account, uint256 count) public nonReentrant {
        require(count > 0, "Cannot mint 0 or negtive amount");
        require(count <= 10, "Maximun 10 mint at a time");
        require(count <= whitelist[account], "Insufficent mint allowence");
        emit Debug("All prerequisites check passed", count);

        uint256[] memory counts = _getTokenIdByProbability(count);

        emit Debug("All token count generated", count);

        uint256 totalTokens = 0;
        uint256 singleTokenId = 0;
        bool hasSingleToken = false;

        for (uint256 i = 0; i < counts.length; i++) {
            if (counts[i] > 0) {
                totalTokens++;
                singleTokenId = i;
                if (totalTokens > 1) {
                    hasSingleToken = false;
                } else {
                    hasSingleToken = true;
                }
            }
        }

        emit Debug("If single checked", count);

        uint256[] memory ids = new uint256[](
            (hasSingleToken && totalTokens == 1) ? 1 : totalTokens
        );
        uint256[] memory amounts = new uint256[](
            (hasSingleToken && totalTokens == 1) ? 1 : totalTokens
        );
        emit Debug("premint", count);
        if (hasSingleToken && totalTokens == 1) {
            ids[0] = singleTokenId;
            amounts[0] = counts[singleTokenId];
            _mint(account, singleTokenId, counts[singleTokenId], "");
        } else {
            uint256 index = 0;
            for (uint256 i = 0; i < counts.length; i++) {
                if (counts[i] > 0) {
                    ids[index] = i;
                    amounts[index] = counts[i];
                    index++;
                }
            }
            _mintBatch(account, ids, amounts, "");
        }

        whitelist[account] = whitelist[account] - count;
        emit MintBitsmon(account, ids, amounts, whitelist[account]);
    }

    function _getTokenIdByProbability(
        uint256 count
    ) private returns (uint256[] memory) {
        uint256[] memory results = new uint256[](5);
        for (uint256 i = 0; i < count; i++) {
            uint256 random = uint256(
                keccak256(
                    abi.encodePacked(
                        blockhash(block.number - 1),
                        msg.sender,
                        nonce
                    )
                )
            ) % 10000;
            nonce += (uint256(
                keccak256(
                    abi.encodePacked(
                        block.timestamp,
                        block.prevrandao,
                        msg.sender
                    )
                )
            ) % (count + 1));

            if (random < 7000) {
                results[COMMON]++;
            } else if (random < 9000) {
                results[UNCOMMON]++;
            } else if (random < 9800) {
                results[RARE]++;
            } else if (random < 9999) {
                results[MYTHIC]++;
            } else {
                results[LEGENDARY]++;
            }
        }
        return results;
    }

    function uri(uint256 _id) public view override returns (string memory) {
        return
            string(
                abi.encodePacked(super.uri(_id), Strings.toString(_id), ".json")
            );
    }
}
