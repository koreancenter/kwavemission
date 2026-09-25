# [ROADMAP] K-WAVE MISSION UI/UX REFACTORING

본 문서는 K-Wave Mission 웹 플랫폼의 시각적 위계 확립, 감성적 몰입도 향상 및 사용자 전환(Conversion) 극대화를 위한 단계별 실행 로드맵이다.  
Cloudflare Pages + D1/R2 정적 인프라 환경에서 **Google Lighthouse 95+ 점수를 방어**하면서 최신 글로벌 트렌드를 구현하는 것을 목표로 한다.

---

## 📌 실행 요약 (Executive Summary)

* **Phase 1 (Critical Quick-Win):** 즉각적인 첫인상 및 인터랙션 버그 픽스 (Hero Section & K-Drawer)
* **Phase 2 (Content & Visual Overhaul):** 갇혀있던 현장 사진 전면 개방 및 벤토 그리드화 (Bento Grid & Media Card)
* **Phase 3 (Conversion & Social Proof):** 신뢰도 구축 및 최종 액션 유도 완성 (Field Voice, Alliance, CTA Banner)
* **Phase 4 (Micro-Interactions & Optimization):** 성능 방어 및 인터랙티브 디테일 마감 (Scroll Motion, A11y, QA)

---

## 🚀 Phase 1: 첫인상 및 핵심 인터랙션 개편 (Sprint 1)
> **목표:** 사이트 접속 3초 내에 시각적 몰입감을 확보하고, 오작동 중인 K-Drawer를 완성형 앱 컴포넌트로 정상화한다.

### Task 1.1: Cinematic Hero Section 구축
- [ ] **비주얼 배경 도입:**
  - 밋밋한 플랫 베이지 배경 대신 고화질 현장 사진 오버레이(또는 경량 WebM 루프 비디오) 적용.
  - 텍스트 가독성을 위한 부드러운 다크 그라데이션 레이어(`bg-gradient-to-b from-black/60 via-black/40 to-black/70`) 래핑.
- [ ] **타이포그래피 위계 정돈:**
  - 메인 헤드카피(`선교 현장과 한국교회를 잇는 풀스택 선교 플랫폼`): 세리프 폰트 + 화이트 컬러 + 자간 축소(`tracking-tight`).
  - 서브 카피 및 시편 인용구: 명도 대비를 살린 밝은 스톤 톤(`text-stone-300`)으로 분리.
- [ ] **Dual CTA Button 재설계:**
  - **Primary (`선교 동역하기`):** `amber-500` 솔리드 배경 + 블랙 텍스트 + 호버 리프트 효과.
  - **Secondary (`주간 미션 리포트`):** 투명 글래스모피즘(`bg-white/10 backdrop-blur border border-white/20 hover:bg-white/20`).

### Task 1.2: K-Drawer (Brand DNA) 일체형 슬라이딩 고도화
- [ ] **핸들(Handle) & 패널 물리적 결합:**
  - 사각 탭을 패널 우측 변(`absolute -right-11 top-1/2 -translate-y-1/2`)에 영구 부착하여 분리/위치 오류 원천 차단.
  - 핸들에 시각적 피포드 부여 (K 폰트 + 3구 점자 그립 인디케이터 + 회전형 화살표 SVG).
- [ ] **Backdrop & Full Height 레이아웃:**
  - 열림 시 화면 전체 높이(`h-full min-h-screen`) 적용 및 딥 네이비/스톤 톤(`bg-stone-900`) 채택.
  - 뒷배경 딤드(`backdrop-blur-[2px] bg-black/50`) 클릭 시 닫기 이벤트 연동.
- [ ] **모바일 터치 스와이프 제스처:**
  - Vanilla JS `touchstart`/`touchend` 기반 좌우 45px 임계값 스와이프 인터랙션 적용.

---

## 🎨 Phase 2: 콘텐츠 스토리텔링 및 시각화 (Sprint 2)
> **목표:** "글자가 너무 많고 밋밋하다"는 피드백을 타파하기 위해 텍스트 위주 박스를 미디어 중심 벤토 그리드로 전환한다.

### Task 2.1: 사역 소개 벤토 그리드(Bento Grid) 전환
- [ ] **모달(Modal) 해체 및 사진 전면 노출:**
  - 모달 팝업 뒤에 숨어 있던 현장 사진(인도네시아 청년, 사역 현장, 세미나)을 카드 표면으로 이동.
- [ ] **비대칭 벤토 레이아웃 적용:**
  - **Card 01 (영혼을 살리는 일):** 아이들 미소 사진을 풀 배경으로 채운 와이드 하이라이트 카드.
  - **Card 02 (교회를 세우는 일):** 현지 공동체 단체 사진 + 다크 그라데이션 블렌딩.
  - **Card 03~05:** 인포그래픽 아이콘, 키워드 뱃지와 산세리프 본문이 결합된 클린 카드.
- [ ] **카드 마이크로 인터랙션:**
  - 호버 시 미세 이미지 줌(`scale-105 transition-transform duration-500`) 및 텍스트 섀도우 상승.

### Task 2.2: 임팩트 지표 (Impact Metrics) 카운트업
- [ ] 단순 텍스트 나열 탈피: `295+`, `19+`, `63+` 숫자에 세리프 디스플레이 폰트 적용.
- [ ] Intersection Observer 기반 뷰포트 진입 시 부드러운 숫자 카운트업(Count-up) 애니메이션 구현.

### Task 2.3: 프로그램 모집 & 주간 리포트 매거진화
- [ ] 프로그램 카드: 단순 상단 픽토그램 대신 실제 활동 사진이 포함된 **미디어 리치 카드(Media Rich Card)**로 변경.
- [ ] 주간 미션 리포트: 공지사항 형태에서 에디토리얼 매거진 레이아웃(큰 타이틀 + 현장 르포 썸네일 + 날짜 배지)으로 재배치.

---

## 🤝 Phase 3: 전환 및 신뢰도 극대화 (Sprint 3)
> **목표:** 페이지 하단의 정적인 공지사항 느낌을 제거하고, 신뢰 구축(Social Proof)과 후원/동역 전환율을 극대화한다.

### Task 3.1: 현장의 목소리 (Voices from the Field) 입체화
- [ ] 가로 실선 분할을 폐기하고 둥근 백색 글래스 카드(`rounded-2xl bg-white/80 border border-stone-200/60 shadow-sm`)로 전환.
- [ ] 참가자 역할 배지(`[인도네시아 청년]`, `[파견 교원]`, `[동역 성도]`) 및 아바타 요소를 추가해 진정성 부여.

### Task 3.2: 글로벌 파트너십 (K-Alliance) 로고 그리드화
- [ ] 텍스트 링크 나열을 **그레이스케일 공식 로고 그리드**(`grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all`)로 전면 개편.
- [ ] 로고가 없는 기관의 경우 정갈한 필 배지(`rounded-full bg-stone-200/80 text-stone-700 text-xs`) 형태로 통일.

### Task 3.3: 피날레 전환 배너 (Invest in Mission) 완성
- [ ] **다크 모드 풀 와이드 배너 적용:**
  - `bg-slate-900` 배경 + 앰버 글로우(`bg-amber-500/10 blur-3xl`) 조명 효과로 페이지의 웅장한 종결감 제공.
- [ ] **원클릭 인터랙티브 계좌 복사기:**
  - 계좌번호 옆 `[복사]` 버튼 배치.
  - 클릭 시 클립보드 저장 + 하단 플로팅 토스트("국민은행 계좌번호가 복사되었습니다") 피드백 연결.
- [ ] **Dual Action 구성:**
  - 성도 개인 후원 안내(좌측) vs 교회/대학 K-Alliance 동역 신청 버튼(우측).

---

## ⚡ Phase 4: 마이크로 인터랙션 & 최종 최적화 (Sprint 4)
> **목표:** Cloudflare Pages 환경에 최적화된 경량 인터랙션을 완성하고 Lighthouse 95+ 성능을 최종 검증한다.

### Task 4.1: 경량 인터랙션 스크립트 정돈
- [ ] 외부 무거운 라이브러리 없이 순수 CSS Scroll-driven animations 또는 가벼운 Intersection Observer로 스크롤 페이드인 효과 구현.
- [ ] 불필요한 리플로우(Reflow) 방지를 위해 `transform`과 `opacity` 중심 하드웨어 가속 스타일 유지.

### Task 4.2: 타이포그래피 & 웹폰트 최적화
- [ ] `font-display: swap` 적용 및 영문/국문 서체 렌더링 블로킹 방지.
- [ ] 명조(세리프)와 고딕(산세리프)의 비중을 3:7로 배분하여 텍스트 피로도 제거.

### Task 4.3: Lighthouse 및 모바일 반응형 최종 QA
- [ ] 모바일/태블릿/데스크톱 뷰포트 레이아웃 틀어짐 검수.
- [ ] 모바일 터치 타깃(최소 44px) 준수 여부 및 명도 대비(Contrast Ratio AA) 검증.
- [ ] Google Lighthouse 점수 측정 (Performance 95+, Accessibility 95+ 방어).

---

## 📅 작업 우선순위 매트릭스

| 순위 | 작업 항목 | 체감 개선 효과 | 개발 난이도 | 권장 도구 |
| :---: | :--- | :---: | :---: | :--- |
| **P0** | K-Drawer 위치 버그 수정 & 일체형 탭 전환 | 최상 (버그 해결) | 보통 | Tailwind + Vanilla JS |
| **P0** | Hero Section 비주얼 배경 & CTA 버튼 분리 | 최상 (첫인상 개편) | 쉬움 | Pure HTML/CSS |
| **P1** | 사역 5개 카드 → 벤토 그리드(사진 노출) | 상 (밋밋함 타파) | 보통 | Tailwind Grid |
| **P1** | Invest in Mission 다크 배너 & 계좌 복사 UX | 상 (전환율 향상) | 쉬움 | Tailwind + Clipboard API |
| **P2** | 얼라이언스 파트너 로고 그리드 개편 | 보통 (신뢰도) | 쉬움 | Tailwind Flex/Grid |
| **P2** | 후기 카드 입체화 및 인디케이터 적용 | 보통 (가독성) | 쉬움 | Tailwind Cards |
| **P3** | 숫자 카운트업 & 스크롤 페이드인 모션 | 보통 (완성도) | 보통 | Intersection Observer |
