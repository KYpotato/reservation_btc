# reservation_btc
====

Overview
ビットコインを使ったレストラン予約のためのデポジットシステム

##Description
サーバーなし、客と店のブラウザ（とビットコインブロックチェーンとchain.soのAPI）のみで動作します

##Requirement
npmインストール

##Usage
客
customer.htmlを開く（Chrome推奨）
　秘密鍵を入力する
　公開鍵を生成する
メールやメッセージアプリ
　公開鍵（と予約の日時）を店に伝える

店
restaurant.htmlを開く（Chrome推奨）
　秘密鍵を入力する
　予約の日時を元に、デポジット回収の日付を入力する
　客の公開鍵を入力する
　デポジットを取り出すためのパスワードを入力する
　アドレスを生成する
メールやメッセージアプリ
　アドレス（redeem scriptを含む）を客に伝える

客
customer.html（Chrome推奨）
　秘密鍵を入力するする
　店から受け取ったアドレスを入力する
　アドレスとredeem scriptを検証する
BTCウォレット
　店から受け取ったアドレスにBTCを送金する

店
BTCウォレット、エクスプローラ
　客からのの送金を確認して予約完了

・客が来店した場合
店
対面で
　客にデポジット取り出しのパスワードを渡す

客
customer.html（Chrome推奨）
　店から受け取ったパスワードを入力する
　デポジット取り出し先のアドレスを入力する
　デポジットを取り出す
　
・客が来店しなかった（無断キャンセル）場合
店
restaurant.html（Chrome推奨）
　デポジット回収先のアドレスを入力する
　デポジット回収の日付を過ぎてからデポジットを回収する

#
##install
git clone
npm install
browserify ./restaurant_front.js -o ./restaurant.js
browserify ./customer_front.js -o ./customer.js



