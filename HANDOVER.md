# 인수인계서

작성일: 2026-08-21
대상: 이 리포를 이어받는 사람(미래의 나, 다른 세션, 다른 사람 누구든)

## 0. 가장 먼저 볼 것 — 커밋 안 된 작업이 많다

**마지막 커밋(`c7eee7b`, 과제3)부터 지금까지 과제 4·5·6이 전부 워킹 트리에만 있고 커밋되지 않았다.**

```
$ git log --oneline -1
c7eee7b 과제3 완료 후 리드미 작성

$ git status --short | wc -l
65   # 변경/추가/이동 파일 65개
```

작업을 이어받았는데 `git status`가 깨끗하지 않다면 그게 정상이다. 실수로 `git checkout .`이나
`git stash drop` 같은 걸 하면 과제 4~6이 통째로 날아간다. 커밋부터 하고 시작하는 걸 추천한다.

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
- OpenWeatherMap 무료 티어 한도: 분당 60회 / 월 100만 회. 새로고침 1번 = 10회 호출(도시 5 ×
  API 2종). 실습 중엔 문제없지만 자동 폴링 같은 걸 붙이면 주의.
- `WeatherDetailView.vue`가 상세보기로 들어올 때만 쓰는 예산/점유율(`route.query.share` 등)을
  쿼리스트링으로 받는다. 새로고침하면 쿼리가 없어져서 "예산 편성" 카드가 안 뜬다 — 의도된 동작이지만
  헷갈릴 수 있다.

## 5. 지금 막 시작하려다 멈춘 것 — 자유 개발(디자인) 단계

과제 6까지 끝난 뒤 사용자가 "교재 준수는 여기까지, 이제 예쁘게 만들고 기능 정비하고 디벨롭할 거다"라고
선언했다. 진행 중이던 것:

- **디자인 방향 확정**: iOS 앱 스타일(날씨/건강 앱 느낌). 흰 카드 + 은은한 그림자, radius 20px,
  기온 숫자를 48px로 크게, 시스템 블루(#007AFF) 포인트, `-apple-system` 폰트. 다른 후보였던
  apple.com 마케팅 스타일, macOS 시스템 설정 스타일은 기각됨.
- **`frontend-design` 플러그인 설치함** (Anthropic 공식, `claude-plugins-official` 마켓플레이스,
  user scope). "Apple design"이라는 이름의 플러그인은 마켓플레이스 286개를 다 뒤져도 없었다 —
  가장 가까운 공식 대안이라 이걸 깔았다. **설치한 세션 안에서는 바로 못 쓴다. 새 세션을 열어야
  `Skill` 목록에 잡힌다.**
- **아직 코드 착수 전이다.** 토큰 파일(`assets/theme.css`) 하나를 만들었다가, "인수인계서 써달라"는
  요청에 작업을 멈추면서 착수 전 상태라 다시 지웠다. 즉 **디자인 리뉴얼은 결정만 났고 코드는 0줄이다.**

이어서 할 사람은 새 세션을 열고(플러그인 로드됨) `docs/design-direction-ios.md`(메모리, 아래 6번
참고)를 읽고 시작하면 된다. 손댈 후보 파일: `App.vue`(네비/셸), `BaseDashboardCard.vue`,
`WeatherCard.vue`, `SearchBar.vue`, `UnitToggler.vue`, `WeatherSummaryView.vue`(표),
`practice.css`/`exercise.css`(공유 베이스 스타일 — `/practice` 아카이브와 공유되니 구조는 안 건드리고
색/타이포/그림자만 다듬는 걸 권장).

## 6. Claude 메모리에 남겨둔 것

`~/.claude/projects/-Users-seohyeokin-workspace-skala-vue/memory/`에 세션 간 지속되는 메모가 있다.
새 세션을 여는 Claude는 이걸 자동으로 참고한다.

- `textbook-scope-constraint.md` — 과제 1~6은 교재 문법만 썼고, **2026-08-21부터 자유 개발 단계로
  전환됐다**는 것. 예전 세션 로그를 보고 "왜 이렇게 부자연스러운 문법을 썼지"라는 의문이 들면 이걸
  먼저 볼 것.
- `ask-before-working.md` — 기존 파일을 고쳐야 하면 사후 보고 말고 **작업 전에 먼저 물어볼 것**.
- `design-direction-ios.md` — 위 5번 내용의 원본. 디자인 방향과 그 이유.

## 7. 실행

```sh
npm install
cp .env.example .env   # OpenWeatherMap API 키를 본인 걸로 채운다 (openweathermap.org, 무료)
npm run dev             # http://localhost:5173
npm run build
npm run lint             # SampleTwo.vue 에러 1건은 정상, 위 4번 참고
```

키 발급 직후엔 활성화까지 시간이 좀 걸릴 수 있다(수십 분~2시간). 그동안은 401이 나도 키 자체가
틀린 게 아닐 수 있다.
