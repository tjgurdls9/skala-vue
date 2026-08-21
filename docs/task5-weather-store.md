# 과제 5. 날씨 대시보드 스토어 적용

교재 212p Hands on - Weather Store

## 무엇을 했나

과제 4까지는 화면마다 필요한 데이터를 각자 들고 있었다.
이번엔 Pinia로 전역 저장소를 만들어서 컴포넌트 계층과 무관하게 상태를 공유하는 과제다.

날씨 단위(섭씨/화씨)를 `configStore`에 올리고, 네비게이션 바의 버튼 하나로
대시보드와 상세 페이지의 기온 표기를 동시에 바꾼다.

| 파일                                         | 종류 | 하는 일                                    |
| -------------------------------------------- | ---- | ------------------------------------------ |
| `stores/configStore.js`                      | 신규 | 날씨 단위 state / getter / action          |
| `stores/budgetStore.js`                      | 신규 | 마케팅 총 예산 (요구사항 4번)              |
| `components/weather/UnitToggler.vue`         | 신규 | 단위 표시 + 변경 버튼                      |
| `components/practice/store/StoreCounter.vue` | 신규 | 교재 211p Code Challenge                   |
| `App.vue`                                    | 수정 | 네비게이션 바 오른쪽 끝에 UnitToggler 배치 |
| `components/weather/WeatherCard.vue`         | 수정 | displayTemp computed                       |
| `views/WeatherDetailView.vue`                | 수정 | displayTemp computed                       |
| `views/WeatherHomeView.vue`                  | 수정 | 예산을 budgetStore로                       |
| `views/WeatherSummaryView.vue`               | 수정 | 예산을 budgetStore로                       |

## 요구사항 체크

- [x] `stores/configStore.js`: state `unit`(초기값 celsius) / getter `unitSymbol`(℃·℉) / action `toggleUnit`
- [x] 1. UnitToggler.vue: 단위 설정을 변경하는 UI 버튼과 영역
- [x] 2. Navigation Bar 옆에 UnitToggler.vue 배치
- [x] 3. 메인과 상세 날씨에 단위 설정 변경 적용
- [x] 4. 본인만의 추가 Store 작성 및 활용 (budgetStore)
- [x] (211p Code Challenge) counter 스토어를 쓰는 StoreCounter.vue 작성, Devtools에서 Pinia 확인

## 3단계 중 1단계는 이미 끝나 있었다

교재는 Pinia 등록(main.js) → Store 생성 → Store 사용 3단계를 밟으라고 하는데,
create-vue 스캐폴드가 만들어 둔 것과 겹쳤다.

- `package.json`에 `pinia` 이미 있음
- `main.js`에 `app.use(createPinia())` 이미 있음
- `src/stores/counter.js`가 교재 203p 예제와 **글자 단위로 동일**

교재가 스캐폴드 결과물을 그대로 예제로 쓴 것이다. 그래서 211p Code Challenge는
`StoreCounter.vue` 한 개만 만들면 끝났다.

## Store는 아는 문법의 이름만 바뀐 것

교재 201p 표가 핵심이다.

| Pinia 용어 | Vue 3 문법      | 역할                        |
| ---------- | --------------- | --------------------------- |
| state      | `ref()`         | 전역 공유 데이터            |
| getters    | `computed()`    | state 기반 읽기 전용 파생값 |
| actions    | 일반 `function` | state를 바꾸는 함수         |

```js
export const useConfigStore = defineStore('config', () => {
  const unit = ref('celsius') // state
  const unitSymbol = computed(() => (unit.value === 'fahrenheit' ? '℉' : '℃')) // getters
  function toggleUnit() {
    // actions
    unit.value = unit.value === 'celsius' ? 'fahrenheit' : 'celsius'
  }
  return { unit, unitSymbol, toggleUnit }
})
```

내보내는 함수명은 `use` + 파일명 + `Store` 규칙이라 `useConfigStore`가 된다. (203p)

## 온도 변환

교재 212p가 준 예제 코드를 그대로 썼다.

```js
const displayTemp = computed(() => {
  const rawTemp = props.cityItem.temp // 기본 원본 데이터는 섭씨 숫자
  if (configStore.unit === 'fahrenheit') {
    return Math.round((rawTemp * 9) / 5 + 32) // 화씨 변환 연산
  }
  return rawTemp // 'celsius'일 때는 원본 그대로 반환
})
```

`WeatherCard.vue`와 `WeatherDetailView.vue`에 거의 같은 코드가 두 번 들어간다.
교재가 "유사한 코드가 중복 → Composable로 해결 가능함 (**범위 제외**)"이라고 못박아서
중복을 그대로 뒀다.

등급 판정("기온 26도 → 3등급")과 배지 임계값(`temp >= 25`)은 **원본 섭씨 값으로 비교**한다.
표시만 화씨로 바뀌고 판정 기준은 안 흔들린다.

## 요구사항 4번: budgetStore

마케팅 총 예산은 대시보드와 지표 요약 두 화면에서 쓰는데,
스토어로 올리기 전에는 각자 `ref(1000)`을 들고 있어서 **한쪽에서 바꿔도 다른 쪽은 그대로**였다.
Props로 내려보낼 관계도 아니고(형제도 아닌 남남인 라우트), 전역 상태가 정확히 맞는 상황이었다.

```js
export const useBudgetStore = defineStore('budget', () => {
  const total = ref(1000) // state
  const totalLabel = computed(() => `${total.value}만원`) // getters
  function setTotal(value) {
    // actions
    total.value = value
  }
  return { total, totalLabel, setTotal }
})
```

요약 화면에 500 / 1000 / 2000 프리셋 버튼을 붙여서 `setTotal`을 쓰게 했다.

## storeToRefs를 쓴 이유

교재 205p Frequent Mistakes 항목이다. State와 Getters를 그냥 구조분해하면
Proxy 주소가 끊겨서 화면이 안 갱신된다.

```js
const budgetStore = useBudgetStore()
const { total } = storeToRefs(budgetStore) // ref로 감싸야 반응성 유지
```

`total`이 ref라서 `watch(total, ...)`도 그대로 되고 `v-model.number="total"`로 입력란에도 붙는다.
Actions는 함수라 그냥 `budgetStore.setTotal(...)`로 부른다.

## 교재에 없어서 안 쓴 것

`pdftotext`로 1~212p를 전부 뽑아 grep으로 확인했다.

| 쓰고 싶었던 것         | 교재 등장 | 대신 쓴 것                               |
| ---------------------- | --------- | ---------------------------------------- |
| `toLocaleString`       | 0건       | 문자열 템플릿 `` `${total.value}만원` `` |
| `Intl.NumberFormat`    | 0건       | 〃                                       |
| computed getter/setter | 0건       | `storeToRefs` + `v-model.number`         |
| `Number()`             | 0건       | `v-model.number` 수식어                  |

`storeToRefs`는 205p에 3번 나와서 썼고, `Math.round`도 212p 예제에 있어서 썼다.

## 금액 표기

회계 표기법으로 맞췄다. 천 단위 쉼표를 넣으려면 위 표의 API가 필요한데 교재에 없어서
**CSS만으로 처리**했다.

```css
.summary-table {
  font-variant-numeric: tabular-nums; /* 등폭 숫자, 자릿수가 세로로 맞음 */
}
.summary-table th:nth-child(3),
... td:nth-child(5) {
  text-align: right; /* 수량/비율/금액 열 우측 정렬 */
}
.summary-table tfoot td {
  border-top: 3px double #495057; /* 합계 이중선 */
}
```

예산 입력란도 우측 정렬했다. 쉼표는 없지만 자릿수는 세로로 맞는다.

## 하면서 걸렸던 것

Vue Devtools에서 Pinia를 보려면 크롬 확장이 필요한 줄 알았는데,
이 프로젝트는 `vite.config.js`에 `vite-plugin-vue-devtools`가 켜져 있어서 확장 없이 된다.
페이지 하단 가운데 떠 있는 작은 버튼을 누르거나, `http://localhost:5173/__devtools__/`로 들어가면
왼쪽 아이콘 줄에 파인애플이 있다. 교재 211p 스크린샷과 같은 화면이다.

네비게이션 바는 `exercise.css`가 `justify-content: center`로 잡고 있어서,
링크는 왼쪽에 두고 토글만 오른쪽 끝으로 밀려면 `space-between`으로 덮어야 했다.
링크가 4개라 토글과 붙길래 `gap: 24px`도 같이 줬다.

## 확인

- 단위변경 1회 → 5개 도시 전부 변환: 부산 79℉ / 광주 81℉ / 울산 84℉ / 수원 75℉ / 서울 82℉
  (교재 212p 스크린샷의 서울 82℉, 수원 75℉, 부산 79℉와 일치)
- 홈에서 화씨로 바꾸고 상세 페이지로 이동해도 79℉ 유지 — 전역 스토어라 라우트를 넘어간다
- 요약 화면에서 예산 2000 → 홈에서도 2000, 부산 700만원으로 재계산
- 요약 화면에서 예산 500 → 부산 175만원, 합계 505만원
- StoreCounter 2회 클릭 → state 2, getters 4
- Devtools Store 탭에 `config` / `budget` / `counter` 3개, `unit: celsius`, `unitSymbol: ℃`
- npm run build 성공

Devtools **Timeline 탭에 액션 호출이 기록되는지는 확인하지 못했다.**
녹화를 켜고 다른 탭에서 버튼을 눌러도 "No events"였다.
별도 창(`__devtools__`)이 앱 탭과 다른 인스턴스에 붙는 것으로 보인다.

## 남은 것

스토어가 메모리에만 있어서 **브라우저를 새로고침하면 섭씨·1000만원으로 초기화된다.**
링크로 화면을 옮기는 건 SPA라 유지된다.
교재 209p `authStore`가 `localStorage`로 이 문제를 푸는 패턴을 보여주는데,
과제 요구사항에 없어서 넣지 않았다.

`eslint`가 `practice/basic/SampleTwo.vue`의 미사용 `ref` 하나를 잡는다. 실습 예제 의도라 그대로 뒀다.

## 실행

```sh
npm install
npm run dev
```
