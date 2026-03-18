import { renderBlogListing, renderBlogPost, renderError } from './blog/index.js';
import { initAdmin } from './admin/index.js';
import * as db from './database/index.js';

export {
  renderBlogListing,
  renderBlogPost,
  renderError,
  initAdmin,
  db
};

export function createBlogRouter(options = {}) {
  const {
    blogPath = '/blog',
    adminPath = '/admin'
  } = options;
  
  function getRoute() {
    const path = window.location.pathname;
    
    if (path === blogPath || path === blogPath + '/') {
      return { type: 'blog-index' };
    }
    
    const postMatch = path.match(new RegExp(`^${blogPath}/([^/]+)/?$`));
    if (postMatch) {
      return { type: 'blog-post', slug: postMatch[1] };
    }
    
    if (path === adminPath || path === adminPath + '/') {
      return { type: 'admin' };
    }
    
    return { type: 'not-found' };
  }
  
  return {
    getRoute,
    blogPath,
    adminPath
  };
}

export function initBlog(options = {}) {
  const {
    blogPath = '/blog',
    apiUrl = '/api/blog'
  } = options;
  
  return async function init() {
    const route = getCurrentRoute(blogPath);
    
    if (route.type === 'blog-index') {
      try {
        const posts = await fetchPosts(apiUrl, { published: true });
        renderBlogListing(posts, { blogPath });
      } catch (err) {
        renderError('Failed to load posts');
      }
    }
    
    if (route.type === 'blog-post') {
      try {
        const post = await fetchPost(apiUrl, route.slug);
        if (post) {
          renderBlogPost(post, { blogPath });
        } else {
          renderError('Post not found');
        }
      } catch (err) {
        renderError('Failed to load post');
      }
    }
  };
}

function getCurrentRoute(blogPath) {
  const path = window.location.pathname;
  
  if (path === blogPath || path === blogPath + '/') {
    return { type: 'blog-index' };
  }
  
  const postMatch = path.match(new RegExp(`^${blogPath}/([^/]+)/?$`));
  if (postMatch) {
    return { type: 'blog-post', slug: postMatch[1] };
  }
  
  return { type: 'not-found' };
}

async function fetchPosts(apiUrl, filters = {}) {
  const params = new URLSearchParams(filters);
  const res = await fetch(`${apiUrl}/posts?${params}`);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

async function fetchPost(apiUrl, slug) {
  const res = await fetch(`${apiUrl}/posts/${slug}`);
  if (!res.ok) return null;
  return res.json();
}

export function initAdminPanel(options = {}) {
  const {
    adminPath = '/admin',
    apiUrl = '/api/blog',
    onReady = () => {}
  } = options;
  
  return function init() {
    const path = window.location.pathname;
    
    if (path !== adminPath && path !== adminPath + '/') {
      return;
    }
    
    const app = initAdmin(
      async (passphrase) => {
        const res = await fetch(`${apiUrl}/auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passphrase })
        });
        
        if (!res.ok) {
          throw new Error('Invalid passphrase');
        }
        
        return res.json();
      },
      async () => {
        const res = await fetch(`${apiUrl}/posts`);
        return res.json();
      },
      async (post) => {
        const res = await fetch(`${apiUrl}/posts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(post)
        });
        
        if (!res.ok) {
          throw new Error('Failed to save post');
        }
        
        return res.json();
      },
      async (slug) => {
        const res = await fetch(`${apiUrl}/posts/${slug}`, {
          method: 'DELETE'
        });
        
        if (!res.ok) {
          throw new Error('Failed to delete post');
        }
      },
      () => {
        window.location.href = adminPath;
      }
    );
    
    onReady(app);
  };
}

export function autoInit(options = {}) {
  const { blogPath = '/blog', adminPath = '/admin', apiUrl = '/api/blog' } = options;
  
  const blogInit = initBlog({ blogPath, apiUrl });
  const adminInit = initAdminPanel({ adminPath, apiUrl });
  
  blogInit();
  adminInit();
}

export { initDatabase, ensureTables, createBlog, getBlogBySlug, getBlogById, createPost, updatePost, deletePost, getPost, getPosts, getAllPostsForBlog, getPublishedPostsForBlog } from './database/index.js';
