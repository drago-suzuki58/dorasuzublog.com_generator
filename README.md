# dorasuzublog.com generator

このリポジトリは、私の運営するブログ「[どらすずブログ](https://dorasuzublog.com)」のSSGソースコードです。

コンテンツとテーマは別途管理しており、このリポジトリにはSSGのコードのみが含まれています。

- テーマ(フォーク): [https://github.com/drago-suzuki58/VSC4T](https://github.com/drago-suzuki58/VSC4T)
- コンテンツ: [https://github.com/drago-suzuki58/dorasuzublog.com](https://github.com/drago-suzuki58/dorasuzublog.com)

## 使用方法

このリポジトリをクローンし、Hexoの環境をセットアップしてください。必要なパッケージは`package.json`に記載されています。

```bash
git clone https://github.com/drago-suzuki58/dorasuzublog.com_generator.git
cd dorasuzublog.com_generator
npm install
```

その後、以下のコマンドでブログをビルドおよびローカルサーバーでプレビューできます。

```bash
npm run build
npm run server
```

コンテンツやテーマの管理は別途行います。以下のコマンドを使用して、コンテンツとテーマのクローン、プル、同期を行ってください。

```bash
npm run content:clone
npm run content:pull
npm run content:sync
```

```bash
npm run theme:clone
npm run theme:pull
npm run theme:sync
```

- `clone`: コンテンツまたはテーマのリポジトリをクローンします。
- `pull`: 既存のリポジトリから最新の変更を取得します。
- `sync`: コンテンツまたはテーマを最新の状況に同期します。

コンテンツとテーマのリポジトリは、`package.json`の`config`で指定されています。必要に応じて変更してください。

## ライセンス

このリポジトリのコードはMITライセンスの下で公開されています。詳細は`LICENSE`ファイルを参照してください。
