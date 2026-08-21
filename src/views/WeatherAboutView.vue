<script setup>
import { useRouter } from 'vue-router'
import BaseDashboardCard from '../components/weather/BaseDashboardCard.vue'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <div class="practice-section">
    <h2>ℹ️ 서비스 소개</h2>

    <BaseDashboardCard>
      <p>본 앱은 Vue 3와 Vue Router 5 기반으로 제작한 실습용 가상 기상 대시보드 시스템입니다.</p>
      <ul>
        <li><code>components/weather/</code> 폴더 내부의 독립 부품 연동 (props / emits / slot)</li>
        <li>클라이언트 사이드 라우팅을 통한 새로고침 없는 화면 전환</li>
        <li>URL 쿼리 스트링 매핑을 활용한 실시간 검색 상태 동기화</li>
        <li>동적 경로 매칭(<code>/weather/:cityId</code>)으로 도시별 상세 페이지 제공</li>
        <li>Catch-all Route로 정의되지 않은 주소 처리</li>
        <li>Navigation Guard(afterEach)로 화면별 문서 제목 설정 및 전환 로그 기록</li>
      </ul>
      <p>날씨 데이터는 아직 각 View 내부의 Mock Data입니다.</p>
    </BaseDashboardCard>

    <button class="btn-external" @click="goHome">대시보드 홈으로 이동</button>
  </div>
</template>
