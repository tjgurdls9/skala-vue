// 도시 등록 정보(좌표 포함)와 등급 판정 로직.
// 과제 6부터 temp/humidity/microdust/wind/status는 weatherApi.js가 실시간으로 채운다.
// 이 파일에는 axios 호출이 없이도 동일하게 굴러가는 순수 데이터/함수만 남긴다.
//
// 2026-08-21: "마케팅에 치중됐다"는 지적을 받고 실제 날씨경영 서비스(AccuWeather for Business,
// Tomorrow.io Retail, 케이웨더)를 조사해 보니 공통으로 마케팅/재고/인력/리스크경보 4개 축을 다뤘다.
// 아래 buildInventoryAdvice/buildStaffingAdvice/buildRiskAlerts가 그 나머지 3개 축이다.
// ponytail: 실제 서비스는 과거 매출과 기상의 상관관계(임계온도)로 이 임계값을 도출하지만, 우리에게는
// 그런 매출 데이터가 없다. 그래서 GRADE_STANDARD와 같은 결의 고정 임계값 휴리스틱으로 대신한다 —
// 실 매출 데이터가 생기면 그 상관분석으로 교체하는 게 다음 단계.

// 2026-08-21: 5개 도시(수도권+광역시 일부)에서 전국 17개 시·도 대표 지점으로 확장했다.
// 8개 특별·광역시는 그 시 자체, 9개 도는 도청 소재지 좌표를 썼다 (임의로 아무 도시나 고른 게 아님).
export const weatherList = [
  { id: 'city_01', name: '서울', region: '대한민국 서울특별시', lat: 37.5665, lon: 126.978 },
  { id: 'city_02', name: '부산', region: '대한민국 부산광역시', lat: 35.1796, lon: 129.0756 },
  { id: 'city_03', name: '대구', region: '대한민국 대구광역시', lat: 35.8714, lon: 128.6014 },
  { id: 'city_04', name: '인천', region: '대한민국 인천광역시', lat: 37.4563, lon: 126.7052 },
  { id: 'city_05', name: '광주', region: '대한민국 광주광역시', lat: 35.1595, lon: 126.8526 },
  { id: 'city_06', name: '대전', region: '대한민국 대전광역시', lat: 36.3504, lon: 127.3845 },
  { id: 'city_07', name: '울산', region: '대한민국 울산광역시', lat: 35.5384, lon: 129.3114 },
  { id: 'city_08', name: '세종', region: '대한민국 세종특별자치시', lat: 36.48, lon: 127.289 },
  {
    id: 'city_09',
    name: '수원',
    region: '대한민국 경기도 수원시 (도청소재지)',
    lat: 37.2636,
    lon: 127.0286,
  },
  {
    id: 'city_10',
    name: '춘천',
    region: '대한민국 강원특별자치도 춘천시 (도청소재지)',
    lat: 37.8813,
    lon: 127.7298,
  },
  {
    id: 'city_11',
    name: '청주',
    region: '대한민국 충청북도 청주시 (도청소재지)',
    lat: 36.6424,
    lon: 127.489,
  },
  {
    id: 'city_12',
    name: '홍성',
    region: '대한민국 충청남도 홍성군 (도청소재지)',
    lat: 36.6009,
    lon: 126.6608,
  },
  {
    id: 'city_13',
    name: '전주',
    region: '대한민국 전북특별자치도 전주시 (도청소재지)',
    lat: 35.8242,
    lon: 127.148,
  },
  {
    id: 'city_14',
    name: '무안',
    region: '대한민국 전라남도 무안군 (도청소재지)',
    lat: 34.9865,
    lon: 126.3927,
  },
  {
    id: 'city_15',
    name: '안동',
    region: '대한민국 경상북도 안동시 (도청소재지)',
    lat: 36.5684,
    lon: 128.7294,
  },
  {
    id: 'city_16',
    name: '창원',
    region: '대한민국 경상남도 창원시 (도청소재지)',
    lat: 35.2281,
    lon: 128.6811,
  },
  {
    id: 'city_17',
    name: '제주',
    region: '대한민국 제주특별자치도 제주시',
    lat: 33.4996,
    lon: 126.5312,
  },

  // 12차: 지도에 시군구 251개를 그리고 나니 관측점 17개는 눈에 띄게 성겼다.
  // 시·도 대표 17곳에 주요 도시를 더해 45곳으로 늘렸다. 한 도시당 API 2회(현재날씨+대기질)라
  // 45곳이면 90회인데, OpenWeatherMap 무료 티어는 분당 60회다 — 그래서 weatherStore가
  // 25곳씩 끊어서 부른다(자세한 건 weatherStore.js의 load 주석 참고).
  {
    id: 'city_18',
    name: '성남',
    region: '대한민국 경기도 성남시',
    lat: 37.42,
    lon: 127.1267,
  },
  {
    id: 'city_19',
    name: '고양',
    region: '대한민국 경기도 고양시',
    lat: 37.6584,
    lon: 126.832,
  },
  {
    id: 'city_20',
    name: '용인',
    region: '대한민국 경기도 용인시',
    lat: 37.2411,
    lon: 127.1776,
  },
  {
    id: 'city_21',
    name: '파주',
    region: '대한민국 경기도 파주시',
    lat: 37.7599,
    lon: 126.78,
  },
  {
    id: 'city_22',
    name: '평택',
    region: '대한민국 경기도 평택시',
    lat: 36.9921,
    lon: 127.1129,
  },
  {
    id: 'city_23',
    name: '강릉',
    region: '대한민국 강원특별자치도 강릉시',
    lat: 37.7519,
    lon: 128.8761,
  },
  {
    id: 'city_24',
    name: '원주',
    region: '대한민국 강원특별자치도 원주시',
    lat: 37.3422,
    lon: 127.9202,
  },
  {
    id: 'city_25',
    name: '속초',
    region: '대한민국 강원특별자치도 속초시',
    lat: 38.207,
    lon: 128.5918,
  },
  {
    id: 'city_26',
    name: '충주',
    region: '대한민국 충청북도 충주시',
    lat: 36.991,
    lon: 127.926,
  },
  {
    id: 'city_27',
    name: '제천',
    region: '대한민국 충청북도 제천시',
    lat: 37.1326,
    lon: 128.191,
  },
  {
    id: 'city_28',
    name: '천안',
    region: '대한민국 충청남도 천안시',
    lat: 36.8151,
    lon: 127.1139,
  },
  {
    id: 'city_29',
    name: '서산',
    region: '대한민국 충청남도 서산시',
    lat: 36.7848,
    lon: 126.4503,
  },
  {
    id: 'city_30',
    name: '군산',
    region: '대한민국 전북특별자치도 군산시',
    lat: 35.9676,
    lon: 126.7369,
  },
  {
    id: 'city_31',
    name: '남원',
    region: '대한민국 전북특별자치도 남원시',
    lat: 35.4164,
    lon: 127.3905,
  },
  {
    id: 'city_32',
    name: '목포',
    region: '대한민국 전라남도 목포시',
    lat: 34.8118,
    lon: 126.3922,
  },
  {
    id: 'city_33',
    name: '여수',
    region: '대한민국 전라남도 여수시',
    lat: 34.7604,
    lon: 127.6622,
  },
  {
    id: 'city_34',
    name: '순천',
    region: '대한민국 전라남도 순천시',
    lat: 34.9506,
    lon: 127.4872,
  },
  {
    id: 'city_35',
    name: '나주',
    region: '대한민국 전라남도 나주시',
    lat: 35.016,
    lon: 126.7108,
  },
  {
    id: 'city_36',
    name: '포항',
    region: '대한민국 경상북도 포항시',
    lat: 36.019,
    lon: 129.3435,
  },
  {
    id: 'city_37',
    name: '구미',
    region: '대한민국 경상북도 구미시',
    lat: 36.1195,
    lon: 128.3446,
  },
  {
    id: 'city_38',
    name: '경주',
    region: '대한민국 경상북도 경주시',
    lat: 35.8562,
    lon: 129.2247,
  },
  {
    id: 'city_39',
    name: '김천',
    region: '대한민국 경상북도 김천시',
    lat: 36.1398,
    lon: 128.1136,
  },
  {
    id: 'city_40',
    name: '울릉',
    region: '대한민국 경상북도 울릉군',
    lat: 37.4845,
    lon: 130.9057,
  },
  {
    id: 'city_41',
    name: '진주',
    region: '대한민국 경상남도 진주시',
    lat: 35.18,
    lon: 128.1076,
  },
  {
    id: 'city_42',
    name: '통영',
    region: '대한민국 경상남도 통영시',
    lat: 34.8544,
    lon: 128.4331,
  },
  {
    id: 'city_43',
    name: '거제',
    region: '대한민국 경상남도 거제시',
    lat: 34.8806,
    lon: 128.6211,
  },
  {
    id: 'city_44',
    name: '김해',
    region: '대한민국 경상남도 김해시',
    lat: 35.2285,
    lon: 128.8894,
  },
  {
    id: 'city_45',
    name: '서귀포',
    region: '대한민국 제주특별자치도 서귀포시',
    lat: 33.2541,
    lon: 126.56,
  },
  // 13차: 지도를 화면 가운데로 키우자 관측 지점이 수도권·주요 도시에 몰려 있는 게
  // 그대로 드러났다(강원 산간·경북 내륙·전남 서부는 가까운 지점이 없어 색이 흐렸다).
  // 도 단위로 고르게 퍼지도록 내륙·산간·도서 지점을 채웠다.
  {
    id: 'city_46',
    name: '의정부',
    region: '대한민국 경기도 의정부시',
    lat: 37.7381,
    lon: 127.0337,
  },
  {
    id: 'city_47',
    name: '남양주',
    region: '대한민국 경기도 남양주시',
    lat: 37.636,
    lon: 127.2165,
  },
  {
    id: 'city_48',
    name: '안산',
    region: '대한민국 경기도 안산시',
    lat: 37.3219,
    lon: 126.8309,
  },
  {
    id: 'city_49',
    name: '화성',
    region: '대한민국 경기도 화성시',
    lat: 37.1996,
    lon: 126.831,
  },
  {
    id: 'city_50',
    name: '이천',
    region: '대한민국 경기도 이천시',
    lat: 37.2723,
    lon: 127.435,
  },
  {
    id: 'city_51',
    name: '포천',
    region: '대한민국 경기도 포천시',
    lat: 37.8949,
    lon: 127.2003,
  },
  {
    id: 'city_52',
    name: '동해',
    region: '대한민국 강원특별자치도 동해시',
    lat: 37.5247,
    lon: 129.1143,
  },
  {
    id: 'city_53',
    name: '태백',
    region: '대한민국 강원특별자치도 태백시',
    lat: 37.1641,
    lon: 128.9856,
  },
  {
    id: 'city_54',
    name: '홍천',
    region: '대한민국 강원특별자치도 홍천군',
    lat: 37.6971,
    lon: 127.8888,
  },
  {
    id: 'city_55',
    name: '영월',
    region: '대한민국 강원특별자치도 영월군',
    lat: 37.1836,
    lon: 128.4617,
  },
  {
    id: 'city_56',
    name: '철원',
    region: '대한민국 강원특별자치도 철원군',
    lat: 38.1466,
    lon: 127.3132,
  },
  {
    id: 'city_57',
    name: '음성',
    region: '대한민국 충청북도 음성군',
    lat: 36.9403,
    lon: 127.6906,
  },
  {
    id: 'city_58',
    name: '영동',
    region: '대한민국 충청북도 영동군',
    lat: 36.175,
    lon: 127.7765,
  },
  {
    id: 'city_59',
    name: '보령',
    region: '대한민국 충청남도 보령시',
    lat: 36.3333,
    lon: 126.6127,
  },
  {
    id: 'city_60',
    name: '공주',
    region: '대한민국 충청남도 공주시',
    lat: 36.4465,
    lon: 127.119,
  },
  {
    id: 'city_61',
    name: '논산',
    region: '대한민국 충청남도 논산시',
    lat: 36.1872,
    lon: 127.0987,
  },
  {
    id: 'city_62',
    name: '익산',
    region: '대한민국 전북특별자치도 익산시',
    lat: 35.9483,
    lon: 126.9576,
  },
  {
    id: 'city_63',
    name: '정읍',
    region: '대한민국 전북특별자치도 정읍시',
    lat: 35.5699,
    lon: 126.856,
  },
  {
    id: 'city_64',
    name: '무주',
    region: '대한민국 전북특별자치도 무주군',
    lat: 36.0068,
    lon: 127.6608,
  },
  {
    id: 'city_65',
    name: '해남',
    region: '대한민국 전라남도 해남군',
    lat: 34.5735,
    lon: 126.599,
  },
  {
    id: 'city_66',
    name: '장흥',
    region: '대한민국 전라남도 장흥군',
    lat: 34.6816,
    lon: 126.907,
  },
  {
    id: 'city_67',
    name: '광양',
    region: '대한민국 전라남도 광양시',
    lat: 34.9407,
    lon: 127.6959,
  },
  {
    id: 'city_68',
    name: '영광',
    region: '대한민국 전라남도 영광군',
    lat: 35.2772,
    lon: 126.512,
  },
  {
    id: 'city_69',
    name: '영주',
    region: '대한민국 경상북도 영주시',
    lat: 36.8057,
    lon: 128.624,
  },
  {
    id: 'city_70',
    name: '상주',
    region: '대한민국 경상북도 상주시',
    lat: 36.4109,
    lon: 128.159,
  },
  {
    id: 'city_71',
    name: '울진',
    region: '대한민국 경상북도 울진군',
    lat: 36.993,
    lon: 129.4004,
  },
  {
    id: 'city_72',
    name: '영덕',
    region: '대한민국 경상북도 영덕군',
    lat: 36.4152,
    lon: 129.3656,
  },
  {
    id: 'city_73',
    name: '문경',
    region: '대한민국 경상북도 문경시',
    lat: 36.5865,
    lon: 128.1868,
  },
  {
    id: 'city_74',
    name: '경산',
    region: '대한민국 경상북도 경산시',
    lat: 35.8251,
    lon: 128.7414,
  },
  {
    id: 'city_75',
    name: '밀양',
    region: '대한민국 경상남도 밀양시',
    lat: 35.5038,
    lon: 128.7466,
  },
  {
    id: 'city_76',
    name: '양산',
    region: '대한민국 경상남도 양산시',
    lat: 35.335,
    lon: 129.0374,
  },
  {
    id: 'city_77',
    name: '사천',
    region: '대한민국 경상남도 사천시',
    lat: 35.0035,
    lon: 128.0642,
  },
  {
    id: 'city_78',
    name: '거창',
    region: '대한민국 경상남도 거창군',
    lat: 35.6866,
    lon: 127.9095,
  },
  {
    id: 'city_79',
    name: '남해',
    region: '대한민국 경상남도 남해군',
    lat: 34.8376,
    lon: 127.8925,
  },
  {
    id: 'city_80',
    name: '합천',
    region: '대한민국 경상남도 합천군',
    lat: 35.5666,
    lon: 128.1658,
  },
  {
    id: 'city_81',
    name: '강화',
    region: '대한민국 인천광역시 강화군',
    lat: 37.7473,
    lon: 126.4878,
  },
  {
    id: 'city_82',
    name: '진도',
    region: '대한민국 전라남도 진도군',
    lat: 34.4867,
    lon: 126.2634,
  },
  {
    id: 'city_83',
    name: '완도',
    region: '대한민국 전라남도 완도군',
    lat: 34.311,
    lon: 126.755,
  },
]

// 동적 경로 파라미터(:cityId)로 도시 등록 정보 하나를 꺼낸다. 없으면 null.
export const findCity = (cityId) => weatherList.find((item) => item.id === cityId) ?? null

// --- 등급 판정 기준 (과제 3부터 그대로) ---

export const GRADE_STANDARD = {
  temp: { bestMin: 20, bestMax: 26, okMin: 16, okMax: 30 },
  humidity: { bestMin: 40, bestMax: 60, okMin: 30, okMax: 70 },
  dust: { best: 30, ok: 50 },
}
export const MAX_SCORE = 27
export const HIGH_SCORE = 12
export const MID_SCORE = 6
const OUTDOOR_MIN_SCORE = 8

// key는 프레젠테이션 레이어(각 .vue 파일)에서 아이콘을 고르는 데 쓴다.
// 이 파일은 순수 데이터/함수만 남기기로 했으므로(파일 상단 주석 참고) 여기서 Vue 아이콘 컴포넌트를
// 직접 import하지 않고, 의미만 담은 key 문자열로 넘긴다.
const getSegment = (grade) => {
  if (grade.dust === 1)
    return {
      key: 'indoor',
      label: '실내 집중형',
      plan: '미세먼지가 나빠 옥외 행사는 어렵습니다. 실내 거점과 비대면 채널 위주로 전환할 것을 제안합니다.',
    }
  if (grade.score >= OUTDOOR_MIN_SCORE)
    return {
      key: 'outdoor',
      label: '옥외 활동 적합',
      plan: '기온·습도·대기질 세 지표가 모두 양호합니다. 옥외 행사 진행에 제약이 없습니다.',
    }
  if (grade.humidity === 1)
    return {
      key: 'humidity',
      label: '습도 관리형',
      plan: '높은 습도로 불쾌지수가 올라 체류 시간이 짧아집니다. 냉방·환기가 확보된 공간을 쓰거나, 접점을 짧고 강하게 설계할 것을 제안합니다.',
    }
  return {
    key: 'neutral',
    label: '무난형',
    plan: '특별한 제약이 없습니다. 기존 운영안을 유지해 전환 비용을 아끼는 편을 제안합니다.',
  }
}

const gradeTemp = (value) => {
  const standard = GRADE_STANDARD.temp
  if (value >= standard.bestMin && value <= standard.bestMax) return 3
  if (value >= standard.okMin && value <= standard.okMax) return 2
  return 1
}

const gradeHumidity = (value) => {
  const standard = GRADE_STANDARD.humidity
  if (value >= standard.bestMin && value <= standard.bestMax) return 3
  if (value >= standard.okMin && value <= standard.okMax) return 2
  return 1
}

const gradeDust = (value) => {
  const standard = GRADE_STANDARD.dust
  if (value < standard.best) return 3
  if (value < standard.ok) return 2
  return 1
}

// 도시 하나에 등급/코드/세그먼트를 붙여서 돌려준다.
export const gradeCity = (item) => {
  const temp = gradeTemp(item.temp)
  const humidity = gradeHumidity(item.humidity)
  const dust = gradeDust(item.microdust)
  const grade = { temp, humidity, dust, score: temp * humidity * dust }
  return { ...item, grade, code: `${temp}-${humidity}-${dust}`, segment: getSegment(grade) }
}

// --- 경영 의사결정 확장: 재고 / 인력 / 리스크경보 (마케팅 축과 별개로 원본 수치를 직접 본다) ---

const INVENTORY_HOT_TEMP = 28 // 이 온도 이상이면 냉장류 수요가 뛴다고 본다
const INVENTORY_COLD_TEMP = 5 // 이 온도 이하면 방한류 수요가 뛴다고 본다
const RAIN_WEATHER_MAIN = ['Rain', 'Drizzle', 'Thunderstorm', 'Snow']
const HEATWAVE_TEMP = 33
const HIGH_HUMIDITY = 85

// 원본 기온/미세먼지 값으로 발주·재고 권고 문구를 만든다. gradeCity()의 등급(1~3)은 이상치와의
// "거리"만 알려줘서 덥다/춥다 방향을 구분 못 한다 — 재고 조언은 방향이 핵심이라 원본값을 직접 본다.
export const buildInventoryAdvice = (item) => {
  if (item.temp >= INVENTORY_HOT_TEMP) {
    return {
      key: 'cold-drink',
      label: '냉장 상품 확대',
      text: `기온 ${item.temp}도 — 냉방·수분 보충 관련 수요가 오릅니다. 공급량 상향을 권장합니다.`,
    }
  }
  if (item.temp <= INVENTORY_COLD_TEMP) {
    return {
      key: 'hot-drink',
      label: '방한 상품 확대',
      text: `기온 ${item.temp}도 — 핫팩·방한용품·온장 음료 발주를 늘리는 것을 권장합니다.`,
    }
  }
  if (item.microdust >= GRADE_STANDARD.dust.ok) {
    return {
      key: 'dust',
      label: '방진 상품 확대',
      text: '미세먼지가 나쁩니다. 마스크·공기청정 관련 상품을 진열 전면에 배치하는 것을 권장합니다.',
    }
  }
  return {
    key: 'neutral',
    label: '평시 재고 유지',
    text: '기온·대기질이 평이합니다. 통상 발주 수준을 유지합니다.',
  }
}

// weatherMain(OpenWeatherMap 응답에 이미 있는 필드)으로 강수 여부를 판단해 인력 배치를 제안한다.
export const buildStaffingAdvice = (item) => {
  if (RAIN_WEATHER_MAIN.includes(item.weatherMain)) {
    return {
      key: 'rain',
      label: '실내 인력 강화',
      text: '강수가 예보돼 실외 유동인구가 줄어듭니다. 실내 응대 인력 증원과 우산 비치가 필요합니다.',
    }
  }
  if (item.microdust >= GRADE_STANDARD.dust.ok) {
    return {
      key: 'dust',
      label: '실내 동선 안내',
      text: '대기질이 나쁨 구간입니다. 옥외 대기 동선을 실내로 우회할 것을 권장합니다.',
    }
  }
  if (item.temp >= HEATWAVE_TEMP) {
    return {
      key: 'heat',
      label: '실외 인력 로테이션',
      text: '폭염 수준입니다. 실외 근무자 로테이션 주기 단축과 무더위 쉼터 안내가 필요합니다.',
    }
  }
  return {
    key: 'neutral',
    label: '평시 배치 유지',
    text: '특별한 기상 제약이 없어 평시 인력 배치를 유지합니다.',
  }
}

// 공급망/실외활동에 영향을 주는 극값을 모아 경보 목록으로 반환한다. 없으면 안전 알림 하나를 준다.
// 11차: 임계값이 하나씩뿐이라 실데이터에서는 전국이 죄다 "습도 매우 높음" 한 줄만 떴다.
// 경보를 주의/경보 2단계로 나누고, 축도 늘렸다(체감온도·강풍·저시정·열대야·건조·대기질).
// 기준은 기상청 특보 기준과 산업안전보건 지침의 통용 수치를 참고했다.
export const buildRiskAlerts = (item) => {
  const alerts = []
  const feels = typeof item.feelsLike === 'number' ? item.feelsLike : item.temp

  // 체감온도(폭염) — 기상청 폭염주의보 33도 / 경보 35도는 체감온도 기준이다
  if (feels >= 35)
    alerts.push({
      level: 'error',
      text: `폭염 경보 (체감 ${feels}°C) — 실외 작업 중단, 온열질환 예방 조치가 필요합니다.`,
    })
  else if (feels >= 33)
    alerts.push({
      level: 'warning',
      text: `폭염 주의보 (체감 ${feels}°C) — 실외 근무 시 시간당 10분 이상 휴식 확보가 필요합니다.`,
    })

  // 한파
  if (feels <= -12)
    alerts.push({
      level: 'error',
      text: `한파 경보 (체감 ${feels}°C) — 배송 차량 결빙과 실외 근무 동상에 대한 대비가 필요합니다.`,
    })
  else if (feels <= -5)
    alerts.push({
      level: 'warning',
      text: `한파 주의보 (체감 ${feels}°C) — 옥외 근무자 방한 장구 지급이 필요합니다.`,
    })

  // 대기질 (PM2.5 환경부 기준: 36 나쁨 / 76 매우 나쁨)
  if (item.microdust >= 76)
    alerts.push({
      level: 'error',
      text: `초미세먼지 매우 나쁨 (${item.microdust}) — 실외 활동 중단을 권고합니다.`,
    })
  else if (item.microdust >= 36)
    alerts.push({
      level: 'warning',
      text: `초미세먼지 나쁨 (${item.microdust}) — 옥외 대기 동선의 실내 전환을 권고합니다.`,
    })

  // 강풍 (기상청 주의보 14m/s, 경보 21m/s이나 현장 운영 기준으로 낮춰 잡았다)
  if (item.wind >= 14)
    alerts.push({
      level: 'error',
      text: `강풍 경보 (${item.wind}m/s) — 입간판·배너 철수와 적재물 고정이 필요합니다.`,
    })
  else if (item.wind >= 9)
    alerts.push({
      level: 'warning',
      text: `강풍 주의 (${item.wind}m/s) — 옥외 설치물 결박 상태 점검이 필요합니다.`,
    })

  // 강수
  if (item.weatherMain === 'Thunderstorm')
    alerts.push({ level: 'error', text: '뇌우 — 옥외 전기 설비 사용 중단을 권고합니다.' })
  else if (item.weatherMain === 'Snow')
    alerts.push({ level: 'warning', text: '강설 — 배송 지연과 보행로 결빙에 대한 대비가 필요합니다.' })
  else if (RAIN_WEATHER_MAIN.includes(item.weatherMain))
    alerts.push({ level: 'warning', text: '강수 — 배송 리드타임 증가와 우천 이탈에 대한 대비가 필요합니다.' })

  // 저시정 (안개·호우)
  if (typeof item.visibility === 'number' && item.visibility > 0 && item.visibility < 1)
    alerts.push({
      level: 'error',
      text: `가시거리 ${item.visibility}km — 차량 배송 일시 중단과 배차 재조정이 필요합니다.`,
    })
  else if (typeof item.visibility === 'number' && item.visibility < 5)
    alerts.push({
      level: 'warning',
      text: `가시거리 ${item.visibility}km — 배송 속도 하향과 배차 간격 확대가 필요합니다.`,
    })

  // 열대야 / 습도 / 건조
  if (item.tempMin !== undefined && item.tempMin >= 25)
    alerts.push({
      level: 'warning',
      text: `열대야 (최저 ${item.tempMin}°C) — 야간 냉방 부하와 심야 인력 피로 점검이 필요합니다.`,
    })
  if (item.humidity >= HIGH_HUMIDITY)
    alerts.push({
      level: 'warning',
      text: `습도 ${item.humidity}% — 지류·식품 보관 상태와 결로 점검이 필요합니다.`,
    })
  else if (item.humidity <= 25)
    alerts.push({
      level: 'warning',
      text: `건조 (습도 ${item.humidity}%) — 화기 취급과 정전기 관리에 주의가 필요합니다.`,
    })

  if (!alerts.length)
    alerts.push({ level: 'success', text: '현재 확인된 기상 리스크가 없습니다.' })
  return alerts
}

// 세 등급 중 가장 낮은 지표(병목)를 찾는다.
export const findWeakest = (grade) => {
  const lowest = Math.min(grade.temp, grade.humidity, grade.dust)
  const name = lowest === grade.dust ? '미세먼지' : lowest === grade.humidity ? '습도' : '기온'
  return { name, lowest }
}

// 11차: buildBudgetPlan을 걷어내고 buildRegionalOutlook으로 바꿨다.
//
// 왜: 이 서비스의 역할은 예산을 대신 나눠주는 게 아니라, 경영자·실무진이 전사 전략을 짤 때
// 근거로 삼을 지역별 기상 영향 데이터를 제공하는 것이다. 가상의 총예산을 입력받아 %로 쪼개는
// 건 그 역할과 맞지 않았고(전국 17개로 넓히자 지역당 60만원이라는 무의미한 숫자가 나왔다),
// 무엇보다 우리가 알 수 없는 값(그 회사의 예산)을 우리가 지어내는 구조였다.
//
// 대신 지역별 점수·검토 우선순위·기여도 분해까지만 돌려준다. 금액과 실행은 각 조직이
// 자기 맥락으로 붙이는 몫이고, 우리는 "어디가 왜 좋고 나쁜지"라는 판단 근거를 책임진다.
export const buildRegionalOutlook = (list) => {
  const scored = list.map((item) => {
    const graded = gradeCity(item)
    const exec = buildExecScore(graded)
    return { ...graded, exec, execScore: exec.score }
  })

  return scored
    .map((item) => ({
      ...item,
      // 절대 점수 구간으로 매기는 검토 우선순위. 전국이 다 나쁜 날이면 A가 없는 게 맞다.
      priority: execPriority(item.execScore),
    }))
    .sort((a, b) => b.execScore - a.execScore)
}

// --- 9차: 5일 예보를 "하루 단위 옥외 활동 전망"으로 접는다 ---
// OpenWeatherMap 5 Day / 3 Hour Forecast는 3시간 간격 데이터를 40개쯤 준다. 그대로 보여주면
// 읽을 수가 없어서 날짜별로 묶고, 그날의 대푯값(최고/최저 기온, 평균 습도, 가장 잦은 날씨)으로 접는다.
// 미세먼지는 예보 응답에 없다 — 그래서 여기서는 기온/습도 두 축만으로 점수를 낸다.
// 지금 날씨의 27점 만점(기온×습도×미세먼지)과 섞이면 오해를 부르므로 만점을 따로 노출한다.
export const FORECAST_MAX_SCORE = 9

export const buildDailyForecast = (list) => {
  if (!Array.isArray(list)) return []

  const byDate = new Map()
  for (const slot of list) {
    // dt_txt는 "2026-08-22 15:00:00" 형식이라 앞 10글자가 곧 날짜다
    const date = slot.dt_txt.slice(0, 10)
    if (!byDate.has(date)) byDate.set(date, [])
    byDate.get(date).push(slot)
  }

  const today = new Date().toISOString().slice(0, 10)

  return [...byDate.entries()]
    // 오늘은 이미 "지금 날씨" 카드가 보여주고 있으니 내일부터 보여준다
    .filter(([date]) => date > today)
    .slice(0, 5)
    .map(([date, slots]) => {
      const temps = slots.map((s) => s.main.temp)
      const max = Math.round(Math.max(...temps))
      const min = Math.round(Math.min(...temps))
      const humidity = Math.round(
        slots.reduce((sum, s) => sum + s.main.humidity, 0) / slots.length,
      )

      // 그날 가장 자주 등장한 날씨를 그날의 대표 날씨로 삼는다
      const counts = {}
      for (const slot of slots) {
        const key = slot.weather[0].main
        counts[key] = (counts[key] ?? 0) + 1
      }
      const weatherMain = Object.keys(counts).reduce((a, b) => (counts[a] >= counts[b] ? a : b))

      // 낮 기온(최고)을 그날의 활동 기준으로 본다 — 옥외 활동 판단은 낮 기준이라야 맞다
      const tempGrade = gradeTemp(max)
      const humidityGrade = gradeHumidity(humidity)

      return {
        date,
        label: new Date(`${date}T00:00:00`).toLocaleDateString('ko-KR', {
          month: 'numeric',
          day: 'numeric',
          weekday: 'short',
        }),
        max,
        min,
        humidity,
        weatherMain,
        grade: { temp: tempGrade, humidity: humidityGrade, score: tempGrade * humidityGrade },
      }
    })
}

// --- 10차: 다른 팀 산출물 순회에서 가져온 "파생 지표"들 ---
// 원본 수치를 그대로 나열하는 대신 한 번 더 해석해서 보여주면 같은 데이터가 훨씬 잘 읽힌다.
// 우리 컨셉(날씨 → 경영 판단)에 맞춰 재미 지표도 매출/운영 언어로 바꿨다.

// 불쾌지수(THI). 기상청이 쓰는 표준식이라 임의 가중치가 아니다.
// THI = 1.8T - 0.55(1 - RH)(1.8T - 26) + 32
export const buildDiscomfort = (item) => {
  const t = item.temp
  const rh = item.humidity / 100
  const value = Math.round(1.8 * t - 0.55 * (1 - rh) * (1.8 * t - 26) + 32)

  let level, label, tone, text
  if (value >= 80) {
    ;[level, label, tone] = [4, '매우 높음', 'danger']
    text = '체류 시간이 급격히 짧아집니다. 실내·그늘 동선과 냉방 좌석 확보가 우선입니다.'
  } else if (value >= 75) {
    ;[level, label, tone] = [3, '높음', 'warning']
    text = '옥외 대기가 길어지면 이탈률이 오릅니다. 대기 구역의 그늘·식수 확보가 필요합니다.'
  } else if (value >= 68) {
    ;[level, label, tone] = [2, '보통', 'info']
    text = '대부분 쾌적하게 느낍니다. 평소대로 운영해도 무리가 없습니다.'
  } else {
    ;[level, label, tone] = [1, '낮음', 'success']
    text = '체감 조건이 쾌적해 옥외 체류 시간이 깁니다. 옥외 일정에 유리한 구간입니다.'
  }
  return { value, level, label, tone, text }
}

// 파생 지표: 옥외에서 사람이 무리 없이 머무를 수 있는 대략의 시간.
// 다른 팀의 "아이스크림 생존 시간"을 보고, 같은 장치를 우리 언어(체류 시간)로 옮겼다.
// ponytail: 실제 체류시간 데이터가 없어서 불쾌지수·미세먼지·강수를 깎아내리는 휴리스틱이다.
//           실측 체류 데이터가 생기면 회귀로 교체하는 게 다음 단계.
const STAY_BASE_MINUTES = 90

export const buildStayMinutes = (item) => {
  const thi = buildDiscomfort(item).value
  let minutes = STAY_BASE_MINUTES

  if (thi >= 80) minutes -= 45
  else if (thi >= 75) minutes -= 25
  else if (thi >= 68) minutes -= 10

  if (item.microdust >= 50) minutes -= 25
  else if (item.microdust >= 30) minutes -= 10

  if (['Rain', 'Drizzle', 'Thunderstorm', 'Snow'].includes(item.weatherMain)) minutes -= 30
  if (item.wind >= 8) minutes -= 10

  minutes = Math.max(15, minutes)
  const ratio = minutes / STAY_BASE_MINUTES
  return { minutes, ratio }
}

// 풍향(도) → 16방위 한글. 다른 팀들이 "북동풍 50°"처럼 보여주는 게 훨씬 읽기 쉬웠다.
const COMPASS = [
  '북', '북북동', '북동', '동북동', '동', '동남동', '남동', '남남동',
  '남', '남남서', '남서', '서남서', '서', '서북서', '북서', '북북서',
]
export const windLabel = (deg) => COMPASS[Math.round((deg % 360) / 22.5) % 16]

// 현지 시각 기준 낮/밤과 일조 진행률. OpenWeatherMap의 dt/sunrise/sunset은 UTC 초라
// timezone(초) 오프셋을 더해야 그 도시의 시계가 된다.
export const buildDaylight = (item) => {
  if (!item.sunrise || !item.sunset) return null
  const { sunrise, sunset, observedAt, timezone } = item

  const toLocalHM = (unix) => {
    const d = new Date((unix + timezone) * 1000)
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
  }

  const dayLengthMin = Math.round((sunset - sunrise) / 60)
  const isDay = observedAt >= sunrise && observedAt < sunset
  const progress = isDay ? (observedAt - sunrise) / (sunset - sunrise) : null

  // 12차: 밤이면 progress가 null이라 화면의 호 위에 해가 아예 안 그려졌다 —
  // "해가 없는 일조 그래프"가 됐다. 해가 지평선 어느 쪽에 있는지(일출 전 / 일몰 후)를
  // 같이 내려보내서, 밤에도 지평선 아래 해당 지점에 표식을 놓는다.
  const phase = isDay ? 'day' : observedAt < sunrise ? 'before-sunrise' : 'after-sunset'

  return {
    sunrise: toLocalHM(sunrise),
    sunset: toLocalHM(sunset),
    observed: toLocalHM(observedAt),
    isDay,
    phase,
    progress,
    dayLengthLabel: `${Math.floor(dayLengthMin / 60)}시간 ${dayLengthMin % 60}분`,
  }
}

// 통합 대기질(1~5)을 한글 등급으로
const AQI_LABEL = { 1: '좋음', 2: '보통', 3: '나쁨', 4: '매우 나쁨', 5: '위험' }
export const aqiLabel = (aqi) => AQI_LABEL[aqi] ?? '—'

// 지금 상태를 한 문단 + 근거 목록으로 정리한 "의사결정 브리핑".
// 다른 팀의 'AI 날씨 브리핑'이 수치를 문장으로 바꿔주는 게 인상적이어서, 우리는 그걸
// 경영 판단 문장으로 옮겼다. 규칙 기반이라 실제로 LLM을 부르지는 않는다 — 이름도 그렇게 안 붙였다.
export const buildBriefing = (item, formatTemp = (value) => `${value}°C`) => {
  const discomfort = buildDiscomfort(item)
  const stay = buildStayMinutes(item)
  const daylight = buildDaylight(item)
  const lines = []

  lines.push({
    key: 'stay',
    tone: stay.ratio >= 0.75 ? 'success' : stay.ratio >= 0.5 ? 'warning' : 'danger',
    text: `옥외에 머무를 수 있는 시간은 1인 기준 약 ${stay.minutes}분으로 봅니다.`,
  })
  lines.push({ key: 'thi', tone: discomfort.tone, text: discomfort.text })

  if (['Rain', 'Drizzle', 'Thunderstorm'].includes(item.weatherMain)) {
    lines.push({
      key: 'rain',
      tone: 'warning',
      text: '비가 내리고 있습니다. 옥외 활동 연기와 실내·비대면 채널로의 자원 이동이 필요합니다.',
    })
  }
  if (item.microdust >= 50) {
    lines.push({
      key: 'dust',
      tone: 'danger',
      text: `미세먼지가 ${item.microdust}로 높습니다. 옥외 근무자 교대 주기 단축이 필요합니다.`,
    })
  }
  if (typeof item.feelsLike === 'number' && Math.abs(item.feelsLike - item.temp) >= 2) {
    const hotter = item.feelsLike > item.temp
    lines.push({
      key: 'feels',
      tone: 'info',
      text: `기온은 ${formatTemp(item.temp)}지만 체감은 ${formatTemp(item.feelsLike)}로 ${hotter ? '더' : '덜'} ${
        hotter ? '덥게' : '춥게'
      } 느껴집니다.`,
    })
  }
  if (daylight && !daylight.isDay) {
    lines.push({
      key: 'night',
      tone: 'info',
      text: `현지 시각 기준 야간입니다. 옥외 활동은 ${daylight.sunrise} 일출 이후로 계획해야 합니다.`,
    })
  }

  const headline = `${item.name}은(는) 지금 ${formatTemp(item.temp)} · 불쾌지수 ${discomfort.value}(${discomfort.label})로, 옥외 체류 적정 시간은 약 ${stay.minutes}분입니다.`
  return { headline, lines }
}

// --- 11차: 운영 여건 점수를 연속값으로 재설계 ---
// 문제: 교재식 3단계 등급(기온×습도×미세먼지)에 실데이터를 넣으니 전국이 죄다 3-1-3 = 9점이었다.
// 한국 여름은 습도가 늘 80% 이상이라 습도는 항상 1등급, 미세먼지는 늘 낮아 항상 3등급이라
// 실질적으로 변별이 되는 축이 기온 하나뿐이었기 때문이다.
//
// 해결: 3단계로 계단을 만드는 대신, 각 지표를 0~100 연속 점수로 환산해 가중 평균한다.
// 그리고 축을 6개로 늘렸다 — 체감온도/습도/대기질/하늘상태/바람/가시거리.
// 체감온도·바람·가시거리·구름량은 지역마다 실제로 값이 갈려서 순위가 살아난다.
// (교재용 3단계 grade는 "등급 판정" 카드를 위해 그대로 남겨둔다 — 없애지 않았다.)

export const EXEC_MAX_SCORE = 100

// 사다리꼴 적합도: [lo, hi] 구간은 100점, 거기서 멀어질수록 선형으로 떨어진다.
const plateau = (value, lo, hi, fallLo, fallHi) => {
  if (value >= lo && value <= hi) return 100
  if (value < lo) return Math.max(0, 100 * (1 - (lo - value) / fallLo))
  return Math.max(0, 100 * (1 - (value - hi) / fallHi))
}

// 높을수록 나쁜 값(미세먼지 등): good 이하는 100, bad 이상은 0
const inverse = (value, good, bad) => {
  if (value <= good) return 100
  if (value >= bad) return 0
  return 100 * (1 - (value - good) / (bad - good))
}

// 하늘 상태별 옥외 활동 적합도. OpenWeatherMap의 weather[0].main 값을 그대로 받는다.
const SKY_SCORE = {
  Clear: 100,
  Clouds: 72,
  Mist: 46,
  Haze: 42,
  Fog: 34,
  Drizzle: 30,
  Rain: 14,
  Snow: 20,
  Thunderstorm: 0,
}

// 가중치 합은 100. 옥외 활동 가능 여부 판단이 목적이라 체감온도와 대기질에 가장 큰 비중을 뒀다.
export const EXEC_WEIGHTS = [
  { key: 'feels', label: '체감온도', weight: 28 },
  { key: 'air', label: '대기질', weight: 20 },
  { key: 'sky', label: '하늘상태', weight: 16 },
  { key: 'humidity', label: '습도', weight: 16 },
  { key: 'wind', label: '바람', weight: 10 },
  { key: 'visibility', label: '가시거리', weight: 10 },
]

export const buildExecScore = (item) => {
  // 체감온도가 없으면(구버전 목데이터) 기온으로 대체한다
  const feels = typeof item.feelsLike === 'number' ? item.feelsLike : item.temp
  const visibility = typeof item.visibility === 'number' ? item.visibility : 10
  const wind = item.wind ?? 0

  // 낙폭(fall)을 좁게 잡을수록 작은 차이가 점수로 크게 벌어진다. 처음엔 넉넉하게 뒀더니
  // 전국 점수가 73~81에 몰려서 순위는 갈려도 "얼마나 더 좋은지"가 안 보였다 — 조였다.
  const parts = {
    // 18~24도가 옥외 활동에 가장 좋고, 추운 쪽보다 더운 쪽에 아주 조금 관대하게 뒀다
    feels: plateau(feels, 18, 24, 8, 10),
    // PM2.5 10 이하 최상, 55 이상이면 0점
    air: inverse(item.microdust, 10, 55),
    sky: SKY_SCORE[item.weatherMain] ?? 60,
    humidity: plateau(item.humidity, 40, 60, 22, 30),
    // 2m/s 이하면 쾌적, 9m/s면 0점
    wind: inverse(wind, 2, 9),
    // 10km면 만점, 2km면 0점
    visibility: plateau(visibility, 10, 999, 8, 1),
  }

  const total = EXEC_WEIGHTS.reduce((sum, w) => sum + parts[w.key] * w.weight, 0) / 100

  return {
    score: Math.round(total),
    parts: EXEC_WEIGHTS.map((w) => ({
      ...w,
      value: Math.round(parts[w.key]),
      // 가중치까지 반영한 실제 기여분 — "무엇이 점수를 깎았나"를 바로 읽을 수 있다
      contribution: Math.round((parts[w.key] * w.weight) / 100),
    })),
  }
}

// 우선순위는 점수 절대 구간으로 매긴다(상대 점유율이 아니라).
export const execPriority = (score) => {
  if (score >= 75) return 'A'
  if (score >= 55) return 'B'
  if (score >= 35) return 'C'
  return 'D'
}

// 점수 구간 → 라벨/색. 지도·카드·표가 모두 이 한 곳을 본다.
export const execGrade = (score) => {
  if (score >= 75) return { label: '우수', tone: 'success', color: '#1c7048' }
  if (score >= 55) return { label: '양호', tone: 'info', color: '#0a53c0' }
  if (score >= 35) return { label: '주의', tone: 'warning', color: '#8a4e00' }
  return { label: '미흡', tone: 'danger', color: '#ad251c' }
}

// 가장 크게 깎아먹은 축을 찾는다(만점 대비 손실이 가장 큰 항목)
export const findExecBottleneck = (exec) => {
  let worst = null
  for (const part of exec.parts) {
    const loss = part.weight - part.contribution
    if (!worst || loss > worst.loss) worst = { ...part, loss }
  }
  return worst
}

// --- 11차: "예산 편성"을 걷어내고 "지역별 운영 지시(7P)"로 ---
//
// 왜 바꿨나
// 5개 도시 시절엔 예산 비례 배분이 말이 됐지만, 전국 17개 시·도로 넓히자 1000만원을 17로 쪼개
// 지역당 60만원이 됐다. 아무 캠페인도 못 돌리는 금액이고, 무엇보다 "%"는 지시가 아니다.
//
// 무엇으로 바꿨나
// 각 지역에 오늘의 **운영 모드**를 내리고, 그 근거를 서비스 마케팅 **7P**로 펼친다.
// 기존 4축(마케팅/재고/인력/경보)은 7P 안에 자연스럽게 흡수된다
// (마케팅→Promotion, 재고→Product, 인력→People). 여기에 Price/Place/Process/
// Physical Evidence가 더해져서 날씨가 건드리는 경영 레버가 훨씬 넓어진다.
//
// ponytail: 지시문은 임계값 기반 규칙이다. 실제로는 지역별 POS·체류시간 데이터로 보정해야
//           맞지만 그 데이터가 없다. 규칙은 전부 이 파일 한 곳에 모아뒀으니, 데이터가 생기면
//           여기만 회귀모델로 갈아끼우면 된다.

export const OPS_MODES = {
  normal: {
    key: 'normal',
    label: '정상 운영',
    tone: 'success',
    color: '#1c7048',
    summary: '평소대로 운영합니다. 옥외 활동에 제약이 없습니다.',
  },
  indoor: {
    key: 'indoor',
    label: '실내 전환',
    tone: 'info',
    color: '#0a53c0',
    summary: '옥외 동선을 실내·비대면 채널로 옮깁니다.',
  },
  reduced: {
    key: 'reduced',
    label: '단축 운영',
    tone: 'warning',
    color: '#8a4e00',
    summary: '체류 시간이 짧아 운영 시간과 인력을 줄입니다.',
  },
  halt: {
    key: 'halt',
    label: '중단 검토',
    tone: 'danger',
    color: '#ad251c',
    summary: '옥외 활동을 중단하고 안전 조치를 우선합니다.',
  },
}

const RAINY = ['Rain', 'Drizzle', 'Thunderstorm', 'Snow']
const feelsOf = (item) => (typeof item.feelsLike === 'number' ? item.feelsLike : item.temp)

// 운영 모드 판정. 운영 여건 점수만으로 자르지 않고, 안전에 직결되는 조건은 점수와 무관하게
// 곧바로 상위 모드로 올린다(점수가 높아도 폭염이면 단축이 맞다).
export const buildOpsMode = (item) => {
  const feels = feelsOf(item)
  if (item.weatherMain === 'Thunderstorm' || feels >= 35 || item.microdust >= 76 || item.wind >= 11)
    return OPS_MODES.halt
  if (RAINY.includes(item.weatherMain)) return OPS_MODES.indoor
  if (feels >= 31 || feels <= 0 || item.microdust >= 36) return OPS_MODES.reduced
  // 12차: execScore가 없는 원본 항목이 들어오면 undefined 비교가 전부 false가 되면서
  // 조용히 '실내 전환'으로 떨어졌다(요약 화면에서 실제로 그렇게 어긋났다).
  // 점수가 없으면 점수 기반 판정을 건너뛰고 '정상'으로 둔다 — 안전 조건은 위에서 이미 걸렀다.
  if (typeof item.execScore !== 'number') return OPS_MODES.normal
  if (item.execScore >= 55) return OPS_MODES.normal
  if (item.execScore >= 35) return OPS_MODES.reduced
  return OPS_MODES.indoor
}

// 서비스 마케팅 7P. 각 P가 오늘 날씨에 어떻게 반응해야 하는지를 지역 수치로 만들어 낸다.
// 화면에서는 4개 탭으로 묶어 보여주지만(탭 8개는 카드에서 못 읽는다), 데이터는 7개 그대로 둔다.
export const build7P = (item) => {
  const feels = feelsOf(item)
  const mode = buildOpsMode(item)
  const isRainy = RAINY.includes(item.weatherMain)
  const dusty = item.microdust >= 36
  const hot = feels >= 28
  const cold = feels <= 5

  // 11차: 이 웹의 사용자는 특정 업종이 아니라 "전사 전략을 짜는 경영자·실무진"이다.
  // 그래서 지시문에서 업종 냄새가 나는 표현(배달, 홀, 우산꽂이 …)을 전부 걷어내고,
  // 제조·유통·물류·서비스·공공 어디서 읽어도 자기 조직으로 번역되는 말로 바꿨다.

  // 1) Product — 오늘 수요가 쏠리는 카테고리
  const product = []
  if (hot) product.push('냉방·수분 보충 관련 수요 급증 — 공급량 상향')
  if (cold) product.push('난방·방한 관련 수요 급증 — 공급량 상향')
  if (isRainy) product.push('우천 대비 품목 수요 상승, 옥외 의존 품목 수요 하락')
  if (dusty) product.push('공기질 관련 품목(마스크·필터) 수요 상승')
  if (!product.length) product.push('수요 이동 없음 — 평시 공급 계획 유지')

  // 2) Price — 날씨가 만드는 가격/프로모션 레버
  let price
  if (isRainy) price = '옥외 이탈분을 비대면·사전예약 채널의 가격 인센티브로 회수합니다.'
  else if (hot || cold) price = '수요가 몰리는 시간대에 맞춰 할인·번들 시점을 옮깁니다.'
  else if (mode.key === 'normal') price = '가격 조정 불필요. 정가 기준으로 마진을 지킵니다.'
  else price = '할인해도 전환이 낮은 구간입니다. 가격보다 채널 조정이 우선입니다.'

  // 3) Place — 채널·동선 비중
  let place
  if (mode.key === 'halt') place = '옥외 거점 철수. 비대면·사전예약 채널만 유지합니다.'
  else if (mode.key === 'indoor') place = '옥외 동선의 비중을 실내·비대면 채널로 옮깁니다.'
  else if (mode.key === 'reduced') place = '실내 거점 중심. 옥외는 아침·저녁 시간대만 운영합니다.'
  else place = '옥외·실내·비대면 채널을 모두 정상 가동합니다.'

  // 4) Promotion — 대외 커뮤니케이션
  let promotion
  if (mode.key === 'halt') promotion = '옥외 행사 전면 중단. 예정 일정의 순연을 즉시 공지합니다.'
  else if (mode.key === 'indoor') promotion = '옥외 노출 캠페인 보류. 비대면 채널 노출을 늘립니다.'
  else if (mode.key === 'reduced') promotion = '옥외 노출을 아침·저녁 시간대로만 축소합니다.'
  else promotion = '옥외 캠페인 적기. 유동인구 동선에 접점을 배치합니다.'

  // 5) People — 인력 배치
  const people = []
  if (isRainy) people.push('현장 대응 인력 보강(이동·지연 흡수용)')
  if (mode.key === 'indoor') people.push('옥외 배치 인력을 실내·비대면 업무로 재배치')
  if (mode.key === 'reduced' || mode.key === 'halt') people.push('옥외 배치 인원 축소')
  if (feels >= 31) people.push('옥외 근무자 휴게 주기 단축(온열질환 예방)')
  if (cold) people.push('옥외 근무자 방한 장구 지급')
  if (!people.length) people.push('인력 배치 변동 없음')

  // 6) Process — 운영 프로세스
  const process = []
  if (isRainy) process.push('이동·배송 리드타임 +20분 반영, 지연 사전 공지 예약')
  if (mode.key === 'reduced') process.push('옥외 운영 시간 1시간 단축')
  if (feels >= 31 || feels <= 0) process.push('옥외 대기 시간 최소화 — 사전 접수·예약으로 분산')
  if (item.visibility !== undefined && item.visibility < 5)
    process.push('시야 불량 — 차량 운행 속도 하향, 배차 간격 확대')
  if (!process.length) process.push('표준 운영 절차 유지')

  // 7) Physical Evidence — 현장의 물리적 환경
  const physical = []
  if (hot) physical.push('그늘·차양 확보, 냉방 설정 온도 재점검')
  if (cold) physical.push('출입구 방풍 조치, 난방 예열')
  if (isRainy) physical.push('출입 동선 미끄럼 방지, 우산 처리 동선 확보')
  if (item.wind >= 8) physical.push('입간판·현수막 등 설치물 결박 또는 철수')
  if (dusty) physical.push('출입문 개방 최소화, 실내 공기질 관리')
  if (!physical.length) physical.push('평시 상태를 유지합니다')

  return {
    mode,
    items: [
      { p: 'Product', label: '제품·수요', text: product.join(', ') },
      { p: 'Price', label: '가격', text: price },
      { p: 'Place', label: '채널·동선', text: place },
      { p: 'Promotion', label: '커뮤니케이션', text: promotion },
      { p: 'People', label: '인력', text: people.join(', ') },
      { p: 'Process', label: '프로세스', text: process.join(', ') },
      { p: 'Physical Evidence', label: '현장 환경', text: physical.join(', ') },
    ],
  }
}

// 카드에서는 7개를 4개 탭으로 묶는다(탭이 8개면 좁은 카드에서 못 읽는다).
export const GROUPED_7P = [
  { key: 'offer', label: '제품·가격', members: ['Product', 'Price'] },
  { key: 'channel', label: '채널·판촉', members: ['Place', 'Promotion'] },
  { key: 'ops', label: '인력·프로세스', members: ['People', 'Process'] },
  { key: 'env', label: '현장 환경', members: ['Physical Evidence'] },
]

// 전국 요약: 모드별로 몇 개 지역인지. 대시보드 상단 한 줄에 쓴다.
export const summarizeOps = (list) => {
  const counts = { normal: 0, indoor: 0, reduced: 0, halt: 0 }
  for (const item of list) counts[buildOpsMode(item).key] += 1
  return counts
}


// --- 11차: 마케팅 밖의 경영 기능까지 (인사·재무·회계·생산물류·안전) ---
//
// 7P는 결국 마케팅 프레임이다. 날씨가 실제로 건드리는 건 그보다 넓다 —
// 옥외 근로자 휴게 의무(인사), 냉난방비와 일 매출(재무), 온·습도 민감 재고 손실률(회계),
// 배송 리드타임(생산·물류), 산업재해 위험(안전). 이 다섯 축을 수치로 추정한다.
//
// ponytail: 아래 계수들은 업계 통용 경험칙이지, 우리 회사 실적으로 회귀한 값이 아니다.
//           POS·근태·전력 사용량 데이터가 붙으면 계수만 갈아끼우면 되도록 상수로 빼뒀다.

// 쾌적 기준 온도. 이 온도에서 멀어질수록 냉난방 부하가 붙는다(도일(degree-day) 개념).
const COMFORT_BASE = 21
// 쾌적 온도에서 1도 벗어날 때 일 냉난방비 증가율(%). 냉방이 난방보다 단가가 비싸다.
const COOLING_COST_PER_DEG = 3.2
const HEATING_COST_PER_DEG = 2.1

const feelsOf2 = (item) => (typeof item.feelsLike === 'number' ? item.feelsLike : item.temp)
const isRainy2 = (item) => ['Rain', 'Drizzle', 'Thunderstorm', 'Snow'].includes(item.weatherMain)

// 1) 인사·노무 — 산업안전보건기준에 관한 규칙은 체감 33도 이상 옥외작업 시 휴게를 요구한다.
const buildHrImpact = (item) => {
  const feels = feelsOf2(item)
  const notes = []
  let restMinPerHour = 0
  let level = 'success'

  if (feels >= 35) {
    restMinPerHour = 15
    level = 'danger'
    notes.push('폭염 경보 구간 — 옥외 작업은 시간당 15분 휴게가 필요합니다.')
  } else if (feels >= 33) {
    restMinPerHour = 10
    level = 'warning'
    notes.push('폭염 주의보 구간 — 옥외 작업은 시간당 10분 휴게가 필요합니다.')
  } else if (feels <= -5) {
    restMinPerHour = 10
    level = 'warning'
    notes.push('한파 구간 — 옥외 작업자 방한 장구 지급과 온열 휴게 공간이 필요합니다.')
  }

  // 강수는 배송 지연을 만들고, 지연은 연장근로로 이어진다
  const overtimeMin = isRainy2(item) ? 30 : 0
  if (overtimeMin) {
    notes.push(`이동·배송 지연으로 1인당 약 ${overtimeMin}분의 연장근로가 예상됩니다.`)
    // 11차: 연장근로가 생기는데 레벨이 '영향 없음'으로 표시되던 모순을 고쳤다
    if (level === 'success') level = 'warning'
  }
  if (!notes.length) notes.push('추가 노무 조치가 필요하지 않습니다.')

  return { key: 'hr', label: '인사·노무', level, restMinPerHour, overtimeMin, notes }
}

// 2) 재무 — 냉난방비와 일매출 변동을 추정한다.
const buildFinanceImpact = (item) => {
  const feels = feelsOf2(item)
  const diff = feels - COMFORT_BASE
  // 쾌적 기준에서 벗어난 만큼 냉방(양수) 또는 난방(음수) 비용이 붙는다
  const energyDelta =
    diff > 0
      ? Math.round(diff * COOLING_COST_PER_DEG)
      : Math.round(Math.abs(diff) * HEATING_COST_PER_DEG)
  const energyKind = diff > 0 ? '냉방' : '난방'

  // 매출 영향: 옥외 유동인구에 민감한 사업 기준. 운영 여건 점수를 그대로 대리 지표로 쓴다.
  // 55점을 기준선으로 두고 위아래로 벌어진 만큼 매출이 움직인다고 본다.
  const salesDelta = Math.round((item.execScore - 55) * 0.45)

  const notes = [
    `${energyKind} 부하로 일 에너지 비용이 약 ${energyDelta}% 증가할 것으로 봅니다.`,
    salesDelta >= 0
      ? `옥외 유동인구가 늘어 일 매출이 약 +${salesDelta}% 예상됩니다.`
      : `옥외 이탈로 일 매출이 약 ${salesDelta}% 예상됩니다.`,
  ]
  if (isRainy2(item)) notes.push('운송·대체 채널 비용이 늘어 변동비 비중이 올라갑니다.')

  return {
    key: 'finance',
    label: '재무',
    // 매출이 줄거나 에너지 비용이 10% 넘게 뛰면 '참고'가 아니라 '주의'로 올린다
    level: salesDelta < -8 ? 'danger' : salesDelta < 0 || energyDelta >= 10 ? 'warning' : 'success',
    energyDelta,
    salesDelta,
    notes,
  }
}

// 3) 회계·원가 — 고온다습은 온·습도 민감 재고의 손실률을 끌어올린다.
const buildAccountingImpact = (item) => {
  const feels = feelsOf2(item)
  let spoilage = 1.0 // 평시 재고 손실률(%)
  if (feels >= 30) spoilage += 1.8
  else if (feels >= 26) spoilage += 0.9
  if (item.humidity >= 80) spoilage += 1.2
  else if (item.humidity >= 65) spoilage += 0.5
  spoilage = Math.round(spoilage * 10) / 10

  const notes = [`온·습도 민감 재고의 예상 손실률 약 ${spoilage}% (평시 1.0%).`]
  if (spoilage >= 2.5) notes.push('입고량 축소와 선입선출 점검 주기 확대(1일 2회)가 필요합니다.')
  if (isRainy2(item)) notes.push('운송비·포장비가 늘어 판관비 계정에 반영이 필요합니다.')
  if (item.humidity >= 80) notes.push('지류·라벨 손상에 따른 재작업 비용 확인이 필요합니다.')

  return {
    key: 'accounting',
    label: '회계·원가',
    level: spoilage >= 2.5 ? 'danger' : spoilage >= 1.8 ? 'warning' : 'success',
    spoilage,
    notes,
  }
}

// 4) 생산·물류 — 배송 리드타임과 공급 지연.
const buildScmImpact = (item) => {
  let delayMin = 0
  const notes = []

  if (item.weatherMain === 'Thunderstorm') delayMin += 45
  else if (item.weatherMain === 'Snow') delayMin += 40
  else if (isRainy2(item)) delayMin += 20

  if (typeof item.visibility === 'number' && item.visibility < 1) delayMin += 30
  else if (typeof item.visibility === 'number' && item.visibility < 5) delayMin += 10
  if (item.wind >= 14) delayMin += 20

  if (delayMin) notes.push(`이동·배송 리드타임이 약 ${delayMin}분 늘어날 것으로 봅니다.`)
  else notes.push('이동·배송 리드타임에 영향이 없습니다.')

  if (delayMin >= 40) notes.push('당일 출고 마감 시간 조정과 수요처 사전 공지가 필요합니다.')
  if (item.humidity >= 80) notes.push('창고 습도 관리 — 흡습제 점검과 환기가 필요합니다.')
  if (feelsOf2(item) >= 30) notes.push('냉장·냉동 체인의 온도 이탈 여부를 배차 전후로 확인해야 합니다.')

  // 11차: 리드타임 지연이 0이면 '영향 없음'으로 찍히는데 정작 아래 근거에는 "창고 습도 관리가
  // 필요합니다" 같은 조치가 붙어 있었다 — 레벨과 내용이 서로 반대말을 하던 버그.
  // 리드타임 외의 조치 항목이 하나라도 있으면 '주의'로 올린다.
  const hasExtraAction = notes.length > 1
  return {
    key: 'scm',
    label: '생산·물류',
    level: delayMin >= 40 ? 'danger' : delayMin > 0 || hasExtraAction ? 'warning' : 'success',
    delayMin,
    notes,
  }
}

// 5) 안전관리 — 산업재해 위험 요인을 모은다.
const buildSafetyImpact = (item) => {
  const feels = feelsOf2(item)
  const risks = []
  if (feels >= 33) risks.push('온열질환')
  if (feels <= -5) risks.push('한랭질환')
  if (isRainy2(item)) risks.push('미끄러짐·전도')
  if (item.weatherMain === 'Snow') risks.push('결빙 낙상')
  if (item.weatherMain === 'Thunderstorm') risks.push('감전')
  if (item.wind >= 9) risks.push('낙하물·설치물 전도')
  if (item.microdust >= 36) risks.push('호흡기 질환')

  const notes = risks.length
    ? [`주의 재해 유형: ${risks.join(', ')}.`, '작업 전 안전교육(TBM)에서 해당 항목 공지가 필요합니다.']
    : ['특이 재해 위험 요인이 없습니다. 표준 안전수칙을 유지합니다.']

  return {
    key: 'safety',
    label: '안전관리',
    level: risks.length >= 3 ? 'danger' : risks.length ? 'warning' : 'success',
    risks,
    notes,
  }
}

// 다섯 기능을 한 번에. 카드/상세 화면이 이 배열만 받아서 그린다.
export const buildFunctionalImpacts = (item) => [
  buildHrImpact(item),
  buildFinanceImpact(item),
  buildAccountingImpact(item),
  buildScmImpact(item),
  buildSafetyImpact(item),
]
