# Felice Haruiro OBSオーバーレイ

PLP-CUPと同じFirebaseプロジェクトを利用しつつ、データは `feliceRooms` へ分離して保存します。既存のPLP-CUPの表示内容には干渉しません。

## 機能

- αチーム名：自由入力、右揃え
- βチーム名：自由入力、右揃え
- α／β SET SCORE：それぞれ±操作、初期値0
- ROUND／GAME：それぞれ±操作、初期値1
- 操作画面内の可変式リアルタイムプレビュー
- OBSでは透明背景で文字と数字だけを表示

## Firebase設定

Realtime Databaseの「ルール」に `database.rules.json` の内容を貼り付けて公開してください。このファイルには既存PLP-CUP用の `rooms` と、新規オーバーレイ用の `feliceRooms` の両方が含まれます。

Authenticationでは、既存PLP-CUPと同じメールアドレス／パスワードを使用できます。

## GitHub Pages

このフォルダ内のファイルを、新しいGitHubリポジトリのルートへアップロードしてPagesを有効にします。

公開URLが `https://ユーザー名.github.io/リポジトリ名/` の場合：

- 操作画面：`https://ユーザー名.github.io/リポジトリ名/?room=felice-haruiro`
- OBS：`https://ユーザー名.github.io/リポジトリ名/overlay.html?room=felice-haruiro`

OBSのブラウザソースは幅1280・高さ720、ローカルファイルはオフに設定します。
