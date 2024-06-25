const { ethers } = require("hardhat");
const { createPair, deploy, USDT_TOKEN_ADDRESS} = require("../scripts/lib");
const { expect } = require("chai");
const UniswapV2Router = require("@uniswap/v2-periphery/build/UniswapV2Router02.json");
const UniswapV2Pair = require("@uniswap/v2-core/build/UniswapV2Pair.json");
const IERC20 = require("@uniswap/v2-core/build/IERC20.json")

const START_BALANCE_MY_TOKEN = 10_000_000_000
const START_BALANCE_USDT = 1_000_000

const UNISWAP_V2_ROUTER_ADDRESS = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'

const AMOUNT_MY_TOKEN_DESIRED = 10_000

const AMOUNT_USDC_TOKEN_DESIRED = 10_000

const USDC_TOKEN_MIN_AMOUNT_EXCHANGE = 10

const MY_TOKEN_SWAP_AMOUNT = 100

const USDT_WHALE_ADDRESS = "0x5754284f345afc66a98fbb0a0afe71e0f007b949"

describe("Token contract", function () {

    it("deploy token, create uniswap pair and make an exchange", async function () {
        const [owner] = await ethers.getSigners();

        const myTokenAddress = await deploy(owner, START_BALANCE_MY_TOKEN)

        const myToken = await ethers.getContractAt("MyToken", myTokenAddress, owner);

        const balance = await myToken.balanceOf(owner.address)

        console.log("MyToken balance: " +  balance);
        expect(balance).to.equal(START_BALANCE_MY_TOKEN);

        const impersonatedSigner = await ethers.getImpersonatedSigner(USDT_WHALE_ADDRESS);
        const usdtContractImpersonated = await ethers.getContractAt(IERC20.abi, USDT_TOKEN_ADDRESS, impersonatedSigner);
        await usdtContractImpersonated.transfer(owner.address, START_BALANCE_USDT)
        expect(await usdtContractImpersonated.balanceOf(owner.address)).to.equal(START_BALANCE_USDT);

        const balanced = await usdtContractImpersonated.balanceOf(owner.address)
        console.log("USDT balance: " +  balanced);

        const pairAddress = await createPair(myTokenAddress)

        // The Contract object
        const uniswapV2PairContract = await ethers.getContractAt(UniswapV2Pair.abi, pairAddress, owner);
        console.log("get uniswap V2 Factory contract:" + uniswapV2PairContract.address);


        // The Contract object
        const uniswapV2RouterContract = await ethers.getContractAt(UniswapV2Router.abi, UNISWAP_V2_ROUTER_ADDRESS, owner);
        console.log("get uniswap V2 Router contract:" + uniswapV2RouterContract.address);

        const blockNumber = await ethers.provider.getBlockNumber();
        const block = await ethers.provider.getBlock(blockNumber);
        const blockTimestamp = block.timestamp;
        const deadline = blockTimestamp + 60 * 20;

        const usdtContract = await ethers.getContractAt(IERC20.abi, USDT_TOKEN_ADDRESS, owner);

        await usdtContract.approve(UNISWAP_V2_ROUTER_ADDRESS, AMOUNT_USDC_TOKEN_DESIRED)
        await myToken.approve(UNISWAP_V2_ROUTER_ADDRESS, AMOUNT_MY_TOKEN_DESIRED)

        console.log("adding liquidity to UniswapV2Pair via UniswapV2Router");
        await uniswapV2RouterContract.addLiquidity(
            myTokenAddress,
            USDT_TOKEN_ADDRESS,
            AMOUNT_MY_TOKEN_DESIRED,
            AMOUNT_USDC_TOKEN_DESIRED,
            0,
            0,
            owner.address,
            deadline
        );

        console.log(await uniswapV2PairContract.totalSupply());

        expect(await uniswapV2PairContract.totalSupply()).to.equal(AMOUNT_MY_TOKEN_DESIRED);

        console.log("swap MyToke to USDT");

        const myTokenBalanceBefore = await myToken.balanceOf(owner.address);
        const usdcBalanceBefore = await usdtContract.balanceOf(owner.address);

        console.log("my token balance before:" + myTokenBalanceBefore);
        console.log("usdt balance before:" + usdcBalanceBefore);

        await myToken.approve(
            UNISWAP_V2_ROUTER_ADDRESS,
            MY_TOKEN_SWAP_AMOUNT
        );
        await uniswapV2RouterContract.swapExactTokensForTokens(
            MY_TOKEN_SWAP_AMOUNT,
            USDC_TOKEN_MIN_AMOUNT_EXCHANGE,
            [myToken.address, USDT_TOKEN_ADDRESS],
            owner.address,
            deadline
        );

        const myTokenBalanceAfter = await myToken.balanceOf(owner.address);
        const usdcBalanceAfter = await usdtContract.balanceOf(owner.address);

        console.log("my token balance after:" + myTokenBalanceAfter);
        console.log("usdt balance after:" + usdcBalanceAfter);

        expect(myTokenBalanceBefore.sub(myTokenBalanceAfter)).to.equal(MY_TOKEN_SWAP_AMOUNT)
        expect(usdcBalanceAfter.sub(usdcBalanceBefore).toNumber()).to.greaterThanOrEqual(USDC_TOKEN_MIN_AMOUNT_EXCHANGE)
    })
});