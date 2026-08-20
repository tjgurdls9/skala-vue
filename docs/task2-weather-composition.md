# 과제 2. 날씨 대시보드 (Composition API)

교재 145p Hands on - Weather Composition

## 무엇을 했나

과제 1 화면에 computed, watch, watchEffect를 붙이는 과제다.
계산해둔 값을 변수에 담아놓지 말고 원본 상태에서 파생시키는 게 요점이다.

파일: `src/components/Task2WeatherComposition.vue`
과제 3에서 이걸 4개로 쪼갰기 때문에 지금 트리에는 없다.
`git show 086bf5e:src/components/Task2WeatherComposition.vue`

## 요구사항 체크

- [x] searchQuery, selectedCityInfo, weatherList를 ref로 관리 (1일차 데이터 그대로)
- [x] filteredWeatherList를 computed로 작성
- [x] selectedCityInfo를 watch로 감시, 콘솔 로그
- [x] searchQuery를 watchEffect로 감시, 콘솔 로그
- [x] 검색 결과 세 경우(빈 검색어/일치/불일치) 처리
- [x] 본인 반응형 변수, computed, watcher 추가

빈 검색어면 원본 리스트를 그대로 반환하고, 일치하는 도시가 없으면
"검색어와 일치하는 도시가 없습니다"를 띄운다.

## 추가한 것: 날씨로 마케팅 예산 나누기

목록 필터만 하면 computed를 한 번밖에 안 쓰게 돼서, 날씨 지표를 점수로 바꾸고
그 점수 비율대로 예산을 나누는 계산을 붙였다. computed가 여러 단으로 물릴 때
어디까지 자동으로 다시 계산되는지 보고 싶었다.

추가한 상태

- `marketingBudget` = ref(1000), 총 예산(만원). v-model.number로 묶음
- `logs` = ref([]), watcher 로그를 화면에도 보여주려고 만든 배열

computed 순서

```
searchQuery + weatherList -> filteredWeatherList -> scoredList -> totalScore, evenShare
                                                        |
                          marketingBudget --------------+-> budgetPlan -> topCity
```

- scoredList: 기온/습도/미세먼지를 각각 3, 2, 1등급으로 판정하고 세 등급을 곱해서 점수를 낸다
- totalScore: 화면에 보이는 도시들의 점수 합
- evenShare: 100 / 도시 수 (균등 배분선)
- budgetPlan: 점수 비율대로 예산과 %를 계산하고 우선순위(A/B/C)를 붙인 뒤 점수 내림차순 정렬
- topCity: 1순위 도시

등급 기준은 GRADE_STANDARD 상수로 빼놨다.

| 지표     | 3등급   | 2등급   | 1등급   |
| -------- | ------- | ------- | ------- |
| 기온     | 20~26도 | 16~30도 | 나머지  |
| 습도     | 40~60%  | 30~70%  | 나머지  |
| 미세먼지 | 30 미만 | 50 미만 | 50 이상 |

합이 아니라 곱으로 한 이유는, 하나라도 1등급이면 총점이 확 떨어져야 한다고 봤기 때문이다.
기온이 아무리 좋아도 미세먼지가 나쁘면 야외 행사는 못 한다.

우선순위는 절대 기준이 아니라 균등 배분선 대비로 매겼다.
`share >= evenShare * 1.3`이면 A, `>= evenShare * 0.8`이면 B, 나머지 C.
이러면 검색으로 도시를 걸러낼 때 모수가 바뀌면서 등급도 다시 계산된다.

추가한 watcher

```js
watch(marketingBudget, (budget) => {
  const top = topCity.value
  addLog(`💰 총 예산 ${budget}만원 기준으로 다시 배분했습니다. (1순위: ${top ? top.name : '없음'})`)
})
```

## 로그를 화면에도 뿌린 이유

콘솔만 찍으면 개발자도구를 열기 전엔 watcher가 도는지 알 수가 없다.
addLog 하나에서 console.log와 logs 배열을 같이 갱신하고, details 태그로 최근 20건을 접어뒀다.

```js
const addLog = (message) => {
  console.log(message)
  history = [`${new Date().toLocaleTimeString()} ${message}`, ...history].slice(0, LOG_LIMIT)
  logs.value = history
}
```

history는 그냥 배열로 두고 완성된 걸 logs.value에 넣는다. 반응형 배열에 매번 push하는 것보다 낫다고 봤다.

## 상세보기 alert

과제 1에서는 한 줄이었는데, 여기서는 예산이 왜 그 금액이 나왔는지 계산 과정을 다 적었다.

```
[등급 판정]  기온 26도 -> 3등급 (20~26도면 3등급) ...
[집행 점수]  3 x 2 x 2 = 12점 (최고 27점)
             가장 낮은 등급은 습도(2등급). 여기가 병목이다.
[예산 편성]  1) 점수 합계 12 + 6 + 6 + 6 + 4 = 34점
             2) 이 도시 몫 12 / 34 = 35%
             3) 1000만원 x 35% = 350만원
             4) 우선순위 A (균등 배분선 20%의 1.3배 이상)
[실행안]     야외 프로모션 최적 ...
```

## 화면 구성

- 도시 검색 박스: 검색 input, 마케팅 총 예산 input, 1순위 도시 안내
- 지역별 날씨 현황: budgetPlan 순서대로 카드 출력, 카드 안에 의사결정 지표 배지 4개
- Watcher 로그(접이식)
- 상태바

## 배운 것

computed는 캐시된다. scoredList를 여러 군데서 참조해도 원본이 안 바뀌면 다시 계산 안 한다.
잘게 쪼개도 손해가 없어서 단계를 나눠 이름을 붙였더니 읽기 쉬워졌다.

이전 값이 필요하면 watch, 알아서 따라가게 하려면 watchEffect가 맞다.
watchEffect는 콜백 안에서 읽은 값이 전부 의존성이 되기 때문에, 로그 문구에
filteredWeatherList.length를 넣는 순간 그것도 트리거가 된다.

정렬된 목록이나 예산을 별도 ref로 들고 있었으면 동기화 코드가 필요했을 텐데,
전부 computed로 파생시키니 갱신 코드를 한 줄도 안 썼다.

## 실행

```sh
npm install
npm run dev
```
