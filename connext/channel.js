const { connect } = require('@connext/client')
const { getFileStore } = require('@connext/store')
const { Wallet, utils } = require('ethers')
const { alice, childChain, parentChain, indraNodeUrl } = require('./config.json')
const logger = require('node-color-log')

/**
 * returns connection parameters for the `connect` function, to instantiate a channel
 * @param {string} rpc rpc of the blockchain network 
 * @param {string} pvtKey private key of the user
 * 
 */
function getConnectionParams (rpc, pvtKey) {
  return ({
    ethProviderUrl: rpc,
    signer: new Wallet(pvtKey).privateKey,
    nodeUrl: indraNodeUrl,
    store: getFileStore('filestore'),
    logLevel: 1
  })
}
/**
 * generates and returns a wallet for a given wallet - used to instantiate channel on Indra node
 * @param {signer(ethers) object} wallet that signs on a string to generate a priv key
 * @param {string} string ideally name of the network (or chain id) where the generated wallet will be used
 */
async function generateWallet (wallet, string) {
  let message = `Initiating connext channel on ${string}`
  logger.info('signing on message', message)
  let signedMessage = await wallet.signMessage(message)
  let hashedMessage = await utils.hashMessage(signedMessage)
  let generatedWallet = new Wallet(utils.HDNode.fromSeed(hashedMessage).privateKey)
  return generatedWallet
}

/**
 * Instantiates and returns 2 generated channels for a given private key
 * The two channels are instantiated from deterministically created wallets
 * returns an object of the two channels
 */
async function connectToChannels() {
  let wallet = new Wallet(alice)
  
  logger
    .bold().bgColor('blue').log('Alice')
    .bold().log('address: ').joint().log(wallet.address)
    .bold().log('private key: ').joint().log(wallet.privateKey)
    .log()

  walletMumbai = await generateWallet(wallet, 'Mumbai')
  walletGoerli = await generateWallet(wallet, 'Goerli')
  const mumbaiChannelParams = getConnectionParams(
    childChain,
    walletMumbai.privateKey
  )
  const goerliChannelParams = getConnectionParams(
    parentChain,
    walletGoerli.privateKey
  )
  
  let _channels = await Promise.all ([
    connect(mumbaiChannelParams), 
    connect(goerliChannelParams)
  ])
  return { channels: _channels }
}

/**
 * Export connectToChannels function
 */

module.exports = {
  connectToChannels
}
