# 🌊 케이웨이브 미션 (K-Wave Mission) 웹사이트 프로젝트

> **"대한민국을 한류라는 문화의 힘을 통해 세계선교를 위해 사용하고 계십니다."** 
> 본 프로젝트는 인도네시아 현지 대학교 내 한국센터 설립 및 고등교육선교를 추진하는 **케이웨이브 미션(K-Wave Mission)**의 공식 미니멀리즘 웹플랫폼 구축 프로젝트입니다.

---

## 📌 Executive Summary

* **타겟 아디언스**: 다음 세대, 크리스천 청년 및 대학생, 해외선교 지도자 및 후원 동역자
* **웹사이트 지향점**: 데이터베이스(DB)와 회원가입/신청서 폼을 배제한 **순수 정보 제공형 Static Web Site**
* **핵심 커뮤니케이션**: 카카오톡 오픈프로필/채널 및 이메일 연동 중심의 1:1 direct 연결
* **기술 스택**: HTML5, Tailwind CSS, Pure JavaScript, Markdown (Static Content Storage)
* **AI 개발 생태계**: Google AI Ecosystem (Gemini, Antigravity) + VS Code / GitHub

---

## 🎯 1. 전략적 프로젝트 컨셉 & 비전

### 1.1 핵심 가치 및 패러다임 Shift
기존의 소극적·무거운 선교 프레임을 벗어나 **'왕의 물결(King's Wave / Kingdom's Wave / Korean Wave)'**이라는 트렌디하고 역동적인 브랜드 정체성을 전달합니다.

* **가르치시고 (Teaching First)**: 한국어/한국문화 교육을 통한 인격적 관계 형성
* **삶을 변화시키시고 (Life Transformation)**: 지식 전달을 넘어선 청년들의 비전과 삶의 궤적 전환
* **제자로 만드심 (Disciple Making)**: 현지 대학교 센터를 기반으로 한 신앙 공동체 세우기

### 1.2 왜 Google AI 생태계인가?
1. **단일 진실 공급원 (SSOT / Grounding)**: NotebookLM 기반의 문서 100% 반영으로 환각(Hallucination) 없는 개발 환경 구축.
2. **비용 제로 & 초고속 퍼포먼스**: Firebase, Supabase 등 백엔드 DB 비용을 전면 축소하여 LCP(Lightest Contentful Paint) 1.0초 미만의 초경량 라이브 웹 구현.
3. **지속 가능한 유지보수**: Markdown 파일 수정 및 Git Commit만으로 매주 선교 소식이 즉각 업데이트되는 Zero-DB 구조 달성.

---

## 📐 2. 사이트 맵 (Site Structure)

전체 사이트는 단일 페이지 접근성(Single Page Experience)과 세부 마이크로 페이지를 조합한 **최적의 Minimal UX**를 제공합니다.
```yaml
/
├── [01. Home] ------------- (/index.html)
│    ├── Hero Section (비전 선언문 & K-Wave 로고 브랜드)
│    ├── 주요 사역 3대 축 (영혼 구원 / 교회 세움 / 세상 변화)
│    └── 최신 선교 소식 피드 (Markdown Auto-Renderer)
│
├── [02. About Us] --------- (/about/index.html)
│    ├── 케이웨이브 미션의 시작 (2011 인도네시아 사역 개척)
│    ├── 우리의 고백과 선언 (개혁주의 기독교 세계관, 사도신경)
│    └── 선교 정신 4대 가치 (개척·도전, 자주·능동, 창의·혁신, 전적 헌신)
│
├── [03. Ministries] ------- (/ministries/index.html)
│    ├── 현지 대학 한국센터 설립 & 운영 (26개 대학교 네트워크)
│    ├── 발리 타문화권 선교학교 (Workshop & Camp & Deep Mission)
│    ├── 한국어 강사 / 센터장 파견 사업
│    └── 은혜로운 한국생활 한국에서 10일 살기
│
├── [04. News & Blog] ------ (/news/index.html)
│    ├── 매주 발행되는 인도네시아 현지 선교 소식
│    └── /posts/*.md 기반의 자동 인덱싱 게시판
│
└── [05. Partner & Contact] - (/partner/index.html)
├── 국내 협력교회 & 기관 (전국대학교수선교연합회 등)
├── 동역/후원 안내 (기도, 장학금, 오지교회, 재정후원)
└── Direct Connect Button (카카오톡: kwavemission / 이메일: admin@kwavemission.org)
```

---

## 🎨 3. Design Constitution (디자인 헌법)

### 3.1 Color Palette
* **Primary (King's Wave Blue)**: `#1E293B` (깊은 사명감과 신뢰의 테일러드 딥 뷰티)
* **Accent (Sunset Coral)**: `#F43F5E` (열정과 한류의 생동감을 담은 포인트 컬러)
* **Secondary (Pure White & Slate)**: `#FAFAFA` / `#F1F5F9` (여백의 미를 살린 미니멀 배경)
* **Text Main**: `#0F172A` (가독성을 최우선한 고대비 컬러)

### 3.2 Typography & UI Components
* **Font Family**: `Pretendard`, sans-serif (가장 깔끔하고 현대적인 가독성 제공)
* **Border Radius**: `rounded-2xl` (부드럽고 포용성 있는 카드 레이아웃)
* **Shadow**: `shadow-sm` ~ `shadow-md` (과도한 입체감을 배제한 서브틀 미니멀리즘)
* **Micro Interactions**: Smooth Hover Scale (`transition-transform duration-300 hover:-translate-y-1`)

---

## ⚡ 4. Technical Architecture (Zero-DB Static Stack)
```yuaml
[Markdown Posts (/posts/*.md)]
│
▼
[JavaScript Fetcher (app.js)] ──(Front-matter Parsing)──► [Tailwind UI Cards Render]
│
▼
[GitHub Pages / Vercel Host] ◄────────────────────────── [Direct Kakao/Email Action]
```

### 4.1 데이터베이스 없는 주간 선교 게시판 구현 기법
1. `/posts/2026-08-01-mission-news.md` 형태로 마크다운 파일 저장.
2. 마크다운 상단에 YAML Front-matter 삽입:
   ```yaml
   ---
   title: "2026년 8월 1주차 발리 한국센터 소식"
   date: "2026-08-01"
   author: "박기홍 대표 선교사"
   category: "한국센터"
   thumbnail: "/assets/images/news-thumb-01.jpg"
   ---
프론트엔드 Pure JS가 index.json 또는 폴더 목록을 fetch()하여 카드형 UI로 변환 렌더링.

🔮 5. AI Engineering Guidelines (Vibe Prompt & System Instructions)
5.1 System Instruction (AI 코딩 전문가/아키텍트 페르소나)
Plaintext
You are the Lead Front-end Architect specializing in Minimalist Static Web Design.
Your objective is to build a high-performance, responsive, zero-database website for 'K-Wave Mission'.

[Strict Constraints]
1. DO NOT use any backend framework, Supabase, Firebase, or SQL databases.
2. Use ONLY HTML5, Tailwind CSS (via CDN or Build), Vanilla JavaScript, and Markdown files.
3. Every call-to-action (CTA) button must direct users to KakaoTalk (ID: koreancenter) or Email (mrpark@kwavemission.org).
4. Maintain strict adherence to the Design Constitution: Primary #1E293B, Accent #F43F5E, Font 'Pretendard'.
5. Optimize all images for WebP format and guarantee LCP < 1.2s.
5.2 Antigravity & VS Code Vibe Prompt
Plaintext
Build a minimal, highly aesthetic homepage for K-Wave Mission using HTML, Tailwind CSS, and JS.
- Clean typography with large whitespace and rounded-2xl cards.
- Hero section featuring the tagline: "대한민국을 한류라는 문화의 힘을 통해 세계선교를 위해 사용하고 계십니다."
- Add three core mission pillars: 영혼을 구하는 일, 교회를 세우는 일, 세상을 바꾸는 일.
- Implement a client-side Markdown reader that fetches local .md files from /posts directory to display weekly mission news dynamically without any backend.
- Ensure all interactive elements trigger direct KakaoTalk or Email actions.
🛠️ 6. Performance & Quality Control (Negative Constraints)
⛔ No Heavy External Libraries: React, Vue 등 무거운 SPA 프레임워크 배제 (Vanilla JS로 초경량화).

⛔ No Database Calls: 모든 서버 요청 차단. 보안 위험성 0%.

⛔ No Cluttered UI: 한 화면에 3가지 이상의 폰트 Mix 금지. 원색의 자극적인 배경 사용 절대 금지.

✅ Direct Communication: 문의 폼 대신 즉시 열리는 카카오톡 일대일 상담 링크 배치.

📞 7. Contact & Headquarters
단체명: 케이웨이브 미션 (K-WAVE MISSION)

대표자: 박기홍 대표 선교사
이메일: admin@kwavemission.org
카카오톡 ID: kwavemission

한국 본부: 070-7781-2585
현지 본부: 인도네시아 
