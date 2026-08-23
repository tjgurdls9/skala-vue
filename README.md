# WEATHER DESK

SKALA 4기 Full-Stack Engineering, Frontend-framework: Vue.js 실습 저장소
(Vue 3 Composition API + Vue Router + Pinia + Vite + Element Plus)

전국 45개 관측 지점의 실시간 날씨를 운영 여건 점수, 위험 경보, 마케팅 7P,
기능별 영향으로 정리해 보여준다. 키보드 조작과 동작 줄이기 설정도 지원한다.

## 과제

| 과제 | 내용                                                | 교재 | 문서                                        |
| ---- | --------------------------------------------------- | ---- | ------------------------------------------- |
| 1    | 날씨 대시보드 Mockup (v-for, v-if, 이벤트 수식어)   | 116p | [문서](./docs/task1-weather-mockup.md)      |
| 2    | Composition API (ref, computed, watch, watchEffect) | 145p | [문서](./docs/task2-weather-composition.md) |
| 3    | 컴포넌트 분리 (props, emits, slot, scoped)          | 178p | [문서](./docs/task3-weather-component.md)   |
| 4    | Vue Router (동적 경로, 쿼리 스트링, Guard)          | 196p | [문서](./docs/task4-weather-router.md)      |
| 5    | Pinia Store (state, getters, actions)               | 212p | [문서](./docs/task5-weather-store.md)       |
| 6    | Axios (OpenWeatherMap, Nager.Date 실시간 연동)      | 230p | [문서](./docs/task6-weather-axios.md)       |

여섯 과제가 각각 다른 게 아니라 같은 날씨 대시보드를 단계별로 발전시킨 것이다.
정적 화면 -> 반응형 계산 -> 컴포넌트 분해 -> 라우팅 -> 전역 상태 -> 실시간 API 순서다.

전국 45개 관측 지점의 실시간 날씨는 OpenWeatherMap API에서 가져온다 (`src/data/weatherApi.js`).
API 키는 `.env`에 두고 git에는 올리지 않는다. `.env.example`을 `.env`로 복사해 본인 키를 채워 넣으면 된다.

## 대시보드 사용법

- 지도에 마우스를 올리면 판독부에 `미리보기`로 표시된다. 오른쪽 패널은 지역을 클릭해야 바뀐다.
- 선택 지역에는 배지와 콕핏에 `직접 선택`이 표시된다. 선택이 없으면 운영 여건 1위 지역을 보여준다.
- 운영 여건 상위 3곳과 지역별 막대도 클릭할 수 있으며, 같은 지역을 다시 누르면 선택이 해제된다.
- 지역 카드의 7P 제안은 자동으로 바뀌며, 카드에 마우스를 올려 읽는 동안에는 멈춘다.
- `동작 줄이기`가 켜진 환경에서는 카드 순환과 이동 애니메이션을 멈춘다.

소스 위치

- 과제 1: `src/components/Task1WhetherMockup.vue` (커밋 12fca5b)
- 과제 2: `src/components/Task2WeatherComposition.vue` (커밋 086bf5e)
- 과제 3: `src/components/WeatherParent.vue` (커밋 c7eee7b)
- 과제 4: `src/views/`, `src/router/index.js`, `src/data/weatherMock.js`
- 과제 5: `src/stores/configStore.js`, `src/stores/budgetStore.js`, `src/components/weather/UnitToggler.vue`
- 과제 6: `src/data/weatherApi.js`

과제 4에서 WeatherParent.vue가 `src/views/WeatherHomeView.vue`로 옮겨갔다.
앞의 과제들은 위 커밋에서 볼 수 있다. (`git show 커밋:경로`)

## 라우트

| 경로               | View               | 설명                             |
| ------------------ | ------------------ | -------------------------------- |
| `/`                | WeatherSummaryView | 첫 화면, 의사결정 보조 지표 요약  |
| `/dashboard`       | WeatherHomeView    | 날씨 대시보드, `?search=` 동기화  |
| `/weather/:cityId` | WeatherDetailView  | 도시별 상세 기상 관측 정보       |
| `/about`           | WeatherAboutView   | 서비스 소개                      |
| `/summary`         | Redirect           | `/`로 이동                       |
| `/practice`        | PracticeView       | 단원별 Code Challenge 실습 모음  |
| `/troubleshooting` | TroubleshootingView| 개발 과정의 문제·원인·해결 기록  |
| `/:pathMatch(.*)*` | NotFoundView       | Catch-all Route                  |

전부 동적 import(Lazy Loading)로 등록해서 화면별로 청크가 분리된다.

## 전역 상태 (Pinia)

| 스토어              | 역할                                                   |
| ------------------- | ------------------------------------------------------ |
| `configStore`       | 섭씨/화씨 단위 설정                                     |
| `weatherStore`      | 전국 날씨 조회 캐시, 운영 여건 순위, 현재 선택 지역     |
| `weatherThemeStore` | 선택 지역의 날씨 분류와 날씨 아이콘 계산               |
| `counter`           | StoreCounter 교재 실습                                  |

메모리에만 있어서 브라우저를 새로고침하면 초기값으로 돌아간다. SPA 안에서 화면을 옮길 때는
날씨 응답과 선택 지역이 유지되므로 같은 API를 중복 호출하지 않는다.

## 실시간 API (Axios)

| API                            | 용도                        | 키 필요                |
| ------------------------------ | --------------------------- | ---------------------- |
| OpenWeatherMap Current Weather | 기온, 습도, 풍속, 날씨 상태 | 필요 (`.env`)          |
| OpenWeatherMap Air Pollution   | 미세먼지(PM2.5)             | 필요 (`.env`, 같은 키) |
| OpenWeatherMap 5 Day Forecast  | 향후 5일 집행 전망          | 필요 (`.env`, 같은 키) |
| Nager.Date Public Holidays     | 대한민국 공휴일 조회        | 불필요                 |

5 Day Forecast는 3시간 간격 데이터를 날짜별로 접어서 상세 화면의 "향후 5일 집행 전망"에 쓴다.
예보 응답에는 미세먼지가 없어서 이 점수만 기온·습도 2축(최고 9점)으로 계산한다 —
지금 날씨의 27점과 만점이 다르므로 화면에도 분모를 같이 표기한다.

현재 날씨와 대기질은 지점당 2회 요청한다. 45곳을 한꺼번에 요청하면 무료 티어의 분당 한도를
넘길 수 있어 25곳씩 나누어 조회하고, 도착한 결과부터 화면에 반영한다. `weatherStore`가 결과를
캐시하므로 라우트 이동만으로는 다시 요청하지 않는다. 상세 화면의 5일 예보는 해당 지역을 열 때
별도로 조회한다.

## 실습 컴포넌트

교재 단원별 Code Challenge 결과물은 `/practice`에 한 페이지로 모여 있다.

- 기초: 텍스트 보간, JavaScript 표현식, ref 반응성
- 렌더링: vText, vHtml, vHtmlXSS, vIfElse, vShow, vFor
- 바인딩: vBindBasic, vBindClassBinding, vBindStyleBinding, vBindShorthand
- 최적화: vPre, vCloak, vOnce, vMemo
- 이벤트/폼: vOnEventHandler, vOnEventObject, vOnEventModifier, vModelFormDataBinding, vModelModifier, vStyleScoped
- Composition API: vReactiveRef, vReactiveReactive, vComputedBasic, vWatchBasic, vWatchMulti, vWatchDeep, vWatchReactive, vWatchEffect
- Components: vLifecycleHook, vPropsEmits, SlotDefaultParent, SlotNamedParent, SlotScopedParent
- Pinia: StoreCounter
- 외부 데이터: Axios 날씨·대기질·예보·공휴일 API 연동
- 개발·배포: ESLint, Prettier, 환경 변수, 프로덕션 빌드 확인

`/troubleshooting`에는 지표 요약 가독성, 지역 선택 상태, 호버 성능, 카드 전환,
API 호출 한도, 라우트 전환, 개발 서버 경로, Vercel SPA 라우팅 문제를 정리했다.
결과만 적지 않고 처음 시도한 방법과 원인을 찾아간 과정, 해결 뒤 배운 점까지 함께 남겼다.

## 구조

```
src/
├─ App.vue            네비게이션 바(RouterLink) + RouterView
├─ router/index.js    라우트 정의, Lazy Loading, afterEach 가드
├─ stores/            Pinia 전역 상태
│  ├─ configStore.js  날씨 단위 (섭씨/화씨)
│  ├─ weatherStore.js 전국 날씨 캐시, 순위, 선택 지역
│  ├─ weatherThemeStore.js 날씨 분류와 아이콘
│  └─ counter.js      교재 211p 실습용
├─ data/
│  ├─ weatherMock.js  지역 등록정보, 점수·경보·7P·기능별 영향 계산
│  ├─ koreaMap.json   전국 지도 도형
│  └─ weatherApi.js   OpenWeatherMap / Nager.Date axios 호출
├─ views/             페이지 단위 컴포넌트
│  ├─ WeatherHomeView.vue     WeatherDetailView.vue
│  ├─ WeatherAboutView.vue    WeatherSummaryView.vue
│  ├─ PracticeView.vue        TroubleshootingView.vue
│  ├─ NotFoundView.vue
│  └─ HomeView.vue, AboutView.vue   (create-vue 스캐폴드, 미사용)
├─ components/
│  ├─ weather/        BaseDashboardCard, SearchBar, WeatherCard, WeatherMap, UnitToggler
│  └─ practice/       basic, render, binding, optimize, event, composition, component, store
└─ assets/
   ├─ practice.css    실습 공통 스타일
   └─ exercise.css    과제 공통 스타일 (과제 3에서 대부분 컴포넌트 scoped로 이동)
```

## 실행

Node `^20.19.0 || >=22.12.0`

```sh
npm install
npm run dev      # http://localhost:5173
npm run build
npm run lint
npm run format
```

`npm run lint`와 `npm run build`가 모두 통과하는 상태를 기준으로 유지한다.

## 배포

Vercel: https://skala-vue-weather-desk.vercel.app

## 개발 환경

VS Code + Vue (Official) 확장, Vue.js devtools
