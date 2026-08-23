<script setup>
import { useRouter } from 'vue-router'
import { Back, Check } from '@element-plus/icons-vue'
import WeatherDeskIcon from '../components/WeatherDeskIcon.vue'

const router = useRouter()

const goHome = () => {
  router.push('/dashboard')
}

// 8차: <ul><li> 맨몸 목록이라 유리 카드 안에서 브라우저 기본 불릿만 덩그러니 떠 있었다 —
// 항목을 데이터로 빼고 체크 아이콘 + 정돈된 행으로 그린다.
const FEATURES = [
  '전국 지도를 훑어 기상 대응이 필요한 지역을 먼저 찾습니다.',
  '기상 대응 지수와 경보로 일정·채널·인력·안전의 우선순위를 정합니다.',
  '지역 상세에서 지수의 감점 원인과 5일 전망을 함께 확인합니다.',
  '마케팅 7P와 경영 기능별 영향은 조직 상황에 맞게 참고합니다.',
  '검색과 지역 선택을 이용해 관심 지역을 빠르게 비교합니다.',
  '분석값은 실제 조직 데이터와 함께 검토한 뒤 의사결정에 사용합니다.',
]

const FACTS = [
  { value: '83', label: '전국 관측 지점', icon: 'location' },
  { value: '6', label: '기상 판단 축', icon: 'observation' },
  { value: '7', label: '경영 분석 관점', icon: 'analysis' },
]
</script>

<template>
  <div class="about-page">
    <h2 class="about-heading">
      <WeatherDeskIcon name="overview" /> 서비스 소개
    </h2>

    <section class="about-card">
      <div class="about-intro">
        <p class="about-eyebrow">WEATHER INTELLIGENCE</p>
        <h3>날씨를 숫자에서 실행 기준으로 바꿉니다.</h3>
        <p class="about-lead">
          전국 83개 관측 지점의 실시간 날씨를 기상 대응 지수로 환산하고, 인사·재무·회계·생산·
          물류·마케팅·안전 등 전사 관점의 영향까지 한 화면에서 연결합니다.
        </p>
      </div>

      <div class="about-facts" aria-label="서비스 주요 지표">
        <div v-for="fact in FACTS" :key="fact.label" class="about-fact">
          <WeatherDeskIcon :name="fact.icon" />
          <strong>{{ fact.value }}</strong>
          <span>{{ fact.label }}</span>
        </div>
      </div>

      <div class="about-body">
        <div>
          <p class="about-section-label">활용 방법</p>
          <ul class="about-list">
            <li v-for="feature in FEATURES" :key="feature" class="about-list-item">
              <el-icon class="about-check"><Check /></el-icon>
              <span>{{ feature }}</span>
            </li>
          </ul>
        </div>
        <aside class="about-source">
          <p class="about-section-label">데이터 안내</p>
          <p>
            현재 날씨와 대기질은 OpenWeatherMap API에서 조회하고, 공휴일 일정은 별도 외부
            API로 확인합니다. 분석 결과는 업무 판단을 돕는 참고 지표입니다.
          </p>
        </aside>
      </div>

      <div class="about-actions">
        <el-button type="primary" :icon="Back" @click="goHome">날씨 대시보드로 이동</el-button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.about-page {
  width: 100%;
}
.about-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  /* 13차-k: 배경을 다시 어둡게 내렸으므로 카드 '밖'의 제목은 밝은 글자다.
     (카드 안쪽은 밝은 유리판이라 진한 글자를 그대로 쓴다 — 여기서 뒤집지 않는다.) */
  color: #eef2f8;
}
.about-card {
  width: 100%;
  padding: clamp(24px, 4vw, 48px);
  border-radius: var(--radius-card);
  background-color: var(--glass-bg);
  background-image: var(--glass-sheen);
  -webkit-backdrop-filter: var(--glass-surface);
  backdrop-filter: var(--glass-surface);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-glass);
}
.about-lead {
  max-width: 760px;
  margin: 12px 0 0;
  font-size: clamp(15px, 1.5vw, 18px);
  line-height: 1.7;
  color: #3c4655;
}
.about-eyebrow,
.about-section-label {
  margin: 0;
  color: var(--color-accent);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
}
.about-intro h3 {
  margin: 8px 0 0;
  font-size: clamp(26px, 3.2vw, 42px);
  line-height: 1.18;
  letter-spacing: -0.035em;
  color: #151923;
}
.about-facts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin: 30px 0;
}
.about-fact {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 2px 10px;
  padding: 18px;
  border-radius: 16px;
  background: var(--glass-inset-bg);
  background-image: var(--glass-inset-sheen);
}
.about-fact .weather-desk-icon {
  grid-row: 1 / 3;
  width: 36px;
  height: 36px;
}
.about-fact strong {
  font-size: 24px;
  line-height: 1;
  color: #151923;
}
.about-fact span {
  font-size: 13px;
  color: #55606e;
}
.about-body {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(260px, 0.8fr);
  gap: 28px;
  padding-top: 26px;
  border-top: 1px solid rgba(28, 32, 56, 0.1);
}
.about-list {
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.about-list-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 14px;
  line-height: 1.55;
  color: #48484f;
}
.about-check {
  flex-shrink: 0;
  margin-top: 3px;
  color: #14563a;
}
.about-note {
  margin: 0 0 18px;
  font-size: 13px;
  color: #48515f;
}
.about-source {
  align-self: start;
  padding: 18px;
  border-radius: 16px;
  background: rgba(11, 107, 220, 0.07);
}
.about-source p:last-child {
  margin: 10px 0 0;
  color: #48515f;
  font-size: 14px;
  line-height: 1.65;
}
.about-actions {
  margin-top: 28px;
}
@media (max-width: 720px) {
  .about-facts,
  .about-body {
    grid-template-columns: 1fr;
  }
  .about-facts {
    gap: 8px;
  }
}
</style>
