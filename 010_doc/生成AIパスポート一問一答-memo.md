# 生成AIパスポート一問一答-メモ

## メモ

### 2026年9月29日　GitHub登録からGitHub Pages公開まで

1. GitHubでリポジトリを作成する。
2. ローカルプロジェクトをリポジトリへプッシュする。

```powershell
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<ユーザー名>/<リポジトリ名>.git
git push -u origin main
```

3. GitHubリポジトリの **Settings > Pages** を開く。
4. **Build and deployment > Source** で **GitHub Actions** を選択する。
5. **Actions > Deploy to GitHub Pages** を開く。
6. `main`ブランチを指定して **Run workflow** を実行する。
7. `build`と`Deploy`が成功したことを確認する。
8. `https://<ユーザー名>.github.io/<リポジトリ名>/`を開く。
9. 古い画面が表示される場合は、`Ctrl + F5`またはシークレットウィンドウで再読み込みする。

GitHub Actionsのワークフローは、`main`ブランチへのプッシュでも自動実行される。

## アイデア

- 問題データを追加する前に、問題データの型・出典区分・URL検証を実装する。
- 公式過去問と誤認されないよう、画面上にも「本試験過去問ではない」旨を表示する。
- 問題解説には、正解の理由だけでなく、各誤答が不適切な理由も記載する。
- GUGAの生成AIパスポートと、IPA ITパスポートの生成AI関連問題は別コースとして扱う。

## エラーメモ

### GitHub Pagesで白画面になった原因と対処

- **原因**：GitHub PagesがViteのビルド成果物`dist/`ではなく、リポジトリ直下の開発用`index.html`を配信していた。
- **症状**：`/src/main.ts`が404になり、`#app`が空のままになった。
- **対処**：GitHub PagesのSourceを`GitHub Actions`に変更し、`Deploy to GitHub Pages`ワークフローを再実行した。
- **補足**：デプロイ成功直後はCDNキャッシュにより古いHTMLが残る場合がある。クエリパラメータ、強制再読み込み、シークレットウィンドウで確認する。

## 残件

現時点でメモ固有の残件なし。実装に関する残件は、[生成AIパスポート一問一答-task.md](./生成AIパスポート一問一答-task.md)で管理する。
