# 記事の取得（バッチ処理）

[← 目次に戻る](README.md)

## 仕様

| 項目 | 仕様 |
|---|---|
| 取得元 | Zenn 非公式 API `GET https://zenn.dev/api/articles?topicname={slug}&order=latest&count=30` |
| 頻度 | 各タグ1日1回 |
| 取得件数 | 1回につき最新30件 |
| 実行時間 | 日本時間の3時〜8時に1時間おき（6回）。1回最大7タグ、合計42タグ。タグを増やす場合は1時間あたりのタグ数を増やす |
| タグの割り当て | どの時間にどのタグを取るかは、Seeder の `fetch_hour` で指定する |
| 実行方法 | Railway Cron が Laravel のコマンドを実行する。コマンドは現在の日本時間を見て、該当する `fetch_hour` のタグを取得する |
| Cron の設定 | Railway Cron は UTC なので `0 18-23 * * *`（日本時間の3〜8時） |
| 記事の種類 | Tech と Idea の両方 |
| 保存する項目 | 表示に使うものだけ（いいね数・コメント数は保存しない） |
| 重複 | 保存済みの記事（Zenn の記事IDで判定）は、タイトル・絵文字・著者名・アイコンを最新の内容で上書きする。別のタグで見つかった場合は、そのタグとの紐付けを追加する |
| 保持件数 | 1タグ最大100件。超えた分は古い順に削除（詳細は [DB 設計の「記事の削除ルール」](05-database.md#記事の削除ルール)） |
| 運用開始直後 | 初回も通常どおり30件のみ取得する。1タグあたり30件から始まり、日々溜まって100件に近づく |
| 取りこぼし | 1日に30件を超えて投稿されるタグ（例：Python）は、多い日に取りこぼす。これは許容する |
| 失敗時 | そのタグはスキップし、翌日に改めて取得する。取得の記録（ログテーブル）は持たない |

## 取り込むタグ一覧（42個）

定義は `backend/database/seeders/TagSeeder.php`。タグの追加・変更はこのファイルを修正する。

### カテゴリ別（タグ選択画面での表示順）

| カテゴリ | タグ（Zenn のトピック名） |
|---|---|
| 開発言語（10） | TypeScript（`typescript`）、JavaScript（`javascript`）、HTML（`html`）、CSS（`css`）、PHP（`php`）、Python（`python`）、Go（`go`）、Rust（`rust`）、Java（`java`）、Ruby（`ruby`） |
| フレームワーク・ライブラリ（8） | Node.js（`nodejs`）、Laravel（`laravel`）、Next.js（`nextjs`）、React（`react`）、Vue.js（`vue`）、Nuxt.js（`nuxt`）、NestJS（`nestjs`）、Rails（`rails`） |
| インフラ・クラウド（10） | AWS（`aws`）、Google Cloud（`gcp`）、Azure（`azure`）、Docker（`docker`）、Kubernetes（`kubernetes`）、Terraform（`terraform`）、Vercel（`vercel`）、Cloudflare（`cloudflare`）、Linux（`linux`）、Network（`network`） |
| データベース（2） | DB（`db`）、SQL（`sql`） |
| AI（3） | Claude（`claude`）、ChatGPT（`chatgpt`）、Gemini（`gemini`） |
| デザイン（3） | デザイン（`design`）、UI（`ui`）、UX（`ux`） |
| その他（6） | セキュリティ（`security`）、Git（`git`）、GitHub Actions（`githubactions`）、テスト（`test`）、アルゴリズム（`algorithm`）、AtCoder（`atcoder`） |

### 取得時間

| 時間 | タグ |
|---|---|
| 3時 | TypeScript、JavaScript、HTML、CSS、PHP、Python、Go |
| 4時 | Rust、Java、Ruby、Node.js、Laravel、Next.js、React |
| 5時 | Vue.js、Nuxt.js、NestJS、Rails、AWS、Google Cloud、Azure |
| 6時 | Docker、Kubernetes、Terraform、Vercel、Cloudflare、Linux、Network |
| 7時 | DB、SQL、Claude、ChatGPT、Gemini、デザイン、UI |
| 8時 | UX、セキュリティ、Git、GitHub Actions、テスト、アルゴリズム、AtCoder |

### 候補から外したタグ（2026-09-25 調査）

| タグ | 理由 |
|---|---|
| AI（`ai`）、Claude Code | 投稿が多すぎる（1日数十件）。AI 関連は Claude・ChatGPT・Gemini で扱う |
| PostgreSQL、MySQL、SQLite | DB・SQL にまとめる |
| Heroku、MongoDB | ほぼ投稿がない |
| Svelte、Angular、Redis、Firebase | 投稿が少ない（1日1件未満） |
| Flutter、キャリア、Web、開発環境 | 対象外とした |

※ `db`（DB）と `database`（Database）は Zenn 上では別のトピック。`db` を使う。

## 参考：タグごとの1日の投稿数（2026-09-23 調査）

| タグ | 1日の投稿数 |
|---|---|
| AI（取り込まない） | 約86件 |
| Claude Code（取り込まない） | 約45件 |
| Python | 約29件 |
| Claude | 約24件 |
| TypeScript | 約23件 |
| AWS | 約12件 |
| Go | 約7件 |
| Laravel | 約2件 |
