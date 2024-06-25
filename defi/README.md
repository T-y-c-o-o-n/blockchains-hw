## Задание:

- в форке mainnet и Hardhat/Brownie
- провести три swapа в Uniswap V2 с использованием flashloan
    - циклический маршрут, например:
        - wETH -> LINK, LINK -> USDT, USDT->wETH
    - взять flashloan
    - выполнить swaps
    - вернуть flashloan (с убытками)

## Запуск:
- Укажите ключ ALCHEMY_API_KEY в файле .env (see: **.env.example** and [alchemy doc](https://docs.alchemy.com/docs/alchemy-quickstart-guide))
- `npm install`
- `npx hardhat test`


## Результат
```aidl
  swap uniswap
balance of owner: 10000000000000000000
-------------------------------------------------------------------
balance of flashSwap: 10000000000000000000
-------------------------------------------------------------------
token0: ChainLink Token
token0 address: 0x514910771AF9Ca656af840dff83E8264EcF986CA
token0 decimal: 18
token0 reserves: 151025765736108308250934
token0 normilize: 151025.76573610833
token1: Wrapped Ether
token1 address: 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
token1 decimal: 18
token1 reserves: 693648314260000740742
token1 normilize: 693.6483142600007
ChainLink Token/Wrapped Ether 0xa2107FA5B38d9bbd2C461D6EDf11B11A50F6b974
ChainLink Token/Wrapped Ether 217.72671054095463
---------------------------------
token0: ChainLink Token
token0 address: 0x514910771AF9Ca656af840dff83E8264EcF986CA
token0 decimal: 18
token0 reserves: 36887266270529692856
token0 normilize: 36.88726627052969
token1: Tether USD
token1 address: 0xdAC17F958D2ee523a2206206994597C13D831ec7
token1 decimal: 6
token1 reserves: 213500120
token1 normilize: 213.50012
ChainLink Token/Tether USD 0x9Db10C305c671153662119D453C4D2c123725566
ChainLink Token/Tether USD 172773983782.91165
---------------------------------
token0: Wrapped Ether
token0 address: 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
token0 decimal: 18
token0 reserves: 12251408825076098924969
token0 normilize: 12251.4088250761
token1: Tether USD
token1 address: 0xdAC17F958D2ee523a2206206994597C13D831ec7
token1 decimal: 6
token1 reserves: 15343430235076
token1 normilize: 15343430.235076
Wrapped Ether/Tether USD 0x0d4a11d5EEaaC28EC3F61d100daF4d40471f1852
Wrapped Ether/Tether USD 798479129.9841573
---------------------------------
fee usdc: 
basisPointsRate = 0
maximumFee = 0
b1 = 10000000000000000
a1 = 2183850044627055691
b2 = 57689
b3 = 45925271969912
start swap function
start uniswapV2Call function
assert b1
assert b2
assert b3
you earn wei = -2183804119355085800
```
