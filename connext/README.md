## Indra <> Mumbai 
Connext integration with Matic's Mumbai testnet

Goerli<>Mumbai Node hosted at: `https://indra-mumbai.matic.today`

### Setup config

`config.json` in `./`

```json
{
  "alice": "PRIVATE_KEY",
  "parentChain": "https://goerli.infura.io/v3/9b2d88cc1db243a1acf9819af5f4302d",
  "parentChainId": 5,
  "childChain": "https://rpc-mumbai.matic.today",
  "indraNodeUrl": "https://indra-mumbai.matic.today",
  "amountInWei": "50000000000"
}

```

### Instantiating a Channel

run:
```bash
$ npm i
$ node test
```
1. Creates 2 channels
    An ephemeral channel for Alice on Mumbai (E,M) and a channel for Alice on Goerli (A,G)
2. Transfers some amount to ephemeral account from Alice's account on Mumbai A -> E
3. Deposits amount specified in config from Ephemeral channel on Mumbai E -> (E,M)
4. Transfers from ephemeral channel to alice's channel on goerli (E,M) -> (A,G)
5. Withdraws from Alice's channel on Goerli (A,G) -> A


### Notes

1. Channel = (user address + network)
2. 1:1 mapping exists between key and channel => a single user cannot have two channels on the same node with different networks
3. Make sure `alice` has enough balance for gas on Mumbai and the node account has enough balance to pay for gas on Goerli

