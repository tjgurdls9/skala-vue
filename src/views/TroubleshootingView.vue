<script setup>
import { Top, Bottom } from '@element-plus/icons-vue'

const cases = [
  {
    area: '지표 요약',
    title: '배경에 따라 표가 흐려지는 문제',
    symptom: '같은 표인데도 배경 사진에서 먹구름이 지나가는 위치만 본문과 수치가 흐려졌다. 화면을 처음 열었을 때는 괜찮다가 창 크기를 바꾸면 다시 안 읽히기도 했다.',
    attempt: '처음에는 글자색을 더 진하게 하고 카드의 흰색 투명도를 계속 올렸다. 한 장면은 좋아졌지만 맑은 배경에서는 카드만 불투명한 흰 판처럼 떠서 전체 톤이 깨졌다.',
    cause: '글자 자체가 아니라 카드 뒤 사진의 명암 폭이 문제였다. 반투명 카드와 글자색은 고정인데 배경 밝기는 위치마다 크게 달라 하나의 색상 값으로는 모든 장면을 해결할 수 없었다.',
    solution: '사진의 contrast와 brightness를 먼저 조절하고, 화면 전체에 얇고 균일한 밝기 베일을 추가했다. 유리 투명도는 유지하면서 카드 뒤쪽의 가장 어두운 값만 끌어올렸다.',
    lesson: '가독성 문제를 보면 글자색부터 바꾸기 쉽지만, 실제 원인은 한 단계 아래의 배경일 수 있다는 것을 배웠다. 한 장면이 아니라 여러 화면 크기와 배경 위치에서 확인해야 했다.',
  },
  {
    area: '지역 상태',
    title: '지도와 오른쪽 패널이 다른 지역을 가리키는 문제',
    symptom: '지도에는 안동시, 배지와 게이지에는 포항이 표시되는 순간이 있었다. 각각의 기능은 동작했지만 사용자는 지금 어느 지역을 보고 있는지 판단하기 어려웠다.',
    attempt: '처음에는 호버할 때 오른쪽 패널까지 모두 바꾸는 방법을 생각했다. 하지만 커서가 지도 위를 지날 때마다 큰 패널의 내용이 계속 바뀌어 읽기가 더 어려워졌다.',
    cause: '호버는 잠깐 확인하는 미리보기이고 클릭은 사용자가 고정한 선택인데, 두 상태를 같은 지역명 표시로만 보여주고 있었다. 로직보다 상태의 의미를 설명하는 표시가 부족했다.',
    solution: '호버 판독부에는 미리보기, 클릭한 지역에는 직접 선택이라는 꼬리표를 붙였다. 배지와 게이지도 선택 지역을 함께 가리키도록 맞추고, 선택이 없을 때만 운영 여건 1위를 보여주게 했다.',
    lesson: '상태가 여러 개면 값을 맞추는 것만큼 각 상태의 의미를 화면에서 알려주는 일이 중요했다. 호버와 클릭은 같은 선택 동작이 아니라는 점을 UI 문구로 설명했다.',
  },
  {
    area: '인터랙션',
    title: '카드 호버가 끊기는 문제',
    symptom: '카드가 부드럽게 떠오르도록 transition을 넣었는데도 큰 카드에서는 커서를 움직일 때 프레임이 끊겼다. 이징 시간만 바꿔도 느낌이 거의 나아지지 않았다.',
    attempt: 'transition 시간을 늘리고 easing 곡선을 여러 번 바꿨다. box-shadow의 겹 수도 맞췄지만, 커서를 움직이는 동안 계속 버벅인다는 핵심 증상은 남아 있었다.',
    cause: '문제는 애니메이션 시간이 아니라 pointermove마다 40px 블러 그림자의 방향을 다시 계산한 것이었다. 큰 카드 전체를 초당 수십 번 다시 그리느라 브라우저의 페인트 비용이 커졌다.',
    solution: '그림자 방향은 화면의 고정 광원에 맞춘 값으로 두었다. 커서 추적은 블러가 없는 가장자리 반사 링만 움직이게 해 시각 효과는 남기고 매 프레임 다시 그리는 범위를 줄였다.',
    lesson: '느린 애니메이션을 무조건 transition 문제로 보면 안 됐다. 개발자 도구와 증상이 발생하는 시점을 보고 transform, paint, blur 중 어디가 비싼지 나눠 확인하는 습관이 생겼다.',
  },
  {
    area: '전환 효과',
    title: '지역 카드 로테이션 사이에 빈 프레임이 생기는 문제',
    symptom: '지역 카드의 안내 문구가 자동으로 바뀔 때 이전 내용이 먼저 사라지고 잠깐 빈 공간이 보인 뒤 다음 내용이 나타났다.',
    attempt: 'opacity 전환 시간을 늘리면 자연스러울 것으로 생각했지만, 빈 구간도 함께 길어져 오히려 더 느리고 답답해 보였다.',
    cause: 'Vue Transition의 out-in 모드가 이전 요소의 퇴장을 끝낸 다음 새 요소를 넣는 순서였다. 두 요소가 겹치는 시간이 없으니 크로스페이드가 될 수 없었다.',
    solution: 'out-in 모드를 제거하고 나가는 요소를 같은 위치에 겹치도록 배치했다. 이전 내용이 흐려지는 동안 새 내용이 동시에 나타나게 해 빈 프레임을 없앴다.',
    lesson: '전환 효과는 지속 시간보다 요소가 들어오고 나가는 순서가 더 중요했다. CSS만 보지 않고 Vue가 실제 DOM을 언제 교체하는지도 함께 확인해야 했다.',
  },
  {
    area: 'API',
    title: '전국 조회에서 일부 지역이 비는 문제',
    symptom: '관측 지점을 17곳에서 45곳으로 늘린 뒤 일부 지역만 비거나 새로고침할 때마다 결과 수가 달라졌다. 코드 오류처럼 보였지만 항상 같은 지역에서 실패하지는 않았다.',
    attempt: '응답 데이터의 좌표와 지역 id를 먼저 확인하고 실패한 요청을 다시 보내 보았다. 개별 요청은 정상이라 데이터 매핑 문제가 아니라는 것을 확인했다.',
    cause: '한 지점마다 현재 날씨와 대기질을 두 번 요청해 총 90회가 한꺼번에 발생했다. 무료 API의 분당 호출 한도를 넘으면서 뒤쪽 요청이 429 응답으로 실패했다.',
    solution: '25개 지점씩 두 묶음으로 나누고 호출 사이에 간격을 두었다. 첫 묶음이 도착하면 화면에 바로 표시하고, Pinia에 결과를 보관해 탭을 옮길 때 같은 요청을 반복하지 않게 했다.',
    lesson: 'API가 간헐적으로 실패하면 코드뿐 아니라 요금제와 호출 제한도 확인해야 했다. 모든 결과를 기다리는 것보다 먼저 받은 데이터부터 보여주는 편이 체감 속도에도 유리했다.',
  },
  {
    area: '라우팅',
    title: '탭 이동 때 화면이 들썩이는 문제',
    symptom: '상단 탭을 누를 때 페이지 전체가 위로 한번 접혔다가 다시 펼쳐지는 것처럼 들썩였다. 각 화면 자체의 높이는 충분한데 전환 순간에만 발생했다.',
    attempt: '각 View의 margin과 padding을 맞추고 최대 너비도 통일했다. 화면별 폭 차이는 줄었지만 탭을 누르는 찰나의 수직 흔들림은 남았다.',
    cause: '화면을 동적 import로 나눠 둔 상태라 다음 JavaScript 청크를 읽는 짧은 동안 RouterView가 비었다. 그 순간 본문 높이가 0이 되며 아래 요소가 위로 당겨졌다.',
    solution: '라우트가 표시되는 영역에 최소 높이를 주고 화면 교체에는 짧은 크로스페이드를 적용했다. 새 화면을 읽는 동안에도 전체 레이아웃의 자리는 유지했다.',
    lesson: '레이아웃이 흔들린다고 항상 CSS 여백 문제는 아니었다. 네트워크와 코드 분할 때문에 생기는 아주 짧은 빈 상태도 화면 크기에 영향을 줄 수 있었다.',
  },
  {
    area: '개발 환경',
    title: '코드를 고쳤는데 화면이 바뀌지 않는 문제',
    symptom: 'CSS와 컴포넌트를 여러 번 수정하고 저장했는데 브라우저 화면은 계속 이전 디자인을 보여줬다. 코드가 틀렸다고 생각해 같은 부분을 반복해서 손봤다.',
    attempt: '브라우저 새로고침, 캐시 비우기, 개발 서버 재시작까지 해봤지만 결과가 같았다. 그제야 실행 중인 터미널 경로와 Git 브랜치를 따로 확인했다.',
    cause: '수정은 worktree-ios-redesign 브랜치에서 하고 있었지만 개발 서버는 main 폴더에서 실행 중이었다. 브라우저가 보고 있는 소스와 내가 편집하는 소스가 서로 달랐다.',
    solution: 'git worktree list와 현재 터미널 경로를 확인한 뒤 리디자인 worktree에서 개발 서버를 다시 실행했다. 이후부터 작업 전 브랜치, 경로, 로컬 주소를 먼저 확인했다.',
    lesson: '비전공자 입장에서는 화면이 안 바뀌면 코드부터 의심하기 쉬웠다. 하지만 실행 환경을 먼저 확인하는 짧은 절차가 불필요한 수정을 크게 줄여준다는 것을 배웠다.',
  },
  {
    area: '배포',
    title: '배포 주소로 바로 들어가면 404가 나는 문제',
    symptom: '홈에서 탭을 눌러 /practice로 이동하면 정상인데, 같은 주소를 새 창에 붙여 넣거나 새로고침하면 404가 나왔다. 로컬에서는 재현되지 않아 배포 자체가 잘못된 줄 알았다.',
    attempt: '라우터 경로와 컴포넌트 import를 다시 확인하고 빌드도 반복했다. 앱 안에서 이동할 때는 정상이라는 차이를 기준으로 서버가 처음 주소를 처리하는 과정을 살펴봤다.',
    cause: 'Vue Router는 브라우저 안에서 경로를 바꾸지만, 직접 접속한 Vercel은 /practice라는 실제 파일을 찾으려 했다. 정적 결과물에는 해당 파일이 없고 index.html만 있었다.',
    solution: 'vercel.json에 모든 경로를 index.html로 보내는 rewrite를 추가했다. 이후 Vue 앱이 먼저 열린 다음 Router가 현재 주소에 맞는 화면을 선택하게 했다.',
    lesson: '로컬 개발 서버가 자동으로 처리해 주는 기능이 배포 서버에는 없을 수 있었다. 홈뿐 아니라 하위 주소 직접 접속과 새로고침까지 배포 확인 항목에 넣었다.',
  },
]

const pad = (index) => String(index + 1).padStart(2, '0')
</script>

<template>
  <div class="trouble-page">
    <header id="trouble-top" class="trouble-head">
      <p class="trouble-eyebrow">TROUBLESHOOTING LOG</p>
      <h2 class="trouble-title">트러블슈팅</h2>
      <p class="trouble-sub">막혔던 지점부터 원인을 찾아간 과정, 해결 뒤 남은 배움까지 기록했습니다.</p>
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
        <div class="attempt"><dt>처음 해본 시도</dt><dd>{{ item.attempt }}</dd></div>
        <div><dt>원인</dt><dd>{{ item.cause }}</dd></div>
        <div class="solution"><dt>해결</dt><dd>{{ item.solution }}</dd></div>
        <div class="lesson"><dt>배운 점</dt><dd>{{ item.lesson }}</dd></div>
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
.trouble-detail .attempt { border-left-color: rgba(255, 149, 0, .7); }
.trouble-detail .lesson { border-left-color: rgba(52, 199, 89, .7); }
.trouble-detail dt { margin-bottom: 7px; font-size: 11px; font-weight: 800; letter-spacing: .08em; color: #687482; }
.trouble-detail dd { margin: 0; color: #303946; font-size: 14px; line-height: 1.65; }
@media (max-width: 760px) { .trouble-index { grid-template-columns: 1fr; } }
</style>
