# SECOND JACKPOT

Twitch配信用のリアルタイム3陣営連打ゲームです。6分間の連打で**2位の陣営が勝利**します。残り10秒は全員の票数と順位を非表示にします。

## ローカル起動

Node.js 20以上を用意し、主催者用パスワードを環境変数 HOST_PASSWORD に設定して `npm start` を実行。ブラウザで http://localhost:3000 を開きます。

## Render

Web Service / Node / Build Command: `npm install` / Start Command: `npm start` / Environment: `HOST_PASSWORD` を設定。無料プランではスリープや再起動が発生し、メモリ上の進行状況は消えます。事前に参加人数で負荷試験してください。

## 注意

陣営の固定はブラウザCookie単位であり、別ブラウザやCookie削除で再選択できます。クリック数の不正防止は厳密ではありません。通信切断中のクリックは保証されません。