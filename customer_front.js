const timelock = require('./timelock');

window.send = send;

async function send() {

  try {
    let result = await timelock.broadcast_tx_by_costomer(
      document.getElementById('redeem_script').value,
      document.getElementById('secret').value,
      document.getElementById('target_address').value,
      document.getElementById('privkey_customer').value
    )

    if(result) {
      document.getElementById('result').innerText = result;
    }
    else {
      document.getElementById('result').innerText = 'error';
    }
  } catch(error) {

    document.getElementById('result').innerText = '';
    alert(error);
  }
}
