# API 設計

[← 目次に戻る](README.md)

## 通信の流れ

```
ブラウザ ──▶ Next.js（Route Handler） ──▶ Laravel API ──▶ PostgreSQL
            HttpOnly Cookie から           Authorization: Bearer {token}
            トークンを取り出して付与する      で本人を確認する
```

- このドキュメントは **Laravel API** の仕様を定義する
- Next.js の Route Handler は、基本的に同じパス・同じ形でそのまま中継する
- 例外：`/api/register` と `/api/login` では、Next.js が Laravel から受け取ったトークンを HttpOnly Cookie に保存し、ブラウザにはトークンを返さない。`/api/logout` と `DELETE /api/me` では Cookie を削除する

## 共通仕様

| 項目 | 仕様 |
|---|---|
| 形式 | リクエスト・レスポンスともに JSON |
| 認証 | 🔒 の付いた API は `Authorization: Bearer {token}` が必要。ない・無効な場合は 401 |
| 日時 | ISO 8601 形式、日本時間（例：`2026-09-23T14:05:00+09:00`） |
| トークンの有効期限 | 1年（Sanctum の `expiration` を設定） |
| Cookie の有効期限 | 1年（HttpOnly / Secure / SameSite=Lax） |

### エラーレスポンス

| ステータス | 意味 | 形 |
|---|---|---|
| 401 | 未ログイン・トークン無効・ログイン失敗 | `{ "message": "..." }` |
| 404 | 対象が存在しない | `{ "message": "..." }` |
| 422 | 入力エラー・ルール違反 | `{ "message": "...", "errors": { "項目名": ["..."] } }`（Laravel 標準） |
| 429 | リクエストが多すぎる（ログインの連続失敗など） | `{ "message": "..." }` |
| 500 | サーバーエラー | `{ "message": "..." }` |

## API 一覧

| # | メソッド | パス | 認証 | 内容 |
|---|---|---|---|---|
| 1 | POST | `/api/register` | | 新規登録 |
| 2 | POST | `/api/login` | | ログイン |
| 3 | POST | `/api/logout` | 🔒 | ログアウト |
| 4 | GET | `/api/me` | 🔒 | 自分の情報 |
| 5 | DELETE | `/api/me` | 🔒 | 退会 |
| 6 | GET | `/api/tags` | 🔒 | 全タグ（カテゴリ別） |
| 7 | GET | `/api/me/tags` | 🔒 | お気に入りタグ（並び順どおり） |
| 8 | PUT | `/api/me/tags` | 🔒 | お気に入りタグの保存 |
| 9 | GET | `/api/tags/{slug}/articles` | 🔒 | タグの記事一覧（最大100件） |
| 10 | GET | `/api/bookmarks` | 🔒 | ブックマーク一覧 |
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
  "published_at": "2026-09-23T14:05:00+09:00",
  "is_read": false,
  "is_bookmarked": true
}
```

- `url` は `https://zenn.dev` ＋ `articles.path` で組み立てる
- `author.avatar_url` は `null` の場合がある

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
| username | 必須、半角英数字と `_`、3〜20文字、重複不可 |
| password | 必須、8文字以上、`password_confirmation` と一致 |

レスポンス：

| ステータス | 内容 |
|---|---|
| 201 | `{ "user": User, "token": "..." }` |
| 422 | 入力エラー。重複時は `errors.username` に「このユーザー名は既に使われています」 |

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

- 現在のトークンを削除する
- 204（レスポンスボディなし）

### 4. GET `/api/me` 自分の情報 🔒

| ステータス | 内容 |
|---|---|
| 200 | `{ "user": User }` |

### 5. DELETE `/api/me` 退会 🔒

リクエスト：

```json
{ "password": "password123" }
```

| ステータス | 内容 |
|---|---|
| 204 | 退会完了。ユーザーと、お気に入りタグ・既読・ブックマーク・トークンを削除する |
| 422 | パスワードが違う（`errors.password`） |

### 6. GET `/api/tags` 全タグ 🔒

カテゴリごとにまとめて返す。カテゴリ内は `tags.sort_order` 順。

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

### 9. GET `/api/tags/{slug}/articles` タグの記事一覧 🔒

- そのタグの記事（`article_tag` にある、最大100件）を、公開日時が新しい順に返す
- NEW / READ の振り分けと件数の計算は、画面側で `is_read` を見て行う（タブの切り替えで通信しない）
- お気に入りに登録していないタグでも取得できる（制限しない）

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

### 10. GET `/api/bookmarks` ブックマーク一覧 🔒

- ブックマークした日時が新しい順に、すべて返す（最大100件）
- 100件の枠から押し出された記事も含む

```json
{
  "articles": [ Article, Article ]
}
```

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
| タグ選択 | 6、7、8 |
| マイフィード | 7、9、10、11、12、13 |
| 設定 | 3、4、5、7（お気に入りタグの個数） |
