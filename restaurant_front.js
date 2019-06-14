const timelock = require('./timelock');

window.gen_address = gen_address;
window.send = send;

function gen_address() {
  try {
    let {redeemScript, address} = timelock.gen_timelock_address(
      document.getElementById('pubkey_restaurant').value,
      document.getElementById('locktime_1').value,
      document.getElementById('secret').value,
      document.getElementById('pubkey_customer').value,
    );

    let amount = parseFloat(document.getElementById('deposit_amount').value);

    document.getElementById('generated_address').innerText = address;
    document.getElementById('generated_redeem_script').innerText = 
      "bitcoin:" + address + "?amount=" + amount + "&label=reservation" + "&message=" + redeemScript.toString('hex');
    
    document.getElementById('address_qr').src = 
      "https://chart.googleapis.com/chart?cht=qr&chs=200x200&chco=000000&chl=bitcoin:" + address +
      "?amount=" + amount +
      "%26label=reservation" +
      "%26message=" + redeemScript.toString('hex');
    document.getElementById('address_qr').style.visibility = "visible";
  } catch(error) {

    document.getElementById('generated_address').innerText = '';
    document.getElementById('generated_redeem_script').innerText = '';
    document.getElementById('address_qr').src = '';
    document.getElementById('address_qr').style.visibility = "hidden";
    alert(error);
  }
}

async function send(){
  try{
    let result = await timelock.broadcast_tx_by_restaurant(
      document.getElementById('redeem_script').value,
      document.getElementById('locktime_2').value,
      document.getElementById('target_address').value,
      document.getElementById('privkey_restaurant').value,
    );
    if(result) {
      document.getElementById('result').innerText = 'success';
    }
    else{
      document.getElementById('result').innerText = 'error';
    }
  } catch(error) {
    document.getElementById('result').innerText = 'error';
    alert(error);
  }
}
