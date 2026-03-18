const ADMIN_STYLES = `
.lb-admin {
  --lb-primary: #2563eb;
  --lb-primary-hover: #1d4ed8;
  --lb-danger: #dc2626;
  --lb-danger-hover: #b91c1c;
  --lb-success: #16a34a;
  --lb-bg: #fafafa;
  --lb-surface: #ffffff;
  --lb-border: #e5e7eb;
  --lb-text: #111827;
  --lb-text-secondary: #6b7280;
}

.lb-admin * {
  box-sizing: border-box;
}

.lb-admin {
  min-height: 100vh;
  background: var(--lb-bg);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: var(--lb-text);
}

.lb-login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.lb-login-box {
  background: var(--lb-surface);
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 400px;
}

.lb-login-box h1 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 1.5rem;
  text-align: center;
}

.lb-form-group {
  margin-bottom: 1.25rem;
}

.lb-form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: var(--lb-text);
}

.lb-form-group input,
.lb-form-group textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--lb-border);
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.lb-form-group input:focus,
.lb-form-group textarea:focus {
  outline: none;
  border-color: var(--lb-primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.lb-form-group textarea {
  min-height: 400px;
  resize: vertical;
  line-height: 1.6;
}

.lb-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: 0.95rem;
  font-weight: 500;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.lb-btn-primary {
  background: var(--lb-primary);
  color: white;
}

.lb-btn-primary:hover {
  background: var(--lb-primary-hover);
}

.lb-btn-danger {
  background: var(--lb-danger);
  color: white;
}

.lb-btn-danger:hover {
  background: var(--lb-danger-hover);
}

.lb-btn-secondary {
  background: var(--lb-surface);
  color: var(--lb-text);
  border: 1px solid var(--lb-border);
}

.lb-btn-secondary:hover {
  background: var(--lb-bg);
}

.lb-btn-block {
  width: 100%;
}

.lb-error {
  background: #fef2f2;
  color: var(--lb-danger);
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.lb-admin-header {
  background: var(--lb-surface);
  border-bottom: 1px solid var(--lb-border);
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.lb-admin-header h1 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.lb-admin-nav {
  display: flex;
  gap: 0.75rem;
}

.lb-admin-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.lb-post-list {
  background: var(--lb-surface);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  overflow: hidden;
}

.lb-post-list-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--lb-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.lb-post-list-header h2 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

.lb-post-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--lb-border);
  transition: background 0.1s;
}

.lb-post-item:last-child {
  border-bottom: none;
}

.lb-post-item:hover {
  background: var(--lb-bg);
}

.lb-post-info h3 {
  font-size: 1rem;
  font-weight: 500;
  margin: 0 0 0.25rem;
}

.lb-post-info p {
  font-size: 0.8rem;
  color: var(--lb-text-secondary);
  margin: 0;
}

.lb-post-status {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  font-size: 0.7rem;
  font-weight: 500;
  border-radius: 4px;
  text-transform: uppercase;
}

.lb-status-published {
  background: #dcfce7;
  color: #166534;
}

.lb-status-draft {
  background: #f3f4f6;
  color: #6b7280;
}

.lb-post-actions {
  display: flex;
  gap: 0.5rem;
}

.lb-btn-sm {
  padding: 0.4rem 0.75rem;
  font-size: 0.8rem;
}

.lb-editor {
  background: var(--lb-surface);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.lb-editor-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--lb-border);
}

.lb-editor-header h2 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

.lb-editor-body {
  padding: 1.5rem;
}

.lb-editor-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--lb-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.lb-meta-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.lb-checkbox-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.lb-checkbox-group input {
  width: auto;
}

.lb-checkbox-group label {
  margin: 0;
}

.lb-empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--lb-text-secondary);
}

.lb-empty-state p {
  margin: 0 0 1rem;
}
`;

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

class AdminApp {
  constructor() {
    this.config = null;
    this.posts = [];
    this.currentPost = null;
    this.mode = 'list';
  }
  
  init(config) {
    this.config = config;
    injectStyles();
    this.render();
  }
  
  render() {
    const container = document.getElementById('lb-admin-app') || document.body;
    
    if (!this.config) {
      container.innerHTML = this.renderLogin();
      return;
    }
    
    switch (this.mode) {
      case 'list':
        container.innerHTML = this.renderPostList();
        break;
      case 'edit':
      case 'new':
        container.innerHTML = this.renderEditor();
        break;
    }
  }
  
  renderLogin() {
    return `
      <div class="lb-admin">
        <div class="lb-login-container">
          <div class="lb-login-box">
            <h1>Blog Admin</h1>
            <div id="lb-login-error"></div>
            <form id="lb-login-form">
              <div class="lb-form-group">
                <label for="lb-passphrase">Passphrase</label>
                <input type="password" id="lb-passphrase" placeholder="Enter your passphrase" required>
              </div>
              <button type="submit" class="lb-btn lb-btn-primary lb-btn-block">Unlock</button>
            </form>
          </div>
        </div>
      </div>
    `;
  }
  
  renderPostList() {
    return `
      <div class="lb-admin">
        <header class="lb-admin-header">
          <h1>Blog Posts</h1>
          <nav class="lb-admin-nav">
            <button class="lb-btn lb-btn-primary" id="lb-new-post">New Post</button>
            <button class="lb-btn lb-btn-secondary" id="lb-logout">Logout</button>
          </nav>
        </header>
        <main class="lb-admin-content">
          <div class="lb-post-list">
            <div class="lb-post-list-header">
              <h2>All Posts</h2>
              <span>${this.posts.length} posts</span>
            </div>
            ${this.posts.length === 0 ? `
              <div class="lb-empty-state">
                <p>No posts yet. Create your first post!</p>
              </div>
            ` : this.posts.map(post => `
              <div class="lb-post-item" data-slug="${post.slug}">
                <div class="lb-post-info">
                  <h3>${escapeHtml(post.title)}</h3>
                  <p>${new Date(post.createdAt).toLocaleDateString()} · ${post.slug}</p>
                </div>
                <div class="lb-post-actions">
                  <span class="lb-post-status ${post.published ? 'lb-status-published' : 'lb-status-draft'}">
                    ${post.published ? 'Published' : 'Draft'}
                  </span>
                  <button class="lb-btn lb-btn-secondary lb-btn-sm lb-edit-post" data-slug="${post.slug}">Edit</button>
                  <button class="lb-btn lb-btn-danger lb-btn-sm lb-delete-post" data-slug="${post.slug}">Delete</button>
                </div>
              </div>
            `).join('')}
          </div>
        </main>
      </div>
    `;
  }
  
  renderEditor() {
    const post = this.currentPost || {
      title: '',
      slug: '',
      content: '',
      excerpt: '',
      category: '',
      published: false
    };
    
    const isNew = this.mode === 'new';
    
    return `
      <div class="lb-admin">
        <header class="lb-admin-header">
          <h1>${isNew ? 'New Post' : 'Edit Post'}</h1>
          <nav class="lb-admin-nav">
            <button class="lb-btn lb-btn-secondary" id="lb-cancel">Cancel</button>
            <button class="lb-btn lb-btn-primary" id="lb-save">Save</button>
          </nav>
        </header>
        <main class="lb-admin-content">
          <div class="lb-editor">
            <div class="lb-editor-body">
              <div class="lb-form-group">
                <label for="lb-title">Title</label>
                <input type="text" id="lb-title" value="${escapeHtml(post.title)}" placeholder="Post title">
              </div>
              <div class="lb-form-group">
                <label for="lb-slug">Slug</label>
                <input type="text" id="lb-slug" value="${escapeHtml(post.slug)}" placeholder="post-url-slug">
              </div>
              <div class="lb-meta-row">
                <div class="lb-form-group">
                  <label for="lb-category">Category</label>
                  <input type="text" id="lb-category" value="${escapeHtml(post.category || '')}" placeholder="Category">
                </div>
                <div class="lb-form-group lb-checkbox-group">
                  <input type="checkbox" id="lb-published" ${post.published ? 'checked' : ''}>
                  <label for="lb-published">Published</label>
                </div>
              </div>
              <div class="lb-form-group">
                <label for="lb-excerpt">Excerpt</label>
                <input type="text" id="lb-excerpt" value="${escapeHtml(post.excerpt || '')}" placeholder="Brief description">
              </div>
              <div class="lb-form-group">
                <label for="lb-content">Content (Markdown supported)</label>
                <textarea id="lb-content" placeholder="Write your post content here...">${escapeHtml(post.content || '')}</textarea>
              </div>
            </div>
          </div>
        </main>
      </div>
    `;
  }
  
  async loadPosts(onLoadPosts) {
    if (onLoadPosts) {
      this.posts = await onLoadPosts();
    }
    this.render();
  }
  
  setMode(mode, post = null) {
    this.mode = mode;
    this.currentPost = post;
    this.render();
  }
}

function injectStyles() {
  if (document.getElementById('lb-admin-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'lb-admin-styles';
  style.textContent = ADMIN_STYLES;
  document.head.appendChild(style);
}

export function initAdmin(onAuth, onLoadPosts, onSavePost, onDeletePost, onLogout) {
  const app = new AdminApp();
  
  app.init(null);
  
  document.addEventListener('click', async (e) => {
    if (e.target.id === 'lb-new-post' || e.target.closest('#lb-new-post')) {
      app.setMode('new');
    }
    
    if (e.target.classList.contains('lb-edit-post')) {
      const slug = e.target.dataset.slug;
      const post = app.posts.find(p => p.slug === slug);
      if (post) {
        app.setMode('edit', post);
      }
    }
    
    if (e.target.classList.contains('lb-delete-post')) {
      const slug = e.target.dataset.slug;
      if (confirm('Are you sure you want to delete this post?')) {
        await onDeletePost(slug);
        await app.loadPosts(onLoadPosts);
      }
    }
    
    if (e.target.id === 'lb-cancel') {
      app.setMode('list');
    }
    
    if (e.target.id === 'lb-logout') {
      onLogout();
      app.config = null;
      app.mode = 'list';
      app.render();
    }
  });
  
  document.addEventListener('submit', async (e) => {
    if (e.target.id === 'lb-login-form') {
      e.preventDefault();
      const passphrase = document.getElementById('lb-passphrase').value;
      
      try {
        const config = await onAuth(passphrase);
        app.config = config;
        await app.loadPosts(onLoadPosts);
      } catch (err) {
        document.getElementById('lb-login-error').innerHTML = `
          <div class="lb-error">Invalid passphrase</div>
        `;
      }
    }
    
    if (e.target.closest('.lb-editor')) {
      e.preventDefault();
      
      const title = document.getElementById('lb-title').value;
      const slug = document.getElementById('lb-slug').value;
      const content = document.getElementById('lb-content').value;
      const excerpt = document.getElementById('lb-excerpt').value;
      const category = document.getElementById('lb-category').value;
      const published = document.getElementById('lb-published').checked;
      
      const post = {
        title,
      };
      
      if (!slug && title) {
        post.slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      } else {
        post.slug = slug;
      }
      
      post.content = content;
      post.excerpt = excerpt;
      post.category = category;
      post.published = published;
      
      if (app.currentPost && app.currentPost.slug) {
        post.createdAt = app.currentPost.createdAt;
      }
      
      await onSavePost(post);
      await app.loadPosts(onLoadPosts);
      app.setMode('list');
    }
  });
  
  document.getElementById('lb-title')?.addEventListener('input', (e) => {
    const slugInput = document.getElementById('lb-slug');
    if (!slugInput.dataset.userModified) {
      slugInput.value = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
  });
  
  document.getElementById('lb-slug')?.addEventListener('input', (e) => {
    e.target.dataset.userModified = 'true';
  });
  
  document.getElementById('lb-save')?.addEventListener('click', (e) => {
    const form = document.createElement('form');
    document.body.appendChild(form);
    form.dispatchEvent(new Event('submit', { bubbles: true }));
    form.remove();
  });
  
  return app;
}

export { ADMIN_STYLES };
