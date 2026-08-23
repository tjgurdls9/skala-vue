<script setup>
import { ref, watch } from 'vue'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import WeatherDeskIcon from './WeatherDeskIcon.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue', 'complete'])
const step = ref(1)

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) step.value = 1
  },
)

const points = [
  {
    icon: 'location',
    title: '전국을 한눈에',
    text: '83개 관측 지점의 현재 기상과 지역별 기상 대응 지수를 비교합니다.',
  },
  {
    icon: 'observation',
    title: '수치에서 판단으로',
    text: '날씨를 점수·경보·실행 제안으로 바꿔 우선순위를 빠르게 찾습니다.',
  },
  {
    icon: 'risk',
    title: '우선순위를 먼저',
    text: '인사·재무·회계·생산·물류·마케팅·안전 등 모든 경영 기능에 적용합니다.',
  },
]

const complete = () => emit('complete')
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    width="min(760px, calc(100vw - 32px))"
    align-center
    append-to-body
    modal-class="onboarding-backdrop"
    destroy-on-close
    :show-close="false"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    class="onboarding-dialog"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="onboarding-content">
      <div class="onboarding-progress" :aria-label="`온보딩 ${step}/2`">
        <i :class="{ 'is-active': step === 1 }"></i>
        <i :class="{ 'is-active': step === 2 }"></i>
      </div>

      <Transition name="onboarding-step" mode="out-in">
        <section v-if="step === 1" key="welcome" class="onboarding-welcome">
          <p class="onboarding-eyebrow">환영합니다.</p>
          <h2 class="onboarding-wordmark">
            <span>WEATHER</span> DESK<span class="onboarding-dot">.</span>
          </h2>
          <p class="onboarding-lead">당신의 경영전략 수립 파트너</p>
          <el-button type="primary" size="large" class="onboarding-start" @click="step = 2">
            서비스 알아보기 <el-icon><ArrowRight /></el-icon>
          </el-button>
        </section>

        <section v-else key="service" class="onboarding-service">
          <p class="onboarding-eyebrow">SERVICE OVERVIEW</p>
          <h2 class="onboarding-service-title">날씨를 전사 경영 판단으로 연결합니다.</h2>
          <p class="onboarding-description">
            특정 업종에 치우치지 않고, 모든 조직이 같은 기상 데이터를 각자의 경영 기능에 맞게
            활용할 수 있도록 정리합니다.
          </p>

          <div class="onboarding-points">
            <article v-for="point in points" :key="point.title" class="onboarding-point">
              <WeatherDeskIcon :name="point.icon" class="onboarding-point-art" />
              <h3>{{ point.title }}</h3>
              <p>{{ point.text }}</p>
            </article>
          </div>

          <div class="onboarding-actions">
            <el-button size="large" @click="step = 1">
              <el-icon><ArrowLeft /></el-icon> 이전
            </el-button>
            <el-button type="primary" size="large" @click="complete">
              대시보드 시작하기 <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
          <p class="onboarding-note">이 안내는 첫 방문에만 표시됩니다.</p>
        </section>
      </Transition>
    </div>
  </el-dialog>
</template>

<style>
.el-dialog.onboarding-dialog {
  --el-dialog-padding-primary: 0;
  overflow: hidden;
  min-height: min(600px, calc(100vh - 48px));
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 28px;
  background:
    radial-gradient(70% 85% at 6% 0%, rgba(45, 116, 255, 0.28), transparent 64%),
    linear-gradient(145deg, rgba(14, 24, 48, 0.96), rgba(4, 8, 20, 0.94)) !important;
  box-shadow: 0 40px 120px rgba(0, 0, 0, 0.62);
  -webkit-backdrop-filter: saturate(150%) blur(32px);
  backdrop-filter: saturate(150%) blur(32px);
  isolation: isolate;
}
.onboarding-backdrop {
  background:
    radial-gradient(circle at 16% 4%, rgba(0, 100, 255, 0.2), transparent 34%),
    rgba(2, 5, 14, 0.82) !important;
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
}
.el-dialog.onboarding-dialog .el-dialog__header {
  display: none;
}
.onboarding-content {
  position: relative;
  z-index: 1;
  padding: clamp(28px, 5vw, 52px);
}
.onboarding-content::after {
  position: absolute;
  top: -180px;
  right: -220px;
  width: 520px;
  height: 520px;
  border: 1px solid rgba(114, 164, 255, 0.12);
  border-radius: 50%;
  box-shadow: 0 0 120px rgba(0, 100, 255, 0.1);
  content: '';
  pointer-events: none;
}
.onboarding-progress {
  display: flex;
  gap: 6px;
  margin-bottom: 28px;
}
.onboarding-progress i {
  width: 28px;
  height: 3px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.16);
  transition: background-color 0.2s var(--apple-ease);
}
.onboarding-progress i.is-active {
  background: #0064ff;
}
.onboarding-welcome {
  display: flex;
  min-height: 455px;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  overflow: hidden;
}
.onboarding-eyebrow {
  margin: 0 0 8px;
  color: #6fa5ff;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.14em;
}
.onboarding-wordmark {
  margin: 0;
  padding: 0;
  border: 0;
  color: #f7f9ff;
  font-size: clamp(42px, 7vw, 68px);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.04em;
}
.onboarding-wordmark > span:first-child {
  color: rgba(222, 232, 248, 0.64);
  font-weight: 300;
}
.onboarding-wordmark .onboarding-dot {
  color: #0064ff;
  font-weight: 800;
}
.onboarding-lead {
  max-width: 620px;
  margin: 16px 0 4px;
  color: rgba(240, 245, 255, 0.9);
  font-size: clamp(18px, 2.4vw, 23px);
  font-weight: 700;
  line-height: 1.45;
}
.onboarding-service-title {
  max-width: 620px;
  margin: 0;
  padding: 0;
  border: 0;
  color: #f7f9ff;
  font-size: clamp(27px, 4vw, 40px);
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.035em;
}
.onboarding-description {
  max-width: 620px;
  margin: 0 0 28px;
  color: rgba(219, 229, 246, 0.7);
  font-size: 15px;
  line-height: 1.65;
}
.onboarding-points {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.onboarding-point {
  padding: 18px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.055);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}
.onboarding-point-art {
  width: 58px;
  height: 58px;
  object-fit: contain;
}
.onboarding-point h3 {
  margin: 12px 0 5px;
  color: #f5f7fb;
  font-size: 16px;
  font-weight: 700;
}
.onboarding-point p {
  margin: 0;
  color: rgba(219, 229, 246, 0.68);
  font-size: 13px;
  line-height: 1.55;
}
.onboarding-start {
  margin-top: 28px;
  box-shadow: 0 12px 30px rgba(0, 100, 255, 0.28);
}
.onboarding-actions {
  display: flex;
  gap: 8px;
  margin-top: 28px;
}
.onboarding-note {
  margin: 10px 0 0;
  color: rgba(219, 229, 246, 0.48);
  font-size: 12px;
}
.onboarding-step-enter-active,
.onboarding-step-leave-active {
  transition:
    opacity 0.18s var(--apple-ease),
    transform 0.18s var(--apple-ease);
}
.onboarding-step-enter-from {
  opacity: 0;
  transform: translateX(10px);
}
.onboarding-step-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
@media (prefers-reduced-motion: no-preference) {
  .onboarding-welcome .onboarding-eyebrow,
  .onboarding-welcome .onboarding-wordmark,
  .onboarding-welcome .onboarding-lead,
  .onboarding-welcome .onboarding-start {
    opacity: 0;
    transform: translateY(18px);
    animation: onboarding-reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  .onboarding-welcome .onboarding-wordmark { animation-delay: 0.12s; }
  .onboarding-welcome .onboarding-lead { animation-delay: 0.26s; }
  .onboarding-welcome .onboarding-start { animation-delay: 0.42s; }
  .onboarding-content::after {
    animation: onboarding-orbit 9s ease-in-out infinite alternate;
  }
}
@keyframes onboarding-reveal {
  to { opacity: 1; transform: translateY(0); }
}
@keyframes onboarding-orbit {
  to { transform: translate(-32px, 24px) scale(1.06); }
}
@media (max-width: 640px) {
  .onboarding-welcome {
    min-height: 410px;
  }
  .onboarding-points {
    grid-template-columns: 1fr;
  }
  .onboarding-point {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 2px 12px;
    padding: 14px;
  }
  .onboarding-point-art {
    grid-row: 1 / 3;
    width: 48px;
    height: 48px;
  }
  .onboarding-point h3 {
    margin: 0;
  }
  .onboarding-actions {
    flex-wrap: wrap;
  }
}
</style>
