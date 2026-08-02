# 🌊 케이웨이브 미션(K-Wave Mission) 최종 웹사이트 구축 사양서

> **"문화의 물결을 넘어, 하나님 나라의 물결로"**
> 본 사양서는 구글 AI 생태계 및 최신 웹 표준 스택을 활용하여, 백엔드 유지비용 0원과 초고속 퍼포먼스를 달성하는 케이웨이브 미션 공식 high-quality 웹플랫폼 구축 문서입니다.

---

## 📌 1. 웹사이트 전략 마스터 기획서

### 1.1 프로젝트 핵심 요약 (Executive Summary)

* **타겟 유저**: 다음 세대 청년, 크리스천 대학생, 해외 선교 리더 및 동역/후원 파트너
* **사이트 목적**: DB 연동 및 회원가입/신청서 폼을 완전히 배제한 **순수 정보 제공형 경량 정적 웹사이트**[
* **소통 채널**: 1:1 직통 소통 체계 구축 (**카카오톡 ID: `kwavemission`** / **이메일: `admin@kwavemission.org`**)
* **브랜드 정체성**: 지역전문가, 고등교육선교전문가, 한국교회와 선교현장을 잇는 **풀스택(Full-Stack) 선교 플랫폼**
* **디자인 정체성**: Big Tech 수준의 high-qulaity UX, 여백의 미, Pretendard 중심의 명확한 타이포그래피, 절제된 micro-interaction
* **기술 스택**: HTML5, Tailwind CSS, Pure Vanilla JavaScript, Markdown (데이터 저장소 대체)

---

### 1.2 Site Architecture (사이트 맵)

```text
/ (Root)
├── [01. HOME] ------------- (/index.html)
│    ├── Hero Section (비전 선언문 & 슬로건: 풀스택 선교 플랫폼)
│    ├── 3대 핵심 사역 (영혼 구원 / 교회 세움 / 세상 변화)
│    ├── 주간 선교 소식 하이라이트 (Markdown Dynamic Fetch)
│    └── Quick CTA Card Grid (카카오톡 직통 연결)
│
├── [02. ABOUT] ------------ (/about/index.html)
│    ├── 케이웨이브 미션의 시작 (2011 인도네시아 고등교육선교)
│    ├── 우리의 고백과 선언 (개혁주의 기독교 세계관, 사도신경)
│    └── 4대 선교 정신 (전문성과 혁신, 현지화와 주도성, 연결과 확장, 진정성과 헌신)
│
├── [03. MINISTRIES] ------- (/ministries/index.html)
│    ├── 현지 대학 한국센터 설립 & 운영 (26개 대학교 네트워크)
│    ├── 발리 타문화권 선교학교 (Insight Workshop / Camp / Deep Mission)
│    ├── 한국어 강사 / 센터장 파견 사업
│    └── 은혜로운 한국생활 (홈스테이 10일 살기)
│
├── [04. NEWS] ------------- (/news/index.html)
│    ├── 주간 인도네시아 선교 리포트 게시판
│    └── /posts/*.md 기반의 Zero-DB 자동 인덱싱 뷰어
│
└── [05. CONNECT] ---------- (/partner/index.html)
     ├── 국내 협력교회 & 기관 (전국대학교수선교연합회 등)
     ├── 동역 & 재정 후원 안내 (계좌번호 원클릭 복사)
     └── Direct Contact (카카오톡: kwavemission / 이메일: admin@kwavemission.org)
```

---

### 1.3 Design Constitution (디자인 가이드라인)

| 구분 | 규격 및 지정값 | 비고 및 활용법 |
| --- | --- | --- |
| **Primary Color** | Deep Ocean Slate (`#0F172A`) | 메인 텍스트, 헤더, 신뢰감과 무게감 연출 |
| **Accent Color** | K-Wave Sunset Coral (`#FF6B52`) | 브랜드 키 컬러, 주요 CTA 버튼, 강조 포인트 |
| **Background Color** | Warm Soft White (`#FAFAFA`) | 눈의 피로도를 낮추는 고급스러운 백그라운드 |
| **Typography** | `Pretendard`, sans-serif | Font-weight: 800(Heading) / 400~500(Body) |
| **UI Component** | `rounded-2xl`, `shadow-sm` | 과도한 입체감 배제, 부드럽고 포용성 있는 카드 레이아웃 |
| **Animation** | `transition-transform duration-300` | Hover 시 카드 수직 스케일링(`hover:-translate-y-1`) |

---

## 📄 2. AI 개발용 System Instruction (최종)

```markdown
# SYSTEM INSTRUCTION: Lead Frontend Architect Persona

## Persona & Objective
- You are a Lead Frontend Architect specializing in Jamstack, Tailwind CSS, and Vanilla JS.
- Your goal is to build a minimal, high-performance, responsive, zero-database website for 'K-Wave Mission'.
- Position 'K-Wave Mission' as a specialized group of higher education mission experts and a 'Full-Stack Missionary Platform' connecting local campus fields with churches.

## STRICT CONSTRAINTS & RULES

1. ZERO BACKEND & ZERO DATABASE:
   - DO NOT use Firebase, Supabase, Node.js servers, or any SQL/NoSQL database.
   - Use ONLY HTML5, Tailwind CSS, Vanilla JavaScript, and local Markdown (.md) files.

2. COMMUNICATION & CTA CONSTRAINTS:
   - DO NOT build user registration, login, or HTML form submission elements.
   - ALL Call-To-Action (CTA) buttons must trigger direct action:
     - KakaoTalk: Link to KakaoTalk ID 'kwavemission'
     - Email: mailto:admin@kwavemission.org

3. DESIGN CONSTITUTION:
   - Primary Color: #0F172A (Slate)
   - Accent Color: #FF6B52 (Sunset Coral)
   - Background: #FAFAFA (Soft White)
   - Font Family: 'Pretendard', sans-serif
   - UI Layout: Ultra-clean typography, spacious padding, rounded-2xl cards.

4. TECHNICAL PERFORMANCE:
   - Dynamic Weekly News section MUST fetch local Markdown files from `/posts/` directory via JS `fetch()`.
   - Guarantee Largest Contentful Paint (LCP) under 1.2s.
   - All image assets must reference `./assets/images/[file-name]`.
```

---

## ⚡ 3. Antigravity & VS Code Vibe Prompt (최종)

```markdown
Build a minimal, highly aesthetic, zero-DB homepage for 'K-Wave Mission' using pure HTML5, Tailwind CSS, and Vanilla JavaScript.

1. Header & Navigation:
   - Minimal logo text "K-WAVE MISSION".
   - Links: 소개 (About), 사역 (Ministries), 소식 (News), 동역 (Connect).
   - Right Action Button: "카카오톡 1:1 문의" linked directly to KakaoTalk ID 'kwavemission'.

2. Hero Section:
   - Main Tagline: "한류의 물결을 넘어, 하나님 나라의 물결로"
   - Subtitle: "현지 교육 현장과 한국교회를 잇는 풀스택(Full-Stack) 선교 플랫폼. 케이웨이브 미션은 단순한 시혜적 사역을 넘어, 한국학 기반의 고등교육 전문성과 지역 네트워크로 현지 청년 세대를 리더로 세웁니다."
   - Primary CTA: "카카오톡 문의하기" (Target KakaoTalk ID: kwavemission)
   - Secondary CTA: "이메일 문의하기" (mailto:admin@kwavemission.org)

3. Core Pillars Section (3 Cards):
   - Card 1: 영혼을 구하는 일 (한국학·문화 자산을 매개로 한 전문적 관계 개척)
   - Card 2: 교회를 세우는 일 (현지 리더십 양성 및 발리 타문화권 선교학교 운영)
   - Card 3: 세상을 바꾸는 일 (26개 현지 대학 한국센터 네트워크 구축 및 지속 가능한 교육 생태계 조성)

4. Zero-DB Weekly Mission News Section:
   - Implement an asynchronous JavaScript parser fetching `/posts/posts.json` and Markdown files (`/posts/*.md`).
   - Render recent mission news dynamically into stylish `rounded-2xl` cards without any backend database.

5. Footer:
   - Organization: 케이웨이브 미션 (K-WAVE MISSION)
   - Non-Profit Org ID: 106-82-76139
   - Email: admin@kwavemission.org
   - KakaoTalk ID: kwavemission
   - Phone: 070-7781-2585
   - Headquarters: Bali, Indonesia & Republic of Korea
```

---

## 🛠️ 4. 개발 작업 가이드 (Task Checklist)

### Phase 1. 디렉토리 구조 및 기본 시스템 준비

* [x] 프로젝트 폴더 체계 정의 (`index.html`, `/assets`, `/posts`)
* [x] Pretendard 웹폰트 및 Tailwind CSS CDN 환경 구성
* [x] 디자인 토큰 (Primary `#0F172A`, Accent `#FF6B52`) 설정

### Phase 2. Zero-DB 마크다운 블로그 엔진 구현

* [x] Marked.js 파서 라이브러리 연동
* [x] `assets/js/news-loader.js` 구현 (`fetch('/posts/posts.json')` -> `.md` 렌더링)
* [x] `posts/posts.json` 인덱스 구조 설계

### Phase 3. 페이지 레이아웃 구축 & 연락처 통합

* [x] 헤더 및 네비게이션바 (카카오톡 `kwavemission` direct 링크)
* [x] Hero Section 및 3대 사역 카드 그리드 구현
* [x] 주요 참여 프로그램 카드 (한국어 강사, 10일 살기 홈스테이, 발리 워크숍)
* [x] 푸터 영역 대표 연락처 명기 (`admin@kwavemission.org` / Kakao ID: `kwavemission`)

### Phase 4. 최적화 및 배포

* [x] 모바일 반응형 뷰포트 및 버튼 터치 영역(최소 48px) 최적화
* [x] GitHub Pages / Vercel 무료 정적 호스팅 자동 배포 설정

---

## 📂 5. 프로젝트 디렉토리 구조 및 샘플 마크다운 규격

### 5.1 Directory Tree

```text
/project-root
├── index.html              # 메인 랜딩 페이지
├── about.html              # 단체 소개 페이지
├── ministries.html         # 사역 안내 페이지
├── news.html               # 주간 선교 소식 게시판
├── partner.html            # 동역 및 후원 안내 페이지
├── assets/
│   ├── css/
│   │   └── custom.css      # Pretendard 폰트 및 세부 커스텀 스타일
│   └── images/
│   │   ├── news-20260715.jpg  <-- 이미지 파일 저장
│   │   ├── news-20260721.jpg
│   │   └── news-20260729.jpg  <-- 7월 29일 자 썸네일
│   └── js/
│       ├── main.js         # GNB, UI 애니메이션, 계좌 복사 스크립트
│       └── news-loader.js  # Zero-DB 마크다운 파싱 & UI 렌더러
└── posts/
    ├── posts.json          # 소식 목록 메타데이터 (인덱스)
    └── 2026-08-01.md       # 마크다운 포스트 파일
```

---

### 5.2 posts/posts.json (소식 목록 인덱스 예시)

```json
[
  {
    "id": "2026-08-01",
    "title": "2026년 8월 1주차 인도네시아 선교 소식",
    "date": "2026-08-01",
    "author": "박 선교사",
    "category": "선교 소식",
    "thumbnail": "./assets/images/news-thumb-01.jpg",
    "file": "./posts/2026-08-01.md"
  }
]
```

---

### 5.3 posts/2026-08-01.md (샘플 포스트 예시)

```markdown
---
title: "2026년 8월 1주차 인도네시아 선교 소식"
date: "2026-08-01"
author: "박 선교사"
category: "선교 소식"
---

## 하나님 나라를 위한 한류 (King's Wave)

이번 주 인도네시아 현지 대학교에 새로운 **한국센터**가 공식 개설되었습니다. 
현지 청년들과의 인격적 관계 형성을 시작으로 복음이 흘러가는 통로가 되도록 함께 기도해 주시기 바랍니다.

### 주요 기도 제목
1. 현지 한국어 수업을 진행할 단기선교사 강사진의 안전과 성령 충만을 위해
2. 한국센터를 통해 만나는 크리스천 청년들이 제자로 세워지도록

---
* 동역 문의 및 상담: 카카오톡 **kwavemission** / 이메일 **admin@kwavemission.org**
```
