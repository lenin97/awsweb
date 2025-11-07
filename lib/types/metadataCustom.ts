export type Metacustom = {
  id?: string;
  title: string;
  excerpt: string;
  slug: string;
  ogImage?: string;
  ogImageWidth?:string;
  ogImageHeight?: string;
  createdAt?: string; // or Date
  updatedAt?:string
  canonicalRealtiveURL?: string;
  authorName?: string;

  // Optional overrides
  openGraphTitle?: string;
  openGraphDescription?: string;
  openGraphType?: string;
  twitterTitle?: string;
  twitterDescription?: string;
};

export interface ArticleMeta {
  publishedTime: string;      // ISO 8601 format
  modifiedTime?: string;
  expirationTime?: string;
  authors?: string[];         // URLs or names
  section?: string;
  tags?: string[];
}
/*
{
  "publishedTime": "2024-11-15T00:00:00.000Z",
  "modifiedTime": null,
  "expirationTime": null,
  "authors": ["https://example.com/authors/alex","https://example.com/authors/jordan"],
  "section": "News",
  "tags": ["AI", "Radiohead", "Strategies"]
}
*/