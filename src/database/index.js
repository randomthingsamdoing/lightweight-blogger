let dbUrl = null;
let dbToken = null;
let tablesEnsured = false;

function convertToHttpUrl(libsqlUrl) {
  if (libsqlUrl.startsWith('libsql://')) {
    return libsqlUrl.replace('libsql://', 'https://');
  }
  return libsqlUrl;
}

export function initDatabase(config) {
  const { dbUrl: url, dbToken: token } = config;
  dbUrl = convertToHttpUrl(url);
  dbToken = token;
  return true;
}

export function getClient() {
  return { url: dbUrl, token: dbToken };
}

function convertArg(arg) {
  if (arg === null || arg === undefined) {
    return { type: 'null', value: null };
  }
  if (typeof arg === 'number') {
    return Number.isInteger(arg) ? { type: 'integer', value: String(arg) } : { type: 'float', value: String(arg) };
  }
  if (typeof arg === 'boolean') {
    return { type: 'integer', value: arg ? '1' : '0' };
  }
  return { type: 'text', value: String(arg) };
}

function extractColumnNames(sql) {
  const match = sql.match(/^SELECT\s+(.+?)\s+FROM/i);
  if (!match) return null;
  if (match[1].trim() === '*') {
    return null;
  }
  return match[1].split(',').map(c => c.trim().split(/\s+AS\s+/i).pop());
}

function parseRow(row, columns) {
  if (!columns) return row;
  const obj = {};
  columns.forEach((col, i) => {
    const cell = row[i];
    obj[col] = cell?.value ?? cell;
  });
  return obj;
}

async function execute(sql, args = []) {
  if (!dbUrl || !dbToken) {
    throw new Error('Database not initialized');
  }

  const formattedArgs = args.map(convertArg);

  const requestBody = {
    requests: [
      {
        type: 'execute',
        stmt: {
          sql: sql,
          args: formattedArgs
        }
      },
      { type: 'close' }
    ]
  };

  const response = await fetch(`${dbUrl}/v2/pipeline`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${dbToken}`
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Database error: ${response.status} - ${error}`);
  }

  const result = await response.json();
  
  const responseResult = result.results?.[0]?.response?.result;
  const columns = responseResult?.cols || [];
  const rows = responseResult?.rows || [];
  
  const parsedRows = rows.map(row => {
    const obj = {};
    columns.forEach((col, i) => {
      const cell = row[i];
      obj[col.name] = cell?.value ?? cell;
    });
    return obj;
  });
  
  return {
    rows: parsedRows,
    lastInsertRowid: responseResult?.last_insert_rowid,
    rowsAffected: responseResult?.affected_row_count || 0
  };
}

export async function ensureTables() {
  if (tablesEnsured) return;
  tablesEnsured = true;
  
  await execute(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      blog_title TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  await execute(`ALTER TABLE accounts ADD COLUMN blog_title TEXT DEFAULT ''`);
  
  await execute(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      domain TEXT NOT NULL,
      slug TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      excerpt TEXT DEFAULT '',
      category TEXT DEFAULT '',
      published INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id),
      UNIQUE(account_id, slug)
    )
  `);
}

export async function createBlog(username, passwordHash, blogTitle = '') {
  const result = await execute(
    'INSERT INTO accounts (username, password_hash, blog_title) VALUES (?, ?, ?)',
    [username, passwordHash, blogTitle]
  );
  return { id: result.lastInsertRowid, username, blog_title: blogTitle };
}

export async function getBlogBySlug(username) {
  const result = await execute('SELECT id, username, password_hash, blog_title, created_at FROM accounts WHERE username = ?', [username]);
  return result.rows[0] || null;
}

export async function getBlogById(id) {
  const result = await execute('SELECT id, username, password_hash, blog_title, created_at FROM accounts WHERE id = ?', [id]);
  return result.rows[0] || null;
}

export async function createPost(blogId, post, domain) {
  const { slug, title, content, excerpt, category, published } = post;
  
  const result = await execute(
    `INSERT INTO posts (account_id, domain, slug, title, content, excerpt, category, published) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [blogId, domain, slug, title, content || '', excerpt || '', category || '', published ? 1 : 0]
  );
  
  return { id: result.lastInsertRowid, ...post };
}

export async function updatePost(blogId, postId, post) {
  const { slug, title, content, excerpt, category, published } = post;
  
  await execute(
    `UPDATE posts 
     SET slug = ?, title = ?, content = ?, excerpt = ?, category = ?, published = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND account_id = ?`,
    [slug, title, content || '', excerpt || '', category || '', published ? 1 : 0, postId, blogId]
  );
  
  return { id: postId, ...post };
}

export async function deletePost(blogId, postId) {
  await execute('DELETE FROM posts WHERE id = ? AND account_id = ?', [postId, blogId]);
}

export async function getPostByDomainAndSlug(domain, slug) {
  const result = await execute('SELECT id, account_id, domain, slug, title, content, excerpt, category, published, created_at, updated_at FROM posts WHERE domain = ? AND slug = ?', [domain, slug]);
  return result.rows[0] || null;
}

export async function getPostsByDomain(domain, options = {}) {
  let sql = 'SELECT id, account_id, domain, slug, title, content, excerpt, category, published, created_at, updated_at FROM posts WHERE domain = ?';
  const args = [domain];
  
  if (options.published !== undefined) {
    sql += ' AND published = ?';
    args.push(options.published ? 1 : 0);
  }
  
  sql += ' ORDER BY created_at DESC';
  
  if (options.limit !== undefined) {
    sql += ' LIMIT ?';
    args.push(options.limit);
    if (options.offset !== undefined) {
      sql += ' OFFSET ?';
      args.push(options.offset);
    }
  }
  
  const result = await execute(sql, args);
  return result.rows;
}

export async function getPostsByAccountId(accountId, options = {}) {
  let sql = 'SELECT id, account_id, domain, slug, title, content, excerpt, category, published, created_at, updated_at FROM posts WHERE account_id = ?';
  const args = [accountId];
  
  if (options.published !== undefined) {
    sql += ' AND published = ?';
    args.push(options.published ? 1 : 0);
  }
  
  sql += ' ORDER BY created_at DESC';
  
  const result = await execute(sql, args);
  return result.rows;
}

export async function getPublishedPostsForBlog(blogId) {
  return getPostsByDomain(blogId, { published: true });
}

export async function getAllPostsForBlog(blogId) {
  return getPostsByAccountId(blogId, {});
}

export async function getBlogByDomain(domain) {
  const result = await execute(
    `SELECT a.id, a.username, a.password_hash, a.blog_title, a.created_at 
     FROM accounts a 
     INNER JOIN posts p ON a.id = p.account_id 
     WHERE p.domain = ? 
     LIMIT 1`,
    [domain]
  );
  return result.rows[0] || null;
}

export async function getPost(blogId, slug) {
  const result = await execute('SELECT id, account_id, domain, slug, title, content, excerpt, category, published, created_at, updated_at FROM posts WHERE account_id = ? AND slug = ?', [blogId, slug]);
  return result.rows[0] || null;
}
