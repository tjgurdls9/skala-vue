# 과제 1. 날씨 대시보드 Mockup

교재 116p Hands on - Weather Mockup
2026-08-19 수업 중 작성 (진행 1시간)

## 무엇을 만들었나

v-for, v-if, 이벤트 정도만 써서 날씨 대시보드 화면을 만드는 과제다.
API 연동은 나중에 하기로 했으니 데이터는 배열로 직접 박아넣었다.

파일: `src/components/Task1WhetherMockup.vue`
과제 3에서 이 화면을 컴포넌트로 다시 쪼갰기 때문에 지금 소스 트리에는 없다.
`git show 12fca5b:src/components/Task1WhetherMockup.vue` 로 볼 수 있다.

## 요구사항 체크

- [x] 배열 렌더링: `v-for="item in weatherList" :key="item.id"`
- [x] 조건부 렌더링: 기온 25도 기준으로 더움/선선함 배지
- [x] 한글 검색 입력: `v-model` 대신 `:value` + `@input`
- [x] 이벤트 수식어: 상세보기 버튼에 `@click.stop` 걸고 window.alert
- [x] 본인 데이터 추가

## 데이터를 어떻게 바꿨나

교재 예시는 `{ id, name, temp, status }` 에 도시 3개였다.
기온만 있으면 밖에 나가도 되는지 판단이 안 될 것 같아서 습도(humidity)와 미세먼지(microdust)를 넣었다.

```js
const weatherList = ref([
  { id: 'city_01', name: '서울', temp: 28, status: '맑음', humidity: 68, microdust: 55 },
  { id: 'city_02', name: '광주', temp: 27, status: '비', humidity: 82, microdust: 20 },
  { id: 'city_03', name: '울산', temp: 29, status: '맑음', humidity: 45, microdust: 88 },
  { id: 'city_04', name: '수원', temp: 24, status: '비', humidity: 75, microdust: 33 },
  { id: 'city_05', name: '부산', temp: 26, status: '흐림', humidity: 35, microdust: 42 },
])
```

도시도 5개로 늘렸다. 고온다습(서울), 저온다습(수원), 고온건조에 먼지 나쁨(울산) 식으로
지표 조합이 겹치지 않게 값을 정했다. 과제 2에서 점수를 매길 때 등급이 다 똑같이 나오면 재미없을 것 같아서다.

## 배지

지표가 3개가 됐으니 배지도 3줄이다. 습도는 3단계라 `v-else-if`를 쓴다.

```vue
<span v-if="item.humidity >= 60" class="badge humid">🌫️ 습함 (60% 이상)</span>
<span v-else-if="item.humidity >= 40" class="badge good">🍀 상쾌함 (40~59%)</span>
<span v-else class="badge dry">🌵 건조함 (40% 미만)</span>
```

라벨에 기준값을 같이 적어놨다. 데이터 바꿔가며 확인할 때 기준을 코드에서 찾지 않아도 돼서 편했다.
exercise.css에는 hot, cool 색만 있어서 나머지 5개 배지 색은 컴포넌트 scoped에 따로 넣었다.

## 화면 구성

- 도시 검색: input, 아래에 입력 중인 도시명 그대로 출력
- 지역별 날씨 현황: 카드 5장, 카드 클릭하면 상태바 문구 변경
- 카드 안: 도시명(상태), 기온, 습도, 미세먼지, 배지 3줄, 상세보기 버튼
- 상태바: 선택된 도시 문구

## 하면서 걸렸던 것

v-model을 쓰면 한글 입력 중간(ㅅ, 서)에는 값이 안 들어온다. 조합이 끝나야 반영된다.
교재가 `:value` + `@input`으로 하라고 한 이유가 이거였다.

상세보기 버튼이 카드 안에 있어서 그냥 누르면 alert도 뜨고 카드 선택도 같이 된다.
`@click.stop` 붙이니까 해결됐다.

weatherList만 ref로 잡아두면 나중에 API 응답으로 갈아끼워도 화면은 그대로 돌아갈 것 같다.

## 실행

```sh
npm install
npm run dev
```
