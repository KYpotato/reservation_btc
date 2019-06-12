const bitcoin = require('bitcoinjs-lib');
const base58check = require('base58check');
const request = require('request');
const rp = require('request-promise');
const settings = require('./settings');

const network = settings.network;

exports.get_utxos = async function(address){
    console.log('--get_utxos--');
    console.log(address);
    let ret_utxos = new Array();

    if(settings.api == settings.API.CHAIN_SO){
        // chain.so
        console.log('chain.so');
        let target_network;
        if(network == bitcoin.networks.bitcoin){
            target_network = "BTC";
        }
        else{
            target_network = "BTCTEST";
        }
        const url = 'https://chain.so/api/v2/get_tx_unspent/' + target_network + '/' + address;
        let request_op = {
            url: url,
            method: 'GET',
            json: true
        }
        let responce = await rp(request_op).catch(e =>{
            console.log('get utxo fail: ' + e);
            throw new Error('get utxo fail: ' + e);
        })
        console.log(responce);
        
        if(responce != null && responce.status == "success"){
            console.log(responce.data.txs);
            for(let i = 0; i < responce.data.txs.length; i++){
                ret_utxos[i] = {
                    txid: responce.data.txs[i].txid,
                    output_idx: responce.data.txs[i].output_no,
                    value_satoshi: Number(responce.data.txs[i].value.replace('.', ''))
                };
            }
        }
        else{
            console.log('error(get utxo): ' + (responce == null? 'responce null': responce.status));
            throw new Error('error(get utxo)' + (responce == null? 'responce null': responce.status));
        }
    }
    else if(settings.api == settings.API.MY_NODE){

    }
    else{
        console.log('not applicable API server.');
        throw new Error('not applicable API server.')
    }
    return ret_utxos;
}

exports.broadcast = async function(rawtx){
    let body;
    let ret;

    if(settings.api == settings.API.CHAIN_SO){
        // chain.so
        let target_network;
        if(network == bitcoin.networks.bitcoin){
            target_network = "BTC";
        }
        else{
            target_network = "BTCTEST";
        }
        const uri = 'https://chain.so/api/v2/send_tx/' + target_network;
        let request_op = {
            url: uri,
            method: 'POST',
            headers: {"content-type": "application/json"},
            json: {tx_hex: rawtx}
        }
        let responce = await rp(request_op).catch(e => {
            console.log('broadcast tx fail: ' + e);
            throw new Error('broadcast tx fail: ' + e);
        })
        console.log(responce);
        if(responce.status == 'success'){
            console.log(responce);
            ret = true;
        }
        else{
            console.log('error(broadcast): '+ responce.status);
            throw new Error('error(broadcast): '+ responce.status);
        }
    }
    else if(settings.api == settings.API.MY_NODE){

    }
    else{
        console.log('not applicable API server.');
        throw new Error('not applicable API server.')
    }

    console.log(body);
    return ret;
}


exports.gen_script_address = function(script_string){

    // script
    console.log('script');
    let script = bitcoin.script.fromASM(script_string);
    console.log(script_string);
    console.log(script.toString('hex'));
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




exports.btc_cli_command = async function(method, ...params){
    let ret = await dispatch(settings.rpcip, settings.rpcport, settings.username, settings.rpspassword, method, ...params).catch((err) => console.log(err));
    if(ret.result != null){
        console.log('result');
        console.log(ret.result);
    }
    if(ret.error != null){
        console.log('error');
        console.log(ret.error);
    }
    return ret;
}

const dispatch = async (host, rpcport, user, pass, method, ...params) => {
    return { result, error } = JSON.parse(
        await rp(`http://${host}:${rpcport}`, {
            method: 'POST',
            body: JSON.stringify({ method, params }),
            auth: { user, pass },
        }).catch(e => {
            if (e.statusCode) {
            return JSON.stringify({ error: JSON.parse(e.error).error })
            } else {
            return JSON.stringify({ error: e.error })
            }
        })
    )
}

function request_promise(options){

    return new Promise((resolve, reject) => {
        request(options, (error, res, body) => {
            if(!error && res.statusCode == 200){
                console.log('responce OK');
                resolve(body);
            }
            else{
                console.log('responce error: ' + res.statusCode);
                reject(error);
            }
        })
    })
}