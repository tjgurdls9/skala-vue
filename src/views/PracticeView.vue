<script setup>
import { computed, shallowRef } from 'vue'
import {
  MagicStick,
  Document,
  Connection,
  Lightning,
  Pointer,
  Refresh,
  Box,
  Files,
  Grid,
  Bottom,
  Top,
} from '@element-plus/icons-vue'

import SampleOne from '../components/practice/basic/SampleOne.vue'
import SampleTwo from '../components/practice/basic/SampleTwo.vue'
import vHtml from '../components/practice/render/vHtml.vue'
import vHtmlXSS from '../components/practice/render/vHtmlXSS.vue'
import vText from '../components/practice/render/vText.vue'
import vBind from '../components/practice/binding/vBindBasic.vue'
import vBindClassBinding from '../components/practice/binding/vBindClassBinding.vue'
import vBindStyleBinding from '../components/practice/binding/vBindStyleBinding.vue'
import vBindShorthand from '../components/practice/binding/vBindShorthand.vue'
import vIfElse from '../components/practice/render/vIfElse.vue'
import vShow from '../components/practice/render/vShow.vue'
import vFor from '../components/practice/render/vFor.vue'
import vPre from '../components/practice/optimize/vPre.vue'
import vCloak from '../components/practice/optimize/vCloak.vue'
import vOnce from '../components/practice/optimize/vOnce.vue'
import vMemo from '../components/practice/optimize/vMemo.vue'
import vOnEventHandler from '../components/practice/event/vOnEventHandler.vue'
import vOnEventObject from '../components/practice/event/vOnEventObject.vue'
import vOnEventModifier from '../components/practice/event/vOnEventModifier.vue'
import vModelFormDataBinding from '../components/practice/event/vModelFormDataBinding.vue'
import vModelModifier from '../components/practice/event/vModelModifier.vue'
import vStyleScoped from '../components/practice/event/vStyleScoped.vue'
import vReactiveRef from '../components/practice/composition/vReactiveRef.vue'
import vReactiveReactive from '../components/practice/composition/vReactiveReactive.vue'
import vComputedBasic from '../components/practice/composition/vComputedBasic.vue'
import vWatchBasic from '../components/practice/composition/vWatchBasic.vue'
import vWatchMulti from '../components/practice/composition/vWatchMulti.vue'
import vWatchDeep from '../components/practice/composition/vWatchDeep.vue'
import vWatchReactive from '../components/practice/composition/vWatchReactive.vue'
import vWatchEffect from '../components/practice/composition/vWatchEffect.vue'
import vLifecycleHook from '../components/practice/component/vLifecycleHook.vue'
import vPropsEmits from '../components/practice/component/vPropsEmits.vue'
import SlotDefaultParent from '../components/practice/component/SlotDefaultParent.vue'
import SlotNamedParent from '../components/practice/component/SlotNamedParent.vue'
import SlotScopedParent from '../components/practice/component/SlotScopedParent.vue'
import StoreCounter from '../components/practice/store/StoreCounter.vue'
import ElRegisterForm from '../components/practice/uilib/ElRegisterForm.vue'
import ElProductCounter from '../components/practice/uilib/ElProductCounter.vue'
import ElFeedbackProgress from '../components/practice/uilib/ElFeedbackProgress.vue'

// 8차: 40개 실습을 <br><hr><br>로 끝없이 이어붙인 단일 스크롤이었다. 폴더 구조(basic/render/
// binding/...)가 이미 단원을 나타내고 있어서, 그걸 그대로 살려 "실습 아카이브"로 재구성한다.
// 컴포넌트는 reactive로 감쌀 필요가 없으므로 shallowRef 계열로 그대로 들고만 있는다.
const CHAPTERS = [
  {
    id: 'basic',
    label: '기초',
    icon: Document,
    desc: '반응성 변수와 템플릿 렌더링의 출발점',
    items: [
      { name: 'Hello Skala-Vue', comp: SampleOne },
      { name: 'Welcome to Skala-Vue', comp: SampleTwo },
    ],
  },
  {
    id: 'render',
    label: '렌더링',
    icon: Grid,
    desc: 'v-html / v-text와 조건·반복 렌더링',
    items: [
      { name: 'v-html', comp: vHtml },
      { name: 'v-html과 XSS', comp: vHtmlXSS },
      { name: 'v-text', comp: vText },
      { name: 'v-if / v-else', comp: vIfElse },
      { name: 'v-show', comp: vShow },
      { name: 'v-for', comp: vFor },
    ],
  },
  {
    id: 'binding',
    label: '바인딩',
    icon: Connection,
    desc: 'v-bind로 속성·클래스·스타일 잇기',
    items: [
      { name: 'v-bind 기본', comp: vBind },
      { name: '클래스 바인딩', comp: vBindClassBinding },
      { name: '스타일 바인딩', comp: vBindStyleBinding },
      { name: '단축 표기', comp: vBindShorthand },
    ],
  },
  {
    id: 'optimize',
    label: '최적화',
    icon: Lightning,
    desc: 'v-pre / v-cloak / v-once / v-memo',
    items: [
      { name: 'v-pre', comp: vPre },
      { name: 'v-cloak', comp: vCloak },
      { name: 'v-once', comp: vOnce },
      { name: 'v-memo', comp: vMemo },
    ],
  },
  {
    id: 'event',
    label: '이벤트 · 폼',
    icon: Pointer,
    desc: 'v-on 핸들러와 v-model 폼 바인딩',
    items: [
      { name: '이벤트 핸들러', comp: vOnEventHandler },
      { name: '이벤트 객체', comp: vOnEventObject },
      { name: '이벤트 수식어', comp: vOnEventModifier },
      { name: '폼 데이터 바인딩', comp: vModelFormDataBinding },
      { name: 'v-model 수식어', comp: vModelModifier },
      { name: 'scoped 스타일', comp: vStyleScoped },
    ],
  },
  {
    id: 'composition',
    label: 'Composition API',
    icon: Refresh,
    desc: 'ref · reactive · computed · watch',
    items: [
      { name: 'ref', comp: vReactiveRef },
      { name: 'reactive', comp: vReactiveReactive },
      { name: 'computed', comp: vComputedBasic },
      { name: 'watch 기본', comp: vWatchBasic },
      { name: 'watch 다중 감시', comp: vWatchMulti },
      { name: 'watch deep', comp: vWatchDeep },
      { name: 'watch reactive', comp: vWatchReactive },
      { name: 'watchEffect', comp: vWatchEffect },
    ],
  },
  {
    id: 'component',
    label: '컴포넌트',
    icon: Box,
    desc: '생명주기 · props/emits · 슬롯',
    items: [
      { name: '생명주기 훅', comp: vLifecycleHook },
      { name: 'props / emits', comp: vPropsEmits },
      { name: '기본 슬롯', comp: SlotDefaultParent },
      { name: '이름 있는 슬롯', comp: SlotNamedParent },
      { name: '스코프 슬롯', comp: SlotScopedParent },
    ],
  },
  {
    id: 'store',
    label: '스토어',
    icon: Files,
    desc: 'Pinia 전역 상태 관리',
    items: [{ name: 'Pinia 카운터', comp: StoreCounter }],
  },
  {
    id: 'uilib',
    label: 'UI 라이브러리',
    icon: MagicStick,
    desc: 'Element Plus 컴포넌트 실습 (교재 231~249p)',
    items: [
      { name: '회원가입 폼', comp: ElRegisterForm },
      { name: '상품 수량 카운터', comp: ElProductCounter },
      { name: '피드백 · 진행률', comp: ElFeedbackProgress },
    ],
  },
]

const chapters = shallowRef(CHAPTERS)

const totalCount = computed(() =>
  chapters.value.reduce((sum, chapter) => sum + chapter.items.length, 0),
)

// 9차: 참고 사이트 /lab과 같은 "번호 매긴 목차 + 각 단원 상세" 구조로 바꿨다.
// 01, 02 … 두 자리로 맞춰야 목차 그리드에서 숫자 폭이 흔들리지 않는다.
const pad = (index) => String(index + 1).padStart(2, '0')
</script>


<template>
  <div class="lab-page">
    <!-- 참고 사이트 /lab의 머리 구성: 작은 영문 eyebrow → 큰 제목 → 한 줄 설명 -->
    <header id="lab-top" class="lab-head">
      <p class="lab-eyebrow">PRACTICE ARCHIVE</p>
      <h2 class="lab-title">실습 아카이브</h2>
      <p class="lab-sub">
        Vue 문법부터 UI 라이브러리까지, {{ chapters.length }}개 단원 · 실습
        {{ totalCount }}개의 기록
      </p>
    </header>

    <!-- 번호 매긴 목차. 클릭하면 해당 단원으로 스크롤한다 -->
    <nav class="lab-index">
      <a
        v-for="(chapter, i) in chapters"
        :key="chapter.id"
        class="lab-index-item"
        :href="`#${chapter.id}`"
      >
        <span class="lab-index-num">{{ pad(i) }}</span>
        <span class="lab-index-body">
          <span class="lab-index-name">{{ chapter.label }}</span>
          <span class="lab-index-desc">{{ chapter.desc }}</span>
        </span>
        <el-icon class="lab-index-arrow"><Bottom /></el-icon>
      </a>
    </nav>

    <!-- 단원별 상세: 왼쪽에 다루는 문법, 오른쪽에 실제 동작하는 실습 화면 -->
    <section v-for="(chapter, i) in chapters" :id="chapter.id" :key="chapter.id" class="lab-section">
      <header class="lab-section-head">
        <span class="lab-section-num">{{ pad(i) }}</span>
        <div class="lab-section-titles">
          <h3 class="lab-section-title">
            <el-icon><component :is="chapter.icon" /></el-icon>
            {{ chapter.label }}
          </h3>
          <p class="lab-section-desc">{{ chapter.desc }}</p>
        </div>
        <a class="lab-toc-link" href="#lab-top">
          <el-icon><Top /></el-icon> 목차
        </a>
      </header>

      <div class="lab-section-body">
        <div class="lab-notes">
          <p class="lab-col-label">다루는 문법</p>
          <ul class="lab-note-list">
            <li v-for="item in chapter.items" :key="item.name">{{ item.name }}</li>
          </ul>
        </div>

        <div class="lab-demo">
          <p class="lab-col-label">실습 화면</p>
          <!-- 단원 하나가 길어도 페이지가 끝없이 늘어나지 않도록 안쪽에서만 스크롤시킨다 -->
          <div class="lab-demo-frame">
            <component :is="item.comp" v-for="item in chapter.items" :key="item.name" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.lab-page {
  width: 100%;
}

/* --- 머리말 --- */
.lab-head {
  margin-bottom: 18px;
  scroll-margin-top: 20px;
}
.lab-eyebrow {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: rgba(206, 221, 243, 0.82);
}
.lab-title {
  margin: 4px 0 0;
  font-size: 30px;
  font-weight: 800;
  color: #191f28;
  border-bottom: none;
  padding-bottom: 0;
}
.lab-sub {
  margin: 6px 0 0;
  font-size: 14px;
  color: rgba(214, 226, 244, 0.86);
}

/* --- 목차 그리드 --- */
.lab-index {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 10px;
  margin-bottom: 28px;
  padding: 16px;
  border-radius: var(--radius-card);
  background-color: var(--glass-bg);
  background-image: var(--glass-sheen);
  -webkit-backdrop-filter: var(--glass-surface);
  backdrop-filter: var(--glass-surface);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-glass);
}
.lab-index-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  text-decoration: none;
  color: inherit;
  transition: background-color 0.2s var(--apple-ease);
}
.lab-index-item:hover {
  background-color: rgba(255, 255, 255, 0.55);
}
.lab-index-num {
  font-size: 17px;
  font-weight: 800;
  /* 참고 사이트는 불투명 흰 카드라 옅은 회색 번호도 읽혔지만, 우리 카드는 반투명이라
     뒤 하늘이 밝은 구간에서 번호가 그대로 날아갔다 — 대비를 올린다. */
  color: #48515f;
  font-variant-numeric: tabular-nums;
}
.lab-index-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.lab-index-name {
  font-size: 14px;
  font-weight: 700;
  color: #1c1c1e;
}
.lab-index-desc {
  font-size: 12px;
  color: #48515f;
}
.lab-index-arrow {
  color: #48515f;
  flex-shrink: 0;
}
.lab-index-item:hover .lab-index-arrow {
  color: var(--color-accent);
}

/* --- 단원 --- */
.lab-section {
  margin-bottom: 34px;
  /* 앵커로 점프했을 때 제목이 상단에 딱 붙지 않도록 */
  scroll-margin-top: 20px;
}
/* 13차-e: 사진 배경 시절에는 이 헤더를 어두운 바 위에 올려야 흰 글자가 읽혔다.
   배경이 밝은 회색이 된 지금은 바가 필요 없다 — 선 하나로 단원을 가른다. */
.lab-section-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 10px;
  margin-bottom: 14px;
  border-bottom: 1px solid rgba(28, 32, 56, 0.1);
}
/* 12차: 사진 위 흰 글자에 opacity를 곱해 위계를 만들고 있었는데, 밝은 구름 구간에서는
   그 자체로 대비가 빠듯해서 글자가 배경에 녹아버렸다(실제로 '02 렌더링'이 안 읽혔다).
   위계는 크기·굵기로 충분하므로 흰 글자에서 opacity는 걷어낸다. */
.lab-section-num {
  font-size: 26px;
  font-weight: 800;
  line-height: 1;
  color: rgba(226, 236, 250, 0.7);
  font-variant-numeric: tabular-nums;
}
.lab-section-titles {
  flex: 1;
  min-width: 0;
}
.lab-section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #f2f6fc;
}
.lab-section-desc {
  margin: 2px 0 0;
  font-size: 13px;
  color: rgba(214, 226, 244, 0.82);
}
.lab-toc-link {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
  color: rgba(200, 220, 245, 0.9);
  text-decoration: none;
}
.lab-toc-link:hover {
  color: #ffffff;
}

.lab-section-body {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  align-items: start;
}
@media (min-width: 960px) {
  .lab-section-body {
    grid-template-columns: minmax(200px, 260px) 1fr;
  }
  .lab-notes {
    position: sticky;
    top: 20px;
  }
}

.lab-col-label {
  display: inline-block;
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #8b95a1;
}

.lab-note-list {
  margin: 0;
  padding: 14px 16px;
  list-style: none;
  border-radius: var(--radius-card);
  background-color: var(--glass-bg);
  background-image: var(--glass-sheen);
  -webkit-backdrop-filter: var(--glass-surface);
  backdrop-filter: var(--glass-surface);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-glass);
}
.lab-note-list li {
  font-size: 13px;
  line-height: 1.9;
  color: #48484f;
  font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
}

/* 실습 화면은 안쪽에서만 스크롤시켜서, 단원이 길어도 목차 흐름이 끊기지 않게 한다 */
.lab-demo-frame {
  max-height: 560px;
  overflow-y: auto;
  padding: 4px 12px 4px 4px;
}
</style>
