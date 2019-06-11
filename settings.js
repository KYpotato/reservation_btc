const bitcoin = require('bitcoinjs-lib');
exports.API = {
    CHAIN_SO : 0,
    BLOCK_CYPHER : 1,
    MY_NODE : 2
}

exports.network = bitcoin.networks.testnet;
exports.api = module.exports.API.MY_NODE;

exports.default_fee = 500;
