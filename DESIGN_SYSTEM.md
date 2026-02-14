# Textos Design System

다른 프로젝트에 동일한 디자인과 테마를 적용하기 위한 레퍼런스 문서.

---

## 1. 기술 스택

| 항목 | 기술 |
|------|------|
| 프레임워크 | Electron + React 19 |
| 언어 | TypeScript |
| 빌드 | Electron Vite |
| 스타일링 | CSS Variables + Global CSS (CSS-in-JS/Tailwind 미사용) |
| 테마 관리 | React Context + `data-theme` 속성 |
| 아이콘 | 커스텀 SVG 컴포넌트 (Feather Icons 스타일) |

---

## 2. 컬러 시스템

### 2.1 Light Theme

```css
[data-theme='light'] {
  /* 배경 */
  --bg-primary: #ffffff;       /* 메인 배경 */
  --bg-secondary: #f5f6f8;     /* 툴바, 상태바, 카드 배경 */
  --bg-tertiary: #eceef1;      /* 입력 필드, 호버 배경 */
  --bg-elevated: #ffffff;      /* 모달, 드롭다운 등 떠 있는 UI */

  /* 텍스트 */
  --text-primary: #191f28;     /* 본문 텍스트 */
  --text-secondary: #6b7684;   /* 보조 텍스트, 레이블 */
  --text-tertiary: #8b95a1;    /* 비활성 텍스트, 플레이스홀더 */

  /* 테두리 */
  --border-color: #e5e8eb;

  /* 액센트 (보라색 계열) */
  --accent: #6C5CE7;                        /* 기본 강조 */
  --accent-hover: #5A4BD1;                  /* 호버 상태 */
  --accent-light: rgba(108, 92, 231, 0.08); /* 하이라이트 배경 */

  /* 위험 (빨간색) */
  --danger: #f04452;
  --danger-hover: #d92130;

  /* 그림자 */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);

  /* 오버레이 */
  --overlay: rgba(0, 0, 0, 0.4);

  /* 페이지 뷰 전용 */
  --pageview-bg: #e8e8e8;
  --page-bg: #ffffff;
  --page-text: #000000;
}
```

### 2.2 Dark Theme

```css
[data-theme='dark'] {
  /* 배경 */
  --bg-primary: #17171c;
  --bg-secondary: #1e1e24;
  --bg-tertiary: #2c2c35;
  --bg-elevated: #25252d;

  /* 텍스트 */
  --text-primary: #ececf1;
  --text-secondary: #8b8fa3;
  --text-tertiary: #6b6e82;

  /* 테두리 */
  --border-color: #2e2e38;

  /* 액센트 (밝은 보라색) */
  --accent: #8B7CF6;
  --accent-hover: #A294FF;
  --accent-light: rgba(139, 124, 246, 0.1);

  /* 위험 */
  --danger: #f04452;
  --danger-hover: #ff6370;

  /* 그림자 (더 진한 그림자) */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.2);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.4);

  /* 오버레이 */
  --overlay: rgba(0, 0, 0, 0.6);

  /* 페이지 뷰 전용 */
  --pageview-bg: #111115;
  --page-bg: #2b2b2b;
  --page-text: #d4d4d4;
}
```

### 2.3 컬러 사용 규칙

| 용도 | Light | Dark | CSS Variable |
|------|-------|------|-------------|
| 앱 배경 | `#ffffff` | `#17171c` | `--bg-primary` |
| 패널/바 배경 | `#f5f6f8` | `#1e1e24` | `--bg-secondary` |
| 입력 필드/호버 | `#eceef1` | `#2c2c35` | `--bg-tertiary` |
| 모달/드롭다운 | `#ffffff` | `#25252d` | `--bg-elevated` |
| 본문 텍스트 | `#191f28` | `#ececf1` | `--text-primary` |
| 보조 텍스트 | `#6b7684` | `#8b8fa3` | `--text-secondary` |
| 비활성 텍스트 | `#8b95a1` | `#6b6e82` | `--text-tertiary` |
| 강조/액센트 | `#6C5CE7` | `#8B7CF6` | `--accent` |
| 경고/삭제 | `#f04452` | `#f04452` | `--danger` |
| 활성 버튼 텍스트 | `#ffffff` | `#ffffff` | 고정값 |

---

## 3. 타이포그래피

### 3.1 폰트 패밀리

```css
/* UI 폰트 (Pretendard Variable 번들링) */
--font-sans: 'Pretendard Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* 에디터/코드 폰트 */
--font-mono: 'Consolas', 'Courier New', monospace;
```

- **Pretendard Variable**: 앱에 번들링된 가변 폰트 (woff2-variations, 45~920 weight)
- UI의 모든 텍스트에 `--font-sans` 적용
- 에디터 본문에 `--font-mono` 적용

### 3.2 폰트 크기 체계

| 용도 | 크기 | Weight |
|------|------|--------|
| 페이지 번호 | 10px | 400 |
| 검색 매치 카운트 | 11px | 400 |
| 상태바 | 12px | 400 |
| 툴바 버튼/드롭다운 | 13px | 500 |
| 세팅 섹션 타이틀 | 13px | 600 |
| 타이틀바 | 13px | 500 |
| 본문/에디터 (기본) | 14px | 400 |
| 설정 행 라벨 | 15px | 500 |
| 모달 버튼 | 15px | 600 |
| 모달 타이틀 | 18px | 700 |
| 설정 메인 타이틀 | 22px | 700 |

### 3.3 에디터 기본 설정값

```typescript
{
  fontFamily: 'Consolas',
  fontSize: 11,       // pt 단위
  letterSpacing: 0,
  lineHeight: 1.6,
  textAlign: 'left'
}
```

### 3.4 본문 라인 높이

- 에디터/프리뷰: `line-height: 1.7`
- 페이지뷰 기본: `line-height: 1.6`

---

## 4. 간격 & 크기 시스템

### 4.1 기본 간격

| 값 | 사용처 |
|----|--------|
| 2px | 세그먼트 컨트롤 gap, 검색 네비게이션 gap |
| 3px | 세그먼트 컨트롤 패딩 |
| 4px | 드롭다운 메뉴 패딩, 구분선 마진, 버튼 gap |
| 6px | 검색바 gap, 인라인 코드 패딩 |
| 8px | 툴바 gap, 드롭다운 아이템 패딩, 모달 액션 gap |
| 12px | 버튼 패딩(좌우), 드롭다운 아이템 패딩, 섹션 타이틀 마진 |
| 16px | 툴바/상태바 좌우 패딩, 블록쿼트 패딩 |
| 20px | 설정 행 패딩, 페이지 마진(20mm) |
| 24px | 에디터 패딩(상하), 설정 본문 패딩, 모달 패딩 |
| 28px | 모달 상단 패딩 |
| 32px | 에디터 패딩(좌우), 설정 섹션 마진 |
| 40px | 페이지뷰 페이지 간 gap, 페이지뷰 컨테이너 패딩 |

### 4.2 고정 크기

| 요소 | 크기 |
|------|------|
| 타이틀바 높이 | 36px |
| 툴바 높이 | ~44px (8px + 32px 버튼 + 4px) |
| 상태바 높이 | 28px |
| 아이콘 버튼 | 32px x 32px |
| 아이콘 SVG | 18px x 18px |
| 검색바 높이 | 30px |
| 검색바 너비 | 240px |
| 설정 모달 너비 | 520px |
| 일반 모달 최대 너비 | 380px |
| 스크롤바 너비 | 6px |
| 설정 닫기 버튼 | 36px x 36px |
| 설정 닫기 아이콘 | 20px x 20px |

### 4.3 A4 페이지 뷰

```css
width: 210mm;
min-height: 297mm;
padding: 20mm;
```

---

## 5. Border Radius 체계

| 값 | 사용처 |
|----|--------|
| 2px | 페이지, 검색 하이라이트 |
| 3px | 스크롤바 thumb |
| 4px | 인라인 코드, 검색 네비 버튼 |
| 8px | 버튼, 입력 필드, 드롭다운 아이템, 이미지 |
| 10px | 세그먼트 컨트롤 외부, 설정 닫기 버튼 |
| 12px | 모달 버튼, 드롭다운 메뉴, 코드 블록 |
| 16px | 모달, 설정 모달, 설정 카드 |

---

## 6. 그림자 & 효과

### 6.1 그림자 3단계

```css
/* Light */
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06);   /* 세그먼트 활성 탭 */
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);   /* 드롭다운 메뉴 */
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);   /* 모달, 페이지 */

/* Dark - 더 진한 불투명도 */
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.2);
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.3);
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.4);
```

### 6.2 Backdrop Filter

```css
/* 모달 오버레이 */
backdrop-filter: blur(4px);
```

---

## 7. 애니메이션

### 7.1 트랜지션

| 속성 | 지속 시간 | 이징 | 대상 |
|------|-----------|------|------|
| `all` | 0.15s | ease | 버튼 호버, 입력 포커스 |
| `background, color` | 0.2s | ease | 테마 전환, 컨테이너 |
| `border-color` | 0.15s | ease | 입력 필드 포커스 |
| `all` | 0.2s | ease | 세그먼트 컨트롤 |

### 7.2 키프레임 애니메이션

```css
/* 모달 페이드 인 */
@keyframes modal-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* 모달 슬라이드 업 */
@keyframes modal-slide-up {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
```

- 오버레이: `modal-fade-in 0.15s ease`
- 모달 콘텐츠: `modal-slide-up 0.2s ease`

---

## 8. 앱 레이아웃

### 8.1 전체 구조

```
┌─────────────────────────────────┐
│  TitleBar (36px)                │  -webkit-app-region: drag
├─────────────────────────────────┤
│  Toolbar (44px)                 │  Left | Center | Right
├─────────────────────────────────┤
│                                 │
│  Editor Container (flex: 1)     │  Editor / PageView / MarkdownView
│                                 │
├─────────────────────────────────┤
│  StatusBar (28px)               │  Left | Center | Right
└─────────────────────────────────┘
```

### 8.2 Flex 레이아웃 패턴

```css
/* 메인 앱 컨테이너 */
.app {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 3단 분할 (Toolbar, StatusBar) */
.toolbar / .status-bar {
  display: flex;
  align-items: center;
}
.toolbar-left  / .status-bar-left   { flex-shrink: 0; }
.toolbar-center / .status-bar-center { flex: 1; }
.toolbar-right / .status-bar-right  { flex-shrink: 0; }
```

### 8.3 플랫폼별 타이틀바

```css
/* macOS: 신호등 버튼 공간 확보 */
[data-platform="darwin"] .titlebar {
  padding-left: 80px;
  padding-right: 16px;
}

/* Windows/Linux: 창 컨트롤 공간 확보 */
.titlebar {
  padding-right: 140px;
}
```

---

## 9. 컴포넌트 패턴

### 9.1 버튼 시스템

**툴바 버튼**
```css
background: transparent;
color: var(--text-secondary);
border: none;
border-radius: 8px;
padding: 6px 12px;
font-size: 13px;
font-weight: 500;

/* 호버 */
:hover { background: var(--bg-tertiary); color: var(--text-primary); }

/* 활성 */
.active { background: var(--accent); color: #ffffff; }
```

**모달 버튼 (Full-width, 세로 배치)**
```css
width: 100%;
padding: 12px 16px;
border-radius: 12px;
font-size: 15px;
font-weight: 600;

/* Primary */   background: var(--accent); color: #ffffff;
/* Secondary */ background: var(--bg-tertiary); color: var(--text-primary);
/* Danger */    background: transparent; color: var(--danger);
```

**아이콘 버튼**
```css
width: 32px;
height: 32px;
border-radius: 8px;
/* SVG */ width: 18px; height: 18px;
```

### 9.2 세그먼트 컨트롤

```css
/* 외부 컨테이너 */
display: inline-flex;
background: var(--bg-tertiary);
border-radius: 10px;
padding: 3px;
gap: 2px;

/* 개별 탭 */
border-radius: 8px;
padding: 5px 14px;
font-size: 13px;
font-weight: 500;

/* 활성 탭 */
background: var(--bg-elevated);
box-shadow: var(--shadow-sm);
```

### 9.3 입력 필드 & 셀렉트

```css
background: var(--bg-tertiary);
color: var(--text-primary);
border: 1px solid var(--border-color);
border-radius: 8px;
padding: 5px 8px;  /* 툴바 */ / 6px 10px; /* 설정 */
font-size: 13px;   /* 툴바 */ / 14px;     /* 설정 */

/* 포커스 */
:focus { border-color: var(--accent); }
```

### 9.4 드롭다운 메뉴

```css
/* 메뉴 컨테이너 */
background: var(--bg-elevated);
border: 1px solid var(--border-color);
border-radius: 12px;
box-shadow: var(--shadow-md);
padding: 4px;
min-width: 160px;

/* 메뉴 아이템 */
padding: 8px 12px;
border-radius: 8px;
font-size: 13px;

/* 단축키 텍스트 */
color: var(--text-tertiary);
font-size: 12px;
margin-left: auto;

/* 구분선 */
height: 1px;
background: var(--border-color);
margin: 4px 8px;
```

### 9.5 모달

```css
/* 오버레이 */
position: fixed; inset: 0;
background: var(--overlay);
backdrop-filter: blur(4px);

/* 콘텐츠 */
background: var(--bg-elevated);
border-radius: 16px;
box-shadow: var(--shadow-lg);
max-width: 380px;
padding: 28px 24px 20px;
```

### 9.6 설정 페이지

```css
/* 모달 */
width: 520px;
max-height: 80vh;
border-radius: 16px;

/* 섹션 타이틀 */
font-size: 13px;
font-weight: 600;
text-transform: uppercase;
letter-spacing: 0.5px;
color: var(--text-tertiary);

/* 카드 */
background: var(--bg-secondary);
border-radius: 16px;

/* 행 */
padding: 16px 20px;
/* 행 구분선: border-top: 1px solid var(--border-color) */
```

### 9.7 검색바

```css
display: flex;
align-items: center;
gap: 6px;
background: var(--bg-tertiary);
border: 1px solid var(--border-color);
border-radius: 8px;
padding: 0 8px;
height: 30px;
width: 240px;

:focus-within { border-color: var(--accent); }

/* 아이콘 */ width: 14px; height: 14px; color: var(--text-tertiary);
/* 입력 */  font-size: 13px; background: transparent; border: none;
```

### 9.8 검색 하이라이트

```css
/* 기본 하이라이트 */
background: var(--accent-light);
border-bottom: 2px solid var(--accent);
border-radius: 2px;

/* 활성 매치 */
/* Light */ background: rgba(108, 92, 231, 0.25);
/* Dark */  background: rgba(139, 124, 246, 0.3);
```

---

## 10. 마크다운 프리뷰 스타일

```css
/* 헤딩 */
h1 { font-size: 1.8em; }
h2 { font-size: 1.5em; }
h3 { font-size: 1.25em; }
/* 공통: font-weight: 700, margin-top: 1.2em, margin-bottom: 0.5em */

/* 인라인 코드 */
background: var(--bg-tertiary);
padding: 2px 6px;
border-radius: 4px;
font-size: 0.9em;

/* 코드 블록 */
background: var(--bg-secondary);
padding: 16px 20px;
border-radius: 12px;

/* 인용문 */
border-left: 3px solid var(--accent);
padding-left: 16px;
color: var(--text-secondary);

/* 링크 */
color: var(--accent);
text-decoration: none;
:hover { text-decoration: underline; }

/* 테이블 */
th { background: var(--bg-secondary); font-weight: 600; }
tr:nth-child(even) { background: var(--bg-secondary); }
th, td { border: 1px solid var(--border-color); padding: 8px 12px; }

/* 체크박스 */
accent-color: var(--accent);

/* 수평선 */
border-top: 1px solid var(--border-color);
margin: 1.5em 0;
```

---

## 11. 스크롤바

```css
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--text-tertiary);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}
```

---

## 12. CSS Reset

```css
*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #root {
  height: 100%;
  overflow: hidden;
}

body {
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 14px;
  -webkit-font-smoothing: antialiased;
  transition: background 0.2s ease, color 0.2s ease;
}
```

---

## 13. 테마 전환 구현

### 13.1 React Context 패턴

```typescript
// 테마 옵션
type Theme = 'light' | 'dark' | 'system'

// 시스템 테마 감지
const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches

// 테마 해석
function resolveTheme(theme: Theme, systemDark: boolean): 'light' | 'dark' {
  if (theme === 'system') return systemDark ? 'dark' : 'light'
  return theme
}

// HTML 속성으로 적용 (useLayoutEffect로 페인트 전 적용)
document.documentElement.setAttribute('data-theme', resolvedTheme)
```

### 13.2 설정 지속성

```typescript
// localStorage에 저장
const STORAGE_KEY = 'textos-settings'
localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
```

---

## 14. 아이콘 시스템

Feather Icons 스타일의 커스텀 SVG 컴포넌트. `currentColor`를 사용하여 부모의 `color` 속성 상속.

| 아이콘 | 컴포넌트 | 용도 |
|--------|----------|------|
| Sun | `SunIcon` | 라이트 테마 |
| Moon | `MoonIcon` | 다크 테마 |
| Gear | `GearIcon` | 설정 |
| Align Left | `AlignLeftIcon` | 좌측 정렬 |
| Align Center | `AlignCenterIcon` | 가운데 정렬 |
| Align Right | `AlignRightIcon` | 우측 정렬 |
| Close (X) | `CloseIcon` | 닫기 |
| Search | `SearchIcon` | 검색 |
| Chevron Up | `ChevronUpIcon` | 위 네비게이션 |
| Chevron Down | `ChevronDownIcon` | 아래 네비게이션 |
| Arrow Left | `ArrowLeftIcon` | 뒤로 가기 |

**SVG 공통 속성:**
```tsx
viewBox="0 0 24 24"
fill="none"
stroke="currentColor"
strokeWidth="2"
strokeLinecap="round"
strokeLinejoin="round"
```

---

## 15. 디자인 원칙 요약

1. **CSS Variables 기반 테마**: 모든 색상을 CSS 변수로 관리하여 `data-theme` 속성 하나로 전체 테마 전환
2. **배경 4단계**: primary → secondary → tertiary → elevated 순으로 계층 구분
3. **그림자 3단계**: sm → md → lg 순으로 부유감 표현
4. **보라색 액센트**: Light `#6C5CE7`, Dark `#8B7CF6` (다크 모드에서 밝기 보정)
5. **Pretendard Variable**: 한국어 최적화 가변 폰트, 오프라인 지원을 위해 번들링
6. **미니멀 애니메이션**: 0.15s~0.2s의 짧은 트랜지션, ease 이징만 사용
7. **플랫폼 적응**: macOS 신호등 버튼/Windows 창 컨트롤을 위한 조건부 패딩
8. **단일 CSS 파일**: 모든 스타일을 `global.css` 한 파일에서 관리 (CSS Modules 미사용)
