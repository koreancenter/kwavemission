# [DESIGN CONSTITUTION] K-Wave Mission Web System

본 문서는 K-Wave Mission 웹 플랫폼의 시각적 완성도, 사용자 경험, 엔지니어링 표준을 규정하는 절대 원칙이다. 모든 UI/UX 리팩토링 및 신규 컴포넌트 개발은 본 헌법의 조항을 엄격히 준수해야 한다.

---

### 제1장. 핵심 철학 및 시각적 정체성 (Core Identity)

1. **감성적 몰입과 영적 무게감 (Cinematic & Sacred Gravity)**
* 공공기관 브로슈어나 학술 보고서 형태의 무미건조한 텍스트 나열을 영구히 금지한다.
* 선교 현장의 인격적 온기(아이들, 현지 교회, 파견자)를 첫 화면부터 시각적으로 체감할 수 있도록 미디어(Hero 비주얼, 현장 이미지)를 전면에 배치한다.

2. **폐쇄적 모달 지양 (No Hidden Stories)**
* 단체의 핵심 가치와 현장 스토리를 작은 버튼 뒤의 모달(Modal) 팝업에 격리하지 않는다. 벤토 그리드(Bento Grid) 및 스토리텔링 카드 형태로 본문에 직접 통합한다.

3. **명확한 시각적 앵커 (Visual Anchor)**
* 한 화면 내에서 사용자의 시선이 머물러야 할 핵심 요소(Hero Head, Primary CTA, Impact Metrics)는 반드시 명도와 크기 대비를 통해 1초 내에 인지되도록 설계한다.


---

### 제2장. 컬러 및 명도 체계 (Color Tokens)

배경과 텍스트의 명도 대비(Contrast Ratio)는 WCAG AA 규격을 준수하며, 밋밋함을 유발하는 저대비 배색을 철저히 배제한다.

| 역할 | Tailwind Token | Hex / 값 | 사용 규칙 |
| --- | --- | --- | --- |
| **Canvas (기본 배경)** | `bg-[#F4F1EA]` | `#F4F1EA` | 플랫폼 고유의 따뜻하고 차분한 페이퍼 톤 유지 |
| **Surface (카드/패널)** | `bg-white` or `bg-white/80 backdrop-blur` | `#FFFFFF` | 캔버스와 명확히 분리되는 순백색 또는 블러 표면 |
| **Primary Text (기본 본문)** | `text-stone-900` | `#1C1917` | 먹물처럼 단단하고 가독성 높은 잉크 블랙 |
| **Muted Text (보조 정보)** | `text-stone-500` | `#78716C` | 캡션, 영문 카테고리, 성경 구절 출처 등 |
| **Brand Accent (포인트)** | `amber-500` ~ `amber-600` | `#F59E0B` ~ `#D97706` | Primary 버튼, 비전 강조, 배지 등 시선 집중용 |
| **Dark Contrast (반전 배경)** | `bg-slate-950` / `bg-stone-900` | `#020617` / `#1C1917` | K-Drawer 패널, Invest CTA 배너 등 피날레 영역 |
| **Border / Divider (경계선)** | `border-stone-200/80` | `rgba(231,229,228,0.8)` | 면을 가르는 딱딱한 실선 대신 은은한 경계감만 부여 |

---

### 제3장. 타이포그래피 위계 (Typography Hierarchy)

본문 전체에 명조 볼드를 일괄 적용하는 오류를 배제하고, 품격과 가독성을 이원화한다.

1. **헤드라인 (Title & Display)**
* 서체: 품격 있는 세리프(Serif) 계열 (예: *Noto Serif KR, Pretendard Serif, Playfair*)
* 용도: 히어로 헤드카피, 각 섹션 대제목(`h1`, `h2`), 성경 인용구
* 원칙: 자간(`tracking-tight`)을 좁히고 행간을 여유 있게 설계하여 클래식한 권위를 부여한다.


2. **본문 및 UI 텍스트 (Body, Labels, Metrics)**
* 서체: 명료한 산세리프(Sans-serif) 계열 (예: *Pretendard, Inter*)
* 용도: 카드 본문, 버튼 라벨, 네비게이션, 인포그래픽 수치(`295+`, `19+`, `63+`), 계좌번호
* 원칙: 일반 본문에 무분별한 `font-bold` 남용을 금지하며 `font-normal` 및 `font-medium`으로 텍스트 피로도를 낮춘다.


3. **마이크로 카테고리 (Category Eyebrow)**
* 대문자 영문 + 볼드 + 넓은 자간(`text-[10px] tracking-widest font-mono font-bold uppercase`) 공식을 엄격히 적용한다.

---

### 제4장. 컴포넌트 설계 표준 (Component Standards)

1. **CTA 버튼 (Call to Action)**
* **Primary Action:** 고대비 솔리드 배경(`bg-amber-500` or `bg-slate-900 text-white`) + 라운드(`rounded-xl`) + 호버 시 미세 리프트(`hover:-translate-y-0.5 transition-transform`).
* **Secondary Action:** 고스트 버튼(`border border-stone-400/40 hover:bg-black/5`).
* 배경과 구분이 안 되는 옅은 회색 버튼 배치는 엄격히 금지한다.


2. **카드 및 컨테이너 (Cards)**
* 모서리 곡률: `rounded-2xl` 또는 `rounded-3xl`을 적용해 현대적인 앱 터치감을 확보한다.
* 그림자 및 보더: 과도한 드롭 섀도우를 지양하고 미세한 보더(`border border-stone-200/70`)와 부드러운 앰비언트 섀도우(`shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300`)를 결합한다.


3. **K-Drawer (Brand DNA)**
* 핸들과 패널은 `absolute -right-11`로 물리적 일체형으로 결합한다.
* 트리거(핸들)에는 반드시 시각적 피포드(K 로고 + 점자 그립 + 방향 지시 화살표)를 부여한다.
* 활성화 시 화면 전고(`h-full min-h-screen`)를 차지하며, 배경 딤드(`backdrop-blur-[2px] bg-black/40`)를 동반해야 한다.


4. **전환 및 후원 (Conversion)**
* 계좌번호는 반드시 **원클릭 복사 버튼**과 피드백 토스트가 수반되어야 한다.
* 단순 회색 박스를 금지하고 다크 모드 풀 와이드 배너를 채택하여 페이지의 완결성을 부여한다.

---

### 제5장. 엔지니어링 및 성능 원칙 (Engineering & Performance)

1. **Lighthouse 95+ 점수 방어**
* 무거운 서드파티 UI/애니메이션 라이브러리(Framer Motion, Swiper 등 대용량 번들) 도입을 전면 배제한다.
* 모든 트랜지션과 모션은 순수 Tailwind 클래스 및 CSS GPU 가속 속성(`transform`, `opacity`)으로 구현한다.


2. **반응형 및 모바일 우선**
* 터치 디바이스 기준 터치 타깃 크기(최소 44x44px)를 보장한다.
* 모바일 스와이프 제스처(`touchstart`, `touchend`)는 스크롤 간섭 없이 좌우 45px 임계값을 기준으로 정밀하게 작동해야 한다.


3. **Edge 친화성**
* Cloudflare Pages 및 Workers 정적 서빙 환경에 최적화된 Vanilla JS 로직을 유지하며, 런타임 에러가 없는 순수 DOM 조작 방식을 고수한다.

