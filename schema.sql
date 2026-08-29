-- K-Wave Mission Database Schema

-- 1. 프로그램 관리 테이블
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

-- 2. 게시글(소식/공지) 관리 테이블
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT DEFAULT 'news',
  title TEXT NOT NULL,
  content TEXT,
  thumbnail_url TEXT,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. 비공개 보안 공문(Official Letters) 전용 DB 테이블
CREATE TABLE IF NOT EXISTS official_letters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  doc_no TEXT UNIQUE NOT NULL,       -- 문서번호 (예: KWM-2026-0801호)
  receiver TEXT NOT NULL,            -- 수신 (예: 00교회 담임목사 및 선교담당자 귀하)
  sender TEXT DEFAULT 'K-Wave Mission 대표회장', -- 발신
  title TEXT NOT NULL,               -- 공문 제목
  content TEXT NOT NULL,             -- 공문 본문 내용 (HTML 또는 Text)
  attachment_url TEXT,               -- 첨부파일 다운로드 URL (옵션)
  attachment_name TEXT,              -- 첨부파일 원본 이름 (옵션)
  secret_token TEXT UNIQUE NOT NULL, -- 무작위 난수 보안 토큰 (URL 접근용)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
