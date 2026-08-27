# 🎨 K-Wave Mission Design System (DESIGN.md)

> **K-Wave Mission 공식 디자인 시스템 & 기관 UI 가이드라인**
> 본 문서는 `index.html`, `admin.html`, `assets/css/styles.css`, `assets/css/admin.css`에 실제 구현 및 적용된 디자인 코드와 아키텍처를 기반으로 작성된 공식 디자인 사양서입니다.

---

## 📌 1. Typography & Colors (서체 및 색상 시스템)

K-Wave Mission은 신뢰할 수 있는 학술 연구 기관 및 고등교육선교 얼라이언스의 가치를 시각화하기 위해 **정돈된 따뜻한 에디토리얼 그리드(Warm Editorial Grayscale & Ivory)**를 핵심 톤앤매너로 삼고 있습니다.

### 1.1 Typography (타이포그래피 규칙)

사용자의 시각적 피로를 줄이고 전통 인쇄 매체의 신뢰감을 주기 위해 서체 역할을 정밀하게 분리했습니다.

```css
/* 서체 정의 */
--font-sans: 'Pretendard', -apple-system, sans-serif;
--font-serif: 'Noto Serif KR', serif;
--font-mono: 'JetBrains Mono', monospace;
```

* **Serif (`Noto Serif KR`) - 학술적 권위와 비전**
  * **대상**: `h1`, `h2`, `h3`, `.hero-title`, `.section-title`, `.font-serif`, 모달 제목
  * **스타일**: 부드러운 영적 영감과 정제된 신뢰감을 제공합니다.
* **Sans-Serif (`Pretendard`) - 가독성 중심의 본문**
  * **대상**: `body`, `p`, `li`, `a`, `button`, 에디터 입력창 및 폼 구성요소
  * **스타일**: 가독성을 높이며 자간과 장평을 모던하게 최적화합니다.
* **Monospace (`JetBrains Mono`) - 정확성과 지표**
  * **대상**: `.section-badge`, `.tech-tag`, `.metric-label`, `.font-mono`
  * **스타일**: 데이터 중심의 지표 수치, 카테고리 태그 및 메타데이터 영역에 적용되어 정밀한 느낌을 줍니다.

---

### 1.2 Color Palette (색상 규격)

자연스러운 웜 톤의 대지색과 차분한 그레이스케일을 기본으로 삼고, 관리자 화면에서는 직관적인 제어를 돕기 위해 보조 테마 컬러를 제한적으로 사용합니다.

#### 1) 메인 포털 테마 (Public Portal Palette)

* **기본 배경 (Warm Ivory Earth Base)**: `#ece9e1` (빛을 흡수하여 장시간 열람에도 눈이 편안한 미색 배경)
* **표면 레이어 (Surface Soft & Glass)**: 
  * 투명 레이어: `rgba(255, 255, 255, 0.92)`
  * 네비게이션 유리 가공: `rgba(242, 240, 234, 0.9)` + `backdrop-filter: blur(8px)`
* **핵심 그레이스케일**: 
  * 타이틀 및 강조 텍스트: `#111827` (Slate Dark)
  * 일반 본문 및 정보 텍스트: `#4b5563`
  * 서브 및 안내 텍스트: `#6b7280`
* **브랜드 보더**: `border-black/[0.1331]` (`1.331px` 세밀 보더 규격을 적용하여 가늘고 섬세한 외곽선 표현)

#### 2) 통합 관리자 센터 테마 (Admin Center Palette)

* **관리자 배경**: `#ece9e1` 및 `#f8f6f1` (깔끔하고 대조가 명확한 작업 환경 구성)
* **핵심 강조 포인트 (Amber Accent)**: `#d97706` (비밀번호 확인, 공지 분류 등 주의 및 중요 정보 표시)
* **피드백 상태**:
  * 긍정/저장 완료: `#2563eb` (Blue)
  * 삭제/주의/경고: `#be123c` (Red)

---

## 📌 2. Layout & Components (레이아웃 및 컴포넌트 규격)

### 2.1 Hero Section (히어로 비전 영역)

* **정렬**: 중앙 집중식 단단한 텍스트 배치 및 부드러운 테두리 가공
* **배경 가공**: 반복되는 백그라운드 격자 마스크를 적용하고, 아래쪽 사역 섹션과의 자연스러운 시각적 연결을 위해 상단 75%에서 하단 100%까지 세로 그라데이션 마스크(`-webkit-mask-image`)를 적용했습니다.
* **디자인 요소**:
  * **메인 표제**: 텍스트 그림자 가공(`.hero-title` -> `text-shadow`)을 적용하여 웜 아이보리 배경 위에서도 입체적이고 압도적인 가시성을 부여합니다.
  * **CTA 버튼**: 둥근 모양의 캡슐형(`rounded-full`)에 마우스 호버 시 화살표가 오른쪽 위로 이동하는 마이크로 인터랙션(`transition-transform`)을 적용했습니다.

### 2.2 Markmonitor Style Bento Grid (비대칭 벤토 그리드)

* **배치**: `lg:grid-cols-4` 기반의 4열 그리드 스키마로 모바일에선 1열 자동 전환됩니다.
* **비대칭 비율 설계**:
  * **메인 사역 카드 [01]**: `lg:col-span-2`를 점유하여 전체 사역의 대들보 역할을 하는 시각적 무게중심을 고정합니다.
  * **서브 사역 카드 [02, 03]**: `lg:col-span-1`로 나누어 조화로운 비대칭을 이룹니다.
  * **액션 배너 [04, 05]**: 하단에 각각 `lg:col-span-2` 가로 배너로 나누어 배치하여, 시선의 흐름이 부드럽게 문의 영역으로 향하도록 유도합니다.

### 2.3 Program Cards Slider (사역 프로그램 슬라이더)

* **컴포넌트 구조**: 모바일 환경에서 가로 스크롤 및 터치 스와이프를 지원하는 `flex overflow-x-auto snap-x snap-mandatory` 기반 슬라이더입니다.
* **반응형 넓이**: 모바일 기기에선 `w-[85vw]`로 표시되어 다음 카드의 존재를 은은하게 노출하며, 데스크톱 이상에서는 안정적인 3열 그리드(`md:w-[calc(33.333%-1rem)]`)로 정렬됩니다.
* **상태 배지 가이드**:
  * 모집 중 (`recruiting`): Soft Rose (`rose-500/10`) 보더
  * 진행 중 (`ongoing`): Soft Cyan (`cyan-500/10`) 보더
  * 준비 중 (`preparing`): Soft Grayscale

### 2.4 Post Cards (뉴스 및 소식 카드)

* **뉴스 피처 카드**: `grid-template-columns: 2fr 3fr` 구조의 결합형 레이아웃입니다. 좌측 미디어 이미지 영역에 `grayscale(1) saturate(0.2)` 필터를 적용하여 마우스를 올렸을 때만 생생한 이미지가 서서히 복원되는 에디토리얼적 연출을 구현했습니다.
* **현지의 소리 (Field Voices)**: 인용 마크(Quotation Mark)를 오프셋 레이아웃으로 얹고, 3열 정렬 레이아웃을 통해 모바일 1열 카드뷰로 유연하게 반응합니다.

---

## 📌 3. Card Preview Guidelines (카드 텍스트 요약 규칙)

프로그램 카드나 소식 카드 그리드의 기하학적 균형을 철저하게 수호하기 위해 글자 수 제한 및 마크업 정제 규칙을 실행합니다.

* **HTML 태그 완전 박탈 규칙 (HTML Tag Stripping)**:
  * 본문 데이터에 포함된 `h1`, `p`, `img`, `strong` 등 어떠한 HTML 마크업도 카드 프리뷰에 직접 렌더링되어서는 안 됩니다.
  * `DOMParser` 엔진을 메모리 상에 즉석 구동하여 원본 문자열을 브라우저 텍스트 노드로 치환한 후, 정제된 `textContent`만 파싱합니다.
* **80자 요약 및 말줄임 (80-Character Truncation)**:
  * 정제된 본문의 텍스트 자수가 **80자**를 초과할 경우, 80번째 글자까지만 남기고 뒤를 잘라냅니다.
  * 잘려진 텍스트 끝에는 강제적인 세 줄 말줄임 생략 기호인 `…` (Ellipsis) 문자를 부착하여 추가 콘텐츠가 존재함을 알립니다.
  * 이 규칙은 카드의 본문 프리뷰 영역 높이가 항상 동일하게 유지되도록 강제하는 역할을 합니다.

---

## 📌 4. Modal Styling Standards (모달 스타일링 표준)

K-Wave Mission의 모든 레이어 모달 시스템(`#news-modal`, `#md-modal`, `#legal-modal`, `#previewModal`)은 다음 인터페이스 가이드라인을 완전하게 충족합니다.

* **반투명 차분한 배경 (Transparent Soft Backdrop)**:
  * 불투명한 순색 블랙 대신 `bg-black/70` 또는 `bg-slate-950/80` 레이어를 겹치고 `backdrop-blur-sm` 이상의 가우시안 흐림 효과를 적용하여 뒷배경이 비치게 함으로써 시각적 입체감을 높입니다.
* **스크롤 락 통합 (Scroll Lock State)**:
  * 모달이 실행되는 즉시 `document.body.style.overflow = 'hidden'`을 주입하고 스크롤 소유권(`scrollLockOwners`)을 등록하여 모달 뒤쪽 본문이 무단 스크롤되는 것을 물리적으로 원천 차단합니다.
* **산세리프 가독성 중심 타이포그래피 (Sans-Serif Reading)**:
  * 모달의 상세 본문 텍스트(`.preview-body`, `#modalContent`, `#md-modal-content`) 영역은 학술 논문 및 긴 뉴스 기사를 막힘없이 열람할 수 있도록 세리프가 아닌 **Pretendard (sans-serif) 서체를 기본값**으로 사용합니다.
* **HTML 다이렉트 마크다운 렌더링 (Direct HTML Rendering)**:
  * `marked.js` 파서 또는 Tiptap WYSIWYG 에디터가 최종 컴파일 및 빌드해 낸 마크업 태그가 유실 없이 완벽히 해석되어 스크롤 본문에 그대로 인젝션되어 렌더링됩니다.
