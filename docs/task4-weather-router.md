# 과제 4. 날씨 대시보드 라우터 적용

교재 196p Hands on - Weather Router

## 무엇을 했나

과제 3까지는 App.vue 하나에 모든 화면이 세로로 쌓여 있었다.
이번엔 Vue Router를 붙여서 주소별로 화면을 갈아끼우는 SPA로 바꾸는 과제다.

과제 3의 WeatherParent.vue를 `views/WeatherHomeView.vue`로 옮겨서 `/` 경로에 앉히고,
`window.alert()`로 쏟아내던 상세 리포트를 `/weather/:cityId` 페이지로 분리했다.

| 파일                   | 경로               | 하는 일                                   |
| ---------------------- | ------------------ | ----------------------------------------- |
| App.vue                | -                  | 네비게이션 바(RouterLink) + RouterView    |
| router/index.js        | -                  | 라우트 정의, Lazy Loading, afterEach 가드 |
| WeatherHomeView.vue    | `/`                | 메인 대시보드 (과제 3의 WeatherParent)    |
| WeatherDetailView.vue  | `/weather/:cityId` | 도시별 상세 기상 관측 정보                |
| WeatherAboutView.vue   | `/about`           | 서비스 소개                               |
| WeatherSummaryView.vue | `/summary`         | 의사결정 보조 지표 요약 (본인 추가)       |
| PracticeView.vue       | `/practice`        | 단원별 Code Challenge 실습 모음           |
| NotFoundView.vue       | `/:pathMatch(.*)*` | Catch-all Route                           |

## 요구사항 체크

- [x] 1. 라우터 지연 로딩 적용, Catch-all Route 적용
- [x] 2. App.vue에 Navigation Bar(RouterLink)와 메인 콘텐츠 영역(RouterView) 배치
- [x] 3. WeatherHomeView가 WeatherParent 대체, window.alert 제거하고 router.push로 이동
- [x] 4. WeatherDetailView에서 cityId 기반으로 Mount 시점에 Mock Data에서 도시 객체 선택
- [x] 5. WeatherAboutView 작성 및 메인 대시보드로 돌아가기
- [x] 6. 본인 추가 view 작성 및 Routing (WeatherSummaryView, PracticeView)

## 라우터 설정

라우트 전부를 동적 import로 걸었다. 빌드하면 화면마다 청크가 따로 떨어진다.

```js
{
  path: '/weather/:cityId',   // :cityId 가 동적 세그먼트
  name: 'WeatherDetail',
  component: () => import('../views/WeatherDetailView.vue'),
  meta: { title: '상세 기상 관측 정보' },
}
```

Catch-all은 목록 맨 마지막에 둬야 한다. 위로 올리면 모든 주소를 다 잡아먹는다.

```js
{ path: '/:pathMatch(.*)*', name: 'NotFound', component: () => import('../views/NotFoundView.vue') }
```

## alert를 페이지로 바꾼 것

과제 3의 상세보기는 `window.alert()`에 등급 판정, 집행 점수, 예산 편성, 실행안을 전부 문자열로
이어붙여서 띄웠다. 이걸 지우고 라우터로 넘긴다.

```js
const goDetail = (item) => {
  router.push({
    name: 'WeatherDetail',
    params: { cityId: item.id },
    query: { share: item.share, budget: item.budget, priority: item.priority },
  })
}
```

alert에 있던 내용은 버리지 않고 상세 페이지 본문으로 옮겼다.
그런데 예산과 점유율은 **지금 화면에 보이는 도시들의 점수 합계**로 나눈 값이라
cityId만 넘겨서는 상세 페이지에서 다시 계산할 수가 없다. 검색으로 도시를 걸러내면 합계가 바뀌니까.
그래서 이 세 개만 쿼리 스트링에 실어 보낸다. 교재 192p의 `push({ name, params, query })` 형태 그대로다.

## 검색어를 주소창에 동기화

교재 189p는 마운트 시점에 `?search=` 값을 읽어서 복원하는 것만 다루는데,
197p 소개 화면에 "URL 쿼리 스트링 매핑을 활용한 실시간 검색 상태 동기화"라고 적혀 있어서 쓰기 쪽도 넣었다.

```js
onMounted(() => {
  if (route.query.search) {
    searchQuery.value = route.query.search
  }
})

watch(searchQuery, (keyword) => {
  router.replace(keyword ? '/?search=' + keyword : '/')
})
```

여기서 push를 쓰면 안 된다. 한 글자 칠 때마다 히스토리가 쌓여서 뒤로 가기를 글자 수만큼 눌러야 한다.
replace는 현재 항목을 덮어쓰니까 검색을 아무리 해도 뒤로 가기 한 번이면 이전 화면으로 돌아간다.

## Navigation Guard

교재 193p의 활용 예시는 로그인 검사인데 이 앱에는 로그인이 없다.
가짜 플래그를 심는 대신 194p 표의 `afterEach` 용도(후속 처리 및 로그 기록)로 썼다.
라우트마다 `meta.title`을 달아두고 전환이 끝나면 문서 제목을 바꾼다.

```js
router.afterEach((to, from) => {
  document.title = to.meta.title ? `${to.meta.title} | ${BASE_TITLE}` : BASE_TITLE
  console.log(`🧭 화면 전환 완료: ${from.path} → ${to.path}`)
})
```

덤으로 index.html의 `<title>Vite App</title>`도 이걸로 덮인다.

## Mock 데이터를 모듈로 뺀 이유

교재 196p 폴더 트리에는 데이터 파일이 없다. 요구사항 4번도 "Mock Data를 임시로 활용"이라고만 한다.
그래서 처음엔 화면마다 배열을 하나씩 들고 있게 했는데, 요약 페이지까지 만들면서
같은 배열과 같은 등급 판정 함수가 세 파일에 복사되는 상황이 됐다.

`src/data/weatherMock.js` 하나로 합쳤다. 평범한 JS 모듈이라 교재 문법 범위는 안 벗어난다.
나중에 Open API를 붙일 때도 이 파일만 갈아끼우면 된다.

```js
export const weatherList = [
  /* 도시 5개 */
]
export const findCity = (cityId) => weatherList.find((item) => item.id === cityId) ?? null
export const gradeCity = (item) => {
  /* 등급/코드/세그먼트 부착 */
}
export const buildBudgetPlan = (list, totalBudget) => {
  /* 점수 비율로 예산 배분 */
}
```

`buildBudgetPlan`이 목록을 인자로 받는 게 핵심이다.
목록 화면은 검색으로 걸러진 도시만 넘기고, 요약 화면은 전체 도시를 넘긴다.
같은 함수인데 결과가 달라진다.

## 요구사항 6번: 지표 요약 페이지

과제 3에서 만든 우선순위, 등급 코드, 세그먼트, 예산 배분이 카드마다 배지로 흩어져 있어서
도시끼리 비교가 안 됐다. `/summary`에서 한 표로 모아 보여준다.

- 집행 점수 높은 순 정렬, 합계 행 포함
- 예산 input을 바꾸면 배분이 즉시 다시 계산됨
- 행을 클릭하면 해당 도시 상세 페이지로 이동

점유율을 도시마다 각각 반올림해서 더하기 때문에 합계가 100%에서 1~2% 어긋난다.
표 아래에 그 이유를 적어놨다.

## 폴더 정리

컴포넌트가 50개 가까이 한 폴더에 평면으로 깔려 있어서 교재 단원별로 묶었다.

```
src/components/
├─ weather/     BaseDashboardCard, SearchBar, WeatherCard
└─ practice/
   ├─ basic/        Sample*
   ├─ render/       vText, vHtml, vIfElse, vShow, vFor
   ├─ binding/      vBind*
   ├─ optimize/     vPre, vCloak, vOnce, vMemo
   ├─ event/        vOn*, vModel*, vStyleScoped
   ├─ composition/  vReactive*, vComputed*, vWatch*
   └─ component/    vLifecycleHook*, vPropsEmits*, Slot*
```

전부 `git mv`라 히스토리가 이어진다. 부모-자식 쌍은 같은 폴더에 넣어서 import를 고칠 일이 없었다.
`SlotDefaultParent.vue`만 자식을 `@/components/SlotDefaultChild.vue` 절대경로로 부르고 있어서 상대경로로 바꿨다.

교재 트리는 부품 3개를 `components/exercise/`에 두는데 `weather/`로 갔다. 이름만 다르고 구조는 같다.

## 하면서 걸렸던 것

화면이 왼쪽으로 치우쳐서 봤더니 create-vue 스캐폴드가 남긴 `main.css`가 범인이었다.

```css
@media (min-width: 1024px) {
  #app {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}
```

2단 웰컴 화면용 그리드인데, App.vue의 자식이 하나뿐이라 왼쪽 칸에만 들어가고 오른쪽 절반이 비었다.
웰컴 화면은 이미 없으니 그리드를 걷어냈다.

`exercise.css`의 `.app-container`도 `margin: 40px 10px`이라 auto가 아니었다.
원본은 안 건드리고 App.vue scoped에서 `margin: 40px auto`로 덮고,
폭은 `practice.css`가 쓰는 `max-width: 1200px`를 따왔다.

## 확인

- `/`, `/weather/city_05`, `/about`, `/summary`, `/practice`, 없는 주소 전부 정상 렌더링
- 검색어 입력하면 주소창이 `/?search=%EB%B6%80%EC%82%B0`으로 바뀌고, 그 주소로 새로고침하면 검색 상태 복원
- 검색으로 부산만 남긴 상태에서 상세보기 → `?share=100&budget=1000` (필터에 맞춰 재계산됨)
- 화면 전환마다 브라우저 탭 제목 변경, 콘솔에 `🧭 화면 전환 완료: /about → /practice` 기록
- npm run build 성공, 라우트별 청크 분리 확인

## 남은 것

`eslint`가 `practice/basic/SampleTwo.vue`의 미사용 `ref` 하나를 잡는다. 실습 예제 의도라 그대로 뒀다.

## 실행

```sh
npm install
npm run dev
```
