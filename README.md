# s2microbit-ble-console

日本語: [Qiitaの記事に詳しい説明があります](https://qiita.com/drafts/11a0426f9060da1ded7e#（まとめ）s2microbit-ble-console のインストールと使用方法)．

## Installation

### Requirements

Windows: same as [node-gyp](https://github.com/nodejs/node-gyp)

- Node 8, npm
- Scratch 2 offline
- Visual Studio 2015
- Python 2.7

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
