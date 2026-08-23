<script setup>
import { useRouter } from 'vue-router'
import { InfoFilled, Back, Check } from '@element-plus/icons-vue'

const router = useRouter()

const goHome = () => {
  router.push('/')
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
</script>

<template>
  <div class="about-page">
    <h2 class="about-heading">
      <el-icon><InfoFilled /></el-icon> 서비스 소개
    </h2>

    <section class="about-card">
      <p class="about-lead">
        Vue 3와 Vue Router 5로 만든 기상 기반 경영 의사결정 참고 대시보드입니다. 전국 17개
        시·도의 실시간 날씨를 마케팅 믹스 7P와 인사·재무·회계·물류·안전 5개 경영 기능의 영향으로
        번역해, 업종과 무관하게 전사 전략의 근거로 쓸 수 있게 정리합니다.
      </p>

      <ul class="about-list">
        <li v-for="feature in FEATURES" :key="feature" class="about-list-item">
          <el-icon class="about-check"><Check /></el-icon>
          <span>{{ feature }}</span>
        </li>
      </ul>

      <p class="about-note">
        날씨 데이터는 OpenWeatherMap API로 실시간 조회하며, 공휴일 정보는 별도 외부 API를 씁니다.
      </p>

      <el-button type="primary" :icon="Back" @click="goHome">대시보드 홈으로 이동</el-button>
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
  color: #f5f5f7;
  text-shadow:
    0 1px 2px rgba(0, 0, 0, 0.55),
    0 2px 14px rgba(0, 0, 0, 0.35);
}
.about-card {
  max-width: 720px;
  padding: 26px 28px;
  border-radius: var(--radius-card);
  background-color: var(--glass-bg);
  background-image: var(--glass-sheen);
  -webkit-backdrop-filter: var(--glass-surface);
  backdrop-filter: var(--glass-surface);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-glass);
}
.about-lead {
  margin: 0 0 18px;
  font-size: 15px;
  line-height: 1.6;
  color: #1c1c1e;
}
.about-list {
  margin: 0 0 18px;
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
  color: #248a5e;
}
.about-note {
  margin: 0 0 18px;
  font-size: 13px;
  color: #6e6e73;
}
</style>
