# インフラ・開発運用

[← 目次に戻る](README.md)

## 開発環境（docker compose）

```
docker compose up
 ├── frontend … Next.js（localhost:3000）
 ├── backend  … Laravel（localhost:8000）
 └── db       … PostgreSQL 17（postgres:17）
```

## 本番環境（Railway）

```
Railway プロジェクト
 ├── frontend   … Next.js（frontend/Dockerfile）
 ├── backend    … Laravel（backend/Dockerfile）
 ├── cron       … backend と同じイメージで、記事取得コマンドのみ実行（0 18-23 * * * UTC）
 └── PostgreSQL … Railway が提供するもの（バージョン 17 を明示的に指定する）
```

## リポジトリ・CI/CD

- GitHub のモノレポ（`frontend/` と `backend/` を1つのリポジトリに置く）
- ブランチは切らず、`main` に直接 push する
- push のたびに GitHub Actions でテストを実行する
- `main` のテストが通ったら、Railway が自動でデプロイする（Railway の「Wait for CI」を有効にし、テスト失敗時はデプロイしない）

## テスト

| 種類 | ツール | 対象 |
|---|---|---|
| バックエンド | Pest | API、記事の取得・削除処理、NEW / READ / BOOKMARK のルール、ブックマーク上限 |
| フロントエンド | Vitest ＋ React Testing Library | タグバー、タブなどのコンポーネント |
| E2E | Playwright | 新規登録 → タグ選択 → 記事を読む → ブックマーク の一連の流れ |
