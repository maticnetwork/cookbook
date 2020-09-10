const { connectToChannels } = require('./channel.js')
const { alice, amountInWei, childChain, parentChain, parentChainId } = require('./config.json')
const { Wallet, providers, utils } = require('ethers')
const logger = require('node-color-log')
const channel = require('./channel.js')

const mumbaiProvider = new providers.JsonRpcProvider (childChain)
const goerliProvider = new providers.JsonRpcProvider (parentChain)

// add delay
function wait (delayms) {
  return new Promise(function(resolve, reject) {
    setTimeout(resolve, delayms)
  })
}

/**
 * Displays
 * public identifier, free balance of the user on the channel, on Mumbai network and on Goerli network
 * @param {string} pvtKey private key of the channel participant
 * @param {Channel} channel the channel on which to query for the balance
 */
async function getBalances(pvtKey, channel = false, network = false) {
  let wallet = new Wallet(pvtKey)
  
  logger
    .log('address: ')
    .joint()
    .bold().log(wallet.address)

  if (channel) {
    let freeBalance = await channel.getFreeBalance()
    if (freeBalance[wallet.address]) {
      logger
        .log('free balance: ')
        .joint()
        .bold().log(utils.formatEther(freeBalance[wallet.address]))
    }
  }
  let onMumbai = wallet.connect(mumbaiProvider)
  let onGoerli = wallet.connect(goerliProvider)

  let balances = await Promise.all([
    await onMumbai.getBalance(),
    await onGoerli.getBalance()
  ])

  if (network == 'mumbai') {
    logger
      .log('on mumbai: ')
      .joint()
      .bold().log(utils.formatEther(balances[0]))
      .log()
  } else if (network == 'goerli') {
    logger
      .log('on goerli: ')
      .joint()
      .bold().log(utils.formatEther(balances[1]))
      .log()
  } else {
    logger
      .log('on mumbai: ')
      .joint()
      .bold().log(utils.formatEther(balances[0]))
    logger
      .log('on goerli: ')
      .joint()
      .bold().log(utils.formatEther(balances[1]))
      .log()
  }
}

async function logAllBalances (alice, channel1, channel2) {
  logger
    .log()
    .color('black')
    .bgColor('yellow')
    .log('Balances')
    .log()
  logger.bold().color('blue').log('Alice')
  await getBalances (alice) 
  logger.bold().color('blue').log('channel on mumbai')
  await getBalances (channel1.pvtKey, channel1.channel, 'mumbai')
  logger.bold().color('blue').log('channel on goerli')
  await getBalances (channel2.pvtKey, channel2.channel, 'goerli')
}

function logClientsInfo (client) {
  logger
    .bold().bgColor('blue').log('channel on mumbai')
    .bold().log('account address: ').joint().log(client.mumbai.address)
    .bold().log('private key: ').joint().log(client.mumbai.pvtKey)
    .bold().log('multisig: ').joint().log(client.mumbai.multisig)
    .bold().log('public identifier: ').joint().log(client.mumbai.identifier)
    .log()
  logger
    .bold().bgColor('blue').log('channel on Goerli')
    .bold().log('account address: ').joint().log(client.goerli.address)
    .bold().log('private key: ').joint().log(client.goerli.pvtKey)
    .bold().log('multisig: ').joint().log(client.goerli.multisig)
    .bold().log('public identifier: ').joint().log(client.goerli.identifier)
    .log()
}

async function deposit (wallet, channel, assetId, amount) {
  logger.info('requesting deposit rights for assetId =', assetId)
  let request = await channel.requestDepositRights({ assetId });
  logger.info ('granted deposit rights')
  logger.debug('requested deposit rights:', request)
  logger.info ('depositing', utils.formatEther(amount.toString()), 'from Alice to the channel on Mumbai (extra for collateral)')
  let tx = await wallet.sendTransaction({
    to: channel.multisigAddress, 
    value: amount
  })
  // logger.info('mumbai: waiting for 12 confirmations')
  // await tx.wait([confirmations = 12])
  logger.info('deposited on mumbai')
  logger.debug('tx:', tx)
  logger.info('rescinding deposit rights...')
  let rescind = await channel.rescindDepositRights({ assetId });
  logger.info('rescinded')
  logger.debug('rescinded deposit rights:', rescind)
}

async function transfer (amount, senderChannel, receiverIdentifier, assetId) {
  logger.info('transferring',utils.formatEther(amount.toString()), 'from mumbai to goerli channel')
  let params = {
    recipient: receiverIdentifier,
    amount,
    assetId,
    meta: {
      receiverAssetId: assetId,
      receiverChainId: parentChainId
    }
  }

  logger.debug ('starting transfer with params:')
  logger.debug (params)
  const t = await senderChannel.transfer(params)
  logger.info('transfer completed')
  logger.debug('tx:',t)
}

async function withdraw (channel, amount, to, assetId) {
  logger.info('initiating withdraw on goerli')
  logger.info('withdrawing',utils.formatEther(amount.toString()), 'from Goerli channel to Alice')
  
  let w = await channel.withdraw ({
    recipient: to,
    amount: amount,
    assetId
  })
  
  logger.info('withdraw completed')
  logger.debug('tx:', w)
}

async function main () {
  let wallet = new Wallet(alice)
  logger.info ('connecting to channels...\n')
  let c = await connectToChannels()
  let client = {
    mumbai: {
      channel: c.channels[0],
      address: c.channels[0].signerAddress,
      pvtKey: c.channels[0].signer.privateKey,
      multisig: c.channels[0].multisigAddress,
      identifier: c.channels[0].publicIdentifier
    },
    goerli: {
      channel: c.channels[1],
      address: c.channels[1].signerAddress,
      pvtKey: c.channels[1].signer.privateKey,
      multisig: c.channels[1].multisigAddress,
      identifier: c.channels[1].publicIdentifier
    }
  }

  logClientsInfo (client)
  logger.info ('channels instantiated!')
  await logAllBalances(alice, client.mumbai, client.goerli)

  let assetId = "0x0000000000000000000000000000000000000000"
  let amount = utils.parseEther(utils.formatEther(amountInWei))
  let 
    onMumbai = wallet.connect(mumbaiProvider),
    onGoerli = wallet.connect(goerliProvider)

  await deposit (onMumbai, client.mumbai.channel, assetId, amount)
  await logAllBalances (alice, client.mumbai, client.goerli)
  await transfer (amount, client.mumbai.channel, client.goerli.channel.publicIdentifier, assetId)
  await logAllBalances (alice, client.mumbai, client.goerli)
  await withdraw (client.goerli.channel, amount, wallet.address, assetId)
  await logAllBalances (alice, client.mumbai, client.goerli)

  process.exit ()
}

main ()
