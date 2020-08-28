const { connectToChannels } = require('./channel.js')
const { amountInWei, childChain, parentChain, parentChainId } = require('./config.json')
const { Wallet, providers, utils } = require('ethers')

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
async function getBalances(pvtKey, channel) {
  let wallet = new Wallet(pvtKey)
  console.log ('---\ndisplaying balances for:', wallet.address, '\n---')
  console.log ('public identifier:', channel.publicIdentifier)
  let freeBalance = await channel.getFreeBalance()
  if (freeBalance[wallet.address]) {
    console.log (
      'free balance:', 
      utils.formatEther(freeBalance[wallet.address])
    )
  }
  let onMumbai = wallet.connect(mumbaiProvider)
  let onGoerli = wallet.connect(goerliProvider)
  let balanceOnMumbai = await onMumbai.getBalance()
  console.log (
    'Mumbai chain:',
    utils.formatEther(balanceOnMumbai)
  )
  let balanceOnGoerli = await onGoerli.getBalance()
  console.log (
    'Goerli chain', 
    utils.formatEther(balanceOnGoerli.toString())
  )
  console.log ('---\n')
}

async function main () {
  // instantiate channel
  console.log ('connecting to channels...')
  let c = await connectToChannels()
  let ephemeralChannel = {
    mumbai: c.channels[0],
    address: c.channels[0].signerAddress,
    pvtKey: c.channels[0].signer.privateKey
  }
  let aliceChannel = {
    goerli: c.channels[1],
    address: c.channels[1].signerAddress,
    pvtKey: c.channels[1].signer.privateKey
  }
  console.log (
    '\nsigner1 (ephemeral on mumbai):',ephemeralChannel.address,
    '\nsigner1 private key:', ephemeralChannel.pvtKey,
    '\nsigner2 (alice on goerli):', aliceChannel.address,
    '\nsigner2 private key:', aliceChannel.pvtKey
  )
  console.log ('\n✨ channels instantiated!')

  // display all balances
  console.log ('\n---balances---')
  console.log (`Alice's ephemeral channel on Mumbai`)
  await getBalances (ephemeralChannel.pvtKey, ephemeralChannel.mumbai)
  console.log (`Alice's channel on Goerli`)
  await getBalances (aliceChannel.pvtKey, aliceChannel.goerli)

  let _wallet = new Wallet(aliceChannel.pvtKey, mumbaiProvider)

  let amountToSend = utils.parseEther(utils.formatEther(amountInWei)).add(utils.parseEther(utils.formatEther("50000000000"))) // adding extra value for gas

  // transferring to ephemeral account 
  console.log ('sending', utils.formatEther(amountToSend.toString()), 'from', aliceChannel.address, 'to', ephemeralChannel.address)

  let tx = await _wallet.sendTransaction ({
    to: ephemeralChannel.address,
    value: amountToSend 
  })
  console.log ('sent:', tx.hash)

  // display balances
  await wait(7000)
  console.log ('\n---balances---')
  console.log (`Alice's ephemeral channel on Mumbai`)
  await getBalances (ephemeralChannel.pvtKey, ephemeralChannel.mumbai)
  console.log (`Alice's channel on Goerli`)
  await getBalances (aliceChannel.pvtKey, aliceChannel.goerli)

  // deposit to channel
  console.log ('\n---depositing---')
  console.log ('depositing', utils.formatEther(amountInWei), 'from ephemeral account on Mumbai')
  let d = await ephemeralChannel.mumbai.deposit({
    amount: amountInWei, // in Wei
    assetId: "0x0000000000000000000000000000000000000000", // represents ETH
  })
  console.log ('deposit result =>', d.transaction.hash)  
  console.log ('---\n')

  await wait(7000) 

  // display balances
  console.log ('\n---balances---')
  console.log (`Alice's ephemeral channel on Mumbai`)
  await getBalances (ephemeralChannel.pvtKey, ephemeralChannel.mumbai)

  // transfer to alice's channel on goerli
  console.log ('\n---transfering---')
  const t = await ephemeralChannel.mumbai.transfer({
    recipient: aliceChannel.goerli.publicIdentifier,
    amount: amountInWei,
    assetId: "0x0000000000000000000000000000000000000000",
    meta: {
      receiverChainId: parentChainId
    }
  })
  console.log ('transfer completed for', utils.formatEther(t.amount), 'for asset', t.assetId, ', payment id:', t.meta.paymentId)

  // display balances
  await wait(20000)  // wait 10 sec
  console.log ('\n---balances---')
  console.log (`Alice's ephemeral channel on Mumbai`)
  await getBalances (ephemeralChannel.pvtKey, ephemeralChannel.mumbai)
  console.log (`Alice's channel on Goerli`)
  await getBalances (aliceChannel.pvtKey, aliceChannel.goerli)

  // withdraw from mumbai
  console.log ('---withdrawing---\n')
  console.log ('withdrawing', utils.formatEther(amountInWei), 'from Alice onto Goerli')
  let w = await aliceChannel.goerli.withdraw ({
    // recipient: '', // can mention recipient here
    amount: amountInWei,
    assetId: "0x0000000000000000000000000000000000000000"
  })
  console.log ('withdraw =>', w.transaction.hash)

  await wait(7000) 
  console.log ('\n---balances---')
  console.log (`Alice's channel on Goerli`)
  await getBalances (aliceChannel.pvtKey, aliceChannel.goerli)


  process.exit ()
}

main ()
