// Default Turso configuration (for multi-tenant)
const DEFAULT_DB_URL = 'libsql://lightweight-blogger-beta-itobboninja.aws-us-east-2.turso.io';
const DEFAULT_DB_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzM4NTA3MjAsImlkIjoiMDE5Y2ZkYWItMDgwMS03NjdmLWEwMDktZjVjMTM4MDZiNGIxIiwicmlkIjoiZDU5YmUyMDQtNDVhZi00YzBkLTliNTItM2RhMzcwYTZmMTEyIn0.LzJIySkAa-lxnOahmLPVSZ0lHgRf4F6TsKMqoedRjJz-Mo92s-0ro7N6nAxcpG4f-VTyiD6P1WPnTOVpEJo_Bg';

const DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

let dbInitialized = false;
let currentBlog = null;
let sessionData = null;
let postsCache = {};
let blogCache = {}; // { domain: { posts: [], timestamp: Date.now() } }

async function initDatabase(config) {
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
  const { blogPath = '/blog', apiUrl = '/api/blog', dbUrl, dbToken, cacheTtl = DEFAULT_CACHE_TTL, postsPerPage = 10 } = options;
  
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
        renderLoading();
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
      renderBlogListing(mapped, { blogPath, page, postsPerPage, totalPosts, blogTitle });
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
          renderLoading();
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
          }, { blogPath, blogTitle });
        } else {
          renderError('Post not found');
        }
      }
    }
  } catch (err) {
    console.error('Blog init error:', err);
    const { renderError } = await import('./blog/index.js');
    renderError('Failed to load blog');
  }
}

async function initAdminPanel(options = {}) {
  const { adminPath = '/admin', apiUrl = '/api/blog', dbUrl, dbToken } = options;
  
  await initDatabase({ dbUrl, dbToken });
  
  const session = getSession();
  const { getBlogBySlug, createBlog, hashPassword, verifyPassword, getAllPostsForBlog, createPost, updatePost, deletePost } = window.__lb_db;
  
  const container = document.getElementById('app') || document.body;
  
  if (!session) {
    container.innerHTML = renderLogin();
    setupLoginEvents(container, dbUrl, dbToken);
  } else {
    container.innerHTML = renderLoading();
    let posts = postsCache[session.blogId];
    if (!posts) {
      posts = await getAllPostsForBlog(session.blogId);
      postsCache[session.blogId] = posts;
    }
    const drafts = getLocalDrafts(session.blogId);
    container.innerHTML = renderDashboard(posts, session.slug, drafts, session.blogId);
    setupDashboardEvents(container, session.slug, dbUrl, dbToken, session.blogId);
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

const ADMIN_STYLES = `
.lb-admin { --lb-primary: #2563eb; --lb-primary-hover: #1d4ed8; --lb-danger: #dc2626; --lb-success: #16a34a; --lb-bg: #f8fafc; --lb-surface: #ffffff; --lb-border: #e2e8f0; --lb-text: #0f172a; --lb-text-secondary: #64748b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
.lb-admin * { box-sizing: border-box; }
.lb-admin { min-height: 100vh; background: var(--lb-bg); color: var(--lb-text); }
.lb-login-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 2rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.lb-login-box { background: var(--lb-surface); padding: 3rem; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); width: 100%; max-width: 420px; }
.lb-login-box h1 { font-size: 1.75rem; font-weight: 700; margin: 0 0 0.5rem; text-align: center; color: var(--lb-text); }
.lb-login-box .subtitle { text-align: center; color: var(--lb-text-secondary); margin-bottom: 2rem; font-size: 0.95rem; }
.lb-form-group { margin-bottom: 1.25rem; }
.lb-form-group label { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.5rem; color: var(--lb-text); }
.lb-form-group input, .lb-form-group textarea { width: 100%; padding: 0.875rem 1rem; border: 2px solid var(--lb-border); border-radius: 10px; font-size: 1rem; font-family: inherit; transition: all 0.2s; background: var(--lb-surface); }
.lb-form-group input:focus, .lb-form-group textarea:focus { outline: none; border-color: var(--lb-primary); box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
.lb-form-group textarea { min-height: 200px; resize: vertical; line-height: 1.6; }
.lb-btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.875rem 1.5rem; font-size: 1rem; font-weight: 600; border: none; border-radius: 10px; cursor: pointer; transition: all 0.2s; }
.lb-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.lb-btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; width: 100%; }
.lb-btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(102, 126, 234, 0.4); }
.lb-btn-danger { background: var(--lb-danger); color: white; }
.lb-btn-danger:hover:not(:disabled) { background: #b91c1c; }
.lb-btn-secondary { background: var(--lb-surface); color: var(--lb-text); border: 2px solid var(--lb-border); }
.lb-btn-secondary:hover:not(:disabled) { background: var(--lb-bg); }
.lb-btn-ghost { background: transparent; color: var(--lb-text-secondary); border: none; padding: 0.5rem 1rem; }
.lb-btn-ghost:hover { background: var(--lb-bg); }
.lb-btn-block { width: 100%; }
.lb-error { background: #fef2f2; color: var(--lb-danger); padding: 0.875rem 1rem; border-radius: 8px; font-size: 0.875rem; margin-bottom: 1rem; border-left: 4px solid var(--lb-danger); }
.lb-success { background: #f0fdf4; color: var(--lb-success); padding: 0.875rem 1rem; border-radius: 8px; font-size: 0.875rem; margin-bottom: 1rem; border-left: 4px solid var(--lb-success); }
.lb-admin-header { background: var(--lb-surface); border-bottom: 1px solid var(--lb-border); padding: 1rem 1.5rem; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 1px 3px rgba(0,0,0,0.05); flex-wrap: wrap; gap: 1rem; }
.lb-admin-header h1 { font-size: 1.1rem; font-weight: 600; margin: 0; }
.lb-admin-nav { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.lb-admin-content { max-width: 900px; margin: 0 auto; padding: 1.5rem; }
.lb-post-list { background: var(--lb-surface); border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); overflow: hidden; }
.lb-post-list-header { padding: 1rem 1.25rem; border-bottom: 1px solid var(--lb-border); display: flex; align-items: center; justify-content: space-between; background: #f8fafc; flex-wrap: wrap; gap: 0.5rem; }
.lb-post-list-header h2 { font-size: 0.95rem; font-weight: 600; margin: 0; color: var(--lb-text); }
.lb-post-item { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid var(--lb-border); transition: background 0.15s; flex-wrap: wrap; gap: 1rem; }
.lb-post-item:last-child { border-bottom: none; }
.lb-post-item:hover { background: #f8fafc; }
.lb-post-info { flex: 1; min-width: 200px; }
.lb-post-info h3 { font-size: 1rem; font-weight: 600; margin: 0 0 0.25rem; color: var(--lb-text); }
.lb-post-info p { font-size: 0.8rem; color: var(--lb-text-secondary); margin: 0; }
.lb-post-status { display: inline-block; padding: 0.25rem 0.625rem; font-size: 0.7rem; font-weight: 600; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px; }
.lb-status-published { background: #dcfce7; color: #166534; }
.lb-status-draft { background: #f1f5f9; color: #64748b; }
.lb-post-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.lb-btn-sm { padding: 0.5rem 0.75rem; font-size: 0.8rem; border-radius: 8px; }
.lb-editor { background: var(--lb-surface); border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
.lb-editor-header { padding: 1rem 1.25rem; border-bottom: 1px solid var(--lb-border); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; }
.lb-editor-header h2 { font-size: 1rem; font-weight: 600; margin: 0; }
.lb-editor-body { padding: 1.25rem; }
.lb-meta-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.lb-checkbox-group { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem; }
.lb-checkbox-group input { width: auto; }
.lb-checkbox-group label { margin: 0; font-size: 0.9rem; }
.lb-empty-state { text-align: center; padding: 2rem; color: var(--lb-text-secondary); }
.lb-hero { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; text-align: center; border-radius: 16px; margin-bottom: 1.5rem; }
.lb-hero h2 { font-size: 1.25rem; margin: 0 0 0.5rem; }
.lb-hero p { opacity: 0.9; margin: 0; }
.lb-loading { display: flex; align-items: center; justify-content: center; padding: 2rem; color: var(--lb-text-secondary); }
.lb-spinner { width: 40px; height: 40px; border: 3px solid var(--lb-border); border-top-color: var(--lb-primary); border-radius: 50%; animation: lb-spin 1s linear infinite; }
@keyframes lb-spin { to { transform: rotate(360deg); } }
.lb-saving-indicator { display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: var(--lb-text-secondary); }
.lb-saving-indicator.saving { color: #f59e0b; }
.lb-saving-indicator.saved { color: var(--lb-success); }
.switch-link { color: var(--lb-primary); cursor: pointer; text-decoration: none; font-weight: 500; }
.switch-link:hover { text-decoration: underline; }
.lb-quill-editor { background: white; border-radius: 10px; }
.lb-ql-container { border: 2px solid var(--lb-border) !important; border-radius: 0 0 10px 10px !important; }
.lb-ql-toolbar { border-radius: 10px 10px 0 0 !important; border: 2px solid var(--lb-border) !important; border-bottom: none !important; }
.lb-ql-editor { min-height: 200px; font-family: inherit; font-size: 1rem; line-height: 1.6; }
.lb-ql-editor.ql-blank::before { color: var(--lb-text-secondary); font-style: normal; }
.ql-toolbar.ql-snow .ql-picker-label { padding: 2px 6px; }
.ql-snow .ql-tooltip { border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
.ql-snow .ql-tooltip input[type="text"] { border-radius: 4px; border: 1px solid var(--lb-border); padding: 4px 8px; }
.ql-snow .ql-tooltip a { color: var(--lb-primary); }
.lb-modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 1rem; backdrop-filter: blur(4px); }
.lb-modal { background: var(--lb-surface); border-radius: 16px; padding: 1.5rem; max-width: 400px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); animation: lb-modal-in 0.2s ease; }
@keyframes lb-modal-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
.lb-modal h3 { font-size: 1.1rem; font-weight: 600; margin: 0 0 0.75rem; }
.lb-modal p { color: var(--lb-text-secondary); margin: 0 0 1.5rem; font-size: 0.95rem; line-height: 1.5; }
.lb-modal-actions { display: flex; gap: 0.75rem; justify-content: flex-end; }
.lb-toast { position: fixed; bottom: 1.5rem; right: 1.5rem; background: var(--lb-text); color: white; padding: 1rem 1.5rem; border-radius: 10px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); z-index: 10000; animation: lb-toast-in 0.3s ease; font-size: 0.9rem; }
.lb-toast.success { background: var(--lb-success); }
.lb-toast.error { background: var(--lb-danger); }
@keyframes lb-toast-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@media (max-width: 600px) {
  .lb-admin-header { padding: 0.75rem 1rem; }
  .lb-admin-header h1 { font-size: 1rem; }
  .lb-admin-content { padding: 1rem; }
  .lb-meta-row { grid-template-columns: 1fr; }
  .lb-editor-body { padding: 1rem; }
  .lb-post-item { flex-direction: column; align-items: flex-start; }
  .lb-post-actions { width: 100%; justify-content: flex-start; }
  .lb-btn { padding: 0.75rem 1rem; font-size: 0.9rem; }
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
  injectStyles();
  return `
    <div class="lb-admin">
      <div class="lb-loading">
        <div class="lb-spinner"></div>
      </div>
    </div>
  `;
}

function renderDashboard(posts, blogSlug, drafts = [], blogId = null) {
  injectStyles();
  const hasPublishedPosts = posts.some(p => p.published);
  const hasDraftPosts = posts.some(p => !p.published);
  
  return `
    <div class="lb-admin">
      <header class="lb-admin-header">
        <h1>Blog Posts</h1>
        <nav class="lb-admin-nav">
          <button class="lb-btn lb-btn-primary" id="lb-new-post">+ New Post</button>
          <button class="lb-btn lb-btn-secondary" id="lb-logout">Logout</button>
        </nav>
      </header>
      <main class="lb-admin-content">
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
}

export function autoInit(options = {}) {
  const {
    blogPath = '/blog',
    adminPath = '/admin',
    containerId = 'app',
    replaceContent = true,
    dbUrl = DEFAULT_DB_URL,
    dbToken = DEFAULT_DB_TOKEN
  } = options;

  const path = window.location.pathname;
  const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path;

  const isBlogIndex = normalizedPath === blogPath;
  const isBlogPost = new RegExp(`^${blogPath}/([^/]+)$`).test(normalizedPath);
  const isAdmin = normalizedPath === adminPath;

  if (isBlogIndex || isBlogPost) {
    if (replaceContent) {
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = '';
      }
    }
    return initBlog({ blogPath, dbUrl, dbToken });
  }

  if (isAdmin) {
    if (replaceContent) {
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = '';
      }
    }
    return initAdminPanel({ adminPath, dbUrl, dbToken });
  }

  return null;
}

export { renderLogin, renderDashboard, renderEditor };
export { generateSitemap, generateRssFeed, generateRobotsTxt, injectSitemapLink, injectAlternateLinks, injectCanonicalLink } from './blog/seo.js';
