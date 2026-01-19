export type RobotsTxtMeta = {
  usrag: string;
  alw: string;
  stmp: string;
  disallowedPaths:string
};

// lib/types/sitemap.ts
export type SitemapEntry = {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
};