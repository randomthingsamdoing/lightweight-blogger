#!/usr/bin/env node

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_DB_URL = 'libsql://lightweight-blogger-beta-itobboninja.aws-us-east-2.turso.io';
const DEFAULT_DB_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzM4NTA3MjAsImlkIjoiMDE5Y2ZkYWItMDgwMS03NjdmLWEwMDktZjVjMTM4MDZiNGIxIiwicmlkIjoiZDU5YmUyMDQtNDVhZi00YzBkLTliNTItM2RhMzcwYTZmMTEyIn0.LzJIySkAa-lxnOahmLPVSZ0lHgRf4F6TsKMqoedRjJz-Mo92s-0ro7N6nAxcpG4f-VTyiD6P1WPnTOVpEJo_Bg';

function convertHttpUrl(libsqlUrl) {
  if (libsqlUrl.startsWith('libsql://')) {
    return libsqlUrl.replace('libsql://', 'https://');
  }
  return libsqlUrl;
}

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function safeFormatDate(dateValue) {
  if (!dateValue) return new Date().toISOString().split('T')[0];
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return new Date().toISOString().split('T')[0];
    return date.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

function safeFormatRssDate(dateValue) {
  if (!dateValue) return new Date().toUTCString();
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return new Date().toUTCString();
    return date.toUTCString();
  } catch {
    return new Date().toUTCString();
  }
}

function safeSlug(slug) {
  if (!slug || slug === 'undefined' || slug === 'null') return '';
  return String(slug);
}

function extractColumnNames(sql) {
  const match = sql.match(/^SELECT\s+(.+?)\s+FROM/i);
  if (!match) return null;
  if (match[1].trim() === '*') return null;
  return match[1].split(',').map(c => c.trim().split(/\s+AS\s+/i).pop().split(/\s+/).pop());
}

function parseRow(row, columns) {
  if (!columns) return row;
  const obj = {};
  columns.forEach((col, i) => {
    const cell = row[i];
    if (cell && cell.value !== undefined) {
      obj[col] = cell.value;
    } else {
      obj[col] = cell;
    }
  });
  return obj;
}

async function executeQuery(dbUrl, dbToken, sql, args = []) {
  const formattedArgs = args.map(arg => {
    if (arg === null || arg === undefined) return { type: 'null', value: null };
    if (typeof arg === 'number') return Number.isInteger(arg) ? { type: 'integer', value: String(arg) } : { type: 'float', value: String(arg) };
    if (typeof arg === 'boolean') return { type: 'integer', value: arg ? '1' : '0' };
    return { type: 'text', value: String(arg) };
  });

  const columns = extractColumnNames(sql);

  const response = await fetch(`${dbUrl}/v2/pipeline`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${dbToken}`
    },
    body: JSON.stringify({
      requests: [{ type: 'execute', stmt: { sql, args: formattedArgs } }, { type: 'close' }]
    })
  });

  if (!response.ok) throw new Error(`DB error: ${response.status}`);
  const result = await response.json();
  const rows = result.results?.[0]?.response?.result?.rows || [];
  return rows.map(row => parseRow(row, columns));
}

function generateSitemap(posts, config) {
  const { siteUrl, blogPath = '/blog', lastMod } = config;
  
  const urls = [{
    loc: `${siteUrl}${blogPath}`,
    lastmod: lastMod || new Date().toISOString().split('T')[0],
    changefreq: 'daily',
    priority: '1.0'
  }];
  
  posts.forEach(post => {
    const slug = safeSlug(post.slug);
    if (!slug) return;
    
    const postDate = safeFormatDate(post.updated_at || post.created_at);
    urls.push({
      loc: `${siteUrl}${blogPath}/${slug}`,
      lastmod: postDate,
      changefreq: 'weekly',
      priority: '0.8'
    });
  });
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
  
  return sitemap;
}

function generateRssFeed(posts, config) {
  const { siteUrl, blogPath = '/blog', blogTitle = 'Blog', blogDescription = '', language = 'en-us' } = config;
  
  const validPosts = posts.filter(post => safeSlug(post.slug));
  
  const items = validPosts.map(post => {
    const pubDate = safeFormatRssDate(post.created_at);
    const postUrl = `${siteUrl}${blogPath}/${safeSlug(post.slug)}`;
    
    return `    <item>
      <title>${escapeXml(post.title || 'Untitled')}</title>
      <link>${escapeXml(postUrl)}</link>
      <guid isPermaLink="true">${escapeXml(postUrl)}</guid>
      <description>${escapeXml(post.excerpt || '')}</description>
      <content:encoded><![CDATA[${post.content || ''}]]></content:encoded>
      <pubDate>${pubDate}</pubDate>
      ${post.category ? `<category>${escapeXml(post.category)}</category>` : ''}
    </item>`;
  }).join('\n');
  
  const lastBuildDate = validPosts.length > 0 ? safeFormatRssDate(validPosts[0].created_at) : new Date().toUTCString();
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(blogTitle)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml(blogDescription)}</description>
    <language>${language}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <ttl>60</ttl>
${items}
  </channel>
</rss>`;
}

function generateRobotsTxt(config) {
  const { siteUrl, blogPath = '/blog' } = config;
  return `User-agent: *
Allow: /

Sitemap: ${siteUrl}/blog/sitemap.xml

Crawl-delay: 1`;
}

async function main() {
  const args = process.argv.slice(2);
  let options = {
    dbUrl: DEFAULT_DB_URL,
    dbToken: DEFAULT_DB_TOKEN,
    siteUrl: null,
    blogPath: '/blog',
    domain: null,
    outputDir: './public/blog',
    blogTitle: 'Blog',
    blogDescription: ''
  };
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--db-url' && args[i + 1]) options.dbUrl = args[++i];
    else if (args[i] === '--db-token' && args[i + 1]) options.dbToken = args[++i];
    else if (args[i] === '--site-url' && args[i + 1]) options.siteUrl = args[++i];
    else if (args[i] === '--blog-path' && args[i + 1]) options.blogPath = args[++i];
    else if (args[i] === '--domain' && args[i + 1]) options.domain = args[++i];
    else if (args[i] === '--output-dir' && args[i + 1]) options.outputDir = args[++i];
    else if (args[i] === '--blog-title' && args[i + 1]) options.blogTitle = args[++i];
    else if (args[i] === '--blog-description' && args[i + 1]) options.blogDescription = args[++i];
    else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
Lightweight Blogger CLI - Generate SEO files

Usage:
  npx lightweight-blogger generate [options]

Options:
  --db-url <url>          Turso database URL (optional, uses default)
  --db-token <token>      Turso auth token (optional, uses default)
  --site-url <url>        Your website URL (required)
  --domain <domain>        Domain to fetch posts for (required)
  --blog-path <path>      Blog path (default: /blog)
  --output-dir <dir>      Output directory (default: ./public/blog)
  --blog-title <title>    Blog title for RSS feed
  --blog-description <desc> Blog description for RSS feed
  --help, -h              Show this help

Example:
  npx lightweight-blogger generate \\
    --site-url https://mysite.com \\
    --domain mysite.com \\
    --blog-title "My Blog" \\
    --output-dir ./public/blog
`);
      process.exit(0);
    }
  }
  
  if (!options.siteUrl || !options.domain) {
    console.error('Error: --site-url and --domain are required');
    console.error('Run with --help for usage information');
    process.exit(1);
  }
  
  const dbUrl = convertHttpUrl(options.dbUrl);
  
  console.log(`Fetching posts for domain: ${options.domain}...`);
  
  const posts = await executeQuery(
    dbUrl, 
    options.dbToken, 
    'SELECT slug, title, content, excerpt, category, published, created_at, updated_at FROM posts WHERE domain = ? AND published = 1 ORDER BY created_at DESC',
    [options.domain]
  );
  
  console.log(`Found ${posts.length} published posts`);
  
  const outputDir = path.resolve(options.outputDir);
  fs.mkdirSync(outputDir, { recursive: true });
  
  console.log('Generating sitemap.xml...');
  fs.writeFileSync(path.join(outputDir, 'sitemap.xml'), generateSitemap(posts, options));
  
  console.log('Generating feed.xml...');
  fs.writeFileSync(path.join(outputDir, 'feed.xml'), generateRssFeed(posts, options));
  
  const robotsPath = path.resolve('./public');
  fs.mkdirSync(robotsPath, { recursive: true });
  console.log('Generating robots.txt...');
  fs.writeFileSync(path.join(robotsPath, 'robots.txt'), generateRobotsTxt(options));
  
  console.log(`
Generated files:
  - ${outputDir}/sitemap.xml
  - ${outputDir}/feed.xml
  - ${robotsPath}/robots.txt
`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
