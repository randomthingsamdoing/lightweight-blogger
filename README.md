# Lightweight Blogger

A lightweight, plug-and-play blogging system for static websites. Uses Turso (libSQL) as the database for efficient multi-tenant hosting.

## Features

- **Zero server required** - Works with static hosting (Netlify, Vercel, GitHub Pages, etc.)
- **Multi-tenant** - Multiple blogs share one database, filtered by domain
- **Admin dashboard** - Write, edit, publish, and manage blog posts
- **Rich text editor** - Full WYSIWYG editing with Quill
- **Auto-save drafts** - Drafts saved to localStorage every 30 seconds
- **Pagination** - URL-based pagination (`/blog/page/2/`)
- **Framework agnostic** - Works with any frontend framework

## Installation

```bash
npm install lightweight-blogger
```

## Quick Setup

### 1. Add to Your HTML

```html
<div id="app"></div>

<script type="module">
  import { autoInit } from 'lightweight-blogger';
  autoInit();
</script>
```

### 2. That's It!

- Visit `/admin` to create your blog and first post
- Visit `/blog` to see your published posts

## Configuration

Default options:

| Option | Default | Description |
|--------|---------|-------------|
| `blogPath` | `/blog` | URL path for blog listing |
| `adminPath` | `/admin` | URL path for admin dashboard |
| `containerId` | `app` | ID of the container element |
| `replaceContent` | `true` | Replace container content |
| `postsPerPage` | `10` | Posts per page in listing |
| `cacheTtl` | `300000` | Cache duration (5 min default) |
| `dbUrl` | package default | Turso database URL |
| `dbToken` | package default | Turso auth token |

### Custom Configuration

```javascript
import { autoInit } from 'lightweight-blogger';

autoInit({
  blogPath: '/posts',
  adminPath: '/manage',
  postsPerPage: 5,
  cacheTtl: 60000 // 1 minute
});
```

### Using Custom Turso Database

```javascript
import { autoInit } from 'lightweight-blogger';

autoInit({
  dbUrl: 'libsql://your-database.turso.io',
  dbToken: 'your-auth-token'
});
```

## Usage

### Blog Paths

| Path | Description |
|------|-------------|
| `/blog` | Blog listing (paginated) |
| `/blog/page/2/` | Second page of posts |
| `/blog/your-post-slug` | Individual post |
| `/admin` | Admin dashboard |

### Individual Function Imports

```javascript
import { initBlog, initAdminPanel } from 'lightweight-blogger';

// Initialize blog views
initBlog({
  blogPath: '/blog',
  postsPerPage: 10
});

// Initialize admin panel
initAdminPanel({
  adminPath: '/admin'
});
```

## Blog Post Structure

Posts are stored in your Turso database with these fields:

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Auto-incremented ID |
| `blog_id` | integer | Foreign key to blog |
| `slug` | text | URL-friendly identifier |
| `title` | text | Post title |
| `content` | text | HTML content from editor |
| `excerpt` | text | Short preview text |
| `category` | text | Optional category |
| `published` | boolean | Published status |
| `domain` | text | Domain for filtering |
| `created_at` | timestamp | Creation time |
| `updated_at` | timestamp | Last update time |

## Multi-Tenant Architecture

Each blog is identified by:
1. **Domain** - Automatically detected from `window.location.hostname`
2. **Slug** - Unique identifier chosen during setup

This allows multiple websites to share the same database while keeping data isolated. Each page load requires only 1 database query to fetch the correct posts.

## Security

- Passwords hashed with PBKDF2 + SHA-256
- Tokens expire and need refreshing (handled automatically)
- Credentials stored encrypted in database

## Dependencies

This package uses:
- [Quill](https://quilljs.com/) - Rich text editor (loaded from CDN)
- [Turso](https://turso.tech/) - Serverless SQLite database

## License

MIT
