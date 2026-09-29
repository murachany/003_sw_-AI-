# 生成AIパスポート一問一答

GUGA（生成AI活用普及協会）の「生成AIパスポート試験」を学習するための、一問一答Webアプリケーションです。

## 現在の状態

フェーズ1の公開基盤を構築中です。現在はアプリの最小表示のみ実装しています。問題データと演習機能は後続フェーズで追加します。

## 対象資格について

「生成AIパスポート」はIPA主催の資格ではなく、GUGA主催の資格です。本アプリはGUGAの生成AIパスポート試験を対象とします。

本試験の過去問を転載せず、公式シラバス・公式資料などを確認したオリジナル問題を、出典区分と参照リンク付きで収録します。

## 開発環境

- Node.js 20以上
- npm

## ローカルで実行する

```powershell
npm install
npm run dev
```

ブラウザで表示されたローカルURLを開いてください。

## 検証コマンド

```powershell
npm run check
npm run build
```

ビルド成果物は`dist/`に出力されます。

## GitHub Pagesへの公開

`.github/workflows/deploy-pages.yml`により、`main`ブランチへのプッシュ時に以下を実行します。

1. 依存関係をインストール
2. TypeScriptの型チェック
3. Viteビルド
4. GitHub Pagesへデプロイ

GitHub側では、リポジトリの **Settings > Pages > Build and deployment > Source** を **GitHub Actions** に設定してください。リポジトリ作成・設定・初回プッシュは人間が行います。

Viteの`base`を相対パスにしているため、`https://<user>.github.io/<repository>/`のようなリポジトリ配下のURLでも静的アセットを読み込めます。

## ディレクトリ構成

```text
.
├─ .github/workflows/deploy-pages.yml
├─ 010_doc/
├─ public/404.html
├─ src/main.ts
├─ src/style.css
├─ index.html
├─ package.json
├─ tsconfig*.json
└─ vite.config.ts
```

## 公式資料

- [GUGA 生成AIパスポート公式概要](https://guga.or.jp/outline/)
- [GUGA 生成AIパスポート公式シラバス](https://guga.or.jp/assets/syllabus.pdf)
- [IPA 生成AI関連サンプル問題](https://www.ipa.go.jp/shiken/syllabus/t6hhco000000wyrz-att/ip_generativeai_sample.pdf)
