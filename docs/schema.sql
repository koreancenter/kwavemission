-- 1. 프로그램 마크다운 및 상태 관리 테이블
CREATE TABLE IF NOT EXISTS programs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,          -- URL 파라미터 (예: notice-main, k-pop)
    title TEXT NOT NULL,                -- 프로그램/공지 제목
    category TEXT,                      -- 카테고리 (K-WAVE, NOTICE 등)
    description TEXT,                   -- 본문 마크다운 내용
    status TEXT DEFAULT 'active',       -- active, hidden, deleted
    display_order INTEGER DEFAULT 0     -- 정렬 순서
);

-- 2. 게시글(소식/공지) 관리 테이블
CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT DEFAULT 'news',           -- news, notice 등
    title TEXT NOT NULL,                -- 게시글 제목
    content TEXT,                       -- 게시글 본문
    thumbnail_url TEXT,                 -- 썸네일 이미지 URL
    status TEXT DEFAULT 'active',       -- active, hidden, deleted
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP -- 작성일시
);
