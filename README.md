# Lightweight Blogger

A lightweight, plug-and-play blogging system for static websites. Uses Turso (libSQL) as the database for efficient multi-tenant hosting. Built-in SEO optimization for Google rankings.

## Features

- **Zero server required** - Works with static hosting (Netlify, Vercel, GitHub Pages, etc.)
- **Multi-tenant** - Multiple blogs share one database, filtered by domain
- **Admin dashboard** - Write, edit, publish, and manage blog posts
- **Rich text editor** - Full WYSIWYG editing with Quill
- **Auto-save drafts** - Drafts saved to localStorage every 30 seconds
- **SEO optimized** - Meta tags, Open Graph, Twitter Cards, JSON-LD, sitemap, RSS
- **Framework agnostic** - Works with any frontend framework

## Installation

```bash
npm install lightweight-blogger
```

## Quick Setup

### Add to Your HTML

```html
<script type="module">
  import { autoInit } from 'lightweight-blogger';
  autoInit();
</script>
```

That's it! The package automatically creates the container and handles everything else.

### 2. Create Your Blog

- Visit `/admin` to create your blog and first post
- Visit `/blog` to see your published posts

## Configuration

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

## SEO Features

### Automatic SEO (Built-in)

Every blog page automatically includes:

**Meta Tags:**
- Dynamic `<title>` with "Post Title | Blog Name" format
- Meta description from post excerpt
- Canonical URL to prevent duplicate content

**Open Graph Tags** (for Facebook/LinkedIn sharing):
- `og:title`, `og:description`, `og:url`
- `og:type`, `og:site_name`, `og:image`

**Twitter Cards:**
- `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`

**Structured Data** (JSON-LD Schema.org BlogPosting):
```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Post Title",
  "description": "Post excerpt",
  "datePublished": "2024-01-15T10:30:00.000Z",
  "author": { "@type": "Person", "name": "..." },
  "publisher": { "@type": "Organization", "name": "..." }
}
```

**Semantic HTML:**
- `<article itemscope itemtype="https://schema.org/BlogPosting">`
- `<time itemprop="datePublished" datetime="...">`
- `<meta itemprop="description">`

### Generate Sitemap & RSS (CLI)

For full SEO, generate sitemap.xml and feed.xml at build time:

```bash
npx lightweight-blogger generate \
  --site-url https://yoursite.com \
  --domain yoursite.com \
  --blog-title "My Blog" \
  --blog-description "Thoughts on tech" \
  --output-dir ./public/blog
```

This creates:
- `public/blog/sitemap.xml` - XML sitemap for Google
- `public/blog/feed.xml` - RSS feed for subscribers
- `public/robots.txt` - Crawler instructions

Add to your build script in `package.json`:
```json
{
  "scripts": {
    "build": "vite build && npx lightweight-blogger generate --site-url https://yoursite.com --domain yoursite.com"
  }
}
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
| `excerpt` | text | Short preview text (for SEO) |
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
