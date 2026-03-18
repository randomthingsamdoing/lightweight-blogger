# Lightweight Blogger

A lightweight, plug-and-play blogging system for web apps with an admin dashboard.

## Features

- **Zero dependencies** - Vanilla JavaScript, framework-agnostic
- **File-based storage** - Posts stored as JSON/Markdown in `.blog/` directory
- **Admin dashboard** - Write, edit, publish, and manage blog posts
- **Passphrase encryption** - Secure credential storage using Web Crypto API
- **Customizable** - Works with any frontend framework
- **AI-ready** - Architecture supports future theme auto-generation

## Installation

```bash
npm install lightweight-blogger
```

## Quick Setup

Run the interactive setup CLI in your project root:

```bash
npx lightweight-blogger setup
```

This will:
1. Ask for your admin passphrase
2. Configure blog title, paths, and description
3. Create the `.blog/` directory with initial config

## Usage

### 1. Set Up the API Server

Create a server file (e.g., `blog-server.js`):

```javascript
import { createBlogServer } from 'lightweight-blogger/server.js';

const app = createBlogServer();
app.listen(3001, () => {
  console.log('Blog API running on http://localhost:3001');
});
```

Or use the built-in Express server:

```bash
node node_modules/lightweight-blogger/server.js
```

### 2. Add Blog to Your Frontend

In your app's main JavaScript:

```javascript
import { initBlog, initAdminPanel } from 'lightweight-blogger';

// Initialize blog (renders on /blog and /blog/:slug)
const initBlogView = initBlog({
  blogPath: '/blog',
  apiUrl: 'http://localhost:3001/api/blog'
});

// Initialize admin (renders on /admin)
const initAdminView = initAdminPanel({
  adminPath: '/admin',
  apiUrl: 'http://localhost:3001/api/blog'
});

// Check current route and initialize
const path = window.location.pathname;

if (path.startsWith('/blog')) {
  initBlogView();
}

if (path.startsWith('/admin')) {
  initAdminView();
}
```

### 3. Create the Blog Container

Add a container element in your HTML:

```html
<div id="lb-app"></div>
```

For admin:

```html
<div id="lb-admin-app"></div>
```

## Configuration

Default configuration:

| Option | Default | Description |
|--------|---------|-------------|
| `blogPath` | `/blog` | URL path for blog listing |
| `adminPath` | `/admin` | URL path for admin dashboard |
| `postsPerPage` | `10` | Posts to show per page |
| `blogTitle` | `My Blog` | Title displayed on blog |

### Updating Config

```javascript
import { updateConfig } from 'lightweight-blogger';

await updateConfig('your-passphrase', {
  blogTitle: 'My Awesome Blog',
  blogDescription: 'Thoughts on tech'
});
```

## Blog Post Structure

Posts are stored in `.blog/posts/` as JSON:

```json
{
  "slug": "my-first-post",
  "title": "My First Post",
  "content": "Post content here...",
  "excerpt": "Brief description",
  "category": "Tech",
  "published": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

## Security

Credentials are encrypted using **AES-GCM** with:
- PBKDF2 key derivation (100,000 iterations)
- Random 16-byte salt per encryption
- Random 12-byte IV per encryption

The plaintext passphrase never touches disk. Only the encrypted blob is stored.

## Future Features (v1.0)

- AI-powered theme auto-generation
- Rich text editor (Tiptap/Quill)
- Categories and tags
- SEO optimization
- RSS feed

## License

MIT
