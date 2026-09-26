# フロントエンドの構成

[← 目次に戻る](README.md)

## フォルダ構成

```
frontend/
├── src/
│   ├── app/                               … 画面とルーティング（App Router）
│   │   ├── layout.tsx                     ルートのレイアウト（Providers、フッター）
│   │   ├── globals.css
│   │   ├── not-found.tsx                  404 ページ
│   │   ├── error.tsx                      エラー（500）ページ
│   │   ├── page.tsx                       トップ          /
│   │   ├── login/page.tsx                 ログイン        /login
│   │   ├── register/page.tsx              新規登録        /register
│   │   ├── home/                          … ログインが必要な画面
│   │   │   ├── layout.tsx                 ヘッダー ＋ 下のタブ（HOME / TAGS）
│   │   │   ├── page.tsx                   入り口          /home（一番左のお気に入りタグへ移動）
│   │   │   ├── [slug]/page.tsx            ホーム          /home/nextjs など（ISR）
│   │   │   └── tags/page.tsx              タグ設定        /home/tags（初回は ?welcome=1）
│   │   └── api/                           … Route Handler
│   │       ├── auth/login/route.ts        ログイン：トークンを Cookie に保存
│   │       ├── auth/register/route.ts     新規登録：トークンを Cookie に保存
│   │       ├── revalidate/route.ts        Laravel からの通知を受けて、タグのページを作り直す
│   │       └── [...path]/route.ts         それ以外：Cookie のトークンを付けて Laravel へ中継
│   ├── proxy.ts                           … 未ログインで /home 以下を開いたら /login へ
│   ├── components/
│   │   ├── ui/                            自作の汎用部品（Button、Input、Toast、Skeleton）
│   │   ├── layout/                        PublicHeader、AppHeader、BottomNav、Footer
│   │   ├── home/                          TagBar、TagSidebar、HomeTabs、ArticleCard、ArticleList
│   │   ├── tags/                          TagSelector（カテゴリ別のタグ選択）
│   │   └── auth/                          LoginForm、RegisterForm
│   ├── hooks/                             TanStack Query のフック（useMyHome、useMarkAsRead、useToggleBookmark など）
│   ├── lib/
│   │   ├── api-client.ts                  ブラウザ → Next.js の /api を呼ぶ関数（エラーの形をそろえる）
│   │   ├── laravel.ts                     サーバー側 → Laravel を呼ぶ関数（server-only）
│   │   ├── auth-cookie.ts                 Cookie の名前と設定（HttpOnly、1年）
│   │   ├── schemas.ts                     Zod のスキーマ（ログイン、新規登録）
│   │   └── format.ts                      日時の表示（9/23 14:05）
│   ├── types/api.ts                       User、Tag、Article の型（API 設計書と一致させる）
│   └── test/                              Vitest のテスト。src/ と同じフォルダ構成で置く（例：src/lib/laravel.ts → src/test/lib/laravel.test.ts）。setup.ts もここ
└── e2e/                                   Playwright の E2E テスト
```

- `/home/[slug]` と `/home/tags` は形が重なるが、Next.js では固定の URL（`tags`）が優先される。そのため **`tags` という slug のタグは追加できない**

## 方針

| 項目 | 方針 |
|---|---|
| フォルダの分け方 | 種類ごと（`components/`・`hooks/`・`lib/`）。`components/` の中は画面ごとに分ける |
| 呼び方の統一 | 「フィード」ではなく「home」に統一する（`/home`、`components/home/`、`HomeTabs`） |
| ログインが必要な画面 | `home/` の下にまとめる。ルートグループは使わない。`home/layout.tsx` 1つで、共通レイアウト（ヘッダーと下のタブ）を作る |
| ログインの確認 | `proxy.ts`（Next.js 16 で `middleware.ts` から名前が変わったもの）で、`/home` から始まる URL は Cookie がなければ `/login` へ移動させる |
| ヘッダー | 未ログイン用の `PublicHeader`（ログイン・新規登録ボタン）と、ログイン後用の `AppHeader`（ユーザー名。PC では HOME / TAGS のリンク） |
| 下のタブ | `BottomNav`。スマホ（1024px 未満）だけに表示する |
| Laravel との通信 | ブラウザは Next.js の `/api/*` だけを呼ぶ。Route Handler が Cookie からトークンを取り出して Laravel に中継するので、ブラウザの JavaScript からトークンは見えない |
| ログアウト・退会 | 画面からは使わないので、中継用の Route Handler も作らない |

## レンダリング方式

| 画面 | 方式 | 理由 |
|---|---|---|
| `/`・`/login`・`/register` | SSG（ビルド時に作る） | 誰が見ても同じ内容 |
| `/home` | SSG の枠 ＋ ブラウザで処理 | ブラウザで `GET /api/me/home` を取得し、一番左のお気に入りタグ（`/home/nextjs` など）へ移動する。0個なら `/home/tags?welcome=1` へ |
| `/home/[slug]` | **ISR** | 記事一覧は全員共通なので、タグごとにキャッシュする。既読・ブックマークはブラウザで取得して組み合わせる |
| `/home/tags` | ISR（全タグの一覧） ＋ ブラウザで処理 | 全タグの一覧は全員共通なのでキャッシュする。お気に入りはブラウザで取得する |
| `not-found` | SSG | 固定の内容 |

### なぜ `/home/[slug]` を ISR にしたか

- アプリで一番多い操作は**タグの切り替え**。ISR にすると、各タグのページはキャッシュ済みの静的なページになり、タグを切り替えても **Laravel へのアクセスは0回**になる
- `<Link>` の先読み（プリフェッチ）で、タグバーにあるタグのページを事前に読み込めるので、初めて見るタグでも切り替えが一瞬になる
- 記事一覧を DB から読むのは、キャッシュを作り直すときだけ。利用者が何人いても、1タグにつき1日数回で済む

### ISR のページと Cookie

ISR のページは、全員に同じ HTML を配るために1回だけ作ってキャッシュする。ページの中で Cookie を読むと、ユーザーごとの内容が HTML に入ってしまうため、Next.js は自動でそのページを SSR（リクエストごとに作る方式）に切り替える。

| 場所 | Cookie | 理由 |
|---|---|---|
| `proxy.ts` | 使う | ページを返す前に、リクエストごとに動くため。ISR のキャッシュとは関係ない |
| ISR のページ・`home/layout.tsx` | **使わない** | 全員共通の HTML を作るため。レイアウトで Cookie を読むと、その下のページも全部 SSR になる |
| Route Handler（`/api/*`） | 使う | リクエストごとに動くため |
| ブラウザの JavaScript | 直接は読めない（HttpOnly） | `/api/*` にリクエストすると、ブラウザが自動で Cookie を付けて送る |

そのため、ヘッダーのユーザー名、既読、ブックマークは、すべてブラウザ側（TanStack Query）で `GET /api/me/home` から取得する。

### ホームの表示の流れ

```
/home を開く
  └ ブラウザで GET /api/me/home を取得（TanStack Query のキャッシュに入る）
     └ /home/nextjs へ移動
        ├ 記事100件 … ISR のキャッシュ済み HTML に入っている
        └ 既読・ブックマーク … すでにキャッシュにあるので、すぐに NEW / READ に振り分けて表示
```

- `/home/nextjs` を直接開いたときや再読み込みしたときは、`GET /api/me/home` が届くまで、記事一覧・タブの件数・🔖 をスケルトンにする（既読の記事が NEW に混ざって表示されるのを防ぐため）
- 既読・ブックマークの操作をしたときは、`GET /api/me/home` のキャッシュを直接書き換える（楽観的更新）。取り直さない

### キャッシュの作り直し

| 対象 | 作り直すタイミング |
|---|---|
| `/home/[slug]`（記事一覧） | ① 記事の取得コマンドが、タグを1つ取り終えるたびに `POST /api/revalidate` で通知する ② 保険として8時間ごと（通知が失敗しても、最大8時間で反映される） |
| `/home/tags` の全タグ一覧 | 1日ごと（タグはデプロイのときしか変わらない。デプロイでキャッシュもリセットされる） |

- `POST /api/revalidate` は、Laravel と共有する秘密の値（環境変数）をヘッダーで確認してから、そのタグのキャッシュを作り直す
- ISR のページは、ビルドのときには作らず、最初にアクセスされたときに作る（Docker や Railway でのビルド中は Laravel が動いていないため）

### ブラウザ側のキャッシュ（TanStack Query）

- 記事は1日1回しか変わらないので、キャッシュの有効時間を長めにし、画面にフォーカスが戻っても取り直さない

## Server Component と Client Component の分け方

**基本ルール**：ページとレイアウトは Server Component（SC）にする。`'use client'` は、状態・クリック・ブラウザの API が必要な末端の部品にだけ付ける。

| ファイル | 種類 | 理由 |
|---|---|---|
| `app/layout.tsx` | SC | 中で `Providers`（CC）を包むだけ |
| `app/page.tsx`（トップ）・`login`・`register` の各ページ | SC | フォームの部分だけ CC に任せる |
| `home/layout.tsx` | SC | Cookie を読まない。ヘッダーと下のタブを並べるだけ |
| `home/page.tsx`（入り口） | SC | 中で移動処理用の小さな CC を表示する |
| `home/[slug]/page.tsx` | SC（ISR） | サーバーで記事一覧（`GET /api/tags/{slug}/articles`）を取得し、TanStack Query のキャッシュとして CC に渡す（HydrationBoundary） |
| `home/tags/page.tsx` | SC（ISR） | サーバーで全タグの一覧を取得して CC に渡す |
| `not-found.tsx` | SC | 固定の内容 |
| `error.tsx` | **CC** | Next.js の決まりで、エラー画面は CC にする |
| `components/layout/PublicHeader`・`Footer` | SC | リンクと文字だけ |
| `components/layout/AppHeader` | CC | ユーザー名をブラウザで取得して表示するため |
| `components/layout/BottomNav` | CC | 今の URL（`usePathname`）で、強調するタブを変えるため |
| `components/home/*` | CC | タブ・タグの切り替え、既読・ブックマークの操作があるため |
| `components/tags/TagSelector` | CC | 選択状態を管理するため |
| `components/auth/*Form` | CC | React Hook Form を使うため |
| `components/ui/Toast` | CC | 表示・非表示の状態を持つため |
| `components/ui/Button`・`Input`・`Skeleton` | どちらでも | `'use client'` を付けない。読み込む側に合わせて動く |
| `hooks/*` | CC 専用 | TanStack Query はブラウザ側で動くため |
| `lib/laravel.ts` | サーバー専用 | `import 'server-only'` を付けて、ブラウザ側のコードに入り込むのを防ぐ |
| `lib/api-client.ts` | ブラウザ用 | CC から Next.js の `/api/*` を呼ぶ |

- SC からデータを取るときは、Next.js の `/api/*` を経由せず、`lib/laravel.ts` から Laravel を直接呼ぶ（自分自身の API をサーバーの中で呼び直さない）

## Laravel へのアクセス回数

1回の利用で、お気に入り5タグを全部見て、記事を3本読む場合：

| | ページを開く | タグの切り替え（初めての4タグ） | 既読（3本） | 合計 |
|---|---|---|---|---|
| SSR だけで作った場合 | 4回 | 4回 | 3回 | 11回 |
| **この構成（ISR ＋ TanStack Query）** | 1回 | **0回** | 3回 | **4回** |

## 将来の改善（今回は作らない）

| 改善 | 内容 |
|---|---|
| 既読のデータをブラウザに保存する | TanStack Query の `persistQueryClient` で localStorage に保存し、再読み込みしてもスケルトンを出さずに表示する |
