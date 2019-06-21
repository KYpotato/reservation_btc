const timelock = require('./timelock');

window.verify = verify;
window.send = send;
window.gen_pubkey = gen_pubkey;
window.onload = function() {
  gen_pubkey();
}

async function verify() {
  try {
    // let result = await timelock.vefiry_address(
    //   document.getElementById('address').value,
    //   document.getElementById('redeem_script_1').value,
    //   document.getElementById('pubkey_customer').value
    // )
    let address_and_redeem = document.getElementById('address_and_redeem').value;
    let address;
    let redeem;
    let amount;

    var tmp_str = address_and_redeem.split('?');
    if(tmp_str[0].indexOf('bitcoin:') == 0) {
      address = tmp_str[0].substr('bitcoin:'.length);
    }
    else{
      throw new Error('invalid address and redeem');
    }

    var options = tmp_str[1].split('&');
    if(options[2].indexOf('message=') == 0){
      redeem = options[2].substr('message='.length);
    }
    else{
      throw new Error('invalid address and redeem');
    }
    if(options[0].indexOf('amount=') == 0){
      amount = options[0].substr('amount='.length);
    }
    else{
      throw new Error('invalid address and redeem');
    }
    let result = await timelock.vefiry_address(
      address,
      redeem,
      document.getElementById('privkey_customer').value
    )

    if(result.result) {
      document.getElementById('verified_result').innerText = 'success';
      document.getElementById('div_deposit_address').style.visibility = "visible";
      document.getElementById('div_deposit_amount').style.visibility = "visible";
      document.getElementById('deposit_address').innerText = address;
      document.getElementById('deposit_amount').innerText = amount;
      document.getElementById('address_qr').src = 
        "https://chart.googleapis.com/chart?cht=qr&chs=200x200&chco=000000&chl=bitcoin:" + address +
        "?amount=" + amount;
      document.getElementById('address_qr').style.visibility = "visible";
    }
    else {
      document.getElementById('div_deposit_address').style.visibility = "hidden";
      document.getElementById('div_deposit_amount').style.visibility = "hidden";
      document.getElementById('deposit_address').innerText = '';
      document.getElementById('deposit_amount').innerText = '';
      document.getElementById('address_qr').src = '';
      document.getElementById('address_qr').style.visibility = "hidden";
      document.getElementById('verified_result').innerText = result.message;
      alert(result.message);
    }

  } catch (error) {
    document.getElementById('div_deposit_address').style.visibility = "hidden";
    document.getElementById('div_deposit_amount').style.visibility = "hidden";
    document.getElementById('deposit_address').innerText = '';
    document.getElementById('deposit_amount').innerText = '';
    document.getElementById('address_qr').src = '';
    document.getElementById('address_qr').style.visibility = "hidden";
    document.getElementById('verified_result').innerText = 'error';
    alert(error);
  }
}

async function send() {

  try {
    let result = await timelock.broadcast_tx_by_costomer(
      document.getElementById('redeem_script_2').value,
      document.getElementById('secret').value,
      document.getElementById('target_address').value,
      document.getElementById('privkey_customer').value
    )

    if(result) {
      document.getElementById('result').innerText = 'success';
    }
    else {
      document.getElementById('result').innerText = 'error';
    }
    
  } catch(error) {
    document.getElementById('result').innerText = 'error';
    alert(error);
  }
}

async function gen_pubkey(){
  let privkey_customer = document.getElementById('privkey_customer').value;
  try{
    document.getElementById('pubkey_customer').innerText = await timelock.gen_publickey(privkey_customer);
  } catch (error) {
    document.getElementById('pubkey_customer').innerText = 'invalid private key';
  }
}
