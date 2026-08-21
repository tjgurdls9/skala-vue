// 도시 등록 정보(좌표 포함)와 등급 판정 로직.
// 과제 6부터 temp/humidity/microdust/wind/status는 weatherApi.js가 실시간으로 채운다.
// 이 파일에는 axios 호출이 없이도 동일하게 굴러가는 순수 데이터/함수만 남긴다.

export const weatherList = [
  { id: 'city_01', name: '서울', region: '대한민국 서울특별시', lat: 37.5665, lon: 126.978 },
  { id: 'city_02', name: '광주', region: '대한민국 광주광역시', lat: 35.1595, lon: 126.8526 },
  { id: 'city_03', name: '울산', region: '대한민국 울산광역시', lat: 35.5384, lon: 129.3114 },
  { id: 'city_04', name: '수원', region: '대한민국 경기도 수원시', lat: 37.2636, lon: 127.0286 },
  { id: 'city_05', name: '부산', region: '대한민국 부산광역시', lat: 35.1796, lon: 129.0756 },
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
const PRIORITY_A_RATE = 1.3
const PRIORITY_B_RATE = 0.8

const getSegment = (grade) => {
  if (grade.dust === 1)
    return {
      label: '🏠 실내 집중형',
      plan: '미세먼지가 나빠 야외 행사는 어렵습니다. 실내 매장과 온라인 쿠폰 위주로 집행하는 것을 제안합니다.',
    }
  if (grade.score >= OUTDOOR_MIN_SCORE)
    return {
      label: '🎪 야외 프로모션 최적',
      plan: '세 지표 모두 좋습니다. 팝업스토어 같은 야외 행사를 진행해도 괜찮습니다.',
    }
  if (grade.humidity === 1)
    return {
      label: '💧 습도 관리형',
      plan: '습도가 높음으로 인한 불쾌감으로 체류 시간이 짧습니다. 쾌적한 행사장을 마련하거나 임팩트를 짧고 강하게 설정하는 것을 제안합니다.',
    }
  return {
    label: '🙂 무난형',
    plan: '특별한 제약이 없습니다. 기존 판촉을 유지하여 전환비용을 절약하는 것을 제안합니다.',
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

// 세 등급 중 가장 낮은 지표(병목)를 찾는다.
export const findWeakest = (grade) => {
  const lowest = Math.min(grade.temp, grade.humidity, grade.dust)
  const name = lowest === grade.dust ? '미세먼지' : lowest === grade.humidity ? '습도' : '기온'
  return { name, lowest }
}

// 넘겨받은 도시들끼리 점수 비율로 예산을 나눈다. (점수 높은 순 정렬)
export const buildBudgetPlan = (list, totalBudget) => {
  const scored = list.map(gradeCity)
  const totalScore = scored.reduce((sum, item) => sum + item.grade.score, 0)
  const evenShare = scored.length ? 100 / scored.length : 0
  const aLine = Math.min(evenShare * PRIORITY_A_RATE, 100)
  const bLine = evenShare * PRIORITY_B_RATE

  return scored
    .map((item) => {
      const share = totalScore ? Math.round((item.grade.score / totalScore) * 100) : 0
      return {
        ...item,
        share,
        budget: Math.round((share / 100) * totalBudget),
        priority: share >= aLine ? 'A' : share >= bLine ? 'B' : 'C',
      }
    })
    .sort((a, b) => b.grade.score - a.grade.score)
}
