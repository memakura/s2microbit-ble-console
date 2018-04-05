# s2microbit-ble-console

[Qiitaの記事](https://qiita.com/memakura/items/11a0426f9060da1ded7e#%E3%81%BE%E3%81%A8%E3%82%81s2microbit-ble-console-%E3%81%AE%E3%82%A4%E3%83%B3%E3%82%B9%E3%83%88%E3%83%BC%E3%83%AB%E3%81%A8%E4%BD%BF%E7%94%A8%E6%96%B9%E6%B3%95)に詳しい説明があります．

1. hex ファイルを micro:bit に書き込んでおきます．
1. Scratch 2 のプロジェクト (.sb2) をダウンロードして開いておきます．（Scratch 2 を開き，シフトを押しながらファイルを押して「実験的なHTTP拡張を読み込み」から拡張ブロックの定義ファイル (.s2e) ファイルを開いても使えます．
1. `npm start` とすると node で s2microbit.js を実行します．
1. micro:bit 側はLEDマトリクスが「ハート」を経て「チェックマーク」に変わり，Scratch 2 側は「その他」のs2microbit-ble の横にある赤丸が緑色になれば接続完了で使用できます．

## Requirements

Windows: same as [node-gyp](https://github.com/nodejs/node-gyp)

- Node 8, npm
- Scratch 2 offline
- Visual Studio 2015
- Python 2.7

## Installation

```
> git clone https://github.com/memakura/s2microbit-ble-console.git
> activate py27 (assume that 'py27' is the name of Python 2.7 virtual environment on Anaconda)
(py27)> npm install
```

## How to use

1. Copy .hex file from this repository to your micro:bit.
1. Download and open .sb2 file from this repository. Alternatively, you can download .s2e file and open it from Scratch 2 offline (click [File] menu with a shift key).
1. `npm start`
1. Connection is completed if the micro:bit displays "Heart" image and then "Yes" (check mark). From "More blocks" section of the scratch 2 offline editor, you can see the color of the circle turns from red to green.
