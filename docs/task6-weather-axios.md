# 과제 6. 날씨 대시보드 Axios 연동

교재 230p Hands on - Weather Axios

## 무엇을 했나

과제 5까지는 `weatherList`가 코드에 박아넣은 가짜 배열이었다.
이번엔 axios로 외부 REST API를 호출해서 5개 도시의 기온·습도·미세먼지·풍속을 실시간으로 받아온다.
README에 과제 4 때부터 "weatherList의 소스만 갈아끼우면 된다"고 적어뒀는데, 그 순간이 이번 과제다.

교재 요구사항은 3개다. ① OpenWeatherMap으로 실제 날씨 데이터 적용 ② OpenWeatherMap의 다른 API로 기능 확장
③ 기타 외부 API로 기능 확장.

| 파일                           | 종류 | 하는 일                                              |
| ------------------------------ | ---- | ---------------------------------------------------- |
| `.env` (git 제외)              | 신규 | 발급받은 OpenWeatherMap API 키                       |
| `.env.example` (git 포함)      | 신규 | 값 비운 템플릿                                       |
| `data/weatherApi.js`           | 신규 | axios로 세 개의 외부 API 호출                        |
| `data/weatherMock.js`          | 수정 | 목업 수치를 걷어내고 도시 등록정보(좌표 포함)만 남김 |
| `views/WeatherHomeView.vue`    | 수정 | onMounted에 실시간 조회 + 공휴일 배너                |
| `views/WeatherDetailView.vue`  | 수정 | onMounted에 실시간 조회                              |
| `views/WeatherSummaryView.vue` | 수정 | onMounted에 실시간 조회                              |

## 요구사항 체크

- [x] 1. OpenWeatherMap Current Weather API로 실제 날씨 데이터 적용
- [x] 2. OpenWeatherMap Air Pollution API로 기능 확장 (실제 미세먼지)
- [x] 3. 기타 외부 API(Nager.Date 공휴일)로 기능 확장

## API 키를 .env에 둔 이유

교재 224p 예제는 `const API_KEY = '8964edc...'`처럼 키를 스크립트에 직접 적는다.
그런데 교재 218p·220p·224p 스크린샷에 강사님 개인 키가 그대로 캡처돼서 노출돼 있다.
이 리포는 git으로 관리되니 그대로 따라 하면 내 키도 커밋에 박제된다.

`import.meta.env`는 교재 문법 범위 밖의 Vite 문법이지만, 키 노출은 실제 사고로 이어지는 문제라
문법 준수보다 우선했다. `.env`는 `.gitignore`에 추가하고, 값이 빈 `.env.example`만 커밋해서
다른 사람이 리포를 받아도 본인 키를 채워 넣는 자리는 남겨뒀다.

```js
const API_KEY = import.meta.env.VITE_OPENWEATHER_KEY
```

## 좌표 기반으로 조회

교재 220p가 보여준 두 가지 호출 방식 중 위도/경도 방식을 썼다.

```
https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API key}&units=metric&lang=kr
```

도시 이름(`q=Seoul`)으로 부르는 방식도 교재에 있지만, 이름 매칭은 오차가 날 수 있고
이미 화면에 잘 나오던 지역명(대한민국 서울특별시 등)과 별개로 관리해야 해서 좌표를 썼다.
`weatherMock.js`의 도시 등록정보에 `lat`/`lon`을 하나씩 추가했다.

```js
export const weatherList = [
  { id: 'city_01', name: '서울', region: '대한민국 서울특별시', lat: 37.5665, lon: 126.978 },
  // ...
]
```

## 미세먼지는 별도 엔드포인트

Current Weather API 응답에는 미세먼지가 없다. 교재 219p Free Tier 표에 있는
Air Pollution API를 좌표로 한 번 더 호출해서 PM2.5 값을 받는다. 두 요청을 axios.all로 동시에 보낸다.
(교재 226p 병렬 요청)

```js
export const fetchCityWeather = async (city) => {
  const [weather, air] = await axios.all([
    fetchCurrentWeather(city.lat, city.lon),
    fetchAirPollution(city.lat, city.lon),
  ])
  return {
    ...city,
    temp: Math.round(weather.main.temp),
    status: weather.weather[0].description,
    humidity: weather.main.humidity,
    wind: weather.wind.speed,
    microdust: Math.round(air.list[0].components.pm2_5),
  }
}
```

등급 판정 함수(`gradeCity`, `buildBudgetPlan`)는 과제 3부터 값만 받아서 계산하는 순수 함수였다.
데이터가 목업이든 실시간이든 그대로 재사용된다. 손댈 필요가 없었다.

## 기타 외부 API: 처음 두 후보가 죽어 있었다

REST Countries와 Numbers API를 후보로 냈었는데, curl로 직접 찍어보니 둘 다 안 됐다.

- REST Countries: `{"errors":[{"message":"Authorization key required."}]}` — 유료로 전환됨
- Numbers API: `404 Not Found` — 서비스가 죽음

검증 없이 "키 불필요"라고 안내했던 게 틀렸던 것이다. 다시 curl로 확인해서 실제로 되는
Nager.Date(공휴일)와 Frankfurter(환율) 두 개만 다시 추렸고, 공휴일 쪽을 붙였다.
"마케팅 예산 집행"이라는 앱 주제와 "공휴일에 야외 행사가 잘 된다"가 자연스럽게 엮여서다.

```js
export const fetchHolidays = async (year) => {
  const response = await axios.get(`${HOLIDAY_URL}/${year}/KR`)
  return response.data
}
```

키가 필요 없어서 `.env` 없이 그냥 부른다.

## try/catch/finally + alert

교재 224p 패턴을 그대로 썼다. `isLoading`으로 버튼을 잠그고, 실패하면 `catch`에서
`console.error` + `alert`, 성공하든 실패하든 `finally`에서 로딩을 푼다.

```js
const loadWeather = async () => {
  isLoading.value = true
  try {
    weatherList.value = await axios.all(cityRegistry.map(fetchCityWeather))
  } catch (error) {
    console.error('통신 중 에러가 발생했습니다:', error)
    alert('날씨 데이터를 가져오지 못했습니다. API 키 활성화 여부나 주소를 확인하세요.')
  } finally {
    isLoading.value = false
  }
}
```

## 세 화면이 각자 따로 조회한다

홈·상세·요약 세 화면이 자기 `onMounted`에서 독립적으로 axios를 부른다. 상세 페이지 하나만 열어도
그 도시 하나만 조회하지, 5개를 다 불러오지 않는다. 세 화면이 fetch 로직을 공유하지 않는 건
과제 4의 온도 변환, 과제 5의 예산 계산 때부터 이어온 것과 같은 이유다. 교재가 "Composable로
해결 가능함 (범위 제외)"라고 못박은 지점을 그대로 지킨 것이다.

## 확인

- 브라우저 네트워크 탭에서 새로고침 1회 → 10건 요청(5개 도시 × Current Weather + Air Pollution),
  전부 200 OK
- 부산 33℃ / 습도 58% / 미세먼지 19 — 재조회할 때마다 값이 바뀜 (진짜 API라는 뜻)
- 홈 화면 상단에 "📅 다가오는 공휴일: 2026-09-24 추석" 배너 노출
- 상세 페이지도 목록과 별개로 실시간 조회, 등급 판정 정상 (1×3×3=9점 등)
- 요약 표도 실시간 데이터로 예산 재계산
- 콘솔 에러 0건, npm run build 성공

키를 처음 테스트했을 때 401(Invalid API key)이 났다. OpenWeatherMap은 키 발급 직후
활성화까지 시간이 걸린다는 게 원인이었고, curl로 재확인해서 200이 뜨는 걸 보고 나서야
연동이 됐다고 판단했다.

## 남은 것

`eslint`가 `practice/basic/SampleTwo.vue`의 미사용 `ref` 하나를 잡는다. 실습 예제 의도라 그대로 뒀다.

Nager.Date는 연도 단위로 조회한다. 연말에 새해 공휴일을 미리 보여주진 못한다. (ponytail 주석으로
코드에 남겨뒀다.) 해가 바뀌면 새로고침으로 갱신된다.

## 실행

```sh
npm install
cp .env.example .env   # 본인이 발급받은 OpenWeatherMap 키를 채워 넣는다
npm run dev
```
