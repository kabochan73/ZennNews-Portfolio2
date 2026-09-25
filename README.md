# Zenn News

Zenn の記事を、お気に入りのタグごとに最新順で読めるニュースアプリ。

- 要件定義・設計：[doc/](doc/README.md)

## 開発環境

必要なもの：Docker

### 初回セットアップ

```bash
cp backend/.env.example backend/.env
docker compose up -d --build
docker compose exec backend php artisan key:generate
docker compose exec backend php artisan migrate
```

### 起動・停止

```bash
docker compose up -d   # 起動
docker compose down    # 停止
```

| サービス | URL |
|---|---|
| フロントエンド（Next.js） | http://localhost:3000 |
| バックエンド（Laravel） | http://localhost:8000 |
| DB（PostgreSQL 17） | localhost:5432（user: `zennnews` / password: `secret`） |

### テスト

```bash
docker compose exec backend ./vendor/bin/pest
```

テストは開発用 DB（`zennnews`）とは別の `zennnews_test` を使う。`zennnews_test` は DB コンテナの初回作成時に `docker/postgres/init.sql` で自動作成される。
それ以前に DB コンテナを作っていた場合は、一度だけ手動で作成する：

```bash
docker compose exec db psql -U zennnews -d postgres -c "CREATE DATABASE zennnews_test OWNER zennnews"
```

### Lint・フォーマット

```bash
docker compose exec backend composer lint     # Pint + Larastan
docker compose exec backend composer format   # Pint で自動整形
docker compose exec frontend npm run lint     # ESLint + Prettier
docker compose exec frontend npm run format   # Prettier で自動整形
```
