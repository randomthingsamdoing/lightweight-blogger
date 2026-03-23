// Template builder module using GrapesJS
let editor = null;

// Get user's saved theme from localStorage for preview
function getSavedTheme() {
  try {
    const settings = JSON.parse(localStorage.getItem('lb_settings') || '{}');
    return settings.theme || 'light';
  } catch {
    return 'light';
  }
}

let previewTheme = getSavedTheme(); // Preview theme (separate from UI theme)

// Get preview theme colors
function getPreviewThemeColors(isDark) {
  return {
    bg: isDark ? '#0f172a' : '#ffffff',
    bgSecondary: isDark ? '#1e293b' : '#f8fafc',
    border: isDark ? '#334155' : '#e2e8f0',
    text: isDark ? '#f1f5f9' : '#1e293b',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    accent: isDark ? '#fbbf24' : '#f59e0b'
  };
}

// Get UI theme settings (for the builder UI)
function getUITheme() {
  try {
    const settings = JSON.parse(localStorage.getItem('lb_settings') || '{}');
    return settings.theme || 'light';
  } catch {
    return 'light';
  }
}

function getThemeColors() {
  const isDark = getUITheme() === 'dark';
  return {
    bg: isDark ? '#0f172a' : '#ffffff',
    bgSecondary: isDark ? '#1e293b' : '#f8fafc',
    border: isDark ? '#334155' : '#e2e8f0',
    text: isDark ? '#f1f5f9' : '#1e293b',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    canvas: isDark ? '#0f172a' : '#f8fafc',
    accent: isDark ? '#fbbf24' : '#f59e0b'
  };
}

// Inject theme CSS into the editor iframe
function injectThemeCSS(isDark) {
  const colors = getPreviewThemeColors(isDark);
  
  const themeCSS = `
    .lb-blog-wrap {
      --lb-blog-accent: ${colors.accent} !important;
      --lb-blog-text: ${colors.text} !important;
      --lb-blog-text-secondary: ${colors.textSecondary} !important;
      --lb-blog-border: ${colors.border} !important;
      --lb-blog-bg: ${colors.bg} !important;
      --lb-blog-bg-secondary: ${colors.bgSecondary} !important;
      --lb-blog-surface: ${colors.bg} !important;
      background: ${colors.bg} !important;
      color: ${colors.text} !important;
    }
    .lb-blog-wrap * {
      color: inherit;
    }
    .lb-blog-wrap a { color: ${colors.accent} !important; }
    .lb-blog-wrap .lb-blog-logo { color: ${colors.text} !important; }
    .lb-blog-wrap .lb-blog-logo:hover { color: ${colors.accent} !important; }
    .lb-blog-wrap .lb-blog-back { color: ${colors.textSecondary} !important; }
    .lb-blog-wrap .lb-blog-back:hover { color: ${colors.accent} !important; }
    .lb-blog-wrap .lb-post-hero-title { color: ${colors.text} !important; }
    .lb-blog-wrap .lb-post-hero-meta { color: ${colors.textSecondary} !important; }
    .lb-blog-wrap .lb-post-hero-line { background: ${colors.accent} !important; }
    .lb-blog-wrap .lb-blog-category-badge { background: ${colors.accent} !important; color: #000 !important; }
    .lb-blog-wrap .lb-blog-footer { border-color: ${colors.border} !important; }
    .lb-blog-wrap .lb-blog-footer p { color: ${colors.textSecondary} !important; }
    .lb-blog-wrap .lb-blog-footer a { color: ${colors.accent} !important; }
  `;
  
  return themeCSS;
}

// Update preview theme
function updatePreviewTheme(isDark) {
  if (!editor) return;
  
  // Try multiple approaches to find and update the iframe
  const updateIframe = () => {
    const frame = editor.Canvas.getFrameEl();
    if (!frame) return false;
    
    const doc = frame.contentDocument || frame.contentWindow?.document;
    if (!doc) return false;
    
    const head = doc.head;
    const body = doc.body;
    
    if (!head || !body) return false;
    
    // Remove existing override
    const existing = head.querySelector('#lb-theme-override');
    if (existing) existing.remove();
    
    // Inject new override at the end to ensure highest priority
    const style = doc.createElement('style');
    style.id = 'lb-theme-override';
    style.textContent = injectThemeCSS(isDark);
    head.appendChild(style);
    
    // Also update body background
    body.style.background = isDark ? '#0f172a' : '#ffffff';
    
    return true;
  };
  
  // Try immediately
  if (!updateIframe()) {
    // Retry with exponential backoff
    let attempts = 0;
    const retry = () => {
      attempts++;
      if (updateIframe()) return;
      if (attempts < 10) {
        setTimeout(retry, 100 * attempts);
      }
    };
    setTimeout(retry, 200);
  }
}

// Blog CSS (matches current blog styles exactly from blog/index.js)
const BLOG_TEMPLATE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Serif:ital@0;1&display=swap');

* { box-sizing: border-box; margin: 0; padding: 0; }

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

.lb-blog-wrap h1, .lb-blog-wrap h2, .lb-blog-wrap h3, .lb-blog-wrap h4, .lb-blog-wrap h5, .lb-blog-wrap h6 {
  text-decoration: none;
}

.lb-blog-wrap * { text-decoration: none; }
.lb-blog-wrap a { text-decoration: none; }

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

.lb-blog-logo:hover { color: var(--lb-blog-accent); }

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

.lb-blog-back:hover { color: var(--lb-blog-accent); }
.lb-blog-back svg { width: 16px; height: 16px; }

.lb-post-hero {
  padding: 4rem 0 3rem;
  text-align: center;
  margin-bottom: 2rem;
}

.lb-post-hero .lb-blog-category-badge { margin: 0 auto 1.5rem; }

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

.lb-post-hero-meta span { display: flex; align-items: center; gap: 0.5rem; }
.lb-post-hero-meta svg { width: 16px; height: 16px; opacity: 0.6; }

.lb-post-hero-line {
  width: 60px;
  height: 3px;
  background: var(--lb-blog-accent);
  margin: 2rem auto 0;
  border-radius: 9999px;
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
}

.lb-post-cover {
  max-width: 900px;
  margin: 0 auto 3rem;
  border-radius: 16px;
  overflow: hidden;
  aspect-ratio: 21/9;
  background: linear-gradient(135deg, var(--lb-blog-bg-secondary) 0%, var(--lb-blog-border) 100%);
}

.lb-post-cover img { width: 100%; height: 100%; object-fit: cover; }

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

.lb-post-content > * + * { margin-top: 1.5em; }

.lb-post-content h1, .lb-post-content h2, .lb-post-content h3, .lb-post-content h4 {
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

.lb-post-content p { margin: 0; }

.lb-post-content a {
  color: var(--lb-blog-accent);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.lb-post-content a:hover { text-decoration-thickness: 2px; }
.lb-post-content strong { font-weight: 600; }

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

.lb-post-content pre code { background: none; padding: 0; color: var(--lb-blog-text); font-size: inherit; }

.lb-post-content blockquote {
  border-left: 4px solid var(--lb-blog-accent);
  margin: 2em 0;
  padding: 0.5rem 0 0.5rem 1.5rem;
  font-style: italic;
  color: var(--lb-blog-text-secondary);
  font-size: 1.2rem;
}

.lb-post-content blockquote p { margin: 0; }

.lb-post-content img {
  max-width: 100%;
  height: auto;
  border-radius: 10px;
  margin: 2em 0;
}

.lb-post-content ul, .lb-post-content ol { margin: 1em 0; padding-left: 1.5em; }
.lb-post-content li { margin: 0.5em 0; }
.lb-post-content hr { border: none; height: 1px; background: var(--lb-blog-border); margin: 2.5em 0; }
.lb-post-content .ql-font-serif { font-family: 'DM Serif', Georgia, 'Times New Roman', serif !important; }
.lb-post-content .ql-font-monospace { font-family: 'SF Mono', 'Fira Code', 'Courier New', Courier, monospace !important; }

.lb-blog-footer {
  padding: 3rem 0;
  border-top: 1px solid var(--lb-blog-border);
  margin-top: 4rem;
  text-align: center;
}

.lb-blog-footer p { font-size: 0.875rem; color: var(--lb-blog-text-secondary); margin: 0; }
.lb-blog-footer a { color: var(--lb-blog-accent); text-decoration: none; }
.lb-blog-footer a:hover { text-decoration: underline; }
`;

// Default blocks with visuals
const DEFAULT_BLOCKS = [
  {
    id: 'nav-bar',
    label: 'Navigation',
    category: 'Blog',
    content: '<nav class="lb-blog-nav"><div class="lb-blog-nav-inner"><a href="#" class="lb-blog-logo">Blog Title</a></div></nav>',
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><circle cx="9" cy="15" r="1"/></svg>'
  },
  {
    id: 'post-hero',
    label: 'Post Hero',
    category: 'Blog',
    content: '<header class="lb-post-hero"><span class="lb-blog-category-badge">Category</span><h1 class="lb-post-hero-title">Post Title</h1><div class="lb-post-hero-meta"><span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> March 23, 2026</span></div><div class="lb-post-hero-line"></div></header>',
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>'
  },
  {
    id: 'post-content',
    label: 'Post Content',
    category: 'Blog',
    content: '<article class="lb-post-content-wrap"><div class="lb-post-content" data-lb-element="post-content" itemprop="articleBody"><p>Your post content will appear here.</p></div></article>',
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>'
  },
  {
    id: 'post-cover',
    label: 'Cover Image',
    category: 'Blog',
    content: '<div class="lb-post-cover"><div class="lb-post-cover-placeholder">📷</div></div>',
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>'
  },
  {
    id: 'blog-footer',
    label: 'Footer',
    category: 'Blog',
    content: '<footer class="lb-blog-footer"><p>© 2026 Blog Name</p></footer>',
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="15" x2="21" y2="15"/></svg>'
  },
  {
    id: 'text-block',
    label: 'Text Block',
    category: 'Basic',
    content: '<p class="lb-post-content">Add your text here.</p>',
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>'
  },
  {
    id: 'heading',
    label: 'Heading',
    category: 'Basic',
    content: '<h2 class="lb-post-content" style="font-family: \'DM Serif\', Georgia, serif; font-size: 1.75rem; font-weight: 400;">Your Heading Here</h2>',
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>'
  },
  {
    id: 'image-block',
    label: 'Image',
    category: 'Basic',
    content: '<img src="https://via.placeholder.com/800x400" alt="Image" class="lb-post-content" />',
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>'
  },
  {
    id: 'button',
    label: 'Button',
    category: 'Basic',
    content: '<a href="#" style="display: inline-block; padding: 0.75rem 1.5rem; background: var(--lb-blog-accent, #f59e0b); color: #000; text-decoration: none; border-radius: 6px; font-weight: 500;">Button Text</a>',
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="8" width="18" height="8" rx="4"/></svg>'
  },
  {
    id: 'blockquote',
    label: 'Quote',
    category: 'Basic',
    content: '<blockquote class="lb-post-content">"Your quote text goes here."</blockquote>',
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z"/></svg>'
  },
  {
    id: 'code-block',
    label: 'Code',
    category: 'Basic',
    content: '<pre class="lb-post-content"><code>console.log("Hello, World!");</code></pre>',
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>'
  },
  {
    id: 'divider',
    label: 'Divider',
    category: 'Basic',
    content: '<hr class="lb-post-content" />',
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/></svg>'
  },
  {
    id: 'spacer',
    label: 'Spacer',
    category: 'Basic',
    content: '<div style="height: 3rem;"></div>',
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>'
  },
  {
    id: 'container',
    label: 'Container',
    category: 'Layout',
    content: '<div class="lb-blog-container" style="min-height: 100px; border: 1px dashed var(--lb-blog-border, #e2e8f0); border-radius: 8px; padding: 1rem;"><p style="text-align: center; color: var(--lb-blog-text-secondary, #64748b); font-size: 0.875rem;">Container content</p></div>',
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>'
  },
  {
    id: 'two-columns',
    label: 'Two Columns',
    category: 'Layout',
    content: '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; padding: 2rem 0;"><div style="padding: 1rem; border: 1px dashed var(--lb-blog-border, #e2e8f0); border-radius: 8px; min-height: 80px;">Column 1</div><div style="padding: 1rem; border: 1px dashed var(--lb-blog-border, #e2e8f0); border-radius: 8px; min-height: 80px;">Column 2</div></div>',
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="8" height="18" rx="1"/><rect x="13" y="3" width="8" height="18" rx="1"/></svg>'
  },
  {
    id: 'three-columns',
    label: 'Three Columns',
    category: 'Layout',
    content: '<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.5rem; padding: 2rem 0;"><div style="padding: 1rem; border: 1px dashed var(--lb-blog-border, #e2e8f0); border-radius: 8px; min-height: 80px;">Col 1</div><div style="padding: 1rem; border: 1px dashed var(--lb-blog-border, #e2e8f0); border-radius: 8px; min-height: 80px;">Col 2</div><div style="padding: 1rem; border: 1px dashed var(--lb-blog-border, #e2e8f0); border-radius: 8px; min-height: 80px;">Col 3</div></div>',
    media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="6" height="18" rx="1"/><rect x="9" y="3" width="6" height="18" rx="1"/><rect x="16" y="3" width="6" height="18" rx="1"/></svg>'
  }
];

// Default template (matches current blog UI exactly)
const DEFAULT_TEMPLATE = `
<div class="lb-blog-wrap" style="--lb-blog-accent: #f59e0b; --lb-blog-text: #1e293b; --lb-blog-text-secondary: #64748b; --lb-blog-border: #e2e8f0; --lb-blog-bg: #ffffff; --lb-blog-bg-secondary: #f8fafc; --lb-blog-surface: #ffffff;">
  <nav class="lb-blog-nav">
    <div class="lb-blog-nav-inner">
      <a href="/blog" class="lb-blog-logo">Blog Title</a>
    </div>
  </nav>
  
  <main class="lb-blog-container">
    <a href="/blog" class="lb-blog-back">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
      Back to blog
    </a>
    
    <header class="lb-post-hero">
      <span class="lb-blog-category-badge">Category</span>
      <h1 class="lb-post-hero-title">Your Blog Post Title</h1>
      <div class="lb-post-hero-meta">
        <span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          March 23, 2026
        </span>
      </div>
      <div class="lb-post-hero-line"></div>
    </header>
    
    <div class="lb-post-cover">
      <div class="lb-post-cover-placeholder">📝</div>
    </div>
    
    <article class="lb-post-content-wrap">
      <div class="lb-post-content" data-lb-element="post-content" itemprop="articleBody">
        <p>Your post content will appear here. This is where the rich text editor content is inserted.</p>
        <p>You can customize this template by dragging blocks from the left panel, editing styles, and rearranging elements.</p>
      </div>
    </article>
  </main>
  
  <footer class="lb-blog-footer">
    <p>© 2026 <a href="/">Blog Title</a></p>
  </footer>
</div>
`;

// Initialize editor
export async function initTemplateBuilder(containerEl, options = {}) {
  const { onSave, onReady } = options;
  const colors = getThemeColors();
  
  // Import GrapesJS
  const grapesjs = await import('grapesjs');
  const GJS = grapesjs.default;
  
  // Load GrapesJS CSS
  if (!document.querySelector('link[href*="grapes.min.css"]')) {
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'https://unpkg.com/grapesjs/dist/css/grapes.min.css';
    document.head.appendChild(cssLink);
    await new Promise(resolve => {
      cssLink.onload = resolve;
      setTimeout(resolve, 500);
    });
  }
  
  // Clear container
  containerEl.innerHTML = '';
  
  // Create wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'lb-template-builder';
  wrapper.style.cssText = `display: flex; flex-direction: column; height: 100%; background: ${colors.bg};`;
  
  // Create toolbar
  const toolbar = document.createElement('div');
  toolbar.style.cssText = `display: flex; justify-content: space-between; align-items: center; padding: 0.625rem 1rem; background: ${colors.bg}; border-bottom: 1px solid ${colors.border};`;
  toolbar.innerHTML = `
    <div style="display: flex; align-items: center; gap: 1rem;">
      <span style="font-weight: 600; color: ${colors.text}; font-size: 0.9375rem;">Template Builder</span>
    </div>
    <div style="display: flex; align-items: center; gap: 0.5rem;">
      <select id="lb-device-select" style="padding: 0.375rem 0.75rem; border: 1px solid ${colors.border}; border-radius: 6px; font-size: 0.8125rem; background: ${colors.bg}; color: ${colors.text};">
        <option value="Desktop">Desktop</option>
        <option value="Tablet">Tablet</option>
        <option value="Mobile">Mobile</option>
      </select>
      <button id="lb-theme-toggle" title="Toggle preview theme" style="display: flex; align-items: center; gap: 0.375rem; padding: 0.375rem 0.75rem; border: 1px solid ${colors.border}; border-radius: 6px; background: ${colors.bgSecondary}; color: ${colors.text}; font-size: 0.8125rem; cursor: pointer;">
        <span id="lb-theme-icon">${previewTheme === 'dark' ? '🌙' : '☀️'}</span>
        <span id="lb-theme-label">${previewTheme === 'dark' ? 'Dark' : 'Light'}</span>
      </button>
      <button id="lb-builder-preview" style="padding: 0.375rem 0.75rem; border: 1px solid ${colors.border}; border-radius: 6px; background: ${colors.bgSecondary}; color: ${colors.text}; font-size: 0.8125rem; cursor: pointer;">Preview</button>
      <button id="lb-builder-reset" style="padding: 0.375rem 0.75rem; border: 1px solid ${colors.border}; border-radius: 6px; background: ${colors.bgSecondary}; color: ${colors.text}; font-size: 0.8125rem; cursor: pointer;">Reset</button>
      <button id="lb-builder-save" style="padding: 0.375rem 0.75rem; border: 1px solid #f59e0b; border-radius: 6px; background: #f59e0b; color: #000; font-size: 0.8125rem; font-weight: 500; cursor: pointer;">Save Template</button>
    </div>
  `;
  wrapper.appendChild(toolbar);
  
  // Create main layout
  const layout = document.createElement('div');
  layout.style.cssText = 'display: flex; flex: 1; overflow: hidden;';
  
  // Sidebar for blocks
  const sidebar = document.createElement('div');
  sidebar.className = 'lb-builder-sidebar';
  sidebar.style.cssText = `width: 260px; background: ${colors.bg}; border-right: 1px solid ${colors.border}; overflow-y: auto; flex-shrink: 0;`;
  
  // Blocks header
  const blocksHeader = document.createElement('div');
  blocksHeader.style.cssText = `padding: 0.75rem 1rem; font-size: 0.6875rem; font-weight: 600; color: ${colors.textSecondary}; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid ${colors.border};`;
  blocksHeader.textContent = 'Blocks';
  sidebar.appendChild(blocksHeader);
  
  // Blocks container
  const blocksContainer = document.createElement('div');
  blocksContainer.id = 'gjs-blocks';
  blocksContainer.style.cssText = 'padding: 0.5rem;';
  sidebar.appendChild(blocksContainer);
  layout.appendChild(sidebar);
  
  // Canvas
  const canvas = document.createElement('div');
  canvas.id = 'gjs-editor';
  canvas.style.cssText = 'flex: 1; overflow: hidden;';
  layout.appendChild(canvas);
  
  // Right panel
  const rightPanel = document.createElement('div');
  rightPanel.className = 'lb-builder-right';
  rightPanel.style.cssText = `width: 280px; background: ${colors.bg}; border-left: 1px solid ${colors.border}; overflow-y: auto; flex-shrink: 0;`;
  
  // Style manager
  const stylesHeader = document.createElement('div');
  stylesHeader.style.cssText = `padding: 0.75rem 1rem; font-size: 0.6875rem; font-weight: 600; color: ${colors.textSecondary}; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid ${colors.border};`;
  stylesHeader.textContent = 'Styles';
  rightPanel.appendChild(stylesHeader);
  
  const stylesContainer = document.createElement('div');
  stylesContainer.id = 'gjs-styles';
  stylesContainer.style.cssText = 'padding: 0.5rem;';
  rightPanel.appendChild(stylesContainer);
  
  // Traits
  const traitsHeader = document.createElement('div');
  traitsHeader.style.cssText = `padding: 0.75rem 1rem; font-size: 0.6875rem; font-weight: 600; color: ${colors.textSecondary}; text-transform: uppercase; letter-spacing: 0.05em; border-top: 1px solid ${colors.border}; border-bottom: 1px solid ${colors.border};`;
  traitsHeader.textContent = 'Settings';
  rightPanel.appendChild(traitsHeader);
  
  const traitsContainer = document.createElement('div');
  traitsContainer.id = 'gjs-traits';
  traitsContainer.style.cssText = 'padding: 0.5rem;';
  rightPanel.appendChild(traitsContainer);
  
  layout.appendChild(rightPanel);
  wrapper.appendChild(layout);
  containerEl.appendChild(wrapper);
  
  // Custom CSS for GrapesJS to match UI theme
  const customStyles = document.createElement('style');
  customStyles.id = 'lb-gjs-theme';
  customStyles.textContent = `
    .gjs-cv-canvas { background: ${colors.canvas} !important; }
    .gjs-cv-canvas .gjs-frame { background: ${colors.canvas} !important; }
    .gjs-block {
      background: ${colors.bg} !important;
      border: 1px solid ${colors.border} !important;
      border-radius: 8px !important;
      padding: 0.75rem !important;
      margin: 0.25rem 0 !important;
      cursor: grab !important;
      transition: all 0.2s !important;
      color: ${colors.text} !important;
    }
    .gjs-block:hover {
      border-color: ${colors.accent} !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
    }
    .gjs-block-label {
      font-size: 0.8125rem !important;
      font-weight: 500 !important;
      margin-top: 0.5rem !important;
    }
    .gjs-block-media {
      height: 48px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      margin-bottom: 0.25rem !important;
    }
    .gjs-block-media svg {
      width: 24px !important;
      height: 24px !important;
      stroke: ${colors.textSecondary} !important;
    }
    .gjs-one-bg { background-color: ${colors.bg} !important; }
    .gjs-two-color { color: ${colors.text} !important; }
    .gjs-sm-sector .gjs-sm-title {
      background: ${colors.bgSecondary} !important;
      color: ${colors.text} !important;
      border-bottom: 1px solid ${colors.border} !important;
    }
    .gjs-sm-field { background: ${colors.bg} !important; border-color: ${colors.border} !important; color: ${colors.text} !important; }
    .gjs-sm-label { color: ${colors.textSecondary} !important; }
    .gjs-layer-name { color: ${colors.text} !important; }
    .gjs-layer-vis { color: ${colors.textSecondary} !important; }
    .gjs-trt-trait { color: ${colors.text} !important; }
    .gjs-trt-trait__label { color: ${colors.textSecondary} !important; }
    .gjs-trt-field { background: ${colors.bg} !important; border-color: ${colors.border} !important; color: ${colors.text} !important; }
    .gjs-pn-panels { background: ${colors.bg} !important; }
    .gjs-pn-btn { color: ${colors.text} !important; }
    .gjs-pn-btn:hover { background: ${colors.bgSecondary} !important; }
    .gjs-selected { outline: 2px solid ${colors.accent} !important; outline-offset: 1px; }
    .gjs-category-title { color: ${colors.text} !important; background: ${colors.bgSecondary} !important; }
    .gjs-no-select { user-select: none; }
    .gjs-resizer-h { background: ${colors.accent} !important; }
    .gjs-resizer-v { background: ${colors.accent} !important; }
    .gjs-blocks-c { padding: 0.5rem !important; }
    .gjs-block {
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      min-height: 70px !important;
    }
    .gjs-block-media { min-height: 40px !important; }
    .gjs-blocks-c [data-gjs-name] { font-size: 0.75rem !important; }
  `;
  document.head.appendChild(customStyles);
   
  // Initialize GrapesJS
  editor = GJS.init({
    container: canvas,
    height: '100%',
    width: 'auto',
    fromElement: false,
    showOffsets: true,
    noticeOnUnloadChange: false,
    showDevices: true,
    deviceManager: {
      devices: [
        { name: 'Desktop', width: '' },
        { name: 'Tablet', width: '768px' },
        { name: 'Mobile', width: '375px' }
      ]
    },
    storageManager: { type: null },
    blockManager: {
      appendTo: blocksContainer
    },
    styleManager: {
      appendTo: stylesContainer,
      sectors: [
        {
          name: 'Dimension',
          open: true,
          buildProps: ['width', 'height', 'min-height', 'max-width', 'padding', 'margin']
        },
        {
          name: 'Typography',
          open: false,
          buildProps: ['font-family', 'font-size', 'font-weight', 'line-height', 'color', 'text-align', 'text-decoration']
        },
        {
          name: 'Decorations',
          open: false,
          buildProps: ['background-color', 'background-image', 'border', 'border-radius', 'box-shadow', 'opacity']
        },
        {
          name: 'Extra',
          open: false,
          buildProps: ['overflow', 'display', 'position']
        }
      ]
    },
    traitManager: {
      appendTo: traitsContainer
    },
    panels: { defaults: [] },
    canvas: {
      styles: [],
      background: colors.canvas
    }
  });
  
  // Add blog CSS to editor iframe
  editor.addStyle(BLOG_TEMPLATE_CSS);
  
  // Inject CSS directly into the iframe with retry logic
  const injectCssToIframe = () => {
    const frame = editor.Canvas.getFrameEl();
    if (!frame || !frame.contentDocument) {
      setTimeout(injectCssToIframe, 100);
      return;
    }
    
    try {
      const frameHead = frame.contentDocument.head;
      const frameBody = frame.contentDocument.body;
      
      if (!frameHead) {
        setTimeout(injectCssToIframe, 100);
        return;
      }
      
      // Add Google Fonts
      if (!frameHead.querySelector('link[href*="fonts.googleapis.com"]')) {
        const fontLink = frame.contentDocument.createElement('link');
        fontLink.rel = 'stylesheet';
        fontLink.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Serif:ital@0;1&display=swap';
        frameHead.appendChild(fontLink);
      }
      
      // Add blog styles
      if (!frameHead.querySelector('#lb-blog-template-styles')) {
        const styleEl = frame.contentDocument.createElement('style');
        styleEl.id = 'lb-blog-template-styles';
        styleEl.textContent = BLOG_TEMPLATE_CSS;
        frameHead.appendChild(styleEl);
      }
      
      // Apply initial theme based on saved preference
      updatePreviewTheme(previewTheme === 'dark');
    } catch (e) {
      console.warn('CSS injection retrying:', e);
      setTimeout(injectCssToIframe, 200);
    }
  };
  
  setTimeout(injectCssToIframe, 300);
  
  // Add blocks with media icons
  DEFAULT_BLOCKS.forEach(block => {
    editor.BlockManager.add(block.id, {
      label: block.label,
      category: block.category,
      content: block.content,
      media: block.media,
      attributes: {}
    });
  });
  
  // Set default template
  editor.setComponents(DEFAULT_TEMPLATE);
  
  // Add custom commands
  editor.Commands.add('lb-save-template', {
    run() {
      if (onSave) {
        onSave({
          html: editor.getHtml(),
          css: editor.getCss(),
          components: editor.getComponents().toJSON()
        });
      }
    }
  });
  
  editor.Commands.add('lb-preview-template', {
    run() {
      const html = editor.getHtml();
      const css = editor.getCss();
      const win = window.open('', '_blank', 'width=1200,height=800');
      win.document.write(`<!DOCTYPE html><html><head><style>${BLOG_TEMPLATE_CSS}${css}</style></head><body>${html}</body></html>`);
      win.document.close();
    }
  });
  
  editor.Commands.add('lb-reset-template', {
    run() {
      if (confirm('Reset to default template?')) {
        editor.setComponents(DEFAULT_TEMPLATE);
        editor.setStyle('');
      }
    }
  });
  
  // Button handlers
  document.getElementById('lb-device-select').addEventListener('change', (e) => {
    editor.setDevice(e.target.value);
  });
  
  // Apply initial theme after editor loads
  const applyInitialTheme = () => {
    updatePreviewTheme(previewTheme === 'dark');
  };
  
  setTimeout(applyInitialTheme, 500);
  
  document.getElementById('lb-theme-toggle').addEventListener('click', () => {
    previewTheme = previewTheme === 'light' ? 'dark' : 'light';
    const themeIcon = document.getElementById('lb-theme-icon');
    const themeLabel = document.getElementById('lb-theme-label');
    
    if (previewTheme === 'dark') {
      themeIcon.textContent = '🌙';
      themeLabel.textContent = 'Dark';
    } else {
      themeIcon.textContent = '☀️';
      themeLabel.textContent = 'Light';
    }
    
    updatePreviewTheme(previewTheme === 'dark');
  });
  
  document.getElementById('lb-builder-preview').addEventListener('click', () => {
    editor.runCommand('lb-preview-template');
  });
  
  document.getElementById('lb-builder-reset').addEventListener('click', () => {
    editor.runCommand('lb-reset-template');
  });
  
  document.getElementById('lb-builder-save').addEventListener('click', () => {
    editor.runCommand('lb-save-template');
  });
  
  if (onReady) {
    onReady(editor);
  }
  
  return editor;
}

// Load template from JSON
export function loadTemplate(templateData) {
  if (!editor || !templateData) return;
  
  if (templateData.components) {
    editor.setComponents(templateData.components);
  }
  
  if (templateData.css) {
    editor.setStyle(templateData.css);
  }
}

// Get current template as JSON
export function getTemplateData() {
  if (!editor) return null;
  
  return {
    html: editor.getHtml(),
    css: editor.getCss(),
    components: editor.getComponents().toJSON()
  };
}

// Destroy editor
export function destroyEditor() {
  if (editor) {
    editor.destroy();
    editor = null;
  }
  
  const customStyles = document.getElementById('lb-gjs-theme');
  if (customStyles) {
    customStyles.remove();
  }
}
