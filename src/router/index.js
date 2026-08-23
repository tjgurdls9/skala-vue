import { createRouter, createWebHistory } from 'vue-router'

const BASE_TITLE = 'WEATHER DESK'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  // 긴 대시보드에서 상세 화면으로 이동할 때 이전 스크롤 위치가 남으면 본문 중간부터 보인다.
  // 새 화면은 상단에서 시작하고, 뒤로 가기는 브라우저가 저장한 위치를 복원한다.
  scrollBehavior(to, from, savedPosition) {
    return savedPosition ?? { top: 0 }
  },
  // 모든 라우트를 동적 import로 등록해서 해당 화면에 들어갈 때 로드한다. (Lazy Loading)
  routes: [
    {
      path: '/',
      name: 'WeatherSummary',
      component: () => import('../views/WeatherSummaryView.vue'),
      meta: { title: '의사결정 보조 지표 요약' },
    },
    {
      path: '/dashboard',
      name: 'WeatherHome',
      component: () => import('../views/WeatherHomeView.vue'),
      meta: { title: '지역별 날씨 현황' },
    },
    {
      // :cityId 가 동적 세그먼트. 예) /weather/city_01
      path: '/weather/:cityId',
      name: 'WeatherDetail',
      component: () => import('../views/WeatherDetailView.vue'),
      meta: { title: '상세 기상 관측 정보' },
    },
    {
      path: '/about',
      name: 'WeatherAbout',
      component: () => import('../views/WeatherAboutView.vue'),
      meta: { title: '서비스 소개' },
    },
    { path: '/summary', redirect: '/' },
    {
      // 교재 단원별 Code Challenge 실습 모음
      path: '/practice',
      name: 'Practice',
      component: () => import('../views/PracticeView.vue'),
      meta: { title: '실습 아카이브' },
    },
    {
      path: '/troubleshooting',
      name: 'Troubleshooting',
      component: () => import('../views/TroubleshootingView.vue'),
      meta: { title: '트러블슈팅' },
    },
    {
      // 위 라우트와 매칭되지 않는 모든 경로를 받는 Catch-all Route. 반드시 맨 마지막에 둔다.
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('../views/NotFoundView.vue'),
      meta: { title: '페이지를 찾을 수 없음' },
    },
  ],
})

// Navigation Guard - Global Guard (라우터 인스턴스 하단에 배치)
// afterEach: 화면 전환이 완료된 후 트리거. 후속 처리 및 로그 기록용 훅이다.
// to: 이동한 목적지, from: 출발지
router.afterEach((to, from) => {
  document.title = to.meta.title ? `${to.meta.title} | ${BASE_TITLE}` : BASE_TITLE
  console.log(`화면 전환 완료: ${from.path} → ${to.path}`)
})

export default router
