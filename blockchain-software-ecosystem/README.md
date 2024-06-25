# Chainlink price monitor

## About

Logging script, tracking price changes on chainlink token pairs:

```
1. USDT/ETH 
2. USDC/ETH 
3. LINK/ETH 
```

The implementation uses the `AnswerUpdated` events in the aggregator contracts as a signal.

The script connects to the Chainlink channel:
```
1. ETH_USD = "0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419"
2. LINK_ETH = "0xdc530d9457755926550b59e8eccdae7624181557"
3. USDT_USD = "0x3e7d1eab13ad0104d2750b8863b489d65364e32d"
```
Then take address of current aggregator. (see ```get_fresh_addresses.py``` method). And start 
monitoring this address for `AnswerUpdated` events.

## Build

1. create ```.env``` file with API_KEY and URL constant (see ```.env.example``` file and [Alchemy Quickstart Guide](https://docs.alchemy.com/docs/alchemy-quickstart-guide) ) 
2. download all requirements lib

```
python -m pip install -r requirements.txt
```

## Run

To run binaries –– run:

```
python src/monitor.py
```
