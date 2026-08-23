<script setup>
import { useRouter } from 'vue-router'
import { InfoFilled, Back, Check, Location, DataAnalysis, Connection } from '@element-plus/icons-vue'

const router = useRouter()

const goHome = () => {
  router.push('/dashboard')
}

// 8차: <ul><li> 맨몸 목록이라 유리 카드 안에서 브라우저 기본 불릿만 덩그러니 떠 있었다 —
// 항목을 데이터로 빼고 체크 아이콘 + 정돈된 행으로 그린다.
const FEATURES = [
  'components/weather/ 폴더의 독립 부품 연동 (props / emits / slot)',
  '클라이언트 사이드 라우팅으로 새로고침 없는 화면 전환',
  'URL 쿼리 스트링과 실시간 검색 상태 동기화',
  '동적 경로 매칭(/weather/:cityId)으로 도시별 상세 페이지 제공',
  'Catch-all Route로 정의되지 않은 주소 처리',
  'Navigation Guard(afterEach)로 화면별 문서 제목 설정',
]

const FACTS = [
  { value: '83', label: '전국 관측 지점', icon: Location },
  { value: '7P', label: '마케팅 영향 분석', icon: DataAnalysis },
  { value: '5', label: '경영 기능 분석', icon: Connection },
]
</script>

<template>
  <div class="about-page">
    <h2 class="about-heading">
      <el-icon><InfoFilled /></el-icon> 서비스 소개
    </h2>

    <section class="about-card">
      <div class="about-intro">
        <p class="about-eyebrow">WEATHER INTELLIGENCE</p>
        <h3>날씨를 숫자에서 실행 기준으로 바꿉니다.</h3>
        <p class="about-lead">
          전국 83개 관측 지점의 실시간 날씨를 운영 여건 점수로 환산하고, 마케팅 믹스 7P와
          인사·재무·회계·물류·안전 관점의 영향까지 한 화면에서 연결합니다.
        </p>
      </div>

      <div class="about-facts" aria-label="서비스 주요 지표">
        <div v-for="fact in FACTS" :key="fact.label" class="about-fact">
          <el-icon><component :is="fact.icon" /></el-icon>
          <strong>{{ fact.value }}</strong>
          <span>{{ fact.label }}</span>
        </div>
      </div>

      <div class="about-body">
        <div>
          <p class="about-section-label">구현 범위</p>
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
.about-fact .el-icon {
  grid-row: 1 / 3;
  font-size: 24px;
  color: var(--color-accent);
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
