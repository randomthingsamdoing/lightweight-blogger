const BLOG_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Serif:ital@0;1&display=swap');

.lb-blog-wrap {
  --lb-blog-accent: #f59e0b;
  --lb-blog-text: #1e293b;
  --lb-blog-text-secondary: #64748b;
  --lb-blog-border: #e2e8f0;
  --lb-blog-bg: #ffffff;
  --lb-blog-bg-secondary: #f8fafc;
  --lb-blog-surface: #ffffff;
  --lb-blog-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06);
  --lb-blog-shadow-md: 0 4px 6px -1px rgba(0,0,0,0.06), 0 2px 4px -2px rgba(0,0,0,0.04);
  min-height: 100vh;
  background: var(--lb-blog-bg);
  font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: var(--lb-blog-text);
}

.lb-blog-wrap h1, .lb-blog-wrap h2, .lb-blog-wrap h3, .lb-blog-wrap h4, .lb-blog-wrap h5, .lb-blog-wrap h6 {
  text-decoration: none;
}

.lb-blog-wrap * {
  text-decoration: none;
}

.lb-blog-wrap a {
  text-decoration: none;
}

.lb-blog-wrap[data-theme="dark"] {
  --lb-blog-accent: #fbbf24;
  --lb-blog-text: #f1f5f9;
  --lb-blog-text-secondary: #94a3b8;
  --lb-blog-border: #334155;
  --lb-blog-bg: #0f172a;
  --lb-blog-bg-secondary: #1e293b;
  --lb-blog-surface: #1e293b;
  --lb-blog-shadow: 0 1px 3px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.15);
  --lb-blog-shadow-md: 0 4px 6px -1px rgba(0,0,0,0.3), 0 2px 4px -2px rgba(0,0,0,0.2);
}

.lb-blog-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.lb-blog-nav {
  padding: 1.5rem 0;
  border-bottom: 1px solid var(--lb-blog-border);
  margin-bottom: 4rem;
}

.lb-blog-nav-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.lb-blog-logo {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--lb-blog-text);
  text-decoration: none;
  letter-spacing: -0.02em;
}

.lb-blog-logo:hover {
  color: var(--lb-blog-accent);
}

.lb-blog-featured {
  margin-bottom: 4rem;
}

.lb-blog-featured-label {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--lb-blog-accent);
  margin-bottom: 1rem;
}

.lb-blog-featured-label::before {
  content: '';
  width: 1.5rem;
  height: 2px;
  background: var(--lb-blog-accent);
}

.lb-blog-featured-card {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 3rem;
  background: var(--lb-blog-surface);
  border-radius: 16px;
  border: 1px solid var(--lb-blog-border);
  overflow: hidden;
  box-shadow: var(--lb-blog-shadow);
  transition: all 0.3s ease;
}

.lb-blog-featured-card:hover {
  box-shadow: var(--lb-blog-shadow-md);
  transform: translateY(-2px);
  border-color: var(--lb-blog-accent);
}

.lb-blog-featured-image {
  aspect-ratio: 16/10;
  background: linear-gradient(135deg, var(--lb-blog-bg-secondary) 0%, var(--lb-blog-border) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.lb-blog-featured-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.lb-blog-featured-image-placeholder {
  font-size: 4rem;
  opacity: 0.15;
}

.lb-blog-featured-content {
  padding: 2.5rem 2.5rem 2.5rem 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.lb-blog-category-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: var(--lb-blog-accent);
  color: #000;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: 9999px;
  margin-bottom: 1rem;
  width: fit-content;
}

.lb-blog-featured-title {
  font-family: 'DM Serif', Georgia, serif;
  font-size: 2rem;
  font-weight: 400;
  line-height: 1.25;
  margin: 0 0 1rem;
  color: var(--lb-blog-text);
  letter-spacing: -0.02em;
}

.lb-blog-featured-excerpt {
  font-size: 1.0625rem;
  line-height: 1.65;
  color: var(--lb-blog-text-secondary);
  margin: 0 0 1.5rem;
}

.lb-blog-post-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.875rem;
  color: var(--lb-blog-text-secondary);
}

.lb-blog-post-meta span {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.lb-blog-post-meta svg {
  width: 14px;
  height: 14px;
  opacity: 0.7;
}

.lb-blog-read-more {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1.5rem;
  color: var(--lb-blog-accent);
  font-weight: 600;
  font-size: 0.9375rem;
  text-decoration: none;
  transition: gap 0.2s;
}

.lb-blog-read-more:hover {
  gap: 0.75rem;
}

.lb-blog-read-more svg {
  width: 16px;
  height: 16px;
  transition: transform 0.2s;
}

.lb-blog-read-more:hover svg {
  transform: translateX(2px);
}

.lb-blog-section-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.lb-blog-section-title {
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--lb-blog-text-secondary);
}

.lb-blog-section-line {
  flex: 1;
  height: 1px;
  background: var(--lb-blog-border);
}

.lb-blog-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-bottom: 4rem;
}

.lb-blog-card {
  background: var(--lb-blog-surface);
  border-radius: 12px;
  border: 1px solid var(--lb-blog-border);
  overflow: hidden;
  transition: all 0.25s ease;
  box-shadow: var(--lb-blog-shadow);
}

.lb-blog-card:hover {
  box-shadow: var(--lb-blog-shadow-md);
  transform: translateY(-3px);
  border-color: var(--lb-blog-accent);
}

.lb-blog-card-image {
  aspect-ratio: 16/9;
  background: linear-gradient(135deg, var(--lb-blog-bg-secondary) 0%, var(--lb-blog-border) 100%);
  overflow: hidden;
}

.lb-blog-card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.lb-blog-card:hover .lb-blog-card-image img {
  transform: scale(1.03);
}

.lb-blog-card-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  opacity: 0.15;
}

.lb-blog-card-content {
  padding: 1.5rem;
}

.lb-blog-card-title {
  font-family: 'DM Serif', Georgia, serif;
  font-size: 1.25rem;
  font-weight: 400;
  line-height: 1.35;
  margin: 0 0 0.75rem;
  color: var(--lb-blog-text);
  letter-spacing: -0.01em;
}

.lb-blog-card:hover .lb-blog-card-title {
  color: var(--lb-blog-accent);
}

.lb-blog-card-excerpt {
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--lb-blog-text-secondary);
  margin: 0 0 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.lb-blog-card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.8125rem;
  color: var(--lb-blog-text-secondary);
}

.lb-blog-footer {
  padding: 3rem 0;
  border-top: 1px solid var(--lb-blog-border);
  margin-top: 2rem;
  text-align: center;
}

.lb-blog-footer p {
  font-size: 0.875rem;
  color: var(--lb-blog-text-secondary);
  margin: 0;
}

.lb-blog-footer a {
  color: var(--lb-blog-accent);
  text-decoration: none;
}

.lb-blog-footer a:hover {
  text-decoration: underline;
}

.lb-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin: 3rem 0;
}

.lb-pagination-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.5rem;
  height: 2.5rem;
  padding: 0 0.75rem;
  background: var(--lb-blog-surface);
  color: var(--lb-blog-text);
  text-decoration: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid var(--lb-blog-border);
  transition: all 0.2s;
}

.lb-pagination-btn:hover:not(.disabled):not(.active) {
  background: var(--lb-blog-accent);
  color: #000;
  border-color: var(--lb-blog-accent);
}

.lb-pagination-btn.active {
  background: var(--lb-blog-accent);
  color: #000;
  border-color: var(--lb-blog-accent);
}

.lb-pagination-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.lb-empty {
  text-align: center;
  padding: 5rem 2rem;
  color: var(--lb-blog-text-secondary);
}

.lb-empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.3;
}

.lb-empty h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
  color: var(--lb-blog-text);
}

.lb-empty p {
  font-size: 1rem;
  margin: 0;
}

.lb-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.lb-spinner {
  width: 32px;
  height: 32px;
  border: 2px solid var(--lb-blog-border);
  border-top-color: var(--lb-blog-accent);
  border-radius: 50%;
  animation: lb-blog-spin 0.8s linear infinite;
}

@keyframes lb-blog-spin { to { transform: rotate(360deg); } }

.lb-post-hero {
  padding: 4rem 0 3rem;
  text-align: center;
  margin-bottom: 2rem;
}

.lb-post-hero .lb-blog-category-badge {
  margin: 0 auto 1.5rem;
}

.lb-post-hero-title {
  font-family: 'DM Serif', Georgia, serif;
  font-size: 3rem;
  font-weight: 400;
  line-height: 1.2;
  margin: 0 0 1.5rem;
  color: var(--lb-blog-text);
  letter-spacing: -0.025em;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.lb-post-hero-meta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  color: var(--lb-blog-text-secondary);
  font-size: 0.9375rem;
}

.lb-post-hero-meta span {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.lb-post-hero-meta svg {
  width: 16px;
  height: 16px;
  opacity: 0.6;
}

.lb-post-hero-line {
  width: 60px;
  height: 3px;
  background: var(--lb-blog-accent);
  margin: 2rem auto 0;
  border-radius: 9999px;
}

.lb-post-cover {
  max-width: 900px;
  margin: 0 auto 3rem;
  border-radius: 16px;
  overflow: hidden;
  aspect-ratio: 21/9;
  background: linear-gradient(135deg, var(--lb-blog-bg-secondary) 0%, var(--lb-blog-border) 100%);
}

.lb-post-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.lb-post-cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 5rem;
  opacity: 0.1;
}

.lb-post-content-wrap {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.lb-post-content {
  font-size: 1.125rem;
  line-height: 1.8;
  color: var(--lb-blog-text);
}

.lb-post-content > * + * {
  margin-top: 1.5em;
}

.lb-post-content h1,
.lb-post-content h2,
.lb-post-content h3,
.lb-post-content h4 {
  font-family: 'DM Serif', Georgia, serif;
  font-weight: 400;
  line-height: 1.3;
  color: var(--lb-blog-text);
  letter-spacing: -0.02em;
}

.lb-post-content h1 { font-size: 2rem; margin-top: 2.5em; }
.lb-post-content h2 { font-size: 1.625rem; margin-top: 2em; }
.lb-post-content h3 { font-size: 1.375rem; margin-top: 1.75em; }
.lb-post-content h4 { font-size: 1.125rem; margin-top: 1.5em; }

.lb-post-content p {
  margin: 0;
}

.lb-post-content a {
  color: var(--lb-blog-accent);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.lb-post-content a:hover {
  text-decoration-thickness: 2px;
}

.lb-post-content strong {
  font-weight: 600;
}

.lb-post-content code {
  background: var(--lb-blog-bg-secondary);
  color: var(--lb-blog-accent);
  padding: 0.15em 0.4em;
  border-radius: 4px;
  font-size: 0.9em;
  font-family: 'SF Mono', 'Fira Code', Monaco, Consolas, monospace;
}

.lb-post-content pre {
  background: var(--lb-blog-bg-secondary);
  padding: 1.5rem;
  border-radius: 10px;
  overflow-x: auto;
  border: 1px solid var(--lb-blog-border);
  font-size: 0.9rem;
  line-height: 1.6;
}

.lb-post-content pre code {
  background: none;
  padding: 0;
  color: var(--lb-blog-text);
  font-size: inherit;
}

.lb-post-content blockquote {
  border-left: 4px solid var(--lb-blog-accent);
  margin: 2em 0;
  padding: 0.5rem 0 0.5rem 1.5rem;
  font-style: italic;
  color: var(--lb-blog-text-secondary);
  font-size: 1.2rem;
}

.lb-post-content blockquote p {
  margin: 0;
}

.lb-post-content img {
  max-width: 100%;
  height: auto;
  border-radius: 10px;
  margin: 2em 0;
}

.lb-post-content ul,
.lb-post-content ol {
  margin: 1em 0;
  padding-left: 1.5em;
}

.lb-post-content li {
  margin: 0.5em 0;
}

.lb-post-content hr {
  border: none;
  height: 1px;
  background: var(--lb-blog-border);
  margin: 2.5em 0;
}

.lb-post-content .ql-font-serif {
  font-family: 'DM Serif', Georgia, 'Times New Roman', serif !important;
}

.lb-post-content .ql-font-monospace {
  font-family: 'SF Mono', 'Fira Code', 'Courier New', Courier, monospace !important;
}

.lb-post-nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  max-width: 720px;
  margin: 4rem auto;
  padding: 0 1.5rem;
}

.lb-post-nav-link {
  display: block;
  padding: 1.25rem 1.5rem;
  background: var(--lb-blog-surface);
  border: 1px solid var(--lb-blog-border);
  border-radius: 10px;
  text-decoration: none;
  transition: all 0.2s;
}

.lb-post-nav-link:hover {
  border-color: var(--lb-blog-accent);
  box-shadow: var(--lb-blog-shadow);
}

.lb-post-nav-link.next {
  text-align: right;
}

.lb-post-nav-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--lb-blog-text-secondary);
  margin-bottom: 0.5rem;
}

.lb-post-nav-title {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--lb-blog-text);
  line-height: 1.4;
}

.lb-post-nav-link:hover .lb-post-nav-title {
  color: var(--lb-blog-accent);
}

.lb-blog-back {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--lb-blog-text-secondary);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0.5rem 0;
  transition: color 0.2s;
}

.lb-blog-back:hover {
  color: var(--lb-blog-accent);
}

.lb-blog-back svg {
  width: 16px;
  height: 16px;
}

@media (max-width: 900px) {
  .lb-blog-featured-card {
    grid-template-columns: 1fr;
    gap: 0;
  }
  
  .lb-blog-featured-image {
    aspect-ratio: 16/7;
  }
  
  .lb-blog-featured-content {
    padding: 2rem;
  }
  
  .lb-blog-featured-title {
    font-size: 1.625rem;
  }
  
  .lb-blog-grid {
    grid-template-columns: 1fr;
  }
  
  .lb-post-hero-title {
    font-size: 2.25rem;
  }
}

@media (max-width: 600px) {
  .lb-blog-nav-inner {
    padding: 0 1rem;
  }
  
  .lb-blog-container {
    padding: 0 1rem;
  }
  
  .lb-blog-featured {
    margin-bottom: 3rem;
  }
  
  .lb-blog-featured-content {
    padding: 1.5rem;
  }
  
  .lb-blog-featured-title {
    font-size: 1.375rem;
  }
  
  .lb-blog-featured-excerpt {
    font-size: 1rem;
  }
  
  .lb-blog-card-content {
    padding: 1.25rem;
  }
  
  .lb-blog-card-title {
    font-size: 1.125rem;
  }
  
  .lb-post-hero {
    padding: 2.5rem 0 2rem;
  }
  
  .lb-post-hero-title {
    font-size: 1.75rem;
  }
  
  .lb-post-hero-meta {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .lb-post-content-wrap {
    padding: 0 1rem;
  }
  
  .lb-post-content {
    font-size: 1.0625rem;
  }
  
  .lb-post-nav {
    grid-template-columns: 1fr;
  }
  
  .lb-post-nav-link.next {
    text-align: left;
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
  
  let pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }
  
  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;
  
  return `
    <div class="lb-pagination">
      <a href="${prevPage ? `${blogPath}/page/${prevPage}` : '#'}" class="lb-pagination-btn ${!prevPage ? 'disabled' : ''}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
      </a>
      ${pages.map(p => p === '...' 
        ? '<span class="lb-pagination-btn disabled">...</span>'
        : `<a href="${blogPath}/page/${p}" class="lb-pagination-btn ${p === page ? 'active' : ''}">${p}</a>`
      ).join('')}
      <a href="${nextPage ? `${blogPath}/page/${nextPage}` : '#'}" class="lb-pagination-btn ${!nextPage ? 'disabled' : ''}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </a>
    </div>
  `;
}

function renderPostList(posts, config = {}) {
  if (!posts.length) {
    return `
      <div class="lb-empty">
        <div class="lb-empty-icon">📝</div>
        <h2>No posts yet</h2>
        <p>Check back soon for new content.</p>
      </div>
    `;
  }
  
  const [featured, ...rest] = posts;
  
  return `
    ${renderFeaturedPost(featured, config)}
    <div class="lb-blog-section-header">
      <span class="lb-blog-section-title">All Posts</span>
      <span class="lb-blog-section-line"></span>
    </div>
    <div class="lb-blog-grid">
      ${rest.map(post => renderBlogCard(post, config)).join('')}
    </div>
    ${renderPagination(config)}
  `;
}

function renderFeaturedPost(post, config = {}) {
  return `
    <div class="lb-blog-featured">
      <div class="lb-blog-featured-label">Featured</div>
      <a href="${config.blogPath || '/blog'}/${post.slug}" class="lb-blog-featured-card">
        <div class="lb-blog-featured-image">
          ${post.image ? `<img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}" loading="eager">` : '<div class="lb-blog-featured-image-placeholder">✍️</div>'}
        </div>
        <div class="lb-blog-featured-content">
          ${post.category ? `<span class="lb-blog-category-badge">${escapeHtml(post.category)}</span>` : ''}
          <h2 class="lb-blog-featured-title">${escapeHtml(post.title)}</h2>
          ${post.excerpt ? `<p class="lb-blog-featured-excerpt">${escapeHtml(post.excerpt)}</p>` : ''}
          <div class="lb-blog-post-meta">
            <span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              ${formatDate(post.createdAt)}
            </span>
          </div>
          <span class="lb-blog-read-more">
            Read article
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </span>
        </div>
      </a>
    </div>
  `;
}

function renderBlogCard(post, config = {}) {
  return `
    <a href="${config.blogPath || '/blog'}/${post.slug}" class="lb-blog-card">
      <div class="lb-blog-card-image">
        ${post.image ? `<img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}" loading="lazy">` : '<div class="lb-blog-card-image-placeholder">📄</div>'}
      </div>
      <div class="lb-blog-card-content">
        ${post.category ? `<span class="lb-blog-category-badge">${escapeHtml(post.category)}</span>` : ''}
        <h3 class="lb-blog-card-title">${escapeHtml(post.title)}</h3>
        ${post.excerpt ? `<p class="lb-blog-card-excerpt">${escapeHtml(post.excerpt)}</p>` : ''}
        <div class="lb-blog-card-meta">
          <span>${formatDate(post.createdAt)}</span>
        </div>
      </div>
    </a>
  `;
}

function renderPost(post, config = {}) {
  const content = post.content || '';
  const siteUrl = window.location.origin;
  const postUrl = `${siteUrl}${config.blogPath || '/blog'}/${post.slug}`;
  
  return `
    <div class="lb-blog-wrap">
      <nav class="lb-blog-nav">
        <div class="lb-blog-nav-inner">
          <a href="${config.blogPath || '/blog'}" class="lb-blog-logo">${escapeHtml(config.blogTitle || 'Blog')}</a>
        </div>
      </nav>
      
      <main class="lb-blog-container">
        <a href="${config.blogPath || '/blog'}" class="lb-blog-back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back to blog
        </a>
        
        <header class="lb-post-hero">
          ${post.category ? `<span class="lb-blog-category-badge">${escapeHtml(post.category)}</span>` : ''}
          <h1 class="lb-post-hero-title">${escapeHtml(post.title)}</h1>
          <div class="lb-post-hero-meta">
            <span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <time itemprop="datePublished" datetime="${formatDateISO(post.createdAt)}">${formatDate(post.createdAt)}</time>
            </span>
            ${post.updatedAt && post.updatedAt !== post.createdAt ? `
              <span>
                Updated ${formatDate(post.updatedAt)}
              </span>
            ` : ''}
          </div>
          <div class="lb-post-hero-line"></div>
        </header>
        
        <div class="lb-post-cover">
          ${post.image ? `<img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}">` : '<div class="lb-post-cover-placeholder">📝</div>'}
        </div>
        
        <article class="lb-post-content-wrap">
          <div class="lb-post-content" itemprop="articleBody">
            ${content}
          </div>
        </article>
      </main>
      
      <footer class="lb-blog-footer">
        <p>© ${new Date().getFullYear()} <a href="${siteUrl}">${escapeHtml(config.blogTitle || 'Blog')}</a></p>
      </footer>
    </div>
  `;
}

function renderBlogIndex(posts, config = {}) {
  return `
    <div class="lb-blog-wrap">
      <nav class="lb-blog-nav">
        <div class="lb-blog-nav-inner">
          <a href="${config.blogPath || '/'}" class="lb-blog-logo">${escapeHtml(config.blogTitle || 'Blog')}</a>
        </div>
      </nav>
      
      <main class="lb-blog-container">
        ${renderPostList(posts, config)}
      </main>
      
      <footer class="lb-blog-footer">
        <p>© ${new Date().getFullYear()} <a href="${window.location.origin}">${escapeHtml(config.blogTitle || 'Blog')}</a></p>
      </footer>
    </div>
  `;
}

function injectStyles() {
  if (document.getElementById('lb-styles')) return;
  
  document.body.style.background = '#fff';
  document.documentElement.style.background = '#fff';
  
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
  const container = config.container || document.getElementById('app') || document.body;
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
  const container = config.container || document.getElementById('app') || document.body;
  container.innerHTML = renderPost(post, config);
}

export function renderLoading(config = {}) {
  const container = config.container || document.getElementById('app') || document.body;
  container.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;"><div style="width:36px;height:36px;border:3px solid #e2e8f0;border-top-color:#f59e0b;border-radius:50%;animation:lb-spin 0.8s linear infinite;margin-bottom:12px;"></div><span style="color:#64748b;font-size:14px;font-weight:500;">Loading...</span><style>@keyframes lb-spin{to{transform:rotate(360deg)}}</style></div>`;
}

export function renderError(message, config = {}) {
  injectStyles();
  const container = config.container || document.getElementById('app') || document.body;
  container.innerHTML = `
    <div class="lb-blog-wrap">
      <main class="lb-blog-container">
        <div class="lb-empty">
          <div class="lb-empty-icon">😕</div>
          <h2>Oops!</h2>
          <p>${escapeHtml(message)}</p>
        </div>
      </main>
    </div>
  `;
}

export { BLOG_STYLES };
