<script setup>
import { computed, ref } from 'vue'
import { EXEC_MAX_SCORE, execGrade } from '../../data/weatherMock.js'
import koreaMap from '../../data/koreaMap.json'

// 10차: 손으로 찍은 간이 실루엣을 실제 행정구역 경계로 교체했다.
// 원본은 southkorea-maps(통계청 2013) GeoJSON이고, 빌드 때가 아니라 미리 한 번만
// Ramer–Douglas–Peucker로 단순화해서 17개 시도 path만 19KB JSON으로 커밋해 뒀다
// (런타임에 GeoJSON을 파싱하거나 지도 라이브러리를 붙이지 않으므로 의존성은 여전히 0이다).
const props = defineProps({
  cities: {
    type: Array,
    required: true,
  },
  spotlightId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['select-city'])

// koreaMap.json을 만들 때 쓴 것과 똑같은 투영 파라미터. 하나라도 어긋나면 도시 점이
// 실제 위치에서 밀린다 — 그래서 값을 파일에 같이 저장해두고 여기서 그대로 읽는다.
// w는 bounds 전체 폭이라 실제로는 쓰지 않는다(아래 VIEW_BOX에서 육지 범위만 잘라 쓴다)
const { h: VIEW_H, bounds: B } = koreaMap
const LAT_MID = (B.minLat + B.maxLat) / 2
const LON_SCALE = Math.cos((LAT_MID * Math.PI) / 180)
const LAT_SPAN = B.maxLat - B.minLat

const project = (lat, lon) => ({
  x: ((lon - B.minLon) * LON_SCALE * VIEW_H) / LAT_SPAN,
  y: ((B.maxLat - lat) * VIEW_H) / LAT_SPAN,
})

// 실제 육지가 차지하는 범위만 잘라 쓴다. bounds는 울릉도까지 담으려고 넉넉히 잡아둬서
// 그대로 쓰면 오른쪽에 빈 바다가 크게 남는다.
const VIEW_BOX = computed(() => {
  const pad = 10
  return `${-pad} ${-pad} ${290 + pad * 2} ${VIEW_H + pad * 2}`
})

const regions = koreaMap.regions

// 11차: 색 기준을 execGrade 한 곳으로 모았다(지도·카드·표가 같은 색을 쓴다)
const scoreColor = (score) => execGrade(score).color

const points = computed(() =>
  props.cities
    .filter((city) => typeof city.lat === 'number' && typeof city.lon === 'number')
    .map((city) => {
      const { x, y } = project(city.lat, city.lon)
      const ratio = Math.max(city.execScore / EXEC_MAX_SCORE, 0.06)
      return {
        id: city.id,
        name: city.name,
        city,
        x,
        y,
        // 막대 높이로 점수를 읽는다. 최소 높이를 둬서 0점이어도 위치는 보인다.
        barHeight: ratio * 74,
        color: scoreColor(city.execScore),
      }
    }),
)

const hoveredId = ref('')
const activeId = computed(() => hoveredId.value || props.spotlightId)
const activePoint = computed(() => points.value.find((p) => p.id === activeId.value) ?? null)
</script>

<template>
  <div class="map-wrap">
    <svg class="map-svg" :viewBox="VIEW_BOX" role="img" aria-label="전국 지역별 기상 영향 점수 지도">
      <!-- 시도 경계. 유리 카드 위라 면은 옅게, 경계선으로 형태를 읽게 한다 -->
      <path v-for="region in regions" :key="region.name" :d="region.d" class="map-region" />

      <g
        v-for="point in points"
        :key="point.id"
        class="map-point"
        :class="{ 'is-active': point.id === activeId }"
        @mouseenter="hoveredId = point.id"
        @mouseleave="hoveredId = ''"
        @click="emit('select-city', point.city)"
      >
        <!-- 점수만큼 솟은 막대 + 뿌리의 점. 막대 길이와 색 두 가지로 같은 값을 알려준다 -->
        <line
          :x1="point.x"
          :y1="point.y"
          :x2="point.x"
          :y2="point.y - point.barHeight"
          :stroke="point.color"
          class="map-bar"
        />
        <circle :cx="point.x" :cy="point.y" r="2.4" :fill="point.color" class="map-dot" />
        <circle
          :cx="point.x"
          :cy="point.y - point.barHeight"
          r="3.2"
          :fill="point.color"
          class="map-cap"
        />
        <!-- 클릭/호버 판정을 넉넉하게 잡아주는 투명 영역 -->
        <rect
          :x="point.x - 9"
          :y="point.y - point.barHeight - 9"
          width="18"
          :height="point.barHeight + 18"
          fill="transparent"
        />
      </g>
    </svg>

    <!-- 호버한 지역 정보. 지도 위에 툴팁을 띄우면 좁은 화면에서 잘리므로 아래 고정 영역에 쓴다 -->
    <div class="map-readout">
      <template v-if="activePoint">
        <span class="map-readout-name">{{ activePoint.name }}</span>
        <span class="map-readout-score" :style="{ color: activePoint.color }">
          {{ activePoint.city.execScore }}점
        </span>
        <span class="map-readout-meta">
          {{ activePoint.city.temp }}°C · {{ activePoint.city.budget }}만원 ({{
            activePoint.city.share
          }}%)
        </span>
      </template>
      <span v-else class="map-readout-hint">지도의 지역에 마우스를 올려 보세요</span>
    </div>

    <ul class="map-legend">
      <li><i style="background: #248a5e"></i>우수</li>
      <li><i style="background: #0a5fd8"></i>양호</li>
      <li><i style="background: #a85f00"></i>주의</li>
      <li><i style="background: #c62d22"></i>미흡</li>
    </ul>
  </div>
</template>

<style scoped>
.map-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.map-svg {
  width: 100%;
  height: auto;
  overflow: visible;
}

.map-region {
  fill: rgba(255, 255, 255, 0.55);
  stroke: rgba(28, 32, 56, 0.42);
  stroke-width: 0.7;
  stroke-linejoin: round;
  transition: fill 0.2s var(--apple-ease);
}

.map-point {
  cursor: pointer;
}
.map-bar {
  stroke-width: 3;
  stroke-linecap: round;
  opacity: 0.88;
  transition:
    stroke-width 0.2s var(--apple-ease),
    opacity 0.2s var(--apple-ease);
}
.map-point:hover .map-bar,
.map-point.is-active .map-bar {
  stroke-width: 5;
  opacity: 1;
}
.map-point:hover .map-cap,
.map-point.is-active .map-cap {
  r: 4.8;
}

.map-readout {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
  padding: 8px 12px;
  width: 100%;
  min-height: 38px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid var(--glass-border);
}
.map-readout-name {
  font-size: 14px;
  font-weight: 700;
  color: #1c1c1e;
}
.map-readout-score {
  font-size: 14px;
  font-weight: 700;
}
.map-readout-meta {
  font-size: 12px;
  color: #48484f;
}
.map-readout-hint {
  font-size: 12px;
  color: #6e6e73;
}

.map-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
}
.map-legend li {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #48484f;
}
.map-legend i {
  width: 8px;
  height: 8px;
  border-radius: 3px;
}
</style>
