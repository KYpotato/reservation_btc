# reservation_btc

## Overview
ビットコイン（テストネット）を使ったレストラン予約のためのデポジットシステム

## Description
サーバーなし、客と店のブラウザ（とビットコインブロックチェーンとchain.soのAPI）のみで動作します

## Requirement
npmインストール

## Usage
1.客  
 customer.htmlを開く  
 　秘密鍵（テストネット用）を入力する  
 　公開鍵を生成する  
 メールやメッセージアプリを使って  
 　公開鍵（と予約の日時）を店に伝える  
  ![画像1](https://github.com/KYpotato/reservation_btc/blob/images/0_customer_privkey.png)  
  
2.店  
 restaurant.htmlを開く（Chrome推奨）  
 　秘密鍵（テストネット用）を入力する  
 　予約の日時を元に、デポジット回収の日付を入力する    
 　デポジットを取り出すためのパスワードを入力する  
　 デポジットの金額を入力する
 　客から受け取った公開鍵を入力する
 　アドレスを生成する  
 メールやメッセージアプリを使って  
 　アドレス（redeem scriptを含む）を客に伝える  
  ![画像2](https://github.com/KYpotato/reservation_btc/blob/images/0_restaurant_privkey.png)  
  ![画像3](https://github.com/KYpotato/reservation_btc/blob/images/1_restaurant_gen_address.png)  
  ![画像4](https://github.com/KYpotato/reservation_btc/blob/images/1_restaurant_gen_address_result.png)  
  
3.客  
 customer.html  
 　秘密鍵を入力するする  
 　店から受け取ったアドレスを入力する  
 　アドレスとredeem scriptを検証する  
 BTCウォレット  
 　店から受け取ったアドレスにBTC（テストネット）を送金する  
  ![画像5](https://github.com/KYpotato/reservation_btc/blob/images/2_customer_verify.png)  
  
4.店  
 BTCウォレット、エクスプローラ  
 　客からのの送金を確認して予約完了  
  
・客が来店した場合  
5.店  
 対面で  
 　客にデポジット取り出しのパスワードを渡す  
  
6.客  
 customer.html  
 　店から受け取ったパスワードを入力する  
 　デポジット取り出し先のアドレス（テストネット用）を入力する  
 　デポジットを取り出す  
  ![画像6](https://github.com/KYpotato/reservation_btc/blob/images/3_customer_refund.png)  
　  
・客が来店しなかった（無断キャンセル）場合  
5.店  
 restaurant.html（Chrome推奨）  
 　デポジット回収先のアドレス（テストネット用）を入力する  
 　デポジット回収の日付を過ぎてからデポジットを回収する  
  ![画像7](https://github.com/KYpotato/reservation_btc/blob/images/3_restaurant_collect.png)  
  
## install
`git clone https://github.com/KYpotato/reservation_btc.git`  
`npm install`  
`browserify ./restaurant_front.js -o ./restaurant.js`  
`browserify ./customer_front.js -o ./customer.js`  



