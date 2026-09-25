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
│   │   │   ├── page.tsx                   ホーム          /home
│   │   │   └── tags/page.tsx              タグ設定        /home/tags（初回は ?welcome=1）
│   │   └── api/                           … Route Handler（Laravel への中継）
│   │       ├── auth/login/route.ts        ログイン：トークンを Cookie に保存
│   │       ├── auth/register/route.ts     新規登録：トークンを Cookie に保存
│   │       └── [...path]/route.ts         それ以外：Cookie のトークンを付けてそのまま中継
│   ├── proxy.ts                           … 未ログインで /home 以下を開いたら /login へ
│   ├── components/
│   │   ├── ui/                            自作の汎用部品（Button、Input、Toast、Skeleton）
│   │   ├── layout/                        PublicHeader、AppHeader、BottomNav、Footer
│   │   ├── home/                          TagBar、TagSidebar、HomeTabs、ArticleCard、ArticleList
│   │   ├── tags/                          TagSelector（カテゴリ別のタグ選択）
│   │   └── auth/                          LoginForm、RegisterForm
│   ├── hooks/                             TanStack Query のフック（useMe、useFavoriteTags、useTagArticles、useBookmarks など）
│   ├── lib/
│   │   ├── api-client.ts                  ブラウザ → Next.js の /api を呼ぶ関数（エラーの形をそろえる）
│   │   ├── laravel.ts                     サーバー側 → Laravel を呼ぶ関数（トークンを付ける）
│   │   ├── auth-cookie.ts                 Cookie の名前と設定（HttpOnly、1年）
│   │   ├── schemas.ts                     Zod のスキーマ（ログイン、新規登録）
│   │   └── format.ts                      日時の表示（9/23 14:05）
│   ├── types/api.ts                       User、Tag、Article の型（API 設計書と一致させる）
│   └── test/                              Vitest の設定、MSW の偽 API
└── e2e/                                   Playwright の E2E テスト
```

## 方針

| 項目 | 方針 |
|---|---|
| フォルダの分け方 | 種類ごと（`components/`・`hooks/`・`lib/`）。`components/` の中は画面ごとに分ける |
| 呼び方の統一 | 「フィード」ではなく「home」に統一する（`/home`、`components/home/`、`HomeTabs`） |
| ログインが必要な画面 | `home/` の下にまとめる。ルートグループは使わない。`home/layout.tsx` 1つで、ホームとタグ設定の共通レイアウト（ヘッダーと下のタブ）を作る |
| ログインの確認 | `proxy.ts`（Next.js 16 で `middleware.ts` から名前が変わったもの）で、`/home` から始まる URL は Cookie がなければ `/login` へ移動させる |
| ヘッダー | 未ログイン用の `PublicHeader`（ログイン・新規登録ボタン）と、ログイン後用の `AppHeader`（ユーザー名。PC では HOME / TAGS のリンク） |
| 下のタブ | `BottomNav`。スマホ（1024px 未満）だけに表示する |
| Laravel との通信 | ブラウザは Next.js の `/api/*` だけを呼ぶ。Route Handler が Cookie からトークンを取り出して Laravel に中継するので、ブラウザの JavaScript からトークンは見えない |
| ログアウト・退会 | 画面からは使わないので、中継用の Route Handler も作らない |
