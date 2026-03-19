export interface BlogOptions {
  blogPath?: string;
  adminPath?: string;
  containerId?: string;
  replaceContent?: boolean;
  postsPerPage?: number;
  cacheTtl?: number;
  dbUrl?: string;
  dbToken?: string;
  apiUrl?: string;
}

export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  published: boolean;
  publishedInt?: number;
  createdAt: string;
  updatedAt: string;
  created_at?: string;
  updated_at?: string;
  blog_id?: number;
  domain?: string;
}

export interface BlogConfig {
  blogTitle?: string;
  blogDescription?: string;
  blogPath?: string;
}

export interface RenderOptions {
  blogPath?: string;
  page?: number;
  postsPerPage?: number;
  totalPosts?: number;
  blogTitle?: string;
  blogDescription?: string;
}

export interface InitBlogOptions extends BlogOptions {
  blogPath?: string;
  apiUrl?: string;
  dbUrl?: string;
  dbToken?: string;
  cacheTtl?: number;
  postsPerPage?: number;
}

export interface InitAdminOptions extends BlogOptions {
  adminPath?: string;
  apiUrl?: string;
  dbUrl?: string;
  dbToken?: string;
}

export function autoInit(options?: BlogOptions): Promise<void> | null;

export function initBlog(options?: InitBlogOptions): Promise<void>;

export function initAdminPanel(options?: InitAdminOptions): Promise<void>;

export function renderLogin(): string;

export function renderDashboard(posts: BlogPost[], blogSlug: string, drafts?: any[], blogId?: number | null): string;

export function renderEditor(post?: BlogPost | null, isNew?: boolean): string;

export function renderBlogListing(posts: BlogPost[], config?: RenderOptions): void;

export function renderBlogPost(post: BlogPost, config?: RenderOptions): void;

export function renderLoading(): void;

export function renderError(message: string): void;

export interface SitemapConfig {
  siteUrl: string;
  blogPath?: string;
  blogTitle?: string;
  lastMod?: string;
}

export interface RssConfig {
  siteUrl: string;
  blogPath?: string;
  blogTitle?: string;
  blogDescription?: string;
  language?: string;
}

export interface RobotsConfig {
  siteUrl: string;
  blogPath?: string;
  allowSearchEngines?: boolean;
}

export function generateSitemap(posts: BlogPost[], config: SitemapConfig): string;

export function generateRssFeed(posts: BlogPost[], config: RssConfig): string;

export function generateRobotsTxt(config: RobotsConfig): string;

export function injectSitemapLink(config: { siteUrl: string; blogPath?: string }): void;

export function injectAlternateLinks(config: { siteUrl: string; blogPath?: string }): void;

export function injectCanonicalLink(url: string): void;
