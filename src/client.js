// Default Turso configuration (for multi-tenant)
const DEFAULT_DB_URL = 'libsql://lightweight-blogger-beta-itobboninja.aws-us-east-2.turso.io';
const DEFAULT_DB_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzM4NTA3MjAsImlkIjoiMDE5Y2ZkYWItMDgwMS03NjdmLWEwMDktZjVjMTM4MDZiNGIxIiwicmlkIjoiZDU5YmUyMDQtNDVhZi00YzBkLTliNTItM2RhMzcwYTZmMTEyIn0.LzJIySkAa-lxnOahmLPVSZ0lHgRf4F6TsKMqoedRjJz-Mo92s-0ro7N6nAxcpG4f-VTyiD6P1WPnTOVpEJo_Bg';

const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const ACCENT_COLORS = {
  amber: { light: '#f59e0b', dark: '#fbbf24', bg: '#fffbeb', bgDark: '#451a03' },
  indigo: { light: '#6366f1', dark: '#818cf8', bg: '#eef2ff', bgDark: '#1e1b4b' },
  rose: { light: '#f43f5e', dark: '#fb7185', bg: '#fff1f2', bgDark: '#4c0519' },
  teal: { light: '#14b8a6', dark: '#2dd4bf', bg: '#f0fdfa', bgDark: '#042f2e' },
  emerald: { light: '#10b981', dark: '#34d399', bg: '#ecfdf5', bgDark: '#064e3b' },
  violet: { light: '#8b5cf6', dark: '#a78bfa', bg: '#f5f3ff', bgDark: '#2e1065' },
};

const DEFAULT_SETTINGS = {
  accentColor: 'amber',
  theme: 'light',
};

const LOADING_HTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;"><div style="width:36px;height:36px;border:3px solid #e2e8f0;border-top-color:#f59e0b;border-radius:50%;animation:lb-spin 0.8s linear infinite;margin-bottom:12px;"></div><span style="color:#64748b;font-size:14px;font-weight:500;">Loading...</span><style>@keyframes lb-spin{to{transform:rotate(360deg)}}</style></div>`;

const FOUC_PREVENT_SCRIPT = `
(function() {
  var settings = {};
  try { settings = JSON.parse(localStorage.getItem('lb_settings')) || {}; } catch(e) {}
  var isDark = settings.theme === 'dark';
  var bgColor = isDark ? '#0f172a' : '#fff';
  var style = document.createElement('style');
  style.textContent = 'html,body{background:' + bgColor + '!important}';
  document.head.insertBefore(style, document.head.firstChild);
  document.body.style.background = bgColor;
  document.documentElement.style.background = bgColor;
})();
`;

function injectAntiFouc() {
  if (document.getElementById('lb-anti-fouc')) return;
  const script = document.createElement('script');
  script.id = 'lb-anti-fouc';
  script.textContent = FOUC_PREVENT_SCRIPT;
  document.head.appendChild(script);
}

function revealContainer() {
  const app = document.getElementById('app');
  if (app) {
    app.style.opacity = '1';
  }
}

setTimeout(() => {
  const app = document.getElementById('app');
  if (app && app.style.opacity === '0') {
    app.style.opacity = '1';
  }
}, 2000);

let dbInitialized = false;
let currentBlog = null;
let sessionData = null;
let postsCache = {};
let blogCache = {};
let appSettings = { ...DEFAULT_SETTINGS };

function getSettings() {
  try {
    const stored = localStorage.getItem('lb_settings');
    if (stored) {
      appSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {}
  return appSettings;
}

function saveSettings(settings) {
  appSettings = { ...appSettings, ...settings };
  localStorage.setItem('lb_settings', JSON.stringify(appSettings));
}

function applyTheme() {
  const settings = getSettings();
  const accent = ACCENT_COLORS[settings.accentColor] || ACCENT_COLORS.amber;
  const isDark = settings.theme === 'dark';
  const accentColor = isDark ? accent.dark : accent.light;
  const bgColor = isDark ? '#0f172a' : '#fff';
  
  document.documentElement.style.setProperty('--lb-accent', accentColor);
  document.documentElement.style.setProperty('--lb-accent-bg', isDark ? accent.bgDark : accent.bg);
  document.documentElement.setAttribute('data-theme', settings.theme);
  
  const blogWrap = document.querySelector('.lb-blog-wrap');
  if (blogWrap) {
    blogWrap.style.setProperty('--lb-blog-accent', accentColor);
    blogWrap.setAttribute('data-theme', settings.theme);
  }
  
  const bgLayer = document.getElementById('lb-bg-layer');
  if (bgLayer) {
    bgLayer.style.background = bgColor;
  }
  
  const container = document.querySelector('[id^="lb-"]');
  if (container) {
    container.style.background = bgColor;
  }
}

async function initDatabase(config = {}) {
  if (dbInitialized) return;
  
  const { initDatabase: initDb, ensureTables, getBlogBySlug, getBlogByDomain, createBlog, getPost, getPostsByDomain, getPostByDomainAndSlug, getAllPostsForBlog, createPost, updatePost, deletePost } = await import('./database/index.js');
  const { hashPassword: hash, verifyPassword: verify } = await import('./security/index.js');
  
  initDb(config);
  await ensureTables();
  dbInitialized = true;
  window.__lb_db = { getBlogBySlug, getBlogByDomain, createBlog, getPost, getPostsByDomain, getPostByDomainAndSlug, getAllPostsForBlog, createPost, updatePost, deletePost, ensureTables, hashPassword: hash, verifyPassword: verify };
}

function getSession() {
  if (sessionData) return sessionData;
  
  const stored = localStorage.getItem('lb_session');
  if (stored) {
    try {
      sessionData = JSON.parse(stored);
      return sessionData;
    } catch {}
  }
  return null;
}

function setSession(blog, status) {
  sessionData = {
    blogId: blog.id,
    username: blog.username,
    slug: blog.username,
    blogTitle: blog.blog_title || blog.username,
    status
  };
  localStorage.setItem('lb_session', JSON.stringify(sessionData));
}

function getLocalDrafts(blogId) {
  const drafts = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(`lb_draft_${blogId}_`)) {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        if (data) {
          drafts.push({ key, data });
        }
      } catch (e) {}
    }
  }
  return drafts.sort((a, b) => (b.data.savedAt || 0) - (a.data.savedAt || 0));
}

function generateDraftId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function clearSession() {
  sessionData = null;
  localStorage.removeItem('lb_session');
}

async function initBlog(options = {}) {
  console.log('[lb] initBlog start');
  injectAntiFouc();
  const { blogPath = '/blog', apiUrl = '/api/blog', dbUrl, dbToken, cacheTtl = DEFAULT_CACHE_TTL, postsPerPage = 10, container } = options;
  
  try {
    const { renderBlogListing, renderBlogPost, renderError, renderLoading } = await import('./blog/index.js');
    const { injectSitemapLink, injectAlternateLinks } = await import('./blog/seo.js');
    await initDatabase({ dbUrl, dbToken });
    
    const { getPostsByDomain, getPostByDomainAndSlug, getBlogByDomain } = window.__lb_db;
    const path = window.location.pathname;
    const domain = window.location.hostname;
    const siteUrl = window.location.origin;
    
    const blogInfo = await getBlogByDomain(domain);
    const blogTitle = blogInfo?.blog_title || blogInfo?.username || 'Blog';
    
    injectSitemapLink({ siteUrl, blogPath });
    injectAlternateLinks({ siteUrl, blogPath });
    
    const getPageFromUrl = () => {
      const match = path.match(new RegExp(`^${blogPath}/page/(\\d+)/?$`));
      return match ? parseInt(match[1], 10) : 1;
    };
    
    if (path === blogPath || path === blogPath + '/' || path.match(new RegExp(`^${blogPath}/page/\\d+/?$`))) {
      const now = Date.now();
      const page = getPageFromUrl();
      const cacheKey = `${domain}:${page}`;
      const cached = blogCache[cacheKey];
      
      let posts, totalPosts;
      if (cached && (now - cached.timestamp < cacheTtl)) {
        posts = cached.posts;
        totalPosts = cached.totalPosts;
      } else {
        renderLoading({ container });
        const offset = (page - 1) * postsPerPage;
        posts = await getPostsByDomain(domain, { published: true, limit: postsPerPage, offset });
        totalPosts = posts.length === postsPerPage ? offset + postsPerPage + 1 : offset + posts.length;
        blogCache[cacheKey] = { posts, totalPosts, timestamp: now };
      }
      
      const mapped = posts.map(p => ({
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        category: p.category,
        published: p.published === 1,
        createdAt: p.created_at,
        updatedAt: p.updated_at
      }));
      renderBlogListing(mapped, { blogPath, page, postsPerPage, totalPosts, blogTitle, container });
      applyTheme();
      revealContainer();
    } else {
      const match = path.match(new RegExp(`^${blogPath}/([^/]+)/?$`));
      if (match) {
        const slug = match[1];
        
        let fullPost;
        const cached = blogCache[domain];
        if (cached) {
          fullPost = cached.posts.find(p => p.slug === slug);
        }
        if (!fullPost) {
          renderLoading({ container });
          fullPost = await getPostByDomainAndSlug(domain, slug);
        }
        
        if (fullPost) {
          renderBlogPost({
            slug: fullPost.slug,
            title: fullPost.title,
            content: fullPost.content,
            excerpt: fullPost.excerpt,
            category: fullPost.category,
            createdAt: fullPost.created_at,
            updatedAt: fullPost.updated_at
          }, { blogPath, blogTitle, container });
          applyTheme();
          revealContainer();
        } else {
          renderError('Post not found', { container });
          applyTheme();
          revealContainer();
        }
      }
    }
  } catch (err) {
    console.error('Blog init error:', err);
    const { renderError } = await import('./blog/index.js');
    renderError('Failed to load blog', { container });
    applyTheme();
    revealContainer();
  }
}

async function initAdminPanel(options = {}) {
  console.log('[lb] initAdminPanel start');
  injectAntiFouc();
  applyTheme();
  const { adminPath = '/admin', apiUrl = '/api/blog', dbUrl, dbToken, container } = options;
  
  try {
    await initDatabase({ dbUrl, dbToken });
    console.log('[lb] Database initialized');
  } catch (e) {
    console.error('[lb] Database init error:', e);
  }
  
  const session = getSession();
  const { getBlogBySlug, createBlog, hashPassword, verifyPassword, getAllPostsForBlog, createPost, updatePost, deletePost } = window.__lb_db;
  
  const targetContainer = container || document.getElementById('app') || document.body;
  console.log('[lb] Target container:', targetContainer.id);
  
  if (!session) {
    targetContainer.innerHTML = renderLogin();
    setupLoginEvents(targetContainer, dbUrl, dbToken);
    revealContainer();
  } else {
    targetContainer.innerHTML = renderLoading({ container });
    let posts = postsCache[session.blogId];
    if (!posts) {
      posts = await getAllPostsForBlog(session.blogId);
      postsCache[session.blogId] = posts;
    }
    const drafts = getLocalDrafts(session.blogId);
    targetContainer.innerHTML = renderDashboard(posts, session.slug, drafts, session.blogId);
    setupDashboardEvents(targetContainer, session.slug, dbUrl, dbToken, session.blogId);
    revealContainer();
  }
  console.log('[lb] initAdminPanel complete');
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

const ADMIN_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono&display=swap');

:root {
  --lb-accent: #f59e0b;
  --lb-accent-bg: #fffbeb;
  --lb-bg: #ffffff;
  --lb-bg-secondary: #f8fafc;
  --lb-surface: #ffffff;
  --lb-border: #e2e8f0;
  --lb-text: #334155;
  --lb-text-secondary: #64748b;
  --lb-text-muted: #94a3b8;
  --lb-danger: #ef4444;
  --lb-danger-bg: #fef2f2;
  --lb-success: #10b981;
  --lb-success-bg: #ecfdf5;
  --lb-shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
  --lb-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --lb-shadow-md: 0 4px 6px -1px rgba(0,0,0,0.06), 0 2px 4px -2px rgba(0,0,0,0.04);
  --lb-radius: 8px;
  --lb-radius-sm: 6px;
}

[data-theme="dark"] {
  --lb-bg: #0f172a;
  --lb-bg-secondary: #1e293b;
  --lb-surface: #1e293b;
  --lb-border: #334155;
  --lb-text: #f1f5f9;
  --lb-text-secondary: #94a3b8;
  --lb-text-muted: #64748b;
  --lb-danger-bg: #450a0a;
  --lb-success-bg: #064e3b;
  --lb-shadow-sm: 0 1px 2px rgba(0,0,0,0.2);
  --lb-shadow: 0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2);
  --lb-shadow-md: 0 4px 6px -1px rgba(0,0,0,0.3), 0 2px 4px -2px rgba(0,0,0,0.2);
}

.lb-admin { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: var(--lb-bg); color: var(--lb-text); line-height: 1.5; }
.lb-admin * { box-sizing: border-box; }
.lb-admin { min-height: 100vh; }
#app { transition: opacity 0.15s ease; }

.lb-login-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1.5rem; background: var(--lb-bg-secondary); }
.lb-login-box { background: var(--lb-surface); padding: 2.5rem; border-radius: var(--lb-radius); box-shadow: var(--lb-shadow-md); width: 100%; max-width: 380px; border: 1px solid var(--lb-border); }
.lb-login-box h1 { font-size: 1.5rem; font-weight: 600; margin: 0 0 0.375rem; text-align: center; color: var(--lb-text); letter-spacing: -0.02em; }
.lb-login-box .subtitle { text-align: center; color: var(--lb-text-secondary); margin-bottom: 1.75rem; font-size: 0.9rem; }

.lb-form-group { margin-bottom: 1.25rem; }
.lb-form-group label { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.5rem; color: var(--lb-text); }
.lb-form-group input, .lb-form-group textarea { width: 100%; padding: 0.75rem 0.875rem; border: 1px solid var(--lb-border); border-radius: var(--lb-radius-sm); font-size: 0.9375rem; font-family: inherit; transition: border-color 0.15s, box-shadow 0.15s; background: var(--lb-bg); color: var(--lb-text); }
.lb-form-group input::placeholder, .lb-form-group textarea::placeholder { color: var(--lb-text-muted); }
.lb-form-group input:focus, .lb-form-group textarea:focus { outline: none; border-color: var(--lb-accent); box-shadow: 0 0 0 3px var(--lb-accent-bg); }
.lb-form-group textarea { min-height: 120px; resize: vertical; line-height: 1.6; }

.lb-btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.625rem 1.125rem; font-size: 0.875rem; font-weight: 500; border: none; border-radius: var(--lb-radius-sm); cursor: pointer; transition: all 0.15s; font-family: inherit; white-space: nowrap; }
.lb-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.lb-btn-primary { background: var(--lb-accent); color: #000; }
.lb-btn-primary:hover:not(:disabled) { filter: brightness(0.95); }
.lb-btn-secondary { background: transparent; color: var(--lb-text); border: 1px solid var(--lb-border); }
.lb-btn-secondary:hover:not(:disabled) { background: var(--lb-bg-secondary); }
.lb-btn-danger { background: var(--lb-danger); color: white; }
.lb-btn-danger:hover:not(:disabled) { filter: brightness(0.95); }
.lb-btn-ghost { background: transparent; color: var(--lb-text-secondary); border: none; padding: 0.5rem 0.75rem; }
.lb-btn-ghost:hover { background: var(--lb-bg-secondary); color: var(--lb-text); }
.lb-btn-block { width: 100%; }
.lb-btn-sm { padding: 0.4375rem 0.75rem; font-size: 0.8125rem; }

.lb-error { background: var(--lb-danger-bg); color: var(--lb-danger); padding: 0.75rem 1rem; border-radius: var(--lb-radius-sm); font-size: 0.875rem; margin-bottom: 1rem; }
.lb-success-msg { background: var(--lb-success-bg); color: var(--lb-success); padding: 0.75rem 1rem; border-radius: var(--lb-radius-sm); font-size: 0.875rem; margin-bottom: 1rem; }

.lb-admin-header { background: var(--lb-surface); border-bottom: 1px solid var(--lb-border); padding: 1rem 1.5rem; display: flex; align-items: center; justify-content: center; gap: 1.5rem; flex-wrap: wrap; position: sticky; top: 0; z-index: 100; }
.lb-admin-header h1 { font-size: 1rem; font-weight: 600; margin: 0; color: var(--lb-text); letter-spacing: -0.01em; }
.lb-admin-nav { display: flex; align-items: center; gap: 0.25rem; }
.lb-admin-content { max-width: 720px; margin: 0 auto; padding: 2rem 1.5rem; }

.lb-post-list { background: var(--lb-surface); border-radius: var(--lb-radius); box-shadow: var(--lb-shadow); overflow: hidden; border: 1px solid var(--lb-border); }
.lb-post-list-header { padding: 1rem 1.25rem; border-bottom: 1px solid var(--lb-border); display: flex; align-items: center; justify-content: space-between; background: var(--lb-bg-secondary); }
.lb-post-list-header h2 { font-size: 0.8125rem; font-weight: 600; margin: 0; color: var(--lb-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
.lb-post-item { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid var(--lb-border); transition: background 0.1s; }
.lb-post-item:last-child { border-bottom: none; }
.lb-post-item:hover { background: var(--lb-bg-secondary); }
.lb-post-info { flex: 1; min-width: 0; }
.lb-post-info h3 { font-size: 0.9375rem; font-weight: 500; margin: 0 0 0.25rem; color: var(--lb-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lb-post-info p { font-size: 0.8125rem; color: var(--lb-text-muted); margin: 0; }
.lb-post-status { display: inline-flex; align-items: center; padding: 0.1875rem 0.5rem; font-size: 0.6875rem; font-weight: 600; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.03em; }
.lb-status-published { background: var(--lb-success-bg); color: var(--lb-success); }
.lb-status-draft { background: var(--lb-bg-secondary); color: var(--lb-text-secondary); }
.lb-post-actions { display: flex; gap: 0.375rem; flex-shrink: 0; margin-left: 1rem; }

.lb-editor { background: var(--lb-surface); border-radius: var(--lb-radius); box-shadow: var(--lb-shadow); border: 1px solid var(--lb-border); }
.lb-editor-header { padding: 0.875rem 1.25rem; border-bottom: 1px solid var(--lb-border); display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.lb-editor-header h2 { font-size: 0.9375rem; font-weight: 600; margin: 0; color: var(--lb-text); }
.lb-editor-body { padding: 1.25rem; }
.lb-meta-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.lb-checkbox-group { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem; }
.lb-checkbox-group input { width: auto; accent-color: var(--lb-accent); }
.lb-checkbox-group label { margin: 0; font-size: 0.875rem; color: var(--lb-text-secondary); }

.lb-empty-state { text-align: center; padding: 3rem 1.5rem; color: var(--lb-text-muted); }
.lb-empty-state svg { width: 48px; height: 48px; margin-bottom: 1rem; opacity: 0.4; }
.lb-empty-state p { font-size: 0.9375rem; margin: 0; }

.lb-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem; color: var(--lb-text-muted); gap: 1rem; }
.lb-spinner { width: 28px; height: 28px; border: 2px solid var(--lb-border); border-top-color: var(--lb-accent); border-radius: 50%; animation: lb-spin 0.8s linear infinite; }
@keyframes lb-spin { to { transform: rotate(360deg); } }

.lb-saving-indicator { font-size: 0.8125rem; color: var(--lb-text-muted); }
.lb-saving-indicator.saving { color: var(--lb-accent); }
.lb-saving-indicator.saved { color: var(--lb-success); }

.switch-link { color: var(--lb-accent); cursor: pointer; text-decoration: none; font-weight: 500; font-size: 0.875rem; }
.switch-link:hover { text-decoration: underline; }

.lb-quill-editor { background: var(--lb-bg); border-radius: var(--lb-radius-sm); }
.lb-ql-container { border: 1px solid var(--lb-border) !important; border-radius: 0 0 var(--lb-radius-sm) var(--lb-radius-sm) !important; }
.lb-ql-toolbar { border-radius: var(--lb-radius-sm) var(--lb-radius-sm) 0 0 !important; border: 1px solid var(--lb-border) !important; border-bottom: none !important; padding: 0.5rem !important; }
.lb-ql-editor { min-height: 200px; font-family: inherit; font-size: 0.9375rem; line-height: 1.7; }
.lb-ql-editor.ql-blank::before { color: var(--lb-text-muted); font-style: normal; }

.ql-toolbar.ql-snow .ql-picker-label { padding: 2px 4px; }
.ql-snow .ql-tooltip { border-radius: var(--lb-radius-sm); box-shadow: var(--lb-shadow-md); border: 1px solid var(--lb-border); }
.ql-snow .ql-tooltip input[type="text"] { border-radius: var(--lb-radius-sm); border: 1px solid var(--lb-border); padding: 4px 8px; }
.ql-snow .ql-tooltip a { color: var(--lb-accent); }

.lb-modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.4); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 1rem; backdrop-filter: blur(2px); }
.lb-modal { background: var(--lb-surface); border-radius: var(--lb-radius); padding: 1.5rem; max-width: 380px; width: 100%; box-shadow: var(--lb-shadow-md); animation: lb-modal-in 0.2s ease; }
@keyframes lb-modal-in { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
.lb-modal h3 { font-size: 1rem; font-weight: 600; margin: 0 0 0.5rem; }
.lb-modal p { color: var(--lb-text-secondary); margin: 0 0 1.25rem; font-size: 0.875rem; line-height: 1.5; }
.lb-modal-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }

.lb-toast { position: fixed; bottom: 1.5rem; right: 1.5rem; background: var(--lb-text); color: var(--lb-bg); padding: 0.75rem 1.125rem; border-radius: 9999px; box-shadow: var(--lb-shadow-md); z-index: 10000; animation: lb-toast-in 0.25s ease; font-size: 0.875rem; font-weight: 500; }
.lb-toast.success { background: var(--lb-success); }
.lb-toast.error { background: var(--lb-danger); }
@keyframes lb-toast-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

.lb-settings-panel { background: var(--lb-surface); border-radius: var(--lb-radius); box-shadow: var(--lb-shadow); border: 1px solid var(--lb-border); margin-top: 2rem; }
.lb-settings-header { padding: 1rem 1.25rem; border-bottom: 1px solid var(--lb-border); }
.lb-settings-header h3 { font-size: 0.8125rem; font-weight: 600; margin: 0; color: var(--lb-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
.lb-settings-body { padding: 1.25rem; }
.lb-setting-row { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid var(--lb-border); }
.lb-setting-row:last-child { border-bottom: none; padding-bottom: 0; }
.lb-setting-info h4 { font-size: 0.875rem; font-weight: 500; margin: 0 0 0.125rem; }
.lb-setting-info p { font-size: 0.8125rem; color: var(--lb-text-muted); margin: 0; }
.lb-color-options { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.lb-color-btn { width: 28px; height: 28px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; transition: all 0.15s; }
.lb-color-btn:hover { transform: scale(1.1); }
.lb-color-btn.active { border-color: var(--lb-text); box-shadow: 0 0 0 2px var(--lb-bg), 0 0 0 4px currentColor; }
.lb-theme-toggle { display: flex; gap: 0.25rem; background: var(--lb-bg-secondary); padding: 0.25rem; border-radius: 9999px; }
.lb-theme-btn { padding: 0.375rem 0.75rem; border: none; background: transparent; border-radius: 9999px; cursor: pointer; font-size: 0.75rem; font-weight: 500; color: var(--lb-text-muted); transition: all 0.15s; }
.lb-theme-btn.active { background: var(--lb-surface); color: var(--lb-text); box-shadow: var(--lb-shadow-sm); }

@media (max-width: 600px) {
  .lb-admin-header { padding: 0.875rem 1rem; }
  .lb-admin-content { padding: 1.25rem 1rem; }
  .lb-meta-row { grid-template-columns: 1fr; }
  .lb-editor-body { padding: 1rem; }
  .lb-post-item { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
  .lb-post-actions { width: 100%; justify-content: flex-start; margin-left: 0; }
  .lb-btn { padding: 0.5625rem 1rem; }
  .lb-toast { left: 1rem; right: 1rem; bottom: 1rem; }
}
`;

function injectStyles() {
  if (document.getElementById('lb-admin-styles')) return;
  const style = document.createElement('style');
  style.id = 'lb-admin-styles';
  style.textContent = ADMIN_STYLES;
  document.head.appendChild(style);
  
  if (!document.querySelector('link[href*="quill.snow"]')) {
    const quillCSS = document.createElement('link');
    quillCSS.rel = 'stylesheet';
    quillCSS.href = 'https://cdn.quilljs.com/1.3.7/quill.snow.css';
    document.head.appendChild(quillCSS);
    
    const quillJS = document.createElement('script');
    quillJS.src = 'https://cdn.quilljs.com/1.3.7/quill.min.js';
    document.head.appendChild(quillJS);
  }
}

function showModal(options = {}) {
  const { title, message, confirmText = 'Confirm', cancelText = 'Cancel', danger = false, onConfirm, onCancel } = options;
  
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'lb-modal-overlay';
    overlay.innerHTML = `
      <div class="lb-modal">
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(message)}</p>
        <div class="lb-modal-actions">
          <button class="lb-btn lb-btn-secondary lb-modal-cancel">${escapeHtml(cancelText)}</button>
          <button class="lb-btn ${danger ? 'lb-btn-danger' : 'lb-btn-primary'} lb-modal-confirm">${escapeHtml(confirmText)}</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    const close = (result) => {
      document.body.removeChild(overlay);
      resolve(result);
    };
    
    overlay.querySelector('.lb-modal-cancel').addEventListener('click', () => {
      if (onCancel) onCancel();
      close(false);
    });
    
    overlay.querySelector('.lb-modal-confirm').addEventListener('click', () => {
      if (onConfirm) onConfirm();
      close(true);
    });
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        if (onCancel) onCancel();
        close(false);
      }
    });
  });
}

function showToast(message, type = 'info', duration = 3000) {
  const existing = document.querySelector('.lb-toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = `lb-toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'lb-toast-in 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function setButtonLoading(btn, loading) {
  if (loading) {
    btn.disabled = true;
    btn.dataset.originalText = btn.textContent;
    btn.textContent = 'Loading...';
    btn.classList.add('lb-loading-btn');
  } else {
    btn.disabled = false;
    btn.textContent = btn.dataset.originalText || btn.textContent;
    btn.classList.remove('lb-loading-btn');
  }
}

function renderLogin() {
  injectStyles();
  return `
    <div class="lb-admin">
      <div class="lb-login-container">
        <div class="lb-login-box">
          <h1>Create Your Blog</h1>
          <p class="subtitle">Set up your blog in seconds</p>
          <div id="lb-login-error"></div>
          <form id="lb-setup-form">
            <div class="lb-form-group">
              <label for="lb-blog-slug">Choose a URL slug</label>
              <input type="text" id="lb-blog-slug" placeholder="my-awesome-blog" required style="text-transform: lowercase;">
            </div>
            <div class="lb-form-group">
              <label for="lb-blog-title">Blog Title</label>
              <input type="text" id="lb-blog-title" placeholder="My Awesome Blog" value="My Blog">
            </div>
            <div class="lb-form-group">
              <label for="lb-password">Create Password</label>
              <input type="password" id="lb-password" placeholder="Min 4 characters" required minlength="4">
            </div>
            <div class="lb-form-group">
              <label for="lb-confirm-password">Confirm Password</label>
              <input type="password" id="lb-confirm-password" placeholder="Confirm your password" required>
            </div>
            <button type="submit" class="lb-btn lb-btn-primary">Create Blog</button>
          </form>
          <p style="text-align: center; margin-top: 1.5rem; color: var(--lb-text-secondary); font-size: 0.9rem;">
            Already have a blog? <span class="switch-link" id="lb-switch-login">Login here</span>
          </p>
        </div>
      </div>
    </div>
  `;
}

function renderLoading() {
  return LOADING_HTML;
}

function renderDashboard(posts, blogSlug, drafts = [], blogId = null) {
  injectStyles();
  const hasPublishedPosts = posts.some(p => p.published);
  const hasDraftPosts = posts.some(p => !p.published);
  const settings = getSettings();
  
  return `
    <div class="lb-admin">
      <header class="lb-admin-header">
        <h1>Blog Posts</h1>
        <nav class="lb-admin-nav">
          <button class="lb-btn lb-btn-ghost" id="lb-settings" title="Settings">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
          <button class="lb-btn lb-btn-primary" id="lb-new-post">+ New Post</button>
          <button class="lb-btn lb-btn-secondary" id="lb-logout">Logout</button>
        </nav>
      </header>
      <main class="lb-admin-content">
        <div class="lb-settings-panel" id="lb-settings-panel" style="display: none;">
          <div class="lb-settings-header">
            <h3>Appearance</h3>
          </div>
          <div class="lb-settings-body">
            <div class="lb-setting-row">
              <div class="lb-setting-info">
                <h4>Accent Color</h4>
                <p>Choose a color for buttons and links</p>
              </div>
              <div class="lb-color-options">
                ${Object.entries(ACCENT_COLORS).map(([name, colors]) => `
                  <button class="lb-color-btn ${settings.accentColor === name ? 'active' : ''}" 
                    data-color="${name}" 
                    style="background: ${colors.light};" 
                    title="${name.charAt(0).toUpperCase() + name.slice(1)}">
                  </button>
                `).join('')}
              </div>
            </div>
            <div class="lb-setting-row">
              <div class="lb-setting-info">
                <h4>Theme</h4>
                <p>Switch between light and dark mode</p>
              </div>
              <div class="lb-theme-toggle">
                <button class="lb-theme-btn ${settings.theme === 'light' ? 'active' : ''}" data-theme="light">Light</button>
                <button class="lb-theme-btn ${settings.theme === 'dark' ? 'active' : ''}" data-theme="dark">Dark</button>
              </div>
            </div>
          </div>
        </div>
        
        ${posts.length === 0 && drafts.length === 0 ? `
          <div class="lb-empty-state">
            <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">No posts yet</p>
            <p style="font-size: 0.9rem; color: var(--lb-text-secondary);">Create your first blog post to get started!</p>
          </div>
        ` : `
          ${hasPublishedPosts ? `
            <div class="lb-post-list">
              <div class="lb-post-list-header">
                <h2>Published</h2>
                <span style="color: var(--lb-text-secondary); font-size: 0.9rem;">${posts.filter(p => p.published).length}</span>
              </div>
              ${posts.filter(p => p.published).map(post => `
                <div class="lb-post-item" data-slug="${post.slug}">
                  <div class="lb-post-info">
                    <h3>${escapeHtml(post.title)}</h3>
                    <p>${new Date(post.created_at).toLocaleDateString()} · ${post.slug}</p>
                  </div>
                  <div class="lb-post-actions">
                    <span class="lb-post-status lb-status-published">Published</span>
                    <button class="lb-btn lb-btn-secondary lb-btn-sm lb-edit-post" data-id="${post.id}" data-slug="${post.slug}">Edit</button>
                    <button class="lb-btn lb-btn-danger lb-btn-sm lb-delete-post" data-id="${post.id}" data-slug="${post.slug}">Delete</button>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          ${hasDraftPosts || drafts.length > 0 ? `
            <div class="lb-post-list" style="margin-top: 2rem;">
              <div class="lb-post-list-header">
                <h2>Drafts</h2>
                <span style="color: var(--lb-text-secondary); font-size: 0.9rem;">${posts.filter(p => !p.published).length + drafts.length}</span>
              </div>
              ${posts.filter(p => !p.published).map(post => `
                <div class="lb-post-item" data-slug="${post.slug}">
                  <div class="lb-post-info">
                    <h3>${escapeHtml(post.title)}</h3>
                    <p>${new Date(post.created_at).toLocaleDateString()} · ${post.slug}</p>
                  </div>
                  <div class="lb-post-actions">
                    <span class="lb-post-status lb-status-draft">Draft</span>
                    <button class="lb-btn lb-btn-secondary lb-btn-sm lb-edit-post" data-id="${post.id}" data-slug="${post.slug}">Edit</button>
                    <button class="lb-btn lb-btn-danger lb-btn-sm lb-delete-post" data-id="${post.id}" data-slug="${post.slug}">Delete</button>
                  </div>
                </div>
              `).join('')}
              ${drafts.map(draft => `
                <div class="lb-post-item" data-draft-key="${draft.key}">
                  <div class="lb-post-info">
                    <h3>${escapeHtml(draft.data.title) || 'Untitled Draft'}</h3>
                    <p>Local draft</p>
                  </div>
                  <div class="lb-post-actions">
                    <span class="lb-post-status lb-status-draft">Local</span>
                    <button class="lb-btn lb-btn-secondary lb-btn-sm lb-restore-draft" data-key="${draft.key}">Restore</button>
                    <button class="lb-btn lb-btn-danger lb-btn-sm lb-delete-draft" data-key="${draft.key}">Delete</button>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        `}
      </main>
    </div>
  `;
}

function renderEditor(post = null, isNew = false) {
  injectStyles();
  return `
    <div class="lb-admin">
      <header class="lb-admin-header">
        <h1>${isNew ? 'New Blog Post' : 'Edit Post'}</h1>
        <nav class="lb-admin-nav">
          <button class="lb-btn lb-btn-secondary" id="lb-back">← Dashboard</button>
          ${isNew ? `
            <button class="lb-btn lb-btn-secondary" id="lb-save-draft">Save Draft</button>
            <button class="lb-btn lb-btn-primary" id="lb-save">Publish</button>
          ` : `
            <button class="lb-btn lb-btn-primary" id="lb-save">Save Changes</button>
          `}
        </nav>
      </header>
      <main class="lb-admin-content">
        <div class="lb-editor">
          <div class="lb-editor-body">
            <div class="lb-form-group">
              <label for="lb-title">Title</label>
              <input type="text" id="lb-title" value="${escapeHtml(post?.title || '')}" placeholder="Enter post title">
            </div>
            <div class="lb-form-group">
              <label for="lb-slug">URL Slug</label>
              <input type="text" id="lb-slug" value="${escapeHtml(post?.slug || '')}" placeholder="post-url-slug">
            </div>
            <div class="lb-meta-row">
              <div class="lb-form-group">
                <label for="lb-category">Category</label>
                <input type="text" id="lb-category" value="${escapeHtml(post?.category || '')}" placeholder="e.g., Tutorial, News">
              </div>
              ${isNew ? `
                <div class="lb-form-group">
                  <div class="lb-checkbox-group">
                    <input type="checkbox" id="lb-published" checked>
                    <label for="lb-published">Publish immediately</label>
                  </div>
                </div>
              ` : `
                <div class="lb-form-group">
                  <div class="lb-checkbox-group">
                    <input type="checkbox" id="lb-published" ${post?.published ? 'checked' : ''}>
                    <label for="lb-published">Published</label>
                  </div>
                </div>
              `}
            </div>
            <div class="lb-form-group">
              <label for="lb-excerpt">Excerpt (short description)</label>
              <input type="text" id="lb-excerpt" value="${escapeHtml(post?.excerpt || '')}" placeholder="Brief summary for previews">
            </div>
            <div class="lb-form-group">
              <label>Content</label>
              <div id="lb-quill-editor" class="lb-quill-editor">${post?.content || ''}</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `;
}

async function setupLoginEvents(container, dbUrl, dbToken) {
  const form = container.querySelector('#lb-setup-form');
  const switchLink = container.querySelector('#lb-switch-login');
  
  if (switchLink) {
    switchLink.addEventListener('click', (e) => {
      e.preventDefault();
      container.innerHTML = renderLoginForm();
      setupLoginFormEvents(container, dbUrl, dbToken);
    });
  }
  
  if (form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const slug = document.getElementById('lb-blog-slug').value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
      const title = document.getElementById('lb-blog-title').value.trim() || 'My Blog';
      const password = document.getElementById('lb-password').value;
      const confirmPassword = document.getElementById('lb-confirm-password').value;
      
      if (password !== confirmPassword) {
        document.getElementById('lb-login-error').innerHTML = '<div class="lb-error">Passwords do not match. Please try again.</div>';
        return;
      }
      
      if (password.length < 4) {
        document.getElementById('lb-login-error').innerHTML = '<div class="lb-error">Password must be at least 4 characters long.</div>';
        return;
      }
      
      if (!slug) {
        document.getElementById('lb-login-error').innerHTML = '<div class="lb-error">Please enter a URL slug for your blog.</div>';
        return;
      }
      
      if (!/^[a-z0-9-]+$/.test(slug)) {
        document.getElementById('lb-login-error').innerHTML = '<div class="lb-error">Slug can only contain letters, numbers, and hyphens.</div>';
        return;
      }
      
      setButtonLoading(submitBtn, true);
      document.getElementById('lb-login-error').innerHTML = '';
      
      try {
        const { hashPassword, createBlog } = window.__lb_db;
        const hashData = await hashPassword(password);
        
        await createBlog(slug, JSON.stringify(hashData), title);
        
        const { getBlogBySlug } = window.__lb_db;
        const blog = await getBlogBySlug(slug);
        
        setSession(blog, 'authenticated');
        
        const drafts = getLocalDrafts(blog.id);
        container.innerHTML = renderDashboard([], slug, drafts, blog.id);
        setupDashboardEvents(container, slug, dbUrl, dbToken, blog.id);
        showToast('Blog created successfully!', 'success');
      } catch (err) {
        const message = err.message?.includes('UNIQUE constraint') 
          ? 'This blog URL is already taken. Please choose a different one.'
          : 'Failed to create blog. Please try again or contact support.';
        document.getElementById('lb-login-error').innerHTML = `<div class="lb-error">${message}</div>`;
      } finally {
        setButtonLoading(submitBtn, false);
      }
    });
  }
}

function renderLoginForm() {
  injectStyles();
  return `
    <div class="lb-admin">
      <div class="lb-login-container">
        <div class="lb-login-box">
          <h1>Welcome Back</h1>
          <p class="subtitle">Login to manage your blog</p>
          <div id="lb-login-error"></div>
          <form id="lb-login-form">
            <div class="lb-form-group">
              <label for="lb-blog-slug">Blog Slug</label>
              <input type="text" id="lb-blog-slug" placeholder="your-blog-slug" required>
            </div>
            <div class="lb-form-group">
              <label for="lb-password">Password</label>
              <input type="password" id="lb-password" placeholder="Your password" required>
            </div>
            <button type="submit" class="lb-btn lb-btn-primary">Login</button>
          </form>
          <p style="text-align: center; margin-top: 1.5rem; color: var(--lb-text-secondary); font-size: 0.9rem;">
            New blog? <span class="switch-link" id="lb-switch-setup">Create one</span>
          </p>
        </div>
      </div>
    </div>
  `;
}

function setupLoginFormEvents(container, dbUrl, dbToken) {
  const form = container.querySelector('#lb-login-form');
  const switchLink = container.querySelector('#lb-switch-setup');
  
  if (switchLink) {
    switchLink.addEventListener('click', (e) => {
      e.preventDefault();
      container.innerHTML = renderLogin();
      setupLoginEvents(container, dbUrl, dbToken);
    });
  }
  
  if (form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const slug = document.getElementById('lb-blog-slug').value.trim().toLowerCase();
      const password = document.getElementById('lb-password').value;
      
      if (!slug) {
        document.getElementById('lb-login-error').innerHTML = '<div class="lb-error">Please enter your blog URL.</div>';
        return;
      }
      
      if (!password) {
        document.getElementById('lb-login-error').innerHTML = '<div class="lb-error">Please enter your password.</div>';
        return;
      }
      
      setButtonLoading(submitBtn, true);
      document.getElementById('lb-login-error').innerHTML = '';
      
      try {
        const { getBlogBySlug, verifyPassword } = window.__lb_db;
        const blog = await getBlogBySlug(slug);
        
        if (!blog) {
          document.getElementById('lb-login-error').innerHTML = '<div class="lb-error">No blog found with this URL. Please check the URL or create a new blog.</div>';
          setButtonLoading(submitBtn, false);
          return;
        }
        
        let hashData;
        try {
          if (typeof blog.password_hash === 'string') {
            hashData = JSON.parse(blog.password_hash);
          } else if (blog.password_hash && typeof blog.password_hash === 'object') {
            hashData = blog.password_hash;
          } else {
            throw new Error('Invalid password_hash format');
          }
        } catch (e) {
          hashData = { hash: blog.password_hash, salt: '' };
        }
        
        const isValid = await verifyPassword(password, hashData.hash, hashData.salt);
        
        if (!isValid) {
          document.getElementById('lb-login-error').innerHTML = '<div class="lb-error">Incorrect password. Please try again.</div>';
          setButtonLoading(submitBtn, false);
          return;
        }
        
        setSession(blog, 'authenticated');
        
        const { getAllPostsForBlog } = window.__lb_db;
        const posts = await getAllPostsForBlog(blog.id);
        const drafts = getLocalDrafts(blog.id);
        
        container.innerHTML = renderDashboard(posts, slug, drafts, blog.id);
        setupDashboardEvents(container, slug, dbUrl, dbToken, blog.id);
        showToast(`Welcome back!`, 'success');
      } catch (err) {
        document.getElementById('lb-login-error').innerHTML = '<div class="lb-error">Login failed. Please try again or check your internet connection.</div>';
      } finally {
        setButtonLoading(submitBtn, false);
      }
    });
  }
}

async function setupDashboardEvents(container, blogSlug, dbUrl, dbToken, blogId) {
  const session = getSession();
  const actualBlogId = blogId || session?.blogId;
  
  const newPostBtn = container.querySelector('#lb-new-post');
  const logoutBtn = container.querySelector('#lb-logout');
  
  if (newPostBtn) {
    newPostBtn.addEventListener('click', () => {
      container.innerHTML = renderEditor(null, true);
      setupEditorEvents(container, blogSlug, dbUrl, dbToken, actualBlogId);
    });
  }
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearSession();
      container.innerHTML = renderLoginForm();
      setupLoginFormEvents(container, dbUrl, dbToken);
    });
  }
  
  const settingsBtn = container.querySelector('#lb-settings');
  const settingsPanel = container.querySelector('#lb-settings-panel');
  
  if (settingsBtn && settingsPanel) {
    settingsBtn.addEventListener('click', () => {
      const isVisible = settingsPanel.style.display !== 'none';
      settingsPanel.style.display = isVisible ? 'none' : 'block';
    });
    
    container.querySelectorAll('.lb-color-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const color = btn.dataset.color;
        saveSettings({ accentColor: color });
        applyTheme();
        container.querySelectorAll('.lb-color-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        showToast(`Accent color changed to ${color}`, 'success');
      });
    });
    
    container.querySelectorAll('.lb-theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.dataset.theme;
        saveSettings({ theme });
        applyTheme();
        container.querySelectorAll('.lb-theme-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        showToast(`Theme switched to ${theme}`, 'success');
      });
    });
  }
  
  container.querySelectorAll('.lb-edit-post').forEach(btn => {
    btn.addEventListener('click', async () => {
      const slug = btn.dataset.slug;
      const { getPost } = window.__lb_db;
      const post = await getPost(actualBlogId, slug);
      
      if (post) {
        container.innerHTML = renderEditor(post, false);
        setupEditorEvents(container, blogSlug, dbUrl, dbToken, actualBlogId, post.id);
      }
    });
  });
  
  container.querySelectorAll('.lb-delete-post').forEach(btn => {
    btn.addEventListener('click', async () => {
      const confirmed = await showModal({
        title: 'Delete Post',
        message: 'Are you sure you want to delete this post? This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        danger: true
      });
      
      if (confirmed) {
        const { deletePost, getAllPostsForBlog } = window.__lb_db;
        const domain = window.location.hostname;
        await deletePost(actualBlogId, parseInt(btn.dataset.id));
        const posts = await getAllPostsForBlog(actualBlogId);
        postsCache[actualBlogId] = posts;
        blogCache[domain] = null;
        const drafts = getLocalDrafts(actualBlogId);
        container.innerHTML = renderDashboard(posts, blogSlug, drafts, actualBlogId);
        setupDashboardEvents(container, blogSlug, dbUrl, dbToken, actualBlogId);
        showToast('Post deleted', 'success');
      }
    });
  });
  
  container.querySelectorAll('.lb-restore-draft').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      const draftData = JSON.parse(localStorage.getItem(key) || '{}');
      container.innerHTML = renderEditor(draftData, true);
      setupEditorEvents(container, blogSlug, dbUrl, dbToken, actualBlogId, null, key);
    });
  });
  
  container.querySelectorAll('.lb-delete-draft').forEach(btn => {
    btn.addEventListener('click', async () => {
      const confirmed = await showModal({
        title: 'Delete Draft',
        message: 'Are you sure you want to delete this local draft?',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        danger: true
      });
      
      if (confirmed) {
        const key = btn.dataset.key;
        localStorage.removeItem(key);
        const posts = postsCache[actualBlogId] || [];
        const drafts = getLocalDrafts(actualBlogId);
        container.innerHTML = renderDashboard(posts, blogSlug, drafts, actualBlogId);
        setupDashboardEvents(container, blogSlug, dbUrl, dbToken, actualBlogId);
        showToast('Draft deleted', 'success');
      }
    });
  });
}

function setupEditorEvents(container, blogSlug, dbUrl, dbToken, blogId, postId = null, existingDraftKey = null) {
  const saveBtn = container.querySelector('#lb-save');
  const saveDraftBtn = container.querySelector('#lb-save-draft');
  const backBtn = container.querySelector('#lb-back');
  const titleInput = container.querySelector('#lb-title');
  const slugInput = container.querySelector('#lb-slug');
  const excerptInput = container.querySelector('#lb-excerpt');
  const categoryInput = container.querySelector('#lb-category');
  const publishedInput = container.querySelector('#lb-published');
  const domain = window.location.hostname;
  const draftKey = existingDraftKey || `lb_draft_${blogId}_${generateDraftId()}`;
  
  const savedIndicator = document.createElement('span');
  savedIndicator.className = 'lb-saving-indicator';
  savedIndicator.textContent = '';
  saveBtn?.parentNode.insertBefore(savedIndicator, saveBtn.nextSibling);
  
  let hasUnsavedChanges = false;
  let hasBeenSaved = !!postId;
  
  const markUnsaved = () => {
    hasUnsavedChanges = true;
    savedIndicator.textContent = 'Unsaved';
    savedIndicator.className = 'lb-saving-indicator saving';
  };
  
  const markSaved = () => {
    hasUnsavedChanges = false;
    hasBeenSaved = true;
    savedIndicator.textContent = 'Saved';
    savedIndicator.className = 'lb-saving-indicator saved';
  };
  
  const beforeUnloadHandler = (e) => {
    if (hasUnsavedChanges && !hasBeenSaved) {
      e.preventDefault();
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      return e.returnValue;
    }
  };
  
  window.addEventListener('beforeunload', beforeUnloadHandler);
  
  let quillEditor = null;
  
  const initQuill = () => {
    if (typeof Quill !== 'undefined') {
      const editorContainer = container.querySelector('#lb-quill-editor');
      if (editorContainer && !editorContainer.querySelector('.ql-container')) {
        quillEditor = new Quill('#lb-quill-editor', {
          theme: 'snow',
          placeholder: 'Write your blog post content here...',
          modules: {
            toolbar: [
              [{ 'header': [1, 2, 3, 4, false] }],
              [{ 'font': [] }],
              [{ 'size': ['small', false, 'large', 'huge'] }],
              ['bold', 'italic', 'underline', 'strike'],
              [{ 'color': [] }, { 'background': [] }],
              [{ 'align': [] }],
              [{ 'list': 'ordered'}, { 'list': 'bullet' }],
              [{ 'indent': '-1'}, { 'indent': '+1' }],
              ['link', 'image', 'blockquote', 'code-block'],
              ['clean']
            ]
          }
        });
        
        quillEditor.on('text-change', markUnsaved);
      }
    }
  };
  
  const checkQuillAndInit = setInterval(() => {
    if (typeof Quill !== 'undefined') {
      initQuill();
      clearInterval(checkQuillAndInit);
    }
  }, 100);
  
  const getQuillContent = () => {
    if (quillEditor) {
      return quillEditor.root.innerHTML;
    }
    const editorDiv = container.querySelector('#lb-quill-editor');
    return editorDiv ? editorDiv.innerHTML : '';
  };
  
  const setQuillContent = (html) => {
    if (quillEditor && html) {
      quillEditor.root.innerHTML = html;
    }
  };
  
  const getFormData = () => ({
    title: titleInput?.value || '',
    slug: slugInput?.value || '',
    content: getQuillContent(),
    excerpt: excerptInput?.value || '',
    category: categoryInput?.value || '',
    published: publishedInput?.checked || false
  });
  
  const saveDraft = () => {
    const data = getFormData();
    if (data.title || data.content) {
      data.savedAt = Date.now();
      localStorage.setItem(draftKey, JSON.stringify(data));
      savedIndicator.textContent = 'Draft saved';
      savedIndicator.className = 'lb-saving-indicator saved';
      setTimeout(() => {
        savedIndicator.textContent = '';
      }, 2000);
    }
  };
  
  const loadDraft = () => {
    if (postId) return;
    const draft = localStorage.getItem(draftKey);
    if (draft) {
      try {
        const data = JSON.parse(draft);
        if (titleInput && !titleInput.value) titleInput.value = data.title || '';
        if (slugInput && !slugInput.value) slugInput.value = data.slug || '';
        if (data.content) setQuillContent(data.content);
        if (excerptInput && !excerptInput.value) excerptInput.value = data.excerpt || '';
        if (categoryInput && !categoryInput.value) categoryInput.value = data.category || '';
      } catch (e) {}
    }
  };
  
  setTimeout(() => {
    loadDraft();
  }, 300);
  
  let autosaveInterval;
  const startAutosave = () => {
    autosaveInterval = setInterval(saveDraft, 30000);
  };
  
  const stopAutosave = () => {
    if (autosaveInterval) {
      clearInterval(autosaveInterval);
      autosaveInterval = null;
    }
  };
  
  startAutosave();
  
  if (titleInput && slugInput) {
    titleInput.addEventListener('input', () => {
      if (!slugInput.dataset.userModified) {
        slugInput.value = titleInput.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
      markUnsaved();
    });
    
    slugInput.addEventListener('input', () => {
      slugInput.dataset.userModified = 'true';
      markUnsaved();
    });
    
    [excerptInput, categoryInput].forEach(input => {
      if (input) {
        input.addEventListener('input', markUnsaved);
      }
    });
    
    publishedInput?.addEventListener('change', markUnsaved);
  }
  
  if (backBtn) {
    backBtn.addEventListener('click', async () => {
      if (hasUnsavedChanges && !hasBeenSaved) {
        const confirmed = await showModal({
          title: 'Unsaved Changes',
          message: 'You have unsaved changes. Are you sure you want to leave? Your draft will be saved automatically.',
          confirmText: 'Leave',
          cancelText: 'Stay',
          danger: true
        });
        if (!confirmed) return;
      }
      window.removeEventListener('beforeunload', beforeUnloadHandler);
      stopAutosave();
      const posts = postsCache[blogId] || await getAllPostsForBlog(blogId);
      const drafts = getLocalDrafts(blogId);
      container.innerHTML = renderDashboard(posts, blogSlug, drafts, blogId);
      setupDashboardEvents(container, blogSlug, dbUrl, dbToken, blogId);
    });
  }
  
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const title = titleInput?.value;
      const slug = slugInput?.value;
      const content = getQuillContent();
      const excerpt = excerptInput?.value;
      const category = categoryInput?.value;
      const published = publishedInput?.checked;
      
      if (!title || !slug) {
        showToast('Title and slug are required', 'error');
        return;
      }
      
      setButtonLoading(saveBtn, true);
      stopAutosave();
      window.removeEventListener('beforeunload', beforeUnloadHandler);
      
      try {
        const { createPost, updatePost, getAllPostsForBlog } = window.__lb_db;
        
        const postData = { title, slug, content, excerpt, category, published };
        
        if (postId) {
          await updatePost(blogId, postId, postData);
        } else {
          await createPost(blogId, postData, domain);
        }
        
        localStorage.removeItem(draftKey);
        
        const posts = await getAllPostsForBlog(blogId);
        postsCache[blogId] = posts;
        blogCache[domain] = null;
        const drafts = getLocalDrafts(blogId);
        container.innerHTML = renderDashboard(posts, blogSlug, drafts, blogId);
        setupDashboardEvents(container, blogSlug, dbUrl, dbToken, blogId);
        showToast('Post saved successfully!', 'success');
      } catch (err) {
        showToast(err.message || 'Failed to save post', 'error');
        startAutosave();
        window.addEventListener('beforeunload', beforeUnloadHandler);
      } finally {
        setButtonLoading(saveBtn, false);
      }
    });
  }
  
  if (saveDraftBtn) {
    saveDraftBtn.addEventListener('click', () => {
      const data = {
        title: titleInput?.value || '',
        slug: titleInput?.value || '',
        content: getQuillContent(),
        excerpt: excerptInput?.value || '',
        category: categoryInput?.value || '',
        published: false,
        savedAt: Date.now()
      };
      
      if (!data.title) {
        showToast('Please enter a title', 'error');
        return;
      }
      
      if (!data.slug) {
        data.slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      }
      
      localStorage.setItem(draftKey, JSON.stringify(data));
      savedIndicator.textContent = 'Draft saved';
      savedIndicator.className = 'lb-saving-indicator saved';
      showToast('Draft saved to browser storage', 'success');
      setTimeout(() => {
        savedIndicator.textContent = '';
        savedIndicator.className = 'lb-saving-indicator';
      }, 2000);
    });
  }

  if (isBlogIndex || isBlogPost) {
    console.log('[lb] Initializing blog...');
    return initBlog({ blogPath, dbUrl, dbToken, container });
  }

  if (isAdmin) {
    console.log('[lb] Initializing admin...');
    return initAdminPanel({ adminPath, dbUrl, dbToken, container });
  }

  return null;
}



export function autoInit(options = {}) {
  console.log('[lb] autoInit called', window.location.pathname);
  
  const {
    blogPath = '/blog',
    adminPath = '/admin',
    dbUrl = DEFAULT_DB_URL,
    dbToken = DEFAULT_DB_TOKEN
  } = options;

  // Create fixed background layer that doesn't scroll
  const settings = getSettings();
  const isDark = settings.theme === 'dark';
  const accent = ACCENT_COLORS[settings.accentColor] || ACCENT_COLORS.amber;
  const bgColor = isDark ? '#0f172a' : '#fff';
  
  const bgLayer = document.createElement('div');
  bgLayer.id = 'lb-bg-layer';
  bgLayer.style.cssText = `position:fixed;top:0;left:0;right:0;bottom:0;background:${bgColor};z-index:99999;pointer-events:none;`;
  document.body.appendChild(bgLayer);
  
  const containerId = 'lb-' + Math.random().toString(36).substr(2, 9);
  const container = document.createElement('div');
  container.id = containerId;
  container.style.cssText = `position:fixed;top:0;left:0;right:0;bottom:0;z-index:100000;background:${bgColor};overflow-y:contain;overflow-x:hidden;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;`;
  document.body.appendChild(container);
  console.log('[lb] Created container:', containerId);

  const loadingHTML = LOADING_HTML;

  const path = window.location.pathname;
  const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path;

  console.log('[lb] Path:', path, '| Normalized:', normalizedPath);
  console.log('[lb] BlogPath:', blogPath, '| AdminPath:', adminPath);

  const isBlogIndex = normalizedPath === blogPath;
  const isBlogPost = new RegExp(`^${blogPath}/([^/]+)$`).test(normalizedPath);
  const isAdmin = normalizedPath === adminPath;

  console.log('[lb] isBlogIndex:', isBlogIndex, '| isBlogPost:', isBlogPost, '| isAdmin:', isAdmin);

  if (!isBlogIndex && !isBlogPost && !isAdmin) {
    container.remove();
    console.log('[lb] Not a blog/admin path, skipping');
    return null;
  }

  container.innerHTML = loadingHTML;

  if (isBlogIndex || isBlogPost) {
    console.log('[lb] Initializing blog...');
    return initBlog({ blogPath, dbUrl, dbToken, container });
  }

  if (isAdmin) {
    console.log('[lb] Initializing admin...');
    return initAdminPanel({ adminPath, dbUrl, dbToken, container });
  }

  return null;
}

export { renderLogin, renderDashboard, renderEditor };
export { generateSitemap, generateRssFeed, generateRobotsTxt, injectSitemapLink, injectAlternateLinks, injectCanonicalLink } from './blog/seo.js';
