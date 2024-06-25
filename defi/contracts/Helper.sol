//SPDX-License-Identifier: Unlicense
pragma solidity >=0.6.6;

import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol';
import "./lib/SafeMathCopy.sol";

contract Helper {

    IUniswapV2Factory private _factory;

    address private uf = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;

    /**
     * @dev Get pair address
     */
    event GetPair(address pairEddress);

    constructor(address factory) {
        _factory = IUniswapV2Factory(factory);
    }

    /**
     * @dev emit pair address
     */
    function getPair(address token0, address token1) public {
        emit GetPair(_factory.getPair(token0, token1));
    }

    // given an input amount of an asset and pair reserves, returns the maximum output amount of the other asset
    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut) public view returns (uint256 amountOut) {
        require(amountIn > 0, 'UniswapV2Library: INSUFFICIENT_INPUT_AMOUNT');
        require(reserveIn > 0 && reserveOut > 0, 'UniswapV2Library: INSUFFICIENT_LIQUIDITY');
        uint256 amountInWithFee = amountIn * 997;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = reserveIn * 1000 + amountInWithFee;
        amountOut = numerator / denominator;
    }

    // given an output amount of an asset and pair reserves, returns a required input amount of the other asset
    function getAmountIn(uint256 amountOut, uint256 reserveIn, uint256 reserveOut) public view returns (uint256 amountIn) {
        require(amountOut > 0, 'UniswapV2Library: INSUFFICIENT_OUTPUT_AMOUNT');
        require(reserveIn > 0 && reserveOut > 0, 'UniswapV2Library: INSUFFICIENT_LIQUIDITY');
        uint256 numerator = reserveIn * amountOut * 1000;
        uint256 denominator = (reserveOut - amountOut) * 997;
        amountIn = (numerator / denominator) + 1;
    }
}
