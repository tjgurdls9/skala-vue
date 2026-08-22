# 인수인계서

작성일: 2026-08-21
대상: 이 리포를 이어받는 사람(미래의 나, 다른 세션, 다른 사람 누구든)

## 0. 가장 먼저 볼 것 — 지금 `main`이 아니라 `worktree-ios-redesign` 브랜치에 있다

과제 1~6은 `main`에 커밋돼 있다(`8701e10`). **iOS 리디자인 1차 작업은 `main`이 아니라
`worktree-ios-redesign` 브랜치(커밋 `ae1123a`)에 있고, `origin`에도 푸시돼 있다.** 사용자가
"원본(main)에서 작업하다가 안되면 엎어야 하니까" 일부러 분리해뒀다 — **디자인 실험이 잘 안 풀리면
이 브랜치만 버리면 되고 main은 안전하다는 뜻**이다. main에 머지할지는 사용자가 결정할 일이니
먼저 물어보지 않고 머지하지 말 것.

```
$ git log --oneline -3
ae1123a iOS 스타일로 날씨 대시보드 리디자인      # worktree-ios-redesign, origin에 푸시됨
8701e10 페이지 스켈레톤 제작 완료 후 커밋        # main
c7eee7b 과제3 완료 후 리드미 작성
```

이어서 작업하려면 `git worktree list`로 `.claude/worktrees/ios-redesign` 워크트리가 남아있는지
먼저 확인하고, 없으면 `git checkout worktree-ios-redesign`으로 브랜치만 가져와도 된다.

## 1. 지금 뭐가 완성돼 있나

교재("Full-stack Engineering_3.Frontend-framework_Vue.js", 리포 루트 PDF) 1~230p 기준 과제
1~6을 전부 끝냈다. **231~275p(UI Libraries, Vite Build & Deployment 챕터)는 사용자가 명시적으로
스킵을 선택했다.** 억지로 이어서 할 필요 없다.

| 과제 | 내용 | 문서 |
| --- | --- | --- |
| 1 | 날씨 대시보드 Mockup | [docs/task1-weather-mockup.md](./docs/task1-weather-mockup.md) |
| 2 | Composition API | [docs/task2-weather-composition.md](./docs/task2-weather-composition.md) |
| 3 | 컴포넌트 분리 | [docs/task3-weather-component.md](./docs/task3-weather-component.md) |
| 4 | Vue Router | [docs/task4-weather-router.md](./docs/task4-weather-router.md) |
| 5 | Pinia Store | [docs/task5-weather-store.md](./docs/task5-weather-store.md) |
| 6 | Axios 실시간 연동 | [docs/task6-weather-axios.md](./docs/task6-weather-axios.md) |

각 문서에 "무엇을 했나 / 왜 그렇게 했나 / 하면서 걸렸던 것 / 확인 / 남은 것"이 적혀 있다.
빠르게 감을 잡으려면 각 문서의 "확인" 절만 훑어도 된다.

## 2. 지금 앱 구조

```
src/
├─ App.vue              네비게이션 바 + RouterView + 날씨단위 토글
├─ router/index.js       라우트 정의 + Lazy Loading + afterEach 가드(제목/로그)
├─ stores/
│  ├─ configStore.js     날씨 단위(섭씨/화씨) — 전역
│  ├─ budgetStore.js     마케팅 총 예산 — 홈/요약이 공유
│  └─ counter.js         교재 실습용, 앱 로직과 무관
├─ data/
│  ├─ weatherMock.js     도시 등록정보(좌표) + 등급 판정 + 예산 배분 (순수 함수)
│  └─ weatherApi.js      axios로 OpenWeatherMap 2종 + Nager.Date 호출
├─ views/
│  ├─ WeatherHomeView.vue      / — 메인 대시보드, 실시간 조회
│  ├─ WeatherDetailView.vue    /weather/:cityId — 도시별 상세
│  ├─ WeatherSummaryView.vue   /summary — 지표 요약 표
│  ├─ WeatherAboutView.vue     /about
│  ├─ PracticeView.vue         /practice — 교재 단원별 실습 아카이브
│  └─ NotFoundView.vue         /:pathMatch(.*)* — Catch-all
└─ components/
   ├─ weather/            BaseDashboardCard, SearchBar, WeatherCard, UnitToggler
   └─ practice/            basic/render/binding/optimize/event/composition/component/store
```

**데이터 흐름**: `weatherMock.js`의 도시 등록정보(좌표만) → `weatherApi.js`가 OpenWeatherMap에
좌표로 요청 → 응답을 `weatherMock.js`의 `gradeCity()`로 등급/예산 계산 → 화면에 렌더링.
세 화면(Home/Detail/Summary)이 각자 `onMounted`에서 독립적으로 이 흐름을 탄다. 공유 Composable을
안 만든 건 교재가 "Composable은 범위 제외"라고 명시했기 때문 — 지금은 자유 개발 단계라 이 제약은
더 이상 안 지켜도 된다. 셋을 합칠 거면 지금이 적기다.

## 3. 왜 이렇게 했는지 (핵심 결정 요약)

- **폴더를 교재 트리와 다르게 짰다.** 컴포넌트 50개가 한 폴더에 평면으로 있어서 교재 단원별로
  `components/practice/{basic,render,binding,...}`로 묶었다. 교재 96p 트리는 `components/exercise/`를
  쓰지만 이름만 다르고 구조는 같다. 폴더 구조는 애초에 사용자가 "교재와 달라도 된다"고 허락한 부분.
- **API 키를 `.env`에 뒀다.** 교재 224p는 키를 스크립트에 직접 적는데, 교재 스크린샷 자체가
  강사님 개인 키를 실수로 노출한 사고 사례였다. 그걸 보고 `.env` + `.gitignore`로 갔다.
  `.env.example`이 커밋돼 있으니 새로 받는 사람은 `cp .env.example .env` 하고 본인 키를 채우면 된다.
- **Mock 데이터를 한 파일(`weatherMock.js`)로 합쳤다 흩었다 다시 합쳤다.** 과제 4에서 교재 트리를
  따라 화면마다 각자 Mock을 들게 했다가, 과제 5에서 요약 화면이 추가되며 로직 3중 복사가 되길래
  다시 공유 모듈로 합쳤다. 지금은 등급 판정 로직만 공유하고, 실제 날씨 수치는 과제 6부터 axios가
  실시간으로 채운다.
- **예산은 Pinia로, 날씨 단위도 Pinia로.** 둘 다 메모리에만 있어서 **새로고침하면 초기값(1000만원,
  섭씨)으로 돌아간다.** `localStorage` 동기화가 필요하면 교재 209p `authStore` 패턴을 참고하면 된다
  (지금은 안 붙어 있다).
- **온도 변환 코드가 WeatherCard.vue와 WeatherDetailView.vue에 중복돼 있다.** 알면서 남긴 중복이다
  (교재가 Composable을 범위 제외로 명시했던 흔적). 지금 합쳐도 안전하다.

## 4. 알려진 이슈 / 남은 것

- `npm run lint` → `src/components/practice/basic/SampleTwo.vue:2 'ref' is defined but never used`.
  **기존부터 있던 것이고 의도적으로 안 고쳤다** (반응성 비교 실습 예제). eslint 스크립트가 이것 때문에
  항상 exit 1로 끝난다.
- Pinia 스토어(`configStore`, `budgetStore`)는 새로고침하면 초기화된다. (3번 항목 참고)
- `fetchHolidays`는 연도 단위 조회라 연말에 다음 해 공휴일이 안 잡힌다. `WeatherHomeView.vue`에
  `ponytail:` 주석으로 남겨뒀다.
- OpenWeatherMap 무료 티어 한도: 분당 60회 / 월 100만 회. 새로고침 1번 = 34회 호출(전국 17개 지역 ×
  API 2종, 4차에서 5개→17개로 늘어남). 한도 안쪽이지만 여기서 더 늘리면 분당 60회에 걸릴 수 있다.
- `WeatherDetailView.vue`가 상세보기로 들어올 때만 쓰는 예산/점유율(`route.query.share` 등)을
  쿼리스트링으로 받는다. 새로고침하면 쿼리가 없어져서 "예산 편성" 카드가 안 뜬다 — 의도된 동작이지만
  헷갈릴 수 있다.

## 5. 자유 개발(디자인) 단계 — 2차(Liquid Glass)까지 적용 완료

과제 6까지 끝난 뒤 사용자가 "교재 준수는 여기까지, 이제 예쁘게 만들고 기능 정비하고 디벨롭할 거다"라고
선언했고, 이후 진행 상황:

- **디자인 방향**: iOS 앱 스타일(날씨/건강 앱 느낌). 흰 카드 + 은은한 그림자, radius 20px, 기온
  숫자 48px, 시스템 블루(#007AFF) 포인트, `-apple-system` 폰트. (다른 후보 apple.com 마케팅 스타일,
  macOS 시스템 설정 스타일은 기각.)
- **1차 적용 완료 (`worktree-ios-redesign` 브랜치, 커밋 `ae1123a`)**: `assets/base.css`에 토큰 추가
  (`--color-accent`, `--radius-card`, `--shadow-card` 등), `practice.css`/`exercise.css`(공유 베이스,
  구조는 안 건드리고 색/라운드/그림자/타이포만), `App.vue` 내비(세그먼트 컨트롤처럼 활성 탭에 흰 필),
  `WeatherCard.vue`(기온 48px 분리, 뱃지 파스텔 필로 재도색 — 작업 중 헤더가 상세보기 버튼에 가려지는
  버그를 발견해서 바로 고침), `BaseDashboardCard.vue`, `WeatherSummaryView.vue`, `WeatherHomeView.vue`,
  `WeatherDetailView.vue`. Chrome으로 대시보드/상세/요약/`/practice` 전부 실제 렌더링 확인함(API 키가
  없어서 `weatherApi.js`를 QA용으로 잠깐 mock했다가 확인 후 정확히 원복 — 커밋에는 안 들어감).
- **사용자 피드백: "왜 저게 iOS 리디자인인지 모르겠다"** — 타당한 지적이었다. 진짜 iOS스러운 요소(큰
  숫자+회색 보조텍스트, 시스템 블루, 카드+그림자)는 있지만, 다음 것들 때문에 "iOS"보다는 "이모지
  많은 일반 SaaS 대시보드"처럼 보인다:
  1. 🔥❄️🌫️🍀🌵😷😀 같은 컬러 이모지가 카드마다 많음 — 애플 앱은 이런 이모지 대신 단색 SF Symbols류
     라인 아이콘을 씀.
  2. 카드 하나에 뱃지(우선순위/등급/세그먼트/예산 등)가 4~5개씩 파스텔로 나열 — 애플 앱은 태그를
     이렇게 안 늘어놓고 정보 위계를 확 줄인다.
  3. 블러(반투명 유리) 효과가 전혀 없음 — iOS 특유의 frosted glass 느낌이 빠져서 "그냥 둥근 흰
     카드"로 보인다.
  → **다음 세션에서 이걸 밀어붙일지는 사용자에게 다시 확인하고 시작할 것.** 밀어붙이기로 하면
  이모지 걷어내기 / 뱃지 개수 줄이기 / `backdrop-filter` 블러 추가가 우선순위.
- **서드파티 플러그인 2개를 사용자 승인 받고 설치함** (자세한 건 아래 6번 메모리 참고):
  - `apple-design@apple-design-marketplace` — Anthropic 공식이 아닌 개인 리포
    (`tekgnosis-net/apple-design-marketplace`)의 Apple Design System 스킬. **설치한 세션 안에서는
    못 쓰고, 새 세션부터 `Skill` 목록에 잡힌다.**
  - `/apple-design-plan`, `/apple-design-build` 슬래시 커맨드 — 역시 개인 리포
    (`justLukaBB/apple-designer-prompts`)에서 받아 `~/.claude/commands/`에 직접 복사해둔 것 (이건
    마켓플레이스 플러그인이 아니라 순수 프롬프트 파일 2개). plan-then-build 워크플로우로,
    `/apple-design-plan`이 먼저 `PLAN.md`를 쓰고 사용자 승인 후 `/apple-design-build`가 구현한다.
    단, 이 커맨드가 참조하는 `design:user-research`, `page-cro`, `ui-ux-pro-max` 같은 스킬은 이
    프로젝트에 없어서 일부 활성화가 실패할 수 있다 — 실제로 새 세션에서 써보고 안 되는 부분은
    스킵하면 된다.
- 예전에 만들었다 지웠던 `frontend-design`(Anthropic 공식) 플러그인도 여전히 설치돼 있다. 이번엔
  이 플러그인 없이 직접 CSS를 수정하는 방식으로 1차 작업을 했다 — 다음 세션에서
  `apple-design`/`frontend-design` 스킬을 실제로 로드해서 다시 붙여보는 것도 방법이다.

### 2차: Liquid Glass 적용 (2026-08-21, 같은 브랜치)

위 피드백을 받고 사용자에게 방향을 물었더니 **"리퀴드 글라스"**로 가기로 결정됐다. 적용한 것:

- **`base.css`에 `--app-backdrop` + `--glass-*` 토큰 세트 추가.** 핵심은 배경이다. 유리는 *뒤에
  비칠 게 있어야* 유리로 보이는데 1차에서는 흰 배경 위에 흰 카드라 blur할 게 없었다 — 그래서
  "그냥 둥근 흰 카드"로 보였던 것. body에 4겹 radial-gradient(블루/핑크/민트/라벤더)를
  `background-attachment: fixed`로 깔고, 그 위에 유리판을 띄웠다.
- **셸(`.app-container`)은 오히려 투명하게 비웠다.** 유리 위에 유리를 겹치면 배경이 두 번 뿌옇게
  깔려 색이 죽는다. 배경 그라데이션 위에 내비/카드만 떠 있는 구조가 iOS 날씨 앱에 더 가깝다.
- **내비게이션 바를 `position: sticky`로.** 스크롤하면 콘텐츠가 유리 밑으로 지나가면서 비친다 —
  리퀴드 글라스가 "살아있게" 보이는 건 이 순간이다. 정적 스크린샷으로는 잘 안 보이니 직접 스크롤해볼 것.
- **표면 전부 반투명화**: `.practice-section`, `.weather-card`, `.base-dashboard-card`,
  `.search-box/.list-box`, `.monitor`, button/input, 뱃지(불투명 파스텔 → `rgba(...,0.14~0.16)`),
  홈/요약 화면의 상태 박스. 각 표면은 `background-color: var(--glass-*)` +
  `backdrop-filter: var(--glass-blur)` + `border: 1px solid var(--glass-border)` +
  `box-shadow: var(--shadow-glass)` 네 줄 세트로 통일돼 있다.
- **`--glass-blur`에 `saturate(180%)`가 붙어 있는 게 중요하다.** blur만 걸면 뒤 색이 뿌옇게 죽어서
  유리가 아니라 젖은 창처럼 보인다. 채도를 올려야 유리 너머 색이 산다.
- **폴백/다크모드**: `@supports not (backdrop-filter)` 에서 유리를 불투명 판으로 되돌리고(안 그러면
  글씨가 안 읽힌다), `prefers-color-scheme: dark`용 어두운 backdrop/glass 토큰도 넣었다.
  **다크모드는 토큰만 정의했고 실제 눈으로 확인은 안 했다** — 다음에 볼 때 한 번 확인할 것.
- **곁다리로 고친 버그 2개**: (1) `practice.css`의 `div.practice-container`가 `width: 800px` 고정이라
  창이 그보다 좁으면 가로 스크롤이 생겼다 → `max-width: 800px; width: 100%`. (2) `main.css`의 전역
  `a:hover`가 초록 배경을 깔아서 유리 내비 위에 초록 사각형이 떴다 → `.nav-item:hover`에서 덮음.
- **검증**: `npm run build` 통과, `npm run lint`는 기존 SampleTwo 에러 1건만(4번 참고).
  Chrome으로 `/`, `/summary`, `/practice`, `/weather/city_05` 실제 렌더링 확인(실 API 데이터로).

### 2차-b: "더 세게" (같은 날, 사용자 요청)

2차를 처음 보여줬을 때 사용자가 **"대체 리퀴드글라스가 어디에 적용됐다는거지?"**라고 했는데,
원인의 절반은 단순했다 — **사용자가 보던 dev 서버가 `main` 체크아웃에서 돌고 있었다.** 리디자인은
`worktree-ios-redesign` 브랜치에만 있으니 main을 띄우면 1차조차 안 보인다. 이어받는 사람도 같은
함정에 빠지기 쉬우니, 확인할 땐 **워크트리 디렉터리에서** dev 서버를 띄울 것.

나머지 절반은 진짜 약했던 것이고, 사용자가 "더 세게 밀어봐"라고 해서 강도를 올렸다:
- 배경을 채도 높은 색 덩어리 5개로 교체(옅은 파스텔은 유리/불투명 구분이 안 됐다)
- 유리 알파를 0.5 → 0.4로 (내비는 0.48), blur 24 → 30px, saturate 180 → 200%
- `--glass-sheen` 추가: 유리판 위쪽 모서리에 빛이 스치는 그라데이션. 이게 "뿌연 판"과 "유리판"을
  가른다. `background-image`로 넣어서 별도 엘리먼트(`::before`)나 stacking 문제가 없다.
- 그림자에 아래쪽 inset 하이라이트를 추가해 판의 두께감을 줬다
- **텍스트 대비 보정**: 배경이 화려해지자 iOS 시스템 색 원본(`#ff9500`, `#ff3b30`, `#007aff`)이
  12~15px 텍스트로는 대비 3:1 안팎이라 안 읽혔다. 텍스트로 쓰이는 것만 `#a85f00`, `#c62d22`,
  `#0062cc`로 내렸다. 뱃지 *배경*색은 그대로다. 보조 회색도 `#8e8e93` → `#6e6e73`.

**배경은 임시값이다.** 사용자가 "배경은 다른 거로 할거야"라고 했다. `base.css`의 `--app-backdrop`
**한 줄**만 갈아끼우면 되고, 사진이면 `--app-backdrop: url('/bg.jpg');`로 끝난다(body에
`background-size: cover`가 이미 걸려 있다). 새 배경이 어두우면 `--glass-bg` 계열 흰색 알파를
올리거나 다크모드 블록의 어두운 유리 토큰을 `:root`로 옮기면 된다. **배경을 바꾸면 위 텍스트 대비를
한 번 다시 볼 것** — 유리가 투명해서 배경색이 글씨 밑까지 올라온다.

**아직 안 한 것 — 1차 피드백 3개 중 2개가 남아있다.** 리퀴드 글라스는 그중 "블러 없음"만 해결한다:
1. 컬러 이모지(🔥❄️🌫️🍀🌵😷😀)가 여전히 카드마다 붙어 있다. 애플 앱이라면 단색 라인 아이콘(SF
   Symbols류)을 쓴다. → 인라인 SVG로 교체하는 작업이 남아있다.
2. 카드 하나에 뱃지가 4~5개씩 나열된다. 반투명으로 톤은 낮췄지만 개수는 그대로다. 정보 위계를
   줄이는 건 화면 구성을 바꾸는 일이라 사용자 확인이 필요하다.

### 3차: 교재 UI Library 챕터(231~249p) 적용 (2026-08-21, 같은 브랜치)

사용자가 "249페이지까지 작업해봐"라고 해서 교재 231~249p(UI Libraries 챕터)를 진행했다.

- **Element Plus 설치·등록** (교재 234~236p): `npm install element-plus`, `src/main.js`에
  `import ElementPlus from 'element-plus'` + CSS + `app.use(ElementPlus)`.
- **Code Challenge 3개** (교재 246~248p)를 `src/components/practice/uilib/`에 새로 만들어
  `/practice`에 등록했다: `ElRegisterForm.vue`(회원가입 폼 + ElMessage 검증),
  `ElProductCounter.vue`(el-input-number + el-rate), `ElFeedbackProgress.vue`(el-progress
  게이지 애니메이션 + ElMessageBox 삭제 확인창). 세 갈래 검증 로직(빈 이메일/약관 미동의/정상 가입,
  진행률 0→100·중복클릭 가드, 확인창 취소)을 Chrome에서 실제로 클릭해 전부 확인했다.
- **249p Hands on**을 "교재대로 전면 적용" 범위로 진행 (사용자가 세 선택지 중 직접 골랐다 — 유리
  디자인이 대부분 덮인다는 것도 알고 고른 것).
  Element Plus로 통째로 바꾼 것:
  - `BaseDashboardCard.vue` → `el-card` 한 줄 래퍼로 교체. 이 파일 하나가 4개 화면(홈/요약/상세/소개)
    에서 재사용되고 있어서, 여기만 바꾸면 그 화면들의 카드가 자동으로 el-card가 된다 — 지렛대가
    가장 큰 지점이라 제일 먼저 손댔다.
  - `UnitToggler.vue` → `el-switch`(inline-prompt, °C/°F)
  - `SearchBar.vue` → `el-input`(clearable, prefix 아이콘)
  - `App.vue` 내비 → `el-menu`(mode="horizontal", `router` prop으로 클릭 시 자동 push, index=경로)
  - `WeatherCard.vue` → `el-card` + 뱃지 전부 `el-tag`(hot/bad→danger, cool/humid/code→info,
    good/fine/segment→success, dry→warning, budget→primary, priority A/B/C→danger/warning/info) +
    `el-button`(상세보기)
  - `WeatherHomeView.vue` → 공휴일/1순위도시/상태바 배너를 `el-alert`로, 예산 입력을
    `el-input-number`로, 새로고침을 `el-button`으로, 도시 카드 목록을 `el-row`/`el-col`
    (`:span="24" :md="12"`)로 감싸 넓은 화면에서 2열 그리드가 되도록, 로딩은 `el-skeleton`, 빈 결과는
    `el-empty`, Watcher 로그는 네이티브 `<details>` 대신 `el-collapse`로.
  - `WeatherSummaryView.vue` → 표를 `el-table` + `el-table-column`으로. **`show-summary` +
    `summary-method`를 썼다** — 합계 행을 직접 그리지 않고 Element Plus가 계산해서 그려준다(교재
    242p가 Table을 "정렬, 필터, 합계 연산이 탑재된 끝판왕 그리드"라고 설명한 그 기능). 우선순위는
    `el-tag`, 예산 입력은 `el-input-number`, 프리셋 버튼은 `el-button-group`.
  - `WeatherDetailView.vue` → 관측 정보와 예산 편성을 `el-descriptions`(교재 241p "이름:값 정갈한
    명세서 표")로, 로딩은 `el-skeleton`, "도시 없음"은 `el-empty`, 하단 버튼은 `el-button`.
  - `WeatherAboutView.vue` → 하단 버튼만 `el-button`.
- **검증**: `npm run build` 통과, `npm run lint`는 기존 SampleTwo 에러 1건만. Chrome으로 `/`(홈 2열
  그리드+검색 필터+URL 쿼리 동기화+el-collapse 로그), `/summary`(el-table 합계 행 숫자 검산까지),
  `/weather/city_05`(el-descriptions), `/about`, `/practice`(Element Plus 실습 3개 전부 클릭 검증)
  실제 렌더링과 인터랙션을 확인했다.
- **리퀴드 글라스와의 관계**: `--glass-*` 토큰 자체는 그대로 살아있고 `.practice-section`,
  `el-menu`의 active 탭, `WeatherCard`의 hover 등 일부 표면에는 여전히 적용돼 있다. 다만 el-card,
  el-table, el-input 등 Element Plus 컴포넌트 본체는 자체 흰 배경/보더를 갖고 있어서 유리 느낌이
  약해졌다 — 사용자가 "교재대로 전면 적용"을 직접 선택하면서 이 트레이드오프를 인지하고 골랐다.

이어서 할 사람: 1차 피드백 중 남은 것(컬러 이모지 → 라인 아이콘, 뱃지 개수 줄이기)과 el-card/
el-table 표면에 유리 효과를 다시 입힐지는 사용자에게 먼저 물어볼 것 (기존 코드 수정은 착수 전에 항상
확인받는 게 이 프로젝트 규칙이다 — 아래 6번 참고). 249p의 2·3번(외부 API로 기능 확장)은 사용자가
"지금은 날씨 UI만"이라며 스킵을 선택했다 — 이후 세션에서 다시 물어볼 것.

### 4차: "마케팅에 치중됐다" 기획 재작업 — 경영 의사결정 4축 + 전국 확장 + 히어로 패널 (2026-08-21)

사용자가 "기본 컨셉이 날씨×경영 의사결정인데 지금은 마케팅에 너무 치중됐다"며 실제 서비스를 조사해서
기획해보라고 했다. AccuWeather for Business, Tomorrow.io Retail, 케이웨더 날씨경영, 기상청 날씨경영
인증제를 WebSearch로 조사한 결과 공통적으로 **마케팅/재고/인력/리스크경보 4개 축**을 다뤘는데, 우리
앱은 마케팅 1개 축(`getSegment()`)만 하고 있었다. 조사 결과를 바탕으로 기획을 제안하고 사용자 승인을
받은 뒤 구현했다.

- **경영 의사결정 4축 확장** (`src/data/weatherMock.js`에 `buildInventoryAdvice`/
  `buildStaffingAdvice`/`buildRiskAlerts` 3개 순수 함수 추가, 기존 `gradeCity`/`getSegment`/
  `buildBudgetPlan`은 안 건드림):
  - 📦 재고: 원본 기온(28도↑/5도↓ 임계값)으로 냉장·방한 상품 발주 권고. `gradeCity()`의 등급(1~3)은
    이상치와의 "거리"만 알려줘서 덥다/춥다 방향을 못 가리므로 원본 수치를 직접 봤다.
  - 👥 인력: `weatherMain`(OpenWeatherMap 응답에 이미 있던 필드, `weatherApi.js`에서 새로 꺼내 쓰기만
    함 — API 호출 추가 없음)으로 강수 감지 → 실내 인력 강화 권고.
  - ⚠️ 경보: 폭염(33도↑)/한파(0도↓)/미세먼지 매우나쁨(75↑)/습도 매우높음(85↑) 극값 감지 시 경보,
    없으면 안전 알림.
  - ponytail 주석으로 명시: 실제 서비스는 과거 매출-기상 상관관계(임계온도)로 이 값을 뽑지만 우리는
    매출 데이터가 없어서 `GRADE_STANDARD`와 같은 결의 고정 임계값 휴리스틱을 썼다. 실 매출 데이터가
    생기면 그걸로 교체하는 게 다음 단계.
  - `WeatherCard.vue`와 `WeatherDetailView.vue` 둘 다 "의사결정 보조 지표" 섹션을 `el-tabs`
    4탭(🎯마케팅/📦재고/👥인력/⚠️경보)으로 바꿨다. Chrome에서 실제로 탭 4개를 순서대로 클릭해 각기
    다른 문구가 나오는 것까지 확인했다.
- **전국 확장**: 5개 도시(서울/광주/울산/수원/부산) → 전국 17개 시·도 대표 지점. 8개 특별·광역시는
  그 시 자체, 9개 도는 도청 소재지 좌표를 썼다(임의로 아무 도시나 고른 게 아님). `weatherMock.js`의
  `weatherList` 배열 하나만 늘렸고 `gradeCity`/`buildBudgetPlan`/`fetchCityWeather` 등은 도시 개수에
  무관하게 동작해서 다른 코드는 안 건드렸다. API 호출은 새로고침 1회에 17개 지역 × 2종 = 34회로
  늘었다(OpenWeatherMap 무료 티어 분당 60회 한도 안쪽, 4번 known-issues 항목 갱신 필요).
- **히어로 패널** (`WeatherHomeView.vue` 최상단, 대시보드 카드 그리드 위): 사용자가 Dribbble의
  "Inventory Management Dashboard"(어두운 패널 + 네온 라임 포인트 + 사진 위에 뜬 유리 통계 카드)를
  레퍼런스로 던졌다. 그 사진(창고 컨베이어벨트)과 문구를 그대로 베끼지 않고, **같은 레이아웃 스타일만
  가져와 우리 날씨 데이터로 재해석**했다:
  - 배경은 사진 대신 **대표 지역(1순위 집행 지역)의 실시간 날씨(`weatherMain`)에 따라 자동 전환되는
    순수 CSS 배경** 4종(맑음=태양 글로우, 흐림=회색 구름 블롭, 비=대각선 빗줄기 애니메이션, 눈=점무늬
    스노우 애니메이션). 사진이 아니라서 저작권 문제가 없고 실데이터에 반응한다.
  - 우측 상단 `el-segmented`(🔄실시간/☀️맑음/☁️흐림/🌧️비/❄️눈)로 사용자가 테마를 직접 골라
    미리볼 수도 있다 — "실제 날씨도 좋고 직접 선택해서 바꾸는 것도 좋다"는 요청 반영.
  - 떠 있는 유리 통계 카드 4개: 전국 평균 기온 / 최우선 집행 지역 / 리스크 감지 지역 수 / 총 배정
    예산. 전부 기존 `budgetPlan`/`buildRiskAlerts`에서 계산 — 새 데이터 소스 없음.
  - 지역별 집행 점수를 네온 라임 막대그래프로 (레퍼런스의 "Sales increase" 미니 차트 자리).
  - **버그 1건 잡음**: `.hero-title`(h1)에 색을 명시 안 해서 `practice.css`/`exercise.css`의 전역
    `h1 { color: #1c1c1e }` 규칙에 깔려 글씨가 거의 안 보였다. 상속은 명시적 규칙에 항상 지므로
    `.hero-title`에 `color: #fff`를 직접 박아서 고쳤다.
- **왓쳐 로그 제거**: `WeatherHomeView.vue`의 "👁️‍🗨️ Watcher 로그 보기" `el-collapse` 패널을
  사용자가 "빼도 되겠다"고 해서 지웠다. UI만 지운 게 아니라 그걸 먹이던 `LOG_LIMIT`/`history`/`logs`/
  `addLog`와 `watch(selectedCityInfo)`/`watchEffect(검색어 추적)`/`watch(total, 로그용)` — addLog만
  호출하던 워처 3개까지 전부 같이 지웠다. `selectedCityInfo` 자체(상태바 el-alert가 씀)와
  `watch(searchQuery, URL 동기화)`는 다른 일을 하는 코드라 남겼다.
- **검증**: `npm run build` 통과, lint는 기존 SampleTwo 에러 1건만. Chrome으로 `/`(17개 카드 로드,
  4탭 각각 클릭, 히어로 4테마 전환), `/summary`(17행 el-table), `/weather/city_08`(세종 상세) 확인.

이어서 할 사람: 히어로 패널의 색(네온 라임 `#d4ff4d`)이 리퀴드 글라스 파스텔 톤과 안 어울릴 수 있다 —
사용자가 배경(`--app-backdrop`)을 다른 걸로 바꾸겠다고 예고했던 것([[design-direction-ios]] 참고)과
합쳐서 볼 때 전체 톤을 한 번 맞출 필요가 있을 수 있다. 1차 피드백 잔여 항목(이모지→아이콘, 뱃지 개수)도
여전히 안 건드렸다.

### 5차: "산출물 퀄리티가 낮다" 지적 → 경쟁작 10곳 조사 후 전면 재구성 (2026-08-21)

4차 직후 사용자가 "다 한거라고?"라며 의심해서 Chrome으로 다시 클릭 검증(콘솔 에러 확인, 탭 4개 실제
클릭)했고, 이어서 "산출물이 솔직히 좀 구려"라며 팀원들이 공유한 SKALA Vue 실습 사이트 10곳
(kchanis1223, inwoo-daily-hub, skala-vue-olive/steel/gamma/drab, weather-insight-ko, jinsu1011,
aeginventor, skala-vue-five)을 Chrome으로 전부 열어보고 참고해서 다시 구성하라고 했다.

**조사 결과 — 강한 경쟁작들의 공통점**: jinsu1011("SKALA Weather Globe" — 태양계를 3D로 돌리다 지구를
클릭하면 지구본으로 줌인), skala-vue-five("My Weather" — 이모지 대신 하프톤 도트 구름 아이콘 + 흑백
절제 타이포 + 일출일몰/의상추천), aeginventor("날씨 Dock" — 뉴브루탈리즘 굵은 테두리), weather-insight-ko
(토스풍 절제된 카드 + 소수점 정밀도) 넷 다 **이모지를 아이콘 대신 쓰지 않는다**는 게 공통이었다.
우리는 🔥❄️🌫️🍀🌵😷😀 등 이모지를 UI 아이콘 대신 쓰고 있었다 — 이건 사실 1차 피드백 때 이미 지적받고
메모리에 적어놓고 계속 미뤄온 항목이었다.

**사용자가 정한 재구성 방향**: 시각 언어를 하나로 통일하되 **"리퀴드 글라스는 최대한 살리고, 유리
질감을 극대화"**. 즉 경쟁작들의 절제된 룩을 따라가되 우리 고유 정체성(유리)은 강화하는 쪽.

적용한 것:
- **이모지 → Element Plus 아이콘 전면 교체** (`@element-plus/icons-vue`, `element-plus`의 간접
  의존성으로 이미 깔려 있던 걸 `package.json`에 직접 의존성으로 명시). `weatherMock.js`의
  `getSegment`/`buildInventoryAdvice`/`buildStaffingAdvice`는 이제 이모지 문자열이 아니라 `key`
  슬러그(`outdoor`/`indoor`/`hot-drink`/`rain` 등)만 반환하고, 각 `.vue` 파일이 `key → 아이콘
  컴포넌트` 매핑(`SEGMENT_ICON`/`INVENTORY_ICON`/`STAFFING_ICON` 객체)을 갖는다 — 데이터 함수는
  프레임워크 무관하게 순수하게 두고, 아이콘 선택(표현)은 프레젠테이션 레이어 책임으로 분리했다.
  Element Plus 아이콘 세트(293개)에 눈 아이콘이 없어서 그것 하나만 `WeatherHomeView.vue`에 `h()`로
  직접 그린 6줄짜리 SVG(`SnowflakeIcon`)로 대체했다.
- **카드 밀도 축소**: `WeatherCard.vue`/`WeatherDetailView.vue`의 마케팅 탭이 태그 4개(우선순위/등급/
  세그먼트/예산)를 늘어놓던 걸 대표 태그 1개(세그먼트) + 보조 텍스트 한 줄("우선순위 A · 등급 3-3-3 ·
  170만원(17%)")로 압축했다.
- **히어로 패널 재작업 — 네온 다크 → 리퀴드 글라스**: Dribbble 레퍼런스로 만들었던 어두운 네온 라임
  패널을 걷어내고, `.hero-sky`(맑음/흐림/비/눈 하늘 그림, 기존 4차 CSS 재사용)를 뒤에 깔고 그 위에
  `.hero-glass`(`var(--glass-bg-strong)` + `--glass-blur-strong` + `--glass-sheen` + 흰 보더 +
  `--shadow-glass`)를 여백 10px을 두고 얹어서 "하늘 위에 유리판이 떠 있다"가 보이게 했다. 텍스트는
  흰색에서 앱 기본 다크(#1c1c1e)로 바꿨다 — 유리가 이제 하늘색을 중화해서 흰 배경 위 다크 텍스트와
  같은 대비 규칙을 쓸 수 있다. 차트 막대도 네온 라임에서 `var(--color-accent)`(시스템 블루)로 바꿔서
  기존 앱 색 언어에 맞췄다.
- **유리 질감 극대화**: `WeatherCard.vue`에 hover 시 대각선으로 빛이 스치는 shine-sweep(`::before` +
  `transform: translateX` 트랜지션)을 추가했다. 히어로 글라스에는 하나만 있는 요소라 hover 대신
  7초 주기로 자동 반복되는 은은한 shine 애니메이션을 넣었다(`@keyframes hero-shine`).
- **히어로 자동 순환** (사용자 추가 요청 "대시보드는 일정 시간이 지나면 다른 도시로 바뀌게"): 히어로가
  1순위 도시에 고정돼 있으면 정적으로 느껴진다는 지적으로, `spotlightIndex`를 6초마다 다음 지역으로
  넘기는 `setInterval`을 추가했다(`onMounted`에서 등록, `onUnmounted`에서 해제). 배지 문구와 하늘
  배경이 같이 바뀌고, 아래 차트에서 지금 순환 중인 지역의 막대만 살짝 떠오르며 진해진다
  (`.hero-bar.is-spotlight`). 사용자가 세그먼트로 테마를 직접 골라 미리보는 동안에도 인덱스는 계속
  돌아가지만 `heroTheme` computed가 override를 우선하므로 화면엔 영향이 없고, "실시간"으로 되돌리면
  이어서 보인다.
- **검증**: `npm run build`/`lint` 통과(기존 SampleTwo 에러 1건만), Chrome으로 `/`(17개 카드, 탭 4개
  아이콘 확인, 히어로 배지가 6초 뒤 실제로 "제주"→"서울"로 바뀌는 것까지 자바스크립트로 값 비교해서
  확인), `/summary`, `/weather/city_01`(4탭 아이콘 간격 버그 발견해서 그 자리에서 고침), `/about`
  전부 재확인.

이어서 할 사람: 히어로의 자동 순환이 재밌지만 카드 그리드(17개)까지 순환에 맞춰 스크롤/하이라이트하는
건 아직 안 했다 — 필요하면 물어볼 것.

### 6차: "배경 알록달록 왜 유지해, 정신없게 하지 말고 유리 굴절을 살려라" — 실사 배경 + 진짜 굴절 (2026-08-21)

5차 직후 사용자가 "아직도 구리다"며 세 가지를 정확히 짚었다: (1) `--app-backdrop`(페이지 전체
배경)이 여전히 4차 이전 무지개 파스텔 그대로다, (2) 유리를 극대화하라고 했더니 shine-sweep
애니메이션으로 정신없게만 만들었다 — 원한 건 유리의 투명함·굴절이다, (3) SKALA Weather Globe(3D
지구본)까지 조사해놓고 반영된 게 없다. 이어서 "iOS 리퀴드 글라스 특유의 프리즘 무지갯빛 되나?"라고
물어서 SVG 굴절 필터를 실제로 넣었고, 그 뒤 "실사 테마로"라는 요청으로 배경을 사진으로 바꿨다.

- **무지개 블롭 배경 완전 제거**. `--app-backdrop` 토큰 자체를 지우고, App.vue에
  `.app-backdrop-layer`(position: fixed, 뷰포트 전체를 덮음)를 새로 추가해서 **히어로 안에 갇혀
  있던 "지금 날씨" 배경을 앱 전체로 끌어올렸다** — 이게 Weather Globe에서 가져온 실제 원칙이다
  ("화면 전체가 실제 상태 위에 놓여 있다"). 계산은 여전히 `WeatherHomeView.vue`가 하고(대표 지역
  순환, weatherMain→테마 매핑), 결과값만 새 Pinia 스토어 `weatherThemeStore.js`에 담아 App.vue가
  구독한다 — 다른 화면(요약/상세/소개)으로 이동해도 마지막 테마가 유지된다.
- **진짜 굴절 렌더링을 확인하고 나서 붙였다.** `$CLAUDE_JOB_DIR/tmp`에 줄무늬 배경 위 3개 패널
  (blur만/굴절+blur/굴절만)을 놓은 순수 HTML을 만들어 로컬 서버로 띄워 직접 눈으로 확인 — 매끈한
  그라데이션에서는 배경-필터 자체가 걸려도 육안으로 안 보인다는 것도 이 과정에서 알았다. 이후
  App.vue에 SVG `<filter id="glass-refraction">`(feTurbulence + feDisplacementMap)를 문서에 한 번
  심어두고, `backdrop-filter: url(#glass-refraction) var(--glass-refract-blur)`로 여러 표면에서
  재사용한다. `--glass-refract-blur`(6px, 약한 블러)를 새로 추가했다 — 기존 `--glass-blur-strong`
  (34px)를 그대로 쓰면 블러가 굴절 물결을 다 뭉개서 안 보인다.
- **실사 배경으로 교체.** Unsplash(무료 라이선스)에서 맑음/흐림/비/눈 사진 4장을 검색해 다운로드해서
  `public/weather/{clear,clouds,rain,snow}.jpg`에 커밋했다. "사진 4장 톤앤매너가 다르면 안 된다"는
  지적대로, 4장이 원래 다른 시간대·다른 색감(맑음=밝은 낮, 눈=짙은 밤)이라 그대로 쓰면 테마 전환마다
  이질감이 났다 — 모든 장면에 같은 블루 오버레이(`linear-gradient`) + 같은
  `filter: saturate(88%) contrast(106%)`를 얹어 톤을 하나로 묶었고, 눈 사진만 밤이라 `brightness(1.4)`
  를 추가로 얹어 낮 사진들과 밝기 격차를 좁혔다. 실사진은 그 자체로 결이 풍부해서, CSS로 억지로
  만들었던 합성 줄무늬/점무늬 텍스처 레이어는 걷어냈다(과거엔 굴절이 왜곡할 디테일이 없어서 필요했던
  땜빵이었다).
- **"유리 위 유리" 버그를 하나 더 잡았다.** 카드에 유리를 입혀놓고 실제로는 하나도 안 비쳤는데,
  원인은 `practice.css`의 `div.practice-section`(최상위 컨테이너) 자체가 이미 유리라서 그 안의
  `BaseDashboardCard`/`WeatherCard`가 유리를 3중으로 겹쳐 색이 뭉개진 것이었다 — computed style로
  `background-color: rgba(255,255,255,0.4)`가 잡히는데 실제 렌더는 불투명 흰색으로 보이는 걸 보고
  의심해서 찾았다. Weather* 4개 뷰의 scoped style에서 `.practice-section`을
  `background/backdrop-filter/border/box-shadow: none`으로 투명하게 비웠다(`/practice` 아카이브는
  scoped라 안 건드려짐 — 그쪽은 여전히 유리 섹션 박스가 맞다).
- **레이아웃을 넓혔다.** "좌우가 비어있다, 웹사이트답게 써라"는 지적으로 `.app-container` max-width를
  1200px→1440px로, 카드 그리드를 `:md="12"`(2열)에서 `:lg="8"`(3열, ≥1200px)로 넓혔다. 화면마다
  콘텐츠 폭이 달라 탭 이동 시 폭이 튀어 보이는 문제(el-table에 `style="width:100%"`가 없던 게 원인
  중 하나)도 각 뷰의 `.practice-section`/`.dashboard-wrapper`에 `width: 100%`를 명시해서 없앴다.
- **히어로 이중 테두리 제거.** 처음엔 `.hero-panel`(바깥 액자) 안에 `.hero-glass`(안쪽 유리판)를
  margin 10px로 띄워서 "액자 속에 또 액자"처럼 보였다("테두리가 부자연스럽다") — 프레임은
  `.hero-panel` 하나만 남기고 `.hero-glass`는 그 안을 꽉 채우는 유리 필터 레이어로 합쳤다.
- **Element Plus 폼 컨트롤에 유리를 입혔다.** el-input/el-input-number/el-button이 기본 흰
  배경/회색 테두리 그대로 "덜렁" 놓여 있었다 — Element Plus 자체 CSS 변수가 배경을 계속 흰색으로
  덮어써서 `!important` 없이는 안 먹히는 걸 computed style로 확인하고 나서야 붙였다. **primary/
  success/danger 타입 버튼까지 흰색으로 덮어버리는 부작용을 실제로 만들었다 — 그 자리에서
  `:not([class*='el-button--'])`로 type 없는 기본 버튼만 걸리게 고쳤다** (파란 primary 버튼이
  흰색이 되는 걸 스크린샷으로 직접 확인하고서야 알았다). 세그먼트(el-segmented)도 클릭해야만
  튀어나오던 걸 hover만 해도 살짝 뜨도록 손봤다.
- **폰트를 Pretendard로.** `font-family`에 `Inter`가 1순위였는데 실제로 로드하는 코드가 어디에도
  없어서 처음부터 시스템 폰트로 폴백되고 있었다 — `index.html`에 Pretendard CDN(jsDelivr) 링크
  하나 추가하고 `Inter`를 `Pretendard`로 바꿨다.
- **가독성 버그를 스크린샷으로 발견해서 고쳤다.** h1("종합실습 5")과 각 화면 최상위 h2가 이제 유리
  카드 밖, 사진 배경에 직접 얹혀 있는데 `exercise.css`/`practice.css`의 전역 h1/h2가 다크 텍스트
  (#1c1c1e)로 고정돼 있어서 비/눈처럼 어두운 배경에서는 글자가 거의 안 보였다. h1은 App.vue
  scoped에서, h2는 Weather* 4개 뷰 각각의 scoped `.practice-section > h2`에서 흰 텍스트 + 진한
  text-shadow 두 겹(가까운 그림자+넓은 그림자)으로 바꿔서 밝은/어두운 배경 양쪽에서 다 읽히게 했다.
- **검증**: 매 단계 `npm run build`/`lint` 통과 확인, Chrome으로 4개 테마 전환·페이지 이동을 반복
  스크린샷으로 대조. computed style을 직접 찍어서 "CSS는 걸려 있는데 왜 안 보이나"류 버그 3건
  (굴절 필터 안 보임 → 텍스처 부족, 카드 불투명 → 유리 위 유리, primary 버튼 흰색 됨 →
  selector 범위 문제)을 전부 실측으로 잡았다.

이어서 할 사람: el-table(요약 화면 표)에는 아직 유리를 안 입혔다 — 카드 안에 있어서 크게 안 어색하지만
필요하면 다음 대상. `public/weather/*.jpg`는 Unsplash 무료 라이선스지만 저작자 표시 의무는 없어도
원하면 출처를 남기는 게 좋다(다운로드 당시 사진 ID는 이 커밋 diff의 다운로드 스크립트 참고).

### 6차-보강: apple-design 스킬 뒤늦게 로드해서 대조 (2026-08-21)

6차 작업을 마치고 사용자가 "지금 애플 디자인 스킬 쓰고 있냐"고 물어서, 확인해보니 **이번 세션 내내
`apple-design`(서드파티 플러그인) 스킬을 한 번도 로드하지 않고 있었다** — 사용자는 정확히 이 스킬을
쓰라고 새 세션을 열었던 거였다(플러그인은 설치한 세션 안에서 바로 못 쓰고 새 세션부터 잡힌다는 5차
메모 참고). 뒤늦게 `Skill` 도구로 로드해서 `references/tokens.md`/`components.md`를 우리 코드와
대조했다.

- **확실한 위반 1건 발견해서 고침**: 스킬의 Anti-Patterns에 "Pure white (#FFF) text on dark
  backgrounds — use #F5F5F7"가 명시돼 있는데, 바로 직전 6차에서 h1/h2 가독성 버그를 고치면서
  정확히 `color: #fff`를 넣었었다. `#f5f5f7`로 교체(App.vue, WeatherHomeView/DetailView/
  SummaryView/AboutView 5개 파일).
- **이징 커브를 스킬 표준으로 통일**: `--apple-ease: cubic-bezier(0.25, 0.1, 0.25, 1)` 토큰을
  base.css에 추가하고, el-input 포커스/el-segmented hover/WeatherCard hover의 transition을
  이 커브로 바꿨다(전에는 그냥 `ease`).
- **의도적으로 안 맞춘 것**: 스킬의 Quick Tokens(bg #FFFFFF/#000000, 불투명 카드+옅은 검은
  테두리)는 apple.com 마케팅 사이트 계열 토큰 체계라, 지금 우리가 쓰는 "실사 날씨 사진 배경 +
  반투명 리퀴드 글라스"([[design-direction-ios]]에서 이미 확정된 방향, apple.com 스타일은 후보
  단계에서 기각됐었다)와는 근본적으로 다른 시스템이다. 카드 그림자도 스킬 권장치(light 0.08~0.12)
  보다 진하게 쓰고 있는데, 사진 배경 위 반투명 유리는 그림자가 옅으면 경계가 배경에 묻혀버려서
  일부러 더 진하게 뒀다 — 전면 교체는 안 했다.
- **검증**: `npm run build`/`lint` 통과, Chrome computed style로 h1 색상이 정확히
  `rgb(245, 245, 247)`로 적용된 것 확인.

이어서 할 사람: apple-design 스킬의 스페이싱(8px 그리드)/타이포 스케일(hero 80px~caption 12px)은
이번엔 시간상 손 안 댔다 — 지금 쓰는 임의 px 값들(18px, 22px 등)을 그리드에 맞추는 작업이 남아있다.

### 7차 — 알약(pill) 습관 제거, 서비스 소개 인라인화, 히어로/대시보드 2단 레이아웃

한 세션 안에서 이어진 자잘한 실사용 피드백 묶음.

- **탭 오버플로우 화살표 버그 고침**: `WeatherCard.vue`의 `el-tabs`(마케팅/재고/인력/경보 4개)가
  3열 그리드처럼 카드가 좁아지면 Element Plus가 자동으로 좌우 스크롤 화살표를 튀어나오게
  했다("탭에 반응형으로 버튼 돌출") — `.decision-tabs__item` padding/font-size를 줄여서 화살표
  없이 4개가 다 들어가게 고쳤다.
- **하단 "카드를 클릭하거나 검색하세요" 상태 배너 제거**: 아무 정보도 안 주는 죽은 UI였다.
  `WeatherCard.vue`의 `select-card` emit과 `WeatherHomeView.vue`의 `selectedCityInfo`/
  `el-alert.status-bar`를 통째로 걷어냈다.
- **프리즘 굴절 강도 상향**: `App.vue`의 `feDisplacementMap scale`을 22 → 34로. 가독성이 깨지는지
  걱정했는데, 유리 패널 자체가 불투명도 높은 흰 배경(`--glass-bg-strong`)이라 텍스트는 항상 그
  위에 얹혀 있고 굴절은 유리 뒤로 비치는 하늘 사진에만 걸린다 — 실제로 스크린샷 확대해서 hero
  타이틀/스탯 숫자 다 또렷하게 읽히는 것 확인했다.
- **히어로/대시보드를 진짜 2단 레이아웃으로**: "가운데 정렬 1단 레이아웃뿐이다"라는 지적에 따라
  `WeatherHomeView.vue`를 다시 짰다.
  - 히어로(`.hero-glass`)를 `grid-template-columns: 1.15fr 1fr`로 갈라 왼쪽(배지/제목/설명/막대
    차트)과 오른쪽(4개 통계를 2×2로)을 나란히 배치.
  - 공휴일 배너 + 검색/예산 카드를 `<aside class="dashboard-sidebar">`로 빼고, 도시 카드 그리드는
    `<main class="dashboard-main">`에 남겨 `.dashboard-body`(≥960px에서
    `minmax(260px,300px) 1fr`, 사이드바 `position: sticky`)로 좌우 배치. 카드 열수는 사이드바가
    생긴 만큼 3열(`:lg="8"`)에서 2열(`:md="12"`)로 줄였다.
- **"클로드 특유의 알약(pill) 모양" 습관 제거**: 사용자가 "너는 항상 알약 모양을 쓰더라" —
  애플 실제 UI(세그먼트 컨트롤, 탭 선택 표시, 작은 배지 등)도 실제로는 완전한 캡슐이 아니라 둥근
  사각형(8~12px)이라는 걸 스킬 문서로 확인하고 전면 교체했다:
  - `WeatherCard.vue`/`WeatherSummaryView.vue`의 모든 `el-tag round` → `round` 제거(기본
    사각 배지 + `base.css`에서 8px 통일).
  - 상세보기/새로고침 `el-button round` → `round` 제거. `base.css`에 타입 없는 버튼과
    primary/success/warning/danger 버튼 공통으로 `border-radius: 10px !important` 추가.
  - `App.vue` 상단 네비 활성 탭: `var(--radius-pill)` → `10px`.
  - `WeatherHomeView.vue` 히어로 배지, `base.css`의 `el-segmented__item` hover: `var(--radius-pill)`
    → `8px`.
  - `--radius-pill` 토큰 자체는 `/practice` 아카이브(`practice.css`/`exercise.css`)에서 여전히
    쓰고 있어서 안 지웠다 — 날씨 대시보드 쪽에서만 걷어냈다.
- **"서비스 소개" 탭을 없애고 메인 화면에 인라인**: 별도 `/about` 탭으로 분리할 필요 없다는 피드백.
  `App.vue`의 `el-menu-item index="/about"`을 지워서 상단 네비에서 뺐고(라우터의 `/about` 경로
  자체는 남겨뒀다 — 직접 URL로는 여전히 들어가지고, `router/index.js`의 `afterEach` 문서 제목
  로직도 그대로 유효하다), `WeatherAboutView.vue`의 내용을 줄여서 `WeatherHomeView.vue` 맨 아래에
  `.about-inline` 카드로 붙였다.
- **검증**: `npm run build` 통과. 크롬으로 새로고침 후 실제 렌더링 확인 — 네비/세그먼트/태그/버튼이
  전부 둥근 사각형으로 바뀐 것, 히어로 2단·대시보드 사이드바+메인 2단이 실제로 렌더되는 것, 페이지
  하단에 서비스 소개 카드가 붙은 것, 콘솔에 에러 없는 것(예전 `boxWidth` 경고는 새로고침 전 캐시된
  메시지였고 지금은 재현 안 됨)을 확인했다.

### 8차 — 히어로 배경 중복 제거, 페이지 폭 통일 버그, el-alert/el-table 유리화

7차 직후 실사용 피드백이 더 들어와서 바로 이어 작업했다. (모델을 Opus로 바꿔달라는 요청은 대화
안에서 Claude가 스스로 할 수 있는 조작이 아니라서 — 사용자가 `/model` 명령이나 클라이언트
설정으로 직접 바꿔야 한다고 안내했다. 이번 8차는 계속 같은 모델로 진행.)

- **히어로가 자기만의 사진을 또 깔고 있던 문제 고침**: "지역별 날씨 대시보드 배경은 왜 미리
  들어가 있지? 이것도 뒤가 비쳐야지" — `.hero-sky`가 App.vue의 앱 전체 배경(`.app-backdrop-layer`)
  과 똑같은 사진을 자기 것으로 한 번 더 그리고 있었다. 다른 유리 패널(내비/WeatherCard 등)처럼
  자기 이미지 없이 앱 배경을 `backdrop-filter`로 그대로 투과하도록 `.hero-sky` div와 CSS를
  지우고, `.hero-glass`에 직접 `border-radius`를 줬다.
  ([`src/views/WeatherHomeView.vue`](src/views/WeatherHomeView.vue))
- **탭 전환 시 창 전체가 들썩이는 문제 고침**: 모든 라우트가 동적 import라 청크 로딩 사이에
  `RouterView`가 잠깐 비어 높이가 0으로 꺼졌다 튀어 올랐다. `App.vue`에 `.route-stage{min-height:
  80vh}` + `<Transition name="route-fade" mode="out-in">` 크로스페이드를 넣어 붕괴와 급전환을
  둘 다 없앴다.
- **페이지 폭이 화면마다 달랐던 진짜 원인 발견**: "전체 페이지 너비를 좀 통일감 있게 맞춰" —
  `getComputedStyle`로 추적해보니 `.app-container`(max-width:1440px) 자체는 문제가 없었고,
  그 조상인 `#app`이 범인이었다. Vite/Vue 스캐폴드가 남긴
  `src/assets/main.css`의 `#app{max-width:1280px}` + `@media(min-width:1024px){body{display:
  flex}}` 규칙 때문에 `#app`이 flex 아이템으로 "내용물 크기만큼" shrink-to-fit 되고 있었다 —
  표가 있는 화면과 2단 그리드가 있는 화면의 내용물 크기가 서로 달라서 페이지마다 실제 폭이
  달라진 것(예: `/summary`에서 `.app-container`가 1440px가 아니라 760px로 렌더됨을 확인).
  `.app-container`가 폭을 전담하므로 이 레거시 `#app`/`body` 규칙을 지웠다 — 지운 뒤
  `getBoundingClientRect().width`로 1440px 고정 확인.
- **"기존 거는 싹 다 리퀴드 글라스로 덮어라" — el-alert/el-table 기본 스킨 제거**:
  `base.css`에 전역 오버라이드 추가.
  - `el-table`: 불투명 흰 배경 + 각진 셀 테두리 → 투명 배경 + 옅은 유리 구분선(`--el-table-*`
    CSS 변수를 직접 덮어씀), 헤더만 살짝 옅은 프로스트.
  - `el-alert`: 처음엔 타입별(info/success/warning/danger) 반투명 색상 배경으로 시도했는데,
    하늘 사진 자체가 파란 계열이라 파란 알림이 배경에 묻혀 대비가 깨졌다 — "톤앤매너는 하나로
    족해" 피드백과 맞물려서, 배경은 다른 카드와 똑같은 흰 유리(`--glass-bg-strong` +
    굴절 `backdrop-filter`) 하나로 통일하고 의미 색은 아이콘 색상에만 남겼다.
- **WeatherDetailView.vue 정보 위계 재구성**: el-descriptions 격자 표 한 줄에 묻혀 있던 실시간
  기온을 WeatherCard와 같은 "큰 숫자" 문법(`.detail-hero`, 56px)으로 올렸다. "등급 판정"도
  `<p>` 텍스트 3줄 나열 대신 3개 스탯 칩(`.grade-row`)으로. 참고 사이트
  `skala-vue-weather-murex.vercel.app`("RUNNING WEATHER")의 큰 숫자 하이라이트 + 깔끔한
  카드 위계를 참고했다(사용자가 "지구본 페이지랑 체급 맞춰 얼마든 차용해도 돼"라고 명시적으로
  허용).
- **검증**: `npm run build` 통과. 홈→상세→요약 왕복하며 폭이 항상 1440px로 고정되는 것, 히어로가
  더는 이중 배경 없이 앱 배경을 그대로 투과하는 것, 알림 배너들이 전부 같은 흰 유리 톤인 것,
  콘솔 에러 없는 것을 크롬으로 직접 확인했다.

**도시 검색 카드 재작업 (8차 후속)**: "도시검색 안쪽 박스도 좀 바꿔라" — 사이드바 카드 안쪽이
Element Plus 기본 폼 그대로였다.
- `SearchBar.vue`: 옅은 회색 바라 비활성처럼 보이던 `el-input`을 iOS 검색 필드 톤으로
  (배경 대비 상향, 높이 36px, radius 10px, placeholder/prefix 색 정리). "검색 중인 도시: (전체)"
  맨몸 텍스트는 상태 칩으로 바꿔서, 전체일 땐 회색 / 검색 중일 땐 파란 강조로 필터 여부가
  한눈에 보이게 했다.
- **줄바꿈 버그**: 좁은 사이드바에서 라벨+인풋을 한 줄 flex로 밀어넣어 "마케팅 총 예산(만 /
  원):"처럼 단어 중간에서 끊겼다 — 라벨 위 / 인풋 아래 전체 폭으로 쌓는 `.budget-field`로 교체.
- `el-input-number`: 흰 박스 + 진한 세로 구분선을 지우고 투명 배경 + 호버 시에만 반응하는
  화살표로. 숫자도 가운데 정렬 → 왼쪽 정렬(Element Plus가 같은 선택자로 `text-align:center`를
  걸어둔 걸 computed로 확인하고 `!important`로 덮음)해서 라벨과 같은 축에 맞췄다.
- **검색 1건일 때 히어로 차트가 깨지던 버그**: `.hero-bar`가 `flex:1`이라 결과가 1개면 막대
  하나가 폭 전체로 늘어나 그래프가 아니라 거대한 파란 띠가 됐다 — `max-width:44px` 상한 추가.
  (실제로 "서울" 검색해서 재현/수정 확인)

### 9차 — 전 페이지 순회, 실습 아카이브 신설, 남은 기본 템플릿 제거

"모든 페이지를 순회하며 애플 스타일이 아닌 곳을 국소적이라도 고칠 것 / 실습 아카이브 추가 /
가독성 나쁘거나 혼자 동떨어진 박스는 전부 덮을 것" 요청으로 8차에서 남겨뒀던 화면까지 전부 돌았다.

- **실습 아카이브 신설** (`PracticeView.vue` 전면 재작성): 39개 실습을 `<br><hr><br>`로 이어붙인
  단일 스크롤이었다. 폴더 구조(basic/render/binding/…)가 이미 단원을 뜻하고 있어서 그대로 살려
  **9개 단원 사이드바 + 단원별 본문**으로 재구성했다. 대시보드의 사이드바와 같은 그리드/스티키
  문법을 써서 화면끼리 톤이 어긋나지 않는다. 내비 라벨과 라우트 타이틀도 "단원별 실습" →
  "실습 아카이브"로 통일.
  - 처음엔 각 실습 위에 이름표를 얹었는데, 실습 컴포넌트가 자기 안에 이미 제목을 갖고 있어서
    같은 문구가 두 번 나왔다("Hello Skala-Vue") — 이름표를 걷어냈다.
- **/practice 폭 통일**: `practice.css`의 `.practice-container{max-width:800px}` 때문에 이
  화면만 갑자기 좁아졌다 — 8차에서 고친 `#app` 문제와 같은 결의 잔재라 같이 걷어내서 전 페이지가
  1440px 한 폭으로 맞았다.
- **/practice 카드 톤 불일치**: `.practice-section`만 `--glass-blur`(blur 30px)를 써서 뒤 하늘이
  균일한 파란 덩어리로 뭉개졌다 — 앱의 다른 카드와 같은 굴절 + 약한 블러로 통일.
- **NotFoundView.vue**: 이모지(🌤️❓) + 가운데 정렬 문단 3줄 + 화면을 꽉 채우는 빈 카드였다.
  아이콘으로 교체하고, 스킬이 명시한 안티패턴인 "본문 가운데 정렬"을 왼쪽 정렬로, 카드도 내용에
  맞는 크기(max-width 460px)로 줄였다.
- **WeatherAboutView.vue**: `<ul><li>` 맨몸 목록이라 유리 카드 안에 브라우저 기본 불릿만
  덩그러니 있었다 — 체크 아이콘 + 정돈된 행으로 바꾸고 카드/타이포를 앱 표준에 맞췄다.
- **el-table 행이 불투명 흰색이던 버그**: 8차에서 셀(`td/th`)만 투명하게 해놨는데 정작 `tr`이
  `rgb(255,255,255)`로 남아 있었다(computed로 확인) — 지표 요약 표가 유리 카드 안에 홀로 떠 있는
  **흰 슬래브**로 보이던 원인("혼자 동떨어진 박스"). `tr`까지 투명하게 내려서 표 너머로 하늘이
  비친다.
- **el-button-group 회귀 수정**: 7차에 넣은 전역 `border-radius:10px !important`가 버튼 그룹까지
  먹어서 붙어 있어야 할 500/1000/2000 3개 버튼이 각각 둥근 사각형으로 떨어져 보였다 — 그룹은
  바깥 모서리만 둥글게 되돌렸다.
- **저대비 텍스트**: 지표 요약 안내 문구가 `#868e96`이라 반투명 유리 위에서 흐렸다 — 앱 표준
  보조 텍스트 색(`#6e6e73`)으로. 전체를 grep해서 다른 저대비 색이 없는 것도 확인했다.
- **마지막 남은 알약**: `practice.css`의 `.btn-external`이 `--radius-pill`을 쓰고 있었다 → 10px.
- **"←" 문자 → 아이콘**: 상세 화면 버튼이 화살표를 문자로 박아 쓰고 있어서 아이콘으로 교체.
- **검증**: `npm run build` 통과. 홈/요약/상세/아카이브/소개/404를 모두 크롬으로 돌며 렌더링과
  콘솔을 확인했다. 아카이브는 단원을 실제로 클릭해 전환까지 확인. 중간에 뜬 `Back`/`ArrowLeft`
  미정의 경고는 Vite HMR이 스크립트 변경을 못 따라간 것으로, 새로고침 후 재현되지 않는 것까지
  확인했다(패키지 export 존재도 node로 직접 확인).

### 10차 — 지도 시각화, 5일 예보 API, 실습 아카이브를 참고 사이트 /lab 구조로

- **전국 집행 점수 지도 신설** (`components/weather/WeatherMap.vue`): 참고 사이트가 전국 지도 위에
  지역별 지수를 세워 보여주는 걸 우리 지표(집행 점수)로 옮겼다. **지도 라이브러리를 새로 붙이지
  않고**, 이미 갖고 있던 도시별 `lat/lon`을 등거리 원통 도법으로 직접 투영해 SVG로 그린다
  (의존성 0). 막대 길이와 색 두 가지로 같은 값을 알려주고, 호버하면 아래 판독부에 수치가 뜨고,
  클릭하면 해당 지역 상세로 간다. 홈 사이드바 맨 위에 있다.
  - 처음엔 viewBox를 300×420으로 임의로 박아놨는데 경도 보정(cos)과 어긋나 남한이 가로로 퍼진
    덩어리가 됐다 — 세로 기준으로 가로를 역산해 왜곡을 없앴고, 해안선 점도 다시 촘촘하게 잡았다.
  - **한계(정직하게)**: 행정 경계 데이터가 아니라 손으로 찍은 간이 실루엣이라 실제 지도만큼
    정확하진 않다. 부속 섬도 제주만 그린다. 더 정확히 가려면 GeoJSON을 넣어야 한다.
- **5 Day Forecast API 연동** (교재 요구사항 ②의 열린 항목): 교재는 "OpenWeatherMap의 다른
  API로 기능 확장"을 요구하고 `docs/task6`에 이미 체크돼 있지만 열린 항목이라 하나 더 붙였다.
  `fetchForecast()` + `buildDailyForecast()`로 3시간 간격 40개 데이터를 날짜별로 접어
  상세 화면에 "향후 5일 집행 전망"을 넣었다. 지금 판단만 하던 앱이 사전 계획까지 하게 된다.
  - **예보 응답에는 미세먼지가 없다** — 그래서 이 점수만 기온·습도 2축(최고 9점)이다. 지금
    날씨의 27점과 섞이면 오해를 부르므로 화면에 분모("2/9점")와 각주를 같이 적었다.
  - 예보 호출은 별도 try/catch로 감쌌다 — 예보가 실패해도 상세 본문은 그대로 보여야 한다.
- **실습 아카이브를 참고 사이트 `/lab` 구조로 재작업**: 9차의 사이드바 탭 방식을 걷어내고
  참고 사이트 그대로 **eyebrow(PRACTICE ARCHIVE) → 큰 제목 → 번호 매긴 목차 그리드(01~09) →
  단원별 상세(왼쪽 "다루는 문법" / 오른쪽 "실습 화면")** 구성으로 바꿨다. 목차 클릭 시 앵커로
  부드럽게 스크롤(`scroll-behavior: smooth`, 동작 최소화 설정은 미디어 쿼리로 존중).
  실습 화면은 `max-height + overflow-y`로 안쪽에서만 스크롤시켜 단원이 길어도 흐름이 안 끊긴다.
- **가독성 순회**: 앱에서 가장 흐린 글자들을 찾아 고쳤다 — 히어로 차트의 도시 이름 라벨
  (10px `#8e8e93` → 11px/500 `#48484f`, 앱에서 제일 안 읽히던 글자), 상세 등급 힌트와 아카이브
  카운트(`#8e8e93` → `#6e6e73`), 아카이브 목차 번호(참고 사이트는 불투명 흰 카드라 옅은 회색이
  읽혔지만 우리 카드는 반투명이라 밝은 하늘 구간에서 번호가 날아갔다 → `#6e6e73`),
  지도 육지 윤곽선(투명도 0.28 → 0.5).
- **검증**: `npm run build` 통과. 지도는 실제 호버/클릭까지, 예보는 실제 API 응답(8/22~8/26
  실측 기온·습도)이 뜨는 것까지, 아카이브는 목차 앵커 이동까지 크롬으로 확인했다. 콘솔에 남은
  경고 4건은 전부 이전 타임스탬프의 Vite HMR 잔여물로, 새로고침 후 재현되지 않는 것을 확인했다.

### 11차 — 동기 12개 산출물 순회 후 기능/디자인 대량 이식

사용자가 SKALA 슬랙의 "교육생 작품 자랑하기" 링크 12개를 주고 "전부 열람하고 우리에 맞는 걸
싹 붙여라"고 해서, 접근 가능한 사이트를 페이지 단위로 돌아본 뒤 반영했다.

**순회 결과 (참고용, 다음 사람이 다시 안 뒤져도 되게 남긴다)**
- `kchanis1223.github.io/skala-vue` 웨더글라이더 — **three.js 3D 활강 게임**(실제 풍향이 측풍/
  역풍으로 반영), 비행 브리핑 모달(별점 + 조건 타일 4개), 리더보드, 야간 비 애니메이션 배경.
- `jinsu1011.github.io/skala-vue` **3D 지구본/태양계** — 실시간 공전 태양계, 낮/밤 경계가 있는
  지구, 기상 레이어(구름/강수/기온) + 운량 슬라이더, PWA 설치. 상세는 **AI 날씨 브리핑**(문장 +
  근거 목록), 24시간 곡선, 10일 예보 온도 범위 바, **일출/일몰 호**, 설명이 달린 지표 타일 8개.
- `skala-vue-steel` — **불쾌지수**(얼굴 5개 + 그라데이션 바), **아이스크림 생존 시간**, DAYLIGHT
  카드, 대기질 카드, NASA APOD, 벤토 그리드. (사용자가 특히 좋게 봄)
- `skala-vue-olive` — 다크모드, 초성 검색, 도시 비교(위치 교체), 즐겨찾기, LIVE + 업데이트 시각.
- `skala-vue-gamma` — **실제 GeoJSON 행정구역 지도**(+다트 랜덤 선택), 주말 나들이 **포디움 순위**.
- `skala-vue-drab` — 상세 상단 **컬러 배너**(eyebrow + 큰 지명 / 큰 기온), 12칸 지표 그리드, 날씨 가이드.
- `skala-vue-five` — 모노크롬 + 픽셀 아이콘, 확실한 컨셉, OUTFIT 추천 칩.
- `aeginventor.github.io/skala-vue` — macOS Dock형 지역 선택기, 기온 오토 캐러셀, 한 줄 인사이트.
- `inwoo-jang.github.io/inwoo-daily-hub` — 실사 하늘 배경 + 포춘쿠키, 기능 타일 4개, 컬러 프로모 배너.
- `weather-insight-ko` — 무난(사용자 평가상 우선순위 낮음).
- **반면교사**: drab 상세의 AIR QUALITY 숫자만 폰트 패밀리가 달라 혼자 논다 → 타이포 일관성 유지.

**실제로 붙인 것**
- **지도를 실제 행정구역으로 교체**: 손으로 찍은 실루엣 → 통계청 GeoJSON 기반 **17개 시도 경계**.
  런타임에 지도 라이브러리나 GeoJSON 파서를 붙이지 않으려고, 미리 Ramer–Douglas–Peucker로
  단순화해 `src/data/koreaMap.json`(19KB, path 문자열)로 커밋했다 — **의존성은 여전히 0**.
  투영 파라미터를 JSON에 같이 저장해서 도시 좌표와 지도가 어긋나지 않게 했다.
- **API 응답에서 이미 오는데 안 쓰던 값들을 전부 꺼냈다**: 체감온도·최고/최저·일출/일몰·풍향·
  기압·가시거리·구름량·관측시각·timezone·PM10·통합대기질(AQI). **추가 호출 0회**.
- **파생 지표 신설** (`weatherMock.js`):
  - `buildDiscomfort` — 기상청 표준 불쾌지수(THI) 공식. 임의 가중치가 아니다.
  - `buildStayMinutes` — 다른 팀의 "아이스크림 생존 시간"을 우리 언어(**야외 체류 적정 시간**)로
    옮긴 재미 지표. THI·미세먼지·강수·바람으로 깎는 휴리스틱(ponytail 주석에 한계 명시).
  - `buildDaylight` — 현지 시각 기준 일출/일몰/낮 길이/낮밤 판정(timezone 오프셋 적용).
  - `buildBriefing` — 수치를 **한 문단 + 근거 목록**으로 바꾸는 집행 브리핑. 규칙 기반이라
    이름에 "AI"를 붙이지 않았다(실제로 모델을 부르지 않으므로).
  - `windLabel`(16방위), `aqiLabel`.
- **홈**: 시상대(1위를 가운데 높게), 날씨 필터 칩 + 정렬 셀렉트, "오늘은 X가 가장 덥고…" 한 줄
  인사이트, 카드에 체감/최고최저 + **불쾌지수·야외 체류 시간 미니 바 2칸**.
- **상세**: 집행 브리핑 카드, 설명이 달린 **관측 지표 타일 8개**, **일조 시간 호**(2차 베지에로
  그린 얕은 돔 + 낮이면 해 위치 표시), 체감/최고최저를 헤더에.
- **고친 버그**: 일조 호를 반지름 136 원호로 그렸더니 viewBox 밖으로 솟아 위가 잘렸다 →
  높이를 직접 정하는 2차 베지에로 교체. 가시거리가 `7.016km`처럼 원본 정밀도를 그대로 흘려
  다른 지표와 자릿수가 안 맞았다 → 소수 첫째 자리로 반올림.
- **검증**: build/lint 통과(SampleTwo 1건은 기존 교재 원형), 홈·상세·요약·아카이브를 크롬으로
  돌며 지도/시상대/필터/브리핑/일조 호가 실제 데이터로 렌더되는 것과 콘솔 무에러를 확인했다.

이어서 할 사람: 순회에서 본 것 중 **아직 안 붙인 것** — 즐겨찾기(localStorage), 초성 검색,
도시 비교 화면, 다크모드, 시간별(24h) 곡선, 3D 요소(글라이더/지구본). 특히 다크모드는 우리가
실사 사진 배경을 쓰고 있어서 야간 사진 세트가 따로 필요하다 — 단순 토글로는 안 된다.

이제 라우트 6개(홈/상세/요약/아카이브/소개/404)가 전부 같은 유리 시스템 위에
있다. `/about`은 내비에서는 빠졌지만 라우트로는 살아 있다(직접 URL 접근 가능). 실습 아카이브
안의 개별 실습 컴포넌트 39개는 교재 원형을 유지 중이라 내부 마크업까지는 손대지 않았다 —
`.practice-section` 카드 껍데기만 앱 톤에 맞춰져 있다.

### 12차 — 컨셉 재정의: "예산 배분"을 버리고 "전사 경영 판단 참고 데이터"로 (2026-08-22)

사용자 지적 7건에서 출발했다. (1) 눈 배경 사진이 혼자 1960년대 감성, (2) 실데이터를 넣으니
등급이 죄다 `3-1-3`, (3) 다른 API 이식 허용, (4) 지도 세분화 검토, (5) 배경이 대시보드에
묶여 있어 탭을 바꾸면 깨짐, (6) 대시보드에서 지역을 직접 못 고르는 건 "UX 최악", (7) 내비
유리 박스의 텍스트가 위로 밀착되고 빈 공간이 과다.

이어서 컨셉 자체가 바뀌었다 — **"경영자 혹은 실무진이 전사적 경영전략을 짤 때 데이터 수집에서
참고하는 국룰 웹"**, 그리고 **"어떤 도메인이든 폭넓게 활용할 수 있어야 한다"**.

#### 왜 예산을 걷어냈나

5개 도시 시절엔 "마케팅 총 예산 1000만원을 점수 비례로 나눈다"가 말이 됐다. 전국 17개
시·도로 넓히자 무너졌다. 17로 쪼갠 금액은 어느 조직에서도 실행 단위가 아니고, 무엇보다
**우리가 알 수 없는 값(그 회사의 예산)을 우리가 지어내는 구조**였다. 사용자 판단도 같았다 —
"예산을 그냥 빼버리자". `buildBudgetPlan` → `buildRegionalOutlook`으로 교체하고, 사이드바의
예산 입력 UI도 삭제했다(그 `el-input-number`의 `v-model="total"`은 스크립트에 정의조차 없는
죽은 바인딩이었다). 안 쓰이던 `src/stores/budgetStore.js`도 함께 지웠다.

#### 점수를 연속값으로 (3-1-3 문제)

교재식 3단계 등급은 한국 여름에서 정보량이 0에 가깝다 — 습도는 늘 1등급, 미세먼지는 늘
3등급이라 기온 하나만 움직인다. 그래서 가중 연속 점수(100점)를 새로 얹었다.

| 축 | 가중치 | 함수 |
|---|---|---|
| 체감온도 | 28 | `plateau(18~24℃, 낙폭 8/10)` |
| 대기질 | 20 | `inverse(10 → 55㎍)` |
| 하늘상태 | 16 | `SKY_SCORE` 테이블 |
| 습도 | 16 | `plateau(40~60%, 낙폭 22/30)` |
| 바람 | 10 | `inverse(2 → 9m/s)` |
| 가시거리 | 10 | `plateau(10km 이상)` |

교재 등급(`gradeCity`)은 "등급 판정" 카드에 그대로 남겼다 — 과제 요구사항이라 지우면 안 된다.
1차 적용 후에도 73~81점에 몰려서 낙폭 구간을 좁혔고, 지금은 61~75점으로 벌어진다.

#### 4축 → 마케팅 믹스 7P + 경영 기능 5종

"마케팅 외적으로는 묶을만한 게 없나? 인사, 회계, 재무, 생산관리 등"에 대한 답.
`build7P`(Product/Price/Place/Promotion/People/Process/Physical Evidence)와
`buildFunctionalImpacts`(인사·노무 / 재무 / 회계·원가 / 생산·물류 / 안전관리)를 만들었다.
후자는 숫자를 낸다 — 시간당 휴게 의무 분, 연장근로 분, 냉난방 에너지 비용 증가율, 일 매출
변동률, 온·습도 민감 재고 손실률, 이동·배송 리드타임 지연 분, 재해 유형 목록.

**업종 중립 언어로 다시 썼다.** 초안은 소매·외식 냄새가 강했다(배달 2명 증원, 홀 인력,
우산꽂이, 냉음료). 컨셉이 "어떤 도메인이든"인 이상 그건 결함이다. 전부 제조·유통·물류·
서비스·공공 어디서 읽어도 자기 조직으로 번역되는 말로 교체했고, 화면 용어의 "집행"도
"기상 영향 / 옥외 활동"으로 통일했다.

#### 배경이 한 화면에 묶여 있던 구조 (지적 5)

배경 테마를 `WeatherHomeView`가 계산해 스토어에 **밀어넣고** 있었다. 그래서 대시보드를 떠나면
아무도 테마를 갱신하지 않아 배경이 직전 값에 멈췄다. 이제 `weatherThemeStore`가
`weatherStore.selectedCity ?? rankedAll[0]`에서 **직접 파생**한다. 화면은 배경을 신경 쓰지
않는다. 상세 화면은 진입 시 `weatherStore.setCity(id)`를 불러서 배경이 그 지역 날씨를 따르게
한다(토글하는 `selectCity`와 달리 `setCity`는 값을 그대로 맞춘다).

#### 지역 선택 (지적 6) 과 6초 자동 순환 제거

히어로의 지역별 막대는 지역 이름까지 달고 있으면서 클릭이 안 됐다 — 사용자가 말한
"눌릴 거라 생각했는데 안 눌리는" 케이스 그대로였다. 막대를 `button`으로 바꿔 지역 선택기로
만들었다(선택 시 흰 링 + `aria-pressed`). 동시에 **6초 자동 순환을 없앴다.** 순환이 배경까지
바꾸다 보니 (1) 읽는 중에 화면이 저 혼자 넘어가고 (2) 지금 보는 지역이 자동 순환인지 내가
고른 것인지 헷갈렸다. 이제 초점은 "내가 고른 지역", 안 골랐으면 "영향 1순위 지역" 하나뿐이다.

#### 이번에 실제로 잡은 버그

- **/summary가 사실상 안 읽혔다.** 유리 카드는 흰색 40% 반투명인데 배경 사진의 먹구름 위에
  놓이면 카드째 어두워져서 본문(`#303133`)이 배경에 묻혔다. 사진의 명암 폭을 눌러
  (`contrast(78%) brightness(1.16)`) 검은 바닥을 없애고, 그 위에 균일한 흰 베일
  (`.weather-scene::after`, 22%)을 한 겹 깔았다. 이제 카드가 사진 어디에 놓여도 뒤 밝기가
  비슷하다. 테마별 어두운 톤 오버레이의 농도도 같이 낮췄다.
- **"리스크 감지 17개 지역"** — 주의 이상을 전부 세다 보니 여름엔 습도 하나로 전 지역이
  걸려서, 봐도 행동이 갈리지 않는 숫자였다. 경보(error) 수준만 세도록 바꾸고 라벨도
  "기상 경보 지역"으로 고쳤다.
- **생산·물류 "영향 없음" + "창고 습도 관리가 필요합니다"** — 레벨과 근거가 서로 반대말을
  하던 모순. 리드타임 외 조치 항목이 하나라도 있으면 '주의'로 올린다. (10차의 인사·노무
  건과 같은 유형이 다른 함수에 남아 있었다.)
- **`SampleTwo.vue`의 미사용 `ref` import** — 오래 남아 있던 lint 에러 1건. 지웠다.
  이제 `npm run lint`가 완전히 통과한다(HANDOVER 7번의 "에러 1건은 정상" 설명은 폐기).

#### 내비 (지적 7)

1440px 전폭 바에 항목이 3개뿐이라 가운데가 비어 있었다 → `width: fit-content` + 가운데 정렬.
상단 padding이 4px뿐이라 글자가 유리 상단에 밀착돼 있었다 → 상하 8px로 균형.

#### 지도 세분화 (지적 4) — 검토 결과: 하지 않는다

시군구 251개 GeoJSON을 받아 실제로 열어봤다(`/tmp/kr_muni.json`, 251 features).
결론은 **데이터가 없어서 못 하는 게 아니라, 해도 정보가 안 늘어서 안 한다**이다.
우리 관측치는 시·도당 1개(OpenWeatherMap 17회 호출)다. 251개를 그리면 **251개 도형이
17개 값을 나눠 갖는다** — 잉크만 늘고, 강남구와 강북구가 서로 다른 측정값을 가진 것처럼
읽히게 만들어 오히려 거짓말을 한다. 시군구 단위로 진짜 값을 채우려면 251회 호출이 필요한데
무료 티어는 분당 60회다.

세분화를 진짜로 풀려면 지도가 아니라 **데이터 소스**를 바꿔야 한다 → 아래.

#### 추가 API 후보 (사용자 허가는 받아둔 상태, 아직 미적용)

| API | 얻는 것 | 비고 |
|---|---|---|
| 기상청 단기예보(동네예보) | 5km 격자 실황·예보 | **이게 있어야 시군구 세분화가 의미를 갖는다.** 공공데이터포털 키 필요 |
| 에어코리아 실시간 대기오염 | 측정소별 실측 PM10/PM2.5 | 지금은 OWM 모델값이라 지역 간 차이가 거의 없다 — 대기질 축(가중치 20)이 사실상 죽어 있는 원인 |
| 한국천문연구원 특일 정보 | 대체공휴일 포함 국내 정확 공휴일 | 지금 쓰는 Nager.Date는 대체공휴일을 놓친다 |

세 개 다 공공데이터포털 인증키가 필요하다. 키를 받으면 `weatherApi.js`에 함수를 추가하는
것만으로 붙는다(현재 구조가 이미 그렇게 돼 있다 — `fetchHolidays`가 선례).

## 6. Claude 메모리에 남겨둔 것

`~/.claude/projects/-Users-seohyeokin-workspace-skala-vue/memory/`에 세션 간 지속되는 메모가 있다.
새 세션을 여는 Claude는 이걸 자동으로 참고한다.

- `textbook-scope-constraint.md` — 과제 1~6은 교재 문법만 썼고, **2026-08-21부터 자유 개발 단계로
  전환됐다**는 것. 예전 세션 로그를 보고 "왜 이렇게 부자연스러운 문법을 썼지"라는 의문이 들면 이걸
  먼저 볼 것.
- `ask-before-working.md` — 기존 파일을 고쳐야 하면 사후 보고 말고 **작업 전에 먼저 물어볼 것**.
- `ask-before-git-actions.md` — **커밋/푸시/브랜치 생성도 착수 전에 먼저 물어볼 것.** 위 0번의
  `worktree-ios-redesign` 브랜치를 사용자 확인 없이 커밋+푸시했다가 정정받은 사고 기록.
- `design-direction-ios.md` — 위 5번 내용의 원본. 디자인 방향과 그 이유.

## 7. 실행

```sh
npm install
cp .env.example .env   # OpenWeatherMap API 키를 본인 걸로 채운다 (openweathermap.org, 무료)
npm run dev             # http://localhost:5173
npm run build
npm run lint            # 12차에서 마지막 에러까지 잡았다 — 지금은 완전히 통과한다
```

키 발급 직후엔 활성화까지 시간이 좀 걸릴 수 있다(수십 분~2시간). 그동안은 401이 나도 키 자체가
틀린 게 아닐 수 있다.
