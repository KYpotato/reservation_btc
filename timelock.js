const bip68 = require('bip68');
const bip65 = require('bip65');
const bip32 = require('bip32');
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
  let hash = bitcoin.crypto.hash256(Buffer.from(secret));

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

exports.gen_timelock_address = function(privkey_restaurant, lockTime, secret, pubkey_customer){
  
  // const lockTime = bip65.encode({ utc: utcNow() - (3600 * 3) });
  // secret = gen_secret();
  pubkey_restaurant = module.exports.gen_publickey(privkey_restaurant);
  lockTime = bip65.encode({utc: lockTime});
  const redeemScript = gen_timelock_script(Buffer.from(pubkey_customer, 'hex'), Buffer.from(pubkey_restaurant, 'hex'), lockTime, secret);

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
exports.broadcast_tx_by_restaurant = async function(redeemScript, target_address, privkey) {
  
  let result = false;
  // let lockTime = await commom_btc.get_block_height();
  // let lockTime = bip65.encode({utc: Math.floor(new Date("2019-06-17").getTime() / 1000)});
  let result_redeem = verify_redeem(redeemScript);
  let lockTime = parseInt(result_redeem.lockTime, 16);
  console.log(lockTime);

  // get utxos
  let utxos = await commom_btc.get_utxos(gen_address_from_redeem(Buffer.from(redeemScript, 'hex')));
  if(utxos.length < 1) {
    alert("no balance");
    return result;
  }
  // gen tx
  let rawtx = await gen_timelock_tx_by_restaurant(
    Buffer.from(redeemScript, 'hex'), 
    lockTime,
    target_address, 
    utxos, 
    bitcoin.ECPair.fromPrivateKey(bip32.fromBase58(privkey, settings.network).privateKey, settings.network)
  );
  // broadcast tx
  result = await commom_btc.broadcast(rawtx);

  return result;
}

function gen_timelock_tx_by_restaurant(redeemScript, lockTime, target_address, utxos, privkey) {

  var fee = 500;
      
  var txb = new bitcoin.TransactionBuilder(network);
  txb.setLockTime(Number(lockTime));

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

  for(let i = 0; i < utxos.length; i++){
    const signatureHash = tx.hashForSignature(i, redeemScript, hashType);
  
    const redeemScriptSig = bitcoin.payments.p2sh({
      redeem: {
        input: bitcoin.script.compile([
          bitcoin.script.signature.encode(privkey.sign(signatureHash), hashType),
          bitcoin.opcodes.OP_TRUE
        ]),
        output: redeemScript
      }
    }).input;

    tx.setInputScript(i, redeemScriptSig);
  }
  console.log(tx);
  console.log('tx:');
  console.log(tx.toHex());

  return tx.toHex();
}

exports.broadcast_tx_by_costomer = async function(redeemScript, secret, target_address, privkey) {

  let result = false;

  // get utxos
  let utxos = await commom_btc.get_utxos(gen_address_from_redeem(Buffer.from(redeemScript, 'hex')));
  if(utxos.length < 1) {
    alert("no balance");
    return result;
  }
  // gen tx
  let rawtx = await gen_timelock_tx_by_costomer(
    Buffer.from(redeemScript, 'hex'), 
    Buffer.from(secret), 
    target_address, 
    utxos, 
    bitcoin.ECPair.fromPrivateKey(bip32.fromBase58(privkey, settings.network).privateKey, settings.network)
  );
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

  for(let i = 0; i < utxos.length; i++){
    const signatureHash = tx.hashForSignature(i, redeemScript, hashType);
  
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
    tx.setInputScript(i, redeemScriptSig);
  }
  console.log(tx);
  console.log('tx:');
  console.log(tx.toHex());

  return tx.toHex();
}

function vefiry_head_opcode(redeem, opcode){
  var result = null;
  console.log(redeem);
  console.log(opcode);
  console.log(opcode.toString(16));
  if(0 == redeem.indexOf(opcode.toString(16).toUpperCase())){
    result = redeem.substr(2, redeem.length - 2);
  }
  console.log(result);

  return result;
}

function verify_redeem(redeemScript) {
  var result = {result:true, lockTime:'', pubkey:''};
  redeemScript = redeemScript.toUpperCase();
  // OP_IF(0x63)
  if((redeemScript = vefiry_head_opcode(redeemScript, bitcoin.opcodes.OP_IF)) == null) {
    result.result = false;
  }

  // for restaurant
  // lockTime (datalen is expected only 1byte)
  var datalen = parseInt(redeemScript.substr(0, 2), 16);
  let lockTime_tmp = redeemScript.substr(2, datalen * 2);
  for(var i = 0; i < lockTime_tmp.length / 2; i++) {
    result.lockTime += lockTime_tmp.substr(lockTime_tmp.length - 2 - i * 2, 2);
  }
  redeemScript = redeemScript.substr(2 + datalen * 2, redeemScript.length - (2 + datalen * 2));
  console.log(datalen);
  console.log(redeemScript);

  // OP_CHECKLOCKTIMEVERIFY(0xb1)
  if((redeemScript = vefiry_head_opcode(redeemScript, bitcoin.opcodes.OP_CHECKLOCKTIMEVERIFY)) == null) {
    result.result = false;
  }

  // OP_DROP(0x75)
  if((redeemScript = vefiry_head_opcode(redeemScript, bitcoin.opcodes.OP_DROP)) == null) {
    result.result = false;
  }

  // restaurant_pubkey (datalen is expected only 1byte)
  datalen = parseInt(redeemScript.substr(0, 2), 16);
  redeemScript = redeemScript.substr(2 + datalen * 2, redeemScript.length - (2 + datalen * 2));

  // OP_ELSE(0x67)
  if((redeemScript = vefiry_head_opcode(redeemScript, bitcoin.opcodes.OP_ELSE)) == null) {
    result.result = false;
  }
  // for customers
  // OP_HASH256(0xaa)
  if((redeemScript = vefiry_head_opcode(redeemScript, bitcoin.opcodes.OP_HASH256)) == null) {
    result.result = false;
  }

  // hash (datalen is expected only 1byte)
  datalen = parseInt(redeemScript.substr(0, 2), 16);
  redeemScript = redeemScript.substr(2 + datalen * 2, redeemScript.length - (2 + datalen * 2));

  // OP_EQUALVERIFY(0x88)
  if((redeemScript = vefiry_head_opcode(redeemScript, bitcoin.opcodes.OP_EQUALVERIFY)) == null) {
    result.result = false;
  }

  // customer_pubkey (datalen is expected only 1byte)
  datalen = parseInt(redeemScript.substr(0, 2), 16);
  result.pubkey = redeemScript.substr(2, datalen * 2);
  redeemScript = redeemScript.substr(2 + datalen * 2, redeemScript.length - (2 + datalen * 2));
  
  // OP_ENDIF(0x68)
  if((redeemScript = vefiry_head_opcode(redeemScript, bitcoin.opcodes.OP_ENDIF)) == null) {
    result.result = false;
  }

  // OP_CHECKSIG(0xac)
  if((redeemScript = vefiry_head_opcode(redeemScript, bitcoin.opcodes.OP_CHECKSIG)) == null) {
    result.result = false;
  }

  return result;
}

exports.gen_publickey = function(privkey) {
 return bitcoin.ECPair.fromPrivateKey(bip32.fromBase58(privkey, settings.network).privateKey, settings.network).publicKey.toString('hex').toUpperCase();
}

exports.vefiry_address = function(address, redeemScript, privkey_customer) {

  var result = {result:false, message:'', locktime: 0};
  pubkey_customer = module.exports.gen_publickey(privkey_customer);

  // vefiry redeem script

  let result_redeem = verify_redeem(redeemScript);
  if(result_redeem.result == true && result_redeem.pubkey == pubkey_customer){
    result.result = true;
    result.locktime = parseInt(result_redeem.lockTime);

    // verify address
    let address_from_redeem = gen_address_from_redeem(Buffer.from(redeemScript, 'hex'));
    if(address_from_redeem == address) {
      result.result = true;
    }
    else{
      result.result = false;
      result.message = 'invalid address';
    }
  }
  else{
    result.result = false;
    result.message = 'invalid redeem script';
  }

  return result;
}
