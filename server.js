import express from 'express';
import compression from 'compression';
import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

// 1. Environment configuration
const PORT = 3000;
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
let db;

function initDatabase() {
  try {
    db = new Database(dbPath);
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
        CREATE TABLE IF NOT EXISTS official_letters (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          doc_no TEXT UNIQUE NOT NULL,
          receiver TEXT NOT NULL,
          sender TEXT DEFAULT 'K-Wave Mission 대표회장',
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          attachment_url TEXT,
          attachment_name TEXT,
          secret_token TEXT UNIQUE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Add columns if they do not exist
      try {
        db.exec("ALTER TABLE official_letters ADD COLUMN attachment_url TEXT");
        db.exec("ALTER TABLE official_letters ADD COLUMN attachment_name TEXT");
      } catch (e) {
        // columns might already exist
      }
    }

    // Ensure official_letters table exists in all database instances
    db.exec(`
      CREATE TABLE IF NOT EXISTS official_letters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        doc_no TEXT UNIQUE NOT NULL,
        receiver TEXT NOT NULL,
        sender TEXT DEFAULT 'K-Wave Mission 대표회장',
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        attachment_url TEXT,
        attachment_name TEXT,
        secret_token TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    try {
      db.exec("ALTER TABLE official_letters ADD COLUMN attachment_url TEXT");
      db.exec("ALTER TABLE official_letters ADD COLUMN attachment_name TEXT");
    } catch (e) {}

    // Seed initial data if database is empty
    const programCount = db.prepare("SELECT COUNT(*) as c FROM programs WHERE status != 'deleted'").get().c;
    if (programCount === 0) {
      const insertProg = db.prepare(`
        INSERT INTO programs (slug, category, title, description, status, icon, display_order)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      insertProg.run(
        "indonesia-10-days",
        "문화 교류",
        "인도네시아 10일 살기",
        "인도네시아 현지 대학 및 단체와 연계하여 진행되는 10일간의 한국 문화/언어 교류 프로그램입니다.",
        "recruiting",
        "🌏",
        1
      );
      insertProg.run(
        "korean-class-volunteers",
        "교육 선교",
        "한국어 교실 봉사단",
        "현지 대학생 및 청소년을 위한 온라인/오프라인 한국어 교육 프로그램 봉사자 모집.",
        "recruiting",
        "🎓",
        2
      );
      insertProg.run(
        "kwave-culture-camp",
        "청소년 캠프",
        "K-WAVE 문화 캠프",
        "K-POP, K-뷰티, 한국 전통문화를 매개로 현지 청소년들과 소통하는 문화 사역 캠프.",
        "ongoing",
        "🎵",
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

    const officialCount = db.prepare("SELECT COUNT(*) as c FROM official_letters").get().c;
    if (officialCount === 0) {
      const insertOfficial = db.prepare(`
        INSERT INTO official_letters (doc_no, receiver, sender, title, content, secret_token)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      insertOfficial.run(
        "KWM-2026-0801호",
        "동역교회 담임목사 및 선교담당 교역자 귀하",
        "케이웨이브 미션 대표선교사",
        "2026년 하반기 K-WAVE 고등교육선교 협력 및 단원 파견의 건",
        `<h3>1. 귀 교회의 부흥과 하나님의 은혜를 기원합니다.</h3>
<p>주님의 지상명령을 받들어 세계 복음화를 위해 헌신하시는 귀 교회와 성도님들 위에 하나님의 크신 평강과 은혜가 늘 충만하시기를 간절히 기도합니다.</p>
<p>사단법인 케이웨이브 미션(K-Wave Mission)은 현대 선교의 핵심 통로인 <strong>'K-Culture & 교육'</strong>을 통해 인도네시아 및 동남아시아 권역의 차세대 청년들에게 복음을 전파하고 그리스도의 제자로 양육하는 고등교육선교 플랫폼입니다.</p>

<h3>2. 협력 제안 및 추진 내용</h3>
<ul>
  <li><strong>선교 현장:</strong> 인도네시아 현지 대학 및 협력 교육기관 한국어/문화 학과</li>
  <li><strong>주요 사역:</strong> 한국어 교육 봉사, K-Culture 캠프, 1:1 멘토링 및 청년 복음화</li>
  <li><strong>단원 파견:</strong> 귀 교회의 헌신된 청년/성도 맞춤형 단기 및 중장기 파견 연계</li>
  <li><strong>지원 체계:</strong> 현지 안전 인프라, 비자/숙소 완비 및 사역 멘토링 전담</li>
</ul>

<h3>3. 요청 사항</h3>
<p>귀 교회 청년 및 성도들이 열방을 품고 선교의 비전을 발견할 수 있도록 본 사역의 안내 및 선교 동역 협약을 정중히 요청드리오니 긍정적인 검토와 기도를 부탁드립니다.</p>

<p><em>※ 첨부: K-Wave Mission 2026 하반기 선교 사역 브로슈어 및 동역 신청서 1부. 끝.</em></p>`,
        "kwm_demo_token_20260828"
      );
    }
  } catch (err) {
    console.error('Database initialization error, recreating database:', err);
    if (fs.existsSync(dbPath)) {
      try {
        fs.unlinkSync(dbPath);
      } catch (e) {
        console.error('Failed to unlink corrupted DB:', e);
      }
    }
    // Retry once
    db = new Database(dbPath);
    const schemaPath = path.join(process.cwd(), 'docs', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
      db.exec(schemaSql);
    }
  }
}

initDatabase();

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
  'generate-ai',
  'official',
  'official-view'
];

for (const name of apiFiles) {
  const modPath = `./functions/api/${name}.js`;
  apiModules[name] = await import(modPath);
}
apiModules['image'] = await import('./functions/api/image/[[path]].js');

// 5. Express Application
const app = express();

// Enable Gzip/Deflate compression for fast network payload transfer
app.use(compression());

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

// Dedicated Official Letters API Routes
app.all('/api/official-view', (req, res) => {
  return handleCloudflareRoute(req, res, apiModules['official-view']);
});
app.all('/api/official/view/:token', (req, res) => {
  return handleCloudflareRoute(req, res, apiModules['official-view'], { token: req.params.token });
});
app.all('/api/official/view', (req, res) => {
  return handleCloudflareRoute(req, res, apiModules['official-view']);
});
app.all('/api/official/:id', (req, res) => {
  return handleCloudflareRoute(req, res, apiModules['official'], { id: req.params.id });
});
app.all('/api/official', (req, res) => {
  return handleCloudflareRoute(req, res, apiModules['official']);
});

// Wire standard API Routes
for (const name of apiFiles) {
  if (name !== 'official' && name !== 'official-view') {
    app.all(`/api/${name}`, (req, res) => handleCloudflareRoute(req, res, apiModules[name]));
  }
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
  maxAge: 0,
  etag: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html') || filePath.endsWith('.js') || filePath.endsWith('.css')) {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    }
  }
}));

// Page Fallbacks
app.get('/robots.txt', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(path.join(process.cwd(), 'robots.txt'));
});

app.get('/admin', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  res.sendFile(path.join(process.cwd(), 'admin.html'));
});

app.get(['/official', '/official.html'], (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  res.sendFile(path.join(process.cwd(), 'official.html'));
});

app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  res.sendFile(path.join(process.cwd(), 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`K-WAVE MISSION server listening on http://${HOST}:${PORT}`);
});
