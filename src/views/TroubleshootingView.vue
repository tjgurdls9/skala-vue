<script setup>
import { Top, Bottom } from '@element-plus/icons-vue'

const cases = [
  {
    area: '지표 요약',
    title: '배경에 따라 표가 흐려지는 문제',
    symptom: '반투명 카드 아래에 먹구름이 지나가면 요약 표의 본문과 수치 대비가 급격히 낮아졌다.',
    cause: '사진의 명암 폭이 큰데 카드 투명도와 글자색은 고정되어 있었다.',
    solution: '배경 대비를 낮추고 균일한 밝기 베일을 더해, 어느 위치에서도 같은 명암 조건을 유지했다.',
  },
  {
    area: '지역 상태',
    title: '지도와 오른쪽 패널이 다른 지역을 가리키는 문제',
    symptom: '지도 호버는 판독부만 바꾸고 클릭은 콕핏만 바꿔 지역명이 서로 달라 보였다.',
    cause: '일시적인 미리보기 상태와 사용자가 고정한 선택 상태를 화면에서 구분하지 않았다.',
    solution: '호버에는 미리보기, 클릭에는 직접 선택 표시를 붙이고 선택 지역을 배지와 게이지에 함께 표시했다.',
  },
  {
    area: '인터랙션',
    title: '카드 호버가 끊기는 문제',
    symptom: '큰 카드 위에서 커서를 움직일 때 떠오르는 동작과 그림자가 딱딱하게 끊겼다.',
    cause: '커서 이동마다 40px 블러 그림자의 방향을 다시 계산해 넓은 영역을 반복해서 그렸다.',
    solution: '그림자는 고정 광원 값으로 두고, 커서 추적은 비용이 작은 가장자리 반사 효과에만 사용했다.',
  },
  {
    area: '전환 효과',
    title: '지역 카드 로테이션 사이에 빈 프레임이 생기는 문제',
    symptom: '안내 문구가 바뀔 때 이전 카드가 사라진 뒤 다음 카드가 나타나 전환이 끊겨 보였다.',
    cause: 'Transition의 out-in 모드가 퇴장 완료까지 새 콘텐츠 진입을 기다렸다.',
    solution: '나가는 요소와 들어오는 요소를 같은 자리에 겹쳐 크로스페이드하도록 전환 순서를 바꿨다.',
  },
  {
    area: 'API',
    title: '전국 조회에서 일부 지역이 비는 문제',
    symptom: '45개 지점의 날씨와 대기질을 한 번에 요청하면 뒤쪽 지역이 간헐적으로 표시되지 않았다.',
    cause: '지점당 두 번, 총 90회 요청이 무료 API의 분당 호출 한도를 넘었다.',
    solution: '25개 지점씩 나눠 호출하고 먼저 도착한 결과부터 반영했으며, Pinia 캐시로 탭 이동 중 재호출을 막았다.',
  },
  {
    area: '라우팅',
    title: '탭 이동 때 화면이 들썩이는 문제',
    symptom: '동적 import로 다른 화면을 불러오는 짧은 순간에 본문 높이가 0으로 줄었다.',
    cause: 'RouterView가 비는 로딩 구간에 높이를 유지할 기준이 없었다.',
    solution: '라우트 영역의 최소 높이를 고정하고 짧은 크로스페이드로 화면 교체를 연결했다.',
  },
  {
    area: '배포',
    title: '배포 주소로 바로 들어가면 404가 나는 문제',
    symptom: '홈은 열리지만 /practice 같은 주소를 직접 열거나 새로고침하면 파일을 찾지 못했다.',
    cause: '정적 호스팅이 Vue Router 경로를 실제 파일 경로로 해석했다.',
    solution: 'Vercel rewrite가 모든 앱 경로를 index.html로 보내도록 설정했다.',
  },
]

const pad = (index) => String(index + 1).padStart(2, '0')
</script>

<template>
  <div class="trouble-page">
    <header id="trouble-top" class="trouble-head">
      <p class="trouble-eyebrow">TROUBLESHOOTING LOG</p>
      <h2 class="trouble-title">트러블슈팅</h2>
      <p class="trouble-sub">개발 중 확인한 현상과 원인, 실제 적용한 해결 방법을 정리했습니다.</p>
    </header>

    <nav class="trouble-index" aria-label="트러블슈팅 목차">
      <a v-for="(item, index) in cases" :key="item.title" class="trouble-index-item" :href="`#case-${index}`">
        <span class="trouble-index-num">{{ pad(index) }}</span>
        <span class="trouble-index-body">
          <span class="trouble-index-area">{{ item.area }}</span>
          <span class="trouble-index-name">{{ item.title }}</span>
        </span>
        <el-icon><Bottom /></el-icon>
      </a>
    </nav>

    <section v-for="(item, index) in cases" :id="`case-${index}`" :key="item.title" class="trouble-section">
      <header class="trouble-section-head">
        <span class="trouble-section-num">{{ pad(index) }}</span>
        <div>
          <p>{{ item.area }}</p>
          <h3>{{ item.title }}</h3>
        </div>
        <a href="#trouble-top"><el-icon><Top /></el-icon> 목차</a>
      </header>
      <dl class="trouble-detail">
        <div><dt>현상</dt><dd>{{ item.symptom }}</dd></div>
        <div><dt>원인</dt><dd>{{ item.cause }}</dd></div>
        <div class="solution"><dt>해결</dt><dd>{{ item.solution }}</dd></div>
      </dl>
    </section>
  </div>
</template>

<style scoped>
.trouble-page { width: 100%; }
.trouble-head { margin-bottom: 18px; scroll-margin-top: 20px; }
.trouble-eyebrow { margin: 0; font-size: 11px; font-weight: 700; letter-spacing: .14em; color: rgba(206, 221, 243, .82); }
.trouble-title { margin: 4px 0 0; padding: 0; border: 0; font-size: 30px; font-weight: 800; color: #f2f6fc; }
.trouble-sub { margin: 6px 0 0; font-size: 14px; color: rgba(214, 226, 244, .86); }
.trouble-index { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px; margin-bottom: 34px; padding: 16px; border: 1px solid var(--glass-border); border-radius: var(--radius-card); background: var(--glass-sheen), var(--glass-bg); backdrop-filter: var(--glass-surface); box-shadow: var(--shadow-glass); }
.trouble-index-item { display: flex; align-items: center; gap: 11px; padding: 11px 12px; border-radius: 10px; color: inherit; text-decoration: none; transition: background-color .2s var(--apple-ease); }
.trouble-index-item:hover { background: rgba(255,255,255,.55); }
.trouble-index-num { font-size: 17px; font-weight: 800; color: #48515f; font-variant-numeric: tabular-nums; }
.trouble-index-body { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.trouble-index-area { font-size: 11px; font-weight: 700; color: #6b7684; }
.trouble-index-name { font-size: 14px; font-weight: 700; line-height: 1.35; color: #1c1c1e; }
.trouble-section { margin-bottom: 34px; scroll-margin-top: 20px; }
.trouble-section-head { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid rgba(28,32,56,.1); }
.trouble-section-num { font-size: 26px; font-weight: 800; color: rgba(226,236,250,.7); }
.trouble-section-head div { flex: 1; }
.trouble-section-head p { margin: 0 0 2px; font-size: 11px; font-weight: 700; color: rgba(214,226,244,.82); }
.trouble-section-head h3 { margin: 0; font-size: 20px; color: #f2f6fc; }
.trouble-section-head a { display: inline-flex; align-items: center; gap: 3px; color: rgba(200,220,245,.9); font-size: 12px; font-weight: 600; text-decoration: none; }
.trouble-detail { display: grid; grid-template-columns: 1fr; gap: 0; margin: 0; padding: 18px; border: 1px solid var(--glass-border); border-radius: var(--radius-card); background: var(--glass-sheen), var(--glass-bg); backdrop-filter: var(--glass-surface); box-shadow: var(--shadow-glass); }
.trouble-detail div { padding: 14px; border-left: 2px solid rgba(28,32,56,.1); border-bottom: 1px solid rgba(28,32,56,.08); }
.trouble-detail div:first-child { padding-top: 4px; }
.trouble-detail div:last-child { padding-bottom: 4px; border-bottom: 0; }
.trouble-detail .solution { border-left-color: var(--color-accent); }
.trouble-detail dt { margin-bottom: 7px; font-size: 11px; font-weight: 800; letter-spacing: .08em; color: #687482; }
.trouble-detail dd { margin: 0; color: #303946; font-size: 14px; line-height: 1.65; }
@media (max-width: 760px) { .trouble-index { grid-template-columns: 1fr; } }
</style>
