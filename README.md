# skala-vue

SKALA 4기 Full-Stack Engineering, Frontend-framework: Vue.js 실습 저장소
Vue 3 Composition API + Vite

## 과제

| 과제 | 내용                                                | 교재 | 문서                                        |
| ---- | --------------------------------------------------- | ---- | ------------------------------------------- |
| 1    | 날씨 대시보드 Mockup (v-for, v-if, 이벤트 수식어)   | 116p | [문서](./docs/task1-weather-mockup.md)      |
| 2    | Composition API (ref, computed, watch, watchEffect) | 145p | [문서](./docs/task2-weather-composition.md) |
| 3    | 컴포넌트 분리 (props, emits, slot, scoped)          | 178p | [문서](./docs/task3-weather-component.md)   |

세 과제가 각각 다른 게 아니라 같은 날씨 대시보드를 단계별로 발전시킨 것이다.
정적 화면 -> 반응형 계산 -> 컴포넌트 분해 순서다.

데이터는 아직 더미 배열이다. 나중에 Open API를 붙일 때 weatherList의 소스만 갈아끼우면 되게 해뒀다.

소스 위치

- 과제 1: `src/components/Task1WhetherMockup.vue` (커밋 12fca5b)
- 과제 2: `src/components/Task2WeatherComposition.vue` (커밋 086bf5e)
- 과제 3: `src/components/WeatherParent.vue`, `BaseDashboardCard.vue`, `SearchBar.vue`, `WeatherCard.vue`

과제 3이 과제 2를 쪼갠 결과물이라 지금 트리에는 과제 3 버전만 있다.
앞의 두 개는 위 커밋에서 볼 수 있다. (`git show 커밋:경로`)

## 실습 컴포넌트

교재 단원별 Code Challenge 결과물을 App.vue에 한 페이지로 붙여놨다.

- 렌더링: vText, vHtml, vHtmlXSS, vIfElse, vShow, vFor
- 바인딩: vBindBasic, vBindClassBinding, vBindStyleBinding, vBindShorthand
- 최적화: vPre, vCloak, vOnce, vMemo
- 이벤트/폼: vOnEventHandler, vOnEventObject, vOnEventModifier, vModelFormDataBinding, vModelModifier, vStyleScoped
- Composition API: vReactiveRef, vReactiveReactive, vComputedBasic, vWatchBasic, vWatchMulti, vWatchDeep, vWatchReactive, vWatchEffect
- Components: vLifecycleHook, vPropsEmits, SlotDefaultParent, SlotNamedParent, SlotScopedParent

## 구조

```
src/
├─ App.vue
├─ assets/
│  ├─ practice.css   실습 공통 스타일
│  └─ exercise.css   과제 초기 공통 스타일 (과제 3에서 컴포넌트 scoped로 옮김)
└─ components/
   ├─ WeatherParent.vue, BaseDashboardCard.vue, SearchBar.vue, WeatherCard.vue
   ├─ v*.vue          단원별 실습
   ├─ Slot*.vue       슬롯 실습
   └─ practices/      교재 샘플
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

## 개발 환경

VS Code + Vue (Official) 확장, Vue.js devtools
