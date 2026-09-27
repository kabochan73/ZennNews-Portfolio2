# Zenn News

Zenn の記事を、お気に入りのタグごとに最新順で読めるニュースアプリ。

**https://frontend-production-7916.up.railway.app**

- 要件定義・設計：[doc/](doc/README.md)

## 作った理由

Zenn のトピックページはトレンド順が中心で、自分が追いかけたい技術の新着を順番に読みにくく、どこまで読んだかも分かりにくいと感じていました。そこで、お気に入りのタグをワンタップで切り替えながら、新しい順に読み、既読・未読がひと目で分かるアプリを作りました。

## 主な機能

- **お気に入りタグ**：42個のタグ（7カテゴリ）から選び、選んだ順にタグバーに並ぶ。タグの切り替えはワンタップ
- **NEW / READ / BOOKMARK**：記事は新しい順。開いた記事は READ に移り、未読の記事だけを NEW で眺められる。開いた直後の記事は、タブを切り替えるまで NEW に薄く残す
- **ブックマーク**：最大100件。タグから外れた古い記事も残る
- **記事の自動取得**：毎朝3〜8時に、タグごとに最新30件を取得し、1タグ最大100件を保持する
- ユーザー名とパスワードだけで登録できる（メールアドレス不要）。スマホと PC の両方に対応

## 技術スタック

| | |
|---|---|
| フロントエンド | Next.js 16（App Router）、React 19、TypeScript、Tailwind CSS 4、TanStack Query 5、React Hook Form ＋ Zod |
| バックエンド | Laravel 13（PHP 8.4）、FrankenPHP、Laravel Sanctum |
| DB | PostgreSQL 17 |
| テスト・品質 | Pest、Vitest ＋ React Testing Library ＋ MSW、Larastan、Pint、ESLint、Prettier |
| インフラ | Docker、Railway（frontend / backend / cron / PostgreSQL）、GitHub Actions |

## 構成

```
ブラウザ
   │  /home/{タグ}（ISR のページ）、/api/*（中継）
   ▼
Next.js（公開）── Sanctum トークンは HttpOnly Cookie に保存
   │  Railway の内部ネットワーク
   ▼
Laravel API（非公開）──► PostgreSQL 17
   ▲
   │  記事の取得後に、Next.js へキャッシュの作り直しを通知
cron（毎朝3〜8時）──► Zenn API
```

## 工夫した点

- **タグを切り替えても Laravel へのアクセスは0回**：記事一覧は全員共通なので、タグごとのページを ISR でキャッシュする。既読・ブックマークなどのユーザーごとのデータは、ブラウザで最初に1回だけ取得して TanStack Query に置き、ブラウザ側で組み合わせる。「全員に同じもの」はサーバー、「その人だけのもの」はブラウザ、と分けた
- **記事の更新はすぐ反映**：取得バッチがタグを1つ取り終えるたびに、Next.js の `/api/revalidate` に通知して、そのタグのページだけを作り直す（共有の秘密値で認証）。通知に失敗しても、8時間ごとに作り直す
- **待たせない操作**：既読・ブックマークは楽観的更新で、画面をすぐ切り替える。失敗したときは、その記事の変更だけを元に戻す
- **トークンを JavaScript から触らせない**：ブラウザは Next.js の Route Handler だけを呼び、Route Handler が HttpOnly Cookie のトークンを付けて Laravel に中継する
- **レート制限を訪問者ごとに効かせる**：Laravel から見ると全員が Next.js の IP になるため、Railway の入口が付ける `X-Real-IP` を Next.js から渡す。本番で実際のヘッダーを確かめ、偽装できないことも確認した。Laravel は外部に公開しない
- **Zenn への配慮**：アクセスするのは取得バッチだけで、1日42回に抑えている（下の「Zenn のデータの扱い」）
- **CI/CD**：push すると GitHub Actions で Lint・静的解析・テスト・ビルドを実行し、通ったコミットだけを Railway がデプロイする（Wait for CI）。変更したサービスだけをデプロイする
- **要件定義から設計・実装計画まで文書化**：[doc/](doc/README.md) に、画面・DB・API・インフラなどを分けてまとめた

## Zenn のデータの扱い

- **Zenn 公式のアプリではありません。** 記事の一覧は Zenn の非公式 API（`https://zenn.dev/api/articles`）から取得しています。API の仕様が変わると、取得できなくなる可能性があります
- **本文は保存・表示しません。** 保存するのはタイトル・絵文字・著者名・著者アイコンの URL・記事へのリンクだけで、記事を読むときは Zenn のページを開きます
- **Zenn への負荷を抑えています。** アクセスするのは記事の取得バッチだけで、1日42回（タグごとに1回、1秒間隔、日本時間の3〜8時に分散）です。利用者の画面表示は自前の DB とキャッシュから返すので、利用者が増えても Zenn へのアクセスは増えません
- **アクセス元を明示しています。** リクエストの User-Agent に、このリポジトリの URL を入れています。Zenn から停止を求められた場合は、すぐに取得を止めます
- **ポートフォリオとして提出したあとは、個人用として使う予定です。**

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

### 記事の取得

Zenn から記事を取得して DB に保存する。本番では Railway Cron がオプションなしで毎時実行する。

```bash
docker compose exec backend php artisan zenn:fetch-articles --all            # 全タグ（約1分。ローカルのデータ作成用）
docker compose exec backend php artisan zenn:fetch-articles --tag=nextjs     # 指定したタグだけ
docker compose exec backend php artisan zenn:fetch-articles --hour=5         # 5時の担当のタグ
docker compose exec backend php artisan zenn:fetch-articles                  # 現在の日本時間の担当のタグ
```

### テスト

```bash
docker compose exec backend ./vendor/bin/pest   # バックエンド（Pest）
docker compose exec frontend npm test           # フロントエンド（Vitest）
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
