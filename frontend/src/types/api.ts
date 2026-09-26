// Response shapes of the Laravel API (see doc/09-api.md).

export type User = {
  username: string;
  created_at: string | null;
};

export type Tag = {
  id: number;
  slug: string;
  name: string;
};

export type TagCategory = {
  name: string;
  tags: Tag[];
};

export type ArticleType = "tech" | "idea";

/** Shared by every user; read / bookmark state comes from MyHome. */
export type Article = {
  id: number;
  title: string;
  emoji: string;
  article_type: ArticleType;
  url: string;
  author: {
    username: string;
    name: string;
    avatar_url: string | null;
  };
  published_at: string;
};

/** GET /api/tags/{slug}/articles */
export type TagArticles = {
  tag: Tag;
  articles: Article[];
};

/** GET /api/me/home */
export type MyHome = {
  user: User;
  favorite_tags: Tag[];
  read_article_ids: number[];
  bookmarks: Article[];
};

/** Error body (401 / 404 / 422 / 429 / 500). errors is set on 422 validation errors. */
export type ApiError = {
  message: string;
  errors?: Record<string, string[]>;
};
