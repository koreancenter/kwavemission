import express from 'express';
import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

// 1. Environment configuration
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

const envVars = {
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@kwavemission.org',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || '680923',
  JWT_SECRET: process.env.JWT_SECRET || 'kwave-mission-secure-jwt-secret-key-2026!',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  OLLAMA_URL: process.env.OLLAMA_URL || '',
  OLLAMA_MODEL: process.env.OLLAMA_MODEL || ''
};

// 2. Database Initialization
const dbPath = path.join(process.cwd(), 'kwave.db');
const db = new Database(dbPath);

// Execute schema
const schemaPath = path.join(process.cwd(), 'docs', 'schema.sql');
if (fs.existsSync(schemaPath)) {
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schemaSql);
} else {
  db.exec(`
    CREATE TABLE IF NOT EXISTS programs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'active',
      icon TEXT DEFAULT '🎓',
      is_recommended INTEGER DEFAULT 0,
      display_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT DEFAULT 'news',
      title TEXT NOT NULL,
      content TEXT,
      thumbnail_url TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// Migration check for missing columns in existing database
try {
  db.exec("ALTER TABLE programs ADD COLUMN is_recommended INTEGER DEFAULT 0;");
} catch (e) {
  // Column already exists
}

// Seed initial data if database is empty
const programCount = db.prepare("SELECT COUNT(*) as c FROM programs WHERE status != 'deleted'").get().c;
if (programCount === 0) {
  const insertProg = db.prepare(`
    INSERT INTO programs (slug, category, title, description, status, icon, is_recommended, display_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertProg.run(
    "indonesia-10-days",
    "문화 교류",
    "인도네시아 10일 살기",
    "인도네시아 현지 대학 및 단체와 연계하여 진행되는 10일간의 한국 문화/언어 교류 프로그램입니다.",
    "recruiting",
    "🌏",
    1,
    1
  );
  insertProg.run(
    "korean-class-volunteers",
    "교육 선교",
    "한국어 교실 봉사단",
    "현지 대학생 및 청소년을 위한 온라인/오프라인 한국어 교육 프로그램 봉사자 모집.",
    "recruiting",
    "🎓",
    0,
    2
  );
  insertProg.run(
    "kwave-culture-camp",
    "청소년 캠프",
    "K-WAVE 문화 캠프",
    "K-POP, K-뷰티, 한국 전통문화를 매개로 현지 청소년들과 소통하는 문화 사역 캠프.",
    "ongoing",
    "🎵",
    0,
    3
  );
}

const postCount = db.prepare("SELECT COUNT(*) as c FROM posts WHERE status != 'deleted'").get().c;
if (postCount === 0) {
  const insertPost = db.prepare(`
    INSERT INTO posts (type, title, content, thumbnail_url, status)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertPost.run(
    "notice",
    "2026년 하반기 인도네시아 문화교류 단원 모집 공지",
    "안녕하세요. 케이웨이브 미션입니다.\n\n2026년 하반기 인도네시아 현지 문화교류 프로그램 참가를 희망하시는 단원분들을 모집합니다.\n\n**모집 기간**: 2026년 9월 1일 ~ 9월 30일\n**대상**: K-WAVE 선교 사역에 열정을 가진 누구나\n**문의**: admin@kwavemission.org",
    "./assets/images/indonesia-landscape.jpg",
    "active"
  );
  insertPost.run(
    "news",
    "2026 상반기 인도네시아 현지 한국학 문화 교류 사역 리포트",
    "## 2026 상반기 인도네시아 현지 한국학 문화 교류 현장 기록\n\n이번 상반기 진행된 인도네시아 현지 교류 사역을 통해 많은 청년들과 깊은 교제를 나누었습니다.\n\n### 주요 성과\n- 현지 학생 120명 대상 한국어/한국문화 강좌 진행\n- 문화 축제를 통한 복음 전도 및 협력 교개 마련",
    "./assets/images/indonesia-landscape2.jpg",
    "active"
  );
}

// 3. Cloudflare D1 & R2 Emulation Wrappers
class D1Wrapper {
  constructor(database) {
    this.db = database;
  }

  prepare(sql) {
    const database = this.db;
    return {
      _sql: sql,
      _args: [],
      bind(...args) {
        this._args = args;
        return this;
      },
      async first() {
        const stmt = database.prepare(this._sql);
        const row = stmt.get(...this._args);
        return row || null;
      },
      async all() {
        const stmt = database.prepare(this._sql);
        const results = stmt.all(...this._args);
        return { results: results || [] };
      },
      async run() {
        const stmt = database.prepare(this._sql);
        const info = stmt.run(...this._args);
        return { success: true, meta: info };
      }
    };
  }

  async batch(statements) {
    const results = [];
    const transaction = this.db.transaction((stmts) => {
      for (const stmtObj of stmts) {
        const stmt = this.db.prepare(stmtObj._sql);
        results.push(stmt.run(...stmtObj._args));
      }
    });
    transaction(statements);
    return results;
  }
}

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

class R2Wrapper {
  constructor(dir) {
    this.dir = dir;
  }

  async get(key) {
    const cleanKey = key.replace(/^images\//, '');
    const filePath = path.join(this.dir, cleanKey);
    if (!fs.existsSync(filePath)) return null;

    const stats = fs.statSync(filePath);
    const buffer = fs.readFileSync(filePath);

    return {
      body: buffer,
      httpEtag: `"${stats.mtimeMs}"`,
      writeHttpMetadata(headers) {
        if (cleanKey.endsWith('.jpg') || cleanKey.endsWith('.jpeg')) headers.set('Content-Type', 'image/jpeg');
        else if (cleanKey.endsWith('.png')) headers.set('Content-Type', 'image/png');
        else if (cleanKey.endsWith('.webp')) headers.set('Content-Type', 'image/webp');
        else if (cleanKey.endsWith('.gif')) headers.set('Content-Type', 'image/gif');
        else if (cleanKey.endsWith('.svg')) headers.set('Content-Type', 'image/svg+xml');
        else headers.set('Content-Type', 'application/octet-stream');
      }
    };
  }

  async put(key, body, options) {
    const cleanKey = key.replace(/^images\//, '');
    const filePath = path.join(this.dir, cleanKey);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, Buffer.from(body));
    return { key };
  }
}

const cloudflareEnv = {
  ...envVars,
  DB: new D1Wrapper(db),
  BUCKET: new R2Wrapper(uploadDir)
};

// 4. Load API Function Modules
const apiModules = {};

const apiFiles = [
  'login',
  'logout',
  'refresh',
  'get-posts',
  'write-post',
  'update-post',
  'delete-post',
  'get-programs',
  'write-program',
  'delete-program',
  'get-dashboard-stats',
  'get-md',
  'generate-ai'
];

for (const name of apiFiles) {
  const modPath = `./functions/api/${name}.js`;
  apiModules[name] = await import(modPath);
}
apiModules['image'] = await import('./functions/api/image/[[path]].js');

// 5. Express Application
const app = express();

// Parse raw body for Web Fetch Request conversion
app.use(express.raw({ type: '*/*', limit: '50mb' }));

// Helper to adapt Express Request/Response to Cloudflare Pages Functions
async function handleCloudflareRoute(req, res, handlerModule, params = {}) {
  try {
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:3000';
    const fullUrl = `${protocol}://${host}${req.originalUrl}`;

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) {
        if (Array.isArray(value)) {
          value.forEach(v => headers.append(key, v));
        } else {
          headers.set(key, value);
        }
      }
    }

    let body = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body && Buffer.isBuffer(req.body) && req.body.length > 0) {
      body = req.body;
    }

    const fetchReq = new Request(fullUrl, {
      method: req.method,
      headers,
      body
    });

    const context = {
      request: fetchReq,
      env: cloudflareEnv,
      params
    };

    const methodUpper = req.method.toUpperCase();
    const handler = handlerModule[`onRequest${methodUpper.charAt(0) + methodUpper.slice(1).toLowerCase()}`]
                 || handlerModule.onRequest;

    if (!handler) {
      return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    const cfResponse = await handler(context);

    res.status(cfResponse.status);
    for (const [k, v] of cfResponse.headers.entries()) {
      if (k.toLowerCase() === 'set-cookie') {
        const cookies = v.split(/,\s*(?=[a-zA-Z0-9_]+=)/);
        cookies.forEach(c => res.append('Set-Cookie', c));
      } else {
        res.setHeader(k, v);
      }
    }

    const arrayBuffer = await cfResponse.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
}

// Wire API Routes
for (const name of apiFiles) {
  app.all(`/api/${name}`, (req, res) => handleCloudflareRoute(req, res, apiModules[name]));
}

// Special route for image handler: /api/image/*
app.all('/api/image/*', (req, res) => {
  const imagePath = req.params[0] || '';
  const pathParts = imagePath.split('/').filter(Boolean);
  return handleCloudflareRoute(req, res, apiModules['image'], { path: pathParts });
});

// Serve static assets with optimized Cache-Control headers
app.use('/assets', express.static(path.join(process.cwd(), 'assets'), {
  maxAge: '1y',
  immutable: true,
  etag: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
  maxAge: '30d',
  etag: true,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=2592000');
  }
}));

app.use(express.static(process.cwd(), {
  maxAge: '1d',
  etag: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    }
  }
}));

// Page Fallbacks
app.get('/admin', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  res.sendFile(path.join(process.cwd(), 'admin.html'));
});

app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  res.sendFile(path.join(process.cwd(), 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`K-WAVE MISSION server listening on http://${HOST}:${PORT}`);
});
