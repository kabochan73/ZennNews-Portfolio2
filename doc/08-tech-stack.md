# 技術スタック詳細

[← 目次に戻る](README.md)

バージョンは 2026-09-23 時点の最新安定版を基準にしている。

## バックエンド

| 項目 | 採用技術 | バージョン | 備考 |
|---|---|---|---|
| 言語 | PHP | 8.4 | Laravel 13 の要件（PHP 8.3 以上）を満たす |
| フレームワーク | Laravel | 13 | |
| Web サーバー | FrankenPHP | 最新 | Docker コンテナ1つで Laravel を動かす |
| 認証 | Laravel Sanctum | 4 | トークン方式 |
| API レスポンス | Laravel API Resource | － | JSON の形を整える |
| 外部 API の呼び出し | Laravel Http クライアント | － | Zenn API の取得に使う |
| テスト | Pest | 5 | |
| コード整形 | Laravel Pint | 1 | |
| 静的解析 | Larastan | 3 | |
| AI 開発支援 | Laravel Boost | 2 | AI エージェント向けのガイドライン・スキル・MCP サーバー。MCP はプロジェクト直下の `.mcp.json` から Docker 経由で起動する |

## フロントエンド

| 項目 | 採用技術 | バージョン | 備考 |
|---|---|---|---|
| 実行環境 | Node.js | 24（LTS） | |
| パッケージマネージャー | npm | Node.js 付属 | |
| フレームワーク | Next.js（App Router） | 16 | |
| UI ライブラリ | React | 19 | |
| 言語 | TypeScript | Next.js 標準のバージョン | TypeScript 7 は対応状況を見て判断する |
| スタイル | Tailwind CSS | 4 | |
| UI 部品 | 自作 | － | UI 部品ライブラリは使わない。ハンバーガーメニュー、確認ダイアログなども自作する |
| データ取得・キャッシュ | TanStack Query | 5 | タグ切り替え時のキャッシュ、既読・ブックマークの楽観的更新 |
| フォーム | React Hook Form ＋ Zod | 7 / 4 | ログイン・新規登録の入力チェック |
| Laravel との通信 | Next.js Route Handler | － | Sanctum トークンを HttpOnly Cookie に保持し、Route Handler 経由で Laravel API を呼ぶ |
| コードチェック | ESLint | 10 | |
| コード整形 | Prettier | 3 | |

## テスト

| 種類 | 採用技術 | バージョン |
|---|---|---|
| バックエンド | Pest | 5 |
| フロントエンド（コンポーネント） | Vitest ＋ React Testing Library | 5 / 16 |
| API のモック | MSW | 最新 |
| E2E | Playwright | 1.63 |

## DB・インフラ

| 項目 | 採用技術 | 備考 |
|---|---|---|
| DB | PostgreSQL 17 | 開発環境は `postgres:17`、本番は Railway の `postgres-ssl:17`。Railway はデフォルトだと 16 になる可能性があるため、17 を明示的に指定する（サポート期限：2029年11月） |
| コンテナ | Docker / docker compose | |
| ホスティング | Railway | frontend / backend / cron / PostgreSQL |
| CI | GitHub Actions | |
