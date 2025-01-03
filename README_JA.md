# Eliza 🤖

<div align="center">
  <img src="./docs/static/img/eliza_banner.jpg" alt="Eliza Banner" width="100%" />
</div>

<div align="center">

📖 [Documentation](https://elizaos.github.io/eliza/) | 🎯 [Examples](https://github.com/thejoven/awesome-eliza)

</div>

## 🚩 システム概要

<div align="center">
  <img src="./docs/static/img/eliza_diagram.jpg" alt="Eliza Diagram" width="100%" />
</div>

## ✨ 機能

-   🛠 多機能なDiscord、Twitter、Telegramコネクタ
-   👥 マルチエージェントおよびルームサポート
-   📚 ドキュメントの取り込みと対話を容易に実現可能
-   💾 メモリおよびドキュメントストアへのアクセス
-   🚀 高い拡張性 - 独自のアクションとクライアントを作成可能
-   ☁️  Llama、OpenAI、Anthropic、Groqなど、多くのモデルをサポート
-   📦 とにかく使いやすい！

## チュートリアルビデオ

[AIエージェント開発スクール](https://www.youtube.com/watch?v=ArptLpQiKfI&list=PLx5pnFXdPTRzWla0RaOxALTSTnVq53fKL)

## 🎯 ユースケース

-   🤖 チャットボット
-   🕵️ 自律エージェント
-   📈 ビジネスプロセスの処理
-   🎮 ビデオゲームのNPC
-   🧠 トレーディング

# 🚀 クイックスタートガイド

### 事前に用意する必要があるコンポーネント

- [Python 2.7+](https://www.python.org/downloads/)
- [Node.js 23+](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
- [pnpm](https://pnpm.io/installation)

> **Windowsユーザ向け:** [WSL 2](https://learn.microsoft.com/en-us/windows/wsl/install-manual)が必要です

### スターターを利用する方法（推奨）

```bash
git clone https://github.com/elizaos/eliza-starter.git
cd eliza-starter
cp .env.example .env
pnpm i && pnpm build && pnpm start
```
エージェントが正常に実行されると、"pnpm start:client"を実行することを指示するメッセージが最後に出力されます。
新しくターミナルを開き、上述のコマンドを実行したディレクトリに移動、そこで以下のコマンドを実行し、出力されたURLにアクセスすることでエージェントとチャットを行うことができます。
```bash
pnpm start:client
```
Elizaをカスタマイズするための方法は[ドキュメンテーション](https://elizaos.github.io/eliza/)を参照してください。

### マニュアルによる起動（実際に何をやっているかがわかる人向け）

```bash
# リポジトリのクローン
git clone https://github.com/elizaos/eliza.git

# 最新版のチェックアウト
# 本プロジェクトはとても頻繁に更新されるため、最新版の利用を推奨します
git checkout $(git describe --tags --abbrev=0)

# Elizaのビルドと起動
pnpm i
pnpm build
pnpm start

# 本プロジェクトは頻繁に更新されるため、しばらく触っていなかった場合、プロジェクトを一度クリーンにすることを推奨します
pnpm clean
```

#### その他の必要事項について

Sharpのインストールが必要になる場合があります。もしエージェントの起動時にエラーが発生した場合、以下のコマンドを実行しSharpをインストールしてみてください:

```
pnpm install --include=optional sharp
```

### Gitpodを利用した起動

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/elizaos/eliza/tree/main)

### .env ファイルの編集

以下のように .env.example ファイルを .env としてコピーし、適切な値を設定します。

```
cp .env.example .env
```

.env の利用はオプショナルです。もし、複数の異なるエージェントを実行する場合、シークレット情報はキャラクターJSONを通して設定することができます。

### Elizaの自動起動

以下のコマンドを実行すると、自動的にプロジェクトのセットアップを行い、デフォルトのキャラクターを用いてエージェントを起動します。

```bash
sh scripts/start.sh
```

### キャラクターファイルの編集

1. デフォルトキャラクターを変更する場合、`packages/core/src/defaultCharacter.ts` を開き、設定を変更します

2. カスタムキャラクターを読み込む場合:
    - エージェントの起動時に`pnpm start --characters="path/to/your/character.json"`のようにキャラクターファイルを指定します
    - 複数のキャラクターファイルを同時に読み込むことも可能です
3. X (Twitter)への接続
    - キャラクターファイルの `"clients": []` を `"clients": ["twitter"]` に変更することで接続することができます

### コミュニティと連絡先

- [GitHub Issues](https://github.com/elizaos/eliza/issues). Elizaを使っていて発見したバグや機能追加提案などはこちら
- [Discord](https://discord.gg/ai16z). あなたが作成したアプリケーションをシェアしたり、他のコミュニティメンバーと議論したい場合はこちら

## Contributors

<a href="https://github.com/elizaos/eliza/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=elizaos/eliza" />
</a>

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=elizaos/eliza&type=Date)](https://star-history.com/#elizaos/eliza&Date)
