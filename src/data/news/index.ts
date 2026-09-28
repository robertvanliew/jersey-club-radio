// Jersey Club Radio original articles (src/data/news/articles.json).
// Set "draft": false to publish an article; drafts show only in `npm run dev`.
import all from './articles.json';
import { publishedArticles } from './newsUtils.mjs';

export type Block = { p: string } | { h2: string } | { quote: string; by: string };

export interface NewsArticle {
  slug: string;
  title: string;
  dek: string;
  date: string;
  author: string;
  tag: string;
  draft?: boolean;
  body: Block[];
  sources: { publication: string; title: string; url: string }[];
}

export const articles: NewsArticle[] = publishedArticles(all as NewsArticle[], { includeDrafts: import.meta.env.DEV });
export const getArticle = (slug: string) => articles.find(a => a.slug === slug);
/** Published article that retells a given external source, if any */
export const articleForSource = (url: string) => articles.find(a => a.sources.some(s => s.url === url));
