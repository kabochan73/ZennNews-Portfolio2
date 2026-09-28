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

URL：https://frontend-production-7916.up.railway.app

```
インターネット
   │
   ▼
frontend（Next.js）… 公開はここだけ
   │  内部ネットワーク（backend.railway.internal:8000）
   ▼
backend（Laravel）──► PostgreSQL 17
   ▲                     ▲
   │ 取得後の通知         │
cron（毎日 3〜8 時）──────┘ ──► Zenn API
```

- 4つのサービスはすべて、シンガポール（`asia-southeast1-eqsg3a`）で動かす。初期設定のカリフォルニアでは日本からの往復が遠く、タグを切り替えたときの待ち時間が目立ったため。Railway には東京の地域がないので、一番近いシンガポールにした
- backend・cron・PostgreSQL には公開ドメインも TCP プロキシも付けない。Laravel は `X-Forwarded-For` を信用する設定なので、外から直接呼べると IP を偽装できてしまうため
- 設定は Railway のダッシュボード（MCP）で行い、このページに記録する。`railway.json` は非推奨になっていて、新しく作ったサービスでは使えないため

### サービスの設定

| 項目 | frontend | backend | cron |
|---|---|---|---|
| ソース | GitHub `kabochan73/ZennNews-Portfolio2`（main） | 同じ | 同じ |
| ルートディレクトリ | `/frontend` | `/backend` | `/backend` |
| ビルド | `frontend/Dockerfile`（最後の `prod` ステージ） | `backend/Dockerfile`（最後の `prod` ステージ） | backend と同じ |
| 起動コマンド | Dockerfile のまま（`node server.js`） | Dockerfile のまま（`php artisan optimize` → FrankenPHP） | `php artisan zenn:fetch-articles` |
| デプロイ前のコマンド | なし | `/bin/sh -c "php artisan migrate --force && php artisan db:seed --class=TagSeeder --force"` | なし |
| ヘルスチェック | `/` | `/up` | なし |
| 監視するパス | `/frontend/**` | `/backend/**` | `/backend/**` |
| cron | なし | なし | `0 18-23 * * *`（UTC。日本時間の3〜8時） |
| 再起動 | 初期値 | 初期値 | `NEVER`（1回実行して終わるため） |
| 公開ドメイン | あり | なし | なし |

- Dockerfile を使うサービスでは、コマンドはシェルを通さずに実行される。`&&` を使うデプロイ前のコマンドは `/bin/sh -c` で包む
- PostgreSQL は Railway 公式のテンプレートで作成した。テンプレートの初期値が 18 だったため、イメージを `ghcr.io/railwayapp-templates/postgres-ssl:17` に替え、空のボリュームを作り直した

### 環境変数

秘密の値（`APP_KEY`、`REVALIDATE_SECRET`）は backend にだけ置き、ほかのサービスは参照する。

| サービス | 変数 | 値 |
|---|---|---|
| backend | `APP_KEY` | ランダムに生成した値 |
| | `REVALIDATE_SECRET` | ランダムに生成した値 |
| | `DB_CONNECTION` / `DB_URL` | `pgsql` / `${{Postgres.DATABASE_URL}}` |
| | `PORT` | `8000` |
| | `SESSION_DRIVER` | `array`（API だけなのでセッションは保存しない） |
| | `FRONTEND_URL` | `http://${{frontend.RAILWAY_PRIVATE_DOMAIN}}:${{frontend.PORT}}` |
| frontend | `LARAVEL_API_URL` | `http://${{backend.RAILWAY_PRIVATE_DOMAIN}}:${{backend.PORT}}` |
| | `REVALIDATE_SECRET` | `${{backend.REVALIDATE_SECRET}}` |
| | `PORT` | `3000` |
| | `HOSTNAME` | `::`（下の「ネットワーク」を参照） |
| cron | `APP_KEY` / `REVALIDATE_SECRET` | `${{backend.APP_KEY}}` / `${{backend.REVALIDATE_SECRET}}` |
| | `DB_CONNECTION` / `DB_URL` | backend と同じ |
| | `FRONTEND_URL` | backend と同じ |

`APP_ENV=production`、`APP_DEBUG=false`、`LOG_CHANNEL=stderr` は `backend/Dockerfile` で設定している。

### ネットワーク

- Railway の入口は frontend に **IPv6** で接続してくる。Next.js を `0.0.0.0`（IPv4 だけ）で待ち受けるとつながらないため、`HOSTNAME=::` で IPv4 と IPv6 の両方を待ち受ける
- 利用者の IP は、Railway の入口が付ける `X-Real-IP` を使う（詳しくは [非機能要件](06-non-functional.md)）

### 運用メモ

- 運用開始時（2026-09-27）に一度だけ、cron の起動コマンドを `php artisan zenn:fetch-articles --all` にして実行し、全タグの記事を取得した。その後、通常のコマンドと cron の時刻に戻した
- 2026-09-28 に、4つのサービスをカリフォルニア（`sfo`）からシンガポールへ移した。PostgreSQL はボリュームごと移すため、数分間止まった。キャッシュ済みのタグページの応答は、約0.19秒から約0.16秒になった

## リポジトリ・CI/CD

- GitHub のモノレポ（`frontend/` と `backend/` を1つのリポジトリに置く）
- ブランチは切らず、`main` に直接 push する
- push のたびに GitHub Actions（`.github/workflows/ci.yml`）で、次の2つのジョブを同時に実行する
  - backend：Pint、Larastan、Pest（PostgreSQL 17 を CI のサービスとして起動）
  - frontend：ESLint、Prettier、Vitest、ビルド（型チェックを含む。ビルド中は Laravel を呼ばない）
- `main` のテストが通ったら、Railway が自動でデプロイする（Railway の「Wait for CI」を有効にし、テスト失敗時はデプロイしない）。監視するパスが変わったサービスだけがデプロイされ、それ以外は SKIPPED になる

## テスト

| 種類 | ツール | 対象 |
|---|---|---|
| バックエンド | Pest | API、記事の取得・削除処理、NEW / READ / BOOKMARK のルール、ブックマーク上限 |
| フロントエンド | Vitest ＋ React Testing Library | タグバー、タブなどのコンポーネント |

E2E テスト（Playwright）は作らない。画面の流れは手動で確認し、問題が見つかったらその都度直す。
