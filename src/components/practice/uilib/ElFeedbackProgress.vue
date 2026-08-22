<script setup>
// 교재 248p 실습 3: 시스템 피드백 & 프로그레스 인터랙션
import { ref, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const downloadProgress = ref(0)
const isDownloading = ref(false)

// 진행 중인 타이머 핸들. 언마운트 정리 때 필요해서 밖에 들고 있는다.
let progressTimer = null

// 1. 되돌릴 수 없는 동작은 MessageBox로 한 번 더 확인받는다.
//    취소하면 Promise가 reject되므로 catch로 받는다 (에러가 아니라 정상 흐름이다).
const confirmDelete = () => {
  ElMessageBox.confirm('서버에서 해당 파일을 영구히 삭제하시겠습니까?', '💧 최종 경고', {
    confirmButtonText: '네, 삭제합니다',
    cancelButtonText: '취소',
    type: 'danger',
  })
    .then(() => {
      ElMessage.success('🗑️ 파일이 안전하게 파쇄되었습니다.')
    })
    .catch(() => {
      ElMessage.info('❌ 삭제 작업이 취소되었습니다.')
    })
}

// 2. 게이지 바 애니메이션. 이미 진행 중이면 두 번 돌지 않게 막는다.
const startDownload = () => {
  if (isDownloading.value) return
  isDownloading.value = true
  downloadProgress.value = 0

  progressTimer = setInterval(() => {
    downloadProgress.value += 20
    if (downloadProgress.value >= 100) {
      clearInterval(progressTimer)
      progressTimer = null
      isDownloading.value = false
      ElMessage.success('💾 대용량 데이터 로드가 완료되었습니다!')
    }
  }, 400)
}

// 3. 진행 중에 화면을 벗어나면 타이머가 남아 계속 돈다. 반드시 걷어낸다.
onUnmounted(() => {
  if (progressTimer) clearInterval(progressTimer)
})
</script>

<template>
  <div class="practice-section">
    <h2>Element Plus 실습 3: 시스템 피드백 &amp; 프로그레스</h2>

    <el-card>
      <template #header>⚙️ 실습 3. 시스템 피드백 &amp; 프로그레스 인터랙션</template>

      <div class="button-row">
        <el-button type="danger" plain @click="confirmDelete">🗑️ 서버 파일 삭제 테스트</el-button>
        <el-button type="primary" :loading="isDownloading" @click="startDownload">
          💾 데이터 동기화 시작
        </el-button>
      </div>

      <el-progress :percentage="downloadProgress" :stroke-width="12" />
    </el-card>
  </div>
</template>

<style scoped>
.button-row {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}
</style>
