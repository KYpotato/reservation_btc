const bip68 = require('bip68');
const bip65 = require('bip65');
const bitcoin = require('bitcoinjs-lib');
const base58check = require('base58check');
const commom_btc = require('./common_btc');
const settings = require('./settings');

let network = settings.network;

const hashType = bitcoin.Transaction.SIGHASH_ALL
const alice = bitcoin.ECPair.fromWIF('cScfkGjbzzoeewVWmU2hYPUHeVGJRDdFt7WhmrVVGkxpmPP8BHWe', settings.network)
const bob = bitcoin.ECPair.fromWIF('cMkopUXKWsEzAjfa1zApksGRwjVpJRB3831qM9W4gKZsLwjHXA9x', settings.network)

function utcNow() {
  return Math.floor(Date.now() / 1000);
}

exports.gen_address_test = function(secret) {
  let hash = bitcoin.crypto.hash256(Buffer.from(secret, 'hex'));
  let redeemScript = bitcoin.script.compile([
    bitcoin.opcodes.OP_HASH256,
    hash,
    bitcoin.opcodes.OP_EQUAL
  ]);

  const { address } = bitcoin.payments.p2sh(
    {
        redeem: { output: redeemScript, network: settings.network }, 
        network: settings.network 
    });
  console.log(redeemScript);
  console.log('address', address);

  return redeemScript;
}
exports.gen_tx_test = function(secret_str, redeemScript) {
    
  // let hash = bitcoin.crypto.hash256(Buffer.from(secret, 'hex'));
  let secret = Buffer.from(secret_str, 'hex');

  var fee = 500;
  var utxos = [{
    txid: "2a4725d5a09f0b89285527ffafbf0a7beac6c876438dd8fa35ba4e09dfdd195a",
    output_idx: 0,
    value_satoshi: 10000,
  }];
  var target_address = "mruTKiYbY3ZUV7VCFEfuqd9ZLV4ZhprqZ9";
      
  var txb = new bitcoin.TransactionBuilder(network);

  // input
  let total_balance = 0;
  for(utxo of utxos){
    txb.addInput(utxo.txid, utxo.output_idx);
    total_balance += utxo.value_satoshi;
  }

  // output
  txb.addOutput(target_address, total_balance - fee);

  // set unlocking script to tx
  const tx = txb.buildIncomplete();
  console.log(tx);

  const redeemScriptSig = bitcoin.payments.p2sh({
    redeem: {
      input: bitcoin.script.compile([
        secret
      ]),
      output: redeemScript
    }
  }).input;

  for(let i = 0; i < utxos.length; i++){
    tx.setInputScript(i, redeemScriptSig);
  }
  console.log(tx);
  console.log('tx:');
  console.log(tx.toHex());

  return tx.toHex();
}

function gen_timelock_script (customer_pubkey, restaurant_pubkey, lockTime, secret) {
  let hash = bitcoin.crypto.hash256(Buffer.from(secret, 'hex'));

  return bitcoin.script.compile([
    bitcoin.opcodes.OP_IF,
    // for restaurant
    bitcoin.script.number.encode(lockTime),
    bitcoin.opcodes.OP_CHECKLOCKTIMEVERIFY,
    bitcoin.opcodes.OP_DROP,
    restaurant_pubkey,

    bitcoin.opcodes.OP_ELSE,
    // for customers
    bitcoin.opcodes.OP_HASH256,
    hash,
    bitcoin.opcodes.OP_EQUALVERIFY,
    customer_pubkey,
    
    bitcoin.opcodes.OP_ENDIF,

    bitcoin.opcodes.OP_CHECKSIG
    ]);
}

function gen_secret() {
  return "a";
}

exports.gen_timelock_address = function(pubkey_restaurant, lockTime, secret, pubkey_customer){

  pubkey_restaurant = alice.publicKey;
  pubkey_customer = bob.publicKey;
  lockTime = bip65.encode({ blocks: 1542530 });
  
  // const lockTime = bip65.encode({ utc: utcNow() - (3600 * 3) });
  // secret = gen_secret();
  const redeemScript = gen_timelock_script(pubkey_customer, pubkey_restaurant, lockTime, secret);
  // const { address } = bitcoin.payments.p2sh(
  //   {
  //     redeem: { output: redeemScript, network: settings.network }, 
  //     network: settings.network 
  //   });
  let address = gen_address_from_redeem(redeemScript);
  console.log(redeemScript);
  console.log('address', address);

  return {redeemScript, address};
}
function gen_address_from_redeem(redeemScript) {
  const { address } = bitcoin.payments.p2sh(
    {
      redeem: { output: redeemScript, network: settings.network }, 
      network: settings.network 
    });
  return address;
}
exports.broadcast_tx_by_restaurant = function(redeemScript, lockTime, target_address, privkey) {

}
exports.gen_timelock_tx_by_restaurant = function(redeemScript, lockTime) {

  var fee = 500;
  var utxos = [{
    txid: "9bd1e037cbca9def807aa2b02fc6bcd65cb52742487204207a2d8fd7e0682c85",
    output_idx: 0,
    value_satoshi: 15608,
  }];
  var target_address = "mruTKiYbY3ZUV7VCFEfuqd9ZLV4ZhprqZ9";
      
  var txb = new bitcoin.TransactionBuilder(network);
  txb.setLockTime(lockTime);

  // input
  let total_balance = 0;
  for(utxo of utxos){
    txb.addInput(utxo.txid, utxo.output_idx, 0xfffffffe);
    total_balance += utxo.value_satoshi;
  }

  // output
  txb.addOutput(target_address, total_balance - fee);

  // set unlocking script to tx
  const tx = txb.buildIncomplete();
  console.log(tx);
  const signatureHash = tx.hashForSignature(0, redeemScript, hashType);

  const redeemScriptSig = bitcoin.payments.p2sh({
    redeem: {
      input: bitcoin.script.compile([
        bitcoin.script.signature.encode(bob.sign(signatureHash), hashType),
        bitcoin.opcodes.OP_TRUE
      ]),
      output: redeemScript
    }
  }).input;

  for(let i = 0; i < utxos.length; i++){
    tx.setInputScript(i, redeemScriptSig);
  }
  console.log(tx);
  console.log('tx:');
  console.log(tx.toHex());

  return tx.toHex();
}
exports.broadcast_tx_by_costomer = async function(redeemScript, secret_org, target_address, privkey) {
  target_address = "mruTKiYbY3ZUV7VCFEfuqd9ZLV4ZhprqZ9";
  privkey = alice;
  let secret = Buffer.from(secret_org, 'hex');
  // var utxos = [{
  //   txid: "9bd1e037cbca9def807aa2b02fc6bcd65cb52742487204207a2d8fd7e0682c85",
  //   output_idx: 0,
  //   value_satoshi: 15608,
  // }];
  let result = false;

  // get utxos
  let utxos = await commom_btc.get_utxos(gen_address_from_redeem(Buffer.from(redeemScript, 'hex')));
  if(utxos.length < 1) {
    alert("no balance");
    return result;
  }
  console.log(utxos.length);
  // gen tx
  let rawtx = await gen_timelock_tx_by_costomer(redeemScript, secret, target_address, utxos, privkey);
  // broadcast tx
  result = await commom_btc.broadcast(rawtx);

  return result;
}

function gen_timelock_tx_by_costomer(redeemScript, secret, target_address, utxos, privkey) {

  var fee = 500;
  var txb = new bitcoin.TransactionBuilder(network);

  // input
  let total_balance = 0;
  for(utxo of utxos){
    txb.addInput(utxo.txid, utxo.output_idx);
    total_balance += utxo.value_satoshi;
  }

  // output
  txb.addOutput(target_address, total_balance - fee);

  // set unlocking script to tx
  const tx = txb.buildIncomplete();
  console.log(tx);
  const signatureHash = tx.hashForSignature(0, redeemScript, hashType);

  const redeemScriptSig = bitcoin.payments.p2sh({
    redeem: {
      input: bitcoin.script.compile([
        bitcoin.script.signature.encode(privkey.sign(signatureHash), hashType),
        secret,
        bitcoin.opcodes.OP_FALSE
      ]),
      output: redeemScript
    }
  }).input;

  for(let i = 0; i < utxos.length; i++){
    tx.setInputScript(i, redeemScriptSig);
  }
  console.log(tx);
  console.log('tx:');
  console.log(tx.toHex());

  return tx.toHex();
}

