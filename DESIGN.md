# DESIGN.md — K-Wave Mission Brand & UI/UX Design System

## 1. Vision & Brand Philosophy
**K-Wave Mission**은 기존 선교의 동정·구호·원조 패러다임을 탈피하여, 현지 고등교육과 학술 교류, 문화적 전문성을 기반으로 일하는 **‘하나님 나라의 특사(Ambassadors of the Kingdom)’**들의 전문 기관입니다.

본 디자인 시스템은 다음 4가지 핵심 가치를 디자인 언어로 구현합니다:
1. **Professional Intelligence (전문성 & 인텔리전스)**: 불쌍함이 아닌, 탁월함과 학술적 깊이에 기반한 신뢰감 제공.
2. **Kingdom Prestige (하나님 나라의 Dignity)**: 기독교 최고 지성 및 국제 관계 아카이브 수준의 럭셔리하고 묵직한 톤앤매너.
3. **Tech-Forward Minimalist (빅테크 감성)**: OpenAI, Anthropic, Stripe Press 스타일의 세련된 다크 모드, Bento Grid, 섬세한 마이크로 인터랙션.
4. **Frontier Pride (사역자 및 동역자의 자부심)**: “이 사역에 동참하고 싶다”는 열정과 자부심을 불러일으키는 브랜드 비주얼.

---

## 2. Terminology & Brand Language (언어 시스템)
단순한 선교 보고서가 아닌 **글로벌 필드 리서치 & 리포트**의 톤앤매너로 마이크로카피를 재정의합니다.

| 기존 선교 용어 | K-Wave Mission 재정의 용어 | 영어/테크 표기 예시 |
| :--- | :--- | :--- |
| **주간 선교 소식** | **사역 리포트** | `Strategic Briefing` |
| **기도제목 / 후원 요청** | **임팩트 파트너십 / 핵심 과제** | `Invest in Mission` |
| **선교사** | **지역 사역 전문가** | `Regional Specialist` |
| **오늘의 한 장면** | **현장 로그 & 세션** | `Field Log` / `Focus Gallery` |
| **공지사항** | **주요 공지 & 디렉티브** | `Official Directives` |

---

## 3. Visual Identity & Design Tokens

### A. Color Palette (Deep Ocean & Aurora Glow)
빅테크와 고전적 학술 저널이 공존하는 **Deep Dark & Tech Accent** 팔레트를 채택합니다.

* **Primary Background**: `#0b0f19` (Deep Slate / 매트한 딥 네이비-블랙)
* **Card & Surface Background**: `rgba(18, 24, 38, 0.75)` (Glassmorphism 적용)
* **Text Primary**: `#f1f5f9` (Crisp Off-White / 눈이 편안한 밝은 텍스트)
* **Text Secondary**: `#94a3b8` (Muted Slate / 지적인 보조 설명 텍스트)
* **Accent Color**: `#38bdf8` (Aurora Cyan) & `#818cf8` (Indigo Accent)
* **Border & Glass Glow**: `rgba(255, 255, 255, 0.08)` (은은한 오로라 윤곽선)

### B. Typography Hierarchy (지성 & 학술성의 상징)
* **Headline / Section Title (세리프 계열)**: `Noto Serif KR`, `Cormorant Garamond`, serif
  * *목적*: 학술 저널, 글로벌 리서치 기관 특유의 클래식함과 무게감 부여.
* **Body / Paragraph (산세리프 계열)**: `Pretendard`, `Inter`, sans-serif
  * *목적*: 가독성과 모던한 빅테크 플랫폼 감성.
* **Code & Monospace Details (데이터 분석 요소)**: `JetBrains Mono`, `Fira Code`, monospace
  * *예시*: `[ACADEMIC NETWORK]`, `[FIELD_REPORT // 2026-08-09]`

---

## 4. Key UI/UX Layout Components

### A. Hero Section (시네마틱 & 학술 브리핑)
* **3D Background Canvas**: 기존 3D 파도 그래픽에 은은한 오버레이와 앰비언트 글로우 적용.
* **Top Headline**: `Noto Serif KR`을 활용한 강렬하고 지적인 메인 카피.

### B. Interactive Counter Metrics (적용 완료)
* **구성**:
  * `[ACADEMIC NETWORK]` 300+ (동역 대학교수선교사)
  * `[PARTNERSHIP]` 20+ (동역 교회 및 전문 기관)
  * `[HIGHER EDUCATION]` 65+ (현지 고등교육기관)
* **구현 스펙**: Intersection Observer 기반 2초 ease-out 카운팅 스크립트 (`metrics-counter.js`) 및 다크 글래스모피즘 UI.

### C. Bento Grid News & Research Section (도시락통 레이아웃)
기존의 단조로운 1열/3열 동일 카드 배치를 벗어나 **불균형 메인 강조 Bento Grid** 적용:
* **Main Featured Card (2 Column)**: 당월 가장 중요한 대표 학술/교환학생 사역 리포트.
* **Sub Cards (1 Column)**: 개별 현장 인텔리전스 및 필드 로그.

---

## 5. Infrastructure & Database Architecture (Cloudflare Stack)
외부 서비스 의존도를 낮추고 서버리스 비용 및 속도를 극대화하기 위해 **Cloudflare 생태계**로 일원화합니다.

* **Database (SQL)**: **Cloudflare D1** (서버리스 SQLite 데이터베이스)
  * 학술 리포트, 공지사항, 사역 데이터, 사용자 정보 관리.
* **Storage (Assets/Media)**: **Cloudflare R2** (S3 호환 오브젝트 스토리지)
  * 고화질 필드 로그 사진, 리서치 PDF 문서, 썸네일 이미지 보관.
* **API & Compute**: **Cloudflare Workers / Pages Functions**
  * 프론트엔드와 D1/R2 데이터베이스를 안전하게 중계하는 서버리스 API 레이어.

---

## 6. Development Strategy & Roadmap

### Phase 1: Brand & Layout Refinement (진행 중)
* [x] `DESIGN.md` 가이드라인 정립 및 브랜드 아이덴티티 확립
* [x] Google Fonts (`Noto Serif KR`, `JetBrains Mono`) 적용
* [x] **Interactive Metrics 세션 구축 및 스크롤 카운팅 애니메이션 연동**
* [x] 메인 헤드라인 및 세션 제목에 세리프 타이포그래피 적용
* [ x] 마이크로카피 재정의 (`주간 선교 소식` ➔ `Field Intelligence` 등)
* [ ] Bento Grid 기반의 사역 리포트 레이아웃 개편

### Phase 2: Cloudflare D1/R2 Backend Integration
* [x] Cloudflare D1 데이터베이스 및 R2 스토리지 생성 및 바인딩 완료
* [ ] D1/R2 데이터를 불러오는 Worker API 엔드포인트 구축
* [ ] `news-loader.js`를 D1 API 연동 구조로 전환
* [ ] Official Directives (공지사항) 탭 및 띠 배너 UI 연동
