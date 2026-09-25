# API 設計

[← 目次に戻る](README.md)

## 通信の流れ

**ユーザーごとのデータ（🔒 の API）**

```
ブラウザ ──▶ Next.js（Route Handler） ──▶ Laravel API ──▶ PostgreSQL
            HttpOnly Cookie から           Authorization: Bearer {token}
            トークンを取り出して付与する      で本人を確認する
```

**全員共通のデータ（ログイン不要の API：6・9）**

```
Next.js のサーバー（ISR でページを作るとき） ──▶ Laravel API ──▶ PostgreSQL
  作ったページはキャッシュされ、全員に同じものを返す（Laravel へは作り直すときだけアクセスする）
```

- このドキュメントは **Laravel API** の仕様を定義する
- ページのレンダリング方式とキャッシュの作り直しは [フロントエンドの構成](11-frontend-structure.md) を参照
- Next.js の Route Handler は、基本的に同じパス・同じ形でそのまま中継する
- 例外：`/api/register` と `/api/login` では、Next.js が Laravel から受け取ったトークンを HttpOnly Cookie に保存し、ブラウザにはトークンを返さない。`/api/logout` と `DELETE /api/me` では Cookie を削除する

## 共通仕様

| 項目 | 仕様 |
|---|---|
| 形式 | リクエスト・レスポンスともに JSON |
| 認証 | 🔒 の付いた API は `Authorization: Bearer {token}` が必要。ない・無効な場合は 401 |
| ログイン不要の API | 6・9 は全員共通のデータなのでログイン不要。同じ IP から1分間に60回までの回数制限を付ける |
| 日時 | ISO 8601 形式、日本時間（例：`2026-09-23T14:05:00+09:00`） |
| トークンの有効期限 | 1年（Sanctum の `expiration` を設定） |
| Cookie の有効期限 | 1年（HttpOnly / Secure / SameSite=Lax） |

### エラーレスポンス

| ステータス | 意味 | 形 |
|---|---|---|
| 401 | 未ログイン・トークン無効・ログイン失敗 | `{ "message": "..." }` |
| 404 | 対象が存在しない | `{ "message": "..." }` |
| 422 | 入力エラー・ルール違反 | `{ "message": "...", "errors": { "項目名": ["..."] } }`（Laravel 標準） |
| 429 | リクエストが多すぎる（ログインの連続失敗、回数制限の超過） | `{ "message": "..." }` |
| 500 | サーバーエラー | `{ "message": "..." }` |

## API 一覧

| # | メソッド | パス | 認証 | 内容 |
|---|---|---|---|---|
| 1 | POST | `/api/register` | | 新規登録 |
| 2 | POST | `/api/login` | | ログイン |
| 3 | POST | `/api/logout` | 🔒 | ログアウト |
| 4 | GET | `/api/me` | 🔒 | 自分の情報 |
| 5 | DELETE | `/api/me` | 🔒 | 退会 |
| 6 | GET | `/api/tags` | | 全タグ（カテゴリ別） |
| 7 | GET | `/api/me/tags` | 🔒 | お気に入りタグ（並び順どおり） |
| 8 | PUT | `/api/me/tags` | 🔒 | お気に入りタグの保存 |
| 9 | GET | `/api/tags/{slug}/articles` | | タグの記事一覧（最大100件、全員共通） |
| 10 | GET | `/api/me/home` | 🔒 | ホーム用の自分のデータ（ユーザー、お気に入り、既読、ブックマーク） |
| 11 | POST | `/api/articles/{id}/read` | 🔒 | 既読にする |
| 12 | PUT | `/api/articles/{id}/bookmark` | 🔒 | ブックマークする |
| 13 | DELETE | `/api/articles/{id}/bookmark` | 🔒 | ブックマークを外す |

## 共通のデータ形式

### User

```json
{
  "username": "takumi_k",
  "created_at": "2026-09-23T10:00:00+09:00"
}
```

### Tag

```json
{
  "id": 3,
  "slug": "nextjs",
  "name": "Next.js"
}
```

### Article

```json
{
  "id": 123,
  "title": "Next.js 16で実装するSEO最適化",
  "emoji": "🚀",
  "article_type": "tech",
  "url": "https://zenn.dev/sora/articles/abc123",
  "author": {
    "username": "sora",
    "name": "sora",
    "avatar_url": "https://..."
  },
  "published_at": "2026-09-23T14:05:00+09:00"
}
```

- `url` は `https://zenn.dev` ＋ `articles.path` で組み立てる
- `author.avatar_url` は `null` の場合がある
- 既読・ブックマークの状態は含めない（全員共通の形）。画面側で 10 の `read_article_ids` と `bookmarks` を組み合わせて判断する

## 各 API の詳細

### 1. POST `/api/register` 新規登録

リクエスト：

```json
{
  "username": "takumi_k",
  "password": "password123",
  "password_confirmation": "password123"
}
```

| 項目 | ルール |
|---|---|
| username | 必須、半角英数字と `_`、3〜20文字、重複不可（大文字・小文字を区別せずに判定） |
| password | 必須、8文字以上、`password_confirmation` と一致 |

レスポンス：

| ステータス | 内容 |
|---|---|
| 201 | `{ "user": User, "token": "..." }` |
| 422 | 入力エラー。重複時は `errors.username` に「このユーザー名は既に使われています」 |
| 429 | 「しばらく時間をおいてお試しください」（同じ IP から1分間に10回を超えた場合。入力エラーのリクエストも1回と数える） |

### 2. POST `/api/login` ログイン

リクエスト：

```json
{ "username": "takumi_k", "password": "password123" }
```

| ステータス | 内容 |
|---|---|
| 200 | `{ "user": User, "token": "..." }` |
| 401 | 「ユーザー名またはパスワードが違います」 |
| 429 | 「しばらく時間をおいてお試しください」（連続失敗時。Laravel のレート制限） |

### 3. POST `/api/logout` ログアウト 🔒

※ 画面からは使わない（API のみ用意している）。

- 現在のトークンを削除する
- 204（レスポンスボディなし）

### 4. GET `/api/me` 自分の情報 🔒

| ステータス | 内容 |
|---|---|
| 200 | `{ "user": User }` |

### 5. DELETE `/api/me` 退会 🔒

※ 画面からは使わない（API のみ用意している）。

リクエスト：

```json
{ "password": "password123" }
```

| ステータス | 内容 |
|---|---|
| 204 | 退会完了。ユーザーと、お気に入りタグ・既読・ブックマーク・トークンを削除する |
| 422 | パスワードが違う（`errors.password`） |

### 6. GET `/api/tags` 全タグ

- ログイン不要。回数制限あり（同じ IP から1分間に60回まで）
- カテゴリごとにまとめて返す。カテゴリ内は `tags.sort_order` 順
- Next.js のサーバーがタグ設定画面を作るときに使い、結果はキャッシュする（1日ごとに作り直す）

```json
{
  "categories": [
    {
      "name": "開発言語",
      "tags": [
        { "id": 1, "slug": "typescript", "name": "TypeScript" },
        { "id": 2, "slug": "php", "name": "PHP" }
      ]
    }
  ]
}
```

### 7. GET `/api/me/tags` お気に入りタグ 🔒

`user_tags.position` の昇順で返す。

```json
{
  "tags": [
    { "id": 3, "slug": "nextjs", "name": "Next.js" },
    { "id": 1, "slug": "typescript", "name": "TypeScript" }
  ]
}
```

### 8. PUT `/api/me/tags` お気に入りタグの保存 🔒

リクエスト（並び順どおりのタグIDの配列）：

```json
{ "tag_ids": [3, 1, 7] }
```

| 項目 | ルール |
|---|---|
| tag_ids | 必須、1個以上、存在するタグID、重複不可 |

- 送られた配列で、お気に入りタグを丸ごと置き換える。配列の順番を `position` として保存する

| ステータス | 内容 |
|---|---|
| 200 | 保存後のお気に入りタグ（7 と同じ形） |
| 422 | 0個・存在しないタグIDなど |

### 9. GET `/api/tags/{slug}/articles` タグの記事一覧

- ログイン不要。回数制限あり（同じ IP から1分間に60回まで）
- そのタグの記事（`article_tag` にある、最大100件）を、公開日時が新しい順（同じなら id の大きい順）に返す
- 既読・ブックマークの状態は含めない（全員共通のデータ）
- Next.js のサーバーが ISR でホーム（`/home/[slug]`）を作るときに使う。ブラウザからは直接呼ばない
- NEW / READ の振り分けと件数は、画面側で 10 の `read_article_ids` と組み合わせて計算する

```json
{
  "tag": { "id": 3, "slug": "nextjs", "name": "Next.js" },
  "articles": [ Article, Article ]
}
```

| ステータス | 内容 |
|---|---|
| 200 | 上記 |
| 404 | タグが存在しない |

### 10. GET `/api/me/home` ホーム用の自分のデータ 🔒

ホームを開いたときに、ユーザーごとのデータを1回でまとめて返す。

```json
{
  "user": User,
  "favorite_tags": [ Tag, Tag ],
  "read_article_ids": [123, 456, 789],
  "bookmarks": [ Article, Article ]
}
```

| 項目 | 内容 |
|---|---|
| `user` | ヘッダーのユーザー名に使う |
| `favorite_tags` | お気に入りタグ（`user_tags.position` の昇順）。タグバー・サイドバーと、`/home` からの移動先に使う |
| `read_article_ids` | 自分が読んだ記事の ID すべて（記事が削除されると既読も消えるため、件数には上限がある） |
| `bookmarks` | ブックマークした記事すべて（最大100件）。ブックマークした日時が新しい順。100件の枠から押し出された記事も含むため、ID ではなく記事の中身ごと返す |

- 既読・ブックマークの操作（11〜13）をしたときは、画面側でこのデータのキャッシュを直接書き換える（取り直さない）

### 11. POST `/api/articles/{id}/read` 既読にする 🔒

- 既読にする。既に既読でもエラーにしない（何度呼んでも同じ結果）
- 204（レスポンスボディなし）
- 記事が存在しない場合は 404

### 12. PUT `/api/articles/{id}/bookmark` ブックマークする 🔒

- 既にブックマーク済みでもエラーにしない

| ステータス | 内容 |
|---|---|
| 204 | ブックマーク済みの状態になった |
| 404 | 記事が存在しない |
| 422 | 上限の100件に達している（「ブックマークは100件までです。いくつか外してください」） |

### 13. DELETE `/api/articles/{id}/bookmark` ブックマークを外す 🔒

- ブックマークしていなくてもエラーにしない
- 204（レスポンスボディなし）
- 記事が存在しない場合は 404

## 画面と API の対応

| 画面 | 使う API |
|---|---|
| 新規登録 | 1 |
| ログイン | 2 |
| ホーム（`/home/[slug]`） | 9（Next.js のサーバーが ISR で使う）、10、11、12、13 |
| ホームの入り口（`/home`） | 10（一番左のお気に入りタグへ移動するため） |
| タグ設定（`/home/tags`） | 6（Next.js のサーバーがキャッシュして使う）、7、8、10（ヘッダーのユーザー名） |

- 3（ログアウト）・4（自分の情報）・5（退会）は、画面からは使わない（API のみ用意している）
- `GET /api/bookmarks` は 10 に統合したため削除した
