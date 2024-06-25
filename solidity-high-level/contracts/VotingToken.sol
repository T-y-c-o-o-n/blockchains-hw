pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "hardhat/console.sol";

contract VotingToken is ERC20 {

    uint public constant TOTAL_SUPPLY = 100_000_000;

    /**
     * @dev address of the owner contract
     */
    address public immutable _owner;

    /**
     * @dev address of the ballot contract
     */
    address private _ballot;

    /**
     * @dev Emitted when there is a problems with ballot contract happened
     */
    event BallotError(address _ballot);

    constructor (string memory name_, string memory symbol_) ERC20(name_, symbol_) {
        _mint(msg.sender, TOTAL_SUPPLY);
        _owner = msg.sender;
    }

    /**
     * set address of the Ballot contract
     * Note: only owner can change address of the Ballot contract
     */
    function setBallot(address ballot_) public {
        require(_owner == msg.sender, "Only owner can set Ballot");
        _ballot = ballot_;
    }

    function decimals() public view virtual override returns (uint8) {
        return 6;
    }

    /**
     * @dev See {IERC20-transfer}.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - the caller must have a balance of at least `amount`.
     */
    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        address owner = _msgSender();
        _transfer(owner, to, amount);
        if (_ballot != address(0)) {
            (bool success, ) = _ballot.call(abi.encodeWithSignature("transferFrom(address,address,uint256)", msg.sender, to, amount));
            require(success, "Can't update info in Ballot contract");
            console.log(
                "Transferring from %s to %s %s tokens",
                msg.sender,
                to,
                amount
            );
        }
        return true;
    }

    /**
     * @dev See {IERC20-transferFrom}.
     *
     * Emits an {Approval} event indicating the updated allowance. This is not
     * required by the EIP. See the note at the beginning of {ERC20}.
     *
     * NOTE: Does not update the allowance if the current allowance
     * is the maximum `uint256`.
     *
     * Requirements:
     *
     * - `from` and `to` cannot be the zero address.
     * - `from` must have a balance of at least `amount`.
     * - the caller must have allowance for ``from``'s tokens of at least
     * `amount`.
     */
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public virtual override returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, amount);
        _transfer(from, to, amount);
        if (_ballot != address(0)) {
            (bool success, ) = _ballot.call(abi.encodeWithSignature("transferFrom(address,address,uint)", from, to, amount));
            require(success, "Can't update info in Ballot contract");
            console.log(
                "Transferring from %s to %s %s tokens: %s %s",
                    from,
                    to,
                    amount
            );
        }
        return true;
    }
}
