const timelock = require('./timelock');

window.gen_address = gen_address;

function gen_address() {
  try {
    let {redeemScript, address} = timelock.gen_timelock_address(
      document.getElementById('pubkey_restaurant').value,
      document.getElementById('locktime').value,
      document.getElementById('secret').value,
      document.getElementById('pubkey_customer').value,
    );

    document.getElementById('address').innerText = address;
    document.getElementById('redeem_script').innerText = redeemScript.toString('hex');
          
    document.getElementById('address_qr').src = "https://chart.googleapis.com/chart?cht=qr&chs=200x200&chco=000000&chl=bitcoin:" + address;
    document.getElementById('address_qr').style.visibility = "visible";
  } catch(error) {

    document.getElementById('address').innerText = '';
    document.getElementById('redeem_script').innerText = '';
    document.getElementById('address_qr').src = '';
    document.getElementById('address_qr').style.visibility = "hidden";
    alert(error);
  }
}

function send(){
  timelock.broadcast_tx_by_restaurant(
    document.getElementById('redeem_script').value,
    document.getElementById('locktime').value,
    document.getElementById('target_address').value,
    document.getElementById('privkey_restaurant').value,

  );
}
