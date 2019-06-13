const timelock = require('./timelock');

window.verify = verify;
window.send = send;

async function verify() {
  try {
    let result = await timelock.vefiry_address(
      document.getElementById('address').value,
      document.getElementById('redeem_script').value,
      document.getElementById('pubkey_customer').value
    )

    if(result.result) {
      document.getElementById('result').innerText = 'success';
    }
    else {
      document.getElementById('result').innerText = result.message;
      alert(result.message);
    }

  } catch (error) {
    document.getElementById('result').innerText = 'error';
    alert(error);
  }
}

async function send() {

  try {
    let result = await timelock.broadcast_tx_by_costomer(
      document.getElementById('redeem_script').value,
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
