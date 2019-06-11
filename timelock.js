const bip68 = require('bip68');
const bip65 = require('bip65');
const bitcoin = require('bitcoinjs-lib');
const base58check = require('base58check');
// const commom_btc = require('./common_btc');
const settings = require('./settings');

let network = settings.network;

const hashType = bitcoin.Transaction.SIGHASH_ALL
const alice = bitcoin.ECPair.fromWIF('cScfkGjbzzoeewVWmU2hYPUHeVGJRDdFt7WhmrVVGkxpmPP8BHWe', settings.network)
const bob = bitcoin.ECPair.fromWIF('cMkopUXKWsEzAjfa1zApksGRwjVpJRB3831qM9W4gKZsLwjHXA9x', settings.network)

function cltvCheckSigOutput (aQ, bQ, lockTime) {
    return bitcoin.script.compile([
      bitcoin.opcodes.OP_IF,
      bitcoin.script.number.encode(lockTime),
      bitcoin.opcodes.OP_CHECKLOCKTIMEVERIFY,
      bitcoin.opcodes.OP_DROP,

      bitcoin.opcodes.OP_ELSE,
      bQ.publicKey,
      bitcoin.opcodes.OP_CHECKSIGVERIFY,
      bitcoin.opcodes.OP_ENDIF,

      aQ.publicKey,
      bitcoin.opcodes.OP_CHECKSIG
    ])
}
function ifOutput (aQ, bQ, lockTime) {
    return bitcoin.script.compile([
        bitcoin.opcodes.OP_IF,
        bitcoin.script.number.encode(lockTime),
        bitcoin.opcodes.OP_CHECKLOCKTIMEVERIFY,
        bitcoin.opcodes.OP_DROP,
        bQ.publicKey,

        bitcoin.opcodes.OP_ELSE,
        aQ.publicKey,
        
        bitcoin.opcodes.OP_ENDIF,

        bitcoin.opcodes.OP_CHECKSIG
        ]);
}
exports.gen_test_address_if = function(){

    const lockTime = bip65.encode({ blocks: 5 });
    // const lockTime = bip65.encode({ utc: utcNow() - (3600 * 3) });
    const redeemScript = ifOutput(alice, bob, lockTime);
    const { address } = bitcoin.payments.p2sh(
        {
            redeem: { output: redeemScript, network: settings.network }, 
            network: settings.network 
        });
    console.log(redeemScript);
    console.log('address', address);

    return {redeemScript, lockTime};
}
exports.gen_test_tx_if = function(redeemScript, lockTime) {

    var fee = 500;
    var utxos = [{
        txid: "e69b6e5366842f6d1c0ab0d4fc15a3c9488f3bff73d6b026aa5555d0e98f4dd1",
        output_idx: 0,
        value_satoshi: 17852,
    }];
    var target_address = "mruTKiYbY3ZUV7VCFEfuqd9ZLV4ZhprqZ9";
        
    var txb = new bitcoin.TransactionBuilder(network);
    txb.setLockTime(lockTime);

    // input
    let total_balance = 0;
    for(utxo of utxos){
        txb.addInput(utxo.txid, utxo.output_idx, 0xfffffffe)
        total_balance += utxo.value_satoshi;
    }

    // output
    txb.addOutput(target_address, total_balance - fee);

    // set unlocking script to tx
    const tx = txb.buildIncomplete();
    console.log(tx);
    const signatureHash = tx.hashForSignature(0, redeemScript, hashType)

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

function utcNow() {
    return Math.floor(Date.now() / 1000);
}

exports.gen_test_address = function(){

    const lockTime = bip65.encode({ utc: utcNow() - (3600 * 3) });
    const redeemScript = cltvCheckSigOutput(alice, bob, lockTime);
    const { address } = bitcoin.payments.p2sh(
        {
            redeem: { output: redeemScript, network: settings.network }, 
            network: settings.network 
        });
    console.log(redeemScript);
    console.log(lockTime);
    console.log('address', address);

    return {redeemScript, lockTime};
}

exports.gen_test_address2 = function(){

    const lockTime = bip65.encode({ blocks: height + 5 })
    const redeemScript = cltvCheckSigOutput(alice, bob, lockTime);
    const { address } = bitcoin.payments.p2sh(
        {
            redeem: { output: redeemScript, network: settings.network }, 
            network: settings.network 
        });
    console.log(redeemScript);
    console.log(lockTime);
    console.log('address', address);

    return {redeemScript, lockTime};
}

exports.gen_test_tx = function(redeemScript, lockTime) {
    // let lockTime = 1560226977;
    // const redeemScript = cltvCheckSigOutput(alice, bob, lockTime);
    
    const txb = new bitcoin.TransactionBuilder(settings.network);

    txb.setLockTime(lockTime);
    // Note: nSequence MUST be <= 0xfffffffe otherwise LockTime is ignored, and is immediately spendable.
    txb.addInput("02085896dc2e0954deb744e915cc2874efad88c03de12ae94ce3394ffe8f8603", 0, 0xfffffffe);
    txb.addOutput("mgmk1HPamW2LjXouXoGzX8roLx1BuVBpjr", 9500);
    
    const tx = txb.buildIncomplete()
    const signatureHash = tx.hashForSignature(0, redeemScript, hashType)
    const redeemScriptSig = bitcoin.payments.p2sh({
      redeem: {
        input: bitcoin.script.compile([
          bitcoin.script.signature.encode(alice.sign(signatureHash), hashType),
          bitcoin.opcodes.OP_TRUE
        ]),
        output: redeemScript
      }
    }).input
    tx.setInputScript(0, redeemScriptSig);

    console.log(tx.toHex());
}


exports.gen_script_address = function(){

    // script
    console.log('script');
    let lockTime = bip68.encode({ utc: utcNow() - (3600 * 3)});

    // let script = bitcoin.script.fromASM(script_string);
    let script = bitcoin.script.compile([
        bitcoin.script.number.encode(lockTime),
        bitcoin.opcodes.OP_CHECKLOCKTIMEVERIFY, 
        bitcoin.opcodes.OP_DROP
    ]);
    console.log('lockTIme', lockTime);
    console.log('script', script.toString('hex'));
    console.log();

    // payload
    console.log('payload');
    let payload = bitcoin.crypto.hash160(script).toString('hex');
    console.log(payload);
    console.log();

    // version
    console.log('version');
    let version;
    if(network == bitcoin.networks.bitcoin){
        version = '05';
        console.log('mainnet');
    }
    else{
        version = 'c4';
        console.log('testnet');
    }
    console.log(version);
    console.log();

    // base58encode
    console.log('base58encode');
    let base58encode_script = base58check.encode(payload, version, 'hex');
    console.log(base58encode_script);
    console.log();

    // base58decode
    console.log('base58decode');
    console.log(base58check.decode(base58encode_script).prefix.toString('hex'));
    console.log(base58check.decode(base58encode_script).data.toString('hex'));
    console.log();

    return base58encode_script;
}


exports.gen_tx_from_p2sh = function(){

    utxos = [{
        txid:"d4a5216907422c797a0f1b436ee644a41897e2ac015adebe1424805abecf8d58",
        output_idx:0,
        value_satoshi: 10000
    }];

    target_address = 'mgmk1HPamW2LjXouXoGzX8roLx1BuVBpjr';
    fee = 100;

    var txb = new bitcoin.TransactionBuilder(network);

    // setlocktime
    let lockTime = 4294967295;
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

    // var redeem = bitcoin.script.fromASM(redeem_script);
    // var unlocking = bitcoin.script.fromASM(unlocking_script);
    var redeem = bitcoin.script.compile([
        bitcoin.script.number.encode(lockTime),
        bitcoin.opcodes.OP_CHECKLOCKTIMEVERIFY, 
        bitcoin.opcodes.OP_DROP
    ]);
    var unlocking = bitcoin.script.compile([
        bitcoin.opcodes.OP_TRUE,
        bitcoin.opcodes.OP_TRUE
    ])

    const redeemScriptSig = bitcoin.payments.p2sh({
        redeem: {
            input: unlocking,
            output: redeem
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