const { connect } = require('@connext/client')
const { getFileStore } = require('@connext/store')
const { Wallet, utils } = require('ethers')
const { alice, childChain, parentChain, indraNodeUrl } = require('./config.json')

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
 * Create and connect to channels
 * Returns two channels, channels[0] is the ephemeral channel created deterministically from the given private key (params) connected to Mumbai
 * and channels[1] is the channel for the given user connected to Goerli
 */
async function connectToChannels() {
  let wallet = new Wallet(alice)

  let signedMessage = await wallet.signMessage('Initiating connext fast withdraw')
  let hashedMessage = await utils.hashMessage(signedMessage)
  let nodeFromSeed = utils.HDNode.fromSeed(hashedMessage)
  let ephemeralWallet = new Wallet(nodeFromSeed.privateKey)

  const ephemeralMumbaiParams = getConnectionParams(
    childChain,
    ephemeralWallet.privateKey
  )
  const aliceGoerliParams = getConnectionParams(
    parentChain,
    alice
  )
  let _channels = await Promise.all ([
    connect(ephemeralMumbaiParams), 
    connect(aliceGoerliParams)
  ])
  return { channels: _channels }
}

/**
 * Export connectToChannels function
 */

module.exports = {
  connectToChannels
}
