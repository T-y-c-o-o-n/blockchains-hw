//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Callee.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol';
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol';
import "hardhat/console.sol";



/**
 * @title ERC20Basic
 * @dev Simpler version of ERC20 interface
 * @dev see https://github.com/ethereum/EIPs/issues/20
 */
interface ERC20Basic {
    function totalSupply() external view returns (uint);
    function balanceOf(address who) external view returns (uint);
    function transfer(address to, uint value) external;
    event Transfer(address indexed from, address indexed to, uint value);
}

/**
 * @title ERC20 interface
 * @dev see https://github.com/ethereum/EIPs/issues/20
 */
interface ERC20 is ERC20Basic {
    function allowance(address owner, address spender) external view returns (uint);
    function transferFrom(address from, address to, uint value) external;
    function approve(address spender, uint value) external;
    event Approval(address indexed owner, address indexed spender, uint value);
}


contract FlashSwap is IUniswapV2Callee {
    address factory;

    struct CallbackData {
        uint256 a1;
        uint256 b1;
        uint256 b2;
        uint256 b3;
        address token1;
        address token2;
        address token3;
    }

    constructor(address _factory) {
        factory = _factory;
    }

    function swap(address contract_start, uint256 amount0, uint256 amount1,
        uint256 a1, uint256 b1, uint256 b2, uint256 b3,
        address token1, address token2, address token3) public {
        console.log("start swap function");

        // can only initialize this way to avoid stack too deep error
        CallbackData memory callbackData;
        callbackData.a1 = a1;
        callbackData.b1 = b1;
        callbackData.b2 = b2;
        callbackData.b3 = b3;
        callbackData.token1 = token1;
        callbackData.token2 = token2;
        callbackData.token3 = token3;

        bytes memory data = abi.encode(callbackData);

        IUniswapV2Pair(contract_start).swap(amount0, amount1, address(this), data);

    }

    // needs to accept ETH from any V1 exchange and WETH. ideally this could be enforced, as in the router,
    // but it's not possible because it requires a call to the v1 factory, which takes too much gas
    receive() external payable {}

    // gets tokens/WETH via a V2 flash swap, swaps for the ETH/tokens on V1, repays V2, and keeps the rest!
    function uniswapV2Call(address sender, uint amount0, uint amount1, bytes calldata data) external override {

        console.log("start uniswapV2Call function");

        address[] memory path = new address[](2);
        uint amountToken;
        uint amountETH;
        { // scope for token{0,1}, avoids stack too deep errors
            address token0 = IUniswapV2Pair(msg.sender).token0();
            address token1 = IUniswapV2Pair(msg.sender).token1();
            assert(msg.sender == IUniswapV2Factory(factory).getPair(token0, token1)); // ensure that msg.sender is actually a V2 pair
        }

        CallbackData memory info = abi.decode(data, (CallbackData));

        // Now we get b1 token2
        assert(info.b1 == IERC20(info.token2).balanceOf(address(this)));
        console.log("assert b1");

        address pair23 = IUniswapV2Factory(factory).getPair(info.token2, info.token3);

        IERC20(info.token2).transfer(pair23, info.b1);

        if (IUniswapV2Pair(pair23).token0() == info.token2 && IUniswapV2Pair(pair23).token1() == info.token3) {
            IUniswapV2Pair(pair23).swap(uint256(0), info.b2, address(this), new bytes(0));
        } else {
            IUniswapV2Pair(pair23).swap(info.b2, uint256(0), address(this), new bytes(0));
        }

        // Now we get b2 token3
        assert(info.b2 == IERC20(info.token3).balanceOf(address(this)));
        console.log("assert b2");

        address pair31 = IUniswapV2Factory(factory).getPair(info.token3, info.token1);

        ERC20(info.token3).transfer(pair31, info.b2); // для совместимости

        if (IUniswapV2Pair(pair31).token0() == info.token3 && IUniswapV2Pair(pair31).token1() == info.token1) {
            IUniswapV2Pair(pair31).swap(uint256(0), info.b3, address(this), new bytes(0));
        } else {
            IUniswapV2Pair(pair31).swap(info.b3, uint256(0), address(this), new bytes(0));
        }

        // Now we get b2 token3
        assert(info.b3 < IERC20(info.token1).balanceOf(address(this)));
        console.log("assert b3");

        IERC20(info.token1).approve(msg.sender, info.a1);
        // return debt
        IERC20(info.token1).transfer(msg.sender, info.a1);
    }
 }