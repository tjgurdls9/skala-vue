<script setup>
import { computed, ref } from 'vue'
import { execGrade } from '../../data/weatherMock.js'
import koreaMap from '../../data/koreaMap.json'
import { useConfigStore } from '../../stores/configStore.js'

const configStore = useConfigStore()

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

// 13차: 도시 좌표를 화면 좌표로 바꾸던 project()는 더 이상 없다.
// 지도 위에 도시 점·막대를 찍던 시절의 유물인데, 이제는 시군구 도형 자체가 대상이라
// 좌표 변환이 필요 없다(도형 경로는 생성기가 이미 화면 좌표로 만들어 둔다).
// 12차: viewBox를 손으로 잡던 걸(육지만 x 0~290으로 크롭) 생성기가 계산한 실제 경계로 바꿨다.
// 서해 먼 섬(백령·대청·흑산·홍도)을 걷어내 왼쪽이 83단위 당겨졌고, 동해 쪽은 두 섬을
// 85단위 당겨 붙여서, 육지를 작게 만들지 않고도 울릉도·독도를 담는다.
const V = koreaMap.view
const VIEW_BOX = computed(() => {
  const pad = 8
  return `${V.x - pad} ${V.y - pad} ${V.w + pad * 2} ${V.h + pad * 2}`
})

// 13차-f: 시·도 경계 레이어를 걷어냈다. 지도에 굵은 선(시·도)과 얇은 선(시군구)이
// 같이 있으면 "굵은 선은 뭔가 다른 단위인가?"를 매번 판단하게 된다.
// 데이터·클릭 단위는 시·군 하나뿐이니 선도 하나면 된다.
// 12차: 도형은 251개(자치구까지)지만 데이터·클릭 단위는 '시·군' 162개다.
// 구는 행정 단위일 뿐 기상 관측 단위가 아니라, 서울 25개 구가 각각 다른 지역인 것처럼
// 보이면 오히려 헷갈린다. 그래서 각 도형은 소속 시·군(group)만 들고 있고,
// 관측 지점은 시·군 하나당 하나로 정해져 있다(생성기가 미리 배정).
const munis = koreaMap.munis ?? []
const groupCity = koreaMap.groups ?? {}

// 울릉도는 시군구 데이터에 들어 있어 munis에 그대로 그려진다.
// 독도는 원본 행정구역 데이터에 아예 없어서 좌표(동도·서도)로 직접 찍는다.
const dokdo = koreaMap.dokdo ?? []

// 11차: 색 기준을 execGrade 한 곳으로 모았다(지도·카드·표가 같은 색을 쓴다)
const scoreColor = (score) => execGrade(score).color

// 12차: 지도 상호작용을 갈아엎었다.
// 이전에는 도시마다 위로 솟은 막대를 세우고 그 막대에만 호버가 걸렸다. 관측 지점이 45곳이
// 되면서 막대가 서로 겹쳐 어느 게 어느 지역인지 알기 어려웠고, 무엇보다 "지도인데 지역을
// 누르는 게 아니라 막대를 눌러야 하는" 어색함이 있었다.
// 이제 시군구 도형 자체가 대상이다 — 올리면 파란 테두리로 그 지역이 도드라지고, 누르면
// 해당 지역의 기준 관측 지점 상세로 간다.
const cityById = computed(() => new Map(props.cities.map((c) => [c.id, c])))

const shapes = computed(() =>
  munis.map((muni, i) => {
    const city = cityById.value.get(groupCity[muni.group]) ?? null
    return {
      key: `m${i}`,
      d: muni.d,
      group: muni.group,
      city,
      // 아직 데이터가 안 온 지역은 색 없이 둔다(없는 값을 회색으로 칠하면 '나쁨'으로 오해된다)
      fill: city ? scoreColor(city.execScore) : null,
    }
  }),
)

// 호버는 도형이 아니라 시·군 단위로 잡는다 — 수원시 장안구에 올리면 수원시 전체가 밝아진다.
// 도형 단위로 잡으면 같은 시 안에서 구 경계마다 하이라이트가 끊겨 한 지역으로 안 읽힌다.
const hoveredGroup = ref('')
const hoveredCity = computed(() =>
  hoveredGroup.value ? (cityById.value.get(groupCity[hoveredGroup.value]) ?? null) : null,
)

// 판독부: 마우스를 올린 시·군이 우선, 없으면 대시보드가 고른 지역(spotlight)으로
// 돌아간다. isPreview는 '지금 보이는 게 고정된 선택이 아니라 훑어보는 중'이라는 뜻 —
// 오른쪽 콕핏 패널은 호버로는 안 바뀌므로, 판독부만 다른 지역을 보여줄 때는
// 그게 일시적이라는 걸 밝혀야 한다.
const activePoint = computed(() => {
  if (hoveredCity.value) return { name: hoveredGroup.value, city: hoveredCity.value, isPreview: true }
  const spot = props.cities.find((c) => c.id === props.spotlightId)
  return spot ? { name: spot.name, city: spot, isPreview: false } : null
})

// svg 하나에서 위임 처리. 이벤트가 어느 도형에서 났는지는 data-group으로 읽는다.
const groupOf = (event) => event.target?.dataset?.group ?? ''

const onAreaOver = (event) => {
  hoveredGroup.value = groupOf(event)
}

const onAreaClick = (event) => {
  const city = cityById.value.get(groupCity[groupOf(event)])
  if (city) emit('select-city', city)
}
</script>

<template>
  <div class="map-wrap">
    <!-- 12차: 호버·클릭을 도형 251개에 각각 걸지 않고 svg 하나에서 위임 처리한다.
         리스너가 251개에서 3개로 줄고, mouseenter처럼 버블링하지 않는 이벤트에 기대지 않아
         입력 경로(실제 마우스·터치·자동화 도구)에 상관없이 같은 결과가 나온다. -->
    <div class="map-frame">
    <svg
      class="map-svg"
      :viewBox="VIEW_BOX"
      role="img"
      aria-label="전국 지역별 기상 대응 지수 지도"
      @mouseover="onAreaOver"
      @mouseleave="hoveredGroup = ''"
      @click="onAreaClick"
    >
      <!-- 도형은 251개지만 호버·클릭은 시·군(group) 단위로 묶여 동작한다.
           가장 가까운 관측 지점의 점수 색으로 옅게 칠하고, 올리면 파란 테두리로 도드라진다. -->
      <path
        v-for="shape in shapes"
        :key="shape.key"
        :d="shape.d"
        class="map-area"
        :class="{ 'is-hover': shape.group === hoveredGroup, 'is-empty': !shape.city }"
        :style="shape.fill ? { fill: shape.fill } : null"
        :data-group="shape.group"
      />

      <!-- 울릉도·독도. 13차: 이름표를 뺐다 — 지도에서 이름이 붙은 곳이 이 둘뿐이라
           오히려 그 둘만 특별해 보였다. 형태만 두고 이름은 판독부가 맡는다. -->
      <circle
        v-for="(is, i) in dokdo"
        :key="`d${i}`"
        :cx="is.x"
        :cy="is.y"
        r="1.8"
        class="map-islet"
      />

    </svg>
    </div>

    <!-- 호버한 지역 정보. 지도 위에 툴팁을 띄우면 좁은 화면에서 잘리므로 아래 고정 영역에 쓴다 -->
    <div class="map-readout">
      <template v-if="activePoint">
        <span v-if="activePoint.isPreview" class="map-readout-preview">미리보기</span>
        <span class="map-readout-name">{{ activePoint.name }}</span>
        <span class="map-readout-score" :style="{ color: scoreColor(activePoint.city.execScore) }">
          {{ activePoint.city.execScore }}점
        </span>
        <span class="map-readout-meta">
          {{ configStore.convertTemperature(activePoint.city.temp) }}{{ configStore.unitSymbol }} · 체감
          {{ configStore.convertTemperature(activePoint.city.feelsLike ?? activePoint.city.temp) }}°
          <!-- 시군구는 관측 지점이 아니다. 어느 지점 값을 빌려 쓰는지 밝혀둔다 -->
          <template v-if="activePoint.name !== activePoint.city.name">
            · {{ activePoint.city.name }} 관측
          </template>
        </span>
      </template>
      <span v-else class="map-readout-hint">지역을 선택하면 상세가 표시됩니다</span>
    </div>

    <ul class="map-legend">
      <li><i style="background: #14563a"></i>우수</li>
      <li><i style="background: #0a53c0"></i>양호</li>
      <li><i style="background: #8a4e00"></i>주의</li>
      <li><i style="background: #ad251c"></i>미흡</li>
    </ul>
  </div>
</template>

<style scoped>
.map-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
}
/* 지도가 놓이는 면. 살짝 파인 듯한 안쪽 그림자로 '지도판'을 만든다 */
.map-frame {
  width: 100%;
  padding: 14px 10px;
  border-radius: var(--radius-card);
  background: rgba(255, 255, 255, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: inset 0 1px 3px rgba(24, 40, 80, 0.08);
}
/* 13차-g: 지도가 허공에 뜬 것처럼 보였다 — 육지 외곽에 아무 경계도 없어서
   '지도'가 아니라 '떠 있는 얼룩'으로 읽혔다. 두 가지로 붙잡는다:
   (1) 지도를 담는 면(.map-frame)을 만들어 지도가 놓인 자리를 명시하고
   (2) 육지 덩어리에 그림자를 줘서 면 위에 놓인 것으로 보이게 한다. */
.map-svg {
  width: 100%;
  height: auto;
  overflow: visible;
  /* drop-shadow는 도형의 알파 실루엣을 따라간다 — 시군구 251개의 합집합,
     즉 국토 외곽선을 따로 계산하지 않고도 바깥 테두리에만 그림자가 생긴다. */
  filter: drop-shadow(0 1px 1px rgba(24, 40, 80, 0.28))
    drop-shadow(0 6px 14px rgba(24, 40, 80, 0.16));
  /* 12차: 지도를 고정 높이로 자르면 큰 화면에서는 작고 작은 화면에서는 사이드바가 넘친다.
     우리나라는 세로로 긴 형태라 폭을 늘려도 높이만 커질 뿐이라, 결국 세로 여유가 상한이다.
     그래서 화면 높이에서 사이드바의 나머지 요소(검색 카드·제목·판독부·범례·여백 ≈ 480px)를
     뺀 만큼을 지도에 준다 — 화면이 크면 지도도 같이 커지고, 작아도 사이드바가 안 넘친다.
     max()의 300px는 아주 짧은 화면용 바닥값이다(그 구간은 sticky도 자동으로 꺼진다). */
  /* 13차: 지도가 사이드바를 벗어나 화면 가운데로 왔다. 이제는 사이드바 높이가 아니라
     '한 화면에 지도가 다 들어오는가'가 기준이다 — 헤더·내비·카드 머리를 뺀 만큼을 준다. */
  max-height: max(360px, calc(100vh - 260px));
}

/* 시군구 251개 = 지도의 클릭 단위.
   면은 아주 옅게만 칠한다(0.22) — 관측 지점이 45곳이라 시군구 색은 '가장 가까운 지점의
   값을 빌려 온 것'이지 그 시군구의 관측값이 아니다. 진하게 칠하면 251개 실측치가 있는
   것처럼 보인다. 색은 경향만 주고, 정확한 값은 판독부(아래 map-readout)가 말한다. */
.map-area {
  fill: rgba(28, 32, 56, 0.14);
  fill-opacity: 0.22;
  /* 13차-f: 이제 지도의 유일한 경계선이다. 시·도 선을 지운 만큼 조금 또렷하게. */
  stroke: rgba(28, 32, 56, 0.28);
  stroke-width: 0.5;
  vector-effect: non-scaling-stroke;
  cursor: pointer;
  transition:
    fill-opacity 0.18s var(--apple-ease),
    stroke 0.18s var(--apple-ease);
}
/* 호버: 파란 테두리로 그 지역만 도드라진다. paint-order로 선이 이웃 도형에 안 먹힌다. */
.map-area.is-hover {
  fill-opacity: 0.55;
  stroke: var(--color-accent);
  stroke-width: 1.6;
  paint-order: stroke;
}
/* 아직 데이터가 안 온 지역. 색 없이 두고 클릭도 받지 않는다 */
.map-area.is-empty {
  fill: rgba(28, 32, 56, 0.08);
  cursor: default;
}

/* --- 울릉도·독도 --- */
/* 섬 표시와 이름표도 지도 위에 얹히는 장식이라 포인터를 가로채면 안 된다 */
.map-islet {
  fill: rgba(28, 32, 56, 0.6);
  pointer-events: none;
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
  background-color: var(--glass-inset-bg);
  border: 1px solid var(--glass-inset-border);
  box-shadow: var(--glass-inset-shadow);
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
  color: #48515f;
}
/* 호버 중에만 보인다 — '지금 이건 스쳐 지나가는 미리보기지, 오른쪽 패널의 선택은
   그대로다'라는 신호. 색은 강조색을 눌러 쓴다(경고가 아니라 상태 안내라서). */
.map-readout-preview {
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(11, 107, 220, 0.12);
  font-size: 11px;
  font-weight: 700;
  color: var(--color-accent);
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
