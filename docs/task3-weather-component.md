# 과제 3. 날씨 대시보드 컴포넌트 분리

교재 178p Hands on - Weather Component

## 무엇을 했나

기능은 그대로 두고 과제 2의 컴포넌트 한 개(336줄)를 4개 파일로 쪼개는 과제다.
props, emits, slot, scoped 스타일을 한 화면에서 다 써보게 되어 있다.

| 파일                  | 하는 일                                              | 상태 |
| --------------------- | ---------------------------------------------------- | ---- |
| WeatherParent.vue     | 반응형 데이터와 computed, watch 전부 보유. 자식 조립 | 있음 |
| BaseDashboardCard.vue | 검색박스/리스트박스 공통 디자인, slot                | 없음 |
| SearchBar.vue         | 검색어 표시(props), 입력 전달(emits)                 | 없음 |
| WeatherCard.vue       | 도시 카드 한 장(props), 선택/상세보기 전달(emits)    | 없음 |

## 요구사항 체크

- [x] WeatherParent가 모든 반응형 데이터를 들고 있음 (자식은 상태를 하나도 안 가짐)
- [x] BaseDashboardCard로 검색박스/리스트박스 디자인 공통화, slot 배치
- [x] SearchBar: currentQuery props, update-query emits
- [x] WeatherCard: cityItem props, select-card / click-detail emits
- [x] 컴포넌트별 디자인을 style scoped로 분리
- [x] 슬롯 콘텐츠가 부모 스코프에서 컴파일되는 것 확인 (아래)
- [ ] 본인 목업 부분 추가 컴포넌트화 (예산 패널 분리 예정)

## 데이터 흐름

```
WeatherParent
├─ BaseDashboardCard
│   ├─ SearchBar        :current-query  ->  update-query  -> searchQuery 갱신
│   └─ 예산 input, 1순위 안내 (부모 마크업)
├─ BaseDashboardCard
│   ├─ WeatherCard xN   :city-item      ->  select-card   -> selectedCityInfo 갱신
│   │                                       click-detail  -> showDetail() 실행
│   └─ 검색 결과 없을 때 안내
├─ Watcher 로그
└─ 상태바
```

자식은 아무것도 판단하지 않는다. WeatherCard는 우선순위가 왜 A인지 모른 채
넘겨받은 객체를 그리기만 하고, 클릭됐다는 사실만 위로 올린다. 계산은 전부 부모 computed가 한다.

## 쪼개면서 정한 것들

BaseDashboardCard는 디자인만 공통이라고 보고 제목도 props로 안 받았다.
제목이든 본문이든 부모가 슬롯으로 넣으니까 나중에 다른 카드가 생겨도 이 파일은 안 건드려도 된다.
반대로 WeatherCard는 받을 데이터 모양이 정해져 있어서 `type: Object, required: true`로 규격을 검사한다.

emits로 뭘 보낼지도 이벤트마다 다르게 잡았다.

- update-query: 입력 문자열. 부모는 searchQuery에 대입만 한다
- select-card: 완성된 문구 문자열. 카드가 문장을 만들어 보내면 부모는 대입만 하면 된다
- click-detail: 도시 객체 전체. 상세 리포트에서 등급, 점수, 예산까지 다 쓰기 때문이다

exercise.css에 `/* 과제페이지 스타일 - Component 분리 후 각 페이지별로 이동 */` 이라고 적혀 있어서
weather-card, badge, btn-detail, status-bar 같은 것들을 각 컴포넌트 scoped로 옮겼다.
지금은 이 화면이 전역 css 없이도 그대로 나온다. dashboard-wrapper의 600px 고정폭만
auto로 바꿔서 다른 실습 컴포넌트랑 폭을 맞췄다.

SearchBar에서도 v-model 대신 `:value` + `@input`을 유지했다. 한글 입력 동작이 과제 1, 2와 같아야 해서다.

## 슬롯 스코프 확인

예산 input과 1순위 안내는 BaseDashboardCard 안쪽에 들어가 있지만 마크업 자체는 부모가 쓴 것이다.
그래서 `v-model.number="marketingBudget"`이 그대로 동작한다.
교재 178p 6번에서 말한 내용을 화면으로 확인한 셈이다.

## 남은 것

7번 요구사항(추가 컴포넌트 만들기)은 아직이다. 예산 input과 1순위 안내를 BudgetPanel.vue로 빼고
marketingBudget을 props와 update-budget emits로 연결하면 될 것 같다.

## 확인

- 검색, 예산 변경, 카드 선택, 상세보기, watcher 로그 전부 과제 2와 같게 동작
- npm run build 성공, eslint 통과
- 예산 1000일 때 부산 350만원(35%) A등급, 2222로 바꾸면 778만원으로 재계산되는 것 확인

## 실행

```sh
npm install
npm run dev
```
