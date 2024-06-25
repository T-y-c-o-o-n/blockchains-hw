##Задание:

- создать в форке mainnet собственный токен
- сделать swap-пару в Uniswap v2
- провести обмен одного токена на другой
- в Hardhat или Brownie

##Запуск:
- Укажите ключ ALCHEMY_API_KEY в файле .env (see: **.env.example** and [alchemy doc](https://docs.alchemy.com/docs/alchemy-quickstart-guide))
- `npm install`
- `npx hardhat test`

##Результат
```
Deploying contracts with the account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Account balance: 10000000000000000000000
MyToken address: 0xF66CfDf074D2FFD6A4037be3A669Ed04380Aef2B
MyToken balance: 10000000000
USDT balance: 1000000
get uniswap V2 Factory contract
uniswap V2 pair address: 0xdC16a8449639308720b082d283b94cB772B4CdA2
get uniswap V2 Factory contract:0xdC16a8449639308720b082d283b94cB772B4CdA2
get uniswap V2 Router contract:0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D
adding liquidity to UniswapV2Pair via UniswapV2Router
swap MyToke to USDT
my token balance before:9999900000
usdt balance before:990000
my token balance after:9999899900
usdt balance after:990009
```

