# 🌊 K-Wave Mission 플랫폼 구축 사양서 (SPEC.md)

> **"문화의 물결을 넘어, 하나님 나라의 물결로"**
> 본 사양서는 Cloudflare Pages + SQLite D1 데이터베이스와 초정밀 프론트엔드 아키텍처를 연동하여 초고속 퍼포먼스와 실시간 동적 관리자 제어를 완벽히 지원하는 케이웨이브 미션 고품격 공식 웹 플랫폼 구축 사양서입니다.

---

## 📌 1. 시스템 아키텍처 (System Architecture)

K-Wave Mission 플랫폼은 별도의 상시 서버 유지 비용 없이 무제한 트래픽 분산을 지원하고 최고의 로딩 속도를 유지하도록 설계된 **Jamstack 하이브리드 웹 애플리케이션**입니다.

```text
[클라이언트 브라우저 (index.html / admin.html)]
          │                    ▲
   정적 에셋 서빙        REST API 호출
          ▼                    │
┌──────────────────────────────────────────────┐
│       Cloudflare Pages & Workers Edge        │
│  - Functions Routing (functions/api/*)       │
│  - JWT 인증 검증 (_admin-auth.js)              │
└──────────────────────┬───────────────────────┘
                       │
               D1 DB 쿼리 실행
                       ▼
┌──────────────────────────────────────────────┐
│           Cloudflare D1 Database             │
│  - Serverless SQLite                         │
│  - programs & posts 테이블 구조 저장            │
└──────────────────────────────────────────────┘
```

---

## 📌 2. 데이터베이스 스키마 (Database Schema)

### 2.1 `programs` 테이블 (선교 실행 과정 및 모집 현황)

| 컬럼명 | 데이터 타입 | 제약 조건 | 설명 |
| --- | --- | --- | --- |
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | 고유 식별 번호 |
| `slug` | TEXT | UNIQUE, NOT NULL | 마크다운 파일 조회를 위한 영문 식별자 (예: `vivid-camp`) |
| `category` | TEXT | NOT NULL | 과정 대분류 (예: `YOUTH / CAMP`) |
| `title` | TEXT | NOT NULL | 프로그램 제목 |
| `icon` | TEXT | DEFAULT '🎓' | 카드 전면에 표시할 이모지 아이콘 |
| `status` | TEXT | DEFAULT 'recruiting' | 상태 (`recruiting`, `ongoing`, `preparing`, `deleted`) |
| `display_order`| INTEGER | DEFAULT 0 | 노출 정렬 순서 (낮을수록 우선 노출) |
| `description` | TEXT | NOT NULL | 본문/요약 상세 마크다운 텍스트 |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 생성 일시 |

### 2.2 `posts` 테이블 (주간 미션 보도 및 현장 리포트)

| 컬럼명 | 데이터 타입 | 제약 조건 | 설명 |
| --- | --- | --- | --- |
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | 고유 식별 번호 |
| `type` | TEXT | NOT NULL | 글 종류 (`news` 기사문, `notice` 공지사항, `deleted` 삭제) |
| `title` | TEXT | NOT NULL | 보도자료/공지 제목 |
| `content` | TEXT | NOT NULL | Tiptap WYSIWYG 에디터로 작성된 HTML 본문 내용 |
| `thumbnail_url`| TEXT | NULL | 대표 썸네일 이미지 CDN 경로 |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 생성 일시 |

---

## 📌 3. API 명세서 (API Specifications)

### 3.1 `GET /api/get-dashboard-stats` (대시보드 실시간 통계 산출)

* **인증 필요**: `Bearer` 토큰 혹은 `admin_access_token` 쿠키 소유자만 허용
* **응답**:

  ```json
  {
    "success": true,
    "data": {
      "total_posts": 28,
      "total_programs": 6,
      "recruiting_programs": 2,
      "recent_posts_count": 3
    }
  }
  ```

### 3.2 `GET /api/get-programs` (프로그램 목록/단일 조회)

* **쿼리 파라미터**:
  * `id` (선택): 특정 단일 프로그램 쿼리
  * `status` (선택): 특정 상태 필터링 (기본값: 전체 목록)

### 3.3 `GET /api/get-posts` (보도 자료 목록/단일 조회)

* **쿼리 파라미터**:
  * `id` (선택): 특정 단일 기사/공지 상세 조회
  * `type` (선택): `news` 또는 `notice` 필터링

---

## 📌 4. 프론트엔드 비동기 및 렌더링 엔진 (Frontend Logic)

### 4.1 카드 트러스트 프리뷰 로직 (DOMParser Truncation)

프로그램 및 보도 카드가 일관된 크기를 유지하고 UI가 깨지는 것을 방지하기 위해 HTML 태그를 제거하고 일반 텍스트만 추출하는 커스텀 로더가 탑재되었습니다:

* **구현 방식**: `DOMParser`를 사용해 HTML 문자열을 메모리 상에서 가상 렌더링 후 `textContent`를 추출해 일정 글자 수(예: 80자)에서 말줄임 처리합니다.

### 4.2 마크다운 공통 팝업 시스템 (`md-modal`)

* 프로그램 상세 카드에서 "자세히 보기" 클릭 시, `marked.js` 파서를 통해 로컬에 로드된 마크다운을 아름다운 웜 아이보리 테마에 맞춤 렌더링합니다.

---

## 📌 5. AI 보조 글쓰기 엔진 (AI Assistant System)

관리자 글쓰기 편의성을 높이기 위해 4종의 고유 프롬프트가 탑재되어 있습니다:

* **Notice 페르소나 (`persona_notice.md`)**: 은혜롭고 정갈한 교회 주보용/모바일용 공고문 및 정식 공문으로 자동 가공.
* **Reporter 페르소나 (`persona_reporter.md`)**: 현장감이 넘치고 신뢰할 수 있는 보도 리포터 어조로 가공.
* **Letter 페르소나 (`persona_letter.md`)**: 후원 성도 및 교회 대상 영적으로 깊고 따뜻한 편지글 양식으로 변환.
* **News 페르소나 (`persona_news.md`)**: 20년 경력의 편집장 페르소나로 저작권 고지 배너를 포함한 공식 언론 기사로 다듬음.
* **Tiptap 양방향 연동**: AI 연동 시 마크다운 파서가 작동하여, Tiptap WYSIWYG 에디터에 정돈된 HTML을 직접 자동 주입합니다.
