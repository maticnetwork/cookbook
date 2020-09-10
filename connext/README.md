## Indra <> Mumbai 
Connext integration with Matic's Mumbai testnet

- Goerli<>Mumbai Node hosted at: `https://indra-mumbai.matic.today`
- Node account: `0x77090680C358f57E3b9406044E0597E7504791fA`

### Setup config

`config.json` in `./`

```json
{
  "alice": "PRIVATE_KEY",
  "parentChain": "https://goerli.infura.io/v3/<API_KEY>",
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


### Notes

1. Channel = (user address + network)
2. 1:1 mapping exists between key and channel => a single user cannot have two channels on the same node with different networks
3. Make sure `alice` has enough balance for gas on Mumbai and the node account has enough balance to pay for gas on Goerli
4. Make sure the `ephemeral account` is funded **enough** for gas
5. Fresh accounts take more time for balance updates
6. Transfer quite often does not update???
