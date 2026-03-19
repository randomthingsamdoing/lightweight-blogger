export function generateSitemap(posts = [], config = {}) {
  const { siteUrl, blogPath = '/blog', blogTitle = 'Blog', lastMod } = config;
  
  const urls = [];
  
  urls.push({
    loc: `${siteUrl}${blogPath}`,
    lastmod: lastMod || new Date().toISOString().split('T')[0],
    changefreq: 'daily',
    priority: '1.0'
  });
  
  posts.forEach(post => {
    const postDate = post.updatedAt ? post.updatedAt.split('T')[0] : (post.createdAt ? post.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]);
    urls.push({
      loc: `${siteUrl}${blogPath}/${post.slug}`,
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

export function generateRssFeed(posts = [], config = {}) {
  const { siteUrl, blogPath = '/blog', blogTitle = 'Blog', blogDescription = '', language = 'en-us' } = config;
  
  const items = posts.map(post => {
    const pubDate = new Date(post.createdAt).toUTCString();
    const postUrl = `${siteUrl}${blogPath}/${post.slug}`;
    const content = post.content ? stripHtml(post.content).substring(0, 300) + '...' : (post.excerpt || '');
    
    return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(postUrl)}</link>
      <guid isPermaLink="true">${escapeXml(postUrl)}</guid>
      <description>${escapeXml(post.excerpt || '')}</description>
      <content:encoded><![CDATA[${post.content || ''}]]></content:encoded>
      <pubDate>${pubDate}</pubDate>
      ${post.category ? `<category>${escapeXml(post.category)}</category>` : ''}
    </item>`;
  }).join('\n');
  
  const lastBuildDate = posts.length > 0 ? new Date(posts[0].createdAt).toUTCString() : new Date().toUTCString();
  
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
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
  
  return rss;
}

export function generateRobotsTxt(config = {}) {
  const { siteUrl, blogPath = '/blog', allowSearchEngines = true } = config;
  
  if (!allowSearchEngines) {
    return `User-agent: *
Disallow: /`;
  }
  
  return `User-agent: *
Allow: /

Sitemap: ${siteUrl}/blog/sitemap.xml

Crawl-delay: 1`;
}

export function injectSitemapLink(config = {}) {
  const { siteUrl, blogPath = '/blog' } = config;
  const sitemapUrl = `${siteUrl}${blogPath}/sitemap.xml`;
  
  let link = document.querySelector('link[rel="sitemap"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'sitemap';
    link.type = 'application/xml';
    document.head.appendChild(link);
  }
  link.href = sitemapUrl;
}

export function injectCanonicalLink(url) {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = url;
}

export function injectAlternateLinks(config = {}) {
  const { siteUrl, blogPath = '/blog' } = config;
  
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'ja', name: 'Japanese' },
    { code: 'zh', name: 'Chinese' }
  ];
  
  languages.forEach(lang => {
    let link = document.querySelector(`link[rel="alternate"][hreflang="${lang.code}"]`);
    if (!link) {
      link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = lang.code;
      document.head.appendChild(link);
    }
    link.href = `${siteUrl}${blogPath}`;
  });
  
  let xDefault = document.querySelector('link[hreflang="x-default"]');
  if (!xDefault) {
    xDefault = document.createElement('link');
    xDefault.rel = 'alternate';
    xDefault.hreflang = 'x-default';
    document.head.appendChild(xDefault);
  }
  xDefault.href = `${siteUrl}${blogPath}`;
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

function stripHtml(html) {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}
