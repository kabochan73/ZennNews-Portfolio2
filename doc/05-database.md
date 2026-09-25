# DB 設計

[← 目次に戻る](README.md)

## ER 図

```mermaid
erDiagram
    users ||--o{ user_tags : "お気に入り"
    tags ||--o{ user_tags : ""
    tags ||--o{ article_tag : ""
    articles ||--o{ article_tag : ""
    users ||--o{ article_reads : "既読"
    articles ||--o{ article_reads : ""
    users ||--o{ bookmarks : "ブックマーク"
    articles ||--o{ bookmarks : ""

    users {
        bigint id PK
        varchar username UK
        varchar password
        timestamptz created_at
        timestamptz updated_at
    }
    tags {
        bigint id PK
        varchar slug UK
        varchar name
        varchar category
        smallint fetch_hour
        int sort_order
        timestamptz created_at
        timestamptz updated_at
    }
    articles {
        bigint id PK
        bigint zenn_id UK
        varchar title
        varchar emoji
        varchar article_type
        varchar path
        varchar author_username
        varchar author_name
        text author_avatar_url
        timestamptz published_at
        timestamptz created_at
        timestamptz updated_at
    }
    article_tag {
        bigint article_id PK,FK
        bigint tag_id PK,FK
    }
    user_tags {
        bigint user_id PK,FK
        bigint tag_id PK,FK
        int position
        timestamptz created_at
    }
    article_reads {
        bigint user_id PK,FK
        bigint article_id PK,FK
        timestamptz created_at
    }
    bookmarks {
        bigint user_id PK,FK
        bigint article_id PK,FK
        timestamptz created_at
    }
```

## テーブル定義

### users（ユーザー）

| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| id | bigint | PK | |
| username | varchar(20) | NOT NULL, UNIQUE（`lower(username)` に対するユニークインデックス） | ログインIDと表示名を兼ねる。半角英数字と `_`、3〜20文字。入力どおりの大文字・小文字で保存する |
| password | varchar(255) | NOT NULL | ハッシュ化して保存 |
| created_at / updated_at | timestamptz | | 登録日として設定画面に表示 |

- ユーザー名は**大文字・小文字を区別しない**。`Takumi` と `takumi` は同じユーザー名として扱い、重複登録できない。ログインも区別しない（`lower(username)` で検索する）
- Laravel 標準の `users` マイグレーションを書き換える。`name` / `email` / `email_verified_at` / `remember_token` は使わないので削除し、パスワード再設定用の `password_reset_tokens` テーブルも作らない
- Sanctum のトークンは、Laravel 標準の `personal_access_tokens` テーブルに保存する

### tags（タグ） ※ Seeder で管理

| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| id | bigint | PK | |
| slug | varchar(50) | UNIQUE, NOT NULL | Zenn のトピック名（例：`nextjs`）。API の `topicname` に使う |
| name | varchar(50) | NOT NULL | 表示名（例：`Next.js`） |
| category | varchar(50) | NOT NULL | カテゴリ（例：開発言語、インフラ・クラウド） |
| fetch_hour | smallint | NOT NULL, CHECK（3〜8） | 取得する時間（日本時間） |
| sort_order | int | NOT NULL | タグ選択画面での並び順 |
| created_at / updated_at | timestamptz | | |

- Seeder は `slug` をキーにして、あれば更新・なければ追加する（何度実行してもタグIDが変わらない）
- 運用ルール：タグを削除するとお気に入りからも消えるため、そのタグだけをお気に入りにしているユーザーはタグが0個になる。タグを削除する前に、該当するユーザーがいないか確認する

### articles（記事） ※ 全ユーザーで共有

| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| id | bigint | PK | |
| zenn_id | bigint | UNIQUE, NOT NULL | Zenn の記事ID。重複保存の防止に使う |
| title | varchar(255) | NOT NULL | タイトル |
| emoji | varchar(16) | NOT NULL | サムネイル代わりの絵文字 |
| article_type | varchar(10) | NOT NULL | `tech` / `idea`（アプリ側では PHP の Enum で扱う） |
| path | varchar(255) | NOT NULL | 記事のパス（`/{username}/articles/{slug}`）。`https://zenn.dev` と連結してURLにする |
| author_username | varchar(255) | NOT NULL | 著者のユーザー名 |
| author_name | varchar(255) | NOT NULL | 著者の表示名 |
| author_avatar_url | text | NULL可 | 著者のアイコンURL（非常に長い場合があるため text） |
| published_at | timestamptz | NOT NULL, INDEX | 公開日時。並び順と保持件数の判定に使う |
| created_at / updated_at | timestamptz | | |

- 保存済みの記事（`zenn_id` が一致）を再び取得した場合は、タイトル・絵文字・著者名・アイコンを最新の内容で上書きする

### article_tag（記事とタグの紐付け）

| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| article_id | bigint | PK, FK → articles（CASCADE） | |
| tag_id | bigint | PK, FK → tags（CASCADE）, INDEX | |

- 1つの記事が複数のタグに属せる
- タグごとの「最新100件」は、このテーブルの行で表す
- 保存済みの記事が別のタグの取得で見つかった場合は、そのタグとの行を追加する

### user_tags（お気に入りタグ）

| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| user_id | bigint | PK, FK → users（CASCADE） | |
| tag_id | bigint | PK, FK → tags（CASCADE） | |
| position | int | NOT NULL | 並び順（0 始まり）。この昇順でタグバー・サイドバーに並べる |
| created_at | timestamptz | NOT NULL | 選んだ日時（記録用。並び順には使わない） |

- 保存時は、画面から送られたタグIDの配列の順番を、そのまま `position` として保存する
- 画面側では、既に選んでいたタグの順番を保ち、新しく選んだタグをタップした順に末尾へ追加する。一度外して選び直したタグも末尾に移る
- `created_at` で並べると、一度に複数のタグを保存したときに日時が同じになって順番が決まらないため、`position` カラムを使う

### article_reads（既読）

| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| user_id | bigint | PK, FK → users（CASCADE） | |
| article_id | bigint | PK, FK → articles（CASCADE） | |
| created_at | timestamptz | NOT NULL | 読んだ日時 |

- 行があれば既読、なければ未読

### bookmarks（ブックマーク）

| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| user_id | bigint | PK, FK → users（CASCADE） | |
| article_id | bigint | PK, FK → articles（CASCADE） | |
| created_at | timestamptz | NOT NULL, INDEX（user_id と複合） | ブックマークした日時。BOOKMARK タブの並び順に使う |

- 1ユーザー100件の上限は、アプリケーション側でチェックする。連打などで100件を超えないよう、上限チェックと追加はトランザクション内でユーザーの行をロックして行う

## 共通方針

- 日時はすべて `timestamptz`（タイムゾーン付き）で、UTC で保存する。画面では日本時間に変換して表示する（Laravel のマイグレーションでは `timestampsTz()` / `timestampTz()` を使う）

## 各タブの取得条件

ログインユーザーを `U`、表示中のタグを `T` とする。

| タブ | 条件 |
|---|---|
| NEW | `article_tag.tag_id = T` の記事のうち、`article_reads` に `(U, 記事)` がないもの |
| READ | `article_tag.tag_id = T` の記事のうち、`article_reads` に `(U, 記事)` があるもの |
| BOOKMARK | `bookmarks.user_id = U` の記事すべて（`T` に関係なく全件） |

## 記事の削除ルール

各タグの取得処理の後に、以下を実行する。

1. そのタグの `article_tag` を、記事の `published_at` が新しい順（同じ日時なら `articles.id` の大きい順）に並べ、101件目以降の行を削除する
2. `article_tag` の行が1つもなく、かつ誰もブックマークしていない記事を `articles` から削除する
   - 削除された記事の `article_reads` は CASCADE で消える
3. ブックマークされている記事は、`article_tag` の行がなくなっても残る（BOOKMARK タブでのみ見られる）
4. ブックマークを外した記事は、次回以降の削除処理（手順2）で削除対象になる

## 退会時の削除

- `users` の行を削除すると、`user_tags` / `article_reads` / `bookmarks` は外部キーの CASCADE で削除される
- `personal_access_tokens` は `tokenable_type` / `tokenable_id` で持ち主を表す（ポリモーフィック）ため、CASCADE が効かない。退会処理の中で `$user->tokens()->delete()` を明示的に呼んで削除する
- 記事（`articles`）は全ユーザーで共有しているため削除しない
