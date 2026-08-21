# skala-vue

SKALA 4기 Full-Stack Engineering, Frontend-framework: Vue.js 실습 저장소
Vue 3 Composition API + Vue Router + Vite

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

도시 5개의 실시간 날씨는 OpenWeatherMap API에서 가져온다 (`src/data/weatherApi.js`).
API 키는 `.env`에 두고 git에는 올리지 않는다. `.env.example`을 `.env`로 복사해 본인 키를 채워 넣으면 된다.

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
| `/`                | WeatherHomeView    | 메인 대시보드, `?search=` 동기화 |
| `/weather/:cityId` | WeatherDetailView  | 도시별 상세 기상 관측 정보       |
| `/about`           | WeatherAboutView   | 서비스 소개                      |
| `/summary`         | WeatherSummaryView | 의사결정 보조 지표 요약 표       |
| `/practice`        | PracticeView       | 단원별 Code Challenge 실습 모음  |
| `/:pathMatch(.*)*` | NotFoundView       | Catch-all Route                  |

전부 동적 import(Lazy Loading)로 등록해서 화면별로 청크가 분리된다.

## 전역 상태 (Pinia)

| 스토어        | state   | getters       | actions      | 쓰는 곳                                     |
| ------------- | ------- | ------------- | ------------ | ------------------------------------------- |
| `configStore` | `unit`  | `unitSymbol`  | `toggleUnit` | UnitToggler, WeatherCard, WeatherDetailView |
| `budgetStore` | `total` | `totalLabel`  | `setTotal`   | WeatherHomeView, WeatherSummaryView         |
| `counter`     | `count` | `doubleCount` | `increment`  | StoreCounter (교재 211p 실습)               |

메모리에만 있어서 브라우저를 새로고침하면 초기값(섭씨 / 1000만원)으로 돌아간다.
링크로 화면을 옮기는 건 SPA라 유지된다.

## 실시간 API (Axios)

| API                            | 용도                        | 키 필요                |
| ------------------------------ | --------------------------- | ---------------------- |
| OpenWeatherMap Current Weather | 기온, 습도, 풍속, 날씨 상태 | 필요 (`.env`)          |
| OpenWeatherMap Air Pollution   | 미세먼지(PM2.5)             | 필요 (`.env`, 같은 키) |
| Nager.Date Public Holidays     | 대한민국 공휴일 조회        | 불필요                 |

홈·상세·요약 세 화면이 각자 `onMounted`에서 독립적으로 조회한다. 무료 티어 한도는
분당 60회 / 월 100만 회이며, 새로고침 1회 = 10회 호출(도시 5개 × API 2개)이다.

## 실습 컴포넌트

교재 단원별 Code Challenge 결과물은 `/practice`에 한 페이지로 모여 있다.

- 렌더링: vText, vHtml, vHtmlXSS, vIfElse, vShow, vFor
- 바인딩: vBindBasic, vBindClassBinding, vBindStyleBinding, vBindShorthand
- 최적화: vPre, vCloak, vOnce, vMemo
- 이벤트/폼: vOnEventHandler, vOnEventObject, vOnEventModifier, vModelFormDataBinding, vModelModifier, vStyleScoped
- Composition API: vReactiveRef, vReactiveReactive, vComputedBasic, vWatchBasic, vWatchMulti, vWatchDeep, vWatchReactive, vWatchEffect
- Components: vLifecycleHook, vPropsEmits, SlotDefaultParent, SlotNamedParent, SlotScopedParent
- Pinia: StoreCounter

## 구조

```
src/
├─ App.vue            네비게이션 바(RouterLink) + RouterView
├─ router/index.js    라우트 정의, Lazy Loading, afterEach 가드
├─ stores/            Pinia 전역 상태
│  ├─ configStore.js  날씨 단위 (섭씨/화씨)
│  ├─ budgetStore.js  마케팅 총 예산
│  └─ counter.js      교재 211p 실습용
├─ data/
│  ├─ weatherMock.js  도시 등록정보(좌표), 등급 판정, 예산 배분
│  └─ weatherApi.js   OpenWeatherMap / Nager.Date axios 호출
├─ views/             페이지 단위 컴포넌트
│  ├─ WeatherHomeView.vue     WeatherDetailView.vue
│  ├─ WeatherAboutView.vue    WeatherSummaryView.vue
│  ├─ PracticeView.vue        NotFoundView.vue
│  └─ HomeView.vue, AboutView.vue   (create-vue 스캐폴드, 미사용)
├─ components/
│  ├─ weather/        BaseDashboardCard, SearchBar, WeatherCard, UnitToggler
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

`npm run lint`는 `practice/basic/SampleTwo.vue`의 미사용 `ref` 하나를 잡는다.
반응성 비교 실습 예제라서 그대로 뒀다.

## 개발 환경

VS Code + Vue (Official) 확장, Vue.js devtools
