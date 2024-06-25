// add the code below
const {ethers} = require("hardhat");
const UniswapV2Factory = require("@uniswap/v2-core/build/UniswapV2Factory.json");

// Uniswap addresses
const UNISWAP_V2_FACTORY_MAINNET_ADDRESS =
    '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'

const USDT_TOKEN_ADDRESS =
    '0xdAC17F958D2ee523a2206206994597C13D831ec7'

async function deploy(deployer, start_balance) {

    console.log("Deploying contracts with the account:", deployer.address);

    console.log("Account balance:", (await deployer.getBalance()).toString());

    const Token = await ethers.getContractFactory("MyToken");
    const token = await Token.deploy('MyToken', 'MT', start_balance);

    console.log("MyToken address:", token.address);
    return token.address
}

async function createPair(myTokenAddress) {
    // The provider also allows signing transactions to
    // send ether and pay to change state within the blockchain.
    // For this, we need the account signer...
    const [signer] = await ethers.getSigners();

    // The Contract object
    const contract = await ethers.getContractAt(UniswapV2Factory.abi, UNISWAP_V2_FACTORY_MAINNET_ADDRESS, signer);
    console.log("get uniswap V2 Factory contract");

    const pairTransaction = await contract.createPair(myTokenAddress, USDT_TOKEN_ADDRESS)
    // can't get result of function. More info here:
    // https://ethereum.stackexchange.com/questions/88119/i-see-no-way-to-obtain-the-return-value-of-a-non-view-function-ethers-js
    const pairInfo = await pairTransaction.wait()
    const pair = pairInfo.events.find(event => event.event === 'PairCreated');
    const pairAddress = pair.args.pair
    console.log("uniswap V2 pair address:", pairAddress);
    return pairAddress
}


module.exports = { deploy, createPair, USDT_TOKEN_ADDRESS }