const BLOG_STYLES = `
.lb-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  line-height: 1.7;
  color: #333;
}

.lb-header {
  margin-bottom: 3rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #eaeaea;
}

.lb-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
  color: #111;
  letter-spacing: -0.02em;
}

.lb-header p {
  color: #666;
  font-size: 1.1rem;
  margin: 0;
}

.lb-post-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.lb-post-item {
  margin-bottom: 2.5rem;
}

.lb-post-item a {
  text-decoration: none;
  color: inherit;
  display: block;
}

.lb-post-item a:hover h2 {
  color: #0066cc;
}

.lb-post-item h2 {
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0 0 0.75rem;
  color: #111;
  transition: color 0.2s ease;
  letter-spacing: -0.01em;
}

.lb-post-meta {
  font-size: 0.875rem;
  color: #888;
  margin-bottom: 0.75rem;
}

.lb-post-excerpt {
  color: #555;
  font-size: 1.05rem;
  margin: 0;
}

.lb-post-content {
  font-size: 1.1rem;
}

.lb-post-content h1,
.lb-post-content h2,
.lb-post-content h3 {
  margin-top: 2rem;
  margin-bottom: 1rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.lb-post-content h1 { font-size: 2rem; }
.lb-post-content h2 { font-size: 1.5rem; }
.lb-post-content h3 { font-size: 1.25rem; }

.lb-post-content p {
  margin-bottom: 1.25rem;
}

.lb-post-content code {
  background: #f5f5f5;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-size: 0.9em;
  font-family: 'SF Mono', Monaco, Consolas, monospace;
}

.lb-post-content pre {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 6px;
  overflow-x: auto;
  margin: 1.5rem 0;
}

.lb-post-content pre code {
  background: none;
  padding: 0;
}

.lb-post-content blockquote {
  border-left: 3px solid #e0e0e0;
  margin: 1.5rem 0;
  padding-left: 1rem;
  color: #666;
  font-style: italic;
}

.lb-post-content img {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  margin: 1.5rem 0;
}

.lb-post-content ul,
.lb-post-content ol {
  margin: 1rem 0;
  padding-left: 1.5rem;
}

.lb-post-content li {
  margin-bottom: 0.5rem;
}

.lb-post-content p,
.lb-post-content span,
.lb-post-content div {
  font-family: inherit;
}

.lb-post-content .ql-font-serif {
  font-family: Georgia, 'Times New Roman', serif !important;
}

.lb-post-content .ql-font-monospace {
  font-family: 'Courier New', Courier, monospace !important;
}

.lb-back-link {
  display: inline-block;
  margin-bottom: 1.5rem;
  color: #666;
  text-decoration: none;
  font-size: 0.95rem;
}

.lb-back-link:hover {
  color: #0066cc;
}

.lb-loading { display: flex; align-items: center; justify-content: center; padding: 3rem; color: #888; }
.lb-spinner { width: 40px; height: 40px; border: 3px solid #e0e0e0; border-top-color: #0066cc; border-radius: 50%; animation: lb-spin 1s linear infinite; }
@keyframes lb-spin { to { transform: rotate(360deg); } }
.lb-pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #eaeaea; }
.lb-pagination-btn { padding: 0.5rem 1rem; background: #f5f5f5; color: #333; text-decoration: none; border-radius: 6px; font-size: 0.9rem; transition: all 0.2s; }
.lb-pagination-btn:hover:not(.disabled) { background: #0066cc; color: white; }
.lb-pagination-btn.disabled { opacity: 0.5; cursor: not-allowed; }
.lb-pagination-info { color: #666; font-size: 0.9rem; }

.lb-empty {
  text-align: center;
  padding: 3rem;
  color: #888;
}

.lb-loading {
  text-align: center;
  padding: 2rem;
  color: #888;
}

@media (max-width: 600px) {
  .lb-container {
    padding: 1rem;
  }
  
  .lb-header h1 {
    font-size: 1.75rem;
  }
  
  .lb-post-item h2 {
    font-size: 1.35rem;
  }
}
`;

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatDateISO(dateStr) {
  const date = new Date(dateStr);
  return date.toISOString();
}

function injectSeoMeta(config = {}) {
  const { title, description, url, type = 'website', image, publishedTime, modifiedTime, author, section, tags } = config;
  const siteUrl = window.location.origin;
  const defaultTitle = config.blogTitle || 'Blog';
  const defaultDescription = config.blogDescription || '';
  const metaTitle = title ? `${title} | ${defaultTitle}` : defaultTitle;
  const metaDesc = description || defaultDescription;
  const metaUrl = url || window.location.href;
  const metaImage = image || `${siteUrl}/og-default.png`;

  const existingOrCreate = (name, content, property = false) => {
    const attr = property ? 'property' : 'name';
    let meta = document.querySelector(`meta[${attr}="${name}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(attr, name);
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
  };

  document.title = metaTitle;
  existingOrCreate('description', metaDesc);
  existingOrCreate('canonical', metaUrl);
  existingOrCreate('og:title', metaTitle, true);
  existingOrCreate('og:description', metaDesc, true);
  existingOrCreate('og:url', metaUrl, true);
  existingOrCreate('og:type', type, true);
  existingOrCreate('og:site_name', config.blogTitle || 'Blog', true);
  existingOrCreate('og:image', metaImage, true);
  existingOrCreate('og:image:width', '1200', true);
  existingOrCreate('og:image:height', '630', true);
  existingOrCreate('twitter:card', 'summary_large_image');
  existingOrCreate('twitter:title', metaTitle);
  existingOrCreate('twitter:description', metaDesc);
  existingOrCreate('twitter:image', metaImage);
  existingOrCreate('twitter:site', config.twitterHandle || '@yourwebsite');

  if (publishedTime) existingOrCreate('article:published_time', formatDateISO(publishedTime), true);
  if (modifiedTime) existingOrCreate('article:modified_time', formatDateISO(modifiedTime), true);
  if (author) existingOrCreate('article:author', author, true);
  if (section) existingOrCreate('article:section', section, true);
  if (tags && tags.length) existingOrCreate('keywords', tags.join(', '));

  let schema = document.querySelector('#lb-json-ld');
  if (schema) schema.remove();

  if (type === 'article' && config.blogTitle) {
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": title,
      "description": metaDesc,
      "url": metaUrl,
      "datePublished": publishedTime ? formatDateISO(publishedTime) : undefined,
      "dateModified": modifiedTime ? formatDateISO(modifiedTime) : undefined,
      "author": {
        "@type": "Person",
        "name": author || "Anonymous"
      },
      "publisher": {
        "@type": "Organization",
        "name": config.blogTitle,
        "logo": {
          "@type": "ImageObject",
          "url": metaImage
        }
      },
      "image": image ? [metaImage] : undefined,
      "articleBody": description
    };

    schema = document.createElement('script');
    schema.id = 'lb-json-ld';
    schema.type = 'application/ld+json';
    schema.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(schema);
  }
}

function renderPagination(config = {}) {
  const { page = 1, postsPerPage = 10, totalPosts = 0, blogPath = '/blog' } = config;
  const totalPages = Math.ceil(totalPosts / postsPerPage);
  
  if (totalPages <= 1) return '';
  
  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;
  
  return `
    <div class="lb-pagination">
      <a href="${prevPage ? `${blogPath}/page/${prevPage}` : '#'}" class="lb-pagination-btn ${!prevPage ? 'disabled' : ''}">← Previous</a>
      <span class="lb-pagination-info">Page ${page} of ${totalPages}</span>
      <a href="${nextPage ? `${blogPath}/page/${nextPage}` : '#'}" class="lb-pagination-btn ${!nextPage ? 'disabled' : ''}">Next →</a>
    </div>
  `;
}

function renderPostList(posts, config = {}) {
  if (!posts.length) {
    return `
      <div class="lb-empty">
        <p>No posts yet.</p>
      </div>
    `;
  }
  
  return `
    <ul class="lb-post-list" role="list">
      ${posts.map(post => `
        <li class="lb-post-item">
          <article itemscope itemtype="https://schema.org/BlogPosting">
            <a href="${config.blogPath || '/blog'}/${post.slug}" itemprop="url">
              <h2 itemprop="headline">${escapeHtml(post.title)}</h2>
              <div class="lb-post-meta">
                <time itemprop="datePublished" datetime="${formatDateISO(post.createdAt)}">${formatDate(post.createdAt)}</time>
                ${post.category ? ` · <span itemprop="articleSection">${escapeHtml(post.category)}</span>` : ''}
              </div>
              ${post.excerpt ? `<p class="lb-post-excerpt" itemprop="description">${escapeHtml(post.excerpt)}</p>` : ''}
            </a>
          </article>
        </li>
      `).join('')}
    </ul>
    ${renderPagination(config)}
  `;
}

function renderPost(post, config = {}) {
  const content = post.content || '';
  const siteUrl = window.location.origin;
  const postUrl = `${siteUrl}${config.blogPath || '/blog'}/${post.slug}`;
  
  return `
    <a href="${config.blogPath || '/blog'}" class="lb-back-link">← Back to blog</a>
    <article class="lb-post" itemscope itemtype="https://schema.org/BlogPosting">
      <header class="lb-header">
        <h1 itemprop="headline">${escapeHtml(post.title)}</h1>
        <div class="lb-post-meta">
          <time itemprop="datePublished" datetime="${formatDateISO(post.createdAt)}">${formatDate(post.createdAt)}</time>
          ${post.category ? ` · <span itemprop="articleSection">${escapeHtml(post.category)}</span>` : ''}
        </div>
      </header>
      <div class="lb-post-content" itemprop="articleBody">
        ${content}
      </div>
      <meta itemprop="url" content="${postUrl}">
      <meta itemprop="description" content="${escapeHtml(post.excerpt || '')}">
    </article>
  `;
}

function renderBlogIndex(posts, config = {}) {
  return `
    <div class="lb-container">
      <header class="lb-header">
        <h1>${escapeHtml(config.blogTitle || 'Blog')}</h1>
        ${config.blogDescription ? `<p>${escapeHtml(config.blogDescription)}</p>` : ''}
      </header>
      ${renderPostList(posts, config)}
    </div>
  `;
}

function injectStyles() {
  if (document.getElementById('lb-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'lb-styles';
  style.textContent = BLOG_STYLES;
  document.head.appendChild(style);
}

export function renderBlogListing(posts, config = {}) {
  injectStyles();
  injectSeoMeta({
    title: config.blogTitle,
    description: config.blogDescription,
    type: 'website',
    blogTitle: config.blogTitle
  });
  const container = document.getElementById('app') || document.body;
  container.innerHTML = renderBlogIndex(posts, config);
}

export function renderBlogPost(post, config = {}) {
  injectStyles();
  const siteUrl = window.location.origin;
  const postUrl = `${siteUrl}${config.blogPath || '/blog'}/${post.slug}`;
  injectSeoMeta({
    title: post.title,
    description: post.excerpt,
    url: postUrl,
    type: 'article',
    publishedTime: post.createdAt,
    modifiedTime: post.updatedAt,
    author: config.author,
    section: post.category,
    tags: post.tags,
    image: post.image,
    blogTitle: config.blogTitle
  });
  const container = document.getElementById('app') || document.body;
  container.innerHTML = renderPost(post, config);
}

export function renderLoading() {
  injectStyles();
  const container = document.getElementById('app') || document.body;
  container.innerHTML = `
    <div class="lb-container">
      <div class="lb-loading">
        <div class="lb-spinner"></div>
      </div>
    </div>
  `;
}

export function renderError(message) {
  injectStyles();
  const container = document.getElementById('app') || document.body;
  container.innerHTML = `
    <div class="lb-container">
      <div class="lb-empty">
        <p>${escapeHtml(message)}</p>
      </div>
    </div>
  `;
}

export { BLOG_STYLES };
